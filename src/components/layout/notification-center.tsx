"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { scanEarlyInterventionAlerts } from "@/lib/early-intervention";
import { getLocalDateString } from "@/lib/tt27-engine";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const {
    students,
    leaveRequests,
    conferenceSlots,
    attendances,
    subjectAssessments,
    traitAssessments,
    starLogs,
    currentTerm,
  } = useAppStore();

  const todayStr = getLocalDateString();

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
  const notifications = useMemo(() => {
    const list: {
      id: string;
      type: "LEAVE" | "CONFERENCE" | "ALERT" | "BIRTHDAY";
      title: string;
      desc: string;
      time: string;
      link: string;
      color: string;
      icon: string;
    }[] = [];

    // 1. Pending Leave Requests
    leaveRequests
      .filter((r) => r.status === "PENDING")
      .forEach((r) => {
        list.push({
          id: `leave-${r.id}`,
          type: "LEAVE",
          title: `Đơn xin nghỉ phép: ${r.studentName}`,
          desc: `Nghỉ ${r.startDate} (${r.reasonDetail})${r.hasBoardingMealCancel ? " - Cắt cơm" : ""}`,
          time: "Chờ duyệt",
          link: "/attendance",
          color: "bg-amber-50 text-amber-800 border-amber-200",
          icon: "📬",
        });
      });

    // 2. Booked Conferences
    conferenceSlots
      .filter((s) => s.isBooked)
      .forEach((s) => {
        list.push({
          id: `conf-${s.id}`,
          type: "CONFERENCE",
          title: `Lịch hẹn họp: ${s.bookedStudentName}`,
          desc: `${s.date} (${s.startTime} - ${s.endTime}) - ${s.bookedParentName} (${s.bookedParentPhone})`,
          time: s.type === "IN_PERSON" ? "Trực tiếp" : "Online",
          link: "/",
          color: "bg-purple-50 text-purple-800 border-purple-200",
          icon: "📅",
        });
      });

    // 3. Early Intervention Alerts
    earlyAlerts.slice(0, 3).forEach((a) => {
      list.push({
        id: `alert-${a.id}`,
        type: "ALERT",
        title: `Cần hỗ trợ: ${a.studentName}`,
        desc: a.reason || a.title,
        time: "Cảnh báo",
        link: "/students",
        color: "bg-rose-50 text-rose-800 border-rose-200",
        icon: "🚨",
      });
    });

    // 4. Birthdays today
    students.forEach((st) => {
      if (st.dateOfBirth) {
        const today = new Date();
        const bday = new Date(st.dateOfBirth);
        if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
          list.push({
            id: `bday-${st.id}`,
            type: "BIRTHDAY",
            title: `Sinh nhật hôm nay: ${st.fullName} 🎂`,
            desc: "Hãy gửi lời chúc mừng sinh nhật ấm áp đến em nhé!",
            time: "Hôm nay",
            link: "/students",
            color: "bg-pink-50 text-pink-800 border-pink-200",
            icon: "🎂",
          });
        }
      }
    });

    return list.filter((n) => !dismissedIds.includes(n.id));
  }, [leaveRequests, conferenceSlots, earlyAlerts, students, dismissedIds]);

  const unreadCount = notifications.length;

  const handleDismissAll = () => {
    setDismissedIds(notifications.map((n) => n.id));
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
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 text-sm">Thông Báo Hoạt Động</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                    {unreadCount} mới
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <div className="text-2xl">✨</div>
                  <p className="text-xs font-bold text-slate-600">Không có thông báo mới</p>
                  <p className="text-[11px] text-slate-400">Mọi công việc và đơn từ đã được xử lý xong!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => setIsOpen(false)}
                    className={`block p-3 rounded-2xl border transition-all hover:shadow-xs ${n.color}`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <span className="text-lg shrink-0">{n.icon}</span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs truncate text-slate-900">{n.title}</h5>
                          <span className="text-[10px] font-bold opacity-75">{n.time}</span>
                        </div>
                        <p className="text-[11px] opacity-90 leading-relaxed line-clamp-2">{n.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
