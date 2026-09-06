'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Check,
} from 'lucide-react';
import { ClassEvent, ClassEventType, CLASS_EVENT_TYPE_CONFIG } from '@/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

import { getLocalDateString } from '@/lib/tt27-engine';

interface ClassEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent?: ClassEvent | null;
  className?: string;
}


// Preset common primary school events
const EVENT_PRESETS: Array<{
  title: string;
  type: ClassEventType;
  time?: string;
  locationSuffix?: string;
  description?: string;
  isImportant?: boolean;
}> = [
  {
    title: 'Kiểm Tra Đánh Giá Định Kỳ Giữa Học Kỳ 1 (Toán & Tiếng Việt)',
    type: 'EXAM',
    time: '08:00 - 10:30',
    description: 'Học sinh chuẩn bị đầy đủ bút mực, thước kẻ, bút chì, compa và phiếu học tập.',
    isImportant: true,
  },
  {
    title: 'Kiểm Tra Đánh Giá Cuối Học Kỳ 1 (TT27)',
    type: 'EXAM',
    time: '08:00 - 11:00',
    description: 'Đánh giá định kỳ các môn học theo Thông tư 27/2020/TT-BGDĐT.',
    isImportant: true,
  },
  {
    title: 'Họp Cha Mẹ Học Sinh Đầu Năm Học',
    type: 'MEETING',
    time: '08:00 - 10:30',
    description: 'Bầu Ban đại diện Cha mẹ học sinh, phổ biến kế hoạch năm học và quy định lớp học.',
    isImportant: true,
  },
  {
    title: 'Họp Cha Mẹ Học Sinh Sơ Kết Học Kỳ 1',
    type: 'MEETING',
    time: '08:30 - 10:30',
    description: 'Báo cáo kết quả rèn luyện HK1 và phương hướng học tập HK2.',
    isImportant: true,
  },
  {
    title: 'Lễ Khai Giảng Năm Học Mới',
    type: 'FESTIVAL',
    time: '07:30 - 09:30',
    locationSuffix: 'Sân trường chính',
    description: 'Học sinh mặc đồng phục trang trọng, khăn quàng đỏ, mang cờ hoa chào đón năm học mới.',
    isImportant: true,
  },
  {
    title: 'Ngày Hội Vui Tết Trung Thu - Vui Hội Trăng Rằm',
    type: 'FESTIVAL',
    time: '14:30 - 16:30',
    description: 'Phá cỗ trung thu, rước đèn, thi bày mâm cỗ đẹp và văn nghệ tập thể.',
    isImportant: false,
  },
  {
    title: 'Hoạt Động Trải Nghiệm Ngoại Khóa & Khám Phá STEM',
    type: 'ACTIVITY',
    time: '07:30 - 16:30',
    description: 'Chuyến đi thực tế trải nghiệm kỹ năng sống. Học sinh mang theo bình nước cá nhân, nón mũ.',
    isImportant: true,
  },
  {
    title: 'Hội Thi Vở Sạch Chữ Đẹp Cấp Lớp',
    type: 'ACTIVITY',
    time: '14:00 - 15:30',
    description: 'Phong trào thi đua rèn nét chữ - nết người, giữ gìn sách vở sạch đẹp.',
    isImportant: false,
  },
  {
    title: 'Nghỉ Lễ Kỷ Niệm Ngày Nhà Giáo Việt Nam 20/11',
    type: 'HOLIDAY',
    time: 'Cả ngày',
    description: 'Học sinh nghỉ lễ theo quy định chung của ngành Giáo dục.',
    isImportant: false,
  },
  {
    title: 'Nghỉ Tết Nguyên Đán Theo Quy Định',
    type: 'HOLIDAY',
    time: 'Cả ngày',
    description: 'Học sinh nghỉ Tết, chúc các gia đình đón năm mới an khang thịnh vượng!',
    isImportant: true,
  },
];

export function ClassEventModal({
  isOpen,
  onClose,
  editingEvent,
  className = '',
}: ClassEventModalProps) {
  const { addClassEvent, updateClassEvent } = useAppStore();

  const isEdit = !!editingEvent;

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState('');
  const [type, setType] = useState<ClassEventType>('ACTIVITY');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Sync state when modal opens or editingEvent changes
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title || '');
        setDate(editingEvent.date || getLocalDateString());
        setTime(editingEvent.time || '');
        setType(editingEvent.type || (editingEvent as any).eventType || 'ACTIVITY');
        setLocation(editingEvent.location || '');
        setDescription(editingEvent.description || '');
        setIsImportant(!!editingEvent.isImportant);
        setShowPresets(false);
      } else {
        // Default new event
        setTitle('');
        setDate(getLocalDateString());
        setTime('08:00 - 10:00');
        setType('ACTIVITY');
        setLocation(className ? `Phòng học Lớp ${className}` : '');
        setDescription('');
        setIsImportant(false);
        setShowPresets(false);
      }
    }
  }, [isOpen, editingEvent, className]);

  if (!isOpen) return null;

  // Set quick date
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(getLocalDateString(d));
  };

  // Next Monday
  const setNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? 1 : 8 - day);
    d.setDate(d.getDate() + diff);
    setDate(getLocalDateString(d));
  };

  // Apply a preset
  const applyPreset = (preset: typeof EVENT_PRESETS[0]) => {
    setTitle(preset.title);
    setType(preset.type);
    if (preset.time) setTime(preset.time);
    if (preset.description) setDescription(preset.description);
    if (preset.isImportant !== undefined) setIsImportant(preset.isImportant);
    if (preset.locationSuffix) {
      setLocation(preset.locationSuffix);
    } else if (className && !location) {
      setLocation(`Phòng học Lớp ${className}`);
    }
    setShowPresets(false);
    toast.success(`Đã áp dụng mẫu: ${preset.title.slice(0, 35)}...`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên sự kiện / kế hoạch!');
      return;
    }
    if (!date) {
      toast.error('Vui lòng chọn ngày diễn ra!');
      return;
    }

    if (isEdit && editingEvent) {
      updateClassEvent({
        ...editingEvent,
        title: title.trim(),
        date,
        time: time.trim() || undefined,
        type,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        isImportant,
      });
      toast.success('Đã cập nhật sự kiện thành công!');
    } else {
      addClassEvent({
        title: title.trim(),
        date,
        time: time.trim() || undefined,
        type,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        isImportant,
      });
      toast.success('Đã thêm sự kiện lớp mới thành công!');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg leading-tight truncate">
                {isEdit ? 'Chỉnh Sửa Sự Kiện Lớp' : 'Thêm Sự Kiện Lớp Mới'}
              </h3>
              <p className="text-[11px] text-white/80 truncate">
                {className ? `Tập thể Lớp ${className}` : 'Lịch hoạt động & Thông tư 27'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {!isEdit && (
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${
                  showPresets
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="Chọn mẫu sự kiện có sẵn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mẫu Gợi Ý</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Drawer (if toggled) */}
        {showPresets && !isEdit && (
          <div className="bg-indigo-50/70 border-b border-indigo-100 p-3.5 max-h-48 overflow-y-auto space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Gợi ý sự kiện tiểu học chuẩn TT27:</span>
              </span>
              <span className="text-[10px] text-indigo-600">Nhấn để điền nhanh</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {EVENT_PRESETS.map((preset, idx) => {
                const conf = CLASS_EVENT_TYPE_CONFIG[preset.type];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-left p-2 rounded-xl bg-white hover:bg-indigo-100/60 border border-indigo-200/70 transition-all text-xs flex items-start gap-2 group cursor-pointer shadow-2xs"
                  >
                    <span className="text-base shrink-0 leading-none mt-0.5">{conf.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2 group-hover:text-indigo-900">
                        {preset.title}
                      </p>
                      <span className="text-[9px] text-slate-500 font-medium">
                        {conf.shortLabel} {preset.time ? `• ${preset.time}` : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Event Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên Sự Kiện / Kế Hoạch <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Kiểm tra Giữa kỳ I môn Toán & Tiếng Việt, Họp Cha Mẹ Học Sinh..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phân Loại Sự Kiện
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(CLASS_EVENT_TYPE_CONFIG) as ClassEventType[]).map((tKey) => {
                const conf = CLASS_EVENT_TYPE_CONFIG[tKey];
                const isSelected = type === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setType(tKey)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? `${conf.badgeColor} ring-2 ring-indigo-500 shadow-xs font-bold`
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-lg leading-none shrink-0">{conf.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-tight truncate font-bold">{conf.shortLabel}</p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ngày Diễn Ra <span className="text-rose-500">*</span>
                </label>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {/* Quick Date Chips */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  Ngày mai
                </button>
                <button
                  type="button"
                  onClick={setNextMonday}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  Thứ 2 tới
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Thời Gian
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="08:00 - 10:30"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs font-medium pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
              {/* Quick Time Chips */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setTime('07:30 - 09:30')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  07:30
                </button>
                <button
                  type="button"
                  onClick={() => setTime('08:00 - 10:30')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  08:00
                </button>
                <button
                  type="button"
                  onClick={() => setTime('14:00 - 16:30')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  14:00
                </button>
                <button
                  type="button"
                  onClick={() => setTime('Cả ngày')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  Cả ngày
                </button>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Địa Điểm
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={className ? `Phòng học Lớp ${className}, Sân trường...` : 'Phòng học, Sân trường...'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs font-medium pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {className && (
                <button
                  type="button"
                  onClick={() => setLocation(`Phòng học Lớp ${className}`)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer truncate max-w-[150px]"
                >
                  Lớp {className}
                </button>
              )}
              <button
                type="button"
                onClick={() => setLocation('Sân trường')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
              >
                Sân trường
              </button>
              <button
                type="button"
                onClick={() => setLocation('Phòng Đa năng')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
              >
                Phòng Đa năng
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô Tả / Dặn Dò Học Sinh
            </label>
            <textarea
              rows={2}
              placeholder="Dặn dò trang phục, đồ dùng học tập cần mang, thông báo tới phụ huynh..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs font-medium p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white leading-relaxed"
            />
          </div>

          {/* Is Important Checkbox */}
          <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <input
              type="checkbox"
              id="eventImportantModal"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="eventImportantModal" className="text-xs font-bold text-slate-800 cursor-pointer flex-1">
              Đánh dấu là Sự kiện quan trọng <span className="text-[11px] text-indigo-600 font-normal">(Ưu tiên thông báo & làm nổi bật thẻ)</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEdit ? 'Cập Nhật Sự Kiện' : 'Lưu Sự Kiện'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
