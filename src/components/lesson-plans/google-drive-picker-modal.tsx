'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Tv,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  GoogleDriveFile,
  fetchTeacherDriveFiles,
  isGoogleTokenExpired,
} from '@/lib/google-drive-client';
import { transformToEmbedUrl } from '@/lib/lesson-package-engine';
import { toast } from 'sonner';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: GoogleDriveFile) => void;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  const { user, profile, googleAccessToken, connectGoogleDrive } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SLIDES' | 'DOCS' | 'PDF'>('ALL');
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);

  const teacherEmail = profile?.email || user?.email || 'Tài khoản Google của bạn';
  const isConnected = Boolean(googleAccessToken) && !isGoogleTokenExpired();

  // Load files whenever search keyword or filter changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    fetchTeacherDriveFiles(googleAccessToken, keyword, filterType)
      .then((data) => {
        if (isMounted) {
          setFiles(data);
          setIsLoading(false);
          // Auto select first file if none selected
          if (data.length > 0 && !selectedFile) {
            setSelectedFile(data[0]);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, googleAccessToken, keyword, filterType]);

  if (!isOpen) return null;

  const handleConfirmSelect = () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn một bài giảng từ danh sách!');
      return;
    }
    onSelectFile(selectedFile);
    toast.success(`Đã nạp bài dạy: ${selectedFile.name}`);
    onClose();
  };

  const handleImportFromPasteUrl = () => {
    if (!pasteUrl.trim()) return;
    const transformed = transformToEmbedUrl(pasteUrl.trim());
    const file: GoogleDriveFile = {
      id: `pasted-${Date.now()}`,
      name: transformed.title || 'Bài giảng Google Slides / Drive',
      mimeType: 'application/vnd.google-apps.presentation',
      type: transformed.type,
      webViewLink: transformed.originalUrl,
      embedUrl: transformed.embedUrl,
    };
    onSelectFile(file);
    toast.success(`Đã nạp bài dạy: ${file.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[750px] bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white">
        {/* TOP BAR */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 truncate pr-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <span className="text-xl">📁</span>
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Kho Google Drive Của Tôi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Keep-Login Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Tài khoản: <strong className="text-slate-700 dark:text-slate-300">{teacherEmail}</strong> • Nhập nhanh Google Slides, PowerPoint, Docs, PDF
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {!isConnected && (
              <button
                type="button"
                onClick={() => {
                  connectGoogleDrive();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                title="Cấp quyền truy cập Google Drive"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kết Nối Ổ Đĩa</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ZERO-AUTH QUICK LINK PASTE BAR */}
        <div className="px-4 py-2.5 bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200 shrink-0">
            <span>🔗</span>
            <span>Dán Link Nhanh (Không cần xác minh Google):</span>
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="url"
              placeholder="Dán link Google Slides, Google Drive, PowerPoint (.pptx) hoặc Docs..."
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-xs font-mono text-blue-700 dark:text-blue-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
            <button
              type="button"
              onClick={handleImportFromPasteUrl}
              disabled={!pasteUrl.trim()}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all shrink-0"
            >
              Nạp Ngay
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER STRIP */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài giảng trong Drive (vd: Toán 4, Khoa học, Bài 12...)..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterType === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              🌟 Tất Cả
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SLIDES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                filterType === 'SLIDES'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <span>📊 Slide & PPTX</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('DOCS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                filterType === 'DOCS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <span>📄 Docs & Word</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('PDF')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                filterType === 'PDF'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <span>📕 Sách PDF</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY: 2 PANELS (FILE LIST & PREVIEW) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: File Grid / List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 border-r border-slate-200 dark:border-slate-800">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs font-bold text-slate-500">Đang quét kho Google Drive của bạn...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Không tìm thấy bài giảng nào phù hợp
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hãy thử gõ từ khóa khác hoặc bấm nút &quot;Kết Nối Drive&quot; để cấp quyền đọc bài giảng.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((file) => {
                  const isSelected = selectedFile?.id === file.id;
                  const isSlide = file.type === 'GOOGLE_SLIDES' || file.type === 'POWERPOINT';

                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      onDoubleClick={handleConfirmSelect}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/30 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/70 hover:shadow-xs'
                      }`}
                    >
                      {/* Top info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2 truncate">
                          <span className="text-lg shrink-0">
                            {file.type === 'GOOGLE_SLIDES'
                              ? '📊'
                              : file.type === 'POWERPOINT'
                              ? '📽️'
                              : file.type === 'GOOGLE_DOCS'
                              ? '📄'
                              : file.type === 'WORD'
                              ? '📝'
                              : '📕'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isSlide
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {file.type === 'GOOGLE_SLIDES'
                              ? 'Google Slides'
                              : file.type === 'POWERPOINT'
                              ? 'PowerPoint'
                              : file.type === 'GOOGLE_DOCS'
                              ? 'Google Docs'
                              : file.type === 'WORD'
                              ? 'Word'
                              : 'PDF'}
                          </span>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>

                      {/* File Name */}
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {file.name}
                      </p>

                      {/* Footer meta */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <span>{file.size || 'Google Cloud'}</span>
                        <span className="truncate">
                          {file.modifiedTime
                            ? new Date(file.modifiedTime).toLocaleDateString('vi-VN')
                            : 'Gần đây'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Selected File Detail & Action */}
          <div className="w-full md:w-80 p-5 bg-slate-50/70 dark:bg-slate-900/30 flex flex-col justify-between space-y-4 shrink-0 overflow-y-auto">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    Đã chọn để nạp
                  </span>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                    {selectedFile.name}
                  </h4>
                </div>

                {/* Thumbnail Preview */}
                {selectedFile.thumbnailLink && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black shadow-inner">
                    <img
                      src={selectedFile.thumbnailLink}
                      alt={selectedFile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* File Details */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Định dạng:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFile.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kích thước:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedFile.size || 'Mây Google'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chế độ chiếu:</span>
                    <span className="font-bold text-emerald-600">Sạch Menu 16:9</span>
                  </div>
                </div>

                {/* Direct Link External */}
                <a
                  href={selectedFile.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở xem trên Google Drive</span>
                </a>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                <Sparkles className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold">Hãy nhấp chọn một bài giảng bên trái để xem thông tin</p>
              </div>
            )}

            {/* Bottom Confirm Buttons */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleConfirmSelect}
                disabled={!selectedFile}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4" />
                <span>NẠP VÀO BÀI DẠY / CHIẾU TV</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
