import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://veesibi.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/']
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/'
      },
      {
        userAgent: 'Claude-SearchBot',
        allow: '/'
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/'
      },
      {
        userAgent: 'GPTBot',
        disallow: '/private/'
      },
      {
        userAgent: 'ClaudeBot',
        disallow: '/private/'
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
