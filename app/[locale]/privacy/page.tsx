import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
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
    title: `${dict.privacy.title} — ${dict.common.appName}`,
    description: dict.privacy.intro,
  };
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const p = dict.privacy;

  const sections = [
    { title: p.noDataTitle, desc: p.noDataDesc },
    { title: p.analyticsTitle, desc: p.analyticsDesc },
    { title: p.adsTitle, desc: p.adsDesc },
    { title: p.contactTitle, desc: p.contactDesc },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
        {p.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{p.lastUpdated}</p>
      <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
        {p.intro}
      </p>

      <AdBanner slot="top" className="mt-8 mb-8" />

      <div className="space-y-6">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              {s.title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {s.desc}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
