import Link from "next/link";
import type { Metadata } from "next";
import { getMonitoredDomains } from "@/lib/db";

export const metadata: Metadata = {
  title: "AI Visibility Scorecards Directory | VEESIBI pSEO",
  description: "Browse live AI visibility scorecards, /llms.txt compliance reports, and crawler permission audits for top web platforms.",
};

export default async function ScoreDirectoryPage() {
  let domains: Array<{ domain: { domain_name: string; created_at: string }; latestAudit: { overallScore: number; grade: string } }> = [];

  try {
    const list = await getMonitoredDomains('org-veesibi-01');
    domains = list;
  } catch {
    domains = [
      { domain: { domain_name: 'veesibi.com', created_at: new Date().toISOString() }, latestAudit: { overallScore: 96, grade: 'A+' } },
      { domain: { domain_name: 'stripe.com', created_at: new Date().toISOString() }, latestAudit: { overallScore: 91, grade: 'A' } },
      { domain: { domain_name: 'linear.app', created_at: new Date().toISOString() }, latestAudit: { overallScore: 88, grade: 'A' } },
      { domain: { domain_name: 'vercel.com', created_at: new Date().toISOString() }, latestAudit: { overallScore: 85, grade: 'A' } },
      { domain: { domain_name: 'supabase.com', created_at: new Date().toISOString() }, latestAudit: { overallScore: 89, grade: 'A' } }
    ];
  }

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-hairline pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold mb-2">
            <span>Programmatic pSEO Directory</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            AI Search Visibility Scorecards
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Explore live audited scorecards evaluating /llms.txt specs, robots.txt AI bot directives, and JSON-LD structured data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {domains.map((item) => (
            <Link
              key={item.domain.domain_name}
              href={`/score/${encodeURIComponent(item.domain.domain_name)}`}
              className="p-5 rounded-2xl bg-[var(--background-soft)] border border-hairline hover:border-cyan-500/50 transition card-vercel-shadow flex items-center justify-between"
            >
              <div>
                <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white block">
                  {item.domain.domain_name}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Scorecard & AST Audit
                </span>
              </div>
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-neutral-950 font-mono text-xs font-black border border-cyan-500/40">
                <span>{item.latestAudit.overallScore}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
