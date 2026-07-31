import { NextResponse } from 'next/server';
import { getAuditHistory, getLatestTwoAudits, computeAuditDiff } from '@/lib/audit-history';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit(request, { limit: 30, windowMs: 60000, prefix: 'rl:history' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');
  const limit = parseInt(url.searchParams.get('limit') || '30', 10);

  if (!domain) {
    return NextResponse.json({ error: 'domain query parameter is required' }, { status: 400 });
  }

  const history = await getAuditHistory(domain, Math.min(limit, 90));
  const { previous, current } = await getLatestTwoAudits(domain);
  const diff = computeAuditDiff(previous, current);

  return NextResponse.json({
    domain,
    history,
    diff,
    totalReports: history.length
  });
}
