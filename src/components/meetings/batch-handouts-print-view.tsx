'use client';

import React from 'react';
import {
  ParentMeetingDoc,
  SchoolInfo,
  ClassInfo,
  Student,
  SubjectAssessment,
  TraitAssessment,
  TermType,
} from '@/types';
import { Printer, ArrowLeft, Star, Award, CheckCircle2, QrCode } from 'lucide-react';
import { getDefaultPinForStudent, useAppStore } from '@/lib/store';
import { getSubjectsForGrade, TRAIT_DEFINITIONS, getCurrentTermByDate } from '@/lib/tt27-engine';

interface BatchHandoutsPrintViewProps {
  meeting: ParentMeetingDoc;
  schoolInfo: SchoolInfo;
  classInfo: ClassInfo;
  students: Student[];
  onBack?: () => void;
}

export function BatchHandoutsPrintView({
  meeting,
  schoolInfo,
  classInfo,
  students,
  onBack,
}: BatchHandoutsPrintViewProps) {
  const { subjectAssessments, traitAssessments, getStudentStars } = useAppStore();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gvcn-eta.vercel.app';
  const subjects = getSubjectsForGrade(classInfo.grade);
  const currentTerm: TermType =
    meeting.meetingType === 'DAU_NAM'
      ? 'GIUA_HK1'
      : meeting.meetingType === 'SO_KET_HK1'
      ? 'CUOI_HK1'
      : 'CUOI_NAM';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-900 p-4 sm:p-8 font-sans">
      {/* Non-printable Control Bar */}
      <div className="no-print mb-6 max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Quản Lý Họp Phụ Huynh</span>
        </button>

        <div className="text-center">
          <h3 className="text-sm font-black text-slate-900">
            In Hàng Loạt Phiếu Báo Kết Quả & Trao Đổi 1-1 ({students.length} Học Sinh)
          </h3>
          <p className="text-xs text-slate-500">
            Mẫu chuẩn Thông tư 27/2020/TT-BGDĐT • Định dạng in 1 phiếu / trang A4 hoặc A5
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>IN TOÀN BỘ PHIẾU (Ctrl + P)</span>
        </button>
      </div>

      {/* Handouts Grid / Printable Stream */}
      <div className="max-w-5xl mx-auto space-y-8 print:space-y-0">
        {students.map((st, idx) => {
          const note = (meeting.individualNotes || []).find((n) => n.studentId === st.id);
          const pin = getDefaultPinForStudent(st);
          const lookupUrl = `${origin}/student/${st.shareToken || st.id}`;
          const stars = getStudentStars(st.id);

          // Student's TT27 assessments
          const studentSubjects = subjectAssessments.filter(
            (a) => a.studentId === st.id && a.term === currentTerm
          );
          const studentTraits = traitAssessments.filter(
            (a) => a.studentId === st.id && a.term === currentTerm
          );

          return (
            <div
              key={st.id}
              className="bg-white border border-slate-300 p-6 sm:p-8 rounded-3xl shadow-sm print:border-none print:rounded-none print:shadow-none print:p-8 print:break-after-page print:m-0 space-y-4 font-sans text-slate-900"
            >
              {/* Official Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div className="space-y-0.5">
                  <p className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">
                    {schoolInfo.departmentName || 'PHÒNG GIÁO DỤC VÀ ĐÀO TẠO'}
                  </p>
                  <p className="text-sm font-black text-slate-900 uppercase">
                    {schoolInfo.name || 'TRƯỜNG TIỂU HỌC ĐẠI MỖ'}
                  </p>
                  <p className="text-xs font-bold text-blue-700">
                    LỚP {classInfo.name} — NĂM HỌC {schoolInfo.schoolYear || '2026-2027'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Giáo viên chủ nhiệm: <strong>{classInfo.teacherName}</strong>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="bg-slate-900 text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase inline-block print:bg-black print:text-white">
                    PHIẾU THÔNG TIN & KẾT QUẢ RÈN LUYỆN
                  </span>
                  <p className="text-[10px] text-slate-500 italic">
                    (Kỳ họp:{' '}
                    {meeting.meetingType === 'DAU_NAM'
                      ? 'Đầu năm học'
                      : meeting.meetingType === 'SO_KET_HK1'
                      ? 'Sơ kết Học kỳ 1'
                      : 'Tổng kết Cuối năm'}
                    )
                  </p>
                  {stars > 0 && (
                    <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-black text-amber-900 print:border-black">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{stars} Sao Chăm Ngoan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Identity Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs print:bg-transparent print:border print:border-black">
                <div>
                  <span className="text-slate-500 block text-[10px]">Họ và tên học sinh:</span>
                  <strong className="text-sm text-slate-900">{st.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Mã học sinh / Giới tính:</span>
                  <strong>
                    {st.studentCode} ({st.gender})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Ngày sinh:</span>
                  <strong>{st.dateOfBirth}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Hình thức học:</span>
                  <strong>{st.isBoarding ? '🍱 Bán trú tại trường' : '🏠 Học 1 buổi / Về nhà'}</strong>
                </div>
              </div>

              {/* TT27 SUMMARY TABLE: Subjects & Periodic Scores */}
              {meeting.meetingType !== 'DAU_NAM' && studentSubjects.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                    <span>📊</span> 1. Kết Quả Đánh Giá Các Môn Học (Theo Thông Tư 27)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-300 text-[11px] print:border-black">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200 text-slate-800 font-bold">
                          <th className="border border-slate-300 print:border-black px-2 py-1">Môn học</th>
                          <th className="border border-slate-300 print:border-black px-2 py-1 text-center">Mức đạt</th>
                          <th className="border border-slate-300 print:border-black px-2 py-1 text-center">Điểm KT</th>
                          <th className="border border-slate-300 print:border-black px-2 py-1">Nhận xét của giáo viên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((sub) => {
                          const ass = studentSubjects.find((a) => a.subjectCode === sub.code);
                          const levelText =
                            ass?.level === 'T'
                              ? 'Hoàn thành tốt (T)'
                              : ass?.level === 'H'
                              ? 'Hoàn thành (H)'
                              : ass?.level === 'C'
                              ? 'Chưa hoàn thành (C)'
                              : '—';
                          return (
                            <tr key={sub.code} className="hover:bg-slate-50">
                              <td className="border border-slate-300 print:border-black px-2 py-1 font-semibold">
                                {sub.name}
                              </td>
                              <td className="border border-slate-300 print:border-black px-2 py-1 text-center font-bold">
                                <span
                                  className={
                                    ass?.level === 'T'
                                      ? 'text-emerald-700 font-black'
                                      : ass?.level === 'C'
                                      ? 'text-rose-600 font-black'
                                      : 'text-slate-700'
                                  }
                                >
                                  {ass?.level || '—'}
                                </span>
                              </td>
                              <td className="border border-slate-300 print:border-black px-2 py-1 text-center font-mono font-bold">
                                {ass?.score != null ? ass.score : sub.hasPeriodicTest ? '—' : '—'}
                              </td>
                              <td className="border border-slate-300 print:border-black px-2 py-1 text-slate-600 text-[10px]">
                                {ass?.comment || 'Nắm vững kiến thức trọng tâm.'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2 Main Evaluation Text Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Academic & Behavior */}
                <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2 print:border print:border-black">
                  <h4 className="font-black text-slate-900 flex items-center gap-1.5 uppercase text-[11px]">
                    <span>📖</span>{' '}
                    {meeting.meetingType === 'DAU_NAM'
                      ? '1. Tình Hình Rèn Luyện & Học Tập Đầu Năm'
                      : '2. Nhận Xét Tổng Hợp Của Cô Giáo'}
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Học tập:</strong>{' '}
                    {note?.academicSummary ||
                      'Em tiếp thu bài nhanh, làm bài tập đầy đủ và tích cực phát biểu xây dựng bài.'}
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Nề nếp & Phẩm chất:</strong>{' '}
                    {note?.behaviorSummary ||
                      'Lễ phép, hòa đồng với bạn bè, chấp hành tốt nội quy lớp học.'}
                  </p>
                </div>

                {/* Teacher's Action Item / Note for Parents */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-blue-50/50 space-y-2 print:bg-transparent print:border print:border-black">
                  <h4 className="font-black text-blue-900 flex items-center gap-1.5 uppercase text-[11px] print:text-black">
                    <span>💡</span>{' '}
                    {meeting.meetingType === 'DAU_NAM'
                      ? '2. Đề Nghị Phối Hợp Giáo Dục Của Cô Giáo'
                      : '3. Lời Dặn Dò & Phương Hướng Kèm Cặp Tại Nhà'}
                  </h4>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {note?.actionItemForParents ||
                      'Kính nhờ gia đình tiếp tục đồng hành, nhắc nhở con chuẩn bị sách vở và đồ dùng học tập đầy đủ mỗi tối.'}
                  </p>
                  {st.healthNotes && (
                    <p className="text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200 print:border-black font-semibold">
                      🏥 Lưu ý sức khỏe: {st.healthNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Online Lookup Card with PIN */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs print:bg-transparent print:border print:border-black">
                <div className="space-y-1 text-slate-700">
                  <p className="font-bold flex items-center gap-1">
                    <span>📱 Tra cứu hồ sơ rèn luyện và bảng điểm trực tuyến:</span>
                  </p>
                  <p className="text-[11px] font-mono text-blue-700 print:text-black">
                    Liên kết tra cứu riêng: <strong>{lookupUrl}</strong>
                  </p>
                  <p className="text-[11px]">
                    Mật khẩu mặc định tra cứu lần đầu:{' '}
                    <strong className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-mono text-xs print:border print:border-black">
                      {pin}
                    </strong>{' '}
                    (Ngày sinh con dạng ddmmyyyy)
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block">GVCN ký xác nhận</span>
                  <div className="h-8 font-serif italic text-blue-900 pt-1 font-bold">
                    {classInfo.teacherName}
                  </div>
                </div>
              </div>

              {/* Parent Feedback & Signature Box */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-center text-xs">
                <div className="border-t border-slate-300 pt-2 print:border-t print:border-black">
                  <p className="font-bold uppercase text-[11px]">Ý KIẾN CỦA PHỤ HUYNH</p>
                  <p className="text-[10px] text-slate-400 italic">
                    (Ghi ý kiến đóng góp hoặc đề xuất nếu có)
                  </p>
                  <div className="h-10"></div>
                </div>
                <div className="border-t border-slate-300 pt-2 print:border-t print:border-black">
                  <p className="font-bold uppercase text-[11px]">CHỮ KÝ XÁC NHẬN CỦA PHỤ HUYNH</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                  <div className="h-10"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
