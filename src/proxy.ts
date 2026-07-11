import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Paths to protect
  const protectedPaths = ['/dashboard', '/applications', '/profile', '/admin'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      if (!JWT_SECRET) {
        console.error('Proxy: JWT_SECRET is not defined.');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secretKey);
      const role = payload.role as string;

      // Special check for admin routes
      if (pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // Token validation failed (expired/invalid)
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

// Default export as well to cover all bases
export default proxy;

// Config to target only specific routes and subroutes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/applications/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
};
