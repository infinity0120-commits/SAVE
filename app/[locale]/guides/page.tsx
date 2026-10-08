import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { locales, isLocale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';
import { AdBanner } from '@/components/AdBanner';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  return {
    title: `${dict.common.guides} — ${dict.common.appName}`,
    description: dict.home.seoDescription,
  };
}

export default function GuidesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const locale = params.locale;

  const guides = [
    {
      slug: 'iphone-video-compression',
      title: dict.home.guideLink1,
      desc: dict.guides.iphoneIntro,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50">
          <BookOpen className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
          {dict.common.guides}
        </h1>
      </div>

      <AdBanner slot="top" className="mb-6" />

      <div className="space-y-3">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/${locale}/guides/${guide.slug}`}
            className="group flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {guide.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                {guide.desc}
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
