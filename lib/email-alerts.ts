import { AuditDiff } from './audit-history';

interface AlertResult {
  sent: boolean;
  channel: 'email' | 'console';
  message: string;
}

export async function sendScoreDropAlert(diff: AuditDiff): Promise<AlertResult> {
  const { domain, previousScore, currentScore, delta, subScoreDiffs } = diff;

  const biggestDrop = subScoreDiffs
    .filter((s) => s.delta < 0)
    .sort((a, b) => a.delta - b.delta)[0];

  const subject = `⚠️ ${domain} AI Visibility Score dropped ${Math.abs(delta)}pts (${previousScore} → ${currentScore})`;

  const body = [
    `AI Visibility Score Alert for ${domain}`,
    ``,
    `Score: ${previousScore}/100 → ${currentScore}/100 (${delta > 0 ? '+' : ''}${delta})`,
    ``,
    `Sub-score changes:`,
    ...subScoreDiffs
      .filter((s) => s.delta !== 0)
      .map((s) => `  ${s.name}: ${s.previous} → ${s.current} (${s.delta > 0 ? '+' : ''}${s.delta})`),
    ``,
    biggestDrop
      ? `Biggest decline: ${biggestDrop.name} (${biggestDrop.delta}pts). Check ${biggestDrop.name.toLowerCase()} issues.`
      : `No significant sub-score declines detected.`,
    ``,
    `View full report: https://veesibi.com/score/${domain}`
  ].join('\n');

  // 1. Try Resend email API
  const resendKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL || process.env.ADMIN_EMAIL;

  if (resendKey && alertEmail) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'VEESIBI Alerts <alerts@veesibi.com>',
          to: [alertEmail],
          subject,
          text: body
        })
      });

      if (response.ok) {
        return { sent: true, channel: 'email', message: `Email sent to ${alertEmail}` };
      }
    } catch {
      // Fall through to console
    }
  }

  // 2. Console fallback (for dev/cron logs)
  console.log(`\n${'='.repeat(60)}`);
  console.log(`VEESIBI SCORE ALERT`);
  console.log(`${'='.repeat(60)}`);
  console.log(body);
  console.log(`${'='.repeat(60)}\n`);

  return { sent: true, channel: 'console', message: 'Logged to console (no RESEND_API_KEY configured)' };
}

export async function sendScoreImprovementAlert(diff: AuditDiff): Promise<AlertResult> {
  const { domain, previousScore, currentScore, delta } = diff;

  const subject = `✅ ${domain} AI Visibility Score improved +${delta}pts (${previousScore} → ${currentScore})`;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`VEESIBI SCORE IMPROVEMENT`);
  console.log(`${'='.repeat(60)}`);
  console.log(`${domain}: ${previousScore}/100 → ${currentScore}/100 (+${delta})`);
  console.log(`View: https://veesibi.com/score/${domain}`);
  console.log(`${'='.repeat(60)}\n`);

  return { sent: true, channel: 'console', message: 'Improvement logged' };
}
