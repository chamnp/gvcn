'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Radio,
  Zap,
  Sparkles,
} from 'lucide-react';
import { getRemotePairingUrl } from '@/lib/remote-sync';
import { toast } from 'sonner';

interface RemotePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCode: string;
  isRemoteConnected: boolean;
  className: string;
}

export const RemotePairingModal: React.FC<RemotePairingModalProps> = ({
  isOpen,
  onClose,
  sessionCode,
  isRemoteConnected,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pairingUrl = getRemotePairingUrl(sessionCode);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(
    pairingUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    toast.success('Đã sao chép đường link kết nối Remote!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-5 p-6 text-slate-900 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Kết Nối Remote Điện Thoại</h3>
              <p className="text-xs text-slate-500 font-medium">Điều khiển màn hình Smart TV Lớp {className}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Badge */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all ${
            isRemoteConnected
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isRemoteConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
              }`}
            />
            <span>
              {isRemoteConnected ? '🟢 Đã kết nối với điện thoại của bạn' : '🟡 Đang chờ mở kết nối từ điện thoại...'}
            </span>
          </div>

          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-white/70">
            Realtime
          </span>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrApiUrl}
              alt="Mã QR Ghép Đôi Remote"
              className="w-44 h-44 rounded-lg object-contain"
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-700">Mở Camera điện thoại quét mã QR</p>
            <p className="text-[11px] text-slate-500">Hoặc mở link / nhập mã PIN 6 ký tự bên dưới:</p>
          </div>

          {/* PIN Code Display */}
          <div className="inline-flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-inner font-mono font-black text-sm tracking-widest select-all">
            <span>MÃ PIN:</span>
            <span className="text-amber-400 text-base">{sessionCode}</span>
          </div>
        </div>

        {/* Quick URL Copy Bar */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={pairingUrl}
            className="flex-1 px-3 py-2 text-[11px] font-mono rounded-xl bg-slate-100 border border-slate-200 text-slate-700 select-all"
          />
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <a
            href={pairingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở thử Remote trên tab mới</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
