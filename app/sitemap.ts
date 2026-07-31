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

  // 2. Industry category pSEO routes
  const categories = [
    'saas',
    'e-commerce',
    'fintech',
    'developer-tools',
    'ai-infrastructure',
    'cybersecurity',
    'marketing-martech',
    'healthcare'
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/industry/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  // 3. Versus comparison pSEO routes
  const comparisons = [
    'stripe.com-vs-paypal.com',
    'linear.app-vs-jira.com',
    'vercel.com-vs-netlify.com',
    'supabase.com-vs-firebase.com',
    'notion.so-vs-confluence.com',
    'hubspot.com-vs-salesforce.com'
  ];

  const comparisonRoutes: MetadataRoute.Sitemap = comparisons.map((slug) => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  // 4. Public domain scorecards from Supabase database
  let domainRoutes: MetadataRoute.Sitemap = [];
  try {
    const monitored = await getMonitoredDomains('org-veesibi-01');
    domainRoutes = monitored.map((item) => ({
      url: `${baseUrl}/score/${encodeURIComponent(item.domain.domain_name)}`,
      lastModified: new Date(item.domain.created_at || new Date()),
      changeFrequency: 'daily',
      priority: 0.9
    }));
  } catch {
    // Fallback preset domain routes
    const fallbackDomains = ['veesibi.com', 'stripe.com', 'linear.app', 'vercel.com', 'supabase.com'];
    domainRoutes = fallbackDomains.map((dom) => ({
      url: `${baseUrl}/score/${dom}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9
    }));
  }

  return [...staticRoutes, ...categoryRoutes, ...comparisonRoutes, ...domainRoutes];
}
