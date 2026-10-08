'use client';

import { cn } from '@/lib/utils';

type AdSlot = 'top' | 'encoding' | 'bottom' | 'sidebar';

interface AdBannerProps {
  slot: AdSlot;
  className?: string;
  label?: string;
}

const slotConfig: Record<AdSlot, { minHeight: string; label: string }> = {
  top: { minHeight: 'min-h-[90px]', label: 'Advertisement' },
  encoding: { minHeight: 'min-h-[250px]', label: 'Advertisement' },
  bottom: { minHeight: 'min-h-[90px]', label: 'Advertisement' },
  sidebar: { minHeight: 'min-h-[600px]', label: 'Advertisement' },
};

export function AdBanner({ slot, className, label }: AdBannerProps) {
  const config = slotConfig[slot];

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border border-dashed border-slate-300 dark:border-slate-700',
        'bg-slate-50 dark:bg-slate-900/50',
        'flex items-center justify-center text-center px-4 py-3',
        config.minHeight,
        className,
      )}
      aria-label={label || config.label}
      role="complementary"
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
          {label || config.label}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-600">
          Google AdSense
        </span>
      </div>
    </div>
  );
}
