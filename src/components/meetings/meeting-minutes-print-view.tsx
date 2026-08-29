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

  const truongBan = (meeting.committeeMembers || []).find((m) => m.role === 'TRUONG_BAN');
  const attendanceRate = Math.round(
    ((meeting.attendeesCount || 1) / (meeting.totalParents || 1)) * 100
  );

  return (
    <div className="bg-slate-100 min-h-screen text-black p-4 sm:p-8 font-serif">
      <div className="no-print mb-6 max-w-4xl mx-auto flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-300 font-sans shadow-sm">
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
            Biên Bản Hội Nghị Cha Mẹ Học Sinh (Mẫu Chuẩn Bộ GD&ĐT)
          </h3>
          <p className="text-xs text-slate-500">Định dạng chuẩn trang in A4 • Sẵn sàng ký & lưu hồ sơ lớp</p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>IN BIÊN BẢN HỌP A4 (Ctrl + P)</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white border border-slate-300 p-8 sm:p-12 shadow-lg print:border-none print:shadow-none print:p-8 space-y-6 leading-relaxed text-slate-900 text-xs sm:text-sm">
        {/* National Emblem & School Header */}
        <div className="grid grid-cols-2 text-center text-xs sm:text-sm pb-2 border-b border-black">
          <div>
            <p className="uppercase font-bold text-[11px] sm:text-xs">
              {schoolInfo.departmentName || 'PHÒNG GD&ĐT QUẬN NAM TỪ LIÊM'}
            </p>
            <p className="uppercase font-black text-xs sm:text-sm underline underline-offset-4">
              {schoolInfo.name || 'TRƯỜNG TIỂU HỌC ĐẠI MỖ'}
            </p>
          </div>
          <div>
            <p className="uppercase font-black text-xs sm:text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold text-xs underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 pt-2">
          <h1 className="text-base sm:text-xl font-black uppercase tracking-wide">
            BIÊN BẢN HỘI NGHỊ CHA MẸ HỌC SINH
          </h1>
          <p className="text-xs sm:text-sm font-bold uppercase text-blue-900 print:text-black">
            LỚP {classInfo.name} — NĂM HỌC {schoolInfo.schoolYear || '2026 - 2027'}
          </p>
          <p className="text-xs italic text-slate-600">
            (Cuộc họp{' '}
            {meeting.meetingType === 'DAU_NAM'
              ? 'Đầu năm học'
              : meeting.meetingType === 'SO_KET_HK1'
              ? 'Sơ kết Học kỳ 1'
              : 'Tổng kết Cuối năm'}
            )
          </p>
        </div>

        {/* Meeting Information */}
        <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0">
          <p>
            <strong>1. Thời gian:</strong> Hồi 08 giờ 00 phút, ngày {meeting.meetingDate || '...'}
          </p>
          <p>
            <strong>2. Địa điểm:</strong> {meeting.location || `Phòng học lớp ${classInfo.name}`}.
          </p>
          <p>
            <strong>3. Chủ tọa:</strong> {meeting.presidedBy || classInfo.teacherName || 'Giáo viên chủ nhiệm'}.
          </p>
          <p>
            <strong>4. Thư ký cuộc họp:</strong> {meeting.secretary || 'Ban Thư ký Lớp'}.
          </p>
          <p>
            <strong>5. Thành phần tham dự:</strong> Có mặt {meeting.attendeesCount}/{meeting.totalParents} phụ
            huynh học sinh (Đạt tỷ lệ <strong>{attendanceRate}%</strong>). Vắng mặt: {Math.max(0, (meeting.totalParents || 0) - (meeting.attendeesCount || 0))} phụ huynh.
          </p>
        </div>

        {/* Meeting Content Sections */}
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1 mb-2">
              I. NỘI DUNG VÀ BÁO CÁO CỦA GIÁO VIÊN CHỦ NHIỆM
            </h3>
            <div className="space-y-1.5 pl-2">
              {(meeting.mainReports || []).map((report, idx) => (
                <p key={idx}>
                  {idx + 1}. {report}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1 mb-2">
              II. Ý KIẾN THẢO LUẬN, ĐÓNG GÓP CỦA PHỤ HUYNH
            </h3>
            <p className="pl-2 leading-relaxed">
              {meeting.discussionNotes ||
                '100% phụ huynh học sinh có mặt nhất trí cao với các nội dung báo cáo, kế hoạch hoạt động của nhà trường và giáo viên chủ nhiệm. Không có ý kiến trái chiều.'}
            </p>
          </div>

          <div>
            <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1 mb-2">
              III. KẾT QUẢ BẦU BAN ĐẠI DIỆN CHA MẸ HỌC SINH LỚP
            </h3>
            <div className="pl-2 space-y-1">
              {(meeting.committeeMembers || []).map((m, idx) => (
                <p key={idx}>
                  -{' '}
                  <strong>
                    {m.role === 'TRUONG_BAN'
                      ? 'Trưởng Ban:'
                      : m.role === 'PHO_BAN'
                      ? 'Phó Ban:'
                      : 'Ủy Viên:'}
                  </strong>{' '}
                  Ông/Bà <strong>{m.fullName}</strong> (Phụ huynh em {m.studentName || '...'}) — Điện thoại:{' '}
                  {m.phone || '...'}.
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1 mb-2">
              IV. NGHỊ QUYẾT HỘI NGHỊ
            </h3>
            <div className="pl-2 space-y-1">
              {(meeting.agreedResolutions || []).map((res, idx) => (
                <p key={idx}>- {res}</p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase text-xs sm:text-sm border-b border-black pb-1 mb-2">
              V. KẾT QUẢ BIỂU QUYẾT
            </h3>
            <div className="pl-2 space-y-1">
              <p>
                - Tán thành thông qua toàn văn nghị quyết:{' '}
                <strong>
                  {meeting.attendeesCount}/{meeting.attendeesCount}
                </strong>{' '}
                phụ huynh có mặt (Đạt <strong>100%</strong>).
              </p>
              <p>- Không tán thành: 0 phụ huynh.</p>
              <p>- Ý kiến khác: 0 phụ huynh.</p>
            </div>
          </div>
        </div>

        {/* Conclusion Time */}
        <p className="italic pt-2">
          Biên bản được lập xong vào hồi 10 giờ 30 phút cùng ngày, đã được đọc lại cho toàn thể hội nghị cùng
          nghe và nhất trí 100% thông qua. Biên bản được lập thành 02 bản có giá trị như nhau (01 bản lưu hồ
          sơ lớp, 01 bản nộp Ban giám hiệu nhà trường).
        </p>

        {/* 3 Signature Columns */}
        <div className="grid grid-cols-3 text-center text-xs sm:text-sm pt-8 gap-4">
          <div className="space-y-16">
            <div>
              <p className="font-bold uppercase text-[11px] sm:text-xs">THƯ KÝ CUỘC HỌP</p>
              <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
            </div>
            <p className="font-bold">{meeting.secretary || 'Ban Thư ký Lớp'}</p>
          </div>

          <div className="space-y-16">
            <div>
              <p className="font-bold uppercase text-[11px] sm:text-xs">TRƯỞNG BAN ĐD CMHS</p>
              <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
            </div>
            <p className="font-bold">{truongBan?.fullName || 'Trưởng Ban ĐD CMHS'}</p>
          </div>

          <div className="space-y-16">
            <div>
              <p className="font-bold uppercase text-[11px] sm:text-xs">GIÁO VIÊN CHỦ NHIỆM</p>
              <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
            </div>
            <p className="font-bold">{classInfo.teacherName || 'Giáo viên chủ nhiệm'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
