'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  MessageSquare,
  Copy,
  Zap,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { ConferenceSlot, ConferenceType, Student } from '@/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface ConferenceSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTeacher?: boolean;
  currentStudent?: Student | null;
  publicShareToken?: string;
  initialSlotId?: string | null;
  onVerifiedBook?: (slotId: string, bookingData: { parentName: string; parentPhone: string; discussionTopics?: string }) => Promise<boolean>;
}

const TYPE_CONFIG: Record<ConferenceType, { label: string; icon: string; color: string }> = {
  IN_PERSON: { label: 'Trực tiếp tại lớp', icon: '🏫', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  ONLINE_MEET: { label: 'Google Meet trực tuyến', icon: '📹', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  PHONE: { label: 'Gọi điện thoại trao đổi', icon: '📞', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  ZALO: { label: 'Gọi video qua Zalo', icon: '💬', color: 'bg-purple-50 text-purple-800 border-purple-200' },
};

export function ConferenceSchedulerModal({
  isOpen,
  onClose,
  isTeacher = false,
  currentStudent,
  publicShareToken,
  initialSlotId,
  onVerifiedBook,
}: ConferenceSchedulerModalProps) {
  const {
    conferenceSlots,
    createConferenceSlot,
    createMultipleConferenceSlots,
    bookConferenceSlot,
    cancelConferenceBooking,
    deleteConferenceSlot,
    classInfo,
    students,
  } = useAppStore();

  // Mode tab for Teacher: Single slot vs Batch generator
  const [creationMode, setCreationMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Filter for slots
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BOOKED' | 'AVAILABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Single slot form state (Teacher)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:20');
  const [type, setType] = useState<ConferenceType>('IN_PERSON');
  const [title, setTitle] = useState(`Trao đổi kết quả học tập & rèn luyện Lớp ${classInfo.name}`);
  const [location, setLocation] = useState(`Phòng học Lớp ${classInfo.name} (Tầng 2)`);

  // Batch generator state (Teacher)
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchStart, setBatchStart] = useState('08:00');
  const [batchEnd, setBatchEnd] = useState('11:00');
  const [batchSlotDuration, setBatchSlotDuration] = useState<number>(20); // minutes
  const [batchBreakDuration, setBatchBreakDuration] = useState<number>(5); // minutes
  const [batchType, setBatchType] = useState<ConferenceType>('IN_PERSON');
  const [batchTitle, setBatchTitle] = useState(`Trao đổi riêng kết quả học tập & rèn luyện Lớp ${classInfo.name}`);
  const [batchLocation, setBatchLocation] = useState(`Phòng học Lớp ${classInfo.name}`);

  // Booking form state (Parent)
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<ConferenceSlot | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(currentStudent?.id || '');
  const [parentName, setParentName] = useState(currentStudent?.parentName || '');
  const [parentPhone, setParentPhone] = useState(currentStudent?.parentPhone || '');
  const [discussionTopics, setDiscussionTopics] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  React.useEffect(() => {
    if (!isOpen || !initialSlotId) return;
    const timeoutId = window.setTimeout(() => {
      const requestedSlot = conferenceSlots.find((slot) => slot.id === initialSlotId && !slot.isBooked);
      if (requestedSlot) setSelectedSlotForBooking(requestedSlot);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [conferenceSlots, initialSlotId, isOpen]);

  // Active student being booked for
  const effectiveStudent = useMemo(() => {
    if (currentStudent) return currentStudent;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [currentStudent, selectedStudentId, students]);

  if (!isOpen) return null;

  // Handle student selection change for parents
  const handleSelectStudent = (stId: string) => {
    setSelectedStudentId(stId);
    const st = students.find((s) => s.id === stId);
    if (st) {
      if (st.parentName) setParentName(st.parentName);
      if (st.parentPhone) setParentPhone(st.parentPhone);
    }
  };

  // Helper to convert HH:mm to minutes from midnight
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Helper to convert minutes to HH:mm
  const minutesToTime = (m: number) => {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Create single slot handler
  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      toast.error('Giờ kết thúc phải lớn hơn giờ bắt đầu!');
      return;
    }

    createConferenceSlot({
      classId: classInfo.id,
      title,
      date,
      startTime,
      endTime,
      type,
      location,
    });
  };

  // Batch generate slots handler
  const handleGenerateBatchSlots = (e: React.FormEvent) => {
    e.preventDefault();
    const startM = timeToMinutes(batchStart);
    const endM = timeToMinutes(batchEnd);

    if (endM <= startM) {
      toast.error('Giờ kết thúc ca họp phải lớn hơn giờ bắt đầu!');
      return;
    }

    const generatedSlots: Omit<ConferenceSlot, 'id' | 'isBooked' | 'createdAt'>[] = [];
    let currentM = startM;

    while (currentM + batchSlotDuration <= endM) {
      const slotStart = minutesToTime(currentM);
      const slotEnd = minutesToTime(currentM + batchSlotDuration);

      generatedSlots.push({
        classId: classInfo.id,
        title: batchTitle,
        date: batchDate,
        startTime: slotStart,
        endTime: slotEnd,
        type: batchType,
        location: batchLocation,
      });

      currentM += batchSlotDuration + batchBreakDuration;
    }

    if (generatedSlots.length === 0) {
      toast.error('Khoảng thời gian không đủ để tạo ít nhất 1 khung giờ!');
      return;
    }

    createMultipleConferenceSlots(generatedSlots);
  };

  // Booking submit handler
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking) return;

    if (!effectiveStudent) {
      toast.error('Vui lòng chọn học sinh con của bố/mẹ!');
      return;
    }

    if (!parentName.trim() || !parentPhone.trim()) {
      toast.error('Vui lòng điền họ tên và số điện thoại liên hệ!');
      return;
    }

    const bookingData = {
      studentId: effectiveStudent.id,
      studentName: effectiveStudent.fullName,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      discussionTopics: discussionTopics.trim(),
    };

    if (onVerifiedBook) {
      setIsBooking(true);
      const success = await onVerifiedBook(selectedSlotForBooking.id, bookingData);
      setIsBooking(false);
      if (!success) return;
    } else {
      bookConferenceSlot(selectedSlotForBooking.id, bookingData);
    }

    setSelectedSlotForBooking(null);
    setDiscussionTopics('');
  };

  // Copy shareable booking link
  const handleCopyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/hw/${publicShareToken || classInfo.shareToken || ''}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Đã sao chép link Cổng Trao Đổi Lớp gửi Zalo Phụ huynh!');
  };

  const activeSlots = conferenceSlots
    .filter((s) => s.classId === classInfo.id || !s.classId)
    .filter((s) => {
      if (statusFilter === 'BOOKED') return s.isBooked;
      if (statusFilter === 'AVAILABLE') return !s.isBooked;
      return true;
    })
    .filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.date.toLowerCase().includes(q) ||
        (s.bookedStudentName && s.bookedStudentName.toLowerCase().includes(q)) ||
        (s.bookedParentName && s.bookedParentName.toLowerCase().includes(q)) ||
        (s.bookedParentPhone && s.bookedParentPhone.includes(q))
      );
    });

  const allClassSlots = conferenceSlots.filter((s) => s.classId === classInfo.id || !s.classId);
  const bookedCount = allClassSlots.filter((s) => s.isBooked).length;
  const availableCount = allClassSlots.filter((s) => !s.isBooked).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              📅
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                  Lịch Hẹn Họp & Trao Đổi Phụ Huynh 1-1
                </h3>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Lớp {classInfo.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {isTeacher
                  ? `Quản lý khung giờ & danh sách đăng ký gặp trực tiếp/online của Lớp ${classInfo.name}`
                  : `Đăng ký khung giờ thuận tiện để trao đổi riêng với Giáo viên chủ nhiệm`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isTeacher && (
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-purple-700 font-bold border border-purple-200 transition-colors shadow-2xs cursor-pointer text-[11px]"
                title="Sao chép link gửi Phụ huynh"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Link Gửi Zalo</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TEACHER ONLY: ADD SLOT / BATCH CREATION */}
          {isTeacher && (
            <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 p-4 rounded-3xl border border-purple-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/60 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Mở Khung Giờ Tiếp Phụ Huynh:</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-purple-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCreationMode('SINGLE')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      creationMode === 'SINGLE'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Thêm 1 Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('BATCH')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                      creationMode === 'BATCH'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>Tạo Hàng Loạt (Auto)</span>
                  </button>
                </div>
              </div>

              {/* SINGLE SLOT FORM */}
              {creationMode === 'SINGLE' ? (
                <form onSubmit={handleCreateSlot} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Tiêu đề buổi hẹn:</span>
                      <input
                        type="text"
                        required
                        placeholder="Tiêu đề đợt trao đổi"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Hình thức tiếp đón:</span>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as ConferenceType)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                      >
                        <option value="IN_PERSON">🏫 Trực tiếp tại trường</option>
                        <option value="ONLINE_MEET">📹 Google Meet trực tuyến</option>
                        <option value="PHONE">📞 Gọi điện thoại</option>
                        <option value="ZALO">💬 Gọi video qua Zalo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Ngày hẹn:</span>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Từ giờ:</span>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Đến giờ:</span>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Địa điểm (vd: Phòng học 4A1) hoặc Link Google Meet..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />

                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      + Mở Khung Giờ Này
                    </button>
                  </div>
                </form>
              ) : (
                /* BATCH SLOT GENERATOR FORM */
                <form onSubmit={handleGenerateBatchSlots} className="space-y-3">
                  <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    💡 <strong>Tự động chia ca thông minh:</strong> Hệ thống sẽ tự động tính toán và tạo ra nhiều khung giờ liên tiếp dựa theo khoảng thời gian bạn chọn (ví dụ: từ 08:00 đến 11:00, mỗi slot 20 phút).
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Tiêu đề buổi hẹn:</span>
                      <input
                        type="text"
                        required
                        placeholder="Tiêu đề đợt trao đổi"
                        value={batchTitle}
                        onChange={(e) => setBatchTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Hình thức tiếp đón:</span>
                      <select
                        value={batchType}
                        onChange={(e) => setBatchType(e.target.value as ConferenceType)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs cursor-pointer"
                      >
                        <option value="IN_PERSON">🏫 Trực tiếp tại trường</option>
                        <option value="ONLINE_MEET">📹 Google Meet trực tuyến</option>
                        <option value="PHONE">📞 Gọi điện thoại</option>
                        <option value="ZALO">💬 Gọi video qua Zalo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Ngày diễn ra:</span>
                      <input
                        type="date"
                        required
                        value={batchDate}
                        onChange={(e) => setBatchDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Từ giờ:</span>
                      <input
                        type="time"
                        required
                        value={batchStart}
                        onChange={(e) => setBatchStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Đến giờ:</span>
                      <input
                        type="time"
                        required
                        value={batchEnd}
                        onChange={(e) => setBatchEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Thời lượng/Slot:</span>
                      <select
                        value={batchSlotDuration}
                        onChange={(e) => setBatchSlotDuration(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs cursor-pointer"
                      >
                        <option value={15}>15 phút</option>
                        <option value={20}>20 phút (chuẩn)</option>
                        <option value={25}>25 phút</option>
                        <option value={30}>30 phút</option>
                        <option value={45}>45 phút</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Địa điểm (vd: Phòng học 4A1)..."
                      value={batchLocation}
                      onChange={(e) => setBatchLocation(e.target.value)}
                      className="w-full sm:flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />

                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Tự Động Sinh Hàng Loạt Khung Giờ</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* PARENT BOOKING FORM (IF A SLOT IS SELECTED) */}
          {selectedSlotForBooking && !isTeacher && (
            <form onSubmit={handleBook} className="bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 p-5 rounded-3xl border-2 border-purple-400 space-y-3.5 shadow-lg animate-in fade-in">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2.5">
                <span className="font-black text-purple-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>👉 Đăng Ký Khung Giờ:</span>
                  <span className="text-purple-700 bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                    📅 {selectedSlotForBooking.date} ({selectedSlotForBooking.startTime} - {selectedSlotForBooking.endTime})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSlotForBooking(null)}
                  className="text-purple-600 hover:text-purple-900 font-bold px-2 py-1 hover:bg-purple-100 rounded-lg cursor-pointer transition-colors"
                >
                  Đóng Form
                </button>
              </div>

              {/* Student selector if not in student-specific portal */}
              {!currentStudent ? (
                <div>
                  <label className="text-[11px] text-slate-700 font-black block mb-1">
                    1. Chọn Học Sinh (Con của bố/mẹ) <span className="text-rose-500">*</span>:
                  </label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => handleSelectStudent(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="">-- Vui lòng chọn tên học sinh trong Lớp {classInfo.name} --</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.studentCode ? `[${st.studentCode}] ` : ''}{st.fullName} ({st.gender})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Đăng ký cho học sinh: <span className="text-purple-700 font-black">{currentStudent.fullName}</span> (Mã HS: {currentStudent.studentCode})
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                    2. Họ tên Bố/Mẹ/Người giám hộ <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn Bình"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                    3. Số điện thoại liên hệ <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0901234567"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 font-bold block mb-0.5">
                  4. Nội dung bố/mẹ mong muốn trao đổi trước với cô giáo (tùy chọn):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Bố mẹ muốn xin cô tư vấn phương pháp rèn con tập trung và cách học thêm Toán tư duy ở nhà..."
                  value={discussionTopics}
                  onChange={(e) => setDiscussionTopics(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isBooking}
                className="w-full min-h-11 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {isBooking ? 'Đang đặt lịch…' : '✓ Xác Nhận Đặt Lịch Hẹn Với Cô Giáo'}
              </button>
            </form>
          )}

          {/* SLOTS LIST CONTROLS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                  Danh Sách Khung Giờ ({allClassSlots.length})
                </h4>
                <span className="text-slate-400 font-medium text-[11px]">
                  • <strong className="text-emerald-700">{bookedCount} đã đặt</strong> • <strong className="text-purple-700">{availableCount} còn trống</strong>
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                  {([
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'BOOKED', label: `Đã đặt (${bookedCount})` },
                    { id: 'AVAILABLE', label: `Còn trống (${availableCount})` },
                  ] as const).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        statusFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo ngày, tên HS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-3 py-1 rounded-xl border border-slate-200 bg-white text-[11px] w-36 sm:w-44 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* SLOTS LIST ITEMS */}
            {activeSlots.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-slate-400 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="font-bold text-xs text-slate-500">
                  {allClassSlots.length === 0
                    ? 'Chưa có khung giờ hẹn nào được mở cho lớp này.'
                    : 'Không tìm thấy khung giờ phù hợp bộ lọc.'}
                </p>
                {isTeacher && allClassSlots.length === 0 && (
                  <p className="text-[11px] text-slate-400">
                    Hãy sử dụng biểu mẫu phía trên để mở khung giờ tiếp phụ huynh đầu tiên.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeSlots.map((slot) => {
                  const typeInfo = TYPE_CONFIG[slot.type] || TYPE_CONFIG.IN_PERSON;
                  const isMyBooking =
                    effectiveStudent && slot.bookedStudentId === effectiveStudent.id;

                  return (
                    <div
                      key={slot.id}
                      className={`p-3.5 sm:p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        slot.isBooked
                          ? 'bg-purple-50/40 border-purple-200/90 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            📅 {slot.date} ({slot.startTime} - {slot.endTime})
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${typeInfo.color}`}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                          {slot.isBooked ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Đã có người đặt
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Còn trống
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-slate-700 truncate">{slot.title}</p>
                        {slot.location && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{slot.location}</span>
                          </p>
                        )}

                        {/* BOOKING INFO CARD */}
                        {slot.isBooked && (
                          <div className="bg-white p-3 rounded-2xl border border-purple-200/80 text-[11px] space-y-1.5 mt-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-black text-slate-900 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>
                                  Học sinh: <strong className="text-purple-700">{slot.bookedStudentName}</strong>
                                </span>
                              </span>

                              <div className="flex items-center space-x-2">
                                <span className="text-slate-600">
                                  PH: <strong>{slot.bookedParentName}</strong>
                                </span>
                                {slot.bookedParentPhone && (
                                  <a
                                    href={`tel:${slot.bookedParentPhone}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-mono font-bold border border-emerald-200 text-[10px] transition-colors"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{slot.bookedParentPhone}</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {slot.parentDiscussionTopics && (
                              <p className="text-slate-600 text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                                💬 <strong>Nội dung PH nhắn:</strong> {slot.parentDiscussionTopics}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        {isTeacher ? (
                          <>
                            {slot.isBooked && (
                              <button
                                type="button"
                                onClick={() => cancelConferenceBooking(slot.id)}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Giải phóng slot về trạng thái trống"
                              >
                                Hủy Đặt
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteConferenceSlot(slot.id)}
                              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                              title="Xóa hẳn khung giờ này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {!slot.isBooked ? (
                              <button
                                type="button"
                                onClick={() => setSelectedSlotForBooking(slot)}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer transform active:scale-95"
                              >
                                Đăng Ký Giờ Này
                              </button>
                            ) : isMyBooking ? (
                              <button
                                type="button"
                                onClick={() => cancelConferenceBooking(slot.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                              >
                                Hủy Lịch Của Con
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">
                                Đã kín lịch
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 font-medium">
            💡 Khung giờ hẹn 1-1 giúp phụ huynh và cô giáo chủ động thời gian, đảm bảo tính riêng tư và chiều sâu sư phạm.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer self-end sm:self-auto"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
