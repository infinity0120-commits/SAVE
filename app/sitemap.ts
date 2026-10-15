import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/lib/i18n-config';

const baseUrl = 'https://zipstor.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/guides',
    '/guides/iphone-video-compression',
    '/about',
    '/privacy',
    '/terms',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      const url = `${baseUrl}/${locale}${route}`;

      const languages: Record<string, string> = {
        'x-default': `${baseUrl}/${defaultLocale}${route}`,
      };
      for (const l of locales) {
        languages[l] = `${baseUrl}/${l}${route}`;
      }

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route.includes('guides/iphone') ? 0.8 : 0.5,
        alternates: { languages },
      } as MetadataRoute.Sitemap[number]);
    }
  }

  return entries;
}
