import { calculateDomainAudit } from "@/lib/audit-engine";
import { runParallelEdgeProbes } from "@/lib/edge-probes";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const domain = decodeURIComponent(resolvedParams.domain);
  const audit = calculateDomainAudit(domain);

  return {
    title: `${domain} AI Visibility Score: ${audit.overallScore}/100 Grade ${audit.grade} | VEESIBI`,
    description: `Detailed AI search visibility scorecard for ${domain}. Evaluated llms.txt compliance, AI crawler permissions, JSON-LD schemas, and multi-engine citation authority.`,
  };
}

export default async function ScorecardPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const resolvedParams = await params;
  const domain = decodeURIComponent(resolvedParams.domain);
  const probes = await runParallelEdgeProbes(domain);
  const audit = calculateDomainAudit(domain, probes);

  return (
    <div className="py-12 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 mb-6">
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">VEESIBI Home</Link>
          <span>/</span>
          <span className="text-neutral-900 dark:text-white font-bold">score</span>
          <span>/</span>
          <span className="text-gradient-develop font-bold">{audit.domain}</span>
        </div>

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-hairline pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold mb-2">
              <span>Programmatic AI Scorecard</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              AI Visibility Report for <span className="font-mono text-gradient-develop">{audit.domain}</span>
            </h1>
            <p className="mt-2 text-sm text-neutral-500" suppressHydrationWarning>
              Audit calculated on {new Date(audit.timestamp).toLocaleDateString()} • Verified Edge AST Processing
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-semibold hover:opacity-90 transition"
            >
              ← Audit Another Domain
            </Link>
          </div>
        </div>

        {/* Score Card Gauge */}
        <div className="p-8 rounded-2xl bg-[var(--background-soft)] border border-hairline card-vercel-shadow mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-neutral-950 font-mono border-2 border-cyan-500">
              <span className="text-4xl font-black">{audit.overallScore}</span>
              <span className="text-[10px] text-neutral-400 font-bold uppercase">Grade {audit.grade}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {audit.overallScore >= 90 ? "Excellent AI Visibility" : audit.overallScore >= 75 ? "Good AI Visibility" : "Needs Optimization"}
              </h2>
              <p className="mt-1 text-xs text-neutral-500 max-w-md">
                {audit.domain} is scored against 10 specialized AI search metrics including Jeremy Howard's /llms.txt standard and robots.txt AI bot directives.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between gap-4 py-1.5 border-b border-hairline">
              <span className="text-neutral-500">Crawlability:</span>
              <span className="font-bold">{audit.subScores.crawlability.score}/100</span>
            </div>
            <div className="flex justify-between gap-4 py-1.5 border-b border-hairline">
              <span className="text-neutral-500">llms.txt Spec:</span>
              <span className="font-bold">{audit.subScores.llmsTxt.score}/100</span>
            </div>
            <div className="flex justify-between gap-4 py-1.5 border-b border-hairline">
              <span className="text-neutral-500">Multi-Engine Citation:</span>
              <span className="font-bold">{audit.subScores.citationScore.score}/100</span>
            </div>
          </div>
        </div>

        {/* 10 Sub-Score Breakdown Matrix */}
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
          Detailed Diagnostic Sub-Scores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {Object.values(audit.subScores).map((sub) => (
            <div key={sub.key} className="p-4 rounded-xl bg-[var(--background-soft)] border border-hairline">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">{sub.name}</span>
                <span className="font-mono text-sm font-black text-neutral-900 dark:text-white">{sub.score}/100</span>
              </div>
              <p className="mt-2 text-xs text-neutral-500 leading-normal">{sub.details}</p>
              <div className="mt-2 pt-2 border-t border-hairline font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                Rec: {sub.recommendation}
              </div>
            </div>
          ))}
        </div>

        {/* Downloadable Fixes */}
        <div className="p-6 rounded-2xl bg-neutral-950 text-white font-mono text-xs mb-12">
          <h3 className="font-bold text-sm text-cyan-400 mb-2">Generated /llms.txt File Snippet</h3>
          <pre className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 whitespace-pre overflow-x-auto">
            {audit.generatedLlmsTxt}
          </pre>
        </div>
      </div>
    </div>
  );
}
