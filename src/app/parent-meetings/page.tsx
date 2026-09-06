'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Clock,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  MessageCircle,
  Copy,
  BookOpen,
  HelpCircle,
  MapPin,
  ExternalLink,
  Zap,
  RotateCcw,
  Search,
  Check,
  X,
  UserCheck,
  UserX,
  Layers,
  Award,
  Crown,
  ChevronRight,
  Share2,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react';
import { useAppStore, getDefaultPinForStudent } from '@/lib/store';
import {
  ParentMeetingDoc,
  MeetingAgendaTopic,
  IndividualStudentMeetingNote,
  Student,
  ParentMeetingType,
  ParentCommitteeMember,
  TermType,
} from '@/types';
import { DynamicPresentationModal } from '@/components/meetings/meeting-presentation-modal';
import { MeetingMinutesPrintView } from '@/components/meetings/meeting-minutes-print-view';
import { BatchHandoutsPrintView } from '@/components/meetings/batch-handouts-print-view';
import { TopicEditorModal } from '@/components/meetings/topic-editor-modal';
import { StudentNoteModal } from '@/components/meetings/student-note-modal';
import {
  SAMPLE_MEETING_FAQS,
  generateAISpeechScript,
  generateDefaultAgendaTopics,
  autoGenerateIndividualNotes,
  generateClassStatistics,
} from '@/lib/parent-meeting-engine';
import { getCurrentTermByDate, PRIMARY_SUBJECTS } from '@/lib/tt27-engine';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function ParentMeetingsPage() {
  const {
    parentMeetings,
    addParentMeetingDoc,
    updateParentMeetingDoc,
    classInfo,
    schoolInfo,
    students,
    getStudentStars,
    healthRecords,
    subjectAssessments,
    traitAssessments,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<
    'AGENDA' | 'STUDENTS' | 'ATTENDANCE_COMMITTEE' | 'SPEECH' | 'MINUTES'
  >('AGENDA');
  const [activeMeetingType, setActiveMeetingType] = useState<ParentMeetingType>('DAU_NAM');

  // Presentation & Print Views
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isPrintingMinutes, setIsPrintingMinutes] = useState(false);
  const [isPrintingHandouts, setIsPrintingHandouts] = useState(false);

  // Topic & Note Modals
  const [isTopicEditorOpen, setIsTopicEditorOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<MeetingAgendaTopic | null>(null);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [studentNoteModalOpen, setStudentNoteModalOpen] = useState(false);

  // Filters & Attendance State
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'ALL' | number>('ALL');
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, 'PRESENT' | 'EXCUSED' | 'UNEXCUSED'>
  >({});

  const numTeams = classInfo.numberOfTeams && classInfo.numberOfTeams >= 2 ? classInfo.numberOfTeams : 4;
  const currentTerm: TermType = getCurrentTermByDate();

  // Auto-collected class statistics from real store data
  const classStats = useMemo(() => {
    return generateClassStatistics(
      students,
      subjectAssessments,
      traitAssessments,
      healthRecords,
      getStudentStars,
      classInfo.grade,
      currentTerm
    );
  }, [
    students,
    subjectAssessments,
    traitAssessments,
    healthRecords,
    getStudentStars,
    classInfo.grade,
    currentTerm,
  ]);

  // Active meeting doc or auto-create first meeting
  const currentMeeting = useMemo(() => {
    const existing = parentMeetings.find((m) => m.meetingType === activeMeetingType);
    if (existing) return existing;
    return parentMeetings[0] || null;
  }, [parentMeetings, activeMeetingType]);

  // Helper to determine student's team
  const getStudentTeam = (st: Student, idx: number): number => {
    const tagTeam = (st.tags || []).find((t) => t.includes('Tổ '));
    if (tagTeam) {
      const match = tagTeam.match(/Tổ\s*(\d)/i);
      if (match && match[1]) return Number(match[1]);
    }
    return (idx % numTeams) + 1;
  };

  // 1-Click Auto Setup / Reset Meeting Plan with Actual Class Data
  const handleAutoGenerateMeeting = (type: ParentMeetingType) => {
    const defaultTopics = generateDefaultAgendaTopics(type, classInfo, students.length);
    const speech = generateAISpeechScript(type, classInfo, schoolInfo, students.length, classStats);
    const autoNotes = autoGenerateIndividualNotes(
      students,
      getStudentStars,
      healthRecords,
      subjectAssessments,
      traitAssessments,
      currentTerm
    );

    const typeTitle =
      type === 'DAU_NAM'
        ? `Hội Nghị Cha Mẹ Học Sinh Đầu Năm Học ${schoolInfo.schoolYear || '2026-2027'}`
        : type === 'SO_KET_HK1'
        ? `Hội Nghị Sơ Kết Học Kỳ 1 Năm Học ${schoolInfo.schoolYear || '2026-2027'}`
        : `Hội Nghị Tổng Kết Năm Học ${schoolInfo.schoolYear || '2026-2027'}`;

    const mainReports =
      type === 'DAU_NAM'
        ? [
            `Báo cáo đặc điểm tình hình lớp ${classInfo.name}: Sĩ số ${students.length} học sinh (${students.filter((s) => s.gender === 'Nam').length} Nam, ${students.filter((s) => s.gender === 'Nữ').length} Nữ, ${students.filter((s) => s.isBoarding).length} bán trú).`,
            'Triển khai kế hoạch dạy học 2 buổi/ngày, Thời khóa biểu và quy định sách vở, đồ dùng học tập.',
            'Thông qua nội quy lớp học, quy chế bán trú và chế độ chăm sóc dinh dưỡng, y tế học đường.',
            'Bầu Ban Đại Diện Cha Mẹ Học Sinh lớp nhiệm kỳ năm học mới.',
          ]
        : type === 'SO_KET_HK1'
        ? [
            'Báo cáo kết quả rèn luyện và học tập Học kỳ 1 theo Thông tư 27/2020/TT-BGDĐT.',
            'Tuyên dương các học sinh có thành tích xuất sắc, tiến bộ vượt bậc và nhiều sao thi đua.',
            'Phương hướng, nhiệm vụ trọng tâm và các chỉ tiêu thi đua rèn luyện trong Học kỳ 2.',
            'Phát phiếu đánh giá cá nhân và lắng nghe ý kiến thảo luận, đóng góp của phụ huynh.',
          ]
        : [
            'Báo cáo tổng kết toàn diện thành tích học tập và rèn luyện năm học của lớp.',
            'Công bố danh hiệu Khen thưởng Học sinh Xuất sắc và Học sinh Tiêu biểu theo Điều 13 TT27.',
            'Kế hoạch bàn giao học sinh về sinh hoạt hè an toàn tại địa phương.',
            'Tri ân Ban Đại Diện CMHS và quyết toán công khai quỹ hoạt động lớp.',
          ];

    const defaultCommittee: ParentCommitteeMember[] = [
      {
        role: 'TRUONG_BAN',
        fullName: students[0]?.parentName || 'Nguyễn Văn Hùng',
        phone: students[0]?.parentPhone || '0988123456',
        studentName: students[0]?.fullName || 'Học sinh lớp',
      },
      {
        role: 'PHO_BAN',
        fullName: students[1]?.parentName || 'Trần Thị Lan',
        phone: students[1]?.parentPhone || '0977234567',
        studentName: students[1]?.fullName || 'Học sinh lớp',
      },
      {
        role: 'UY_VIEN',
        fullName: students[2]?.parentName || 'Lê Hoàng Nam',
        phone: students[2]?.parentPhone || '0912345678',
        studentName: students[2]?.fullName || 'Học sinh lớp',
      },
    ];

    const newOrUpdatedDoc: ParentMeetingDoc = {
      id: currentMeeting?.id || `meet-${Date.now()}`,
      classId: classInfo.id,
      meetingType: type,
      title: typeTitle,
      meetingDate: new Date().toISOString().split('T')[0],
      location: `Phòng học lớp ${classInfo.name}`,
      presidedBy: classInfo.teacherName || 'Giáo viên chủ nhiệm',
      secretary: 'Ban Thư ký Lớp',
      attendeesCount: students.length,
      totalParents: students.length,
      committeeMembers: currentMeeting?.committeeMembers?.length
        ? currentMeeting.committeeMembers
        : defaultCommittee,
      agendaTopics: defaultTopics,
      individualNotes: autoNotes,
      aiSpeechScript: speech,
      faqList: SAMPLE_MEETING_FAQS,
      mainReports: mainReports,
      discussionNotes:
        '100% phụ huynh nhất trí cao với kế hoạch hoạt động của lớp, thống nhất phương hướng giáo dục và không có ý kiến phản đối.',
      agreedResolutions: [
        'Nhất trí 100% với báo cáo và kế hoạch phối hợp giáo dục của Giáo viên chủ nhiệm.',
        'Nhất trí danh sách Ban Đại Diện Cha Mẹ Học Sinh lớp.',
        'Gia đình cam kết đồng hành, cùng con đọc sách và kiểm tra sách vở mỗi tối.',
      ],
      createdAt: new Date().toISOString(),
    };

    if (currentMeeting?.id) {
      updateParentMeetingDoc(newOrUpdatedDoc);
    } else {
      addParentMeetingDoc(newOrUpdatedDoc);
    }

    setActiveMeetingType(type);
    confetti({ particleCount: 100, spread: 70 });
    toast.success(`Đã tự động tạo trọn gói Kế hoạch, Slide TV và Phiếu trao đổi cho ${typeTitle}! 🎉`);
  };

  // Handlers for Topics
  const handleSaveTopic = (topic: MeetingAgendaTopic) => {
    if (!currentMeeting) return;
    const existingIndex = (currentMeeting.agendaTopics || []).findIndex((t) => t.id === topic.id);
    let updatedTopics: MeetingAgendaTopic[];

    if (existingIndex >= 0) {
      updatedTopics = currentMeeting.agendaTopics.map((t) => (t.id === topic.id ? topic : t));
    } else {
      updatedTopics = [...(currentMeeting.agendaTopics || []), topic];
    }

    const updatedDoc: ParentMeetingDoc = {
      ...currentMeeting,
      agendaTopics: updatedTopics,
    };
    updateParentMeetingDoc(updatedDoc);
  };

  const handleToggleTopic = (topicId: string) => {
    if (!currentMeeting) return;
    const updatedTopics = (currentMeeting.agendaTopics || []).map((t) =>
      t.id === topicId ? { ...t, isEnabled: !t.isEnabled } : t
    );
    updateParentMeetingDoc({ ...currentMeeting, agendaTopics: updatedTopics });
  };

  const handleDeleteTopic = (topicId: string) => {
    if (!currentMeeting) return;
    const updatedTopics = (currentMeeting.agendaTopics || []).filter((t) => t.id !== topicId);
    updateParentMeetingDoc({ ...currentMeeting, agendaTopics: updatedTopics });
    toast.success('Đã xóa phần nội dung!');
  };

  const handleMoveTopic = (index: number, direction: 'UP' | 'DOWN') => {
    if (!currentMeeting) return;
    const topics = [...(currentMeeting.agendaTopics || [])];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    const temp = topics[index];
    topics[index] = topics[targetIndex];
    topics[targetIndex] = temp;

    updateParentMeetingDoc({ ...currentMeeting, agendaTopics: topics });
  };

  const handleSaveStudentNote = (note: IndividualStudentMeetingNote) => {
    if (!currentMeeting) return;
    const existing = (currentMeeting.individualNotes || []).filter((n) => n.studentId !== note.studentId);
    const updatedNotes = [...existing, note];

    updateParentMeetingDoc({ ...currentMeeting, individualNotes: updatedNotes });
    toast.success(`Đã lưu ghi chú trao đổi riêng em ${note.studentName}!`);
  };

  // Attendance Toggle Handler
  const handleToggleAttendance = (studentId: string, status: 'PRESENT' | 'EXCUSED' | 'UNEXCUSED') => {
    const updated = { ...attendanceMap, [studentId]: status };
    setAttendanceMap(updated);
    const presentCount = students.filter((s) => (updated[s.id] || 'PRESENT') === 'PRESENT').length;
    if (currentMeeting) {
      updateParentMeetingDoc({ ...currentMeeting, attendeesCount: presentCount });
    }
  };

  const handleSetAllAttendance = (status: 'PRESENT' | 'EXCUSED' | 'UNEXCUSED') => {
    const updated: Record<string, 'PRESENT' | 'EXCUSED' | 'UNEXCUSED'> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
    const presentCount = status === 'PRESENT' ? students.length : 0;
    if (currentMeeting) {
      updateParentMeetingDoc({ ...currentMeeting, attendeesCount: presentCount });
    }
    toast.success(
      status === 'PRESENT' ? 'Đã đánh dấu 100% phụ huynh có mặt!' : 'Đã cập nhật danh sách điểm danh!'
    );
  };

  // 1-Click Send Zalo to Parent
  const handleSendZaloSingle = (student: Student) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.gvcn.pro.vn';
    const token = student.shareToken || student.id;
    const studentUrl = `${origin}/student/${token}`;
    const defPin = getDefaultPinForStudent(student);
    const note = (currentMeeting?.individualNotes || []).find((n) => n.studentId === student.id);

    const message =
      `Kính gửi Quý Phụ huynh em ${student.fullName} (Lớp ${classInfo.name}),\n` +
      `Cô giáo gửi gia đình thông tin rèn luyện và lời nhận xét trong buổi Họp Phụ Huynh:\n` +
      `📖 Học tập: ${note?.academicSummary || 'Nắm vững kiến thức bài học'}\n` +
      `⭐ Nề nếp: ${note?.behaviorSummary || 'Ngoan ngoãn, lễ phép'}\n` +
      `💡 Dặn dò: ${note?.actionItemForParents || 'Gia đình cùng con đọc sách mỗi tối'}\n\n` +
      `🔗 Tra cứu chi tiết hồ sơ học sinh trực tuyến: ${studentUrl}\n` +
      `🔑 Mật khẩu mặc định: ${defPin} (Ngày sinh con dạng ddmmyyyy)\n\n` +
      `Trân trọng cảm ơn bố mẹ! ❤️`;

    navigator.clipboard.writeText(message);

    if (student.parentPhone) {
      const cleanPhone = student.parentPhone.replace(/\D/g, '');
      window.open(`https://zalo.me/${cleanPhone}`, '_blank');
      toast.success(`Đã sao chép lời nhắn và mở Zalo phụ huynh ${student.fullName}!`);
    } else {
      toast.success(`Đã sao chép tin nhắn gửi phụ huynh em ${student.fullName}!`);
    }
  };

  // Filtered Students for Tab 2
  const filteredStudents = useMemo(() => {
    return students
      .map((st, idx) => ({ ...st, teamId: getStudentTeam(st, idx) }))
      .filter((s) => {
        const matchesSearch =
          s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
          s.studentCode.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
          (s.parentPhone && s.parentPhone.includes(studentSearchTerm));

        const matchesTeam = selectedTeamFilter === 'ALL' || s.teamId === selectedTeamFilter;

        return matchesSearch && matchesTeam;
      });
  }, [students, studentSearchTerm, selectedTeamFilter, numTeams]);

  // Filtered Students for Attendance
  const filteredAttendanceStudents = useMemo(() => {
    return students
      .map((st, idx) => ({ ...st, teamId: getStudentTeam(st, idx) }))
      .filter((s) => {
        return (
          s.fullName.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
          s.studentCode.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
          (s.parentName && s.parentName.toLowerCase().includes(attendanceSearchTerm.toLowerCase())) ||
          (s.parentPhone && s.parentPhone.includes(attendanceSearchTerm))
        );
      });
  }, [students, attendanceSearchTerm, numTeams]);

  // Attendance stats
  const presentCount = students.filter((s) => (attendanceMap[s.id] || 'PRESENT') === 'PRESENT').length;
  const excusedCount = students.filter((s) => attendanceMap[s.id] === 'EXCUSED').length;
  const unexcusedCount = students.filter((s) => attendanceMap[s.id] === 'UNEXCUSED').length;

  // Total Estimated Time
  const totalEstimatedTime = (currentMeeting?.agendaTopics || [])
    .filter((t) => t.isEnabled)
    .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  // Full Screen Printable Modes
  if (isPrintingMinutes && currentMeeting) {
    return (
      <MeetingMinutesPrintView
        meeting={currentMeeting}
        schoolInfo={schoolInfo}
        classInfo={classInfo}
        onBack={() => setIsPrintingMinutes(false)}
      />
    );
  }

  if (isPrintingHandouts && currentMeeting) {
    return (
      <BatchHandoutsPrintView
        meeting={currentMeeting}
        schoolInfo={schoolInfo}
        classInfo={classInfo}
        students={students}
        onBack={() => setIsPrintingHandouts(false)}
      />
    );
  }

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-300">
      {/* 1. TOP HEADER — Real Class Stats + Action Buttons */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/15">
              <span>🏫 Họp Phụ Huynh Lớp {classInfo.name}</span>
              <span className="bg-blue-500 text-white px-2 py-0.2 rounded-full text-[10px] font-black">
                Thông tư 27
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight">
              {currentMeeting?.title || `Hội Nghị Cha Mẹ Học Sinh Lớp ${classInfo.name}`}
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              {schoolInfo.name || 'Trường Tiểu học'} • Năm học {schoolInfo.schoolYear || '2026-2027'} • GVCN:{' '}
              {classInfo.teacherName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPresentationOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Tv className="w-4 h-4" />
              <span>Chiếu Slide TV 📺</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintingHandouts(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu Handout A4/A5</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintingMinutes(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>In Biên Bản A4</span>
            </button>
          </div>
        </div>

        {/* Auto-collected Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-white/10">
          {[
            {
              label: 'Sĩ số',
              value: `${classStats.totalStudents}`,
              sub: `${classStats.totalMale} Nam • ${classStats.totalFemale} Nữ`,
              color: 'bg-blue-500/15 text-blue-300 border border-blue-500/20',
            },
            {
              label: 'Bán trú',
              value: `${classStats.totalBoarding}`,
              sub: `${Math.round((classStats.totalBoarding / (classStats.totalStudents || 1)) * 100)}% sĩ số`,
              color: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
            },
            {
              label: 'Sao TB',
              value: `${classStats.avgStars}`,
              sub: '⭐/học sinh',
              color: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20',
            },
            {
              label: 'Cận thị',
              value: `${classStats.nearsightedCount}`,
              sub: 'ưu tiên 2 hàng đầu',
              color: 'bg-rose-500/15 text-rose-300 border border-rose-500/20',
            },
            {
              label: 'Đánh giá T',
              value: `${
                classStats.subjectStats.filter((s) => s.totalAssessed > 0).length > 0
                  ? Math.round(
                      (classStats.subjectStats.reduce((a, s) => a + s.countT, 0) /
                        Math.max(classStats.subjectStats.reduce((a, s) => a + s.totalAssessed, 0), 1)) *
                        100
                    )
                  : '—'
              }%`,
              sub: 'Hoàn thành tốt TT27',
              color: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
            },
            {
              label: 'Tham dự',
              value: `${presentCount}/${students.length}`,
              sub: `${Math.round((presentCount / (students.length || 1)) * 100)}% có mặt`,
              color: 'bg-purple-500/15 text-purple-300 border border-purple-500/20',
            },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-2xl px-3 py-2 text-center`}>
              <p className="text-[10px] font-bold opacity-75 uppercase tracking-wider">{stat.label}</p>
              <p className="text-sm sm:text-base font-black">{stat.value}</p>
              <p className="text-[10px] opacity-70 truncate">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 1-CLICK MEETING TYPE SWITCHER & GENERATOR BAR */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Chọn kỳ họp:</span>
          </span>

          {[
            {
              id: 'DAU_NAM' as ParentMeetingType,
              label: '🥇 1. Đầu Năm Học',
              desc: 'Bầu BĐD, Nội quy & TKB',
            },
            {
              id: 'SO_KET_HK1' as ParentMeetingType,
              label: '🥈 2. Sơ Kết Học Kỳ 1',
              desc: 'Báo cáo TT27 & Tuyên dương',
            },
            {
              id: 'TONG_KET_CUOI_NAM' as ParentMeetingType,
              label: '🥉 3. Tổng Kết Cuối Năm',
              desc: 'Thành tích cả năm & Bàn giao hè',
            },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setActiveMeetingType(type.id);
                if (!parentMeetings.find((m) => m.meetingType === type.id)) {
                  handleAutoGenerateMeeting(type.id);
                }
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left flex flex-col ${
                activeMeetingType === type.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{type.label}</span>
              <span
                className={`text-[10px] font-normal ${
                  activeMeetingType === type.id ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                {type.desc}
              </span>
            </button>
          ))}
        </div>

        {/* 1-Click Refresh / Auto-generate Button */}
        <button
          type="button"
          onClick={() => handleAutoGenerateMeeting(activeMeetingType)}
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          <span>Tự Động Sinh Nội Dung Từ Dữ Liệu Lớp</span>
        </button>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'AGENDA', label: `📌 Kế Hoạch & Slide TV (${currentMeeting?.agendaTopics?.length || 0})` },
          { id: 'STUDENTS', label: `🎯 Sổ Trao Đổi 1-1 & Handouts (${students.length})` },
          {
            id: 'ATTENDANCE_COMMITTEE',
            label: `👥 Điểm Danh (${presentCount}/${students.length}) & Ban Đại Diện`,
          },
          { id: 'SPEECH', label: '🎙️ Kịch Bản Phát Biểu & FAQ' },
          { id: 'MINUTES', label: '📄 Biên Bản Cuộc Họp Chuẩn' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: AGENDA & SLIDES PRESENTATION MANAGER */}
      {activeTab === 'AGENDA' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Thời lượng dự kiến: <span className="text-blue-600 font-black">{totalEstimatedTime} phút</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Gồm {(currentMeeting?.agendaTopics || []).filter((t) => t.isEnabled).length} phần nội dung sẽ
                  được trình chiếu lên màn hình TV lớp học.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingTopic(null);
                  setIsTopicEditorOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Phần Nội Dung</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(currentMeeting?.agendaTopics || []).map((topic, idx) => (
              <div
                key={topic.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  topic.isEnabled
                    ? 'bg-white border-slate-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    <span className="text-2xl sm:text-3xl shrink-0 mt-0.5">{topic.iconEmoji}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-black text-sm sm:text-base text-slate-900 truncate">
                          {topic.title}
                        </h4>
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">
                          {topic.durationMinutes} phút
                        </span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Layout: {topic.layout}
                        </span>
                      </div>

                      {topic.importantNote && (
                        <p className="text-[11px] text-amber-700 font-semibold mt-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                          💡 Gợi ý cho cô giáo: {topic.importantNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveTopic(idx, 'UP')}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Chuyển lên trên"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (currentMeeting?.agendaTopics?.length || 0) - 1}
                      onClick={() => handleMoveTopic(idx, 'DOWN')}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      title="Chuyển xuống dưới"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleTopic(topic.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        topic.isEnabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'
                      }`}
                      title={topic.isEnabled ? 'Đang bật chiếu slide' : 'Đã ẩn khỏi slide'}
                    >
                      {topic.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTopic(topic);
                        setIsTopicEditorOpen(true);
                      }}
                      className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Chỉnh sửa nội dung"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa phần này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {topic.talkingPoints.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-1.5 text-slate-600">
                      <span className="text-blue-500 font-bold shrink-0">•</span>
                      <span className="leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SỔ TAY TRAO ĐỔI 1-1 VỚI TỪNG PHỤ HUYNH */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Sổ Chuẩn Bị Trao Đổi Riêng 1-1 Với Từng Phụ Huynh ({students.length} Em)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhận xét cá nhân hóa tích hợp chuẩn Thông tư 27, nề nếp, điểm cần phụ huynh đồng hành và 1-Click gửi Zalo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPrintingHandouts(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Toàn Bộ Phiếu Handouts ({students.length})</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Team Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedTeamFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  selectedTeamFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🌟 Tất Cả ({students.length})
              </button>

              {Array.from({ length: numTeams }).map((_, i) => {
                const teamId = i + 1;
                return (
                  <button
                    key={teamId}
                    onClick={() => setSelectedTeamFilter(teamId)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                      selectedTeamFilter === teamId
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tổ {teamId}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên học sinh, SĐT phụ huynh..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((st) => {
              const note = (currentMeeting?.individualNotes || []).find((n) => n.studentId === st.id);
              const stars = getStudentStars(st.id);
              const isNearsighted =
                healthRecords.find((h) => h.studentId === st.id)?.hasVisionDefect ||
                (st.healthNotes || '').toLowerCase().includes('cận');

              // Mini TT27 subject badges (Toán, Tiếng Việt, Ngoại ngữ)
              const mathAss = subjectAssessments.find(
                (a) => a.studentId === st.id && a.subjectCode === 'TOAN' && a.term === currentTerm
              );
              const tvAss = subjectAssessments.find(
                (a) => a.studentId === st.id && a.subjectCode === 'TIENG_VIET' && a.term === currentTerm
              );
              const engAss = subjectAssessments.find(
                (a) => a.studentId === st.id && a.subjectCode === 'NGOAI_NGU' && a.term === currentTerm
              );

              return (
                <div
                  key={st.id}
                  className={`p-5 rounded-3xl border transition-all space-y-3 ${
                    note?.isPriorityDiscussion
                      ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                        {st.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-sm text-slate-900">{st.fullName}</h4>
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                            Tổ {st.teamId}
                          </span>
                          {note?.isPriorityDiscussion && (
                            <span className="text-[9px] font-bold bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              ⚠️ Cần trao đổi
                            </span>
                          )}
                          {isNearsighted && (
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              🤓 Cận thị
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">
                          Mã: {st.studentCode} • PH: {st.parentName || 'Chưa cập nhật'} ({st.parentPhone || 'Chưa có SĐT'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {stars > 0 && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                          ⭐{stars}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSendZaloSingle(st)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Gửi Zalo riêng tư cho phụ huynh"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentForNote(st);
                          setStudentNoteModalOpen(true);
                        }}
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Chỉnh sửa ghi chú"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* TT27 Mini Summary Badges */}
                  {(mathAss || tvAss || engAss) && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                      {tvAss && (
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                          TV: <strong className={tvAss.level === 'T' ? 'text-emerald-700' : 'text-slate-900'}>{tvAss.level}</strong>
                          {tvAss.score != null ? ` (${tvAss.score}đ)` : ''}
                        </span>
                      )}
                      {mathAss && (
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                          Toán: <strong className={mathAss.level === 'T' ? 'text-emerald-700' : 'text-slate-900'}>{mathAss.level}</strong>
                          {mathAss.score != null ? ` (${mathAss.score}đ)` : ''}
                        </span>
                      )}
                      {engAss && (
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-medium border border-slate-200">
                          NN: <strong className={engAss.level === 'T' ? 'text-emerald-700' : 'text-slate-900'}>{engAss.level}</strong>
                          {engAss.score != null ? ` (${engAss.score}đ)` : ''}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-700">
                      <strong>📖 Học tập:</strong> {note?.academicSummary || 'Nắm vững chuẩn kiến thức kỹ năng môn học.'}
                    </p>
                    <p className="text-slate-700">
                      <strong>⭐ Nề nếp:</strong> {note?.behaviorSummary || 'Lễ phép, chấp hành tốt nội quy lớp.'}
                    </p>
                    <p className="text-blue-900 font-medium bg-blue-50/70 p-2.5 rounded-2xl border border-blue-100 leading-relaxed">
                      <strong>💡 Dặn dò PH:</strong> {note?.actionItemForParents || 'Gia đình cùng con đọc sách mỗi tối.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & COMMITTEE MANAGER */}
      {activeTab === 'ATTENDANCE_COMMITTEE' && (
        <div className="space-y-6">
          {/* Committee Members Hub */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Ban Đại Diện Cha Mẹ Học Sinh Lớp {classInfo.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Được tự động đồng bộ vào Slide Trình Chiếu và Biên Bản Họp Chuẩn Bộ GD&ĐT
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(currentMeeting?.committeeMembers || []).map((m, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 uppercase">
                      {m.role === 'TRUONG_BAN' ? '👑 Trưởng Ban' : m.role === 'PHO_BAN' ? '⭐ Phó Ban' : 'Ủy Viên'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Họ và tên phụ huynh:</label>
                    <input
                      type="text"
                      value={m.fullName}
                      onChange={(e) => {
                        const updated = [...(currentMeeting?.committeeMembers || [])];
                        updated[idx] = { ...m, fullName: e.target.value };
                        updateParentMeetingDoc({ ...currentMeeting!, committeeMembers: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Số điện thoại liên hệ:</label>
                    <input
                      type="text"
                      value={m.phone || ''}
                      onChange={(e) => {
                        const updated = [...(currentMeeting?.committeeMembers || [])];
                        updated[idx] = { ...m, phone: e.target.value };
                        updateParentMeetingDoc({ ...currentMeeting!, committeeMembers: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Phụ huynh học sinh:</label>
                    <input
                      type="text"
                      value={m.studentName || ''}
                      onChange={(e) => {
                        const updated = [...(currentMeeting?.committeeMembers || [])];
                        updated[idx] = { ...m, studentName: e.target.value };
                        updateParentMeetingDoc({ ...currentMeeting!, committeeMembers: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Attendance Check List */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Điểm Danh Phụ Huynh Tham Dự Hội Nghị</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tỷ lệ tham dự: <strong className="text-blue-600">{presentCount}/{students.length} Phụ huynh</strong> ({Math.round((presentCount / (students.length || 1)) * 100)}%) • Vắng có phép: {excusedCount} • Vắng không phép: {unexcusedCount}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetAllAttendance('PRESENT')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer"
                >
                  Có Mặt Đủ 100%
                </button>
              </div>
            </div>

            {/* Attendance Search Bar */}
            <div className="relative max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên phụ huynh, học sinh..."
                value={attendanceSearchTerm}
                onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Attendance Student List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">STT</th>
                    <th className="py-2.5 px-3">Học sinh</th>
                    <th className="py-2.5 px-3">Phụ huynh / SĐT</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái tham dự</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendanceStudents.map((st, idx) => {
                    const status = attendanceMap[st.id] || 'PRESENT';
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900">{st.fullName}</strong>
                          <span className="text-[10px] text-slate-400 block font-mono">Tổ {st.teamId} • {st.studentCode}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-800 font-medium">{st.parentName || 'Chưa có họ tên'}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{st.parentPhone || 'Chưa có SĐT'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(st.id, 'PRESENT')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              ✓ Có mặt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(st.id, 'EXCUSED')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                status === 'EXCUSED'
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Vắng có phép
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(st.id, 'UNEXCUSED')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                status === 'UNEXCUSED'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Vắng không phép
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SPEECH SCRIPT & PEDAGOGICAL FAQ CO-PILOT */}
      {activeTab === 'SPEECH' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🎙️</span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      Bài Phát Biểu Khai Mạc & Điều Hành Của Cô Giáo Chủ Nhiệm
                    </h3>
                    <p className="text-xs text-slate-500">Giọng văn ấm áp, truyền cảm hứng, chuẩn mực sư phạm</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (currentMeeting?.aiSpeechScript) {
                      navigator.clipboard.writeText(currentMeeting.aiSpeechScript);
                      toast.success('Đã sao chép toàn văn bài phát biểu!');
                    }
                  }}
                  className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép</span>
                </button>
              </div>

              <textarea
                rows={14}
                value={currentMeeting?.aiSpeechScript || ''}
                onChange={(e) => {
                  updateParentMeetingDoc({ ...currentMeeting!, aiSpeechScript: e.target.value });
                }}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs leading-relaxed text-slate-800 font-serif focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Câu Hỏi & Tình Huống Sư Phạm Thường Gặp (FAQ):</span>
              </h3>

              <div className="space-y-3">
                {(currentMeeting?.faqList || SAMPLE_MEETING_FAQS).map((faq, fIdx) => (
                  <div key={fIdx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900">❓ {faq.question}</p>
                    <p className="text-slate-600 leading-relaxed text-[11px] bg-white p-2.5 rounded-xl border border-slate-100">
                      💡 {faq.suggestedAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OFFICIAL MINUTES INTERACTIVE PREVIEW & EDIT */}
      {activeTab === 'MINUTES' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900">
                Biên Bản Hội Nghị Cha Mẹ Học Sinh (Mẫu Chuẩn Bộ GD&ĐT)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉnh sửa trực tiếp các thông tin biên bản trước khi xuất in A4 chính thức
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPrintingMinutes(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>In Biên Bản A4 (Ctrl + P)</span>
            </button>
          </div>

          {/* Inline Editable Minutes Sheet */}
          <div className="space-y-4 text-xs font-serif text-slate-900 border border-slate-200 p-6 rounded-2xl bg-slate-50/50">
            <div className="grid grid-cols-2 text-center pb-3 border-b border-slate-300">
              <div>
                <p className="uppercase font-bold text-[10px]">
                  {schoolInfo.departmentName || 'PHÒNG GD&ĐT QUẬN NAM TỪ LIÊM'}
                </p>
                <p className="uppercase font-black text-xs underline underline-offset-4">
                  {schoolInfo.name || 'TRƯỜNG TIỂU HỌC ĐẠI MỖ'}
                </p>
              </div>
              <div>
                <p className="uppercase font-black text-xs">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[10px] underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
              </div>
            </div>

            <div className="text-center space-y-0.5 pt-2">
              <h4 className="text-sm font-black uppercase tracking-wide">
                BIÊN BẢN HỘI NGHỊ CHA MẸ HỌC SINH
              </h4>
              <p className="font-bold uppercase text-blue-900">
                LỚP {classInfo.name} — NĂM HỌC {schoolInfo.schoolYear || '2026 - 2027'}
              </p>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 font-sans mb-0.5">Thời gian họp:</label>
                <input
                  type="date"
                  value={currentMeeting?.meetingDate || ''}
                  onChange={(e) => updateParentMeetingDoc({ ...currentMeeting!, meetingDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 font-sans mb-0.5">Địa điểm:</label>
                <input
                  type="text"
                  value={currentMeeting?.location || ''}
                  onChange={(e) => updateParentMeetingDoc({ ...currentMeeting!, location: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 font-sans mb-0.5">Chủ tọa (GVCN):</label>
                <input
                  type="text"
                  value={currentMeeting?.presidedBy || ''}
                  onChange={(e) => updateParentMeetingDoc({ ...currentMeeting!, presidedBy: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 font-sans mb-0.5">Thư ký cuộc họp:</label>
                <input
                  type="text"
                  value={currentMeeting?.secretary || ''}
                  onChange={(e) => updateParentMeetingDoc({ ...currentMeeting!, secretary: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-sans"
                />
              </div>
            </div>

            {/* Section I: Main Reports */}
            <div className="space-y-1 pt-2">
              <h5 className="font-bold uppercase text-[11px] font-sans">I. Báo Cáo Của Giáo Viên Chủ Nhiệm</h5>
              <div className="space-y-1">
                {(currentMeeting?.mainReports || []).map((rep, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2">
                    <span className="font-sans text-slate-400 font-bold shrink-0">{rIdx + 1}.</span>
                    <input
                      type="text"
                      value={rep}
                      onChange={(e) => {
                        const updated = [...(currentMeeting?.mainReports || [])];
                        updated[rIdx] = e.target.value;
                        updateParentMeetingDoc({ ...currentMeeting!, mainReports: updated });
                      }}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-sans"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section II: Discussion Notes */}
            <div className="space-y-1 pt-2">
              <h5 className="font-bold uppercase text-[11px] font-sans">II. Ý Kiến Thảo Luận Của Phụ Huynh</h5>
              <textarea
                rows={3}
                value={currentMeeting?.discussionNotes || ''}
                onChange={(e) => {
                  updateParentMeetingDoc({ ...currentMeeting!, discussionNotes: e.target.value });
                }}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-sans text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Section III: Resolutions */}
            <div className="space-y-1 pt-2">
              <h5 className="font-bold uppercase text-[11px] font-sans">III. Nghị Quyết Hội Nghị</h5>
              <div className="space-y-1">
                {(currentMeeting?.agreedResolutions || []).map((res, resIdx) => (
                  <div key={resIdx} className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold shrink-0">•</span>
                    <input
                      type="text"
                      value={res}
                      onChange={(e) => {
                        const updated = [...(currentMeeting?.agreedResolutions || [])];
                        updated[resIdx] = e.target.value;
                        updateParentMeetingDoc({ ...currentMeeting!, agreedResolutions: updated });
                      }}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-sans"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Signatures Preview */}
            <div className="grid grid-cols-3 text-center pt-4 border-t border-slate-200 font-sans text-xs">
              <div>
                <p className="font-bold uppercase text-[10px]">THƯ KÝ CUỘC HỌP</p>
                <p className="italic text-[9px] text-slate-400">(Ký, ghi rõ họ tên)</p>
                <p className="mt-6 font-bold text-slate-800">{currentMeeting?.secretary || 'Ban Thư ký'}</p>
              </div>
              <div>
                <p className="font-bold uppercase text-[10px]">TRƯỞNG BAN ĐD CMHS</p>
                <p className="italic text-[9px] text-slate-400">(Ký, ghi rõ họ tên)</p>
                <p className="mt-6 font-bold text-slate-800">
                  {currentMeeting?.committeeMembers?.find((m) => m.role === 'TRUONG_BAN')?.fullName || 'Trưởng ban'}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase text-[10px]">GIÁO VIÊN CHỦ NHIỆM</p>
                <p className="italic text-[9px] text-slate-400">(Ký, ghi rõ họ tên)</p>
                <p className="mt-6 font-bold text-slate-800">{classInfo.teacherName || 'GVCN'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {currentMeeting && (
        <>
          <DynamicPresentationModal
            isOpen={isPresentationOpen}
            onClose={() => setIsPresentationOpen(false)}
            meeting={currentMeeting}
            classInfo={classInfo}
            schoolInfo={schoolInfo}
            students={students}
          />

          <TopicEditorModal
            isOpen={isTopicEditorOpen}
            onClose={() => setIsTopicEditorOpen(false)}
            initialTopic={editingTopic}
            onSave={handleSaveTopic}
          />

          {selectedStudentForNote && (
            <StudentNoteModal
              isOpen={studentNoteModalOpen}
              onClose={() => setStudentNoteModalOpen(false)}
              student={selectedStudentForNote}
              initialNote={(currentMeeting.individualNotes || []).find(
                (n) => n.studentId === selectedStudentForNote.id
              )}
              onSave={handleSaveStudentNote}
            />
          )}
        </>
      )}
    </div>
  );
}
