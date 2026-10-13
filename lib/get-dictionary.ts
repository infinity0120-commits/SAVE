import { dictionaries } from '@/lib/dictionaries';
import type { Locale } from '@/lib/i18n-config';

export type Dictionary = (typeof dictionaries)['en'];

export function getDictionary(locale: string): Dictionary {
  const dict = (dictionaries as unknown as Record<string, Dictionary>)[locale];
  return dict || dictionaries.en;
}
