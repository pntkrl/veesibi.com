import { calculateDomainAudit } from "@/lib/audit-engine";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug || "stripe.com-vs-paypal.com";
  const [domA, domB] = rawSlug.split("-vs-").map((d) => decodeURIComponent(d));

  return {
    title: `${domA || 'Domain A'} vs ${domB || 'Domain B'}: AI Visibility & GEO Audit Benchmark | VEESIBI`,
    description: `Head-to-head comparison of ${domA} vs ${domB} in AI Search visibility, llms.txt compliance, robots.txt permissions, and ChatGPT/Perplexity citation share.`,
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug || "stripe.com-vs-paypal.com";
  const parts = rawSlug.split("-vs-");
  const domA = decodeURIComponent(parts[0] || "stripe.com");
  const domB = decodeURIComponent(parts[1] || "paypal.com");

  const auditA = calculateDomainAudit(domA);
  const auditB = calculateDomainAudit(domB);

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 mb-6">
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">VEESIBI Home</Link>
          <span>/</span>
          <span className="text-neutral-900 dark:text-white font-bold">compare</span>
          <span>/</span>
          <span className="text-gradient-develop font-bold">{domA} vs {domB}</span>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold mb-3">
            <span>Competitive GEO Benchmark</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            <span className="font-mono text-gradient-develop">{domA}</span> vs <span className="font-mono text-gradient-preview">{domB}</span>
          </h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            Head-to-head AI search visibility breakdown comparing llms.txt compliance, AI bot permissions, and citation frequency.
          </p>
        </div>

        {/* Head-to-Head Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Domain A Card */}
          <div className="p-8 rounded-2xl bg-[var(--background-soft)] border-2 border-cyan-500 card-vercel-shadow">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-cyan-600 dark:text-cyan-400">Domain A</span>
              <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 font-mono text-xs font-bold">
                Grade {auditA.grade}
              </span>
            </div>
            <h2 className="text-3xl font-black font-mono text-neutral-900 dark:text-white mt-2">{auditA.domain}</h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono text-neutral-900 dark:text-white">{auditA.overallScore}</span>
              <span className="text-xl font-mono text-neutral-400">/100 Score</span>
            </div>

            <div className="mt-6 space-y-3 font-mono text-xs border-t border-hairline pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Crawlability:</span>
                <span className="font-bold">{auditA.subScores.crawlability.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">llms.txt Compliance:</span>
                <span className="font-bold">{auditA.subScores.llmsTxt.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Multi-Engine Citation:</span>
                <span className="font-bold">{auditA.subScores.citationScore.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">GEO Share of Voice:</span>
                <span className="font-bold">{auditA.subScores.geoShareOfVoice.score}/100</span>
              </div>
            </div>
          </div>

          {/* Domain B Card */}
          <div className="p-8 rounded-2xl bg-[var(--background-soft)] border-2 border-violet-500 card-vercel-shadow">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-violet-600 dark:text-violet-400">Domain B</span>
              <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 font-mono text-xs font-bold">
                Grade {auditB.grade}
              </span>
            </div>
            <h2 className="text-3xl font-black font-mono text-neutral-900 dark:text-white mt-2">{auditB.domain}</h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono text-neutral-900 dark:text-white">{auditB.overallScore}</span>
              <span className="text-xl font-mono text-neutral-400">/100 Score</span>
            </div>

            <div className="mt-6 space-y-3 font-mono text-xs border-t border-hairline pt-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Crawlability:</span>
                <span className="font-bold">{auditB.subScores.crawlability.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">llms.txt Compliance:</span>
                <span className="font-bold">{auditB.subScores.llmsTxt.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Multi-Engine Citation:</span>
                <span className="font-bold">{auditB.subScores.citationScore.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">GEO Share of Voice:</span>
                <span className="font-bold">{auditB.subScores.geoShareOfVoice.score}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Winner Summary Banner */}
        <div className="p-6 rounded-2xl bg-neutral-900 text-white font-mono text-xs text-center border border-hairline">
          <span className="text-cyan-400 font-bold uppercase text-[11px]">BENCHMARK VERDICT</span>
          <p className="mt-1 text-sm font-semibold">
            {auditA.overallScore >= auditB.overallScore
              ? `${auditA.domain} leads with higher AI Visibility (${auditA.overallScore} vs ${auditB.overallScore})`
              : `${auditB.domain} leads with higher AI Visibility (${auditB.overallScore} vs ${auditA.overallScore})`}
          </p>
        </div>
      </div>
    </div>
  );
}
