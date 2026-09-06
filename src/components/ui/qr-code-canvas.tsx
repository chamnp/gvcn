'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeCanvasProps {
  url: string;
  size?: number;
  className?: string;
  showActions?: boolean;
  title?: string;
}

export function QRCodeCanvas({
  url,
  size = 200,
  className = '',
  showActions = true,
  title = 'Mã QR Lớp học',
}: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      url,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#1e293b', // slate-800
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) {
          console.error('Lỗi tạo mã QR:', err);
        } else if (canvasRef.current) {
          setDataUrl(canvasRef.current.toDataURL('image/png'));
        }
      }
    );
  }, [url, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Đã tải ảnh mã QR xuống thiết bị!');
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Không thể mở cửa sổ in. Vui lòng cho phép popup!');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              padding: 24px;
              text-align: center;
            }
            h1 { font-size: 24px; margin-bottom: 8px; color: #1e293b; }
            p { font-size: 14px; color: #64748b; margin-bottom: 24px; }
            img { width: 280px; height: 280px; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px; }
            .url { font-family: monospace; font-size: 12px; margin-top: 16px; color: #475569; word-break: break-all; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Quét mã bằng Zalo hoặc Camera điện thoại để xem Bảng vinh danh & Đổi quà</p>
          <img src="${dataUrl}" alt="${title}" />
          <div class="url">${url}</div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
        <canvas ref={canvasRef} className="rounded-xl block" />
      </div>

      {showActions && (
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-purple-200"
            title="Tải ảnh QR"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải ảnh PNG</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
            title="In mã QR"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In mã</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
            title="Sao chép liên kết"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? 'Đã chép' : 'Chép link'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
