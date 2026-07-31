import { NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit: 5 capture requests per minute per IP
  const rateLimit = await checkRateLimit(request, { limit: 5, windowMs: 60000, prefix: 'rl:capture' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json();
    const { orderId, plan, orgId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const result = await capturePayPalOrder(orderId, plan || 'pro', orgId);

    return NextResponse.json({
      success: result.success,
      activatedPlan: plan || 'pro',
      details: result.details
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to capture PayPal order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
