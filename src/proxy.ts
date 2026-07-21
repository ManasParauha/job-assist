import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Paths to protect (only accessible if logged in)
  const protectedPaths = ['/dashboard', '/applications', '/profile', '/admin'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // Auth paths (only accessible if NOT logged in)
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some((path) => pathname === path);

  // If it's neither, we don't need to process anything
  if (!isProtected && !isAuthPath) {
    return NextResponse.next();
  }

  let payload: any = null;
  let isValid = false;

  if (token) {
    try {
      if (JWT_SECRET) {
        const secretKey = new TextEncoder().encode(JWT_SECRET);
        const verified = await jwtVerify(token, secretKey);
        payload = verified.payload;
        isValid = true;
      } else {
        console.error('Proxy: JWT_SECRET is not defined.');
      }
    } catch (error) {
      // Token validation failed (expired/invalid)
      isValid = false;
    }
  }

  // Handle protected paths
  if (isProtected) {
    if (!isValid) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      if (token) {
        response.cookies.delete('token');
      }
      return response;
    }

    const role = payload?.role as string;
    // Special check for admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Handle login/signup paths
  if (isAuthPath) {
    if (isValid) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Clean up expired/invalid token if present while allowing login page access
    if (token && !isValid) {
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

// Default export as well to cover all bases
export default proxy;

// Config to target specific routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/applications/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
};

