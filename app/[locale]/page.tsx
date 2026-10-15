import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Shield, Zap, Globe, FileVideo, Settings, Download, ArrowRight } from 'lucide-react';
import { locales, isLocale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';
import { VideoCompressor } from '@/components/VideoCompressor';
import { AdBanner } from '@/components/AdBanner';
import { InfoSections } from '@/components/InfoSections';
import Link from 'next/link';

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
    title: dict.home.seoTitle,
    description: dict.home.seoDescription,
    alternates: {
      languages: {
        en: '/en',
        ko: '/ko',
        ja: '/ja',
        es: '/es',
        de: '/de',
        fr: '/fr',
        zh: '/zh',
      },
    },
  };
}

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const locale = params.locale;
  const t = dict.compressor;
  const h = dict.home;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* Top ad */}
      <AdBanner slot="top" className="mb-6 sticky top-4 z-40" />

      {/* Hero */}
      <section className="mb-8 text-center md:mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-sm font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
          <Shield className="h-4 w-4" />
          {dict.common.tagline}
        </div>
        <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
          {h.heroTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-400 md:text-lg">
          {h.heroSubtitle}
        </p>
      </section>

      {/* Main compressor card */}
      <section className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl">
              {t.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t.subtitle}
            </p>
          </div>
          <VideoCompressor locale={locale} t={t} />
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12 md:mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
          {h.howItWorks}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: FileVideo, title: h.step1Title, desc: h.step1Desc },
            { icon: Settings, title: h.step2Title, desc: h.step2Desc },
            { icon: Download, title: h.step3Title, desc: h.step3Desc },
          ].map((step, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50">
                <step.icon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="absolute right-4 top-4 text-2xl font-black text-slate-100 dark:text-slate-800">
                {i + 1}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mt-12 md:mt-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
          {h.featuresTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Shield, title: h.feature1Title, desc: h.feature1Desc },
            { icon: Zap, title: h.feature2Title, desc: h.feature2Desc },
            { icon: Globe, title: h.feature3Title, desc: h.feature3Desc },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-sky-500/20">
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Guide links */}
      <section className="mt-12 md:mt-16">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          {h.guideLinksTitle}
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <Link
            href={`/${locale}/guides/iphone-video-compression`}
            className="group flex items-center justify-between bg-white p-4 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <span className="font-medium text-slate-900 dark:text-white">
              {h.guideLink1}
            </span>
            <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Info sections: how it works detail, step-by-step, FAQ */}
      <div className="mt-12 md:mt-16">
        <InfoSections dict={h} />
      </div>

      {/* SEO text */}
      <section className="mt-12 md:mt-16">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
            {h.seoTitle}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {h.seoDescription}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {h.seoDescription2}
          </p>
        </div>
      </section>

      {/* Bottom ad */}
      <div className="mt-8">
        <AdBanner slot="bottom" />
      </div>
    </div>
  );
}
