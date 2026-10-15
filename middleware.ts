import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ko', 'ja', 'es', 'de', 'fr', 'zh'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  if (pathnameIsMissingLocale) {
    // Check cookie (set by LanguageSwitcher to mirror localStorage preference)
    const cookieLocale = request.cookies.get('app_lang')?.value;
    const cookieMatched = cookieLocale && locales.includes(cookieLocale);

    let locale: string;
    if (cookieMatched) {
      locale = cookieLocale!;
    } else {
      const acceptLang = request.headers.get('accept-language') || '';
      const detected = acceptLang
        .split(',')
        .map((l) => l.split(';')[0].trim().split('-')[0].toLowerCase())
        .find((l) => locales.includes(l));

      locale = detected || defaultLocale;
    }

    return NextResponse.redirect(
      new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|robots.txt|sitemap.xml|google.*\\.html$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
