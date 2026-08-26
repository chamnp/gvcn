import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
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
        <AppProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Header />
            <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
          <Toaster richColors position="top-right" />
        </AppProvider>
      </body>
    </html>
  );
}
