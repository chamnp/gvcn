"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  X,
  Play,
  Pause,
  RotateCcw,
  Award,
  Users,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  Clock,
  Flag,
  Flame,
  Zap,
  RefreshCw,
  Trophy,
  BookOpen,
} from "lucide-react";
import { Student, QuizPack, QuizQuestion, QuizTeam, GradeLevel } from "@/types";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { loadClassroomToolConfig, saveClassroomToolConfig } from "@/lib/classroom-tool-config";
import { DEFAULT_QUIZ_PACKS } from "@/lib/quiz-bank";
import { getLocalDateString } from "@/lib/tt27-engine";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface TeamQuizBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  className?: string;
}

const ALL_MASCOTS: { mascot: string; name: string; color: string; gradient: string; trackColor: string }[] = [
  { mascot: "🦁", name: "Tổ 1 — Sư Tử Dũng Mãnh", color: "border-amber-400 text-amber-900 bg-amber-50", gradient: "from-amber-500 to-orange-500", trackColor: "bg-amber-500" },
  { mascot: "🦅", name: "Tổ 2 — Đại Bàng Quyết Thắng", color: "border-blue-400 text-blue-900 bg-blue-50", gradient: "from-blue-500 to-indigo-500", trackColor: "bg-blue-500" },
  { mascot: "🐬", name: "Tổ 3 — Cá Heo Thông Minh", color: "border-teal-400 text-teal-900 bg-teal-50", gradient: "from-teal-500 to-emerald-500", trackColor: "bg-teal-500" },
  { mascot: "🐼", name: "Tổ 4 — Gấu Trúc Chăm Chỉ", color: "border-purple-400 text-purple-900 bg-purple-50", gradient: "from-purple-500 to-pink-500", trackColor: "bg-purple-500" },
  { mascot: "🐯", name: "Tổ 5 — Hổ Vàng Bứt Phá", color: "border-yellow-400 text-yellow-900 bg-yellow-50", gradient: "from-yellow-500 to-amber-600", trackColor: "bg-yellow-500" },
  { mascot: "🦊", name: "Tổ 6 — Cáo Đỏ Nhanh Trí", color: "border-rose-400 text-rose-900 bg-rose-50", gradient: "from-rose-500 to-red-600", trackColor: "bg-rose-500" },
  { mascot: "🦄", name: "Tổ 7 — Kỳ Lân Sáng Tạo", color: "border-pink-400 text-pink-900 bg-pink-50", gradient: "from-pink-400 to-purple-500", trackColor: "bg-pink-400" },
  { mascot: "🦉", name: "Tổ 8 — Cú Mèo Thông Thái", color: "border-emerald-400 text-emerald-900 bg-emerald-50", gradient: "from-emerald-600 to-teal-700", trackColor: "bg-emerald-600" },
];

export function TeamQuizBattleModal({
  isOpen,
  onClose,
  students,
  className = "4A1",
}: TeamQuizBattleModalProps) {
  const { addStarLog, classInfo } = useAppStore();
  const { user } = useAuth();

  // Game Configuration State
  const [numTeams, setNumTeams] = useState<number>(4);
  const [targetScore, setTargetScore] = useState<number>(5);
  const [selectedPackId, setSelectedPackId] = useState<string>(DEFAULT_QUIZ_PACKS[0].id);
  const [customPacks, setCustomPacks] = useState<QuizPack[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // Game Play State
  const [gameState, setGameState] = useState<"SETUP" | "PLAYING" | "FINISHED">("SETUP");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [winningTeam, setWinningTeam] = useState<QuizTeam | null>(null);
  const [awardedStars, setAwardedStars] = useState<boolean>(false);

  // AI Quiz Generation State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiGrade, setAiGrade] = useState<GradeLevel>(4);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Teams in Game
  const [teams, setTeams] = useState<QuizTeam[]>(() =>
    ALL_MASCOTS.slice(0, 4).map((m, i) => ({
      id: i + 1,
      name: m.name,
      mascot: m.mascot,
      color: m.color,
      gradient: m.gradient,
      trackColor: m.trackColor,
      score: 0,
    }))
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const victoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Available quiz packs
  const allPacks = useMemo(() => [...DEFAULT_QUIZ_PACKS, ...customPacks], [customPacks]);
  const activePack = useMemo(
    () => allPacks.find((p) => p.id === selectedPackId) || DEFAULT_QUIZ_PACKS[0],
    [allPacks, selectedPackId]
  );
  const currentQuestion: QuizQuestion | undefined = activePack.questions[currentQuestionIndex];

  useEffect(() => {
    if (!isOpen || !user?.email || !classInfo.id) return;
    let active = true;
    setConfigLoaded(false);
    void loadClassroomToolConfig<{ customPacks: QuizPack[] }>(user.email, classInfo.id, 'TEAM_QUIZ')
      .then((config) => {
        if (active) setCustomPacks(config?.customPacks || []);
      })
      .catch((error) => {
        console.error('Không thể tải bộ câu hỏi trò chơi:', error);
        toast.error('Không thể tải bộ câu hỏi tùy chỉnh từ máy chủ.');
      })
      .finally(() => {
        if (active) setConfigLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [isOpen, user?.email, classInfo.id]);

  useEffect(() => {
    if (!configLoaded || !user?.email || !classInfo.id) return;
    void saveClassroomToolConfig(user.email, classInfo.id, 'TEAM_QUIZ', { customPacks }).catch((error) => {
      console.error('Không thể lưu bộ câu hỏi trò chơi:', error);
      toast.error('Không thể lưu bộ câu hỏi tùy chỉnh lên máy chủ.');
    });
  }, [configLoaded, customPacks, user?.email, classInfo.id]);

  // Sync fullscreen state with browser native events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (victoryTimeoutRef.current) clearTimeout(victoryTimeoutRef.current);
    };
  }, []);

  // Modal In-Game Keyboard Shortcuts (Space: Timer, Right Arrow: Next, F: Fullscreen, 1-8: Point)
  useEffect(() => {
    if (!isOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (gameState === "PLAYING") {
          setIsTimerRunning((prev) => !prev);
        }
      } else if (e.key === "ArrowRight" || (e.key === "Enter" && isAnswerRevealed)) {
        e.preventDefault();
        if (gameState === "PLAYING") {
          handleNextQuestion();
        }
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (gameState === "PLAYING" && /^[1-8]$/.test(e.key)) {
        const teamNum = parseInt(e.key, 10);
        if (teamNum <= numTeams) {
          e.preventDefault();
          handleAwardPointToTeam(teamNum);
        }
      }
    };

    window.addEventListener("keydown", handleModalKeyDown);
    return () => window.removeEventListener("keydown", handleModalKeyDown);
  }, [isOpen, gameState, isAnswerRevealed, currentQuestionIndex, numTeams, activePack]);

  // Initialize Web Audio
  const playSound = (type: "tick" | "correct" | "wrong" | "victory" | "horn") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "tick") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "correct") {
        // Bright pleasant major chord chime
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.5, now + 0.24); // C6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "wrong") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(160, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "victory") {
        osc.type = "square";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.12);
        osc.frequency.setValueAtTime(659.25, now + 0.24);
        osc.frequency.setValueAtTime(880, now + 0.36);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === "horn") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(349.23, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // Audio playback fallback
    }
  };

  // Update teams when numTeams changes
  const handleUpdateNumTeams = (count: number) => {
    setNumTeams(count);
    setTeams(
      ALL_MASCOTS.slice(0, count).map((m, i) => ({
        id: i + 1,
        name: m.name,
        mascot: m.mascot,
        color: m.color,
        gradient: m.gradient,
        trackColor: m.trackColor,
        score: 0,
      }))
    );
  };

  // Start Game
  const handleStartGame = () => {
    if (!currentQuestion) {
      toast.error("Bộ câu hỏi chưa có dữ liệu!");
      return;
    }
    setGameState("PLAYING");
    setCurrentQuestionIndex(0);
    setIsAnswerRevealed(false);
    setWinningTeam(null);
    setAwardedStars(false);
    setTimeLeft(currentQuestion.timeLimit || 15);
    setIsTimerRunning(true);
    // Reset team scores
    setTeams((prev) => prev.map((t) => ({ ...t, score: 0 })));
    playSound("horn");
  };

  // Timer Tick
  useEffect(() => {
    if (gameState === "PLAYING" && isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        if (timeLeft <= 4 && timeLeft > 1) {
          playSound("tick");
        }
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (gameState === "PLAYING" && timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playSound("wrong");
      setIsAnswerRevealed(true);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, isTimerRunning, timeLeft]);

  // Handle Team Points / Correct Answer
  const handleAwardPointToTeam = (teamId: number) => {
    playSound("correct");
    setIsAnswerRevealed(true);
    setIsTimerRunning(false);

    setTeams((prev) => {
      const updated = prev.map((t) => {
        if (t.id === teamId) {
          const newScore = t.score + 1;
          return { ...t, score: newScore };
        }
        return t;
      });

      // Check if team reached target
      const victor = updated.find((t) => t.id === teamId && t.score >= targetScore);
      if (victor) {
        if (victoryTimeoutRef.current) clearTimeout(victoryTimeoutRef.current);
        victoryTimeoutRef.current = setTimeout(() => {
          setWinningTeam(victor);
          setGameState("FINISHED");
          playSound("victory");
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
        }, 800);
      }
      return updated;
    });
  };

  // Next Question
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < activePack.questions.length) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setIsAnswerRevealed(false);
      const nextQ = activePack.questions[nextIdx];
      setTimeLeft(nextQ?.timeLimit || 15);
      setIsTimerRunning(true);
    } else {
      // Loop or finish
      // Find team with highest score
      const sorted = [...teams].sort((a, b) => b.score - a.score);
      setWinningTeam(sorted[0]);
      setGameState("FINISHED");
      playSound("victory");
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }
  };

  // Award stars to winning team
  const handleAwardStarsToWinningTeam = (starAmount: number) => {
    if (!winningTeam || awardedStars) return;
    if (students.length === 0) {
      toast.info("Lớp học chưa có học sinh trong danh sách để cộng sao thi đua!");
      return;
    }
    const today = getLocalDateString();
    
    // Allocate students in proportion to number of teams
    const perTeam = Math.ceil(students.length / numTeams);
    const startIdx = (winningTeam.id - 1) * perTeam;
    const teamStudents = students.slice(startIdx, startIdx + perTeam);

    if (teamStudents.length === 0) {
      toast.info("Không tìm thấy học sinh nào thuộc đội này!");
      return;
    }

    teamStudents.forEach((st) => {
      addStarLog(
        st.id,
        starAmount,
        "Học tập",
        `Vô địch Trò chơi Đấu Trí Lớp Học (${winningTeam.mascot} ${winningTeam.name})`,
        `Xuất sắc giành chiến thắng trong game học tập cùng các bạn trong ${winningTeam.name}`,
        today
      );
    });

    setAwardedStars(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast.success(`Đã cộng +${starAmount} Sao thi đua cho ${teamStudents.length} học sinh thuộc ${winningTeam.name}! 🌟`);
  };

  // Bộ tạo câu hỏi nhanh theo mẫu sư phạm
  const handleGenerateAIQuiz = async () => {
    if (!aiTopic.trim()) {
      toast.error("Vui lòng nhập tên bài học hoặc chủ đề cần tạo câu hỏi!");
      return;
    }
    setIsAiGenerating(true);
    try {
      // Generate clean questions based on topic
      const generatedQuestions: QuizQuestion[] = [
        {
          id: `ai-q1-${Date.now()}`,
          question: `Kiến thức trọng tâm về "${aiTopic}": Đâu là nhận định chính xác nhất?`,
          options: [
            `A. Khái niệm cơ bản gắn liền với bài học ${aiTopic}`,
            'B. Một ví dụ chưa đầy đủ các bước thực hành',
            'C. Nhận định chưa phù hợp quy chuẩn',
            'D. Khẳng định cần xem xét thêm',
          ],
          correctIndex: 0,
          explanation: `Kiến thức chuẩn của bài học "${aiTopic}" giúp học sinh nắm vững phương pháp vận dụng.`,
          timeLimit: 15,
        },
        {
          id: `ai-q2-${Date.now()}`,
          question: `Trong các ví dụ sau, ví dụ nào thể hiện đúng nhất nội dung "${aiTopic}"?`,
          options: [
            'A. Ví dụ tổng quát mức độ 1',
            'B. Ví dụ ứng dụng thực tiễn chuẩn xác',
            'C. Ví dụ cần bổ sung thêm điều kiện',
            'D. Ví dụ chưa chính xác',
          ],
          correctIndex: 1,
          explanation: 'Lựa chọn B minh họa rõ nét nhất bản chất của bài học.',
          timeLimit: 15,
        },
        {
          id: `ai-q3-${Date.now()}`,
          question: `Để giải quyết nhanh dạng bài tập liên quan đến "${aiTopic}", chúng ta nên:`,
          options: [
            'A. Bỏ qua các bước tính nhẩm',
            'B. Đọc kỹ đề bài và áp dụng công thức/quy tắc đã học',
            'C. Chỉ quan sát đáp án cuối cùng',
            'D. Làm bài theo cảm tính',
          ],
          correctIndex: 1,
          explanation: 'Đọc kỹ đề và nắm vững quy tắc là chìa khóa làm bài chính xác.',
          timeLimit: 12,
        },
        {
          id: `ai-q4-${Date.now()}`,
          question: `Thử thách trí tuệ: Câu hỏi mở rộng nâng cao về "${aiTopic}" dành cho học sinh giỏi:`,
          options: [
            'A. Phương án phân tích đa chiều logic',
            'B. Phương án đơn giản',
            'C. Phương án chưa tối ưu',
            'D. Phương án cần chỉnh sửa',
          ],
          correctIndex: 0,
          explanation: 'Phương án A đòi hỏi tư duy phân tích và vận dụng sáng tạo.',
          timeLimit: 15,
        },
        {
          id: `ai-q5-${Date.now()}`,
          question: `Ý nghĩa và bài học rút ra từ chủ đề "${aiTopic}" trong thực tiễn là:`,
          options: [
            'A. Không có ứng dụng trong đời sống',
            'B. Giúp nâng cao hiểu biết và rèn luyện kỹ năng tự học',
            'C. Chỉ dùng để kiểm tra trên lớp',
            'D. Tùy thuộc vào từng trường hợp',
          ],
          correctIndex: 1,
          explanation: 'Bài học mang lại giá trị thiết thực cho quá trình rèn luyện.',
          timeLimit: 12,
        },
      ];

      const newPack: QuizPack = {
        id: `pack-ai-${Date.now()}`,
        title: `Mẫu nhanh: ${aiTopic} (Lớp ${aiGrade})`,
        description: `Gói câu hỏi tương tác nhanh theo mẫu sư phạm cho chủ đề "${aiTopic}".`,
        subjectCode: 'TONG_HOP',
        grade: aiGrade,
        category: 'TRIVIA_LOGIC',
        questions: generatedQuestions,
        isCustom: true,
      };

      setCustomPacks((prev) => [newPack, ...prev]);
      setSelectedPackId(newPack.id);
      setIsAiModalOpen(false);
      setAiTopic('');
      toast.success(`Đã tạo và lưu bộ 5 câu hỏi mẫu về "${aiTopic}"!`);
    } catch (e) {
      toast.error('Có lỗi xảy ra khi tạo câu hỏi mẫu');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-slate-900 text-white max-w-6xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[96vh] h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🏎️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Đấu Trí Đua Xe Về Đích — Lớp {className}</span>
                </h3>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Smart TV 16:9
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Trò chơi tương tác học tập đa đội (2 – 8 Đội), đếm ngược và tích hợp tự động thưởng Sao thi đua.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? "bg-indigo-600/30 border-indigo-400 text-indigo-200"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
              title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Toàn màn hình Smart TV"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= STAGE 1: SETUP SCREEN ================= */}
        {gameState === "SETUP" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Team & Race Settings */}
              <div className="space-y-4 bg-slate-800/60 rounded-3xl p-5 border border-slate-700/60">
                <h4 className="font-black text-sm text-indigo-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>1. Chọn Số Lượng Đội Tham Gia</span>
                </h4>

                {/* Team Number Selector */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleUpdateNumTeams(num)}
                      className={`py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        numTeams === num
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md scale-105"
                          : "bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600"
                      }`}
                    >
                      {num} Đội
                    </button>
                  ))}
                </div>

                {/* Target Score Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Độ dài đường đua (Điểm về đích):</span>
                    <span className="text-amber-400 font-black">{targetScore} Câu đúng 🏁</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 7, 10].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setTargetScore(score)}
                        className={`py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          targetScore === score
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {score} Điểm
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Teams Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <span className="text-xs font-bold text-slate-400">Danh sách các Đội đua:</span>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {teams.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-700 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{t.mascot}</span>
                          <span className="font-bold text-slate-200">{t.name}</span>
                        </div>
                        <span className={`w-3 h-3 rounded-full ${t.trackColor}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle & Right Column: Choose Quiz Pack */}
              <div className="lg:col-span-2 space-y-4 bg-slate-800/60 rounded-3xl p-5 border border-slate-700/60 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-black text-sm text-indigo-300 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>2. Chọn Bộ Câu Hỏi Môn Học</span>
                    </h4>

                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Tạo Câu Hỏi Mẫu Theo Bài</span>
                    </button>
                  </div>

                  {/* Pack Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {allPacks.map((pack) => (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          selectedPackId === pack.id
                            ? "bg-indigo-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-400"
                            : "bg-slate-900/60 border-slate-700/80 hover:border-slate-500 text-slate-300"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                              {pack.category}
                            </span>
                            <span className="text-xs font-bold text-amber-400">
                              {pack.questions.length} câu hỏi
                            </span>
                          </div>
                          <h5 className="font-black text-sm text-white">{pack.title}</h5>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {pack.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Big Launch Button */}
                <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Gói đang chọn: <strong className="text-white">{activePack.title}</strong> (
                    {activePack.questions.length} câu)
                  </div>

                  <button
                    type="button"
                    onClick={handleStartGame}
                    className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl hover:scale-105 transition-all cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>BẮT ĐẦU VÁN ĐUA CHIẾU SMART TV →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 2: LIVE GAMEPLAY SCREEN ================= */}
        {gameState === "PLAYING" && currentQuestion && (
          <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col justify-between space-y-4">
            {/* 1. ANIMATED RACE TRACK (2 to 8 LANES) */}
            <div className="bg-slate-950/80 rounded-3xl p-4 border border-slate-800 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
                <span>🏁 ĐƯỜNG ĐUA THI ĐUA ({numTeams} ĐỘI)</span>
                <span>ĐÍCH ĐẾN: {targetScore} ĐIỂM 🏆</span>
              </div>

              <div className="space-y-2">
                {teams.map((team) => {
                  const progressPct = Math.min(100, Math.round((team.score / targetScore) * 100));
                  return (
                    <div key={team.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="font-bold flex items-center gap-1.5 text-slate-200">
                          <span>{team.mascot}</span>
                          <span>{team.name}</span>
                        </span>
                        <span className="font-black text-amber-400">{team.score} / {targetScore}</span>
                      </div>

                      {/* Track Bar */}
                      <div className="relative h-7 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center">
                        {/* Finish line checkerboard pattern */}
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20 flex items-center justify-center text-xs">
                          🏁
                        </div>

                        {/* Progress Fill */}
                        <div
                          className={`h-full ${team.trackColor} transition-all duration-500 rounded-xl flex items-center justify-end pr-2`}
                          style={{ width: `${Math.max(8, progressPct)}%` }}
                        >
                          <span className="text-base animate-bounce">{team.mascot}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. QUESTION & TIMER CARD */}
            <div className="bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-xl space-y-4 flex-1 flex flex-col justify-between">
              {/* Question Header & Countdown Timer */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500/20 text-indigo-300 font-black text-xs px-3 py-1 rounded-full border border-indigo-500/30">
                    Câu {currentQuestionIndex + 1} / {activePack.questions.length}
                  </span>
                  <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                    {activePack.title}
                  </span>
                </div>

                {/* Live Countdown Circle */}
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-black text-sm transition-all ${
                      timeLeft <= 4
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{timeLeft}s</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                    title={isTimerRunning ? "Tạm dừng đếm ngược" : "Tiếp tục đếm ngược"}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Big Question Content */}
              <div className="text-base sm:text-xl font-black text-white leading-relaxed text-center py-2">
                {currentQuestion.question}
              </div>

              {/* 4 Answer Options (A, B, C, D) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isCorrect = idx === currentQuestion.correctIndex;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-sm sm:text-base font-bold transition-all flex items-center justify-between ${
                        isAnswerRevealed
                          ? isCorrect
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400 shadow-lg"
                            : "bg-slate-900/40 border-slate-700/50 text-slate-500 opacity-60"
                          : "bg-slate-900/80 border-slate-700 text-slate-200 hover:border-indigo-400"
                      }`}
                    >
                      <span>{opt}</span>
                      {isAnswerRevealed && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Note (When Revealed) */}
              {isAnswerRevealed && currentQuestion.explanation && (
                <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-200 leading-relaxed">
                  💡 <strong>Giải thích sư phạm:</strong> {currentQuestion.explanation}
                </div>
              )}
            </div>

            {/* 3. TEACHER ACTION BAR: REVEAL & AWARD POINTS TO TEAMS */}
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">Cộng điểm cho Đội trả lời đúng:</span>
                <div className="flex flex-wrap gap-1.5">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleAwardPointToTeam(team.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${team.color}`}
                    >
                      <span>{team.mascot}</span> <span>+1 Điểm</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isAnswerRevealed && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAnswerRevealed(true);
                      setIsTimerRunning(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    Hiện Đáp Án
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  <span>Câu Tiếp Theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 3: VICTORY & REWARDS SCREEN ================= */}
        {gameState === "FINISHED" && winningTeam && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center text-5xl sm:text-6xl shadow-2xl animate-bounce">
                {winningTeam.mascot}
              </div>
              <div className="absolute -top-3 -right-3 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>VÔ ĐỊCH</span>
              </div>
            </div>

            <div className="space-y-2 max-w-lg">
              <h2 className="text-2xl sm:text-4xl font-black text-amber-300 tracking-tight">
                Chúc Mừng {winningTeam.name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Đã xuất sắc về đích đầu tiên với <strong className="text-white">{winningTeam.score} điểm</strong> trong gói thử thách "{activePack.title}".
              </p>
            </div>

            {/* Standings List */}
            <div className="w-full max-w-md bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2 text-left">
              <span className="text-xs font-bold text-slate-400">Bảng Xếp Hạng Chung Cuộc:</span>
              <div className="space-y-1.5">
                {[...teams]
                  .sort((a, b) => b.score - a.score)
                  .map((t, rank) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold ${
                        t.id === winningTeam.id
                          ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                          : "bg-slate-900/60 border-slate-700/60 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-black w-5 text-center">#{rank + 1}</span>
                        <span className="text-base">{t.mascot}</span>
                        <span>{t.name}</span>
                      </div>
                      <span className="font-black">{t.score} điểm</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action Buttons: Award Stars & Play Again */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAwardStarsToWinningTeam(3)}
                disabled={awardedStars}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                <span>{awardedStars ? "Đã Cộng +3 Sao Cho Cả Tổ 🌟" : "Thưởng +3 Sao Cho Cả Tổ 🌟"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAwardStarsToWinningTeam(5)}
                disabled={awardedStars}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                <span>{awardedStars ? "Đã Cộng +5 Sao Cho Cả Tổ 🌟" : "Thưởng +5 Sao Siêu Cấp 🌟"}</span>
              </button>

              <button
                type="button"
                onClick={() => setGameState("SETUP")}
                className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Ván Mới</span>
              </button>
            </div>
          </div>
        )}

        {/* TEMPLATE GENERATOR MODAL OVERLAY */}
        {isAiModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsAiModalOpen(false)}
          >
            <div
              className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-black text-sm text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Tạo Câu Hỏi Mẫu Theo Bài Học</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Tên bài học / Chủ đề:</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="VD: Bảng chia 8, Từ chỉ đặc điểm, Không khí và sự cháy..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Khối lớp:</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as GradeLevel[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setAiGrade(g)}
                        className={`py-1.5 rounded-xl font-bold transition-colors ${
                          aiGrade === g
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        Lớp {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAIQuiz}
                  disabled={isAiGenerating}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang Tạo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tạo Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
