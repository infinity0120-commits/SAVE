import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Shield, Code, Heart } from 'lucide-react';
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
    title: `${dict.about.title} — ${dict.common.appName}`,
    description: dict.about.intro,
  };
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const a = dict.about;

  const sections = [
    { icon: Code, title: a.howTitle, desc: a.howDesc },
    { icon: Shield, title: a.privacyTitle, desc: a.privacyDesc },
    { icon: Heart, title: a.freeTitle, desc: a.freeDesc },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
        {a.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
        {a.intro}
      </p>

      <AdBanner slot="top" className="mt-8 mb-8" />

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/50">
              <s.icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
