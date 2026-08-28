import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth-context';
import { MobileNavProvider } from '@/components/layout/mobile-nav-context';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'GVCN Pro - Quản lý Lớp học & Đánh giá Học sinh Tiểu học (TT27)',
  description: 'Phần mềm trợ lý toàn diện cho Giáo viên Chủ nhiệm Tiểu học theo Thông tư 27/2020/TT-BGDĐT',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GVCN Pro',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen antialiased flex w-full max-w-full overflow-x-hidden`}>
        <AuthProvider>
          <AppProvider>
            <MobileNavProvider>
              <AppShell>{children}</AppShell>
              <Toaster richColors position="top-right" />
            </MobileNavProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
