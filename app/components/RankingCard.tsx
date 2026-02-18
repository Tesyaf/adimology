'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RankingItem, WatchlistGroup } from '@/lib/types';
import { getDefaultDate } from '@/lib/utils';
import { CheckCircle2, XCircle, MinusCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function RankingCard() {
    const router = useRouter();
    const [mode, setMode] = useState<'watchlist' | 'lq45' | 'idx30' | 'idx80'>('watchlist');
    const [groups, setGroups] = useState<WatchlistGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [fromDate, setFromDate] = useState(getDefaultDate());
    const [toDate, setToDate] = useState(getDefaultDate());
    const [loading, setLoading] = useState(false);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [results, setResults] = useState<RankingItem[]>([]);
    const [scanned, setScanned] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

    // Fetch watchlist groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await fetch('/api/watchlist/groups');
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    setGroups(json.data);
                    const defaultG = json.data.find((g: WatchlistGroup) => g.is_default) || json.data[0];
                    setSelectedGroupId(defaultG?.watchlist_id || null);
                }
            } catch (err) {
                console.error('Failed to fetch groups:', err);
            } finally {
                setGroupsLoading(false);
            }
        };
        fetchGroups();
    }, []);

    const handleScan = async () => {
        if (mode === 'watchlist' && !selectedGroupId) return;
        setLoading(true);
        setError(null);
        setResults([]);
        setScanned(false);
        setProgress(null);

        try {
            let url = `/api/ranking?mode=${mode}&fromDate=${fromDate}&toDate=${toDate}`;
            if (mode === 'watchlist' && selectedGroupId) {
                url += `&groupId=${selectedGroupId}`;
            }
            const res = await fetch(url);
            const json = await res.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to scan');
            }

            setResults(json.data || []);
            setScanned(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
            setProgress(null);
        }
    };

    const handleSelectEmiten = (emiten: string) => {
        // Navigate to home and pass emiten via query param
        router.push(`/?emiten=${emiten}`);
    };

    const getTopPersenColor = (pct: number, hasError?: boolean) => {
        if (hasError) return 'var(--text-muted)';
        if (pct >= 80) return '#ef4444';   // red - sudah dekat/lewat target
        if (pct >= 50) return '#f59e0b';   // yellow - menengah
        if (pct >= 0) return '#22c55e';   // green - masih jauh
        return '#3b82f6';                  // blue - di bawah avg bandar
    };

    const getTopPersenBg = (pct: number, hasError?: boolean) => {
        if (hasError) return 'rgba(255,255,255,0.05)';
        if (pct >= 80) return 'rgba(239, 68, 68, 0.1)';
        if (pct >= 50) return 'rgba(245, 158, 11, 0.1)';
        if (pct >= 0) return 'rgba(34, 197, 94, 0.1)';
        return 'rgba(59, 130, 246, 0.1)';
    };

    const formatTopPersen = (pct: number, hasError?: boolean) => {
        if (hasError) return '-';
        return `${pct > 0 ? '+' : ''}${pct}%`;
    };

    const validResults = results.filter(r => !r.error);
    const errorResults = results.filter(r => r.error);

    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--glass-inner-glow)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '32px', height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(124, 58, 237, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <TrendingUp size={16} color="var(--accent-primary)" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Ranking Top%</h2>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Urutkan saham watchlist berdasarkan kedekatan ke target realistis
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    {/* Mode Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Sumber Data
                        </label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {(['watchlist', 'lq45', 'idx30', 'idx80'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => { setMode(m); setScanned(false); setResults([]); }}
                                    style={{
                                        padding: '0.35rem 0.75rem',
                                        fontSize: '0.75rem',
                                        fontWeight: mode === m ? 700 : 400,
                                        background: mode === m ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: mode === m ? 'white' : 'var(--text-secondary)',
                                        border: '1px solid',
                                        borderColor: mode === m ? 'var(--accent-primary)' : 'var(--border-color)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {m === 'watchlist' ? 'Watchlist' : m.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Group Selector — hanya tampil jika mode watchlist */}
                    {mode === 'watchlist' && !groupsLoading && groups.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Watchlist Group
                            </label>
                            <select
                                value={selectedGroupId || ''}
                                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                                style={{
                                    padding: '0.45rem 0.75rem',
                                    fontSize: '0.8rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    minWidth: '160px',
                                }}
                            >
                                {groups.map(g => (
                                    <option key={g.watchlist_id} value={g.watchlist_id}>
                                        {g.emoji ? `${g.emoji} ` : ''}{g.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date Range */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Date Range
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                onClick={(e) => e.currentTarget.showPicker()}
                                style={{
                                    padding: '0.45rem 0.5rem',
                                    fontSize: '0.75rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    width: '120px',
                                }}
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                onClick={(e) => e.currentTarget.showPicker()}
                                style={{
                                    padding: '0.45rem 0.5rem',
                                    fontSize: '0.75rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    width: '120px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Scan Button */}
                    <button
                        onClick={handleScan}
                        disabled={loading || (mode === 'watchlist' && !selectedGroupId)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            background: loading ? 'rgba(124, 58, 237, 0.4)' : 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: loading ? 'none' : '0 4px 12px rgba(124, 58, 237, 0.3)',
                            transition: 'all 0.2s',
                            alignSelf: 'flex-end',
                        }}
                    >
                        {loading ? (
                            <>
                                <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <TrendingUp size={14} />
                                Scan Watchlist
                            </>
                        )}
                    </button>
                </div>

                {/* Progress */}
                {loading && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ⏳ Mengambil data dari Stockbit untuk semua saham... Harap tunggu.
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    margin: '1rem 1.5rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Results Table */}
            {scanned && validResults.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--glass-inner-glow)' }}>
                                {['#', 'Emiten', 'Harga', 'Avg Bandar', 'Target Realistis', 'Top%', 'Gain%'].map(h => (
                                    <th key={h} style={{
                                        padding: '0.75rem 1rem',
                                        textAlign: h === '#' || h === 'Top%' || h === 'Gain%' ? 'center' : 'left',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {validResults.map((item, idx) => {
                                const color = getTopPersenColor(item.topPersenRealistis);
                                const bg = getTopPersenBg(item.topPersenRealistis);
                                const clampedPct = Math.min(Math.max(item.topPersenRealistis, 0), 100);

                                return (
                                    <tr
                                        key={item.emiten}
                                        onClick={() => handleSelectEmiten(item.emiten)}
                                        style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-inner-glow)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {/* Rank */}
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem' }}>
                                            {idx + 1}
                                        </td>

                                        {/* Emiten */}
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.emiten}</span>
                                                {item.flag === 'OK' && <CheckCircle2 size={12} color="#3b82f6" />}
                                                {item.flag === 'NG' && <XCircle size={12} color="#f97316" />}
                                                {item.flag === 'Neutral' && <MinusCircle size={12} color="var(--text-secondary)" />}
                                            </div>
                                            {item.sector && (
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {item.sector}
                                                </div>
                                            )}
                                        </td>

                                        {/* Harga */}
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                            {item.harga?.toLocaleString() ?? '-'}
                                        </td>

                                        {/* Avg Bandar */}
                                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                                            {item.avgBandar?.toLocaleString() ?? '-'}
                                        </td>

                                        {/* Target Realistis */}
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                fontWeight: 600,
                                                color: '#22c55e',
                                                background: 'rgba(34, 197, 94, 0.1)',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                            }}>
                                                {item.targetRealistis?.toLocaleString() ?? '-'}
                                            </span>
                                        </td>

                                        {/* Top% with progress bar */}
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
                                                <span style={{
                                                    fontWeight: 700,
                                                    fontSize: '0.9rem',
                                                    color,
                                                    background: bg,
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                }}>
                                                    {formatTopPersen(item.topPersenRealistis)}
                                                </span>
                                                {/* Progress bar */}
                                                <div style={{
                                                    width: '72px',
                                                    height: '4px',
                                                    background: 'var(--border-color)',
                                                    borderRadius: '2px',
                                                    overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        width: `${clampedPct}%`,
                                                        height: '100%',
                                                        background: color,
                                                        borderRadius: '2px',
                                                        transition: 'width 0.3s ease',
                                                    }} />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Gain% */}
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                            <span style={{
                                                fontWeight: 600,
                                                color: item.gainRealistis >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)',
                                                fontSize: '0.85rem',
                                            }}>
                                                {item.gainRealistis >= 0 ? '+' : ''}{item.gainRealistis}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Failed items */}
            {scanned && errorResults.length > 0 && (
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        ⚠️ {errorResults.length} saham gagal diambil datanya (market tutup / tidak aktif):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {errorResults.map(item => (
                            <span key={item.emiten} style={{
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '6px',
                                color: 'var(--text-secondary)',
                            }}>
                                {item.emiten}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {scanned && results.length === 0 && !error && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <TrendingDown size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '0.9rem' }}>Tidak ada data. Coba pilih group watchlist lain.</div>
                </div>
            )}

            {/* Initial state */}
            {!scanned && !loading && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <TrendingUp size={32} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>Pilih watchlist group dan klik <strong>Scan Watchlist</strong></div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                        Semua saham akan dianalisis dan diurutkan berdasarkan Top% target realistis
                    </div>
                </div>
            )}

            {/* Summary footer */}
            {scanned && validResults.length > 0 && (
                <div style={{
                    padding: '0.75rem 1.5rem',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--glass-inner-glow)',
                    display: 'flex',
                    gap: '1.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                }}>
                    <span>✅ {validResults.length} saham berhasil</span>
                    {errorResults.length > 0 && <span>❌ {errorResults.length} gagal</span>}
                    <span style={{ marginLeft: 'auto' }}>Klik baris untuk analyze saham</span>
                </div>
            )}
        </div>
    );
}
