"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  Heart,
  Star,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  Eye,
  Activity,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Student, TermType, SubjectAssessment, TraitAssessment, StudentTermSummary } from "@/types";
import { useAppStore } from "@/lib/store";
import { TERMS, PRIMARY_SUBJECTS, TRAIT_DEFINITIONS } from "@/lib/tt27-engine";
import { toast } from "sonner";

interface Student360ModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Student360Modal({ student, isOpen, onClose }: Student360ModalProps) {
  const [activeTab, setActiveTab] = useState<"PROFILE" | "ACADEMIC" | "TRAITS" | "BEHAVIOR" | "NOTES" | "PARENT">("PROFILE");
  const [selectedTerm, setSelectedTerm] = useState<TermType>("GIUA_HK1");

  const {
    subjectAssessments,
    traitAssessments,
    termSummaries,
    attendances,
    starLogs,
    formativeNotes,
    leaveRequests,
    conferenceSlots,
    schoolClasses,
  } = useAppStore();

  if (!isOpen || !student) return null;

  const studentClass = schoolClasses.find((c) => c.id === student.classId) || schoolClasses[0];

  // Assessments
  const studentSubjects = subjectAssessments.filter((a) => a.studentId === student.id);
  const studentTraits = traitAssessments.filter((a) => a.studentId === student.id);
  const studentSummaries = termSummaries.filter((s) => s.studentId === student.id);

  // Attendance
  const studentAtt = attendances.filter((a) => a.studentId === student.id);
  const totalDays = studentAtt.length;
  const presentDays = studentAtt.filter((a) => a.status === "CO_MAT").length;
  const excusedDays = studentAtt.filter((a) => a.status === "VANG_CO_PHEP").length;
  const unexcusedDays = studentAtt.filter((a) => a.status === "VANG_KHONG_PHEP").length;
  const lateDays = studentAtt.filter((a) => a.status === "MUON").length;

  // Star Logs
  const studentStars = starLogs.filter((s) => s.studentId === student.id);
  const totalStarsCount = studentStars.reduce((sum, s) => sum + s.points, 0);

  // Formative Notes
  const studentNotes = formativeNotes.filter((n) => n.studentId === student.id);

  // Leave Requests & Conferences
  const studentLeaves = leaveRequests.filter((r) => r.studentId === student.id);
  const studentConferences = conferenceSlots.filter((s) => s.bookedStudentId === student.id);

  const handleCopyLink = () => {
    const link = student.shareToken
      ? `${window.location.origin}/student/${student.shareToken}`
      : `${window.location.origin}/student/${student.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Đã sao chép liên kết góc học tập riêng của học sinh!");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER HERO */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 sm:p-6 text-white shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-2xl shadow-inner border border-white/20">
                {student.gender === "Nữ" ? "👧" : "👦"}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Mã định danh: {student.studentCode}
                  </span>
                  <span className="bg-yellow-400 text-yellow-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    Lớp {studentClass?.name}
                  </span>
                  {student.isBoarding && (
                    <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      🍱 Bán trú
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black">{student.fullName}</h2>
                <p className="text-xs text-blue-100 flex items-center gap-2">
                  <span>📅 Sinh ngày: {student.dateOfBirth}</span>
                  <span>•</span>
                  <span>⭐ Tổng tích lũy: {totalStarsCount} sao</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-colors cursor-pointer border border-white/10"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép Link PH</span>
              </button>

              <Link
                href={student.shareToken ? `/student/${student.shareToken}` : `/student/${student.id}`}
                target="_blank"
                className="inline-flex items-center space-x-1.5 bg-white text-blue-900 hover:bg-blue-50 px-3.5 py-2 rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer"
              >
                <span>Xem Cổng Con</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 6 NAVIGATION TABS */}
        <div className="flex overflow-x-auto no-scrollbar gap-1 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold shrink-0">
          {[
            { id: "PROFILE", label: "🪪 Căn Cước & Y Tế", count: null },
            { id: "ACADEMIC", label: "📈 Học Tập TT27", count: studentSubjects.length },
            { id: "TRAITS", label: "🌟 Phẩm Chất & Năng Lực", count: null },
            { id: "BEHAVIOR", label: "📋 Chuyên Cần & Sao", count: totalStarsCount },
            { id: "NOTES", label: "📝 Ghi Chú Tiến Bộ", count: studentNotes.length },
            { id: "PARENT", label: "📬 Đơn Nghỉ & Họp 1-1", count: studentLeaves.length + studentConferences.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-9 px-3.5 flex items-center justify-center space-x-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS (SCROLLABLE BODY) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
          {/* TAB 1: PROFILE & HEALTH */}
          {activeTab === "PROFILE" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Thông Tin Cá Nhân & Gia Đình</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Họ và tên:</span>
                    <strong className="text-slate-900">{student.fullName}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Giới tính / Dân tộc:</span>
                    <span>{student.gender} / {student.ethnicity || "Kinh"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Nơi sinh:</span>
                    <span>{student.birthPlace || "Hà Nội"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Phụ huynh:</span>
                    <strong className="text-slate-900">{student.parentName || "Chưa cập nhật"}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">SĐT Liên hệ:</span>
                    <a href={`tel:${student.parentPhone}`} className="font-mono font-bold text-blue-600 hover:underline">
                      {student.parentPhone || "Chưa cập nhật"}
                    </a>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Địa chỉ cư trú:</span>
                    <span className="text-right max-w-[200px] truncate">{student.address || "Chưa cập nhật"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Sức Khỏe & Vị Trí Ngồi Lớp</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Vị trí chỗ ngồi:</span>
                    <strong className="text-indigo-600">
                      {student.seatRow ? `Bàn ${student.seatRow}, Dãy ${student.seatCol || 1}` : "Chưa xếp chỗ"}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Ghi chú sức khỏe & Thị lực:</span>
                    <span className="font-semibold text-slate-800">{student.healthNotes || "Bình thường (Không cận)"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Thẻ gắn nhãn:</span>
                    <span>{student.tags && student.tags.length > 0 ? student.tags.join(', ') : 'Học sinh'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Chế độ bán trú:</span>
                    <strong className={student.isBoarding ? "text-emerald-600" : "text-slate-500"}>
                      {student.isBoarding ? "Ăn & Ngủ bán trú tại trường" : "Về nhà buổi trưa"}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Bảo mật mã PIN:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {student.isActivated ? "Đã đặt PIN riêng" : "Mặc định (SĐT)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC GRADES TT27 */}
          {activeTab === "ACADEMIC" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900">Bảng Tổng Hợp Đánh Giá Các Môn Học</h4>
                <div className="flex gap-1">
                  {TERMS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTerm(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedTerm === t.id ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th className="p-3">Môn học</th>
                      <th className="p-3 text-center w-24">Mức ĐG</th>
                      <th className="p-3 text-center w-20">Điểm KT</th>
                      <th className="p-3">Lời nhận xét của giáo viên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PRIMARY_SUBJECTS.map((sub) => {
                      const ass = studentSubjects.find((a) => a.subjectCode === sub.code && a.term === selectedTerm);
                      return (
                        <tr key={sub.code} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{sub.name}</td>
                          <td className="p-3 text-center">
                            {ass?.level ? (
                              <span
                                className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                                  ass.level === "T"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : ass.level === "H"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-900"
                                }`}
                              >
                                {ass.level === "T" ? "Tốt" : ass.level === "H" ? "Hoàn thành" : "Cần C.G"}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold font-mono">
                            {ass?.score !== undefined && ass.score !== null ? (
                              <span className={ass.score >= 9 ? "text-emerald-600" : ass.score >= 7 ? "text-blue-600" : "text-amber-600"}>
                                {ass.score}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 italic">
                            {ass?.comment || "Chưa có lời nhận xét"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: QUALITIES & COMPETENCIES */}
          {activeTab === "TRAITS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900">5 Phẩm Chất & 10 Năng Lực Cốt Lõi TT27</h4>
                <div className="flex gap-1">
                  {TERMS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTerm(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedTerm === t.id ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TRAIT_DEFINITIONS.map((trait) => {
                  const ass = studentTraits.find((t) => t.traitCode === trait.code && t.term === selectedTerm);
                  return (
                    <div key={trait.code} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{trait.name}</span>
                        {ass?.level ? (
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                              ass.level === "T"
                                ? "bg-emerald-100 text-emerald-800"
                                : ass.level === "Đ"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {ass.level === "T" ? "Tốt (T)" : ass.level === "Đ" ? "Đạt (Đ)" : "Cần C.G (C)"}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Chưa ĐG</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 italic">
                        {ass?.comment || (trait.category === 'PHAM_CHAT' ? 'Đánh giá phẩm chất cốt lõi TT27' : 'Đánh giá năng lực cốt lõi TT27')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE & STARS */}
          {activeTab === "BEHAVIOR" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-emerald-600">Có Mặt</span>
                  <div className="text-xl font-black text-emerald-800">{presentDays} buổi</div>
                </div>
                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-center space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-amber-600">Vắng Có Phép</span>
                  <div className="text-xl font-black text-amber-800">{excusedDays} buổi</div>
                </div>
                <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-center space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-rose-600">Vắng Không Phép</span>
                  <div className="text-xl font-black text-rose-800">{unexcusedDays} buổi</div>
                </div>
                <div className="bg-yellow-50 p-3.5 rounded-2xl border border-yellow-200 text-center space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-yellow-700">Tổng Sao Thưởng</span>
                  <div className="text-xl font-black text-yellow-800">{totalStarsCount} ⭐</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Lịch Sử Ghi Nhận Sao Nề Nếp Gần Đây</h4>
                {studentStars.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Chưa có bản ghi tích sao nào.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentStars.slice(0, 10).map((s) => (
                      <div key={s.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={s.points > 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                            {s.points > 0 ? `+${s.points}` : s.points} ⭐
                          </span>
                          <span className="text-slate-800">{s.reason}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{s.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: FORMATIVE PROGRESS NOTES */}
          {activeTab === "NOTES" && (
            <div className="space-y-3">
              <h4 className="font-black text-sm text-slate-900">Chuỗi Ghi Chú Tiến Bộ Thường Xuyên Của Cô</h4>
              {studentNotes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có ghi chú thường xuyên nào cho học sinh này.
                </div>
              ) : (
                studentNotes.map((note) => (
                  <div key={note.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs">{note.title}</span>
                        {note.isImportant && (
                          <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                            Quan trọng
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {note.visibility === 'PRIVATE_TEACHER' ? '🔒 Nội bộ' : '🌐 Gửi PH'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{note.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{note.content}</p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {note.tags.map((t) => (
                          <span key={t} className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.2 rounded-md">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        {note.category === 'TIEN_BO' ? '🌟 Tiến bộ' : note.category === 'BAN_TRU' ? '🍱 Bán trú' : note.category === 'CAN_CO_GANG' ? '⚠️ Cần cố gắng' : '💬 Dặn dò'}
                      </span>
                      {note.parentAcknowledged ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500" />
                          <span>Phụ huynh đã đọc</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Chờ phụ huynh xác nhận</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: PARENT LEAVE & CONFERENCES */}
          {activeTab === "PARENT" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-black text-xs uppercase text-slate-600">Đơn Xin Nghỉ Phép Từ Phụ Huynh</h4>
                {studentLeaves.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Không có đơn xin nghỉ phép nào.</p>
                ) : (
                  studentLeaves.map((l) => (
                    <div key={l.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {l.startDate === l.endDate ? `Nghỉ ${l.startDate}` : `${l.startDate} ➔ ${l.endDate}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                        }`}>
                          {l.status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                        </span>
                      </div>
                      <p className="text-slate-600">Lý do: {l.reasonDetail}</p>
                      {l.medicationNotes && (
                        <p className="text-rose-700 bg-rose-50 p-1.5 rounded text-[11px]">💊 Thuốc: {l.medicationNotes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-xs uppercase text-slate-600">Lịch Hẹn Họp & Trao Đổi 1-1</h4>
                {studentConferences.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Chưa đăng ký lịch hẹn 1-1 nào.</p>
                ) : (
                  studentConferences.map((c) => (
                    <div key={c.id} className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-purple-950">
                        <span>📅 {c.date} ({c.startTime} - {c.endTime})</span>
                        <span className="bg-purple-200 text-purple-900 text-[10px] px-2 py-0.5 rounded-full">
                          {c.type === "IN_PERSON" ? "Trực tiếp" : "Trực tuyến"}
                        </span>
                      </div>
                      {c.parentDiscussionTopics && (
                        <p className="text-purple-900">Nội dung PH muốn trao đổi: {c.parentDiscussionTopics}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
