'use client';

import React from 'react';
import { ParentMeetingDoc, SchoolInfo, ClassInfo, Student } from '@/types';
import { Printer, ArrowLeft, Sparkles } from 'lucide-react';
import { getDefaultPinForStudent } from '@/lib/store';

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
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gvcn-eta.vercel.app';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 p-4 sm:p-8 font-sans">
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
            In Hàng Loạt Phiếu Trao Đổi Cá Nhân ({students.length} Học Sinh)
          </h3>
          <p className="text-xs text-slate-500">Định dạng chuẩn 2 phiếu / trang A4 (cắt đôi) hoặc 1 phiếu / trang A5</p>
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
      <div className="max-w-5xl mx-auto space-y-6 print:space-y-0">
        {students.map((st, idx) => {
          const note = (meeting.individualNotes || []).find((n) => n.studentId === st.id);
          const pin = getDefaultPinForStudent(st);
          const lookupUrl = `${origin}/student/${st.shareToken || st.id}`;

          return (
            <div
              key={st.id}
              className="bg-white border-2 border-dashed border-slate-300 p-6 sm:p-8 rounded-3xl shadow-xs print:border print:border-black print:rounded-none print:shadow-none print:p-6 print:break-after-page print:m-0 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <p className="text-xs uppercase font-bold text-slate-600">{schoolInfo.name || 'TRƯỜNG TIỂU HỌC ĐẠI MỖ'}</p>
                  <p className="text-sm font-black text-slate-900 uppercase">LỚP {classInfo.name} — NĂM HỌC {schoolInfo.schoolYear || '2026-2027'}</p>
                  <p className="text-xs text-slate-500">GVCN: {classInfo.teacherName}</p>
                </div>

                <div className="text-right">
                  <span className="bg-slate-900 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase inline-block print:border print:border-black">
                    PHIẾU THÔNG TIN HỌC SINH
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    (Kỳ họp: {meeting.meetingType === 'DAU_NAM' ? 'Đầu năm học' : meeting.meetingType === 'SO_KET_HK1' ? 'Sơ kết Học kỳ 1' : 'Tổng kết Cuối năm'})
                  </p>
                </div>
              </div>

              {/* Student Identity Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs print:bg-transparent print:border-black">
                <div>
                  <span className="text-slate-500 block text-[10px]">Họ và tên học sinh:</span>
                  <strong className="text-sm text-slate-900">{st.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Mã học sinh / Giới tính:</span>
                  <strong>{st.studentCode} ({st.gender})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Ngày sinh:</span>
                  <strong>{st.dateOfBirth}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Bán trú tại trường:</span>
                  <strong>{st.isBoarding ? '🍱 Ăn bán trú' : '🏠 Về nhà'}</strong>
                </div>
              </div>

              {/* 3 Main Evaluation Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Academic & Behavior */}
                <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2 print:border-black">
                  <h4 className="font-black text-slate-900 flex items-center gap-1.5 uppercase text-[11px]">
                    <span>📖</span> 1. Kết Quả Học Tập & Rèn Luyện
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Học tập:</strong> {note?.academicSummary || 'Em tiếp thu bài nhanh, làm bài tập đầy đủ và tích cực phát biểu xây dựng bài.'}
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Nề nếp:</strong> {note?.behaviorSummary || 'Lễ phép, hòa đồng với bạn bè, chấp hành tốt nội quy lớp học.'}
                  </p>
                </div>

                {/* Teacher's Action Item / Note for Parents */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-blue-50/50 space-y-2 print:bg-transparent print:border-black">
                  <h4 className="font-black text-blue-900 flex items-center gap-1.5 uppercase text-[11px] print:text-black">
                    <span>💡</span> 2. Lời Dặn Dò & Đề Nghị Phối Hợp Của Cô Giáo
                  </h4>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {note?.actionItemForParents || 'Kính nhờ gia đình tiếp tục đồng hành, nhắc nhở con chuẩn bị sách vở và đồ dùng học tập đầy đủ mỗi tối.'}
                  </p>
                </div>
              </div>

              {/* Online Lookup Card with PIN */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs print:bg-transparent print:border-black">
                <div className="space-y-1 text-slate-700">
                  <p className="font-bold flex items-center gap-1">
                    <span>📱 Tra cứu hồ sơ rèn luyện và bảng điểm trực tuyến:</span>
                  </p>
                  <p className="text-[11px] font-mono text-blue-700 print:text-black">
                    Liên kết riêng: {lookupUrl}
                  </p>
                  <p className="text-[11px]">
                    Mật khẩu mặc định tra cứu lần đầu: <strong className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-mono text-xs print:border print:border-black">{pin}</strong> (Ngày sinh con)
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">GVCN ký xác nhận</span>
                  <div className="h-8 font-serif italic text-blue-900 pt-1">{classInfo.teacherName}</div>
                </div>
              </div>

              {/* Parent Signature Box */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-center text-xs">
                <div className="border-t border-slate-300 pt-2 print:border-black">
                  <p className="font-bold uppercase text-[11px]">Ý KIẾN CỦA PHỤ HUYNH</p>
                  <p className="text-[10px] text-slate-400 italic">(Ghi ý kiến đóng góp nếu có)</p>
                  <div className="h-10"></div>
                </div>
                <div className="border-t border-slate-300 pt-2 print:border-black">
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
