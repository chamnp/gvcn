import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { AuthProvider } from '@/lib/auth-context';
import { MobileNavProvider } from '@/components/layout/mobile-nav-context';
import { Sidebar, MobileSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'GVCN Pro - Quản lý Lớp học & Đánh giá Học sinh Tiểu học (TT27)',
  description: 'Phần mềm trợ lý toàn diện cho Giáo viên Chủ nhiệm Tiểu học theo Thông tư 27/2020/TT-BGDĐT',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased flex">
        <AuthProvider>
          <AppProvider>
            <MobileNavProvider>
              <Sidebar />
              <MobileSidebar />
              <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />
                <main className="flex-1 p-3 sm:p-6 pb-20 lg:pb-6 overflow-y-auto max-w-7xl w-full mx-auto">
                  <AuthGuard>{children}</AuthGuard>
                </main>
                <BottomNav />
              </div>
              <Toaster richColors position="top-right" />
            </MobileNavProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
