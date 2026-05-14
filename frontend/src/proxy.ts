import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth proxy for public landing + protected dashboard routes.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('nt_access')?.value;

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/dashboard' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard'],
};
