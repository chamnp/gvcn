'use client';

import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, ArrowRight, Backpack, BookOpen, CalendarDays, Check, ChevronRight,
  Clock3, ExternalLink, FileCheck2, Image as ImageIcon, Info, LockKeyhole,
  MapPin, RefreshCw, School, ShieldCheck, Square, UserRoundCheck, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculatePeriods, DAYS_OF_WEEK, DEFAULT_SCHEDULE_CONFIG, getSubjectTheme } from '@/lib/timetable-data';
import { getLocalDateString } from '@/lib/tt27-engine';
import type {
  ClassEvent, ClassInfo, ClassMoment, ConferenceSlot, CustomSubject, DayOfWeek,
  HomeworkAssignment, SchoolInfo, TimetableSlot,
} from '@/types';

type PortalTab = 'HOMEWORK' | 'BACKPACK' | 'TIMETABLE' | 'EVENTS' | 'MOMENTS' | 'CONFERENCE';
interface PublicPortalFlags {
  homework: boolean; timetable: boolean; attendance: boolean; assessment: boolean;
  reports: boolean; moments: boolean; parentMeetings: boolean;
}
interface PublicClassPortalBundle {
  success?: boolean; error?: string; school?: Partial<SchoolInfo>; class?: ClassInfo;
  featureFlags?: Partial<PublicPortalFlags>; homeworks?: HomeworkAssignment[];
  customSubjects?: CustomSubject[]; timetable?: TimetableSlot[]; events?: ClassEvent[];
  moments?: ClassMoment[]; conferenceSlots?: ConferenceSlot[];
}

const DEFAULT_PUBLIC_FLAGS: PublicPortalFlags = {
  homework: true, timetable: true, attendance: true, assessment: false,
  reports: false, moments: false, parentMeetings: false,
};
const EMPTY_SCHOOL: SchoolInfo = {
  id: '', name: 'Cổng thông tin lớp học', departmentName: '', schoolYear: '2026-2027', principalName: '',
};
const EVENT_LABELS: Record<string, string> = {
  EXAM: 'Kiểm tra', MEETING: 'Họp phụ huynh', ACTIVITY: 'Hoạt động', FESTIVAL: 'Ngày hội', OTHER: 'Sự kiện',
};

export default function PublicClassHomeworkPortal({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const shareToken = (classId || '').trim();
  const [bundle, setBundle] = useState<PublicClassPortalBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('HOMEWORK');
  const [completedHwIds, setCompletedHwIds] = useState<string[]>([]);
  const [packedSubjectCodes, setPackedSubjectCodes] = useState<string[]>([]);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<DayOfWeek>('T2');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const todayStr = getLocalDateString();
  const tomorrowDayCode = useMemo<DayOfWeek>(() => {
    const map: Record<number, DayOfWeek> = { 0: 'T2', 1: 'T3', 2: 'T4', 3: 'T5', 4: 'T6', 5: 'T2', 6: 'T2' };
    return map[new Date().getDay()] || 'T2';
  }, []);

  const loadPortal = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.rpc('get_public_class_portal_bundle', { p_class_share_token: shareToken });
    const next = data as PublicClassPortalBundle | null;
    if (error) {
      setBundle(null);
      setLoadError('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    } else if (!next?.success || !next.class) {
      setBundle(null);
      setLoadError(next?.error || 'Liên kết lớp không hợp lệ hoặc đã hết hạn.');
    } else {
      setBundle(next);
      try {
        setCompletedHwIds(JSON.parse(localStorage.getItem(`gvcn_hw_done_${next.class.id}`) || '[]'));
        setPackedSubjectCodes(JSON.parse(localStorage.getItem(`gvcn_pack_${next.class.id}_${todayStr}`) || '[]'));
      } catch {
        setCompletedHwIds([]);
        setPackedSubjectCodes([]);
      }
      setSelectedTimetableDay(tomorrowDayCode);
    }
    setIsLoading(false);
  }, [shareToken, todayStr, tomorrowDayCode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPortal(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadPortal]);

  const currentClass = bundle?.class || null;
  const schoolInfo = { ...EMPTY_SCHOOL, ...(bundle?.school || {}) };
  const flags = { ...DEFAULT_PUBLIC_FLAGS, ...(bundle?.featureFlags || {}) };
  const homeworks = bundle?.homeworks || [];
  const customSubjects = bundle?.customSubjects || [];
  const timetable = bundle?.timetable || [];
  const events = bundle?.events || [];
  const moments = bundle?.moments || [];
  const conferenceSlots = bundle?.conferenceSlots || [];
  const periods = useMemo(() => calculatePeriods(DEFAULT_SCHEDULE_CONFIG), []);

  const tabs: Array<{ id: PortalTab; label: string; icon: React.ReactNode; count?: number }> = [];
  if (flags.homework) tabs.push({ id: 'HOMEWORK', label: 'Bài tập', icon: <FileCheck2 className="h-4 w-4" />, count: homeworks.length });
  if (flags.timetable) {
    tabs.push({ id: 'BACKPACK', label: 'Soạn cặp', icon: <Backpack className="h-4 w-4" /> });
    tabs.push({ id: 'TIMETABLE', label: 'Thời khóa biểu', icon: <CalendarDays className="h-4 w-4" /> });
  }
  tabs.push({ id: 'EVENTS', label: 'Sự kiện', icon: <CalendarDays className="h-4 w-4" />, count: events.length });
  if (flags.moments) tabs.push({ id: 'MOMENTS', label: 'Khoảnh khắc', icon: <ImageIcon className="h-4 w-4" />, count: moments.length });
  if (flags.parentMeetings) tabs.push({ id: 'CONFERENCE', label: 'Lịch gặp cô', icon: <UserRoundCheck className="h-4 w-4" />, count: conferenceSlots.filter((slot) => !slot.isBooked).length });
  const visibleActiveTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id;

  const tomorrowDayInfo = DAYS_OF_WEEK.find((day) => day.id === tomorrowDayCode);
  const tomorrowSlots = timetable.filter((slot) => slot.day === tomorrowDayCode && slot.classId === currentClass?.id);

  const toggleHomework = (id: string) => {
    if (!currentClass) return;
    setCompletedHwIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(`gvcn_hw_done_${currentClass.id}`, JSON.stringify(next));
      return next;
    });
  };
  const togglePacked = (code: string) => {
    if (!currentClass) return;
    setPackedSubjectCodes((current) => {
      const next = current.includes(code) ? current.filter((item) => item !== code) : [...current, code];
      localStorage.setItem(`gvcn_pack_${currentClass.id}_${todayStr}`, JSON.stringify(next));
      return next;
    });
  };

  if (isLoading) return <LoadingState />;
  if (!currentClass || loadError) return <ErrorState message={loadError || 'Liên kết lớp không hợp lệ.'} onRetry={loadPortal} />;

  const completedCount = homeworks.filter((item) => completedHwIds.includes(item.id)).length;
  const privateHref = `/lookup?class=${encodeURIComponent(currentClass.id)}&classToken=${encodeURIComponent(shareToken)}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {schoolInfo.logoUrl ? <img src={schoolInfo.logoUrl} alt={`Logo ${schoolInfo.name}`} className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><School className="h-5 w-5" /></div>}
            <div className="min-w-0"><p className="truncate text-base font-black">Lớp {currentClass.name}</p><p className="truncate text-xs text-slate-600">{schoolInfo.name} · GVCN: {currentClass.teacherName}</p></div>
          </div>
          <Link href={privateHref} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-50 px-3 text-sm font-bold text-blue-700 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <ShieldCheck className="h-4 w-4" /><span className="hidden sm:inline">Hồ sơ của con</span><ChevronRight className="h-4 w-4 sm:hidden" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        <section className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-5 text-white shadow-xl sm:p-7">
          <p className="text-sm font-bold text-blue-100">Góc phụ huynh và học sinh</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Thông tin học tập lớp {currentClass.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Bài tập, lịch học và thông báo mới nhất từ giáo viên chủ nhiệm.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {flags.attendance && <Link href={`${privateHref}&next=leave`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-800 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><UserRoundCheck className="h-4 w-4" /> Xin nghỉ phép</Link>}
            {flags.parentMeetings && <Link href={`${privateHref}&next=conference`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><CalendarDays className="h-4 w-4" /> Đặt lịch gặp cô</Link>}
          </div>
          {flags.homework && homeworks.length > 0 && <div className="mt-6 max-w-2xl"><div className="mb-2 flex justify-between text-sm font-semibold text-blue-100"><span>Tiến độ trên thiết bị này</span><span>{completedCount}/{homeworks.length}</span></div><div className="h-2 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-emerald-400 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.round((completedCount / homeworks.length) * 100)}%` }} /></div></div>}
        </section>

        {(flags.assessment || flags.reports) && <section className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-bold text-amber-950">Kết quả riêng của con</h2><p className="mt-1 text-sm leading-5 text-amber-800">Cần mã học sinh và PIN để xem đánh giá, nhận xét.</p></div></div><Link href={privateHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 text-sm font-bold text-white hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">Tra cứu an toàn <ArrowRight className="h-4 w-4" /></Link></section>}

        <nav aria-label="Nội dung cổng lớp học" className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex sm:flex-wrap">
          {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-current={visibleActiveTab === tab.id ? 'page' : undefined} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${visibleActiveTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>{tab.icon}<span>{tab.label}</span>{tab.count !== undefined && <span className={`rounded-full px-2 py-0.5 text-xs ${visibleActiveTab === tab.id ? 'bg-white/20' : 'bg-slate-200'}`}>{tab.count}</span>}</button>)}
        </nav>

        {visibleActiveTab === 'HOMEWORK' && flags.homework && <HomeworkSection homeworks={homeworks} customSubjects={customSubjects} completedIds={completedHwIds} privateHref={privateHref} onToggle={toggleHomework} onPreview={setPreviewImageUrl} />}
        {visibleActiveTab === 'BACKPACK' && flags.timetable && <BackpackSection dayName={tomorrowDayInfo?.name || 'ngày mai'} slots={tomorrowSlots} packedCodes={packedSubjectCodes} onToggle={togglePacked} />}
        {visibleActiveTab === 'TIMETABLE' && flags.timetable && <TimetableSection classId={currentClass.id} className={currentClass.name} timetable={timetable} periods={periods} selectedDay={selectedTimetableDay} onSelectDay={setSelectedTimetableDay} />}
        {visibleActiveTab === 'EVENTS' && <EventsSection events={events} />}
        {visibleActiveTab === 'MOMENTS' && flags.moments && <MomentsSection moments={moments} onPreview={setPreviewImageUrl} />}
        {visibleActiveTab === 'CONFERENCE' && flags.parentMeetings && <ConferenceSection slots={conferenceSlots} privateHref={privateHref} />}

        <aside className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5"><div><p className="text-sm font-semibold text-slate-600">Giáo viên chủ nhiệm</p><p className="mt-1 font-black">{currentClass.teacherName}</p></div><div><p className="text-sm font-semibold text-slate-600">Năm học</p><p className="mt-1 font-black">{schoolInfo.schoolYear || currentClass.schoolYear}</p></div></aside>
      </main>

      {previewImageUrl && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4" role="dialog" aria-modal="true" aria-label="Xem ảnh"><button type="button" onClick={() => setPreviewImageUrl(null)} aria-label="Đóng ảnh" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-white"><X className="h-5 w-5" /></button><img src={previewImageUrl} alt="Nội dung đính kèm" className="max-h-[85vh] max-w-full rounded-2xl object-contain" /></div>}
    </div>
  );
}

function LoadingState() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6" role="status" aria-live="polite"><div className="text-center"><RefreshCw className="mx-auto h-9 w-9 animate-spin text-blue-600 motion-reduce:animate-none" /><p className="mt-4 text-base font-bold">Đang mở cổng lớp học</p><p className="mt-1 text-sm text-slate-600">Vui lòng chờ trong giây lát…</p></div></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  const network = message.startsWith('Không thể kết nối');
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">{network ? <AlertCircle className="h-8 w-8" /> : <LockKeyhole className="h-8 w-8" />}</div><h1 className="mt-5 text-xl font-black">{network ? 'Chưa thể kết nối' : 'Không mở được lớp học'}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{message}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href="/hw" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-800 hover:bg-slate-200">Nhập mã khác</Link><button type="button" onClick={() => void onRetry()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"><RefreshCw className="h-4 w-4" /> Thử lại</button></div></div></div>;
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">{icon}</div><h2 className="mt-4 text-base font-black">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div>;
}

function HomeworkSection({ homeworks, customSubjects, completedIds, privateHref, onToggle, onPreview }: { homeworks: HomeworkAssignment[]; customSubjects: CustomSubject[]; completedIds: string[]; privateHref: string; onToggle: (id: string) => void; onPreview: (url: string | null) => void }) {
  if (!homeworks.length) return <EmptyState icon={<BookOpen className="h-7 w-7" />} title="Hôm nay chưa có bài tập" description="Giáo viên sẽ cập nhật bài tập mới tại đây." />;
  return <section className="space-y-3" aria-label="Bài tập về nhà">{homeworks.map((homework) => { const theme = getSubjectTheme(homework.subjectCode, customSubjects); const done = completedIds.includes(homework.id); const hasQuiz = Boolean(homework.isQuiz || homework.quizQuestions?.length); return <article key={homework.id} className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${done ? 'border-emerald-300' : 'border-slate-200'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className={`text-xs font-bold uppercase tracking-wide ${theme.textColor}`}>{homework.subjectName}</p><h2 className={`mt-1 text-base font-bold leading-6 ${done ? 'text-slate-500 line-through' : ''}`}>{homework.title}</h2></div><button type="button" onClick={() => onToggle(homework.id)} aria-pressed={done} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold focus-visible:ring-2 focus-visible:ring-emerald-500 ${done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{done ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}{done ? 'Đã xong' : 'Đánh dấu'}</button></div><p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{homework.description}</p>{homework.reminderNotes && <p className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900"><Info className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Cô dặn:</strong> {homework.reminderNotes}</span></p>}<div className="mt-3 flex flex-wrap gap-2">{homework.attachmentUrl && <button type="button" onClick={() => onPreview(homework.attachmentUrl || null)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-50 px-3 text-sm font-bold text-indigo-700"><ExternalLink className="h-4 w-4" /> Xem phiếu bài tập</button>}{hasQuiz && <Link href={`${privateHref}&next=quiz&homework=${encodeURIComponent(homework.id)}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white"><LockKeyhole className="h-4 w-4" /> Xác thực để làm bài</Link>}</div></article>; })}</section>;
}

function BackpackSection({ dayName, slots, packedCodes, onToggle }: { dayName: string; slots: TimetableSlot[]; packedCodes: string[]; onToggle: (code: string) => void }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="text-lg font-black">Soạn cặp cho {dayName}</h2><p className="mt-1 text-sm text-slate-600">Đánh dấu sau khi đã chuẩn bị sách vở và đồ dùng.</p><div className="mt-4 space-y-2">{!slots.length ? <p className="py-6 text-center text-sm text-slate-600">Ngày mai chưa có tiết học.</p> : slots.map((slot) => { const packed = packedCodes.includes(slot.subjectCode); return <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><div><p className="font-bold">{slot.subjectName} · Tiết {slot.period}</p><p className="mt-1 text-sm text-slate-600">{slot.note || `Sách giáo khoa và vở ${slot.subjectName}`}</p></div><button type="button" onClick={() => onToggle(slot.subjectCode)} aria-pressed={packed} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold ${packed ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>{packed ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4" />}{packed ? 'Đã xếp' : 'Đánh dấu'}</button></div>; })}</div></section>;
}

function TimetableSection({ classId, className, timetable, periods, selectedDay, onSelectDay }: { classId: string; className: string; timetable: TimetableSlot[]; periods: ReturnType<typeof calculatePeriods>; selectedDay: DayOfWeek; onSelectDay: (day: DayOfWeek) => void }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black">Thời khóa biểu lớp {className}</h2><p className="mt-1 text-sm text-slate-600">Chọn ngày để xem lịch học.</p></div><div className="grid grid-cols-5 gap-1">{DAYS_OF_WEEK.map((day) => <button key={day.id} type="button" onClick={() => onSelectDay(day.id)} className={`min-h-11 rounded-xl px-2 text-sm font-bold ${selectedDay === day.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{day.name.replace('Thứ ', 'T')}</button>)}</div></div><div className="mt-4 space-y-2">{periods.map((period) => { const slot = timetable.find((item) => item.classId === classId && item.day === selectedDay && item.period === period.period); return <div key={period.period} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3"><div><p className="font-bold">{period.name}: {slot?.subjectName || 'Trống'}</p>{slot?.note && <p className="mt-1 text-sm text-slate-600">{slot.note}</p>}</div><span className="shrink-0 text-sm font-semibold text-slate-600">{period.time}</span></div>; })}</div></section>;
}

function EventsSection({ events }: { events: ClassEvent[] }) {
  if (!events.length) return <EmptyState icon={<CalendarDays className="h-7 w-7" />} title="Chưa có sự kiện" description="Các mốc kiểm tra và hoạt động của lớp sẽ xuất hiện tại đây." />;
  return <section className="space-y-3">{events.map((event) => <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{EVENT_LABELS[event.type || event.eventType || 'OTHER'] || 'Sự kiện'}</span><span className="text-sm font-semibold text-slate-600">{event.date}</span></div><h2 className="mt-2 text-base font-black">{event.title}</h2><div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">{event.time && <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{event.time}</span>}{event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>}</div>{event.description && <p className="mt-3 text-sm leading-6 text-slate-700">{event.description}</p>}</article>)}</section>;
}

function MomentsSection({ moments, onPreview }: { moments: ClassMoment[]; onPreview: (url: string) => void }) {
  if (!moments.length) return <EmptyState icon={<ImageIcon className="h-7 w-7" />} title="Chưa có khoảnh khắc" description="Giáo viên sẽ chia sẻ hoạt động của lớp tại đây." />;
  return <section className="space-y-3">{moments.map((moment) => <article key={moment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><p className="text-sm font-semibold text-slate-600">{moment.teacherName} · {new Date(moment.createdAt).toLocaleDateString('vi-VN')}</p><h2 className="mt-2 text-lg font-black">{moment.title}</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{moment.content}</p>{moment.imageUrls?.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{moment.imageUrls.map((url, index) => <button key={`${moment.id}-${index}`} type="button" onClick={() => onPreview(url)} className="aspect-4/3 overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500"><img src={url} alt={`Ảnh ${index + 1} của ${moment.title}`} loading="lazy" className="h-full w-full object-cover" /></button>)}</div>}</article>)}</section>;
}

function ConferenceSection({ slots, privateHref }: { slots: ConferenceSlot[]; privateHref: string }) {
  return <section className="space-y-3"><div className="rounded-2xl border border-purple-200 bg-purple-50 p-4"><h2 className="font-black text-purple-950">Lịch trao đổi riêng với giáo viên</h2><p className="mt-1 text-sm leading-5 text-purple-800">Cổng lớp chỉ hiển thị thời gian. Đăng ký cần xác thực hồ sơ của con.</p></div>{!slots.length ? <EmptyState icon={<UserRoundCheck className="h-7 w-7" />} title="Chưa mở lịch hẹn" description="Giáo viên chưa công bố khung giờ trao đổi." /> : slots.map((slot) => <article key={slot.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">{slot.date} · {slot.startTime}–{slot.endTime}</h2><p className="mt-1 text-sm text-slate-600">{slot.title}{slot.location ? ` · ${slot.location}` : ''}</p></div>{slot.isBooked ? <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">Đã có người đăng ký</span> : <Link href={`${privateHref}&next=conference&slot=${encodeURIComponent(slot.id)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 text-sm font-bold text-white"><LockKeyhole className="h-4 w-4" /> Xác thực để đăng ký</Link>}</article>)}</section>;
}
