import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
        {/* Dynamic client-side Navbar */}
        <Navbar />

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
                href="https://github.com/ManasParauha"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#171717] transition-colors"
              >
                GitHub
              </a>
              <span className="text-[#ebebeb]">•</span>
              <a
                href="https://www.linkedin.com/in/manas-parauha-61b44031a/"
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

