'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Check,
  X,
  Volume2,
  Sparkles,
  Loader2,
  Radio,
  BookOpen,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  placeholderPrompt?: string;
}

const QUICK_PEDAGOGICAL_PHRASES = [
  '🌟 Hoàn thành xuất sắc các nội dung học tập và rèn luyện trong kỳ.',
  '📚 Chăm chỉ, tích cực phát biểu xây dựng bài trong các giờ học.',
  '✍️ Chữ viết sạch đẹp, giữ gìn sách vở và đồ dùng cẩn thận.',
  '🤝 Ngoan ngoãn, lễ phép, hòa đồng và biết giúp đỡ bạn bè.',
  '🎨 Hăng hái, tự tin tham gia các hoạt động tập thể và trải nghiệm của lớp.',
  '💡 Tiếp thu bài nhanh, tư duy tốt, cần cẩn thận hơn trong bài tập tính toán.',
  '🎯 Cần tập trung chú ý lắng nghe cô giảng bài để tiến bộ nhiều hơn.',
  '💪 Có nhiều tiến bộ trong môn Tiếng Việt và rèn luyện chữ viết.',
];

export function VoiceInputButton({
  onResult,
  size = 'md',
  className = '',
  title = 'Nhập bằng giọng nói / Chọn nhận xét mẫu',
  placeholderPrompt = 'Đang lắng nghe... Hãy nói lời nhận xét của bạn.',
}: VoiceInputButtonProps) {
  const { aiConfig, apiKey } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<'VOICE' | 'QUICK_PHRASES'>('VOICE');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'px-3 py-2 text-sm font-bold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // START RECORDING (HYBRID ENGINE)
  const startRecordingSession = async () => {
    setIsRecording(true);
    setLiveText('');
    setRecordSeconds(0);
    audioChunksRef.current = [];

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordSeconds((prev) => prev + 1);
    }, 1000);

    // 1. Try Native Web Speech API for real-time live preview
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let accumulated = '';
          for (let i = 0; i < event.results.length; ++i) {
            accumulated += event.results[i][0].transcript;
          }
          if (accumulated.trim()) {
            const formatted =
              accumulated.trim().charAt(0).toUpperCase() + accumulated.trim().slice(1);
            setLiveText(formatted);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Browser Web Speech API notice (switching to MediaRecorder):', e.error);
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      }
    } catch (e) {
      console.warn('SpeechRecognition init skipped:', e);
    }

    // 2. Start Native MediaRecorder for 100% reliable audio capture
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // Slice every 250ms
    } catch (err: any) {
      console.error('MediaRecorder start error:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Vui lòng cấp quyền truy cập Microphone trên trình duyệt để ghi âm!');
        stopSessionWithoutSaving();
      }
    }
  };

  // STOP RECORDING & FINALIZE TRANSCRIPTION
  const finalizeRecordingSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    // Stop Speech Recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    // If we already have live text transcribed by Web Speech API, use it directly!
    if (liveText && liveText.trim().length > 3) {
      onResult(liveText.trim());
      toast.success(`Đã nhận diện: "${liveText.trim()}"`);
      setIsOpen(false);
      return;
    }

    // If Web Speech API had network error or no text, send audio blob to server API
    if (audioChunksRef.current.length > 0) {
      setIsTranscribing(true);
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const res = await fetch('/api/transcribe-voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                mimeType: audioBlob.type,
                aiConfig,
                apiKey,
              }),
            });

            const data = await res.json();
            if (res.ok && data.text) {
              onResult(data.text);
              toast.success(`Đã nhận diện: "${data.text}"`);
              setIsOpen(false);
            } else {
              // If transcription failed, switch to Quick Phrases tab
              setActiveTab('QUICK_PHRASES');
              toast.info('Chưa có API Key để dịch âm thanh. Vui lòng chọn nhận xét mẫu bên dưới!');
            }
          } catch (apiErr) {
            console.error('Transcription API error:', apiErr);
            setActiveTab('QUICK_PHRASES');
          } finally {
            setIsTranscribing(false);
          }
        };
      } catch (err) {
        console.error('Audio blob processing error:', err);
        setIsTranscribing(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const stopSessionWithoutSaving = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsTranscribing(false);
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
    }
    setIsOpen(false);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setActiveTab('VOICE');
          setTimeout(() => {
            startRecordingSession();
          }, 200);
        }}
        title={title}
        className={`inline-flex items-center justify-center space-x-1.5 rounded-xl transition-all duration-200 cursor-pointer bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 ${sizeClasses[size]} ${className}`}
      >
        <Mic className={iconSizes[size]} />
        {size === 'lg' && <span>Đọc nhận xét</span>}
      </button>

      {/* INTERACTIVE VOICE & QUICK PHRASE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 relative">
            {/* Close button */}
            <button
              type="button"
              onClick={stopSessionWithoutSaving}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* TAB SELECTOR */}
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('VOICE');
                  if (!isRecording) startRecordingSession();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'VOICE'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Micro Ghi Âm Trực Tiếp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('QUICK_PHRASES');
                  if (isRecording) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setIsRecording(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'QUICK_PHRASES'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Mẫu Nhận Xét 1-Chạm TT27</span>
              </button>
            </div>

            {/* TAB 1: VOICE RECORDING */}
            {activeTab === 'VOICE' && (
              <div className="space-y-4 text-center">
                {/* Visualizer & Timer */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  {isRecording ? (
                    <>
                      <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                      <div className="absolute inset-2 rounded-full bg-rose-500/30 animate-pulse" />
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center text-xl shadow-lg shadow-rose-500/40">
                        <Mic className="w-7 h-7 animate-bounce" />
                      </div>
                    </>
                  ) : isTranscribing ? (
                    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <Loader2 className="w-7 h-7 animate-spin" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecordingSession}
                      className="w-14 h-14 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center text-xl border border-slate-200 transition-colors"
                    >
                      <Mic className="w-7 h-7" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="inline-block bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {isRecording ? '🔴 Đang Lắng Nghe' : isTranscribing ? '⚡ Đang Chuyển Thành Chữ...' : '⏹️ Đã Tạm Dừng'}
                    </span>
                    {isRecording && (
                      <span className="font-mono font-bold text-xs text-rose-600">
                        {formatSeconds(recordSeconds)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isRecording ? 'Hãy Đọc Lời Nhận Xét Của Bạn' : isTranscribing ? 'Đang Xử Lý Âm Thanh...' : 'Bấm Micro Để Tiếp Tục Đọc'}
                  </h3>
                </div>

                {/* Live Transcript / Preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[90px] max-h-[140px] overflow-y-auto text-left text-xs text-slate-800 font-medium leading-relaxed">
                  {liveText ? (
                    <p className="text-slate-900 font-bold">{liveText}</p>
                  ) : (
                    <p className="text-slate-400 italic flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 animate-pulse text-slate-400" />
                      <span>{placeholderPrompt}</span>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center space-x-3 pt-1">
                  {isRecording ? (
                    <button
                      type="button"
                      disabled={isTranscribing}
                      onClick={finalizeRecordingSession}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Hoàn Thành & Lưu Nhận Xét</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecordingSession}
                      className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Bấm Để Ghi Âm Lại</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopSessionWithoutSaving}
                    className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-colors cursor-pointer"
                  >
                    <span>Hủy Bỏ</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: QUICK PEDAGOGICAL PHRASES (1-CLICK SELECTION) */}
            {activeTab === 'QUICK_PHRASES' && (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chọn nhanh một mẫu nhận xét chuẩn Thông tư 27 để chèn ngay:</span>
                </p>

                <div className="space-y-1.5">
                  {QUICK_PEDAGOGICAL_PHRASES.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const clean = phrase.replace(/^[^\w\sÀ-ỹ]+/u, '').trim();
                        onResult(clean);
                        toast.success('Đã chèn mẫu nhận xét thành công!');
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-colors text-xs font-semibold text-slate-800 hover:text-blue-900 cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{phrase}</span>
                      <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 shrink-0">
                        Chọn →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
