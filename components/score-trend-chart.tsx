"use client";

import { useState, useEffect } from "react";

interface TrendDataPoint {
  date: string;
  score: number;
}

interface TrendStats {
  dataPoints: number;
  average: number;
  min: number;
  max: number;
  latest: number;
  overallTrend: number;
  trendDirection: "up" | "down" | "stable";
}

interface ScoreDiff {
  domain: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  direction: "improved" | "declined" | "unchanged";
  subScoreDiffs: { name: string; previous: number; current: number; delta: number }[];
}

export default function ScoreTrendChart({ domain }: { domain: string }) {
  const [chartData, setChartData] = useState<TrendDataPoint[]>([]);
  const [stats, setStats] = useState<TrendStats | null>(null);
  const [diff, setDiff] = useState<ScoreDiff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendRes, historyRes] = await Promise.all([
          fetch(`/api/audit/trend?domain=${encodeURIComponent(domain)}&days=30`),
          fetch(`/api/audit/history?domain=${encodeURIComponent(domain)}`)
        ]);

        if (trendRes.ok) {
          const trend = await trendRes.json();
          setChartData(trend.chartData || []);
          setStats(trend.stats || null);
        }

        if (historyRes.ok) {
          const history = await historyRes.json();
          setDiff(history.diff || null);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [domain]);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow mb-10">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3"></div>
          <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow mb-10">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Score Trend Over Time
        </h3>
        <p className="text-xs text-neutral-500">
          No historical data yet. Re-audit runs automatically to track your AI visibility score over time.
        </p>
      </div>
    );
  }

  const maxScore = 100;
  const chartHeight = 140;
  const barWidth = Math.max(16, Math.min(40, 600 / chartData.length));

  return (
    <div className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400">
          Score Trend Over Time
        </h3>
        {stats && (
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-neutral-500">
              Avg: <strong className="text-neutral-900 dark:text-white">{stats.average}</strong>
            </span>
            <span className="text-neutral-500">
              Range: <strong className="text-neutral-900 dark:text-white">{stats.min}–{stats.max}</strong>
            </span>
            <span className={`font-bold ${stats.trendDirection === 'up' ? 'text-emerald-500' : stats.trendDirection === 'down' ? 'text-rose-500' : 'text-neutral-500'}`}>
              {stats.trendDirection === 'up' ? '↑' : stats.trendDirection === 'down' ? '↓' : '→'} {Math.abs(stats.overallTrend)}pts
            </span>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ height: chartHeight + 30 }}>
        {chartData.map((point, idx) => {
          const height = (point.score / maxScore) * chartHeight;
          const isLatest = idx === chartData.length - 1;
          return (
            <div key={idx} className="flex flex-col items-center gap-1 shrink-0" style={{ width: barWidth }}>
              <span className="font-mono text-[9px] font-bold text-neutral-600 dark:text-neutral-400">
                {point.score}
              </span>
              <div
                className={`w-full rounded-t-md transition-all ${
                  isLatest
                    ? 'bg-cyan-500 dark:bg-cyan-400'
                    : point.score >= 80
                    ? 'bg-emerald-400/60 dark:bg-emerald-500/40'
                    : point.score >= 60
                    ? 'bg-amber-400/60 dark:bg-amber-500/40'
                    : 'bg-rose-400/60 dark:bg-rose-500/40'
                }`}
                style={{ height: Math.max(4, height) }}
              />
              <span className="font-mono text-[8px] text-neutral-400 text-center leading-tight">
                {point.date}
              </span>
            </div>
          );
        })}
      </div>

      {/* Diff Summary */}
      {diff && diff.direction !== 'unchanged' && diff.previousScore > 0 && (
        <div className={`mt-4 p-3 rounded-lg border font-mono text-xs ${
          diff.direction === 'improved'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold">
              {diff.direction === 'improved' ? '↑' : '↓'} Score {diff.direction === 'improved' ? 'Improved' : 'Declined'}: {diff.previousScore} → {diff.currentScore} ({diff.delta > 0 ? '+' : ''}{diff.delta}pts)
            </span>
          </div>
          {diff.subScoreDiffs.filter((s) => s.delta !== 0).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {diff.subScoreDiffs.filter((s) => s.delta !== 0).map((s) => (
                <span key={s.name} className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  s.delta > 0 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                }`}>
                  {s.name}: {s.delta > 0 ? '+' : ''}{s.delta}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
