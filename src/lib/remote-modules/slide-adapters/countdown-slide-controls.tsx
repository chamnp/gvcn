'use client';

import React from 'react';
import { Clock, Play, Pause, RotateCcw, Plus } from 'lucide-react';
import { RemoteModuleProps } from '../types';

export const CountdownSlideControls: React.FC<RemoteModuleProps> = ({ tvState, sendAction }) => {
  const timeRemaining = Math.max(0, tvState.timeRemaining ?? 0);
  const isRunning = tvState.isTimerRunning ?? false;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = (timeRemaining % 60).toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 border-2 border-cyan-500/60 rounded-3xl p-4.5 space-y-4 shadow-xl animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
              Chế Độ Slide Đếm Giờ Làm Bài
            </span>
            <h4 className="font-bold text-xs text-white">Đồng hồ đếm ngược tiết học</h4>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            isRunning
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {isRunning ? 'Đang chạy' : 'Tạm dừng'}
        </span>
      </div>

      {/* Giant Digital Clock Display */}
      <div className="py-5 bg-slate-950/90 rounded-2xl border border-cyan-500/30 flex flex-col items-center justify-center shadow-inner">
        <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]">
          {minutes}:{seconds}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Đồng bộ thời gian thực với màn hình TV</p>
      </div>

      {/* Main Play / Pause / Reset Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => sendAction(isRunning ? 'TIMER_PAUSE' : 'TIMER_START')}
          className={`py-3.5 px-4 rounded-2xl font-black text-xs shadow-lg flex items-center justify-center space-x-2 active:scale-95 cursor-pointer transition-all ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
          <span>{isRunning ? 'TẠM DỪNG' : 'BẮT ĐẦU ĐẾM'}</span>
        </button>

        <button
          onClick={() => sendAction('TIMER_RESET')}
          className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>ĐẶT LẠI</span>
        </button>
      </div>

      {/* Quick Add Time Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-900/40 text-[11px] font-bold">
        <button
          onClick={() => sendAction('TIMER_ADD_SECONDS', { seconds: 30 })}
          className="py-2 px-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-cyan-300 rounded-xl border border-cyan-900/60 flex items-center justify-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" /> 30 Giây
        </button>
        <button
          onClick={() => sendAction('TIMER_ADD_SECONDS', { seconds: 60 })}
          className="py-2 px-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-cyan-300 rounded-xl border border-cyan-900/60 flex items-center justify-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" /> 1 Phút
        </button>
        <button
          onClick={() => sendAction('TIMER_ADD_SECONDS', { seconds: 120 })}
          className="py-2 px-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-cyan-300 rounded-xl border border-cyan-900/60 flex items-center justify-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" /> 2 Phút
        </button>
      </div>
    </div>
  );
};
