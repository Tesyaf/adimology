import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketDetector, fetchOrderbook, getTopBroker, parseLot } from '@/lib/stockbit';
import { calculateTargets } from '@/lib/calculations';
import { INDICES } from '@/lib/indices';
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

    const gainRealistis = harga > 0
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

async function batchAnalyze(
    symbols: Array<{ symbol: string; flag?: any; sector?: string; last_price?: number }>,
    fromDate: string,
    toDate: string
): Promise<RankingItem[]> {
    const BATCH_SIZE = 5;
    const results: RankingItem[] = [];

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
            batch.map(item => analyzeEmiten(item.symbol, fromDate, toDate, item.flag, item.sector))
        );

        for (let j = 0; j < batchResults.length; j++) {
            const res = batchResults[j];
            const item = batch[j];
            if (res.status === 'fulfilled') {
                results.push(res.value);
            } else {
                results.push({
                    emiten: item.symbol.toUpperCase(),
                    harga: item.last_price || 0,
                    avgBandar: 0,
                    targetRealistis: 0,
                    targetMax: 0,
                    topPersenRealistis: -999,
                    topPersenMax: -999,
                    gainRealistis: 0,
                    sector: item.sector,
                    flag: item.flag,
                    error: (res.reason as any)?.message || 'Failed to fetch data',
                });
            }
        }
    }

    return results;
}

function sortResults(results: RankingItem[]): RankingItem[] {
    return results.sort((a, b) => {
        const aErr = a.topPersenRealistis === -999;
        const bErr = b.topPersenRealistis === -999;
        if (aErr && bErr) return 0;
        if (aErr) return 1;
        if (bErr) return -1;
        return a.topPersenRealistis - b.topPersenRealistis;
    });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'watchlist'; // 'watchlist' | 'lq45' | 'idx30' | 'idx80'
        const groupId = searchParams.get('groupId');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        if (!fromDate || !toDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required params: fromDate, toDate' },
                { status: 400 }
            );
        }

        let symbols: Array<{ symbol: string; flag?: any; sector?: string; last_price?: number }> = [];

        if (mode === 'watchlist') {
            // Fetch from watchlist
            if (!groupId) {
                return NextResponse.json(
                    { success: false, error: 'groupId is required for watchlist mode' },
                    { status: 400 }
                );
            }
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
            symbols = items.map((item: any) => ({
                symbol: item.symbol || item.company_code,
                flag: item.flag,
                sector: item.sector,
                last_price: item.last_price,
            }));
        } else {
            // Use static index list
            const index = INDICES[mode];
            if (!index) {
                return NextResponse.json(
                    { success: false, error: `Unknown mode: ${mode}. Use watchlist, lq45, idx30, or idx80.` },
                    { status: 400 }
                );
            }
            symbols = index.stocks.map(s => ({ symbol: s }));
        }

        if (symbols.length === 0) {
            return NextResponse.json({ success: true, data: [], total: 0 });
        }

        const results = await batchAnalyze(symbols, fromDate, toDate);
        const sorted = sortResults(results);

        return NextResponse.json({
            success: true,
            data: sorted,
            total: sorted.length,
            mode,
        });
    } catch (error) {
        console.error('Ranking API Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
