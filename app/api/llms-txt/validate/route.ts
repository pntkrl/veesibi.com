import { NextResponse } from 'next/server';
import { validateLlmsTxtContent } from '@/lib/llms-validator';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit: 20 validations per minute per IP
  const rateLimit = await checkRateLimit(request, { limit: 20, windowMs: 60000, prefix: 'rl:llms' });
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json();
    const content = body.content || '';
    const domain = body.domain || 'example.com';

    if (!content.trim()) {
      return NextResponse.json({ error: 'Markdown content string is required' }, { status: 400 });
    }

    const validation = validateLlmsTxtContent(content, domain);

    return NextResponse.json({
      success: true,
      domain,
      validation
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate llms.txt content', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
