'use client';

import Link from 'next/link';
import { Video } from 'lucide-react';
import type { Locale } from '@/lib/i18n-config';

interface FooterProps {
  locale: Locale;
  appName: string;
  tagline: string;
  links: {
    home: string;
    guides: string;
    about: string;
    privacy: string;
    terms: string;
  };
  rights: string;
}

export function Footer({ locale, appName, tagline, links, rights }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 safe-area-bottom">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-col items-center gap-2 md:items-start">
              <Link href={`/${locale}`} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400">
                  <Video className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{appName}</span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400">{tagline}</p>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link
                href={`/${locale}`}
                className="text-sm text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                {links.home}
              </Link>
              <Link
                href={`/${locale}/guides`}
                className="text-sm text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                {links.guides}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="text-sm text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                {links.about}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="text-sm text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                {links.privacy}
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="text-sm text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                {links.terms}
              </Link>
            </nav>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center dark:border-slate-800/50">
            <p className="text-xs text-slate-400 dark:text-slate-600">
              © {year} {appName}. {rights}
            </p>
          </div>
        </div>
      </footer>
  );
}
