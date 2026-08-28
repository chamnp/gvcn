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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ParentMeetingDoc, MeetingAgendaTopic, IndividualStudentMeetingNote, Student } from '@/types';
import { DynamicPresentationModal } from '@/components/meetings/meeting-presentation-modal';
import { MeetingMinutesPrintView } from '@/components/meetings/meeting-minutes-print-view';
import { TopicEditorModal } from '@/components/meetings/topic-editor-modal';
import { StudentNoteModal } from '@/components/meetings/student-note-modal';
import { toast } from 'sonner';

export default function ParentMeetingsPage() {
  const {
    parentMeetings,
    updateParentMeetingDoc,
    classInfo,
    schoolInfo,
    students,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'AGENDA' | 'STUDENTS' | 'SPEECH' | 'MINUTES'>('AGENDA');
  const [activeMeeting, setActiveMeeting] = useState<ParentMeetingDoc>(parentMeetings[0] || null);

  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isPrintingMinutes, setIsPrintingMinutes] = useState(false);

  const [isTopicEditorOpen, setIsTopicEditorOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<MeetingAgendaTopic | null>(null);

  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [studentNoteModalOpen, setStudentNoteModalOpen] = useState(false);

  const currentMeeting = activeMeeting || parentMeetings[0];

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
    setActiveMeeting(updatedDoc);
    updateParentMeetingDoc(updatedDoc);
  };

  const handleToggleTopic = (topicId: string) => {
    if (!currentMeeting) return;
    const updatedTopics = (currentMeeting.agendaTopics || []).map((t) =>
      t.id === topicId ? { ...t, isEnabled: !t.isEnabled } : t
    );
    const updatedDoc = { ...currentMeeting, agendaTopics: updatedTopics };
    setActiveMeeting(updatedDoc);
    updateParentMeetingDoc(updatedDoc);
  };

  const handleDeleteTopic = (topicId: string) => {
    if (!currentMeeting) return;
    const updatedTopics = (currentMeeting.agendaTopics || []).filter((t) => t.id !== topicId);
    const updatedDoc = { ...currentMeeting, agendaTopics: updatedTopics };
    setActiveMeeting(updatedDoc);
    updateParentMeetingDoc(updatedDoc);
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

    const updatedDoc = { ...currentMeeting, agendaTopics: topics };
    setActiveMeeting(updatedDoc);
    updateParentMeetingDoc(updatedDoc);
  };

  const handleSaveStudentNote = (note: IndividualStudentMeetingNote) => {
    if (!currentMeeting) return;
    const existing = (currentMeeting.individualNotes || []).filter((n) => n.studentId !== note.studentId);
    const updatedNotes = [...existing, note];

    const updatedDoc = { ...currentMeeting, individualNotes: updatedNotes };
    setActiveMeeting(updatedDoc);
    updateParentMeetingDoc(updatedDoc);
    toast.success(`Đã lưu ghi chú trao đổi riêng em ${note.studentName}!`);
  };

  const totalEstimatedTime = (currentMeeting?.agendaTopics || [])
    .filter((t) => t.isEnabled)
    .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <span>📊 Bộ Công Cụ Chủ Nhiệm Linh Hoạt</span>
            <span className="bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
              Chỉnh Sửa Kịch Bản 100%
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Trợ Lý Họp Phụ Huynh & Trình Chiếu TV Thông Minh
          </h1>

          <p className="text-xs sm:text-sm text-blue-100 font-medium">
            Tự do thiết kế nội dung trao đổi, chuẩn bị kịch bản phát biểu AI, sổ tay trao đổi 1-1 với từng phụ huynh và xuất biên bản in A4.
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

          <button
            type="button"
            onClick={() => setIsPrintingMinutes(true)}
            className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Biên Bản A4</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'AGENDA', label: `📌 Kế Hoạch & Nội Dung Trao Đổi (${currentMeeting?.agendaTopics?.length || 0})` },
          { id: 'STUDENTS', label: `🎯 Sổ Tay Trao Đổi 1-1 Với PH (${students.length})` },
          { id: 'SPEECH', label: '🎙️ Kịch Bản Phát Biểu & Hỏi Đáp' },
          { id: 'MINUTES', label: '👥 Ban Đại Diện & Biên Bản Họp' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'AGENDA' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Tổng thời lượng dự kiến cuộc họp: <span className="text-blue-600">{totalEstimatedTime} phút</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Gồm {(currentMeeting?.agendaTopics || []).filter((t) => t.isEnabled).length} phần nội dung sẽ được chiếu lên slide TV.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTopic(null);
                setIsTopicEditorOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Phần Nội Dung Mới</span>
            </button>
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
                          💡 Lưu ý cô giáo: {topic.importantNote}
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

      {activeTab === 'STUDENTS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900">
                Sổ Chuẩn Bị Trao Đổi Riêng 1-1 Với Từng Phụ Huynh
              </h3>
              <p className="text-xs text-slate-500">
                Ghi chú vắn tắt học lực, nề nếp, điểm cần phụ huynh đồng hành và 1-Click sao chép tin nhắn gửi Zalo riêng tư.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((st) => {
              const note = (currentMeeting?.individualNotes || []).find((n) => n.studentId === st.id);
              return (
                <div
                  key={st.id}
                  className={`p-5 rounded-3xl border transition-all space-y-3 ${
                    note?.isPriorityDiscussion
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                        {st.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{st.fullName}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">Mã HS: {st.studentCode} • {st.gender}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {note?.isPriorityDiscussion && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                          ⚠️ Gặp riêng
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentForNote(st);
                          setStudentNoteModalOpen(true);
                        }}
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-600">
                      <strong>Học tập:</strong> {note?.academicSummary || 'Chưa có ghi chú'}
                    </p>
                    <p className="text-slate-600">
                      <strong>Nề nếp:</strong> {note?.behaviorSummary || 'Ngoan ngoãn, lễ phép'}
                    </p>
                    <p className="text-blue-900 font-medium bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                      <strong>Dặn dò PH:</strong> {note?.actionItemForParents || 'Gia đình cùng con đọc sách mỗi tối'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'SPEECH' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🎙️</span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      Bài Phát Biểu Khai Mạc & Điều Hành Của Cô Giáo (GVCN)
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
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép</span>
                </button>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-serif">
                {currentMeeting?.aiSpeechScript}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Câu Hỏi Phụ Huynh Thường Gặp (FAQ):</span>
              </h3>

              <div className="space-y-3">
                {(currentMeeting?.faqList || []).map((faq, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5 text-xs">
                    <p className="font-black text-blue-950">❓ {faq.question}</p>
                    <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-blue-100/60">
                      💡 <strong>Gợi ý trả lời:</strong> {faq.suggestedAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'MINUTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-base text-slate-900">{currentMeeting?.title}</h3>
                  <p className="text-xs text-slate-500">{currentMeeting?.meetingDate} • {currentMeeting?.location}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrintingMinutes(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Biên Bản A4</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <h4 className="font-black text-slate-900">Báo cáo & Nội dung trọng tâm:</h4>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  {(currentMeeting?.mainReports || []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>

                <h4 className="font-black text-slate-900 pt-2">Ý kiến thảo luận:</h4>
                <p className="text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {currentMeeting?.discussionNotes}
                </p>

                <h4 className="font-black text-slate-900 pt-2">Nghị quyết thống nhất:</h4>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  {(currentMeeting?.agreedResolutions || []).map((res, i) => (
                    <li key={i}>{res}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>👥 Ban Đại Diện Cha Mẹ Học Sinh Lớp:</span>
              </h3>

              <div className="space-y-3">
                {(currentMeeting?.committeeMembers || []).map((m, idx) => (
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

      {currentMeeting && (
        <DynamicPresentationModal
          isOpen={isPresentationOpen}
          onClose={() => setIsPresentationOpen(false)}
          meeting={currentMeeting}
          classInfo={classInfo}
          schoolInfo={schoolInfo}
          students={students}
        />
      )}

      <TopicEditorModal
        isOpen={isTopicEditorOpen}
        onClose={() => {
          setIsTopicEditorOpen(false);
          setEditingTopic(null);
        }}
        onSave={handleSaveTopic}
        initialTopic={editingTopic}
      />

      {selectedStudentForNote && (
        <StudentNoteModal
          isOpen={studentNoteModalOpen}
          onClose={() => {
            setStudentNoteModalOpen(false);
            setSelectedStudentForNote(null);
          }}
          onSave={handleSaveStudentNote}
          student={selectedStudentForNote}
          initialNote={(currentMeeting?.individualNotes || []).find((n) => n.studentId === selectedStudentForNote.id)}
          classNameStr={classInfo.name}
        />
      )}
    </div>
  );
}
