import Link from 'next/link';
import { locales } from '@/lib/i18n-config';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-slate-200 dark:text-slate-800">404</p>
      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Page not found</p>
      <Link
        href={`/${locales[0]}`}
        className="mt-4 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-600"
      >
        Back to home
      </Link>
    </div>
  );
}
