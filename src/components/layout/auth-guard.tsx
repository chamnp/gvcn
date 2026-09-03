'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, Loader2 } from 'lucide-react';

const PUBLIC_PREFIXES = ['/login', '/unauthorized', '/demo', '/hw', '/lookup', '/student', '/rewards'];

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAuthorized, isAdmin, loading } = useAuth();

  const isPublicRoute = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  useEffect(() => {
    if (loading) return;

    if (!isPublicRoute) {
      if (!user) {
        router.replace('/login');
      } else if (!isAuthorized) {
        router.replace('/unauthorized');
      } else if (pathname.startsWith('/admin') && !isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isAuthorized, isAdmin, profile, loading, pathname, isPublicRoute, router]);

  // If on a public route, always render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If still checking auth session
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20 border-2 border-slate-100 animate-pulse">
          <img src="/app-icon.jpg" alt="GVCN Pro Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Đang xác thực quyền truy cập giáo viên...</span>
        </div>
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return null;
  }

  // If logged in but not authorized / pending approval
  if (!isAuthorized) {
    return null;
  }

  // User is logged in and authorized
  return <>{children}</>;
};
