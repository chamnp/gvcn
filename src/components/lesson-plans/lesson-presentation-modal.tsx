'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Award,
  Users,
  CheckCircle2,
  Tv,
  Maximize,
  Minimize,
  Palette,
  Play,
  Pause,
  Pointer,
  RotateCcw,
  Clock,
  HelpCircle,
  Star,
  ExternalLink,
  Volume2,
  Check,
} from 'lucide-react';
import { LessonPlan, LessonSlide, ClassInfo, SchoolInfo, Student } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  RemoteSyncSession,
  RemoteMessage,
  RemoteLaserPayload,
  PresentationBeaconBroadcaster,
  generateSessionCode,
} from '@/lib/remote-sync';
import { RemoteLaserOverlay } from '@/components/classroom/remote-laser-overlay';
import { RemotePairingModal } from '@/components/classroom/remote-pairing-modal';
import { Smartphone } from 'lucide-react';
import { playSoundEffect } from '@/lib/sound-effects';

interface LessonPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonPlan: LessonPlan;
  classInfo: ClassInfo;
  schoolInfo: SchoolInfo;
  students: Student[];
  onAwardStar?: (studentId: string) => void;
}

type PresentationTheme = 'MIDNIGHT' | 'SUNRISE' | 'MINT_GARDEN' | 'ROYAL_PURPLE';

const THEME_STYLES: Record<
  PresentationTheme,
  { bg: string; name: string; accent: string; cardBg: string; textColor: string }
> = {
  MIDNIGHT: {
    name: '🌌 Đại Dương Tinh Tú',
    bg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950',
    accent: 'from-amber-400 to-orange-500',
    cardBg: 'bg-white/10 border-white/20',
    textColor: 'text-white',
  },
  SUNRISE: {
    name: '🌅 Bình Minh Rực Rỡ',
    bg: 'bg-gradient-to-br from-rose-950 via-orange-950 to-slate-950',
    accent: 'from-yellow-400 to-rose-400',
    cardBg: 'bg-white/10 border-amber-400/30',
    textColor: 'text-white',
  },
  MINT_GARDEN: {
    name: '🍃 Vườn Xanh Sinh Thái',
    bg: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950',
    accent: 'from-emerald-400 to-teal-300',
    cardBg: 'bg-white/10 border-emerald-400/30',
    textColor: 'text-white',
  },
  ROYAL_PURPLE: {
    name: '👑 Hoàng Gia Trang Trọng',
    bg: 'bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950',
    accent: 'from-amber-300 to-yellow-500',
    cardBg: 'bg-white/10 border-purple-400/30',
    textColor: 'text-white',
  },
};

export function LessonPresentationModal({
  isOpen,
  onClose,
  lessonPlan,
  classInfo,
  schoolInfo,
  students,
  onAwardStar,
}: LessonPresentationModalProps) {
  const slides: LessonSlide[] = lessonPlan.slides || [];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [theme, setTheme] = useState<PresentationTheme>('MIDNIGHT');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });

  // Quiz state for interactive slide
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);

  // Wheel caller state
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentSlide = slides[currentSlideIndex] || null;

  // ─── Remote Control Integration ───
  const [sessionCode] = useState(() => generateSessionCode(classInfo.name || '4A1'));
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [remoteLaser, setRemoteLaser] = useState<RemoteLaserPayload | null>(null);
  const remoteSessionRef = useRef<RemoteSyncSession | null>(null);
  const beaconRef = useRef<PresentationBeaconBroadcaster | null>(null);

  // Sync state to remote controller phone
  const syncStateToRemote = useCallback(() => {
    if (!remoteSessionRef.current || !currentSlide) return;
    remoteSessionRef.current.sendAction('STATE_SYNC', {
      sessionCode,
      className: classInfo.name,
      teacherName: classInfo.teacherName,
      activeContext: 'LESSON_PLAN',
      activeModal: isWheelOpen ? 'WHEEL' : 'NONE',
      currentSlide: currentSlideIndex,
      totalSlides: slides.length,
      slideTitle: currentSlide.title,
      slideLayout: currentSlide.layout,
      hasTimer: (currentSlide.timerSeconds || 0) > 0,
      phase: currentSlide.phase,
      presenterNotes: currentSlide.speakerNotes
        ? currentSlide.speakerNotes.split('\n').filter(Boolean)
        : [currentSlide.content.join('. ')],
      quizQuestion: currentSlide.question,
      quizOptions: currentSlide.options,
      correctAnswerIndex: currentSlide.correctOption,
      isAnswerRevealed: showQuizAnswer,
      explanation: currentSlide.explanation,
      isTimerRunning,
      timeRemaining: timerSeconds ?? 300,
      timerDuration: currentSlide.timerSeconds || 300,
      luckyWheelWinner: selectedStudent?.fullName,
      studentsList: students.map((s) => ({ id: s.id, fullName: s.fullName, studentCode: s.studentCode })),
    });
  }, [currentSlideIndex, currentSlide, slides.length, showQuizAnswer, isTimerRunning, timerSeconds, selectedStudent, students, classInfo, sessionCode, isWheelOpen]);

  const onAwardStarRef = useRef(onAwardStar);
  const slidesRef = useRef(slides);
  const currentSlideRef = useRef(currentSlide);
  useEffect(() => {
    onAwardStarRef.current = onAwardStar;
    slidesRef.current = slides;
    currentSlideRef.current = currentSlide;
    if (isOpen && currentSlide) {
      beaconRef.current?.updateBeacon({
        slideTitle: currentSlide.title,
      });
    }
  }, [onAwardStar, slides, currentSlide, isOpen]);

  // Initialize Remote Session & Auto-Discovery Beacon
  useEffect(() => {
    if (!isOpen) {
      beaconRef.current?.stop();
      remoteSessionRef.current?.close();
      return;
    }

    beaconRef.current = new PresentationBeaconBroadcaster({
      sessionCode,
      className: classInfo.name,
      teacherName: classInfo.teacherName,
      activeContext: 'LESSON_PLAN',
      slideTitle: currentSlideRef.current?.title || 'Kế hoạch bài dạy',
      timestamp: Date.now(),
    });

    remoteSessionRef.current = new RemoteSyncSession(
      sessionCode,
      'HOST_TV',
      (msg: RemoteMessage) => {
        switch (msg.type) {
          case 'CONNECT':
            setIsRemoteConnected(true);
            toast.success('📱 Đã kết nối với Remote điện thoại của giáo viên!');
            syncStateToRemote();
            break;
          case 'DISCONNECT':
            setIsRemoteConnected(false);
            break;
          case 'CLOSE_MODAL':
          case 'CLOSE_WHEEL':
            setIsWheelOpen(false);
            toast.success('📱 Đã đóng pop-up trên TV bằng Remote điện thoại!');
            break;
          case 'OPEN_MODAL':
            if (msg.payload?.modal === 'WHEEL') {
              setIsWheelOpen(true);
            }
            break;
          case 'SLIDE_NEXT':
            setCurrentSlideIndex((prev) => Math.min(slidesRef.current.length - 1, prev + 1));
            break;
          case 'SLIDE_PREV':
            setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
            break;
          case 'SLIDE_GOTO':
            if (typeof msg.payload?.index === 'number') {
              setCurrentSlideIndex(msg.payload.index);
            }
            break;
          case 'LASER_MOVE':
            setRemoteLaser(msg.payload);
            break;
          case 'SPIN_WHEEL':
            setIsWheelOpen(true);
            setTimeout(() => {
              handleSpinStudent();
            }, 100);
            break;
          case 'TIMER_START':
            setIsTimerRunning(true);
            break;
          case 'TIMER_PAUSE':
            setIsTimerRunning(false);
            break;
          case 'TIMER_RESET':
            setIsTimerRunning(false);
            setTimerSeconds(currentSlideRef.current?.timerSeconds || 300);
            break;
          case 'TIMER_ADD_SECONDS':
            setTimerSeconds((prev) => Math.max(0, prev + (msg.payload?.seconds || 30)));
            break;
          case 'TIMER_SET':
            if (typeof msg.payload?.seconds === 'number') {
              setTimerSeconds(msg.payload.seconds);
            }
            break;
          case 'REVEAL_ANSWER':
            setShowQuizAnswer((prev) => {
              const nextVal = msg.payload?.revealed !== undefined ? Boolean(msg.payload.revealed) : !prev;
              if (nextVal) {
                confetti({ particleCount: 70, spread: 60 });
              }
              return nextVal;
            });
            break;
          case 'PLAY_SFX':
            if (msg.payload?.type) {
              playSoundEffect(msg.payload.type);
            }
            break;
          case 'AWARD_STAR':
            const targetStudent = students.find(
              (s) =>
                (msg.payload?.studentId && s.id === msg.payload.studentId) ||
                (msg.payload?.studentName && s.fullName === msg.payload.studentName)
            );
            if (targetStudent && onAwardStarRef.current) {
              onAwardStarRef.current(targetStudent.id);
            }
            confetti({ particleCount: 60, spread: 70 });
            toast.success(`⭐ Đã cộng sao cho ${msg.payload?.studentName || targetStudent?.fullName || 'Học sinh'}!`);
            break;
        }
      },
      (connected: boolean) => {
        setIsRemoteConnected(connected);
      }
    );

    return () => {
      beaconRef.current?.stop();
      remoteSessionRef.current?.close();
    };
  }, [isOpen, sessionCode]);

  // Sync state whenever slide, quiz, timer, or wheel popup changes
  useEffect(() => {
    if (isOpen && isRemoteConnected) {
      syncStateToRemote();
    }
  }, [isOpen, isRemoteConnected, currentSlideIndex, showQuizAnswer, isTimerRunning, timerSeconds, isWheelOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        setLaserActive((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlideIndex, slides.length, isFullscreen]);

  // Reset quiz & timer when slide changes
  useEffect(() => {
    setSelectedQuizOption(null);
    setShowQuizAnswer(false);
    if (currentSlide?.timerSeconds) {
      setTimerSeconds(currentSlide.timerSeconds);
      setIsTimerRunning(false);
    } else {
      setTimerSeconds(null);
      setIsTimerRunning(false);
    }
  }, [currentSlideIndex]);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev !== null && prev <= 1) {
            setIsTimerRunning(false);
            confetti({ particleCount: 80, spread: 60 });
            toast.success('⏰ ĐÃ HẾT GIỜ LÀM BÀI! Các con dừng bút nhé!');
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Laser move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (laserActive) {
      setLaserPos({ x: e.clientX, y: e.clientY });
    }
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Spin wheel to pick random student
  const handleSpinStudent = () => {
    if (students.length === 0) {
      toast.error('Lớp chưa có học sinh để quay số!');
      return;
    }
    setIsSpinning(true);
    setSelectedStudent(null);

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * students.length);
      setSelectedStudent(students[randomIdx]);
      counter++;
      if (counter > 20) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * students.length);
        const winner = students[finalIdx];
        setSelectedStudent(winner);
        setIsSpinning(false);
        confetti({ particleCount: 120, spread: 80 });
        toast.success(`🎉 Xin chúc mừng bạn: ${winner.fullName}!`);
        remoteSessionRef.current?.sendAction('STATE_SYNC', { luckyWheelWinner: winner.fullName });
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 flex flex-col justify-between select-none ${THEME_STYLES[theme].bg} text-white font-sans overflow-hidden`}
    >
      {/* Laser Pointer Dot */}
      {laserActive && (
        <div
          className="fixed pointer-events-none z-50 w-6 h-6 rounded-full bg-rose-500 shadow-[0_0_20px_10px_rgba(244,63,94,0.8)] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 animate-ping"
          style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
        />
      )}

      {/* 1. TOP BAR: Branding, Tools, Controls */}
      <div className="flex items-center justify-between p-4 sm:p-6 bg-black/30 backdrop-blur-md border-b border-white/10 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center font-black text-amber-400 text-lg border border-white/20">
            TV
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] uppercase font-bold tracking-widest text-amber-300">
                {classInfo.name} • {lessonPlan.subjectName} LỚP {lessonPlan.grade}
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                Tuần {lessonPlan.week} (Tiết {lessonPlan.periodNumber})
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black truncate max-w-xl text-white">
              {lessonPlan.title}
            </h2>
          </div>
        </div>

        {/* Right Tools: Remote, Laser, Wheel, Timer, Theme, Fullscreen, Close */}
        <div className="flex items-center space-x-2">
          {/* Remote Control Pairing Button */}
          <button
            type="button"
            onClick={() => setIsRemoteModalOpen(true)}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
              isRemoteConnected
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title="Điều khiển từ xa bằng điện thoại"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">{isRemoteConnected ? '🟢 Remote Phone' : '📱 Kết Nối Remote'}</span>
          </button>

          {/* Spin Wheel Caller Button */}
          <button
            type="button"
            onClick={() => setIsWheelOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>🎡</span>
            <span className="hidden sm:inline">Gọi Học Sinh</span>
          </button>

          {/* Laser Pointer Toggle */}
          <button
            type="button"
            onClick={() => setLaserActive((prev) => !prev)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              laserActive
                ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/50'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title="Bút chỉ Laser ảo (Phím tắt: L)"
          >
            <Pointer className="w-4 h-4" />
          </button>

          {/* Theme Switcher */}
          <div className="hidden sm:flex items-center bg-white/10 rounded-2xl p-1 border border-white/15">
            {(Object.keys(THEME_STYLES) as PresentationTheme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`w-6 h-6 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer ${
                  theme === t ? 'bg-white text-slate-900 font-bold shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
                title={THEME_STYLES[t].name}
              >
                {t === 'MIDNIGHT' ? '🌌' : t === 'SUNRISE' ? '🌅' : t === 'MINT_GARDEN' ? '🍃' : '👑'}
              </button>
            ))}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
            title="Toàn màn hình (F11)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500 text-white border border-rose-500/30 transition-all cursor-pointer"
            title="Đóng trình chiếu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN STAGE: SLIDE DISPLAY */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto z-10">
        {currentSlide ? (
          <div className="w-full max-w-5xl space-y-8 animate-in fade-in zoom-in-95 duration-200 text-center sm:text-left">
            {/* Phase Tag */}
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <span className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-amber-300 border border-white/20 backdrop-blur-md">
                {currentSlide.phase === 'KHOI_DONG'
                  ? '🎮 1. Khởi Động'
                  : currentSlide.phase === 'KHAM_PHA'
                  ? '🔍 2. Khám Phá'
                  : currentSlide.phase === 'LUYEN_TAP'
                  ? '✍️ 3. Luyện Tập'
                  : currentSlide.phase === 'VAN_DUNG'
                  ? '🌟 4. Vận Dụng'
                  : '🎯 Tổng Kết'}
              </span>
              {currentSlide.subtitle && (
                <span className="text-xs text-blue-200 font-medium hidden sm:inline">
                  {currentSlide.subtitle}
                </span>
              )}
            </div>

            {/* Slide Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
              {currentSlide.title}
            </h1>

            {/* LAYOUT 1: TITLE BANNER */}
            {currentSlide.layout === 'TITLE' && (
              <div className="p-8 sm:p-12 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md space-y-6 text-center">
                <div className="text-6xl sm:text-7xl animate-bounce">🏫</div>
                <div className="space-y-2">
                  {currentSlide.content.map((line, idx) => (
                    <p key={idx} className="text-lg sm:text-2xl font-bold text-blue-100 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* LAYOUT 2: BULLETS OR TWO COLUMNS */}
            {(currentSlide.layout === 'BULLETS' ||
              currentSlide.layout === 'TWO_COLUMNS' ||
              currentSlide.layout === 'SUMMARY') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentSlide.content.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/15 transition-all space-y-2 flex items-start space-x-3"
                  >
                    <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-base sm:text-xl font-bold text-white leading-relaxed text-left">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* LAYOUT 3: INTERACTIVE QUIZ SLIDE */}
            {currentSlide.layout === 'INTERACTIVE_QUIZ' && currentSlide.question && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    ❓ Câu Hỏi Trắc Nghiệm:
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{currentSlide.question}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentSlide.options || []).map((opt, oIdx) => {
                    const isSelected = selectedQuizOption === oIdx;
                    const isCorrect = currentSlide.correctOption === oIdx;

                    let btnStyle = 'bg-white/10 hover:bg-white/20 border-white/20 text-white';
                    if (showQuizAnswer) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-500 text-white border-emerald-400 shadow-lg scale-102 font-black';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-500/80 text-white border-rose-400 opacity-70';
                      }
                    } else if (isSelected) {
                      btnStyle = 'bg-blue-600 text-white border-blue-400';
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => {
                          setSelectedQuizOption(oIdx);
                          setShowQuizAnswer(true);
                          if (isCorrect) {
                            confetti({ particleCount: 100, spread: 70 });
                            toast.success('🎉 CHÍNH XÁC! Xuất sắc lắm các con!');
                          }
                        }}
                        className={`p-4 sm:p-5 rounded-2xl border text-left text-sm sm:text-lg font-bold transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-xs font-black">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {showQuizAnswer && isCorrect && <CheckCircle2 className="w-6 h-6 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {showQuizAnswer && currentSlide.explanation && (
                  <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-medium animate-in fade-in">
                    💡 <strong>Giải thích:</strong> {currentSlide.explanation}
                  </div>
                )}
              </div>
            )}

            {/* LAYOUT 4: COUNTDOWN TASK SLIDE */}
            {currentSlide.layout === 'COUNTDOWN_TASK' && (
              <div className="p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md space-y-6 text-center">
                <div className="space-y-2 max-w-xl mx-auto">
                  {currentSlide.content.map((line, idx) => (
                    <p key={idx} className="text-base sm:text-xl font-bold text-blue-100">
                      {line}
                    </p>
                  ))}
                </div>

                {/* Big Timer Circle */}
                {timerSeconds !== null && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center p-6 rounded-full bg-black/40 border-4 border-amber-400 text-amber-300 font-mono font-black text-4xl sm:text-6xl shadow-2xl">
                      {Math.floor(timerSeconds / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(timerSeconds % 60).toString().padStart(2, '0')}
                    </div>

                    <div className="flex items-center justify-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsTimerRunning((prev) => !prev)}
                        className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-2"
                      >
                        {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isTimerRunning ? 'Tạm Dừng' : 'Bắt Đầu Đếm Ngược'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTimerSeconds(currentSlide.timerSeconds || 300);
                          setIsTimerRunning(false);
                        }}
                        className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                        title="Đặt lại đồng hồ"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-5xl">📖</div>
            <p className="text-xl font-bold">Chưa có nội dung slide bài giảng</p>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROL DOCK: Navigation & Thumbnails */}
      <div className="p-4 sm:p-6 bg-black/40 backdrop-blur-md border-t border-white/10 z-20 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Slide Counter & Progress */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-blue-200">
            Slide {currentSlideIndex + 1} / {slides.length}
          </span>
          <div className="w-32 sm:w-48 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{
                width: `${slides.length > 0 ? ((currentSlideIndex + 1) / slides.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Thumbnail Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-md py-1">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                currentSlideIndex === idx
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-110'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Big Prev / Next Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={currentSlideIndex === 0}
            onClick={goToPrevSlide}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trang Trước</span>
          </button>

          <button
            type="button"
            disabled={currentSlideIndex === slides.length - 1}
            onClick={goToNextSlide}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-30 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center space-x-1"
          >
            <span>Trang Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. MODAL: SPIN WHEEL STUDENT PICKER */}
      {isWheelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>🎡</span> Vòng Quay Gọi Tên Học Sinh
              </h3>
              <button
                type="button"
                onClick={() => setIsWheelOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Display Selected Student */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-900/50 to-indigo-900/50 border border-blue-400/30 space-y-3 min-h-[160px] flex flex-col items-center justify-center">
              {selectedStudent ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg animate-bounce">
                    {selectedStudent.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="text-2xl font-black text-white">{selectedStudent.fullName}</h4>
                  <p className="text-xs text-blue-200 font-mono">
                    Mã: {selectedStudent.studentCode} • Phụ huynh: {selectedStudent.parentName || 'Chưa cập nhật'}
                  </p>
                </>
              ) : (
                <div className="text-slate-400 text-sm font-medium">
                  Bấm nút <strong>"Quay Thưởng"</strong> để chọn một học sinh ngẫu nhiên trong lớp!
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpinStudent}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isSpinning ? 'Đang quay...' : '🎡 QUAY THƯỞNG NGAY'}
              </button>

              {selectedStudent && onAwardStar && (
                <button
                  type="button"
                  onClick={() => {
                    onAwardStar(selectedStudent.id);
                    confetti({ particleCount: 80, spread: 60 });
                    toast.success(`⭐ Đã cộng sao khen thưởng cho em ${selectedStudent.fullName}!`);
                  }}
                  className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>+1 Sao Khen</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Virtual Laser Pointer & Spotlight Overlay */}
      <RemoteLaserOverlay laserState={remoteLaser} />

      {/* Remote Phone Pairing QR Modal */}
      <RemotePairingModal
        isOpen={isRemoteModalOpen}
        onClose={() => setIsRemoteModalOpen(false)}
        sessionCode={sessionCode}
        isRemoteConnected={isRemoteConnected}
        className={classInfo.name}
      />
    </div>
  );
}
