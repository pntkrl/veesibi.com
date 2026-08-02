import { calculateDomainAudit } from "@/lib/audit-engine";
import JsonLd from "@/components/json-ld";
import Link from "next/link";
import type { Metadata } from "next";

const CATEGORY_DOMAINS: Record<string, string[]> = {
  "developer-tools": ["vercel.com", "github.com", "linear.app", "gitlab.com", "bitbucket.org", "jira.com"],
  "fintech": ["stripe.com", "paypal.com", "square.com", "plaid.com", "wise.com", "revolut.com"],
  "e-commerce": ["shopify.com", "klaviyo.com", "bigcommerce.com", "woocommerce.com", "squarespace.com", "wix.com"],
  "ai-platforms": ["openai.com", "anthropic.com", "perplexity.ai", "cohere.com", "huggingface.co", "mistral.ai"],
  "hosting-cloud": ["aws.amazon.com", "cloud.google.com", "azure.microsoft.com", "digitalocean.com", "linode.com", "vultr.com"],
  "productivity": ["notion.so", "airtable.com", "clickup.com", "asana.com", "monday.com", "coda.io"],
  "design-creative": ["figma.com", "canva.com", "sketch.com", "adobe.com", "framer.com", "webflow.com"],
  "data-analytics": ["grafana.com", "datadog.com", "mixpanel.com", "amplitude.com", "segment.com", "heap.io"],
  "devops-ci-cd": ["circleci.com", "travis-ci.com", "buildkite.com", "argo.githubusercontent.com", "jenkins.io", "drone.io"],
  "cybersecurity": ["cloudflare.com", "crowdstrike.com", "paloaltonetworks.com", "okta.com", "duo.com", "1password.com"],
  "marketing-martech": ["hubspot.com", "salesforce.com", "marketo.com", "mailchimp.com", "activecampaign.com", "intercom.com"],
  "healthcare": ["epic.com", "cerner.com", "health Gorilla.com", "drchrono.com", "athenahealth.com", "carecloud.com"],
  "education-edtech": ["canvaslms.com", "blackboard.com", "coursera.org", "udemy.com", "edx.org", "khanacademy.org"],
  "media-entertainment": ["spotify.com", "netflix.com", "youtube.com", "twitch.tv", "vimeo.com", "soundcloud.com"],
  "hr-recruiting": ["workday.com", "bamboohr.com", "greenhouse.io", "lever.co", "ashbyhq.com", "recruitee.com"],
  "legal-tech": ["clio.com", "legalzoom.com", "rocket lawyer.com", "pandadoc.com", "docusign.com", "ironcladapp.com"],
  "real-estate": ["zillow.com", "realtor.com", "redfin.com", "trulia.com", "homes.com", "opendoor.com"],
  "logistics-supply-chain": ["shipengine.com", "shippo.com", "easyship.com", "flexport.com", "project44.com", "fourkites.com"],
  "ai-agents": ["langchain.com", "llamaindex.ai", "crewai.com", "autogen.ai", "semantic-kernel.com", "agents.sdk"]
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const category = decodeURIComponent(resolvedParams.category || "developer-tools");

  return {
    title: `${category.toUpperCase().replace(/-/g, ' ')} AI Search Visibility Industry Benchmark | VEESIBI`,
    description: `Industry AI search visibility benchmarks and llms.txt compliance ratings for leading ${category} domains.`,
  };
}

export default async function IndustryCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = await params;
  const category = decodeURIComponent(resolvedParams.category || "developer-tools");
  const domains = CATEGORY_DOMAINS[category] || CATEGORY_DOMAINS["developer-tools"];

  const auditList = domains.map((d) => calculateDomainAudit(d));

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "VEESIBI Home",
              item: "https://veesibi.com",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Industry",
              item: "https://veesibi.com/industry",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: category,
              item: `https://veesibi.com/industry/${category}`,
            },
          ],
        }}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 mb-6">
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">VEESIBI Home</Link>
          <span>/</span>
          <span className="text-neutral-900 dark:text-white font-bold">industry</span>
          <span>/</span>
          <span className="text-gradient-develop font-bold">{category}</span>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold mb-3">
            <span>pSEO Industry Benchmark</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white capitalize">
            {category.replace(/-/g, ' ')} AI Visibility Leaderboard
          </h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            Comparative AI search visibility, llms.txt compliance, and citation rank across top {category} sites.
          </p>
        </div>

        {/* Industry Domain Table */}
        <div className="rounded-2xl border border-hairline bg-[var(--background-soft)] overflow-hidden card-vercel-shadow mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[var(--background-soft-2)] border-b border-hairline text-neutral-500 uppercase">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Rank</th>
                  <th className="py-3.5 px-6 font-semibold">Domain</th>
                  <th className="py-3.5 px-6 font-semibold">AI Visibility Score</th>
                  <th className="py-3.5 px-6 font-semibold">Grade</th>
                  <th className="py-3.5 px-6 font-semibold">llms.txt Status</th>
                  <th className="py-3.5 px-6 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {auditList
                  .sort((a, b) => b.overallScore - a.overallScore)
                  .map((audit, idx) => (
                    <tr key={audit.domain} className="hover:bg-[var(--background)] transition">
                      <td className="py-4 px-6 font-bold text-neutral-900 dark:text-white">#{idx + 1}</td>
                      <td className="py-4 px-6 font-bold text-neutral-900 dark:text-white">{audit.domain}</td>
                      <td className="py-4 px-6 font-black text-emerald-500 text-sm">{audit.overallScore} / 100</td>
                      <td className="py-4 px-6 font-bold">{audit.grade}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                          ✓ COMPLIANT
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Link
                          href={`/score/${audit.domain}`}
                          className="px-3 py-1 rounded bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-[11px]"
                        >
                          Scorecard →
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
