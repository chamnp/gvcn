'use client';

import React from 'react';
import { ParentMeetingDoc, SchoolInfo, ClassInfo } from '@/types';
import { Printer, ArrowLeft } from 'lucide-react';

interface MeetingMinutesPrintViewProps {
  meeting: ParentMeetingDoc;
  schoolInfo: SchoolInfo;
  classInfo: ClassInfo;
  onBack?: () => void;
}

export function MeetingMinutesPrintView({
  meeting,
  schoolInfo,
  classInfo,
  onBack,
}: MeetingMinutesPrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-screen text-black p-4 sm:p-8 font-serif">
      <div className="no-print mb-6 max-w-4xl mx-auto flex items-center justify-between bg-slate-100 p-4 rounded-2xl border border-slate-300 font-sans">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Quản Lý Họp Phụ Huynh</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>IN BIÊN BẢN HỌP A4 (Ctrl + P)</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white border border-slate-300 p-8 sm:p-12 shadow-lg print:border-none print:shadow-none print:p-0 space-y-6 leading-relaxed">
        <div className="grid grid-cols-2 text-center text-xs sm:text-sm">
          <div>
            <p className="uppercase font-bold">{schoolInfo.departmentName || 'PHÒNG GD&ĐT QUẬN NAM TỪ LIÊM'}</p>
            <p className="uppercase font-bold underline underline-offset-4">{schoolInfo.name || 'TRƯỜNG TIỂU HỌC ĐẠI MỖ'}</p>
          </div>
          <div>
            <p className="uppercase font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>

        <div className="text-center space-y-1.5 pt-4">
          <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wide">
            BIÊN BẢN HỘI NGHỊ CHA MẸ HỌC SINH
          </h1>
          <p className="text-xs sm:text-sm font-bold uppercase">
            LỚP {classInfo.name} — NĂM HỌC {schoolInfo.schoolYear || '2026 - 2027'}
          </p>
          <p className="text-xs italic">(Cuộc họp {meeting.meetingType === 'DAU_NAM' ? 'Đầu năm học' : meeting.meetingType === 'SO_KET_HK1' ? 'Sơ kết Học kỳ 1' : 'Tổng kết Cuối năm'})</p>
        </div>

        <div className="space-y-2 text-xs sm:text-sm">
          <p><strong>Thời gian:</strong> Hồi 08 giờ 00 phút, ngày {meeting.meetingDate}.</p>
          <p><strong>Địa điểm:</strong> {meeting.location}.</p>
          <p><strong>Chủ tọa:</strong> {meeting.presidedBy}.</p>
          <p><strong>Thư ký cuộc họp:</strong> {meeting.secretary}.</p>
          <p><strong>Thành phần tham dự:</strong> Có mặt {meeting.attendeesCount}/{meeting.totalParents} phụ huynh học sinh (Đạt tỷ lệ {Math.round((meeting.attendeesCount / meeting.totalParents) * 100)}%).</p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <h3 className="font-bold uppercase text-sm border-b border-black pb-1 mb-2">
              I. NỘI DUNG CUỘC HỌP
            </h3>
            <div className="space-y-2 pl-2">
              {meeting.mainReports.map((report, idx) => (
                <p key={idx}>{idx + 1}. {report}</p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase text-sm border-b border-black pb-1 mb-2">
              II. Ý KIẾN THẢO LUẬN CỦA PHỤ HUYNH
            </h3>
            <p className="pl-2">{meeting.discussionNotes}</p>
          </div>

          <div>
            <h3 className="font-bold uppercase text-sm border-b border-black pb-1 mb-2">
              III. KẾT QUẢ BẦU BAN ĐẠI DIỆN CHA MẸ HỌC SINH LỚP
            </h3>
            <div className="pl-2 space-y-1">
              {meeting.committeeMembers.map((m, idx) => (
                <p key={idx}>
                  - <strong>{m.role === 'TRUONG_BAN' ? 'Trưởng Ban' : m.role === 'PHO_BAN' ? 'Phó Ban' : 'Ủy Viên'}:</strong> Ông/Bà {m.fullName} (Phụ huynh em {m.studentName}) — ĐT: {m.phone}.
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase text-sm border-b border-black pb-1 mb-2">
              IV. NGHỊ QUYẾT HỘI NGHỊ
            </h3>
            <div className="pl-2 space-y-1">
              {meeting.agreedResolutions.map((res, idx) => (
                <p key={idx}>- {res}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 text-center text-xs sm:text-sm pt-8 gap-6">
          <div className="space-y-16">
            <p className="font-bold uppercase">THƯ KÝ CUỘC HỌP</p>
            <p className="font-bold">{meeting.secretary}</p>
          </div>
          <div className="space-y-16">
            <p className="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="font-bold">{classInfo.teacherName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
