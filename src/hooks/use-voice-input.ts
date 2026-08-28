'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface VoiceInputOptions {
  lang?: string;
  onTranscript?: (transcript: string) => void;
  appendMode?: boolean;
}

export function useVoiceInput({
  lang = 'vi-VN',
  onTranscript,
  appendMode = true,
}: VoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      setIsListening(false);
    }
  }, [isListening]);

  const startListening = useCallback(
    (customCallback?: (text: string) => void) => {
      if (typeof window === 'undefined') return;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        toast.error('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng thử trên Chrome, Edge hoặc Safari!');
        return;
      }

      // If already listening, toggle off
      if (isListening) {
        stopListening();
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          toast.info('🎤 Đang lắng nghe... Hãy đọc lời nhận xét của bạn.');
        };

        recognition.onresult = (event: any) => {
          const results = event.results;
          if (results && results[0] && results[0][0]) {
            const spokenText = results[0][0].transcript.trim();
            if (spokenText) {
              // Capitalize first letter
              const formattedText = spokenText.charAt(0).toUpperCase() + spokenText.slice(1);
              setTranscript(formattedText);

              if (customCallback) {
                customCallback(formattedText);
              } else if (onTranscript) {
                onTranscript(formattedText);
              }

              toast.success(`Đã nhận diện: "${formattedText}"`);
            }
          }
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Vui lòng cấp quyền truy cập Microphone trong trình duyệt để sử dụng tính năng này!');
          } else if (event.error === 'no-speech') {
            toast.warning('Không nghe thấy giọng nói, vui lòng thử lại gần micro hơn!');
          } else {
            console.warn('Voice recognition error:', event.error);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
        toast.error('Không thể kích hoạt micro. Vui lòng thử lại!');
      }
    },
    [isListening, lang, onTranscript, stopListening]
  );

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
  };
}
