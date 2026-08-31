'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Volume2,
  Award,
  Radio,
  Eye,
  EyeOff,
  Flame,
  CheckCircle2,
  Crosshair,
  Sun,
  Search,
  Users,
  Clock,
  HelpCircle,
  Tv,
} from 'lucide-react';
import {
  RemoteSyncSession,
  RemoteMessage,
  RemoteStatePayload,
  triggerHaptic,
} from '@/lib/remote-sync';
import { SoundEffectType } from '@/lib/sound-effects';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

type RemoteTab = 'SLIDES' | 'LASER' | 'GAMES' | 'REWARDS';

function RemoteControlPageContent() {
  const searchParams = useSearchParams();
  const initialSession = searchParams.get('s') || '';

  const { classInfo, students, addStarLog } = useAppStore();
  const { profile } = useAuth();

  // Session & Connection State
  const [sessionCode, setSessionCode] = useState(initialSession);
  const [inputCode, setInputCode] = useState(initialSession || '4A1-101');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<RemoteTab>('SLIDES');

  // TV State Synced from Host
  const [tvState, setTvState] = useState<RemoteStatePayload>({
    sessionCode: '',
    className: classInfo.name || '4A1',
    teacherName: profile?.fullName || 'Cô Nguyễn Ngọc Ánh',
    activeContext: 'LESSON_PLAN',
    currentSlide: 0,
    totalSlides: 6,
    slideTitle: 'Bài 1: Ôn tập các số đến 100 000 (Tiết 1)',
    phase: 'KHÁM PHÁ',
    presenterNotes: [
      'Gợi ý HS nhận xét các hàng và lớp của số có 6 chữ số.',
      'Yêu cầu 1 HS đọc to và phân tích cấu tạo số mẫu.',
      'Dành 2 phút cho thảo luận nhóm đôi.',
    ],
    quizQuestion: 'Chữ số 5 trong số 354 820 thuộc hàng nào?',
    quizOptions: ['A. Hàng chục', 'B. Hàng nghìn', 'C. Hàng chục nghìn', 'D. Hàng trăm nghìn'],
    correctAnswerIndex: 2,
    isAnswerRevealed: false,
    isTimerRunning: false,
    timeRemaining: 300,
    timerDuration: 300,
    luckyWheelWinner: 'Trần Bảo Châu',
    trafficLightStatus: 'GREEN',
  });

  // Laser Pointer State
  const [pointerMode, setPointerMode] = useState<'LASER' | 'SPOTLIGHT'>('LASER');
  const [isPointerActive, setIsPointerActive] = useState(false);
  const touchpadRef = useRef<HTMLDivElement>(null);

  // Student Search State for Rewards Tab
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<number | 'ALL'>('ALL');

  // Remote Sync Session Ref
  const sessionRef = useRef<RemoteSyncSession | null>(null);

  // Wake Lock Ref to keep screen on while teaching
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Ignore wake lock errors
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // Connect / Disconnect Handler
  const connectSession = useCallback((code: string) => {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    setSessionCode(cleanCode);

    if (sessionRef.current) {
      sessionRef.current.close();
    }

    sessionRef.current = new RemoteSyncSession(
      cleanCode,
      'PHONE_REMOTE',
      (msg: RemoteMessage) => {
        if (msg.type === 'STATE_SYNC' && msg.payload) {
          setTvState((prev) => ({ ...prev, ...msg.payload }));
          setIsConnected(true);
        }
      },
      (connected: boolean) => {
        setIsConnected(connected);
      }
    );

    triggerHaptic(50);
  }, []);

  useEffect(() => {
    if (initialSession) {
      connectSession(initialSession);
    }
    return () => {
      sessionRef.current?.close();
    };
  }, [initialSession, connectSession]);

  // Dispatch Action to TV
  const sendAction = (type: any, payload?: any) => {
    triggerHaptic(30);
    sessionRef.current?.sendAction(type, payload);
  };

  // Touchpad Event Handlers for Virtual Laser
  const handleTouchpadMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchpadRef.current) return;
    const rect = touchpadRef.current.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    sendAction('LASER_MOVE', {
      x,
      y,
      active: true,
      mode: pointerMode,
    });
  };

  const handleTouchpadEnd = () => {
    setIsPointerActive(false);
    sendAction('LASER_MOVE', {
      x: 50,
      y: 50,
      active: false,
      mode: pointerMode,
    });
  };

  // Filtered Students for Rewards
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(studentSearch.toLowerCase());
    const matchTeam = selectedTeam === 'ALL' || (s.teamId ?? 1) === selectedTeam;
    return matchSearch && matchTeam;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans select-none overflow-hidden max-w-lg mx-auto border-x border-slate-800 shadow-2xl">
      {/* ─── 1. TOP HEADER & STATUS BAR ────────────────────────────────────── */}
      <header className="p-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xs tracking-wide text-slate-100">
                {isConnected ? `TV LỚP ${tvState.className}` : 'CHƯA KẾT NỐI'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                {sessionCode || '---'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
              {tvState.slideTitle || 'Kế hoạch bài dạy'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => {
              const code = prompt('Nhập mã PIN hiển thị trên màn hình TV:', sessionCode || '4A1-101');
              if (code) connectSession(code);
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition-all cursor-pointer"
          >
            Đổi Mã
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN ACTIVE CONTROLLER TAB BODY ───────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: SLIDES & LESSON PLAN PRESENTATION */}
        {activeTab === 'SLIDES' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Slide Index & Phase Info */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  {tvState.phase || 'BÀI HỌC'}
                </span>
                <h4 className="font-bold text-sm text-slate-100 mt-1 truncate max-w-[220px]">
                  {tvState.slideTitle}
                </h4>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {(tvState.currentSlide ?? 0) + 1}
                </span>
                <span className="text-xs text-slate-500 font-mono"> / {tvState.totalSlides ?? 1}</span>
              </div>
            </div>

            {/* Giant Thumb-Friendly Prev / Next Navigation Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => sendAction('SLIDE_PREV')}
                className="py-6 rounded-3xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-700/80 text-white font-black text-sm flex flex-col items-center justify-center space-y-1 shadow-lg transition-all cursor-pointer"
              >
                <ChevronLeft className="w-8 h-8 text-slate-400" />
                <span>◀ SLIDE TRƯỚC</span>
              </button>

              <button
                onClick={() => sendAction('SLIDE_NEXT')}
                className="py-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-black text-sm flex flex-col items-center justify-center space-y-1 shadow-xl shadow-blue-900/40 border border-blue-400/30 transition-all cursor-pointer"
              >
                <ChevronRight className="w-8 h-8 text-white" />
                <span>SLIDE TIẾP ▶</span>
              </button>
            </div>

            {/* Private Teacher Presenter Notes (Chỉ cô giáo thấy trên điện thoại) */}
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-black">
                <HelpCircle className="w-4 h-4" />
                <span>GHI CHÚ SƯ PHẠM (CHỈ GIÁO VIÊN THẤY)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-100/90 leading-relaxed list-disc list-inside">
                {(tvState.presenterNotes && tvState.presenterNotes.length > 0
                  ? tvState.presenterNotes
                  : ['Lắng nghe và hướng dẫn học sinh trả lời.']
                ).map((note, idx) => (
                  <li key={idx} className="text-[12px]">
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Interactive Slide Controls */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => sendAction('REVEAL_ANSWER')}
                className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 font-bold flex items-center justify-center space-x-2 text-emerald-400 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Hiện Đáp Án</span>
              </button>

              <button
                onClick={() => sendAction('SPIN_WHEEL')}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 font-bold flex items-center justify-center space-x-2 text-white shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>🎡 Quay Gọi Tên</span>
              </button>
            </div>

            {/* Quick Timer Row */}
            <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-300">Đếm giờ:</span>
                <span className="font-mono font-black text-cyan-400 text-sm">
                  {Math.floor((tvState.timeRemaining ?? 300) / 60)}:
                  {((tvState.timeRemaining ?? 300) % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() =>
                    sendAction(tvState.isTimerRunning ? 'TIMER_PAUSE' : 'TIMER_START')
                  }
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  {tvState.isTimerRunning ? 'Tạm dừng' : 'Bắt đầu'}
                </button>
                <button
                  onClick={() => sendAction('TIMER_RESET')}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VIRTUAL LASER POINTER & SPOTLIGHT */}
        {activeTab === 'LASER' && (
          <div className="space-y-4 animate-in fade-in flex flex-col h-full">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => {
                  setPointerMode('LASER');
                  triggerHaptic(20);
                }}
                className={`py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  pointerMode === 'LASER'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crosshair className="w-4 h-4" />
                <span>Bút Laser Đỏ</span>
              </button>

              <button
                onClick={() => {
                  setPointerMode('SPOTLIGHT');
                  triggerHaptic(20);
                }}
                className={`py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  pointerMode === 'SPOTLIGHT'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Chiếu Sáng (Spotlight)</span>
              </button>
            </div>

            {/* Virtual Touchpad Canvas Area */}
            <div
              ref={touchpadRef}
              onTouchStart={(e) => {
                setIsPointerActive(true);
                handleTouchpadMove(e);
              }}
              onTouchMove={handleTouchpadMove}
              onTouchEnd={handleTouchpadEnd}
              onMouseDown={(e) => {
                setIsPointerActive(true);
                handleTouchpadMove(e);
              }}
              onMouseMove={(e) => {
                if (isPointerActive) handleTouchpadMove(e);
              }}
              onMouseUp={handleTouchpadEnd}
              className="flex-1 min-h-[300px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border-2 border-dashed border-slate-700/80 p-6 flex flex-col items-center justify-center text-center space-y-3 relative cursor-crosshair active:border-red-500 select-none touch-none shadow-inner"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  pointerMode === 'LASER'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                }`}
              >
                {pointerMode === 'LASER' ? (
                  <Crosshair className="w-8 h-8 animate-pulse" />
                ) : (
                  <Sun className="w-8 h-8 animate-spin" />
                )}
              </div>

              <div className="space-y-1">
                <p className="font-black text-sm text-slate-200">
                  {isPointerActive ? 'Đang trỏ trên màn hình TV...' : 'Chạm và vuốt ngón tay ở đây'}
                </p>
                <p className="text-xs text-slate-500 max-w-[220px]">
                  Tọa độ ngón tay của bạn sẽ điều khiển điểm sáng trực tiếp trên màn hình Smart TV.
                </p>
              </div>

              {/* Touchpad Corner Guidelines */}
              <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-600">GÓC TRÁI TRÊN</div>
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-600">GÓC PHẢI DƯỚI</div>
            </div>
          </div>
        )}

        {/* TAB 3: GAMES & INSTANT SOUNDBOARD */}
        {activeTab === 'GAMES' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Big Lucky Wheel Spin Trigger */}
            <button
              onClick={() => sendAction('SPIN_WHEEL')}
              className="w-full py-4 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 active:scale-95 text-white font-black text-base shadow-xl flex items-center justify-center space-x-2 border border-amber-300/40 cursor-pointer"
            >
              <Sparkles className="w-6 h-6 animate-bounce" />
              <span>🎡 QUAY VÒNG QUAY MAY MẮN TRÊN TV</span>
            </button>

            {/* Soundboard Grid (6 Sound FX) */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Hộp Âm Thanh Lớp Học (Phát Trên Loa TV)
              </span>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <button
                  onClick={() => sendAction('PLAY_SFX', { type: 'applause' })}
                  className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 font-bold flex items-center space-x-2 text-amber-300 cursor-pointer"
                >
                  <span className="text-xl">👏</span>
                  <div className="text-left">
                    <p className="font-bold">Vỗ Tay Khen</p>
                    <span className="text-[10px] text-slate-500">Applause</span>
                  </div>
                </button>

                <button
                  onClick={() => sendAction('PLAY_SFX', { type: 'victory' })}
                  className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 font-bold flex items-center space-x-2 text-emerald-300 cursor-pointer"
                >
                  <span className="text-xl">🎺</span>
                  <div className="text-left">
                    <p className="font-bold">Chiến Thắng</p>
                    <span className="text-[10px] text-slate-500">Fanfare</span>
                  </div>
                </button>

                <button
                  onClick={() => sendAction('PLAY_SFX', { type: 'drumroll' })}
                  className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 font-bold flex items-center space-x-2 text-cyan-300 cursor-pointer"
                >
                  <span className="text-xl">🥁</span>
                  <div className="text-left">
                    <p className="font-bold">Trống Hồi Hộp</p>
                    <span className="text-[10px] text-slate-500">Drumroll</span>
                  </div>
                </button>

                <button
                  onClick={() => sendAction('PLAY_SFX', { type: 'confetti' })}
                  className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 font-bold flex items-center space-x-2 text-pink-300 cursor-pointer"
                >
                  <span className="text-xl">🎉</span>
                  <div className="text-left">
                    <p className="font-bold">Pháo Hoa</p>
                    <span className="text-[10px] text-slate-500">Confetti Pop</span>
                  </div>
                </button>

                <button
                  onClick={() => sendAction('PLAY_SFX', { type: 'bell' })}
                  className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 font-bold flex items-center space-x-2 text-yellow-300 cursor-pointer"
                >
                  <span className="text-xl">🔔</span>
                  <div className="text-left">
                    <p className="font-bold">Chuông Báo</p>
                    <span className="text-[10px] text-slate-500">Bell Chime</span>
                  </div>
                </button>

                <button
                  onClick={() => sendAction('PLAY_SFX', { type: 'buzzer' })}
                  className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 font-bold flex items-center space-x-2 text-rose-300 cursor-pointer"
                >
                  <span className="text-xl">🚨</span>
                  <div className="text-left">
                    <p className="font-bold">Tiếc Quá</p>
                    <span className="text-[10px] text-slate-500">Buzzer</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Traffic Light Management */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Đèn Tín Hiệu Nề Nếp Lớp Học
              </span>

              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  onClick={() => sendAction('TRAFFIC_LIGHT', { status: 'GREEN' })}
                  className="py-2.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 active:scale-95 cursor-pointer"
                >
                  🟢 Thảo Luận
                </button>

                <button
                  onClick={() => sendAction('TRAFFIC_LIGHT', { status: 'YELLOW' })}
                  className="py-2.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-700/60 active:scale-95 cursor-pointer"
                >
                  🟡 Nói Nhỏ
                </button>

                <button
                  onClick={() => sendAction('TRAFFIC_LIGHT', { status: 'RED' })}
                  className="py-2.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-700/60 active:scale-95 cursor-pointer"
                >
                  🔴 Trật Tự
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INSTANT STAR REWARDS */}
        {activeTab === 'REWARDS' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Recently Winner Quick Reward Card */}
            {tvState.luckyWheelWinner && (
              <div className="bg-gradient-to-r from-amber-950/70 to-orange-950/70 border border-amber-500/40 rounded-2xl p-3.5 space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">
                  Học sinh vừa được gọi:
                </span>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-white">{tvState.luckyWheelWinner}</h4>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        sendAction('AWARD_STAR', {
                          studentName: tvState.luckyWheelWinner,
                          points: 1,
                          reason: 'Trả lời đúng câu hỏi',
                        });
                        toast.success(`Đã cộng 1 ⭐ cho ${tvState.luckyWheelWinner}!`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                    >
                      +1 ⭐
                    </button>
                    <button
                      onClick={() => {
                        sendAction('AWARD_STAR', {
                          studentName: tvState.luckyWheelWinner,
                          points: 2,
                          reason: 'Phát biểu xuất sắc',
                        });
                        toast.success(`Đã cộng 2 ⭐ cho ${tvState.luckyWheelWinner}!`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                    >
                      +2 ⭐
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Team Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm học sinh để cộng sao..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                {(['ALL', 1, 2, 3, 4] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTeam(t)}
                    className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all ${
                      selectedTeam === t
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'ALL' ? 'Tất cả' : `Tổ ${t}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Students List with 1-Click Star Buttons */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h5 className="font-bold text-slate-100">{st.fullName}</h5>
                      <span className="text-[10px] text-slate-500">
                        {st.studentCode} • Tổ {st.teamId ?? 1}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          addStarLog(st.id, 1, 'Học tập', 'Phát biểu tốt trên lớp');
                          sendAction('AWARD_STAR', {
                            studentId: st.id,
                            studentName: st.fullName,
                            points: 1,
                            reason: 'Phát biểu tốt trên lớp',
                          });
                          sendAction('PLAY_SFX', { type: 'star_ding' });
                          toast.success(`+1 ⭐ ${st.fullName}`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-black text-amber-400 transition-all cursor-pointer"
                      >
                        +1 ⭐
                      </button>

                      <button
                        onClick={() => {
                          addStarLog(st.id, 2, 'Học tập', 'Xuất sắc');
                          sendAction('AWARD_STAR', {
                            studentId: st.id,
                            studentName: st.fullName,
                            points: 2,
                            reason: 'Xuất sắc',
                          });
                          sendAction('PLAY_SFX', { type: 'victory' });
                          toast.success(`+2 ⭐ ${st.fullName}`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                      >
                        +2 ⭐
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Không tìm thấy học sinh nào phù hợp.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── 3. BOTTOM THUMB NAVIGATION BAR ───────────────────────────────── */}
      <nav className="bg-slate-900 border-t border-slate-800 p-2 shrink-0">
        <div className="grid grid-cols-4 gap-1 text-center">
          <button
            onClick={() => {
              setActiveTab('SLIDES');
              triggerHaptic(20);
            }}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'SLIDES'
                ? 'bg-blue-600/30 text-blue-400 font-black border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[10px]">Bài Giảng</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('LASER');
              triggerHaptic(20);
            }}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'LASER'
                ? 'bg-red-600/30 text-red-400 font-black border border-red-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-5 h-5" />
            <span className="text-[10px]">Bút Laser</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('GAMES');
              triggerHaptic(20);
            }}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'GAMES'
                ? 'bg-purple-600/30 text-purple-400 font-black border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-[10px]">Âm Thanh</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('REWARDS');
              triggerHaptic(20);
            }}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'REWARDS'
                ? 'bg-amber-600/30 text-amber-400 font-black border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px]">Cộng Sao</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function RemoteControlPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Đang tải GVCN Mobile Remote...</p>
          </div>
        </div>
      }
    >
      <RemoteControlPageContent />
    </Suspense>
  );
}

