import { NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit: 5 checkout requests per minute per IP
  const rateLimit = await checkRateLimit(request, { limit: 5, windowMs: 60000, prefix: 'rl:paypal' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json();
    const { plan, billingPeriod, userEmail, orgId } = body;

    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan is required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || undefined;

    const order = await createPayPalOrder({
      plan,
      billingPeriod: billingPeriod || 'annual',
      userEmail: userEmail || 'founder@veesibi.com',
      orgId,
      origin
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      approvalUrl: order.approvalUrl
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initiate PayPal checkout order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
