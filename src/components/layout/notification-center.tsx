"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Mail,
  Calendar,
  AlertTriangle,
  Cake,
  Check,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  CheckCheck,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { scanEarlyInterventionAlerts } from '@/lib/early-intervention';
import { getLocalDateString } from '@/lib/tt27-engine';

const STORAGE_KEY = 'gvcn_pro_read_notifications_v1';

export interface NotificationItem {
  id: string;
  type: 'LEAVE' | 'CONFERENCE' | 'QUIZ' | 'ALERT' | 'BIRTHDAY';
  title: string;
  desc: string;
  time: string;
  link: string;
  color: string;
  icon: string;
  isRead: boolean;
}

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL');

  const {
    students,
    leaveRequests,
    conferenceSlots,
    attendances,
    subjectAssessments,
    traitAssessments,
    starLogs,
    currentTerm,
    quizSubmissions,
    homeworks,
  } = useAppStore();

  const todayStr = getLocalDateString();

  // Load read notification IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setReadIds(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load read notifications from localStorage', e);
    }
  }, []);

  const saveReadIds = (newReadIds: string[]) => {
    setReadIds(newReadIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReadIds));
    } catch (e) {
      console.warn('Failed to save read notifications to localStorage', e);
    }
  };

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      saveReadIds(updated);
    }
  };

  const handleNotificationClick = (item: NotificationItem, e: React.MouseEvent) => {
    e.preventDefault();
    markAsRead(item.id);
    setIsOpen(false);
    router.push(item.link);
  };

  // Early intervention alerts
  const earlyAlerts = useMemo(() => {
    return scanEarlyInterventionAlerts(
      students,
      attendances,
      subjectAssessments,
      starLogs,
      currentTerm
    );
  }, [students, attendances, subjectAssessments, starLogs, currentTerm]);

  // Notifications aggregation
  const allNotifications = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Pending Leave Requests
    leaveRequests
      .filter((r) => r.status === 'PENDING')
      .forEach((r) => {
        const id = `leave-${r.id}`;
        list.push({
          id,
          type: 'LEAVE',
          title: `Đơn xin nghỉ phép: ${r.studentName}`,
          desc: `Nghỉ ${r.startDate} (${r.reasonDetail})${r.hasBoardingMealCancel ? ' - Cắt cơm bán trú' : ''}`,
          time: 'Chờ duyệt',
          link: '/attendance#leave-requests',
          color: 'bg-amber-50/90 text-amber-900 border-amber-200',
          icon: '📬',
          isRead: readIds.includes(id),
        });
      });

    // 2. Booked Conferences
    conferenceSlots
      .filter((s) => s.isBooked)
      .forEach((s) => {
        const id = `conf-${s.id}`;
        list.push({
          id,
          type: 'CONFERENCE',
          title: `Lịch hẹn họp: ${s.bookedStudentName}`,
          desc: `${s.date} (${s.startTime} - ${s.endTime}) - Phụ huynh ${s.bookedParentName} (${s.bookedParentPhone})`,
          time: s.type === 'IN_PERSON' ? 'Trực tiếp' : 'Online',
          link: '/?openConference=true',
          color: 'bg-purple-50/90 text-purple-900 border-purple-200',
          icon: '📅',
          isRead: readIds.includes(id),
        });
      });

    // 3. New Quiz Submissions
    quizSubmissions.slice(0, 5).forEach((sub) => {
      const hw = homeworks.find((h) => h.id === sub.homeworkId);
      const id = `quiz-${sub.id}`;
      list.push({
        id,
        type: 'QUIZ',
        title: `Bài nộp mới: ${sub.studentName}`,
        desc: `Đã nộp bài "${hw?.title || 'Bài trắc nghiệm'}" • Đạt ${sub.score}/10đ (${sub.correctCount}/${sub.totalCount} câu)`,
        time: 'Bài tập',
        link: '/homework',
        color: 'bg-blue-50/90 text-blue-900 border-blue-200',
        icon: '📝',
        isRead: readIds.includes(id),
      });
    });

    // 4. Early Intervention Alerts
    earlyAlerts.slice(0, 3).forEach((a) => {
      const id = `alert-${a.id}`;
      list.push({
        id,
        type: 'ALERT',
        title: `Cần hỗ trợ: ${a.studentName}`,
        desc: a.reason || a.title,
        time: 'Cảnh báo',
        link: '/students',
        color: 'bg-rose-50/90 text-rose-900 border-rose-200',
        icon: '🚨',
        isRead: readIds.includes(id),
      });
    });

    // 5. Birthdays today
    students.forEach((st) => {
      if (st.dateOfBirth) {
        const today = new Date();
        const bday = new Date(st.dateOfBirth);
        if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
          const id = `bday-${st.id}-${today.getFullYear()}`;
          const age = today.getFullYear() - bday.getFullYear();
          list.push({
            id,
            type: 'BIRTHDAY',
            title: `Sinh nhật hôm nay: ${st.fullName} 🎂`,
            desc: `Chúc mừng em tròn ${age} tuổi! Hãy gửi lời chúc mừng sinh nhật ấm áp đến em nhé.`,
            time: 'Hôm nay',
            link: '/students',
            color: 'bg-pink-50/90 text-pink-900 border-pink-200',
            icon: '🎂',
            isRead: readIds.includes(id),
          });
        }
      }
    });

    return list;
  }, [leaveRequests, conferenceSlots, quizSubmissions, homeworks, earlyAlerts, students, readIds]);

  const unreadNotifications = useMemo(
    () => allNotifications.filter((n) => !n.isRead),
    [allNotifications]
  );

  const displayedNotifications = useMemo(() => {
    return filterTab === 'UNREAD' ? unreadNotifications : allNotifications;
  }, [filterTab, unreadNotifications, allNotifications]);

  const unreadCount = unreadNotifications.length;

  const handleMarkAllAsRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    saveReadIds(Array.from(new Set([...readIds, ...allIds])));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors relative cursor-pointer"
        title="Thông báo hệ thống"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 text-sm">Thông Báo Hoạt Động</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`flex-1 py-1 text-center rounded-lg transition-all cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tất cả ({allNotifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('UNREAD')}
                className={`flex-1 py-1 text-center rounded-lg transition-all cursor-pointer ${
                  filterTab === 'UNREAD'
                    ? 'bg-white text-rose-600 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {displayedNotifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <div className="text-2xl">✨</div>
                  <p className="text-xs font-bold text-slate-600">
                    {filterTab === 'UNREAD'
                      ? 'Bạn đã đọc hết mọi thông báo!'
                      : 'Không có thông báo mới'}
                  </p>
                  <p className="text-[11px] text-slate-400">Mọi công việc và đơn từ đã được xử lý xong!</p>
                </div>
              ) : (
                displayedNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={(e) => handleNotificationClick(n, e)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                      n.isRead
                        ? 'bg-slate-50/60 border-slate-200 opacity-65 hover:opacity-100 hover:bg-slate-100/80'
                        : `${n.color} shadow-xs font-semibold`
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <h5
                            className={`text-xs truncate ${
                              n.isRead ? 'font-medium text-slate-700' : 'font-black text-slate-900'
                            }`}
                          >
                            {n.title}
                          </h5>
                          <span className="text-[10px] font-bold opacity-75 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed line-clamp-2 text-slate-600">
                          {n.desc}
                        </p>
                      </div>

                      {/* Unread indicator dot or check button */}
                      <div className="shrink-0 flex items-center self-center pl-1">
                        {!n.isRead ? (
                          <span
                            className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-xs animate-pulse"
                            title="Chưa đọc"
                          />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>GVCN Pro • Tự động cập nhật thời gian thực</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
