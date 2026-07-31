import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Search Versus Benchmarks Directory | VEESIBI pSEO",
  description: "Compare head-to-head AI search visibility scores, /llms.txt specs, and citation Share of Voice between competing SaaS platforms.",
};

export default function CompareDirectoryPage() {
  const comparisons = [
    { slug: 'stripe.com-vs-paypal.com', title: 'Stripe vs PayPal', category: 'FinTech & Payments' },
    { slug: 'linear.app-vs-jira.com', title: 'Linear vs Jira', category: 'Developer & Project Tools' },
    { slug: 'vercel.com-vs-netlify.com', title: 'Vercel vs Netlify', category: 'Cloud Infrastructure' },
    { slug: 'supabase.com-vs-firebase.com', title: 'Supabase vs Firebase', category: 'Database & Backend' },
    { slug: 'notion.so-vs-confluence.com', title: 'Notion vs Confluence', category: 'Knowledge Management' },
    { slug: 'hubspot.com-vs-salesforce.com', title: 'HubSpot vs Salesforce', category: 'CRM & Marketing' },
    { slug: 'openai.com-vs-anthropic.com', title: 'OpenAI vs Anthropic', category: 'AI Platform & Models' },
    { slug: 'github.com-vs-gitlab.com', title: 'GitHub vs GitLab', category: 'DevOps & Version Control' },
    { slug: 'slack.com-vs-teams.com', title: 'Slack vs Teams', category: 'Team Communication' },
    { slug: 'figma.com-vs-sketch.com', title: 'Figma vs Sketch', category: 'Design Tools' },
    { slug: 'aws-vs-google-cloud', title: 'AWS vs Google Cloud', category: 'Cloud & Infrastructure' },
    { slug: 'cloudflare.com-vs-fastly.com', title: 'Cloudflare vs Fastly', category: 'CDN & Edge' },
    { slug: 'tailwindcss.com-vs-bootstrap.com', title: 'Tailwind CSS vs Bootstrap', category: 'CSS Frameworks' },
    { slug: 'nextjs.dev-vs-remix.run', title: 'Next.js vs Remix', category: 'React Frameworks' },
    { slug: 'postgresql.org-vs-mongodb.com', title: 'PostgreSQL vs MongoDB', category: 'Databases' },
    { slug: 'grafana.com-vs-datadog.com', title: 'Grafana vs Datadog', category: 'Observability' },
    { slug: 'shopify.com-vs-woocommerce.com', title: 'Shopify vs WooCommerce', category: 'E-Commerce' },
    { slug: 'mailchimp.com-vs-sendgrid.com', title: 'Mailchimp vs SendGrid', category: 'Email Marketing' },
    { slug: 'twilio.com-vs-vonage.com', title: 'Twilio vs Vonage', category: 'Communications API' },
    { slug: 'auth0.com-vs-clerk.com', title: 'Auth0 vs Clerk', category: 'Authentication' },
    { slug: 'plausible.io-vs-google-analytics', title: 'Plausible vs Google Analytics', category: 'Analytics' },
    { slug: 'cal.com-vs-calendly.com', title: 'Cal.com vs Calendly', category: 'Scheduling' },
    { slug: 'resend.com-vs-postmark.com', title: 'Resend vs Postmark', category: 'Transactional Email' },
    { slug: 'upstash.com-vs-redis.com', title: 'Upstash vs Redis', category: 'Serverless Data' },
    { slug: 'planetscale.com-vs-neon.tech', title: 'PlanetScale vs Neon', category: 'Serverless Database' },
    { slug: 'railway.app-vs-render.com', title: 'Railway vs Render', category: 'PaaS Hosting' },
    { slug: 'loom.com-vs-wistia.com', title: 'Loom vs Wistia', category: 'Video Hosting' },
    { slug: 'miro.com-vs-mural.co', title: 'Miro vs Mural', category: 'Whiteboarding' },
    { slug: 'zapier.com-vs-make.com', title: 'Zapier vs Make', category: 'Automation' },
    { slug: 'perplexity.ai-vs-chatgpt.com', title: 'Perplexity vs ChatGPT', category: 'AI Search' }
  ];

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-hairline pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-mono text-xs font-semibold mb-2">
            <span>Versus Benchmarks Matrix</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Head-to-Head AI Search Comparisons
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Compare Share of Voice, /llms.txt compliance, and AI crawler access across competing industry platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparisons.map((item) => (
            <Link
              key={item.slug}
              href={`/compare/${item.slug}`}
              className="p-6 rounded-2xl bg-[var(--background-soft)] border border-hairline hover:border-cyan-500/50 transition card-vercel-shadow"
            >
              <span className="font-mono text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400 block mb-1">
                {item.category}
              </span>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-neutral-500">
                Detailed AI visibility benchmark comparison report.
              </p>
              <div className="mt-4 pt-3 border-t border-hairline font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-between">
                <span>View Full Comparison</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
