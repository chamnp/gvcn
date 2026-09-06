'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { FeatureFlags } from '@/lib/feature-flags';

interface FeatureGateProps {
  feature: keyof FeatureFlags;
  featureName: string;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  featureName,
  children,
}) => {
  const { featureFlags } = useAppStore();

  if (featureFlags && featureFlags[feature]) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span>Đang Trong Lộ Trình Thử Nghiệm</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {featureName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            Để tránh giao diện bị rối mắt và đảm bảo trải nghiệm ổn định cao nhất cho giáo viên, tính năng này hiện được ẩn ở chế độ mặc định. Thầy/Cô có thể chủ động bật thử nghiệm tính năng này bất kỳ lúc nào trong phần Cài đặt.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Chủ Lớp</span>
          </Link>

          <Link
            href="/settings?tab=FEATURES"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Bật Tính Năng Trong Cài Đặt</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
