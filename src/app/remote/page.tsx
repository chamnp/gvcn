'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  Award,
  Crosshair,
  Sun,
  Search,
  X,
} from 'lucide-react';
import {
  RemoteSyncSession,
  RemoteMessage,
  RemoteStatePayload,
  subscribeToClassPresentationBeacon,
  triggerHaptic,
} from '@/lib/remote-sync';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { AdaptiveSlideView } from '@/lib/remote-modules/slide-adapters/adaptive-slide-view';
import { getRemoteGameModule, ALL_REMOTE_GAMES } from '@/lib/remote-modules/registry';

type RemoteTab = 'SLIDES' | 'LASER' | 'GAMES' | 'REWARDS';

function RemoteControlPageContent() {
  const searchParams = useSearchParams();
  const initialSession = searchParams.get('s') || '';

  const { classInfo, students, addStarLog } = useAppStore();
  const { profile } = useAuth();

  // Session & Connection State
  const [sessionCode, setSessionCode] = useState(initialSession);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<RemoteTab>('SLIDES');

  // TV State Synced from Host (no mock data — real values come via STATE_SYNC)
  const [tvState, setTvState] = useState<RemoteStatePayload>({
    sessionCode: '',
    className: classInfo.name || '',
    teacherName: profile?.fullName || '',
    activeContext: 'IDLE',
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
  const activeSessionCodeRef = useRef<string>('');

  // Wake Lock Ref to keep screen on while teaching
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Ignore wake lock errors
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // Connect / Disconnect Handler
  const connectSession = useCallback((code: string) => {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    if (activeSessionCodeRef.current === cleanCode && sessionRef.current) {
      return; // Already connected to this exact session
    }
    activeSessionCodeRef.current = cleanCode;
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
      return () => {
        activeSessionCodeRef.current = '';
        sessionRef.current?.close();
      };
    }

    // Auto-discover live presentation of current class if no session param
    if (classInfo.name) {
      const unsubscribe = subscribeToClassPresentationBeacon(classInfo.name, (beacon) => {
        if (beacon && beacon.sessionCode && Date.now() - beacon.timestamp < 15000) {
          if (activeSessionCodeRef.current === beacon.sessionCode) {
            return; // Already connected to this live TV session, avoid reconnect & toast spam
          }
          toast.success(`📱 Đã tự động kết nối với TV: "${beacon.slideTitle}"!`);
          connectSession(beacon.sessionCode);
        }
      });

      return () => {
        unsubscribe();
        activeSessionCodeRef.current = '';
        sessionRef.current?.close();
      };
    }
  }, [initialSession, classInfo.name, connectSession]);

  // Dispatch Action to TV with Instant Optimistic UI Update
  const sendAction = (type: any, payload?: any) => {
    triggerHaptic(30);

    // Optimistic UI updates for immediate responsiveness
    if (type === 'SLIDE_NEXT') {
      setTvState((prev) => ({
        ...prev,
        currentSlide: Math.min((prev.totalSlides ?? 1) - 1, (prev.currentSlide ?? 0) + 1),
      }));
    } else if (type === 'SLIDE_PREV') {
      setTvState((prev) => ({
        ...prev,
        currentSlide: Math.max(0, (prev.currentSlide ?? 0) - 1),
      }));
    } else if (type === 'OPEN_MODAL') {
      setTvState((prev) => ({ ...prev, activeModal: payload?.modal }));
    } else if (type === 'CLOSE_MODAL') {
      setTvState((prev) => ({ ...prev, activeModal: 'NONE' }));
    } else if (type === 'TRAFFIC_LIGHT') {
      setTvState((prev) => ({ ...prev, trafficLightStatus: payload?.status }));
    } else if (type === 'REVEAL_ANSWER') {
      setTvState((prev) => ({
        ...prev,
        isAnswerRevealed: payload?.revealed !== undefined ? Boolean(payload.revealed) : !prev.isAnswerRevealed,
      }));
    } else if (type === 'TIMER_START') {
      setTvState((prev) => ({ ...prev, isTimerRunning: true }));
    } else if (type === 'TIMER_PAUSE') {
      setTvState((prev) => ({ ...prev, isTimerRunning: false }));
    } else if (type === 'TIMER_RESET') {
      setTvState((prev) => ({ ...prev, isTimerRunning: false, timeRemaining: prev.timerDuration || 300 }));
    } else if (type === 'TIMER_ADD_SECONDS') {
      setTvState((prev) => ({
        ...prev,
        timeRemaining: Math.max(0, (prev.timeRemaining ?? 0) + (payload?.seconds || 30)),
      }));
    }

    sessionRef.current?.sendAction(type, payload);
  };

  // Touchpad Event Handlers for Virtual Laser (throttled to ~40fps to avoid channel congestion)
  const lastLaserSendRef = useRef<number>(0);
  const handleTouchpadMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchpadRef.current) return;
    const now = performance.now();
    if (now - lastLaserSendRef.current < 25) return; // limit to max 40 events/sec
    lastLaserSendRef.current = now;

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

  // Effective Students: Use local store if present, or fallback to synced studentsList from TV (for guest/QR-scan remote)
  const effectiveStudents = useMemo(() => {
    if (students && students.length > 0) return students;
    if (tvState.studentsList && tvState.studentsList.length > 0) {
      return tvState.studentsList.map((st, idx) => ({
        id: st.id || `st-${idx}`,
        fullName: st.fullName,
        studentCode: st.studentCode || '',
        teamId: (((idx % 4) + 1) as 1 | 2 | 3 | 4) || 1,
        classId: '',
        gender: 'OTHER' as const,
        birthDate: '',
      }));
    }
    return [];
  }, [students, tvState.studentsList]);

  // Filtered Students for Rewards with safe optional chaining
  const filteredStudents = useMemo(() => {
    return effectiveStudents.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.studentCode || '').toLowerCase().includes(studentSearch.toLowerCase());
      const matchTeam = selectedTeam === 'ALL' || (s.teamId ?? 1) === selectedTeam;
      return matchSearch && matchTeam;
    });
  }, [effectiveStudents, studentSearch, selectedTeam]);

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
          {tvState.activeModal && tvState.activeModal !== 'NONE' && (
            <button
              onClick={() => sendAction('CLOSE_MODAL')}
              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black shadow-md flex items-center space-x-1 animate-pulse cursor-pointer border border-rose-400"
              title="Đóng cửa sổ đang mở trên TV"
            >
              <X className="w-3.5 h-3.5" />
              <span>Đóng TV</span>
            </button>
          )}

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
        {/* ACTIVE TV MODAL BANNER CONTROLLER (MODULAR ADAPTER) */}
        {tvState.activeModal && tvState.activeModal !== 'NONE' && (() => {
          const activeModule = getRemoteGameModule(tvState.activeModal);
          return (
            <div className="bg-gradient-to-r from-amber-950/90 via-orange-950/90 to-rose-950/90 border-2 border-amber-400/60 rounded-3xl p-3.5 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/30 border border-amber-400/50 flex items-center justify-center text-xl shadow-inner">
                    {activeModule?.iconEmoji || '📺'}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Đang chiếu trên Smart TV
                    </span>
                    <h4 className="font-black text-sm text-white leading-tight">
                      {activeModule?.title || tvState.activeModal}
                    </h4>
                  </div>
                </div>

                {/* 1-Tap Close Button */}
                <button
                  onClick={() => sendAction('CLOSE_MODAL')}
                  className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs shadow-lg flex items-center space-x-1.5 cursor-pointer border border-rose-400"
                >
                  <X className="w-4 h-4" />
                  <span>ĐÓNG TV</span>
                </button>
              </div>

              {/* Render Modular Controls */}
              {activeModule && activeModule.renderControls({ tvState, sendAction })}
            </div>
          );
        })()}

        {/* TAB 1: SLIDES & LESSON PLAN PRESENTATION (ADAPTIVE CONTEXTUAL) */}
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

            {/* ADAPTIVE CONTEXTUAL SLIDE VIEW */}
            <AdaptiveSlideView tvState={tvState} sendAction={sendAction} />
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
            {/* Quick Action & Dismiss Bar */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => sendAction('SPIN_WHEEL')}
                className="py-3.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 active:scale-95 text-white font-black text-xs shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer border border-amber-300/40"
              >
                <Sparkles className="w-4 h-4" />
                <span>🎡 Quay Vòng Quay TV</span>
              </button>

              <button
                onClick={() => sendAction('CLOSE_MODAL')}
                className="py-3.5 px-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900/80 active:scale-95 border border-rose-600/70 text-rose-200 font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>✕ Đóng Pop-up TV</span>
              </button>
            </div>

            {/* Modular Interactive Game Grid */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                  Bật Công Cụ Trò Chơi Lên TV
                </span>
                <button
                  onClick={() => sendAction('CLOSE_MODAL')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Đóng tất cả
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {ALL_REMOTE_GAMES.map((mod) => {
                  const isActive = tvState.activeModal === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        if (isActive) {
                          sendAction('CLOSE_MODAL');
                        } else {
                          sendAction('OPEN_MODAL', { modal: mod.id });
                        }
                      }}
                      className={`p-2.5 rounded-xl active:scale-95 border flex flex-col items-center justify-center gap-1 cursor-pointer text-center transition-all ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-xl">{mod.iconEmoji}</span>
                      <span className="text-[10px] font-black truncate max-w-full">{mod.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soundboard Quick Access */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Hộp Âm Thanh Lớp Học (Phát Trên Loa TV)
              </span>
              {getRemoteGameModule('SOUNDBOARD')?.renderControls({ tvState, sendAction })}
            </div>

            {/* Traffic Light Quick Access (1-tap, no TV modal needed) */}
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                Đèn Tín Hiệu Nề Nếp Lớp Học
              </span>
              {getRemoteGameModule('TRAFFIC')?.renderControls({ tvState, sendAction })}
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

