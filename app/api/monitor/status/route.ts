import { NextResponse } from 'next/server';
import { getMonitoringStatus } from '@/lib/monitoring';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getSupabaseServerClient } from '@/lib/supabase/server';

async function requireAuth(request: Request): Promise<{ userId: string; email: string } | null> {
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

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit(request, { limit: 30, windowMs: 60000, prefix: 'rl:monitor-status' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  // Require authentication
  const user = await requireAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in to view monitoring data.' },
      { status: 401 }
    );
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
