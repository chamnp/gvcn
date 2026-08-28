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
  Maximize2,
  Minimize2,
  Palette,
  Play,
  Pause,
  Pointer,
  ZoomIn,
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

type PresentationTheme = 'MIDNIGHT' | 'SUNRISE' | 'MINT_GARDEN' | 'ROYAL_PURPLE';

const THEME_STYLES: Record<PresentationTheme, { bg: string; name: string; accent: string; cardBg: string }> = {
  MIDNIGHT: {
    name: '🌌 Đại Dương Tinh Tú',
    bg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950',
    accent: 'from-amber-400 to-orange-500',
    cardBg: 'bg-white/10 border-white/20',
  },
  SUNRISE: {
    name: '🌅 Hoàng Hôn Rực Rỡ',
    bg: 'bg-gradient-to-br from-rose-950 via-orange-950 to-slate-950',
    accent: 'from-yellow-400 to-rose-400',
    cardBg: 'bg-white/10 border-amber-400/30',
  },
  MINT_GARDEN: {
    name: '🍃 Vườn Xanh Tri Thức',
    bg: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950',
    accent: 'from-emerald-400 to-teal-300',
    cardBg: 'bg-white/10 border-emerald-400/30',
  },
  ROYAL_PURPLE: {
    name: '👑 Hoàng Gia Trang Trọng',
    bg: 'bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950',
    accent: 'from-amber-300 to-yellow-500',
    cardBg: 'bg-white/10 border-purple-400/30',
  },
};

export function DynamicPresentationModal({
  isOpen,
  onClose,
  meeting,
  classInfo,
  schoolInfo,
  students,
}: DynamicPresentationModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [theme, setTheme] = useState<PresentationTheme>('MIDNIGHT');
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTopics = (meeting.agendaTopics || []).filter((t) => t.isEnabled);

  const totalStudents = students.length;
  const maleCount = students.filter((s) => s.gender === 'Nam').length;
  const femaleCount = students.filter((s) => s.gender === 'Nữ').length;
  const boardingCount = students.filter((s) => s.isBoarding).length;

  const currentTopic = activeTopics[currentSlideIndex] || null;
  const currentThemeStyle = THEME_STYLES[theme];

  // Laser Pointer tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (laserActive && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLaserPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Auto-play slideshow effect
  useEffect(() => {
    if (!isAutoPlaying || !isOpen) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev < activeTopics.length - 1 ? prev + 1 : 0));
    }, 10000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isOpen, activeTopics.length]);

  const handleNext = () => {
    if (currentSlideIndex < activeTopics.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      confetti({ particleCount: 120, spread: 85, origin: { y: 0.6 } });
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
      if (e.key === 'Escape') {
        if (lightboxImage) setLightboxImage(null);
        else onClose();
      }
      if (e.key.toLowerCase() === 'l') setLaserActive((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlideIndex, activeTopics.length, lightboxImage]);

  if (!isOpen || !currentTopic) return null;

  // Render Slide Contents
  const renderSlideContent = (topic: MeetingAgendaTopic) => {
    switch (topic.layout) {
      case 'TITLE':
        return (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl shadow-2xl border border-white/30 animate-bounce duration-1000">
              {topic.iconEmoji || '🏫'}
            </div>
            <div className="space-y-3 max-w-3xl">
              <span className="bg-yellow-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg inline-block">
                NĂM HỌC {schoolInfo.schoolYear || '2026 - 2027'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {topic.title}
              </h1>
              <p className="text-lg sm:text-2xl text-blue-100 font-bold">
                Trường Tiểu học {schoolInfo.name} • Lớp {classInfo.name}
              </p>
            </div>

            <div className="space-y-2 max-w-2xl bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-left text-sm text-blue-100 shadow-xl">
              {topic.talkingPoints.map((point, idx) => (
                <p key={idx} className="flex items-start gap-2.5">
                  <span className="text-yellow-300 font-bold text-base shrink-0">✦</span>
                  <span className="leading-relaxed font-medium">{point}</span>
                </p>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm bg-white/10 px-6 py-2.5 rounded-2xl border border-white/20 backdrop-blur-md shadow-md">
              <span>👩‍🏫 GVCN: <strong>{classInfo.teacherName}</strong></span>
              <span>•</span>
              <span>📅 Ngày: <strong>{meeting.meetingDate}</strong></span>
              <span>•</span>
              <span>📍 {meeting.location}</span>
            </div>
          </div>
        );

      case 'PHOTO_GALLERY':
        return (
          <div className="h-full flex flex-col justify-center space-y-4 max-w-5xl mx-auto animate-in fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                <span>{topic.iconEmoji || '📸'}</span>
                <span>{topic.title}</span>
              </h2>
              {topic.imageCaption && (
                <p className="text-xs sm:text-sm text-yellow-200 font-semibold italic">
                  "{topic.imageCaption}"
                </p>
              )}
            </div>

            {/* Photos Grid with Lightbox Zoom */}
            {topic.imageUrls && topic.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                {topic.imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxImage(url)}
                    className="relative group rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-900 aspect-4/3 cursor-pointer transform hover:scale-105 hover:z-10 transition-all duration-300"
                  >
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-xs font-bold flex items-center gap-1">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Phóng to ảnh</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/10 p-8 rounded-3xl border border-white/20 text-center text-blue-100">
                Chưa có ảnh nào được thêm vào phần này.
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs sm:text-sm text-blue-100 space-y-1">
              {topic.talkingPoints.map((point, idx) => (
                <p key={idx} className="flex items-center gap-2">
                  <span className="text-yellow-300 font-bold">★</span>
                  <span>{point}</span>
                </p>
              ))}
            </div>
          </div>
        );

      case 'SPLIT_IMAGE_TEXT':
        return (
          <div className="h-full flex flex-col md:flex-row items-center justify-center gap-6 max-w-5xl mx-auto animate-in fade-in">
            {/* Left: Featured Image */}
            <div className="w-full md:w-1/2 aspect-4/3 rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl relative group">
              <img
                src={topic.imageUrls?.[0] || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80'}
                alt="Featured"
                className="w-full h-full object-cover"
              />
              {topic.imageCaption && (
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 p-3 text-xs text-yellow-200 font-semibold backdrop-blur-xs">
                  {topic.imageCaption}
                </div>
              )}
            </div>

            {/* Right: Talking Points */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="flex items-center space-x-3 border-b border-white/20 pb-3">
                <span className="text-3xl">{topic.iconEmoji}</span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{topic.title}</h3>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-blue-100">
                {topic.talkingPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white/10 p-3 rounded-2xl border border-white/15 backdrop-blur-md">
                    <span className="w-5 h-5 rounded-full bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'STATS':
        return (
          <div className="h-full flex flex-col justify-center space-y-8 max-w-4xl mx-auto animate-in fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-2 shadow-xl">
                <span className="text-3xl">👥</span>
                <p className="text-xs text-blue-200 font-bold uppercase">Tổng Sĩ Số</p>
                <h3 className="text-4xl sm:text-5xl font-black text-white">{totalStudents}</h3>
                <p className="text-[11px] text-blue-100">100% đúng độ tuổi</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-2 shadow-xl">
                <span className="text-3xl">👦</span>
                <p className="text-xs text-blue-200 font-bold uppercase">Học Sinh Nam</p>
                <h3 className="text-4xl sm:text-5xl font-black text-blue-300">{maleCount}</h3>
                <p className="text-[11px] text-blue-100">Chiếm {Math.round((maleCount / (totalStudents || 1)) * 100)}%</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-2 shadow-xl">
                <span className="text-3xl">👧</span>
                <p className="text-xs text-blue-200 font-bold uppercase">Học Sinh Nữ</p>
                <h3 className="text-4xl sm:text-5xl font-black text-pink-300">{femaleCount}</h3>
                <p className="text-[11px] text-blue-100">Chiếm {Math.round((femaleCount / (totalStudents || 1)) * 100)}%</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-2 shadow-xl">
                <span className="text-3xl">🍱</span>
                <p className="text-xs text-blue-200 font-bold uppercase">Ăn Bán Trú</p>
                <h3 className="text-4xl sm:text-5xl font-black text-emerald-300">{boardingCount}</h3>
                <p className="text-[11px] text-blue-100">Đăng ký ăn trưa</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-3 shadow-xl">
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
              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-3 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
                  📚
                </div>
                <h4 className="font-black text-base text-white">Môn Học & Hoạt Động</h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Đánh giá 3 mức: <strong>Hoàn thành tốt (T)</strong>, <strong>Hoàn thành (H)</strong>, <strong>Chưa hoàn thành (C)</strong>.
                </p>
              </div>

              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-3 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
                  🌱
                </div>
                <h4 className="font-black text-base text-white">Phẩm Chất Chủ Yếu</h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  5 Phẩm chất: <em>Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm</em>. Xếp loại: <strong>Tốt (T)</strong>, <strong>Đạt (Đ)</strong>.
                </p>
              </div>

              <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-3 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center text-2xl font-black shadow-md">
                  🎯
                </div>
                <h4 className="font-black text-base text-white">Năng Lực Cốt Lõi</h4>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Tự chủ & tự học, giao tiếp & hợp tác, giải quyết vấn đề và sáng tạo cùng các năng lực môn học.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 space-y-2 shadow-xl">
              <h4 className="font-black text-sm text-yellow-300">Ý Kiến Hướng Dẫn Của Cô Giáo:</h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-blue-100 list-disc list-inside">
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
            <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-4 shadow-xl">
              <h4 className="font-black text-xl text-yellow-300 flex items-center gap-2">
                <span>👥 Ban Đại Diện Cha Mẹ Học Sinh Lớp {classInfo.name}:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(meeting.committeeMembers || []).map((m, idx) => (
                  <div key={idx} className="bg-white/95 text-slate-900 p-4 rounded-2xl space-y-1 shadow-lg border border-slate-200">
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

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 space-y-2 shadow-xl">
              <h4 className="font-black text-sm text-yellow-300">Nội Dung Thảo Luận:</h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-blue-100 list-disc list-inside">
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
            <div className="bg-white/15 backdrop-blur-md p-8 rounded-3xl border border-white/20 space-y-4 shadow-2xl">
              <div className="flex items-center space-x-3 border-b border-white/15 pb-3">
                <span className="text-4xl">{topic.iconEmoji}</span>
                <h3 className="text-xl sm:text-3xl font-black text-white">{topic.title}</h3>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-blue-100">
                {topic.talkingPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md shadow-md">
                    <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{point}</span>
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
        onMouseMove={handleMouseMove}
        className={`${currentThemeStyle.bg} text-white max-w-6xl w-full h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col justify-between p-6 sm:p-10 relative select-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Laser Pointer Red Dot */}
        {laserActive && (
          <div
            className="absolute w-5 h-5 rounded-full bg-rose-500 pointer-events-none z-50 shadow-[0_0_15px_6px_rgba(244,63,94,0.9)] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{ left: laserPos.x, top: laserPos.y }}
          />
        )}

        {/* Top Control Bar */}
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
            {/* Theme Selector */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
            >
              <option value="MIDNIGHT" className="text-slate-900">🌌 Midnight Blue</option>
              <option value="SUNRISE" className="text-slate-900">🌅 Warm Sunrise</option>
              <option value="MINT_GARDEN" className="text-slate-900">🍃 Mint Garden</option>
              <option value="ROYAL_PURPLE" className="text-slate-900">👑 Royal Purple</option>
            </select>

            {/* Laser Pointer Toggle */}
            <button
              type="button"
              onClick={() => setLaserActive(!laserActive)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                laserActive ? 'bg-rose-600 text-white shadow-lg' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title="Bút chỉ laser đỏ (Phím L)"
            >
              <Pointer className="w-4 h-4" />
            </button>

            {/* Auto Play Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isAutoPlaying ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title={isAutoPlaying ? 'Tạm dừng chiếu tự động' : 'Tự động chuyển trang sau 10s'}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

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

        {/* Slide Content Body */}
        <div className="flex-1 overflow-y-auto py-6">
          {renderSlideContent(currentTopic)}
        </div>

        {/* Bottom Navigation */}
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

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 max-w-md overflow-x-auto px-2">
            {activeTopics.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-3 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx ? 'bg-yellow-400 w-8' : 'bg-white/30 hover:bg-white/50 w-3'
                }`}
                title={t.title}
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

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in zoom-in-95"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-4xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <img src={lightboxImage} alt="Enlarged view" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-lg hover:bg-rose-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
