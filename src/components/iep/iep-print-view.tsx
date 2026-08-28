'use client';

import React from 'react';
import { IEPPlan, SchoolInfo } from '@/types';
import { Printer, ArrowLeft } from 'lucide-react';

interface IEPPrintViewProps {
  plan: IEPPlan;
  schoolInfo: SchoolInfo;
  className?: string;
  teacherName?: string;
  onBack?: () => void;
}

export function IEPPrintView({
  plan,
  schoolInfo,
  className = '4A1',
  teacherName = 'Nguyễn Thị Hương',
  onBack,
}: IEPPrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-screen text-black p-4 sm:p-8 font-serif">
      {/* Action Bar */}
      <div className="no-print mb-6 max-w-4xl mx-auto flex items-center justify-between bg-slate-100 p-4 rounded-2xl border border-slate-300 font-sans">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Quản Lý IEP</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>IN BIỂU MẪU KẾ HOẠCH A4 (Ctrl + P)</span>
        </button>
      </div>

      {/* A4 Printable Document */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 p-8 sm:p-12 shadow-lg print:border-none print:shadow-none print:p-0 space-y-6">
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
            KẾ HOẠCH GIÁO DỤC CÁ NHÂN HÓA (IEP)
          </h1>
          <p className="text-xs sm:text-sm italic">
            (Kế hoạch {plan.category === 'CAN_HO_TRO' ? 'Phụ đạo & Kèm cặp học sinh chưa hoàn thành' : 'Bồi dưỡng học sinh năng khiếu'} — Năm học {schoolInfo.schoolYear || '2025 - 2026'})
          </p>
          <p className="text-xs font-semibold">Theo quy định tại Thông tư 27/2020/TT-BGDĐT</p>
        </div>

        <div className="space-y-3 pt-2 text-xs sm:text-sm leading-relaxed">
          <h3 className="font-bold uppercase text-sm border-b border-black pb-1">
            I. THÔNG TIN HỌC SINH & THỰC TRẠNG BAN ĐẦU
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <p><strong>Họ và tên:</strong> {plan.studentName}</p>
            <p><strong>Lớp:</strong> {className}</p>
            <p><strong>Đối tượng:</strong> {plan.category === 'CAN_HO_TRO' ? '🔴 Cần hỗ trợ' : '🟢 Năng khiếu'}</p>
            <p><strong>Thời gian can thiệp:</strong> Từ {plan.startDate} đến {plan.reviewDate}</p>
            <p><strong>Môn học trọng tâm:</strong> {plan.subjectCodes.join(', ')}</p>
            <p><strong>Trạng thái:</strong> {plan.status === 'COMPLETED' ? 'Đã đạt mục tiêu' : 'Đang thực hiện'}</p>
          </div>

          <div className="pt-2">
            <p><strong>Các khó khăn / Năng khiếu cụ thể:</strong></p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              {plan.difficultyAreas && plan.difficultyAreas.length > 0 ? (
                plan.difficultyAreas.map((d, i) => <li key={i}>{d}</li>)
              ) : (
                <li>Phát triển tư duy nâng cao và bồi dưỡng năng khiếu chuyên sâu.</li>
              )}
            </ul>
          </div>

          {plan.strengths && (
            <p><strong>Thế mạnh, sở thích của học sinh:</strong> {plan.strengths}</p>
          )}
        </div>

        <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
          <h3 className="font-bold uppercase text-sm border-b border-black pb-1">
            II. MỤC TIÊU CẦN ĐẠT (SAU 01 THÁNG)
          </h3>
          <p className="pl-2 border-l-2 border-black italic bg-slate-50 p-2 print:bg-transparent">
            {plan.shortTermGoal}
          </p>
        </div>

        <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
          <h3 className="font-bold uppercase text-sm border-b border-black pb-1">
            III. BIỆN PHÁP SƯ PHẠM VÀ KẾ HOẠCH CAN THIỆP TRÊN LỚP
          </h3>
          <div className="whitespace-pre-line pl-2">
            {plan.interventionStrategies}
          </div>
          {plan.buddyStudentName && (
            <p className="pt-1">
              <strong>Học sinh đồng hành (Đôi bạn cùng tiến):</strong> Em {plan.buddyStudentName} (Ngồi cạnh hỗ trợ trong các giờ học).
            </p>
          )}
        </div>

        <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
          <h3 className="font-bold uppercase text-sm border-b border-black pb-1">
            IV. KẾ HOẠCH PHỐI HỢP VỚI GIA ĐÌNH & PHỤ HUYNH
          </h3>
          <p className="pl-2">
            {plan.parentAction || 'Gia đình cùng con đọc sách 15 phút mỗi tối và theo dõi sát sao việc hoàn thành nhiệm vụ học tập.'}
          </p>
        </div>

        <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
          <h3 className="font-bold uppercase text-sm border-b border-black pb-1">
            V. ĐÁNH GIÁ KẾT QUẢ TIẾN BỘ SAU THỜI GIAN CAN THIỆP
          </h3>
          <p className="pl-2 italic">
            {plan.evaluationNotes || 'Em đã có chuyển biến tích cực, tự tin hơn trong các giờ học và giảm đáng kể lỗi sai cơ bản.'}
          </p>
        </div>

        <div className="grid grid-cols-3 text-center text-xs sm:text-sm pt-8 gap-4">
          <div className="space-y-16">
            <p className="font-bold uppercase">HIỆU TRƯỞNG</p>
            <p className="italic font-normal">(Ký và đóng dấu)</p>
          </div>
          <div className="space-y-16">
            <p className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN</p>
            <p className="font-bold">...</p>
          </div>
          <div className="space-y-16">
            <div>
              <p className="italic">Hà Nội, ngày ... tháng ... năm 2026</p>
              <p className="font-bold uppercase mt-1">GIÁO VIÊN CHỦ NHIỆM</p>
            </div>
            <p className="font-bold">{teacherName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
