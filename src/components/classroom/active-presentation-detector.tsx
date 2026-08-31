'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Smartphone, Tv, X, Sparkles, Radio } from 'lucide-react';
import {
  subscribeToClassPresentationBeacon,
  LivePresentationBeacon,
  triggerHaptic,
} from '@/lib/remote-sync';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

export const ActivePresentationDetector: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { classInfo } = useAppStore();
  const { isAuthorized } = useAuth();

  const [activeBeacon, setActiveBeacon] = useState<LivePresentationBeacon | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for active presentation beacon for current class
  useEffect(() => {
    if (!isAuthorized || !classInfo.name) return;

    const unsubscribe = subscribeToClassPresentationBeacon(classInfo.name, (beacon) => {
      if (beacon && beacon.sessionCode && Date.now() - beacon.timestamp < 15000) {
        setActiveBeacon(beacon);
      } else {
        setActiveBeacon(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthorized, classInfo.name]);

  // Don't show if already on the remote control page or dismissed or not on mobile
  if (
    !activeBeacon ||
    isDismissed ||
    pathname === '/remote' ||
    pathname.startsWith('/remote?') ||
    !isMobile
  ) {
    return null;
  }

  const handleOpenRemote = () => {
    triggerHaptic(50);
    router.push(`/remote?s=${encodeURIComponent(activeBeacon.sessionCode)}`);
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[9990] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/80 rounded-3xl p-4 shadow-2xl text-white space-y-3 backdrop-blur-md ring-4 ring-indigo-500/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-md shrink-0">
              📺
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
                  Máy tính lớp {activeBeacon.className} đang chiếu
                </span>
              </div>
              <h4 className="font-bold text-xs text-white line-clamp-1 mt-0.5">
                {activeBeacon.slideTitle || 'Kế hoạch bài dạy & Công cụ lớp học'}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2 pt-1 border-t border-indigo-800/40">
          <button
            onClick={handleOpenRemote}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-slate-950" />
            <span>MỞ REMOTE ĐIỀU KHIỂN NGAY</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="py-2.5 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs cursor-pointer"
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
};
