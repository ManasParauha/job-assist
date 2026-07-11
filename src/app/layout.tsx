import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job-assist",
  description: "A premium full-stack job application tracker app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafafa] text-[#171717] font-sans selection:bg-[#171717] selection:text-[#f2f2f2]">
        {/* Sticky Header Navbar */}
        <header className="sticky top-0 z-50 w-full border-b border-[#ebebeb] bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-[#171717] hover:opacity-90 transition-opacity">
                Job-assist<span className="text-[#0070f3]">.</span>
              </Link>
            </div>

            {/* Navigation links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717] transition-all duration-200"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717] transition-all duration-200"
              >
                Profile
              </Link>
              <Link
                href="/admin"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#171717] transition-all duration-200"
              >
                Admin
              </Link>
            </nav>

            {/* CTA / Auth Actions placeholder */}
            <div className="hidden sm:flex items-center gap-2">
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
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-[#ebebeb] bg-white py-6 sm:py-8 mt-auto">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
            <p className="text-xs text-[#888888]">
              Built by <span className="font-medium text-[#4d4d4d]">Manas</span>
            </p>
            <div className="flex items-center gap-4 text-xs text-[#888888]">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#171717] transition-colors"
              >
                GitHub
              </a>
              <span className="text-[#ebebeb]">•</span>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#171717] transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

