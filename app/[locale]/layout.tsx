import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { locales, isLocale, defaultLocale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';

const baseUrl = 'https://zipstor.vercel.app';

const localeTitles: Record<string, string> = {
  en: 'ZipStor - Free Local Online Video Compressor (Privacy First)',
  ko: 'ZipStor - 서버 업로드 없는 무료 웹 동영상 용량 압축기',
  ja: 'ZipStor - アップロード不要の無料ブラウザ動画圧縮ツール',
  es: 'ZipStor - Compresor de vídeo online gratis (privacidad primero)',
  de: 'ZipStor - Kostenloser Online-Videokompressor (Datenschutz zuerst)',
  fr: 'ZipStor - Compresseur vidéo en ligne gratuit (confidentialité)',
  zh: 'ZipStor - 免费在线视频压缩器（隐私优先）',
};

const localeDescriptions: Record<string, string> = {
  en: 'Compress video files right in your browser. 100% private — your videos never leave your device. Free, no sign-up, works on iPhone, Android, Mac & PC.',
  ko: '브라우저에서 바로 동영상 용량을 줄이세요. 100% 프라이빗 — 동영상은 기기에서 벗어나지 않습니다. 무료, 가입 없음, 아이폰·안드로이드·Mac·PC에서 작동.',
  ja: 'ブラウザで直接動画を圧縮。100%プライベート — 動画はデバイスから離れません。無料、登録不要、iPhone・Android・Mac・PCで動作。',
  es: 'Comprime tus vídeos directamente en el navegador. 100% privado — tus vídeos nunca salen de tu dispositivo. Gratis, sin registro, funciona en iPhone, Android, Mac y PC.',
  de: 'Komprimieren Sie Videos direkt im Browser. 100% privat — Ihre Videos verlassen nie Ihr Gerät. Kostenlos, keine Anmeldung, funktioniert auf iPhone, Android, Mac & PC.',
  fr: 'Compressez vos vidéos directement dans le navigateur. 100% privé — vos vidéos ne quittent jamais votre appareil. Gratuit, sans inscription, fonctionne sur iPhone, Android, Mac et PC.',
  zh: '直接在浏览器中压缩视频。100%隐私保护 — 视频永远不会离开您的设备。免费、无需注册，适用于iPhone、Android、Mac和PC。',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale = params.locale;

  const alternates = {
    canonical: `${baseUrl}/${locale}`,
    languages: {
      'x-default': `${baseUrl}/${defaultLocale}`,
      ...Object.fromEntries(
        locales.map((l) => [l, `${baseUrl}/${l}`])
      ),
    },
  };

  return {
    title: localeTitles[locale] ?? localeTitles[defaultLocale],
    description: localeDescriptions[locale] ?? localeDescriptions[defaultLocale],
    alternates,
    openGraph: {
      type: 'website',
      locale: locale,
      siteName: 'ZipStor',
      title: localeTitles[locale] ?? localeTitles[defaultLocale],
      description: localeDescriptions[locale] ?? localeDescriptions[defaultLocale],
      images: [
        {
          url: '/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: 'ZipStor',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: localeTitles[locale] ?? localeTitles[defaultLocale],
      description: localeDescriptions[locale] ?? localeDescriptions[defaultLocale],
      images: ['/icons/icon-512.png'],
    },
  };
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
