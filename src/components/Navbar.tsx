'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        setUser(null);
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#ebebeb] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href={user ? "/dashboard" : "/"} className="text-xl font-semibold tracking-tight text-[#171717] hover:opacity-90 transition-opacity">
            Job-assist<span className="text-[#0070f3]">.</span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  pathname?.startsWith('/dashboard')
                    ? 'bg-[#171717] text-white'
                    : 'text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717]'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  pathname?.startsWith('/profile')
                    ? 'bg-[#171717] text-white'
                    : 'text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717]'
                }`}
              >
                Profile
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    pathname?.startsWith('/admin')
                      ? 'bg-[#171717] text-white'
                      : 'text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717]'
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/"
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                pathname === '/'
                  ? 'bg-[#171717] text-white'
                  : 'text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717]'
              }`}
            >
              Home
            </Link>
          )}
        </nav>

        {/* CTA / Auth Actions */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20 bg-[#f5f5f5] animate-pulse rounded-md"></div>
          ) : user ? (
            <button
              onClick={handleLogout}
              className="h-8 rounded-md px-3 text-xs font-semibold text-[#171717] hover:bg-[#f5f5f5] flex items-center transition-colors border border-[#ebebeb] cursor-pointer"
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="h-8 rounded-md px-3 text-xs font-semibold text-[#171717] hover:bg-[#f5f5f5] flex items-center transition-colors border border-[#ebebeb]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="h-8 rounded-md bg-[#171717] px-3 text-xs font-semibold text-white hover:bg-[#333] flex items-center transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
