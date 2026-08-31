'use client';

import React from 'react';
import { Sparkles, Award, RotateCcw } from 'lucide-react';
import { RemoteModuleProps } from '../types';

export const WheelSlideControls: React.FC<RemoteModuleProps> = ({
  tvState,
  sendAction,
  onAwardStar,
}) => {
  const winner = tvState.luckyWheelWinner;

  return (
    <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-4.5 space-y-4 shadow-xl animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
            🎡
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Chế Độ Vòng Quay May Mắn
            </span>
            <h4 className="font-bold text-xs text-white">Gọi ngẫu nhiên học sinh trả lời</h4>
          </div>
        </div>
      </div>

      {/* Winner Spotlight Box if someone was selected */}
      {winner && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-400/50 flex items-center justify-between shadow-inner animate-in zoom-in-95">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🎉</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                Học sinh vừa trúng quay:
              </span>
              <h4 className="font-black text-sm text-white">{winner}</h4>
            </div>
          </div>

          <button
            onClick={() => {
              const matchedStudent = tvState.studentsList?.find((s) => s.fullName === winner);
              if (matchedStudent) {
                sendAction('AWARD_STAR', {
                  studentId: matchedStudent.id,
                  studentName: matchedStudent.fullName,
                  points: 1,
                  reason: 'Phát biểu đúng qua Vòng quay',
                });
              } else {
                sendAction('PLAY_SFX', { type: 'victory' });
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 text-slate-950 font-black text-xs shadow-md flex items-center space-x-1 active:scale-95 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>+1 SAO</span>
          </button>
        </div>
      )}

      {/* Main Wheel Spin Trigger */}
      <button
        onClick={() => sendAction('SPIN_WHEEL')}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center space-x-2 border border-amber-300/50 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 fill-slate-950 animate-bounce" />
        <span>🎡 QUAY VÒNG QUAY NGAY TRÊN TV</span>
      </button>
    </div>
  );
};
