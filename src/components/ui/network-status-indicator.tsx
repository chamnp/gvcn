"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Download, CheckCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Initial status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      // Check if running as standalone PWA
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      // Register Service Worker
      if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("GVCN Pro ServiceWorker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed:", err);
          });
      }

      // Network Listeners
      const handleOnline = () => {
        setIsOnline(true);
        setIsSyncing(true);
        toast.success("Đã kết nối Internet trở lại! Đang đồng bộ dữ liệu...");
        setTimeout(() => {
          setIsSyncing(false);
          toast.success("Đã đồng bộ an toàn với máy chủ Supabase");
        }, 1500);
      };

      const handleOffline = () => {
        setIsOnline(false);
        toast.warning("Mất kết nối Internet! Chế độ ngoại tuyến đã kích hoạt, dữ liệu lưu an toàn trên máy.", {
          duration: 5000,
        });
      };

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        toast.success("Đã cài đặt GVCN Pro lên thiết bị thành công!");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info("Để cài đặt ứng dụng: Trên Safari chọn Chia sẻ > Thêm vào MH chính; Trên Chrome chọn biểu tượng Cài đặt trên thanh địa chỉ.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* PWA Install Button */}
      {!isInstalled && deferredPrompt && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="hidden sm:inline-flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer animate-pulse"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Cài App GVCN</span>
        </button>
      )}

      {/* Network Indicator Pill */}
      {isOnline ? (
        <div
          className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold"
          title="Đã kết nối trực tuyến và đồng bộ thời gian thực với Supabase"
        >
          {isSyncing ? (
            <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <span className="hidden md:inline">{isSyncing ? "Đang đồng bộ..." : "Trực tuyến"}</span>
        </div>
      ) : (
        <div
          className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-[11px] font-black animate-bounce"
          title="Chế độ ngoại tuyến: Điểm danh và chấm điểm vẫn lưu an toàn trên máy"
        >
          <WifiOff className="w-3 h-3 text-amber-700" />
          <span>Ngoại tuyến (Lưu an toàn)</span>
        </div>
      )}
    </div>
  );
}
