'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Plus,
  Tag,
  Image as ImageIcon,
  Sparkles,
  Heart,
  Share2,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MomentCategory } from '@/types';
import { MomentsFeedCard } from '@/components/moments/moments-feed-card';
import { toast } from 'sonner';

const SAMPLE_IMAGE_PRESETS = [
  { label: '🔬 Giờ Học STEM', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80' },
  { label: '📖 Đọc Sách Thư Viện', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80' },
  { label: '🏆 Hoạt Động Thể Thao', url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=80' },
  { label: '🎨 Mỹ Thuật & Vẽ Tranh', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80' },
  { label: '🎂 Sinh Nhật Lớp', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80' },
];

export default function MomentsPage() {
  const { classMoments, addClassMoment, classInfo, students } = useAppStore();

  const [isPosting, setIsPosting] = useState(false);
  const [category, setCategory] = useState<MomentCategory>('ACADEMIC');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);


  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setImageUrls((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = (urlToAdd?: string) => {
    const url = urlToAdd || imageUrlInput.trim();
    if (!url) return;
    if (!imageUrls.includes(url)) {
      setImageUrls([...imageUrls, url]);
    }
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, idx) => idx !== index));
  };

  const toggleStudentTag = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung khoảnh khắc!');
      return;
    }

    addClassMoment({
      classId: classInfo.id,
      teacherName: classInfo.teacherName || 'Giáo viên chủ nhiệm',
      category,
      title: title.trim(),
      content: content.trim(),
      imageUrls: imageUrls.length > 0 ? imageUrls : [SAMPLE_IMAGE_PRESETS[0].url],
      taggedStudentIds: selectedStudentIds.length > 0 ? selectedStudentIds : undefined,
    });

    setTitle('');
    setContent('');
    setImageUrls([]);
    setSelectedStudentIds([]);
    setIsPosting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
            📸
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-pink-100 text-pink-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Lớp {classInfo.name}
              </span>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {classMoments.length} khoảnh khắc
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Nhật Ký Khoảnh Khắc Lớp Học Hạnh Phúc
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPosting(!isPosting)}
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isPosting ? 'Thu Gọn Form' : 'Đăng Khoảnh Khắc Mới'}</span>
        </button>
      </div>

      {/* CREATE MOMENT FORM */}
      {isPosting && (
        <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-pink-200 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-black text-slate-800 text-sm flex items-center gap-2">
              <Camera className="w-5 h-5 text-pink-600" />
              <span>Tạo Bài Viết Khoảnh Khắc Lớp Học</span>
            </span>

            {/* Category selection pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'ACADEMIC', label: '🔬 Học tập' },
                { id: 'EXPERIENCE', label: '🌟 Trải nghiệm' },
                { id: 'PRAISE', label: '🏆 Khen ngợi' },
                { id: 'MEMORIES', label: '🎂 Kỷ niệm' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    category === c.id
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              required
              placeholder="Tiêu đề khoảnh khắc (VD: Buổi thực hành STEM đầy hào hứng của lớp 4A1...)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />

            <textarea
              rows={3}
              required
              placeholder="Kể câu chuyện hoặc lời khen ngợi của cô giáo gửi đến các con và phụ huynh..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none leading-relaxed resize-none"
            />
          </div>

          {/* Image selection / Preset URLs */}
          <div className="space-y-2">
            <label className="font-black text-slate-700 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <ImageIcon className="w-4 h-4 text-pink-600" />
              <span>Thêm Ảnh Hoạt Động (Nhập URL hoặc chọn mẫu nhanh):</span>
            </label>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddImageUrl(preset.url)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-pink-50 hover:text-pink-700 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            {/* File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-pink-300 bg-pink-50/50 hover:bg-pink-100/60 rounded-2xl text-xs font-bold text-pink-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Tải Ảnh Từ Máy Tính / Điện Thoại</span>
            </button>

            {/* Custom URL Input */}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Hoặc dán đường dẫn ảnh (https://...)..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddImageUrl()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Thêm Ảnh
              </button>
            </div>

            {/* Selected Images Preview */}
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] hover:bg-rose-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Tagging */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-700 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Gắn Thẻ Học Sinh Xuất Hiện Trong Ảnh ({selectedStudentIds.length}/{students.length}):</span>
              </label>

              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
              >
                {selectedStudentIds.length === students.length ? 'Bỏ chọn tất cả' : 'Chọn cả lớp'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {students.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => toggleStudentTag(st.id)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.fullName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPosting(false)}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Đăng Bài Lên Bảng Tin Lớp
            </button>
          </div>
        </form>
      )}

      {/* FEED LIST */}
      <div className="space-y-4">
        {classMoments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
            <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto text-2xl">
              📸
            </div>
            <h3 className="font-black text-sm text-slate-700">Chưa Có Bài Viết Khoảnh Khắc Nào</h3>
            <p className="text-xs text-slate-400">Hãy nhấn "Đăng Khoảnh Khắc Mới" ở trên để chia sẻ ảnh học tập cùng phụ huynh!</p>
          </div>
        ) : (
          classMoments.map((moment) => (
            <MomentsFeedCard key={moment.id} moment={moment} isTeacher={true} />
          ))
        )}
      </div>
    </div>
  );
}
