import { calculateDomainAudit } from "@/lib/audit-engine";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const resolvedParams = await params;
  const rawDomain = resolvedParams.domain || "veesibi.com";
  const domain = decodeURIComponent(rawDomain);
  const audit = calculateDomainAudit(domain);

  const svg = `
<svg width="240" height="40" viewBox="0 0 240 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="240" height="40" rx="8" fill="#0A0A0A" stroke="#262626" stroke-width="1"/>
  <circle cx="20" cy="20" r="4" fill="#10B981"/>
  <text x="32" y="24" fill="#FFFFFF" font-family="monospace, sans-serif" font-size="12" font-weight="bold">Verified AI-Ready</text>
  <line x1="160" y1="8" x2="160" y2="32" stroke="#262626" stroke-width="1"/>
  <text x="172" y="24" fill="#10B981" font-family="monospace, sans-serif" font-size="13" font-weight="bold">${audit.overallScore}/100</text>
</svg>
`.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
