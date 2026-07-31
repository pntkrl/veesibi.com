import { NextResponse } from 'next/server';
import { runMonitoringCheck } from '@/lib/monitoring';
import { sendScoreDropAlert } from '@/lib/email-alerts';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getSupabaseServerClient } from '@/lib/supabase/server';

async function requireAuth(request: Request): Promise<{ userId: string; email: string } | null> {
  // 1. Check Supabase session via Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) return { userId: user.id, email: user.email || '' };
      } catch { /* fall through */ }
    }
  }

  // 2. Check demo session cookie (set by client after login)
  const cookies = request.headers.get('cookie') || '';
  const sessionMatch = cookies.match(/veesibi_auth_user=([^;]+)/);
  if (sessionMatch) {
    try {
      const user = JSON.parse(decodeURIComponent(sessionMatch[1]));
      if (user?.id && user?.email) return { userId: user.id, email: user.email };
    } catch { /* fall through */ }
  }

  return null;
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(request, { limit: 10, windowMs: 60000, prefix: 'rl:monitor' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  // Require authentication
  const user = await requireAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in to use monitoring.' },
      { status: 401 }
    );
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
    usage: 'POST { "domain": "example.com" } to run a monitoring check (requires auth)'
  });
}
