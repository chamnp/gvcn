'use client';

import React, { useState } from 'react';
import {
  Users,
  Tv,
  Printer,
  Sparkles,
  Plus,
  Calendar,
  CheckCircle2,
  Phone,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ParentMeetingDoc } from '@/types';
import { MeetingPresentationModal } from '@/components/meetings/meeting-presentation-modal';
import { MeetingMinutesPrintView } from '@/components/meetings/meeting-minutes-print-view';

export default function ParentMeetingsPage() {
  const { parentMeetings, classInfo, schoolInfo, students } = useAppStore();

  const [activeMeeting, setActiveMeeting] = useState<ParentMeetingDoc>(parentMeetings[0] || null);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (isPrinting && activeMeeting) {
    return (
      <MeetingMinutesPrintView
        meeting={activeMeeting}
        schoolInfo={schoolInfo}
        classInfo={classInfo}
        onBack={() => setIsPrinting(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <span>📊 Nghiệp Vụ Chủ Nhiệm</span>
            <span className="bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
              3 Kỳ Họp CMHS
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Trợ Lý Họp Phụ Huynh & Slide Chiếu TV
          </h1>

          <p className="text-xs sm:text-sm text-blue-100 font-medium">
            Tự động tạo Slide trình chiếu chuyên nghiệp lên TV/Máy chiếu và xuất Biên bản họp CMHS chuẩn A4 nộp Ban Giám Hiệu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsPresentationOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs shadow-lg transition-all transform active:scale-95 cursor-pointer"
          >
            <Tv className="w-4 h-4" />
            <span>CHIẾU SLIDE TV TRỰC TIẾP 📺</span>
          </button>
        </div>
      </div>

      {activeMeeting && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    {activeMeeting.meetingType === 'DAU_NAM' ? 'Hội Nghị Đầu Năm' : 'Sơ Kết Học Kỳ'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {activeMeeting.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrinting(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Biên Bản A4</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold text-[10px]">NGÀY HỌP</p>
                  <p className="font-black text-slate-800 mt-0.5">{activeMeeting.meetingDate}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold text-[10px]">ĐỊA ĐIỂM</p>
                  <p className="font-black text-slate-800 mt-0.5">{activeMeeting.location}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold text-[10px]">THAM DỰ</p>
                  <p className="font-black text-blue-600 mt-0.5">{activeMeeting.attendeesCount}/{activeMeeting.totalParents} PH</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold text-[10px]">THƯ KÝ</p>
                  <p className="font-black text-slate-800 truncate mt-0.5">{activeMeeting.secretary.split('(')[0]}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <h4 className="font-black text-slate-900">Báo cáo & Nội dung trọng tâm:</h4>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                  {activeMeeting.mainReports.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>👥 Ban Đại Diện CMHS Lớp:</span>
              </h3>

              <div className="space-y-3">
                {activeMeeting.committeeMembers.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900">{m.fullName}</span>
                      <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                        {m.role === 'TRUONG_BAN' ? 'Trưởng Ban' : m.role === 'PHO_BAN' ? 'Phó Ban' : 'Ủy Viên'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Phụ huynh em: <strong>{m.studentName}</strong></p>
                    <p className="text-[11px] text-blue-600 font-mono font-bold">📞 {m.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMeeting && (
        <MeetingPresentationModal
          isOpen={isPresentationOpen}
          onClose={() => setIsPresentationOpen(false)}
          meeting={activeMeeting}
          classInfo={classInfo}
          schoolInfo={schoolInfo}
          students={students}
        />
      )}
    </div>
  );
}
