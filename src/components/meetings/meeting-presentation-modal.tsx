'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Award,
  Users,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { ClassInfo, SchoolInfo, Student, ParentMeetingDoc, MeetingAgendaTopic } from '@/types';
import confetti from 'canvas-confetti';

interface DynamicPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: ParentMeetingDoc;
  classInfo: ClassInfo;
  schoolInfo: SchoolInfo;
  students: Student[];
}

export function DynamicPresentationModal({
  isOpen,
  onClose,
  meeting,
  classInfo,
  schoolInfo,
  students,
}: DynamicPresentationModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeTopics = (meeting.agendaTopics || []).filter((t) => t.isEnabled);

  const totalStudents = students.length;
  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;
  const boardingCount = students.filter((s) => s.isBoarding).length;

  const currentTopic = activeTopics[currentSlideIndex] || null;

  const handleNext = () => {
    if (currentSlideIndex < activeTopics.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(currentSlideIndex - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlideIndex, activeTopics.length]);

  if (!isOpen || !currentTopic) return null;

  const renderSlideContent = (topic: MeetingAgendaTopic) => {
    switch (topic.layout) {
      case 'TITLE':
        return (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl shadow-2xl border border-white/30">
              {topic.iconEmoji || '🏫'}
            </div>
            <div className="space-y-3 max-w-3xl">
              <span className="bg-yellow-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md inline-block">
                NĂM HỌC {schoolInfo.schoolYear || '2026 - 2027'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {topic.title}
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 font-semibold">
                Trường Tiểu học {schoolInfo.name} • Lớp {classInfo.name}
              </p>
            </div>

            <div className="space-y-2 max-w-2xl bg-white/10 p-6 rounded-3xl border border-white/20 text-left text-sm text-blue-100">
              {topic.talkingPoints.map((point, idx) => (
                <p key={idx} className="flex items-start gap-2">
                  <span className="text-yellow-300 font-bold shrink-0">✦</span>
                  <span>{point}</span>
                </p>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs bg-white/10 px-6 py-2.5 rounded-2xl border border-white/20 backdrop-blur-md">
              <span>👩‍🏫 GVCN: <strong>{classInfo.teacherName}</strong></span>
              <span>•</span>
              <span>📅 Ngày: <strong>{meeting.meetingDate}</strong></span>
              <span>•</span>
              <span>📍 {meeting.location}</span>
            </div>
          </div>
        );

      case 'STATS':
        return (
          <div className="h-full flex flex-col justify-center space-y-8 max-w-4xl mx-auto animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-2">
                <span className="text-3xl">👥</span>
                <p className="text-xs text-blue-200 font-bold uppercase">Tổng Sĩ Số</p>
                <h3 className="text-4xl font-black text-white">{totalStudents}</h3>
                <p className="text-[11px] text-blue-100">100% đúng độ tuổi</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-2">
                <span className="text-3xl">👦</span>
                <p className="text-xs text-blue-200 font-bold uppercase">Học Sinh Nam</p>
                <h3 className="text-4xl font-black text-blue-300">{maleCount}</h3>
                <p className="text-[11px] text-blue-100">Chiếm {Math.round((maleCount / (totalStudents || 1)) * 100)}%</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-2">
                <span className="text-3xl">👧</span>
                <p className="text-xs text-blue-200 font-bold uppercase">Học Sinh Nữ</p>
                <h3 className="text-4xl font-black text-pink-300">{femaleCount}</h3>
                <p className="text-[11px] text-blue-100">Chiếm {Math.round((femaleCount / (totalStudents || 1)) * 100)}%</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-2">
                <span className="text-3xl">🍱</span>
                <p className="text-xs text-blue-200 font-bold uppercase">Ăn Bán Trú</p>
                <h3 className="text-4xl font-black text-emerald-300">{boardingCount}</h3>
                <p className="text-[11px] text-blue-100">Đăng ký ăn trưa</p>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-3xl border border-white/20 space-y-3">
              <h4 className="text-base font-black text-yellow-300 flex items-center gap-2">
                <span>🌟 Các Điểm Nhấn Trọng Tâm:</span>
              </h4>
              <ul className="space-y-2 text-sm text-blue-50 list-disc list-inside">
                {topic.talkingPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'GRID_CARDS':
        return (
          <div className="h-full flex flex-col justify-center space-y-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/15 p-6 rounded-3xl border border-white/20 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-2xl font-black">
                  📚
                </div>
                <h4 className="font-black text-base text-white">Môn Học & Hoạt Động</h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Đánh giá 3 mức: <strong>Hoàn thành tốt (T)</strong>, <strong>Hoàn thành (H)</strong>, <strong>Chưa hoàn thành (C)</strong>.
                </p>
              </div>

              <div className="bg-white/15 p-6 rounded-3xl border border-white/20 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl font-black">
                  🌱
                </div>
                <h4 className="font-black text-base text-white">Phẩm Chất Chủ Yếu</h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  5 Phẩm chất: <em>Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm</em>. Xếp loại: <strong>Tốt (T)</strong>, <strong>Đạt (Đ)</strong>.
                </p>
              </div>

              <div className="bg-white/15 p-6 rounded-3xl border border-white/20 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center text-2xl font-black">
                  🎯
                </div>
                <h4 className="font-black text-base text-white">Năng Lực Cốt Lõi</h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Tự chủ & tự học, giao tiếp & hợp tác, giải quyết vấn đề và sáng tạo cùng các năng lực môn học.
                </p>
              </div>
            </div>

            <div className="bg-white/10 p-5 rounded-3xl border border-white/20 space-y-2">
              <h4 className="font-black text-sm text-yellow-300">Ý Kiến Hướng Dẫn Của Cô Giáo:</h4>
              <ul className="space-y-1.5 text-xs text-blue-100 list-disc list-inside">
                {topic.talkingPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'COMMITTEE':
        return (
          <div className="h-full flex flex-col justify-center space-y-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="bg-white/15 p-6 rounded-3xl border border-white/20 space-y-4">
              <h4 className="font-black text-lg text-yellow-300 flex items-center gap-2">
                <span>👥 Ban Đại Diện Cha Mẹ Học Sinh Lớp {classInfo.name}:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(meeting.committeeMembers || []).map((m, idx) => (
                  <div key={idx} className="bg-white/90 text-slate-900 p-4 rounded-2xl space-y-1 shadow-md">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {m.role === 'TRUONG_BAN' ? 'Trưởng Ban' : m.role === 'PHO_BAN' ? 'Phó Ban' : 'Ủy Viên'}
                    </span>
                    <h5 className="font-black text-sm">{m.fullName}</h5>
                    <p className="text-xs text-slate-600">PH em: <strong>{m.studentName}</strong></p>
                    <p className="text-xs text-blue-600 font-mono font-bold">📞 {m.phone}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 p-5 rounded-3xl border border-white/20 space-y-2">
              <h4 className="font-black text-sm text-yellow-300">Nội Dung Thảo Luận:</h4>
              <ul className="space-y-1.5 text-xs text-blue-100 list-disc list-inside">
                {topic.talkingPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex flex-col justify-center space-y-6 max-w-3xl mx-auto animate-in fade-in">
            <div className="bg-white/15 p-8 rounded-3xl border border-white/20 space-y-4 shadow-xl">
              <div className="flex items-center space-x-3 border-b border-white/15 pb-3">
                <span className="text-3xl">{topic.iconEmoji}</span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{topic.title}</h3>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-blue-100">
                {topic.talkingPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white max-w-6xl w-full h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col justify-between p-6 sm:p-10 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/15 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{currentTopic.iconEmoji}</span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
                {currentTopic.title}
              </h3>
              <p className="text-xs text-blue-200">
                Dự kiến {currentTopic.durationMinutes} phút • Lớp {classInfo.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-blue-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              Slide {currentSlideIndex + 1} / {activeTopics.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          {renderSlideContent(currentTopic)}
        </div>

        <div className="flex items-center justify-between border-t border-white/15 pt-4 shrink-0">
          <button
            type="button"
            disabled={currentSlideIndex === 0}
            onClick={handlePrev}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Slide Trước</span>
          </button>

          <div className="flex items-center gap-1.5">
            {activeTopics.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx ? 'bg-yellow-400 w-8' : 'bg-white/30 hover:bg-white/50 w-2.5'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-lg transition-all transform active:scale-95 cursor-pointer"
          >
            <span>{currentSlideIndex === activeTopics.length - 1 ? 'Hoàn Tất Trình Chiếu 🎉' : 'Slide Kế Tiếp'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
