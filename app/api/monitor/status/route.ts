import { NextResponse } from 'next/server';
import { getMonitoringStatus } from '@/lib/monitoring';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit(request, { limit: 30, windowMs: 60000, prefix: 'rl:monitor-status' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'domain query parameter is required' }, { status: 400 });
  }

  const status = getMonitoringStatus(domain);

  if (!status) {
    return NextResponse.json({
      domain,
      overallStatus: 'unknown',
      message: 'No monitoring data yet. Run a check first via POST /api/monitor/check'
    });
  }

  return NextResponse.json(status);
}
