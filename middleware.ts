import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const AUTH_PATHS = ['login', 'register'];
const PROTECTED_PATHS = [
  'dashboard',
  'leads',
  'pipeline',
  'email',
  'calls',
  'automations',
  'import',
  'integrations',
  'settings',
  'meta-connect',
  'meta-select',
  'hesabim',
  'faturalarim',
  'abonelik',
];

function stripLocale(pathname: string): { locale: string | null; rest: string } {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && (routing.locales as readonly string[]).includes(segments[0])) {
    return { locale: segments[0], rest: '/' + segments.slice(1).join('/') };
  }
  return { locale: null, rest: pathname };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let the intl middleware handle locale detection / redirect first
  const intlResponse = intlMiddleware(request);

  // If intl middleware issued a redirect (missing locale prefix), return it
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // Now run Supabase auth against the (possibly normalized) request
  let supabaseResponse = intlResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = intlResponse ?? NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { locale, rest } = stripLocale(pathname);
  const activeLocale = locale ?? routing.defaultLocale;
  const firstSegment = rest.split('/').filter(Boolean)[0] ?? '';

  const isAuthPage = AUTH_PATHS.includes(firstSegment);
  const isProtected = PROTECTED_PATHS.includes(firstSegment);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = `/${activeLocale}/login`;
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = `/${activeLocale}/dashboard`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // Match all paths EXCEPT Next.js internals, api routes, static files,
  // and neutral routes we want to keep locale-free.
  matcher: [
    '/((?!api|_next|_vercel|data-deletion|sunum|favicon|logo|.*\\..*).*)',
  ],
};
