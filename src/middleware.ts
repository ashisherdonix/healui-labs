import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Create response
  let response = NextResponse.next();
  
  // Add security headers to prevent crawling
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex, nocache');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Allow access to login page and API routes
  if (path === '/login' || path.startsWith('/api/')) {
    return response;
  }

  // Check for auth token
  const token = request.cookies.get('authToken')?.value;

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token expiry (simple check without jwt library in edge runtime)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      // Token expired, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('authToken');
      return response;
    }
  } catch (error) {
    // Invalid token format
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ]
};