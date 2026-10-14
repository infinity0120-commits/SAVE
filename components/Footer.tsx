'use client';

import Link from 'next/link';
import { Video } from 'lucide-react';
import type { Locale } from '@/lib/i18n-config';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface FooterPrivacyContent {
  title: string;
  lastUpdated: string;
  intro: string;
  noDataTitle: string;
  noDataDesc: string;
  analyticsTitle: string;
  analyticsDesc: string;
  adsTitle: string;
  adsDesc: string;
  contactTitle: string;
  contactDesc: string;
}

interface FooterTermsContent {
  title: string;
  lastUpdated: string;
  intro: string;
  useTitle: string;
  useDesc: string;
  noWarrantyTitle: string;
  noWarrantyDesc: string;
  liabilityTitle: string;
  liabilityDesc: string;
  changesTitle: string;
  changesDesc: string;
}

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
  privacy: FooterPrivacyContent;
  terms: FooterTermsContent;
}

export function Footer({ locale, appName, tagline, links, rights, privacy, terms }: FooterProps) {
  const year = new Date().getFullYear();
  const [legalOpen, setLegalOpen] = useState<'privacy' | 'terms' | null>(null);

  return (
    <>
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
              <button
                onClick={() => setLegalOpen('privacy')}
                className="text-sm text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                {links.privacy}
              </button>
              <button
                onClick={() => setLegalOpen('terms')}
                className="text-sm text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                {links.terms}
              </button>
            </nav>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center dark:border-slate-800/50">
            <p className="text-xs text-slate-400 dark:text-slate-600">
              © {year} {appName}. {rights}
            </p>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <Dialog open={legalOpen === 'privacy'} onOpenChange={(open) => !open && setLegalOpen(null)}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{privacy.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">{privacy.lastUpdated}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <p>{privacy.intro}</p>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{privacy.noDataTitle}</h3>
              <p>{privacy.noDataDesc}</p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{privacy.analyticsTitle}</h3>
              <p>{privacy.analyticsDesc}</p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{privacy.adsTitle}</h3>
              <p>{privacy.adsDesc}</p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{privacy.contactTitle}</h3>
              <p>{privacy.contactDesc}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Modal */}
      <Dialog open={legalOpen === 'terms'} onOpenChange={(open) => !open && setLegalOpen(null)}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{terms.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">{terms.lastUpdated}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <p>{terms.intro}</p>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{terms.useTitle}</h3>
              <p>{terms.useDesc}</p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{terms.noWarrantyTitle}</h3>
              <p>{terms.noWarrantyDesc}</p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{terms.liabilityTitle}</h3>
              <p>{terms.liabilityDesc}</p>
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{terms.changesTitle}</h3>
              <p>{terms.changesDesc}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
