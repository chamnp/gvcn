'use client';

import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Tag,
  Trash2,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
  Camera,
  Download,
} from 'lucide-react';
import { ClassMoment } from '@/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface MomentsFeedCardProps {
  moment: ClassMoment;
  userToken?: string;
  isTeacher?: boolean;
}

const CATEGORY_MAP = {
  ACADEMIC: { label: '🔬 Học Tập & Trải Nghiệm', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  EXPERIENCE: { label: '🌟 Hoạt Động Ngoại Khóa', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  PRAISE: { label: '🏆 Khen Ngợi & Nỗ Lực', bg: 'bg-amber-50 text-amber-900 border-amber-200' },
  MEMORIES: { label: '🎂 Kỷ Niệm Lớp Học', bg: 'bg-pink-50 text-pink-800 border-pink-200' },
};

export function MomentsFeedCard({ moment, userToken = 'parent-user', isTeacher = false }: MomentsFeedCardProps) {
  const { likeClassMoment, deleteClassMoment, students } = useAppStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const cat = CATEGORY_MAP[moment.category] || CATEGORY_MAP.EXPERIENCE;
  const isLiked = moment.likedBy?.includes(userToken);

  const taggedStudentsList = (moment.taggedStudentIds || [])
    .map((id) => students.find((s) => s.id === id))
    .filter(Boolean);

  const handleLike = () => {
    likeClassMoment(moment.id, userToken);
  };

  const handleShare = () => {
    if (navigator?.share) {
      navigator.share({
        title: moment.title,
        text: moment.content,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${moment.title}\n${moment.content}\n${window.location.href}`);
      toast.success('Đã sao chép liên kết khoảnh khắc!');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-md transition-all space-y-3.5 p-4 sm:p-6 text-slate-900 text-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
            👩‍🏫
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-900 text-sm truncate">
              {moment.teacherName || 'Giáo viên chủ nhiệm'}
            </h4>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
              <span>{new Date(moment.createdAt).toLocaleDateString('vi-VN')}</span>
              <span>•</span>
              <span className={`px-2 py-0.2 rounded-md font-bold border ${cat.bg}`}>
                {cat.label}
              </span>
            </div>
          </div>
        </div>

        {isTeacher && (
          <button
            type="button"
            onClick={() => deleteClassMoment(moment.id)}
            className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Xóa khoảnh khắc"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
          {moment.title}
        </h3>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
          {moment.content}
        </p>
      </div>

      {/* Photo Gallery Grid */}
      {moment.imageUrls && moment.imageUrls.length > 0 && (
        <div
          className={`grid gap-2 rounded-2xl overflow-hidden ${
            moment.imageUrls.length === 1
              ? 'grid-cols-1'
              : moment.imageUrls.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {moment.imageUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative group aspect-4/3 bg-slate-100 overflow-hidden rounded-xl cursor-pointer"
              onClick={() => setSelectedImage(url)}
            >
              <img
                src={url}
                alt={`Moment photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tagged Students */}
      {taggedStudentsList.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Tag className="w-3 h-3 text-purple-600" />
            <span>Có mặt:</span>
          </span>
          {taggedStudentsList.map((st) => (
            <span
              key={st!.id}
              className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-purple-200"
            >
              ⭐ {st!.fullName}
            </span>
          ))}
        </div>
      )}

      {/* Footer Interactive Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleLike}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isLiked
                ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{moment.likesCount > 0 ? `${moment.likesCount} Yêu thích` : 'Thả tim'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Chia sẻ khoảnh khắc"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Khoảnh khắc lớp học hạnh phúc ❤️
        </span>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl">
            <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
