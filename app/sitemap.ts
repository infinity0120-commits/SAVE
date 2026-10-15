import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zipstor.vercel.app';
  const routes = [
    '',
    '/guides',
    '/guides/iphone-video-compression',
    '/about',
    '/privacy',
    '/terms',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route.includes('guides/iphone') ? 0.8 : 0.5,
      });
    }
  }

  return entries;
}
