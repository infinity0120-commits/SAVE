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
    title: `${dict.terms.title} — ${dict.common.appName}`,
    description: dict.terms.intro,
  };
}

export default function TermsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const t = dict.terms;

  const sections = [
    { title: t.useTitle, desc: t.useDesc },
    { title: t.noWarrantyTitle, desc: t.noWarrantyDesc },
    { title: t.liabilityTitle, desc: t.liabilityDesc },
    { title: t.changesTitle, desc: t.changesDesc },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
        {t.title}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.lastUpdated}</p>
      <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
        {t.intro}
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
