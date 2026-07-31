import { NextResponse } from 'next/server';
import { getAuditHistory } from '@/lib/audit-history';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit(request, { limit: 30, windowMs: 60000, prefix: 'rl:trend' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');
  const days = parseInt(url.searchParams.get('days') || '30', 10);

  if (!domain) {
    return NextResponse.json({ error: 'domain query parameter is required' }, { status: 400 });
  }

  const history = await getAuditHistory(domain, Math.min(days, 90));

  // Build chart data: labels + dataset
  const chartData = history
    .reverse() // Oldest first for chart
    .map((entry) => ({
      date: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: entry.timestamp,
      score: entry.overallScore,
      subScores: entry.subScores
    }));

  // Compute trend stats
  const scores = history.map((h) => h.overallScore);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const latest = scores.length > 0 ? scores[scores.length - 1] : 0;
  const oldest = scores.length > 0 ? scores[0] : 0;
  const overallTrend = latest - oldest;

  return NextResponse.json({
    domain,
    chartData,
    stats: {
      dataPoints: scores.length,
      average: avg,
      min,
      max,
      latest,
      overallTrend,
      trendDirection: overallTrend > 0 ? 'up' : overallTrend < 0 ? 'down' : 'stable'
    }
  });
}
