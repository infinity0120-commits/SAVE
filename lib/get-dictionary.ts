import { dictionaries } from '@/lib/dictionaries';
import type { Locale } from '@/lib/i18n-config';

export type Dictionary = (typeof dictionaries)['en'];

export function getDictionary(locale: string): Dictionary {
  if (locale === 'ko') return dictionaries.ko as unknown as Dictionary;
  return dictionaries.en;
}
