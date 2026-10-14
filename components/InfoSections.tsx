'use client';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { FileVideo, Settings2, Download, Lock } from 'lucide-react';

interface InfoSectionsProps {
  dict: {
    howDetailTitle: string;
    howDetailDesc: string;
    howDetailSecurity: string;
    stepGuideTitle: string;
    stepGuide1: string;
    stepGuide2: string;
    stepGuide3: string;
    faqTitle: string;
    faq1Q: string;
    faq1A: string;
    faq2Q: string;
    faq2A: string;
    faq3Q: string;
    faq3A: string;
  };
}

export function InfoSections({ dict }: InfoSectionsProps) {
  return (
    <div className="space-y-12 md:space-y-16">
      {/* How VideoShrink Works — detailed */}
      <section>
        <h2 className="mb-4 text-center text-2xl font-bold text-slate-900 dark:text-white">
          {dict.howDetailTitle}
        </h2>
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {dict.howDetailDesc}
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-950/20">
            <Lock className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {dict.howDetailSecurity}
            </span>
          </div>
        </div>
      </section>

      {/* Step-by-step guide */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
          {dict.stepGuideTitle}
        </h2>
        <div className="mx-auto max-w-2xl space-y-3">
          {[
            { icon: FileVideo, text: dict.stepGuide1 },
            { icon: Settings2, text: dict.stepGuide2 },
            { icon: Download, text: dict.stepGuide3 },
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/50">
                <step.icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">STEP {i + 1}</span>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">
          {dict.faqTitle}
        </h2>
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq1">
              <AccordionTrigger className="text-sm font-semibold text-slate-900 dark:text-white">
                {dict.faq1Q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 dark:text-slate-400">
                {dict.faq1A}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq2">
              <AccordionTrigger className="text-sm font-semibold text-slate-900 dark:text-white">
                {dict.faq2Q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 dark:text-slate-400">
                {dict.faq2A}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq3">
              <AccordionTrigger className="text-sm font-semibold text-slate-900 dark:text-white">
                {dict.faq3Q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-slate-600 dark:text-slate-400">
                {dict.faq3A}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
