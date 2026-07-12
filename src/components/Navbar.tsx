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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setIsMenuOpen(false);
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
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-xl font-semibold tracking-tight text-[#171717] hover:opacity-90 transition-opacity">
            <svg
              className="h-6 w-6 flex-shrink-0"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="32" height="32" rx="8" fill="#171717" />
              <path
                d="M18 9v9a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="23" cy="21" r="2.5" fill="#0070f3" />
            </svg>
            <span>
              Job-assist<span className="text-[#0070f3]">.</span>
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
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
        <div className="hidden md:flex items-center gap-2">
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

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717] focus:outline-none transition-colors cursor-pointer"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[#ebebeb] bg-white px-4 py-4 space-y-4 shadow-sm animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-1.5">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    pathname?.startsWith('/dashboard')
                      ? 'bg-[#171717] text-white'
                      : 'text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717]'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
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
                    onClick={() => setIsMenuOpen(false)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
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
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  pathname === '/'
                    ? 'bg-[#171717] text-white'
                    : 'text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717]'
                }`}
              >
                Home
              </Link>
            )}
          </nav>

          <div className="border-t border-[#ebebeb] pt-4 flex flex-col gap-2">
            {loading ? (
              <div className="h-8 w-full bg-[#f5f5f5] animate-pulse rounded-md"></div>
            ) : user ? (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="w-full h-10 rounded-md px-3 text-sm font-semibold text-[#171717] hover:bg-[#f5f5f5] flex items-center justify-center transition-colors border border-[#ebebeb] cursor-pointer"
              >
                Log out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full h-10 rounded-md px-3 text-sm font-semibold text-[#171717] hover:bg-[#f5f5f5] flex items-center justify-center transition-colors border border-[#ebebeb]"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full h-10 rounded-md bg-[#171717] px-3 text-sm font-semibold text-white hover:bg-[#333] flex items-center justify-center transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
