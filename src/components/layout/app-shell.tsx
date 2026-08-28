'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar, MobileSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AuthGuard } from '@/components/layout/auth-guard';

const STANDALONE_PREFIXES = ['/login', '/unauthorized', '/demo', '/hw', '/lookup', '/student', '/rewards', '/reports/so-chu-nhiem', '/reports/hoc-ba', '/reports/certificates'];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user, isAuthorized, loading } = useAuth();

  const isStandalonePage = STANDALONE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // If on a standalone page (login, unauthorized, public homework portal)
  // OR if not logged in / not authorized yet -> Render clean standalone canvas (NO sidebar/header/bottom-nav)
  if (isStandalonePage || !user || !isAuthorized) {
    return (
      <div className="flex-1 min-h-screen flex flex-col bg-slate-50 w-full max-w-full overflow-x-hidden min-w-0">
        <AuthGuard>
          <main className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </AuthGuard>
      </div>
    );
  }

  // When logged in and authorized -> Render full application dashboard shell
  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50">
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen w-full max-w-full">
        <Header />
        <main className="flex-1 p-3 sm:p-6 pb-20 lg:pb-6 max-w-7xl w-full mx-auto">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};
