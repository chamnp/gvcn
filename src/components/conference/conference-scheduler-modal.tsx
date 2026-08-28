'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { ConferenceSlot, ConferenceType, Student } from '@/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface ConferenceSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTeacher?: boolean;
  currentStudent?: Student | null;
}

const TYPE_CONFIG = {
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
}: ConferenceSchedulerModalProps) {
  const {
    conferenceSlots,
    createConferenceSlot,
    bookConferenceSlot,
    cancelConferenceBooking,
    deleteConferenceSlot,
    classInfo,
    students,
  } = useAppStore();

  // Create slot form state (Teacher)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:20');
  const [type, setType] = useState<ConferenceType>('IN_PERSON');
  const [title, setTitle] = useState('Trao đổi riêng kết quả học tập & rèn luyện Giữa HK1');
  const [location, setLocation] = useState(`Phòng học ${classInfo.name}`);

  // Booking form state (Parent)
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<ConferenceSlot | null>(null);
  const [parentName, setParentName] = useState(currentStudent?.parentName || '');
  const [parentPhone, setParentPhone] = useState(currentStudent?.parentPhone || '');
  const [discussionTopics, setDiscussionTopics] = useState('');

  if (!isOpen) return null;

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking || !currentStudent) return;
    if (!parentName.trim() || !parentPhone.trim()) {
      toast.error('Vui lòng điền họ tên và số điện thoại phụ huynh!');
      return;
    }

    bookConferenceSlot(selectedSlotForBooking.id, {
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      discussionTopics: discussionTopics.trim(),
    });

    setSelectedSlotForBooking(null);
  };

  const activeSlots = conferenceSlots.filter((s) => s.classId === classInfo.id || !s.classId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              📅
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                Lịch Hẹn Họp & Trao Đổi Phụ Huynh 1-1
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isTeacher
                  ? `Mở khung giờ trao đổi riêng cho Phụ huynh Lớp ${classInfo.name}`
                  : `Đăng ký khung giờ trao đổi trực tiếp với Giáo viên chủ nhiệm`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* TEACHER ONLY: ADD SLOT FORM */}
          {isTeacher && (
            <form onSubmit={handleCreateSlot} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-600" />
                <span>Thêm Khung Giờ Mới:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Tiêu đề đợt họp"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="IN_PERSON">Trực tiếp tại lớp</option>
                  <option value="ONLINE_MEET">Google Meet trực tuyến</option>
                  <option value="PHONE">Gọi điện thoại</option>
                  <option value="ZALO">Gọi Zalo</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Ngày:</span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Từ giờ:</span>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Đến giờ:</span>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <input
                  type="text"
                  placeholder="Địa điểm / Link họp trực tuyến"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 mr-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />

                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Mở Khung Giờ
                </button>
              </div>
            </form>
          )}

          {/* PARENT BOOKING FORM (IF A SLOT IS SELECTED) */}
          {selectedSlotForBooking && currentStudent && (
            <form onSubmit={handleBook} className="bg-purple-50/80 p-4 rounded-2xl border-2 border-purple-300 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-black text-purple-950 text-xs">
                  👉 Đăng Ký Khung Giờ: {selectedSlotForBooking.date} ({selectedSlotForBooking.startTime} - {selectedSlotForBooking.endTime})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSlotForBooking(null)}
                  className="text-purple-600 hover:text-purple-900 font-bold"
                >
                  Hủy
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Họ tên bố/mẹ"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-bold"
                />
                <input
                  type="tel"
                  required
                  placeholder="Số điện thoại liên hệ"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-mono"
                />
              </div>

              <textarea
                rows={2}
                placeholder="Nội dung bố/mẹ mong muốn trao đổi trước với cô giáo (nếu có)..."
                value={discussionTopics}
                onChange={(e) => setDiscussionTopics(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black transition-colors cursor-pointer"
              >
                Xác Nhận Đặt Lịch Hẹn
              </button>
            </form>
          )}

          {/* SLOTS LIST */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Danh Sách Khung Giờ Trao Đổi ({activeSlots.length}):</span>
              <span className="text-slate-400 font-normal">
                {activeSlots.filter((s) => s.isBooked).length} đã đặt • {activeSlots.filter((s) => !s.isBooked).length} còn trống
              </span>
            </h4>

            {activeSlots.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có khung giờ hẹn nào được mở.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeSlots.map((slot) => {
                  const typeInfo = TYPE_CONFIG[slot.type] || TYPE_CONFIG.IN_PERSON;
                  const isMyBooking = currentStudent && slot.bookedStudentId === currentStudent.id;

                  return (
                    <div
                      key={slot.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        slot.isBooked
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-white border-purple-200 hover:border-purple-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-xs">
                            📅 {slot.date} ({slot.startTime} - {slot.endTime})
                          </span>
                          <span className={`px-2 py-0.2 rounded-md font-bold text-[10px] border ${typeInfo.color}`}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 truncate">{slot.title}</p>
                        {slot.location && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{slot.location}</span>
                          </p>
                        )}

                        {slot.isBooked && (
                          <div className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] space-y-0.5 mt-1">
                            <span className="font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã đặt: {slot.bookedParentName} ({slot.bookedStudentName}) - SĐT: {slot.bookedParentPhone}</span>
                            </span>
                            {slot.parentDiscussionTopics && (
                              <p className="text-slate-500 text-[10px]">
                                💬 Nội dung: {slot.parentDiscussionTopics}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {isTeacher ? (
                          <>
                            {slot.isBooked && (
                              <button
                                type="button"
                                onClick={() => cancelConferenceBooking(slot.id)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-bold cursor-pointer"
                              >
                                Hủy đặt
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteConferenceSlot(slot.id)}
                              className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa slot"
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
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
                              >
                                Đăng Ký Giờ Này
                              </button>
                            ) : isMyBooking ? (
                              <button
                                type="button"
                                onClick={() => cancelConferenceBooking(slot.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                              >
                                Hủy Lịch Của Tôi
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                                Đã có người đặt
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Khung giờ hẹn giúp cô trò và phụ huynh chủ động thời gian, nâng cao chất lượng giáo dục.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
