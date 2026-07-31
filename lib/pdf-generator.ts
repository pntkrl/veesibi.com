import { DomainAuditResult } from './audit-engine';

export interface AgencyReportOptions {
  agencyName?: string;
  agencyLogoUrl?: string;
  clientName?: string;
}

export function generateWhiteLabelReportHtml(audit: DomainAuditResult, options: AgencyReportOptions = {}): string {
  const agencyName = options.agencyName || 'VEESIBI Certified Agency Partner';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Visibility & GEO Diagnostic Report - ${audit.domain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; color: #171717; background: #ffffff; margin: 0; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ebebeb; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 28px; font-weight: 800; margin: 0; }
    .meta { font-size: 12px; color: #666666; font-family: monospace; }
    .badge { background: #171717; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-family: monospace; font-size: 12px; font-weight: bold; }
    .score-card { background: #fafafa; border: 1px solid #ebebeb; border-radius: 16px; padding: 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .score-num { font-size: 54px; font-weight: 900; font-family: monospace; color: #171717; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
    .card { background: #ffffff; border: 1px solid #ebebeb; border-radius: 12px; padding: 16px; }
    .card-title { font-size: 12px; font-weight: bold; font-family: monospace; color: #666666; margin-bottom: 8px; }
    .card-val { font-size: 20px; font-weight: bold; font-family: monospace; }
    .footer { border-top: 1px solid #ebebeb; pt: 20px; font-size: 11px; color: #888888; font-family: monospace; text-align: center; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="meta">PREPARED BY ${agencyName.toUpperCase()}</div>
      <h1 class="title">AI Search Visibility & GEO Diagnostic Report</h1>
      <div class="meta">Target Domain: <strong>${audit.domain}</strong> • Date: ${new Date(audit.timestamp).toLocaleDateString()}</div>
    </div>
    <div class="badge">GRADE ${audit.grade}</div>
  </div>

  <div class="score-card">
    <div>
      <div class="card-title">OVERALL COMPOSITE AI SCORE</div>
      <div class="score-num">${audit.overallScore}<span style="font-size:20px;color:#888;"> / 100</span></div>
      <p style="font-size:12px;color:#555;margin-top:4px;">Evaluated against 10 specialized GEO sub-scores including Jeremy Howard's /llms.txt standard.</p>
    </div>
  </div>

  <div class="card-title">SUB-SCORE BREAKDOWN</div>
  <div class="grid">
    ${Object.values(audit.subScores).map(sub => `
      <div class="card">
        <div class="card-title">${sub.name.toUpperCase()}</div>
        <div class="card-val">${sub.score} / 100</div>
        <p style="font-size:11px;color:#666;margin-top:6px;">${sub.details}</p>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    Report generated via VEESIBI Engine • White-Label Agency Diagnostic Export
  </div>
</body>
</html>
`.trim();
}
