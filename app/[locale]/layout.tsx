import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { locales, isLocale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const dict = getDictionary(params.locale);
  const locale = params.locale as (typeof locales)[number];

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <Header
        locale={locale}
        nav={{
          home: dict.common.home,
          guides: dict.common.guides,
          about: dict.common.about,
        }}
        langLabels={{ en: 'English', ko: '한국어' }}
        appName={dict.common.appName}
      />
      <main className="flex-1">{children}</main>
      <Footer
        locale={locale}
        appName={dict.common.appName}
        tagline={dict.common.tagline}
        links={{
          home: dict.common.home,
          guides: dict.common.guides,
          about: dict.common.about,
          privacy: dict.common.privacy,
          terms: dict.common.terms,
        }}
        rights={dict.common.footerRights}
      />
    </div>
  );
}
