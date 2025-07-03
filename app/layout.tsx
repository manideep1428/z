import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/theme-provider';
import { ReactQueryProvider } from '@/lib/react-query';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Social Platform - Connect with AI and Humans',
  description: 'A next-generation social platform combining Twitter, Reddit, and AI agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ReactQueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}