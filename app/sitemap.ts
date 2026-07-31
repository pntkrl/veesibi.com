import type { MetadataRoute } from 'next';
import { getMonitoredDomains } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://veesibi.com';

  // 1. Core static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/llms-txt/validator`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/score`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/industry`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 }
  ];

  // 2. Industry category pSEO routes (20 categories)
  const categories = [
    'saas',
    'e-commerce',
    'fintech',
    'developer-tools',
    'ai-infrastructure',
    'cybersecurity',
    'marketing-martech',
    'healthcare',
    'hosting-cloud',
    'productivity',
    'design-creative',
    'data-analytics',
    'devops-ci-cd',
    'education-edtech',
    'media-entertainment',
    'hr-recruiting',
    'legal-tech',
    'real-estate',
    'logistics-supply-chain',
    'ai-agents'
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/industry/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }));

  // 3. Versus comparison pSEO routes (30 comparisons)
  const comparisons = [
    'stripe.com-vs-paypal.com',
    'linear.app-vs-jira.com',
    'vercel.com-vs-netlify.com',
    'supabase.com-vs-firebase.com',
    'notion.so-vs-confluence.com',
    'hubspot.com-vs-salesforce.com',
    'openai.com-vs-anthropic.com',
    'github.com-vs-gitlab.com',
    'slack.com-vs-teams.com',
    'figma.com-vs-sketch.com',
    'aws-vs-google-cloud',
    'cloudflare.com-vs-fastly.com',
    'tailwindcss.com-vs-bootstrap.com',
    'nextjs.dev-vs-remix.run',
    'postgresql.org-vs-mongodb.com',
    'grafana.com-vs-datadog.com',
    'shopify.com-vs-woocommerce.com',
    'mailchimp.com-vs-sendgrid.com',
    'twilio.com-vs-vonage.com',
    'auth0.com-vs-clerk.com',
    'plausible.io-vs-google-analytics',
    'cal.com-vs-calendly.com',
    'resend.com-vs-postmark.com',
    'upstash.com-vs-redis.com',
    'planetscale.com-vs-neon.tech',
    'railway.app-vs-render.com',
    'loom.com-vs-wistia.com',
    'miro.com-vs-mural.co',
    'zapier.com-vs-make.com',
    'perplexity.ai-vs-chatgpt.com'
  ];

  const comparisonRoutes: MetadataRoute.Sitemap = comparisons.map((slug) => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }));

  // 4. Public domain scorecards from Supabase database
  let domainRoutes: MetadataRoute.Sitemap = [];
  try {
    const monitored = await getMonitoredDomains('org-veesibi-01');
    domainRoutes = monitored.map((item) => ({
      url: `${baseUrl}/score/${encodeURIComponent(item.domain.domain_name)}`,
      lastModified: new Date(item.domain.created_at || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.9
    }));
  } catch {
    // Fallback preset domain routes (50 domains)
    const fallbackDomains = [
      'veesibi.com', 'stripe.com', 'linear.app', 'vercel.com', 'supabase.com',
      'openai.com', 'anthropic.com', 'perplexity.ai', 'github.com', 'gitlab.com',
      'notion.so', 'figma.com', 'slack.com', 'hubspot.com', 'salesforce.com',
      'aws.amazon.com', 'cloud.google.com', 'cloudflare.com', 'netlify.com', 'digitalocean.com',
      'paypal.com', 'square.com', 'plaid.com', 'shopify.com', 'bigcommerce.com',
      'twilio.com', 'auth0.com', 'firebase.google.com', 'mongodb.com', 'postgresql.org',
      'grafana.com', 'datadog.com', 'zapier.com', 'mailchimp.com', 'sendgrid.com',
      'cal.com', 'calendly.com', 'resend.com', 'upstash.com', 'planetscale.com',
      'railway.app', 'render.com', 'loom.com', 'miro.com', 'miro.com',
      'tailwindcss.com', 'nextjs.dev', 'remix.run', 'jira.com', 'confluence.com',
      'atlassian.com'
    ];
    domainRoutes = fallbackDomains.map((dom) => ({
      url: `${baseUrl}/score/${dom}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9
    }));
  }

  return [...staticRoutes, ...categoryRoutes, ...comparisonRoutes, ...domainRoutes];
}
