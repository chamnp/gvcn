'use client';

import React from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Award,
  Users,
} from 'lucide-react';
import { RemoteGameModule, RemoteModuleProps } from '../types';

// ─── 1. VÒNG QUAY MAY MẮN (LUCKY WHEEL) ──────────────────────────
export const LuckyWheelModule: RemoteGameModule = {
  id: 'WHEEL',
  title: 'Vòng Quay May Mắn',
  iconEmoji: '🎡',
  shortDesc: 'Gọi ngẫu nhiên học sinh trả lời & tương tác',
  category: 'GAME',
  renderControls: ({ tvState, sendAction }: RemoteModuleProps) => (
    <div className="space-y-3 animate-in fade-in">
      {tvState.luckyWheelWinner && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-400/50 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-300">Vừa trúng quay:</span>
            <h4 className="font-black text-sm text-white">{tvState.luckyWheelWinner}</h4>
          </div>
          <button
            onClick={() => {
              const matched = tvState.studentsList?.find((s) => s.fullName === tvState.luckyWheelWinner);
              sendAction('AWARD_STAR', {
                studentId: matched?.id || '',
                studentName: tvState.luckyWheelWinner,
                points: 1,
                reason: 'Phát biểu đúng qua Vòng quay',
              });
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-xs shadow-md flex items-center space-x-1 active:scale-95 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>+1 SAO</span>
          </button>
        </div>
      )}

      <button
        onClick={() => sendAction('SPIN_WHEEL')}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 active:scale-95 text-white font-black text-xs shadow-lg flex items-center justify-center space-x-2 border border-amber-300/40 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 animate-bounce" />
        <span>🎡 BẤM ĐỂ QUAY TRÊN SMART TV</span>
      </button>
    </div>
  ),
};

// ─── 2. ĐỒNG HỒ ĐẾM NGƯỢC (CLASSROOM TIMER) ──────────────────────
export const ClassroomTimerModule: RemoteGameModule = {
  id: 'TIMER',
  title: 'Đồng Hồ Đếm Ngược',
  iconEmoji: '⏱️',
  shortDesc: 'Bấm giờ hoạt động nhóm, làm bài, thảo luận',
  category: 'MANAGEMENT',
  renderControls: ({ tvState, sendAction }: RemoteModuleProps) => {
    const isRunning = tvState.isTimerRunning ?? false;
    const timeRemaining = Math.max(0, tvState.timeRemaining ?? 0);
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = (timeRemaining % 60).toString().padStart(2, '0');

    return (
      <div className="space-y-3 animate-in fade-in">
        <div className="py-4 bg-slate-950/80 rounded-2xl border border-cyan-500/30 flex flex-col items-center justify-center">
          <div className="text-4xl font-mono font-black tracking-widest text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            {minutes}:{seconds}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">Thời gian đếm lùi trên TV</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => sendAction(isRunning ? 'TIMER_PAUSE' : 'TIMER_START')}
            className={`py-3 rounded-2xl font-black text-xs shadow-md flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer ${
              isRunning ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>{isRunning ? 'TẠM DỪNG' : 'CHẠY GIỜ'}</span>
          </button>

          <button
            onClick={() => sendAction('TIMER_RESET')}
            className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>ĐẶT LẠI</span>
          </button>
        </div>

        {/* Quick presets */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 text-[11px] font-bold">
          <button
            onClick={() => sendAction('TIMER_SET', { seconds: 60 })}
            className="py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl border border-slate-800 cursor-pointer active:scale-95"
          >
            1 Phút
          </button>
          <button
            onClick={() => sendAction('TIMER_SET', { seconds: 180 })}
            className="py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl border border-slate-800 cursor-pointer active:scale-95"
          >
            3 Phút
          </button>
          <button
            onClick={() => sendAction('TIMER_SET', { seconds: 300 })}
            className="py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl border border-slate-800 cursor-pointer active:scale-95"
          >
            5 Phút
          </button>
          <button
            onClick={() => sendAction('TIMER_SET', { seconds: 600 })}
            className="py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl border border-slate-800 cursor-pointer active:scale-95"
          >
            10 Phút
          </button>
        </div>
      </div>
    );
  },
};

// ─── 3. ĐÈN GIAO THÔNG NỀ NẾP (TRAFFIC LIGHT) ─────────────────────
export const TrafficLightModule: RemoteGameModule = {
  id: 'TRAFFIC',
  title: 'Đèn Tín Hiệu Nề Nếp',
  iconEmoji: '🚦',
  shortDesc: 'Điều phối âm lượng và trật tự lớp học',
  category: 'MANAGEMENT',
  renderControls: ({ tvState, sendAction }: RemoteModuleProps) => {
    const currentStatus = tvState.trafficLightStatus;
    return (
      <div className="grid grid-cols-3 gap-2 text-xs font-black animate-in fade-in">
        <button
          onClick={() => sendAction('TRAFFIC_LIGHT', { status: 'GREEN' })}
          className={`py-4 rounded-2xl border-2 active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-lg transition-all ${
            currentStatus === 'GREEN'
              ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
              : 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
          }`}
        >
          <span className="text-xl">🟢</span>
          <span className="text-[11px]">Thảo Luận</span>
        </button>

        <button
          onClick={() => sendAction('TRAFFIC_LIGHT', { status: 'YELLOW' })}
          className={`py-4 rounded-2xl border-2 active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-lg transition-all ${
            currentStatus === 'YELLOW'
              ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50 scale-105'
              : 'bg-amber-950/90 text-amber-300 border-amber-600'
          }`}
        >
          <span className="text-xl">🟡</span>
          <span className="text-[11px]">Nói Nhỏ</span>
        </button>

        <button
          onClick={() => sendAction('TRAFFIC_LIGHT', { status: 'RED' })}
          className={`py-4 rounded-2xl border-2 active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer shadow-lg transition-all ${
            currentStatus === 'RED'
              ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/50 scale-105'
              : 'bg-rose-950/90 text-rose-300 border-rose-600'
          }`}
        >
          <span className="text-xl">🔴</span>
          <span className="text-[11px]">Trật Tự</span>
        </button>
      </div>
    );
  },
};

// ─── 4. ĐUA XE TRẮC NGHIỆM (TEAM QUIZ BATTLE) ─────────────────────
export const TeamQuizBattleModule: RemoteGameModule = {
  id: 'TEAM_QUIZ',
  title: 'Đua Xe Trắc Nghiệm',
  iconEmoji: '🏎️',
  shortDesc: 'Thi đấu trả lời trắc nghiệm theo 4 tổ',
  category: 'GAME',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="space-y-2.5 animate-in fade-in">
      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
        Cộng Điểm Tăng Tốc Cho Các Tổ
      </span>
      <div className="grid grid-cols-2 gap-2 text-xs font-black">
        <button
          onClick={() => sendAction('GAME_ACTION', { tool: 'TEAM_QUIZ', action: 'ADD_POINT', team: 1 })}
          className="p-3 rounded-2xl bg-rose-950/80 border border-rose-600 text-rose-200 active:scale-95 flex items-center justify-between cursor-pointer"
        >
          <span>🏎️ Tổ 1 (Đỏ)</span>
          <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px]">+100m</span>
        </button>

        <button
          onClick={() => sendAction('GAME_ACTION', { tool: 'TEAM_QUIZ', action: 'ADD_POINT', team: 2 })}
          className="p-3 rounded-2xl bg-blue-950/80 border border-blue-600 text-blue-200 active:scale-95 flex items-center justify-between cursor-pointer"
        >
          <span>🚙 Tổ 2 (Xanh)</span>
          <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px]">+100m</span>
        </button>

        <button
          onClick={() => sendAction('GAME_ACTION', { tool: 'TEAM_QUIZ', action: 'ADD_POINT', team: 3 })}
          className="p-3 rounded-2xl bg-amber-950/80 border border-amber-600 text-amber-200 active:scale-95 flex items-center justify-between cursor-pointer"
        >
          <span>🚖 Tổ 3 (Vàng)</span>
          <span className="bg-amber-600 text-white px-2 py-0.5 rounded-full text-[10px]">+100m</span>
        </button>

        <button
          onClick={() => sendAction('GAME_ACTION', { tool: 'TEAM_QUIZ', action: 'ADD_POINT', team: 4 })}
          className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 active:scale-95 flex items-center justify-between cursor-pointer"
        >
          <span>🏎️ Tổ 4 (Lục)</span>
          <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px]">+100m</span>
        </button>
      </div>

      <button
        onClick={() => sendAction('GAME_ACTION', { tool: 'TEAM_QUIZ', action: 'NEXT_QUESTION' })}
        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs cursor-pointer"
      >
        ⏭️ Chuyển Sang Câu Hỏi Tiếp Theo
      </button>
    </div>
  ),
};

// ─── 5. HỘP QUÀ BÍ MẬT (MYSTERY CHEST) ───────────────────────────
export const MysteryChestModule: RemoteGameModule = {
  id: 'CHEST',
  title: 'Hộp Quà Bí Mật',
  iconEmoji: '🎁',
  shortDesc: 'Mở quà ngẫu nhiên nhận phần thưởng hoặc thử thách',
  category: 'GAME',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="space-y-2.5 animate-in fade-in">
      <button
        onClick={() => sendAction('GAME_ACTION', { tool: 'CHEST', action: 'OPEN_RANDOM' })}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 active:scale-95 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center space-x-2 border border-yellow-300/40 cursor-pointer"
      >
        <span className="text-lg">🎁</span>
        <span>MỞ 1 HỘP QUÀ BÍ MẬT NGẪU NHIÊN TRÊN TV</span>
      </button>
    </div>
  ),
};

// ─── 6. GHÉP CẶP NGẪU NHIÊN (SMART PAIR) ─────────────────────────
export const SmartPairModule: RemoteGameModule = {
  id: 'PAIR',
  title: 'Ghép Đôi Học Tập',
  iconEmoji: '👥',
  shortDesc: 'Ghép cặp học tập ngẫu nhiên đôi bạn cùng tiến',
  category: 'INTERACTION',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="space-y-2.5 animate-in fade-in">
      <button
        onClick={() => sendAction('GAME_ACTION', { tool: 'PAIR', action: 'RE_PAIR' })}
        className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer"
      >
        <Users className="w-4 h-4" />
        <span>🔄 TẠO CÁC CẶP ĐÔI HỌC TẬP MỚI</span>
      </button>
    </div>
  ),
};

// ─── 7. NẠP NĂNG LƯỢNG 2 PHÚT (BRAIN BREAK) ──────────────────────
export const BrainBreakModule: RemoteGameModule = {
  id: 'BRAIN_BREAK',
  title: 'Nạp Năng Lượng 2 Phút',
  iconEmoji: '🧘',
  shortDesc: 'Vận động thể dục giữa giờ giải tỏa căng thẳng',
  category: 'ENERGY',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="space-y-2.5 animate-in fade-in">
      <button
        onClick={() => sendAction('GAME_ACTION', { tool: 'BRAIN_BREAK', action: 'NEXT_EXERCISE' })}
        className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer"
      >
        <span className="text-lg">🏃</span>
        <span>CHUYỂN ĐỘNG TÁC THỂ DỤC MỚI</span>
      </button>
    </div>
  ),
};

// ─── 8. ĐIỂM DANH CẢM XÚC (DAILY MOOD) ───────────────────────────
export const DailyMoodModule: RemoteGameModule = {
  id: 'MOOD',
  title: 'Điểm Danh Cảm Xúc',
  iconEmoji: '☀️',
  shortDesc: 'Đo lường mức độ tích cực đầu giờ của học sinh',
  category: 'INTERACTION',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="text-center py-2 text-xs text-slate-300">
      <p className="font-bold">Đang hiển thị Cây Cảm Xúc trên màn hình TV</p>
      <span className="text-[10px] text-slate-500">Học sinh chạm vào TV hoặc quét mã để chọn tâm trạng</span>
    </div>
  ),
};

// ─── 9. BẢNG LỆNH NHIỆM VỤ (TASK CANVAS) ─────────────────────────
export const TaskCanvasModule: RemoteGameModule = {
  id: 'TASK_CANVAS',
  title: 'Bảng Lệnh Nhiệm Vụ',
  iconEmoji: '📋',
  shortDesc: 'Hiển thị các bước làm bài tập và nhắc nhở',
  category: 'MANAGEMENT',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="text-center py-2 text-xs text-slate-300">
      <p className="font-bold">Đang hiển thị Nhiệm vụ bài học trên TV</p>
      <span className="text-[10px] text-slate-500">Giáo viên có thể đóng lại bất kỳ lúc nào bằng nút [Đóng TV]</span>
    </div>
  ),
};

// ─── 10. ĐO ĐỘ ỒN LỚP HỌC (NOISE METER) ──────────────────────────
export const NoiseMeterModule: RemoteGameModule = {
  id: 'NOISE',
  title: 'Đo Độ Ồn Lớp Học',
  iconEmoji: '🎤',
  shortDesc: 'Bắt âm thanh qua microphone đo độ ồn',
  category: 'MANAGEMENT',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="text-center py-2 text-xs text-slate-300">
      <p className="font-bold">Đang đo âm lượng phòng học theo thời gian thực</p>
      <span className="text-[10px] text-slate-500">TV phát chuông cảnh báo nếu lớp ồn vượt ngưỡng</span>
    </div>
  ),
};

// ─── 11. BẢNG VINH DANH SAO (LEADERBOARD) ────────────────────────
export const LeaderboardModule: RemoteGameModule = {
  id: 'LEADERBOARD',
  title: 'Bảng Vinh Danh Sao',
  iconEmoji: '🏆',
  shortDesc: 'Bảng xếp hạng sao thi đua cá nhân và tổ',
  category: 'GAME',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="space-y-2 animate-in fade-in">
      <button
        onClick={() => sendAction('PLAY_SFX', { type: 'victory' })}
        className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
      >
        <span className="text-lg">🎺</span>
        <span>PHÁT NHẠC CHIẾN THẮNG TRÊN TV</span>
      </button>
    </div>
  ),
};

// ─── 12. HỘP ÂM THANH LỚP HỌC (SOUNDBOARD) ───────────────────────
export const SoundboardModule: RemoteGameModule = {
  id: 'SOUNDBOARD',
  title: 'Hộp Âm Thanh Lớp Học',
  iconEmoji: '🔊',
  shortDesc: '6 hiệu ứng vỗ tay, chuông báo, trống hồi hộp',
  category: 'INTERACTION',
  renderControls: ({ sendAction }: RemoteModuleProps) => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <button
        onClick={() => sendAction('PLAY_SFX', { type: 'applause' })}
        className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-amber-300 font-bold flex items-center space-x-2 cursor-pointer"
      >
        <span className="text-lg">👏</span>
        <span>Vỗ Tay Khen</span>
      </button>
      <button
        onClick={() => sendAction('PLAY_SFX', { type: 'victory' })}
        className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-emerald-300 font-bold flex items-center space-x-2 cursor-pointer"
      >
        <span className="text-lg">🎺</span>
        <span>Chiến Thắng</span>
      </button>
      <button
        onClick={() => sendAction('PLAY_SFX', { type: 'drumroll' })}
        className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-cyan-300 font-bold flex items-center space-x-2 cursor-pointer"
      >
        <span className="text-lg">🥁</span>
        <span>Trống Hồi Hộp</span>
      </button>
      <button
        onClick={() => sendAction('PLAY_SFX', { type: 'confetti' })}
        className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-pink-300 font-bold flex items-center space-x-2 cursor-pointer"
      >
        <span className="text-lg">🎉</span>
        <span>Pháo Hoa</span>
      </button>
      <button
        onClick={() => sendAction('PLAY_SFX', { type: 'bell' })}
        className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-yellow-300 font-bold flex items-center space-x-2 cursor-pointer"
      >
        <span className="text-lg">🔔</span>
        <span>Chuông Báo</span>
      </button>
      <button
        onClick={() => sendAction('PLAY_SFX', { type: 'buzzer' })}
        className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-rose-300 font-bold flex items-center space-x-2 cursor-pointer"
      >
        <span className="text-lg">🚨</span>
        <span>Tiếc Quá</span>
      </button>
    </div>
  ),
};
