import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supportedLanguages = ['zh', 'en'];
const dynamicRoutes = ['/dashboard', '/study', '/speaking', '/writing', '/translate', '/notes', '/exam'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Skip paths that definitely don't need language routing
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/profile') || // profile is shared
    pathname.startsWith('/dev') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check if pathname already has a supported language
  const pathnameHasLang = supportedLanguages.some(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
  );

  if (pathnameHasLang) {
    // Optionally: Set a cookie here to remember their last chosen language
    const res = NextResponse.next();
    const lang = pathname.split('/')[1];
    res.cookies.set('last_target_lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // 3. Detect if they are trying to access a supported route without a language
  const isDynamicRoute = dynamicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/';

  if (isDynamicRoute) {
    const lastLang = request.cookies.get('last_target_lang')?.value || 'zh';
    const lang = supportedLanguages.includes(lastLang) ? lastLang : 'zh';
    
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // 4. If they accessed an invalid language like /fr/study
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (match) {
    const potentialLang = match[1];
    if (!supportedLanguages.includes(potentialLang)) {
      // Redirect to default language
      const url = request.nextUrl.clone();
      const restOfPath = pathname.substring(3);
      url.pathname = `/zh${restOfPath}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
