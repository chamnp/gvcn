'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  X,
  Award,
  AlertTriangle,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sliders,
  Flame,
} from 'lucide-react';
import { Student } from '@/types';
import { useAppStore } from '@/lib/store';
import { getLocalDateString } from '@/lib/tt27-engine';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface NoiseMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  students: Student[];
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  emoji: string;
}

const BALL_EMOJIS = ['😊', '⭐', '🎈', '🐱', '🚀', '🌟', '🦄', '🍎', '🌻', '🐶', '🐼', '🐬'];
const BALL_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#EAB308'];

export function NoiseMeterModal({
  isOpen,
  onClose,
  className = '4A1',
  students,
}: NoiseMeterModalProps) {
  const { addStarLog } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(50); // 0 - 100
  const [preset, setPreset] = useState<'QUIET' | 'WHISPER' | 'GROUP'>('WHISPER');

  // Streak timer
  const [streakTargetMinutes, setStreakTargetMinutes] = useState<number>(5);
  const [streakSeconds, setStreakSeconds] = useState<number>(0);
  const [isStreakGoalReached, setIsStreakGoalReached] = useState<boolean>(false);
  const [overCount, setOverCount] = useState<number>(0);
  const [isOverThreshold, setIsOverThreshold] = useState<boolean>(false);

  // Audio Context & Stream Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const ballsRef = useRef<Ball[]>([]);

  // Initialize Bouncy Balls
  useEffect(() => {
    if (!isOpen) return;
    const balls: Ball[] = [];
    for (let i = 0; i < 16; i++) {
      balls.push({
        x: Math.random() * 500 + 50,
        y: 250 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        radius: 18 + Math.random() * 6,
        color: BALL_COLORS[i % BALL_COLORS.length],
        emoji: BALL_EMOJIS[i % BALL_EMOJIS.length],
      });
    }
    ballsRef.current = balls;
  }, [isOpen]);

  const playSoftChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(392.00, audioCtx.currentTime + 0.3); // G4
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);
    } catch (e) {}
  };

  const playFanfare = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [392.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.45);
      });
    } catch (e) {}
  };

  // Start / Stop Microphone Listening
  const startListening = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      setIsListening(true);
      toast.success('Đã kết nối Microphone! Bắt đầu đo âm lượng lớp học.');
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicError('Không thể truy cập Microphone máy tính. Vui lòng cho phép quyền truy cập micro trên trình duyệt.');
      toast.error('Chưa cấp quyền Microphone cho trang web.');
    }
  };

  const stopListening = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsListening(false);
  };

  // Preset Selection
  const handlePreset = (mode: 'QUIET' | 'WHISPER' | 'GROUP') => {
    setPreset(mode);
    if (mode === 'QUIET') setThreshold(30);
    else if (mode === 'WHISPER') setThreshold(50);
    else if (mode === 'GROUP') setThreshold(75);
  };

  // Main Audio Loop & Canvas Animation
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      return;
    }

    let lastOverTime = 0;

    const dataArray = new Uint8Array(128);

    const render = (time: number) => {
      let vol = 0;

      if (isListening && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        vol = Math.min(100, Math.round((avg / 128) * 100));
        setCurrentVolume(vol);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.clearRect(0, 0, width, height);

          // Floor Line
          ctx.beginPath();
          ctx.moveTo(0, height - 12);
          ctx.lineTo(width, height - 12);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Threshold Line
          const thresholdY = height - 20 - (threshold / 100) * (height - 60);
          ctx.beginPath();
          ctx.setLineDash([6, 6]);
          ctx.moveTo(0, thresholdY);
          ctx.lineTo(width, thresholdY);
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);

          // Threshold label
          ctx.fillStyle = '#EF4444';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`Giới hạn trật tự (${threshold}%)`, 12, thresholdY - 6);

          // Physics update for balls
          const energy = (vol / 100) * 16;
          const isOver = vol > threshold;

          if (isOver && time - lastOverTime > 3000) {
            lastOverTime = time;
            setIsOverThreshold(true);
            setOverCount((c) => c + 1);
            playSoftChime();
            setTimeout(() => setIsOverThreshold(false), 2000);
          }

          ballsRef.current.forEach((b) => {
            // Apply bounce force from sound energy
            if (b.y >= height - 20 - b.radius && energy > 1) {
              b.vy = -Math.min(18, energy * (0.8 + Math.random() * 0.6));
              b.vx += (Math.random() - 0.5) * 2;
            }

            // Gravity
            b.vy += 0.45;
            b.x += b.vx;
            b.y += b.vy;

            // Bounce on bottom
            if (b.y > height - 14 - b.radius) {
              b.y = height - 14 - b.radius;
              b.vy = -b.vy * 0.6;
              b.vx *= 0.95;
            }

            // Bounce on walls
            if (b.x < b.radius) {
              b.x = b.radius;
              b.vx = -b.vx * 0.7;
            } else if (b.x > width - b.radius) {
              b.x = width - b.radius;
              b.vx = -b.vx * 0.7;
            }

            // Draw Ball
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fillStyle = isOver ? '#EF4444' : b.color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Emoji inside ball
            ctx.font = `${b.radius * 1.1}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.emoji, b.x, b.y + 1);
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, isListening, threshold]);

  // Peace Streak Timer Interval
  useEffect(() => {
    if (!isOpen || !isListening) return;

    const interval = setInterval(() => {
      setStreakSeconds((prev) => {
        const next = prev + 1;
        if (next >= streakTargetMinutes * 60 && !isStreakGoalReached) {
          setIsStreakGoalReached(true);
          playFanfare();
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
          toast.success(`🎉 Xuất sắc! Cả lớp đã giữ trật tự đủ ${streakTargetMinutes} phút!`);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isListening, streakTargetMinutes, isStreakGoalReached]);

  // Award Stars to all students
  const handleAwardClassStars = () => {
    if (students.length === 0) return;
    const today = getLocalDateString();
    students.forEach((s) => {
      addStarLog(s.id, 1, 'Nề nếp', 'Giữ trật tự lớp học xuất sắc', 'Đạt mục tiêu nề nếp trên máy đo âm thanh', today);
    });
    confetti({ particleCount: 100, spread: 80 });
    toast.success(`Đã thưởng +1 ⭐ nề nếp cho tất cả ${students.length} học sinh lớp ${className}!`);
  };

  const handleReset = () => {
    setStreakSeconds(0);
    setOverCount(0);
    setIsStreakGoalReached(false);
    setIsOverThreshold(false);
    toast.info('Đã đặt lại đồng hồ giữ trật tự.');
  };

  if (!isOpen) return null;

  const streakMins = Math.floor(streakSeconds / 60);
  const streakSecs = streakSeconds % 60;
  const progressPercent = Math.min(100, Math.round((streakSeconds / (streakTargetMinutes * 60)) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🔊
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Máy Đo Tiếng Ồn Trực Quan & Cảnh Báo Trật Tự
              </h3>
              <p className="text-xs text-emerald-100">
                Lớp {className} • Chiếu trực tiếp trên Smart TV / Máy chiếu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="Đặt lại bộ đếm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Alert Banner when over threshold */}
          {isOverThreshold && (
            <div className="p-4 rounded-2xl bg-rose-600/90 text-white font-black text-center text-sm sm:text-base flex items-center justify-center gap-2 animate-bounce border-2 border-rose-300 shadow-xl">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
              <span>🤫 SUỴT! LỚP MÌNH NÓI NHỎ LẠI NHÉ! TIẾNG ỒN ĐANG VƯỢT MỨC!</span>
            </div>
          )}

          {/* Goal Achieved Banner */}
          {isStreakGoalReached && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 text-slate-950 font-black text-center space-y-1 shadow-xl animate-in zoom-in-95">
              <div className="text-2xl">🎉 🌟 🏆</div>
              <div className="text-base sm:text-lg uppercase font-black">
                XUẤT SẮC! CẢ LỚP ĐÃ GIỮ TRẬT TỰ ĐỦ {streakTargetMinutes} PHÚT!
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAwardClassStars}
                  className="px-6 py-2.5 rounded-xl bg-slate-950 text-amber-400 hover:bg-slate-900 font-black text-xs uppercase tracking-wider shadow-lg transition-all transform active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>+1 ⭐ Thưởng Sao Cho Cả Lớp Vào Sổ Nề Nếp</span>
                </button>
              </div>
            </div>
          )}

          {/* Canvas Section with Bouncy Balls */}
          <div className="relative bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden flex flex-col items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              width={700}
              height={260}
              className="w-full max-h-[260px] object-contain"
            />

            {/* Volume Status Overlay */}
            <div className="absolute top-3 right-4 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">Âm lượng:</span>
                <span
                  className={`font-mono font-black text-sm ${
                    currentVolume > threshold ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {currentVolume}%
                </span>
              </div>
              <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    currentVolume > threshold ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${currentVolume}%` }}
                />
              </div>
            </div>
          </div>

          {/* Controls & Preset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box: Mic & Sensitivity Controls */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-200">Trạng thái Microphone:</span>
                {isListening ? (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Tắt Microphone</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startListening}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all animate-pulse"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Bật Microphone 🎙️</span>
                  </button>
                )}
              </div>

              {micError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] leading-relaxed">
                  {micError}
                </div>
              )}

              {/* Presets */}
              <div className="space-y-1.5 pt-1 border-t border-slate-700/60">
                <span className="font-bold text-slate-400">Chọn chế độ hoạt động:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePreset('QUIET')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      preset === 'QUIET'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-black'
                        : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div>🤫 Yên tĩnh</div>
                    <div className="text-[10px] opacity-75">Ngưỡng 30%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePreset('WHISPER')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      preset === 'WHISPER'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-black'
                        : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div>💬 Thì thầm</div>
                    <div className="text-[10px] opacity-75">Ngưỡng 50%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePreset('GROUP')}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      preset === 'GROUP'
                        ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-black'
                        : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div>🗣️ Thảo luận</div>
                    <div className="text-[10px] opacity-75">Ngưỡng 75%</div>
                  </button>
                </div>
              </div>

              {/* Slider */}
              <div className="pt-2 border-t border-slate-700/60 space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Điều chỉnh ngưỡng nhạy:</span>
                  <span className="text-emerald-400 font-mono">{threshold}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Right Box: Peace Streak & Goal Target */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-200">Mục tiêu giữ trật tự:</span>
                  <div className="flex gap-1">
                    {[3, 5, 10, 15].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setStreakTargetMinutes(m);
                          setIsStreakGoalReached(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          streakTargetMinutes === m
                            ? 'bg-cyan-600 text-white font-black'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {m}p
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700 text-center space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    Thời gian giữ trật tự liên tục:
                  </div>
                  <div className="font-mono font-black text-3xl sm:text-4xl text-cyan-400">
                    {streakMins < 10 ? '0' : ''}{streakMins}:{streakSecs < 10 ? '0' : ''}{streakSecs}
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>Tiến độ: {progressPercent}%</span>
                      <span>Số lần quá ồn: {overCount} lần</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAwardClassStars}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>+1 ⭐ Thưởng Sao Nề Nếp Cho Cả Lớp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
