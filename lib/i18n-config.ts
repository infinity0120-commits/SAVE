export const locales = ['en', 'ko', 'ja', 'es', 'de', 'fr', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  zh: '中文',
};
