import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n-config';
import { isLocale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';
import type { Dictionary } from '@/lib/get-dictionary';

export async function getLocaleProps(params: { locale: string }): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = params.locale;
  if (!isLocale(locale)) notFound();
  return { locale, dict: getDictionary(locale) };
}

export const localeParams = [
  { locale: 'en' },
  { locale: 'ko' },
];
