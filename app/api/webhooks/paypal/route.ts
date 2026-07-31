import { NextResponse } from 'next/server';
import { activateOrganizationPlan, getPayPalAccessToken } from '@/lib/paypal';
import { SubPlan } from '@/types/database';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const BASE_URL = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function verifyPayPalWebhookSignature(
  request: Request,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  // If no webhook ID configured, skip verification in sandbox mode
  if (!webhookId) {
    if (PAYPAL_MODE === 'sandbox') return true;
    return false;
  }

  const transmissionId = request.headers.get('paypal-transmission-id');
  const transmissionTime = request.headers.get('paypal-transmission-time');
  const transmissionSig = request.headers.get('paypal-transmission-sig');
  const certUrl = request.headers.get('paypal-cert-url');
  const authAlgo = request.headers.get('paypal-auth-algo');

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl) {
    return false;
  }

  const accessToken = await getPayPalAccessToken();
  if (!accessToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        auth_algo: authAlgo || 'SHA256withRSA',
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody)
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.verification_status === 'SUCCESS';
    }
  } catch {
    // Verification request failed
  }

  return false;
}

export async function POST(request: Request) {
  // Rate limit: 10 webhook calls per minute per IP
  const rateLimit = await checkRateLimit(request, { limit: 10, windowMs: 60000, prefix: 'rl:webhook' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const rawBody = await request.text();

    // Verify PayPal webhook signature authenticity
    const isValid = await verifyPayPalWebhookSignature(request, rawBody);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature. Request rejected.' },
        { status: 401 }
      );
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid PayPal webhook JSON payload' }, { status: 400 });
    }

    const eventType = event.event_type || 'PAYMENT.CAPTURE.COMPLETED';
    const resource = event.resource;

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const customId = resource?.custom_id || resource?.amount?.description || '';
        let plan: SubPlan = 'pro';
        if (customId.includes('agency')) plan = 'agency';
        else if (customId.includes('enterprise')) plan = 'enterprise';
        else if (customId.includes('ltd')) plan = 'pro';

        await activateOrganizationPlan(undefined, plan);
        break;
      }
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const planName = (resource?.plan_id || '').toLowerCase();
        let plan: SubPlan = 'pro';
        if (planName.includes('agency')) plan = 'agency';
        else if (planName.includes('enterprise')) plan = 'enterprise';

        await activateOrganizationPlan(undefined, plan);
        break;
      }
      default:
        // Other PayPal webhook events — acknowledged but not processed
        break;
    }

    return NextResponse.json({ received: true, eventType });
  } catch (error) {
    return NextResponse.json(
      { error: 'PayPal webhook processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
