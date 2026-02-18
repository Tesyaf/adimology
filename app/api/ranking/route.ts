import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketDetector, fetchOrderbook, getTopBroker, parseLot, fetchEmitenInfo } from '@/lib/stockbit';
import { calculateTargets } from '@/lib/calculations';
import type { RankingItem } from '@/lib/types';

// Fetch and calculate Top% for a single emiten
async function analyzeEmiten(
    emiten: string,
    fromDate: string,
    toDate: string,
    flag?: 'OK' | 'NG' | 'Neutral' | null,
    sector?: string
): Promise<RankingItem> {
    const [marketDetectorData, orderbookData] = await Promise.all([
        fetchMarketDetector(emiten, fromDate, toDate),
        fetchOrderbook(emiten),
    ]);

    const brokerData = getTopBroker(marketDetectorData);
    if (!brokerData) {
        throw new Error('No broker data available');
    }

    const obData = orderbookData.data || (orderbookData as any);
    const harga = Number(obData.close);
    const offerPrices = (obData.offer || []).map((o: { price: string }) => Number(o.price));
    const bidPrices = (obData.bid || []).map((b: { price: string }) => Number(b.price));
    const offerTeratas = offerPrices.length > 0 ? Math.max(...offerPrices) : Number(obData.high || 0);
    const bidTerbawah = bidPrices.length > 0 ? Math.min(...bidPrices) : 0;
    const totalBid = parseLot(obData.total_bid_offer?.bid?.lot);
    const totalOffer = parseLot(obData.total_bid_offer?.offer?.lot);

    const calculated = calculateTargets(
        brokerData.rataRataBandar,
        brokerData.barangBandar,
        offerTeratas,
        bidTerbawah,
        totalBid / 100,
        totalOffer / 100,
        harga
    );

    const gainRealistis = brokerData.rataRataBandar > 0
        ? parseFloat((((calculated.targetRealistis1 - harga) / harga) * 100).toFixed(1))
        : 0;

    return {
        emiten: emiten.toUpperCase(),
        harga,
        avgBandar: brokerData.rataRataBandar,
        targetRealistis: calculated.targetRealistis1,
        targetMax: calculated.targetMax,
        topPersenRealistis: calculated.topPersenRealistis,
        topPersenMax: calculated.topPersenMax,
        gainRealistis,
        sector,
        flag,
    };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        if (!groupId || !fromDate || !toDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required params: groupId, fromDate, toDate' },
                { status: 400 }
            );
        }

        // 1. Fetch watchlist items
        const baseUrl = request.nextUrl.origin;
        const watchlistRes = await fetch(`${baseUrl}/api/watchlist?groupId=${groupId}`);
        const watchlistJson = await watchlistRes.json();

        if (!watchlistJson.success) {
            return NextResponse.json(
                { success: false, error: watchlistJson.error || 'Failed to fetch watchlist' },
                { status: 500 }
            );
        }

        const payload = watchlistJson.data;
        const items: any[] = payload?.data?.result || payload?.data || [];

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 2. Batch analyze all stocks — use allSettled so one failure doesn't stop others
        // Process in batches of 5 to avoid rate limiting
        const BATCH_SIZE = 5;
        const results: RankingItem[] = [];

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.allSettled(
                batch.map((item) => {
                    const symbol = item.symbol || item.company_code;
                    return analyzeEmiten(symbol, fromDate, toDate, item.flag, item.sector);
                })
            );

            for (let j = 0; j < batchResults.length; j++) {
                const res = batchResults[j];
                const symbol = (batch[j].symbol || batch[j].company_code || '').toUpperCase();
                if (res.status === 'fulfilled') {
                    results.push(res.value);
                } else {
                    // Include failed items with error info so UI can show them
                    results.push({
                        emiten: symbol,
                        harga: batch[j].last_price || 0,
                        avgBandar: 0,
                        targetRealistis: 0,
                        targetMax: 0,
                        topPersenRealistis: -999, // sentinel for sorting to bottom
                        topPersenMax: -999,
                        gainRealistis: 0,
                        sector: batch[j].sector,
                        flag: batch[j].flag,
                        error: res.reason?.message || 'Failed to fetch data',
                    });
                }
            }
        }

        // 3. Sort by topPersenRealistis ascending (terendah = paling dekat/di bawah avg bandar = peluang terbaik)
        // Items with errors (sentinel -999) go to the bottom
        const sorted = results.sort((a, b) => {
            // Error items always go to the bottom
            const aIsError = a.topPersenRealistis === -999;
            const bIsError = b.topPersenRealistis === -999;
            if (aIsError && bIsError) return 0;
            if (aIsError) return 1;
            if (bIsError) return -1;
            // Sort ascending: mendekati avg bandar (rendah) dulu
            return a.topPersenRealistis - b.topPersenRealistis;
        });

        return NextResponse.json({ success: true, data: sorted });
    } catch (error) {
        console.error('Ranking API Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
