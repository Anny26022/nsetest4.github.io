import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { MarketStatusIndicator } from '@/components/market-status-indicator';
import { NavBar } from '@/components/nav-bar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NSE Stock Dashboard - Real-time Stock Market Data',
  description: 'Real-time stock market dashboard with data from National Stock Exchange of India (NSE)',
  keywords: 'NSE, stock market, dashboard, equities, indices, market data, real-time'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed right-4 top-4 z-50 flex items-center gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
            <div className="hidden md:block">
              <MarketStatusIndicator />
            </div>
            <ThemeToggle />
          </div>
          <Providers>
            <NavBar />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
