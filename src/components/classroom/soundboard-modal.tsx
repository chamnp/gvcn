'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Square,
  Music,
  Sliders,
  Bell,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function SoundboardModal({
  isOpen,
  onClose,
  className = '4A1',
}: SoundboardModalProps) {
  const [masterVolume, setMasterVolume] = useState<number>(80);
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientIntervalRef = useRef<any>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    if (!isOpen) {
      stopAmbient();
    }
  }, [isOpen]);

  const getGainMultiplier = () => masterVolume / 100;

  // 1. Mindfulness Chime (Chuông định tâm)
  const playMindfulnessBell = () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const gainMult = getGainMultiplier();

      const baseFreq = 432; // Harmonic 432Hz
      const harmonics = [1, 2.02, 3.01, 4.2];

      harmonics.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * ratio, now);

        const initialGain = (0.35 / (i + 1)) * gainMult;
        gain.gain.setValueAtTime(initialGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 4.6);
      });
      toast.info('🔔 Chuông định tâm — Cả lớp cùng lắng dịu...');
    } catch (e) {}
  };

  // 2. Applause & Cheering (Pháo tay hoan hô)
  const playApplause = () => {
    try {
      const ctx = getAudioContext();
      const gainMult = getGainMultiplier();
      const bufferSize = ctx.sampleRate * 2.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 1.5));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4 * gainMult, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success('👏 Tràng pháo tay giòn giã khen ngợi!');
    } catch (e) {}
  };

  // 3. Drum Roll (Trống hồi hộp)
  const playDrumRoll = () => {
    try {
      const ctx = getAudioContext();
      const gainMult = getGainMultiplier();
      let rollTime = 0;

      for (let i = 0; i < 28; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110 + Math.random() * 20, ctx.currentTime + rollTime);

        gain.gain.setValueAtTime(0.08 * (1 + i * 0.05) * gainMult, ctx.currentTime + rollTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + rollTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + rollTime);
        osc.stop(ctx.currentTime + rollTime + 0.09);

        rollTime += Math.max(0.04, 0.12 - i * 0.003);
      }

      // Final crash
      setTimeout(() => {
        try {
          const crashOsc = ctx.createOscillator();
          const crashGain = ctx.createGain();
          crashOsc.type = 'sine';
          crashOsc.frequency.setValueAtTime(320, ctx.currentTime);
          crashGain.gain.setValueAtTime(0.3 * gainMult, ctx.currentTime);
          crashGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          crashOsc.connect(crashGain);
          crashGain.connect(ctx.destination);
          crashOsc.start();
          crashOsc.stop(ctx.currentTime + 0.65);
        } catch (e) {}
      }, rollTime * 1000);
      toast.info('🥁 Trống dồn hồi hộp...');
    } catch (e) {}
  };

  // 4. Victory Fanfare (Kèn chiến thắng)
  const playFanfare = () => {
    try {
      const ctx = getAudioContext();
      const gainMult = getGainMultiplier();
      const notes = [
        { f: 392.0, d: 0.15 },
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.45 },
      ];

      let t = ctx.currentTime;
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.f, t);

        gain.gain.setValueAtTime(0.18 * gainMult, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + n.d + 0.05);

        t += n.d;
      });

      confetti({ particleCount: 100, spread: 85, origin: { y: 0.5 } });
      toast.success('🎺 Kèn chiến thắng vinh quang!');
    } catch (e) {}
  };

  // 5. Try Again (Tít tít nhẹ nhàng)
  const playTryAgain = () => {
    try {
      const ctx = getAudioContext();
      const gainMult = getGainMultiplier();
      const t = ctx.currentTime;

      [330, 261.63].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.18);
        gain.gain.setValueAtTime(0.15 * gainMult, t + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.18 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.18);
        osc.stop(t + idx * 0.18 + 0.2);
      });
      toast.info('💡 Chưa đúng rồi, cùng thử lại nhé!');
    } catch (e) {}
  };

  // Ambient Focus Sound Generator
  const startAmbient = (type: 'LOFI' | 'RAIN' | 'WAVES') => {
    stopAmbient();
    setActiveAmbient(type);

    const ctx = getAudioContext();
    const gainMult = getGainMultiplier();

    if (type === 'LOFI') {
      const chords = [
        [261.63, 329.63, 392.0], // C
        [220.0, 261.63, 329.63], // Am
        [174.61, 220.0, 261.63], // F
        [196.0, 246.94, 293.66], // G
      ];
      let step = 0;

      const playChord = () => {
        if (!isOpen) return;
        const currentChord = chords[step % chords.length];
        const now = ctx.currentTime;

        currentChord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.04 * gainMult, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 4);
        });

        step++;
      };

      playChord();
      ambientIntervalRef.current = setInterval(playChord, 4000);
      toast.success('🎵 Bật nhạc nền tập trung êm dịu (Lo-Fi)');
    } else if (type === 'RAIN') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12 * gainMult, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      ambientIntervalRef.current = {
        stop: () => {
          noise.stop();
        },
      };
      toast.success('🌧️ Bật tiếng mưa nhẹ thư giãn');
    }
  };

  const stopAmbient = () => {
    if (ambientIntervalRef.current) {
      if (typeof ambientIntervalRef.current === 'number') {
        clearInterval(ambientIntervalRef.current);
      } else if (ambientIntervalRef.current.stop) {
        ambientIntervalRef.current.stop();
      }
      ambientIntervalRef.current = null;
    }
    setActiveAmbient(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🔔
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Bảng Âm Thanh Sư Phạm & Nhạc Tập Trung Lớp Học
              </h3>
              <p className="text-xs text-purple-100">
                Lớp {className} • 1-Click phát hiệu ứng âm thanh ra loa lớp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Master Volume Bar */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>Âm lượng tổng (Master Volume):</span>
            </div>
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="font-mono font-bold text-purple-400 w-8 text-right">
                {masterVolume}%
              </span>
            </div>
          </div>

          {/* Soundboard Buttons Grid */}
          <div className="space-y-2">
            <span className="font-black text-slate-300 uppercase tracking-wider text-[11px]">
              Hiệu ứng âm thanh 1-Click:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* 1. Mindfulness Bell */}
              <button
                type="button"
                onClick={playMindfulnessBell}
                className="group p-4 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 hover:from-indigo-600 hover:to-purple-600 border border-indigo-700/60 hover:border-white text-left transition-all shadow-md cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🛎️</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Lắng dịu
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Chuông Chánh Niệm</h4>
                  <p className="text-[11px] text-slate-400 group-hover:text-purple-100 mt-0.5">
                    Lắng dịu sự ồn ào của lớp trong 3 giây
                  </p>
                </div>
              </button>

              {/* 2. Applause */}
              <button
                type="button"
                onClick={playApplause}
                className="group p-4 rounded-2xl bg-gradient-to-br from-amber-900/60 to-orange-900/60 hover:from-amber-500 hover:to-orange-600 border border-amber-700/60 hover:border-white text-left transition-all shadow-md cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl group-hover:scale-110 transition-transform">👏</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30">
                    Khen ngợi
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Tràng Pháo Tay</h4>
                  <p className="text-[11px] text-slate-400 group-hover:text-amber-100 mt-0.5">
                    Hoan hô khi học sinh trả lời xuất sắc
                  </p>
                </div>
              </button>

              {/* 3. Drum Roll */}
              <button
                type="button"
                onClick={playDrumRoll}
                className="group p-4 rounded-2xl bg-gradient-to-br from-rose-900/60 to-pink-900/60 hover:from-rose-600 hover:to-pink-600 border border-rose-700/60 hover:border-white text-left transition-all shadow-md cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🥁</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30">
                    Hồi hộp
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Tiếng Trống Dồn</h4>
                  <p className="text-[11px] text-slate-400 group-hover:text-rose-100 mt-0.5">
                    Tạo kịch tính trước khi công bố kết quả
                  </p>
                </div>
              </button>

              {/* 4. Fanfare */}
              <button
                type="button"
                onClick={playFanfare}
                className="group p-4 rounded-2xl bg-gradient-to-br from-emerald-900/60 to-teal-900/60 hover:from-emerald-600 hover:to-teal-600 border border-emerald-700/60 hover:border-white text-left transition-all shadow-md cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl group-hover:scale-110 transition-transform">🎺</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    Vinh danh
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Kèn Chiến Thắng</h4>
                  <p className="text-[11px] text-slate-400 group-hover:text-emerald-100 mt-0.5">
                    Tuyên dương cá nhân & tổ về nhất
                  </p>
                </div>
              </button>

              {/* 5. Try Again */}
              <button
                type="button"
                onClick={playTryAgain}
                className="group p-4 rounded-2xl bg-gradient-to-br from-cyan-900/60 to-blue-900/60 hover:from-cyan-600 hover:to-blue-600 border border-cyan-700/60 hover:border-white text-left transition-all shadow-md cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl group-hover:scale-110 transition-transform">💡</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/30">
                    Thử lại
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">Tít Tít Thử Lại</h4>
                  <p className="text-[11px] text-slate-400 group-hover:text-cyan-100 mt-0.5">
                    Động viên trả lời lại nhẹ nhàng
                  </p>
                </div>
              </button>

              {/* 6. Stop all */}
              <button
                type="button"
                onClick={stopAmbient}
                className="group p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-left transition-all shadow-md cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">🛑</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    Tắt âm
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-200">Dừng Mọi Âm Thanh</h4>
                  <p className="text-[11px] text-slate-400">
                    Tắt ngay nhạc nền & âm thanh đang phát
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Ambient Music Section for Deep Focus Work */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4 text-purple-400" />
                <span className="font-black text-slate-200">
                  Nhạc nền tập trung làm bài tập (Focus Ambient Loops):
                </span>
              </div>
              {activeAmbient && (
                <button
                  type="button"
                  onClick={stopAmbient}
                  className="text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Dừng phát</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => (activeAmbient === 'LOFI' ? stopAmbient() : startAmbient('LOFI'))}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeAmbient === 'LOFI'
                    ? 'bg-purple-600/30 border-purple-500 text-white font-black'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">🎵</span>
                  <div className="text-left">
                    <div className="font-bold text-xs">Giai Điệu Lo-Fi Thư Thái</div>
                    <div className="text-[10px] text-slate-400">Kích thích sóng não Alpha làm bài</div>
                  </div>
                </div>
                <div className="font-bold text-xs">
                  {activeAmbient === 'LOFI' ? 'Đang phát...' : 'Phát ▶'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => (activeAmbient === 'RAIN' ? stopAmbient() : startAmbient('RAIN'))}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeAmbient === 'RAIN'
                    ? 'bg-cyan-600/30 border-cyan-500 text-white font-black'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">🌧️</span>
                  <div className="text-left">
                    <div className="font-bold text-xs">Tiếng Mưa Nhẹ Ngoài Hiên</div>
                    <div className="text-[10px] text-slate-400">Tiếng ồn trắng thư giãn, tập trung</div>
                  </div>
                </div>
                <div className="font-bold text-xs">
                  {activeAmbient === 'RAIN' ? 'Đang phát...' : 'Phát ▶'}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
