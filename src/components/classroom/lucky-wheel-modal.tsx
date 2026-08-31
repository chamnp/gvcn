'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Users,
  Award,
} from 'lucide-react';
import { Student } from '@/types';
import { useAppStore } from '@/lib/store';
import { getLocalDateString } from '@/lib/tt27-engine';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  className?: string;
  spinTrigger?: number;
  onWinnerSelected?: (winner: Student) => void;
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#D946EF', '#EAB308', '#64748B', '#0EA5E9',
];

function getShortName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length > 2) {
    return parts[parts.length - 2] + ' ' + parts[parts.length - 1];
  }
  return fullName;
}

export function LuckyWheelModal({
  isOpen,
  onClose,
  students,
  spinTrigger,
  onWinnerSelected,
}: LuckyWheelModalProps) {
  const { addStarLog } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [availableStudents, setAvailableStudents] = useState<Student[]>(students);
  const [pickedStudents, setPickedStudents] = useState<Student[]>([]);
  const [pickMode, setPickMode] = useState<1 | 3 | 5>(1);
  const [removeAfterPick, setRemoveAfterPick] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Student | null>(null);
  const [multiWinners, setMultiWinners] = useState<Student[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [awardedWinnerIds, setAwardedWinnerIds] = useState<string[]>([]);

  const rotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Trigger spin when remote command is received
  useEffect(() => {
    if (spinTrigger && spinTrigger > 0 && !isSpinning && availableStudents.length > 0) {
      spin();
    }
  }, [spinTrigger]);

  const handleAwardStar = (st: Student) => {
    if (awardedWinnerIds.includes(st.id)) return;
    const today = getLocalDateString();
    addStarLog(st.id, 1, 'Khen thưởng', 'Vòng quay may mắn gọi tên phát biểu tích cực', 'Học sinh tích cực phát biểu xây dựng bài', today);
    setAwardedWinnerIds((prev) => [...prev, st.id]);
    confetti({ particleCount: 50, spread: 60 });
    toast.success(`Đã cộng +1 ⭐ vào Sổ nề nếp cho em ${st.fullName}!`);
  };

  useEffect(() => {
    setAvailableStudents(students);
    setPickedStudents([]);
    setWinner(null);
    setMultiWinners([]);
    setAwardedWinnerIds([]);
  }, [students, isOpen]);

  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  };

  const playFanfareSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.35);
      });
    } catch (e) {}
  };

  // Draw Canvas Wheel
  useEffect(() => {
    if (!isOpen || !canvasRef.current || availableStudents.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const totalSlices = availableStudents.length;
    const sliceAngle = (2 * Math.PI) / totalSlices;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRef.current);

    availableStudents.forEach((st, i) => {
      const angle = i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + sliceAngle);
      ctx.closePath();

      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 3;
      ctx.fillText(getShortName(st.fullName), radius - 20, 4);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  }, [availableStudents, isOpen]);

  const spin = () => {
    if (isSpinning || availableStudents.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    setMultiWinners([]);

    if (pickMode > 1) {
      const shuffled = [...availableStudents].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(pickMode, availableStudents.length));

      let currentSpeed = 0.4;
      let lastTickAngle = 0;

      const animate = () => {
        rotationRef.current += currentSpeed;
        currentSpeed *= 0.985;

        if (Math.abs(rotationRef.current - lastTickAngle) > 0.3) {
          playTickSound();
          lastTickAngle = rotationRef.current;
        }

        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(centerX, centerY) - 15;
            const totalSlices = availableStudents.length;
            const sliceAngle = (2 * Math.PI) / totalSlices;

            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotationRef.current);

            availableStudents.forEach((st, i) => {
              const angle = i * sliceAngle;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.arc(0, 0, radius, angle, angle + sliceAngle);
              ctx.closePath();
              ctx.fillStyle = COLORS[i % COLORS.length];
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.save();
              ctx.rotate(angle + sliceAngle / 2);
              ctx.textAlign = 'right';
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 12px sans-serif';
              ctx.fillText(getShortName(st.fullName), radius - 20, 4);
              ctx.restore();
            });

            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (currentSpeed > 0.003) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          setMultiWinners(selected);
          if (selected.length > 0) {
            onWinnerSelected?.(selected[0]);
          }
          playFanfareSound();
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

          if (removeAfterPick) {
            setPickedStudents((prev) => [...prev, ...selected]);
            setAvailableStudents((prev) => prev.filter((s) => !selected.some((w) => w.id === s.id)));
          }
        }
      };

      animate();
      return;
    }

    // Pick single student mode
    const totalSlices = availableStudents.length;
    const sliceAngle = (2 * Math.PI) / totalSlices;
    const targetWinnerIndex = Math.floor(Math.random() * totalSlices);
    const winningStudent = availableStudents[targetWinnerIndex];

    let currentSpeed = 0.45;
    let lastTickAngle = 0;

    const animate = () => {
      rotationRef.current += currentSpeed;
      currentSpeed *= 0.988;

      if (Math.abs(rotationRef.current - lastTickAngle) > 0.25) {
        playTickSound();
        lastTickAngle = rotationRef.current;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(centerX, centerY) - 15;

          ctx.clearRect(0, 0, width, height);
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(rotationRef.current);

          availableStudents.forEach((st, i) => {
            const angle = i * sliceAngle;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angle, angle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.rotate(angle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(getShortName(st.fullName), radius - 20, 4);
            ctx.restore();
          });

          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        }
      }

      if (currentSpeed > 0.002) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWinner(winningStudent);
        onWinnerSelected?.(winningStudent);
        playFanfareSound();
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });

        if (removeAfterPick) {
          setPickedStudents((prev) => [...prev, winningStudent]);
          setAvailableStudents((prev) => prev.filter((s) => s.id !== winningStudent.id));
        }
      }
    };

    animate();
  };

  const handleReset = () => {
    setAvailableStudents(students);
    setPickedStudents([]);
    setWinner(null);
    setMultiWinners([]);
    toast.success('Đã nạp lại toàn bộ danh sách học sinh!');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🎡
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-lg tracking-tight">
                Vòng Quay May Mắn — Gọi Tên Học Sinh Phát Biểu
              </h3>
              <p className="text-xs text-blue-100">
                Còn {availableStudents.length}/{students.length} học sinh trong danh sách quay
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row items-center gap-6">
          {/* Wheel Canvas Section */}
          <div className="relative flex items-center justify-center shrink-0">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 pointer-events-none filter drop-shadow-md">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400" />
            </div>

            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="rounded-full shadow-2xl border-4 border-slate-700 bg-slate-800 max-w-[280px] sm:max-w-[340px]"
            />
          </div>

          {/* Controls & Winners Display Section */}
          <div className="flex-1 w-full space-y-4 text-xs">
            {winner && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-center space-y-2 shadow-xl animate-in zoom-in-95">
                <div className="text-3xl">🎉</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                  Chúc mừng em lên bảng phát biểu!
                </div>
                <h2 className="text-xl sm:text-2xl font-black truncate">
                  {winner.fullName}
                </h2>
                <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                  Mã HS: {winner.studentCode} • {winner.gender}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={awardedWinnerIds.includes(winner.id)}
                    onClick={() => handleAwardStar(winner)}
                    className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      awardedWinnerIds.includes(winner.id)
                        ? 'bg-emerald-700 text-white opacity-90'
                        : 'bg-slate-950 text-amber-300 hover:bg-slate-900 active:scale-95'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>
                      {awardedWinnerIds.includes(winner.id)
                        ? 'Đã cộng 1 ⭐ vào sổ!'
                        : '+1 ⭐ Thưởng Sao Vào Sổ'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {multiWinners.length > 0 && (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white space-y-2 shadow-xl animate-in zoom-in-95">
                <div className="text-center font-black text-sm text-amber-300 uppercase">
                  🌟 {multiWinners.length} Bạn Học Sinh Được Chọn:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {multiWinners.map((w, idx) => (
                    <div key={w.id} className="bg-white/15 p-2 rounded-xl font-bold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-xs font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{w.fullName}</span>
                      </div>
                      <button
                        type="button"
                        disabled={awardedWinnerIds.includes(w.id)}
                        onClick={() => handleAwardStar(w)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 cursor-pointer ${
                          awardedWinnerIds.includes(w.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                        }`}
                      >
                        {awardedWinnerIds.includes(w.id) ? '✓ 1⭐' : '+1⭐'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pick Settings */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Số lượng gọi mỗi lần:</span>
                <div className="flex gap-1.5">
                  {([1, 3, 5] as const).map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={isSpinning}
                      onClick={() => setPickMode(num)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        pickMode === num
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {num} Bạn
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                <label className="flex items-center space-x-2 font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeAfterPick}
                    onChange={(e) => setRemoveAfterPick(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Không lặp lại bạn đã gọi</span>
                </label>

                {pickedStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-slate-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nạp lại ({pickedStudents.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Spin Button */}
            <button
              type="button"
              disabled={isSpinning || availableStudents.length === 0}
              onClick={spin}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-slate-950 font-black text-base uppercase tracking-wider shadow-lg shadow-orange-500/25 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>{isSpinning ? 'Đang quay may mắn...' : 'BẮT ĐẦU QUAY SỐ 🎡'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
