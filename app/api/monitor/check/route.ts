import { NextResponse } from 'next/server';
import { runMonitoringCheck } from '@/lib/monitoring';
import { sendScoreDropAlert } from '@/lib/email-alerts';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(request, { limit: 10, windowMs: 60000, prefix: 'rl:monitor' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  const body = await request.json().catch(() => ({}));
  const domain = body.domain;

  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  }

  const result = await runMonitoringCheck(domain);

  // Send alerts for critical/high drift events
  const criticalEvents = result.driftEvents.filter((e) => e.severity === 'critical' || e.severity === 'high');
  if (criticalEvents.length > 0) {
    const alertBody = criticalEvents.map((e) => `[${e.severity.toUpperCase()}] ${e.message}`).join('\n');
    console.log(`\n🔍 MONITORING ALERT — ${result.domain}\n${alertBody}\n`);
  }

  return NextResponse.json({
    success: true,
    domain: result.domain,
    status: result.status,
    driftEvents: result.driftEvents,
    snapshots: result.snapshots,
    ttfbMs: result.ttfbMs,
    botPermissions: result.botPermissions,
    checkedAt: result.checkedAt
  });
}

export async function GET() {
  return NextResponse.json({
    service: 'VEESIBI Technical Monitoring',
    usage: 'POST { "domain": "example.com" } to run a monitoring check'
  });
}
