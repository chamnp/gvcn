'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface VoiceInputOptions {
  lang?: string;
}

export function useVoiceInput({ lang = 'vi-VN' }: VoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);

    const finalText = finalTranscriptRef.current.trim();
    if (finalText && callbackRef.current) {
      callbackRef.current(finalText);
      toast.success(`Đã thêm: "${finalText}"`);
    }
    setLiveTranscript('');
    finalTranscriptRef.current = '';
    callbackRef.current = null;
  }, []);

  const startListening = useCallback(
    async (onResultCallback: (text: string) => void) => {
      if (typeof window === 'undefined') return;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        toast.error('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói. Vui lòng dùng Google Chrome, Microsoft Edge hoặc Safari!');
        return;
      }

      // If already listening, stop first
      if (isListening) {
        stopListening();
        return;
      }

      // Request mic permission explicitly first to prevent immediate silent rejection
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop tracks immediately after permission check
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err: any) {
        console.warn('Mic permission error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast.error('Bạn đã chặn quyền truy cập Microphone. Vui lòng bấm vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ duyệt web để Cho phép Microphone!');
          return;
        }
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true; // Stay alive continuously while speaking
        recognition.interimResults = true; // Show interim words in real-time
        recognition.maxAlternatives = 1;

        callbackRef.current = onResultCallback;
        finalTranscriptRef.current = '';
        setLiveTranscript('');

        recognition.onstart = () => {
          setIsListening(true);
          toast.info('🎤 Đang lắng nghe... Hãy đọc nhận xét, bấm nút đỏ khi hoàn thành.');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let finalAccumulated = finalTranscriptRef.current;

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              finalAccumulated += (finalAccumulated ? ' ' : '') + text.trim();
            } else {
              interim += text;
            }
          }

          finalTranscriptRef.current = finalAccumulated;
          const currentDisplay = (finalAccumulated + (interim ? ' ' + interim : '')).trim();
          
          if (currentDisplay) {
            // Capitalize first letter
            const formatted = currentDisplay.charAt(0).toUpperCase() + currentDisplay.slice(1);
            setLiveTranscript(formatted);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error event:', event.error);
          if (event.error === 'not-allowed') {
            setIsListening(false);
            toast.error('Microphone bị chặn. Vui lòng cấp quyền truy cập trong cài đặt trình duyệt!');
          } else if (event.error === 'network') {
            // Network issue with speech service
            setIsListening(false);
            toast.error('Không thể kết nối đến máy chủ nhận dạng giọng nói. Vui lòng kiểm tra kết nối mạng!');
          }
        };

        recognition.onend = () => {
          // If still marked as listening and no error, finalize
          setIsListening(false);
          const finalText = finalTranscriptRef.current.trim();
          if (finalText && callbackRef.current) {
            callbackRef.current(finalText);
            toast.success(`Đã nhận diện: "${finalText}"`);
            callbackRef.current = null;
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
        toast.error('Không thể khởi động micro. Vui lòng thử lại!');
      }
    },
    [isListening, lang, stopListening]
  );

  return {
    isListening,
    liveTranscript,
    isSupported,
    startListening,
    stopListening,
  };
}
