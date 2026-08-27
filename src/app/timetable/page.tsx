'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Clock,
  Printer,
  Copy,
  RotateCcw,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Edit2,
  BookOpen,
  Info,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Move,
  GripVertical,
  HelpCircle,
  Share2,
  ArrowRight,
  Filter,
  Lock,
  RefreshCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import {
  DAYS_OF_WEEK,
  PERIODS,
  DEFAULT_SUBJECT_THEMES,
  getSubjectTheme,
  PeriodInfo,
  SubjectTheme,
} from '@/lib/timetable-data';
import { DayOfWeek, TimetableSlot } from '@/types';
import { toast } from 'sonner';

export type TimetableScope = 'FULL_YEAR' | 'SEMESTER_1' | 'SEMESTER_2' | 'CUSTOM_WEEKS';

// Subject resolver from text (Excel parsing)
function resolveSubjectFromText(rawText: string, customSubjects: any[] = []): { code: string; name: string } {
  if (!rawText) return { code: 'TU_HOC', name: 'Tự học có hướng dẫn' };
  const text = rawText.toString().trim().toLowerCase();

  // Check custom subjects first
  const matchedCustom = customSubjects.find(
    (cs) =>
      cs.name.toLowerCase() === text ||
      cs.shortName.toLowerCase() === text ||
      cs.code.toLowerCase() === text
  );
  if (matchedCustom) {
    return { code: matchedCustom.code, name: matchedCustom.name };
  }

  if (text.includes('chào cờ') || text.includes('dưới cờ') || text.includes('shdc') || text === 'cc') {
    return { code: 'CHAO_CO', name: 'Sinh hoạt dưới cờ' };
  }
  if (text.includes('sinh hoạt lớp') || text.includes('shl') || text === 'sh') {
    return { code: 'SINH_HOAT_LOP', name: 'Sinh hoạt lớp' };
  }
  if (
    text.includes('tiếng việt') ||
    text.includes('t.việt') ||
    text === 'tv' ||
    text.includes('luyện từ') ||
    text.includes('tập đọc') ||
    text.includes('chính tả') ||
    text.includes('tập làm văn') ||
    text.includes('đọc') ||
    text.includes('viết')
  ) {
    return { code: 'TIENG_VIET', name: rawText.trim() };
  }
  if (text.includes('toán') || text === 'toan' || text === 'math') {
    return { code: 'TOAN', name: 'Toán học' };
  }
  if (
    text.includes('tiếng anh') ||
    text.includes('ngoại ngữ') ||
    text.includes('english') ||
    text === 'ta' ||
    text === 'nn' ||
    text.includes('anh văn') ||
    text === 'anh'
  ) {
    return { code: 'NGOAI_NGU', name: 'Tiếng Anh' };
  }
  if (text.includes('khoa học') || text === 'kh') {
    return { code: 'KHOA_HOC', name: 'Khoa học' };
  }
  if (
    text.includes('lịch sử') ||
    text.includes('địa lý') ||
    text.includes('ls & đl') ||
    text.includes('ls') ||
    text.includes('đl') ||
    text.includes('sử') ||
    text.includes('địa')
  ) {
    return { code: 'LS_DL', name: 'Lịch sử & Địa lý' };
  }
  if (text.includes('đạo đức') || text === 'đđ' || text === 'dd') {
    return { code: 'DAO_DUC', name: 'Đạo đức' };
  }
  if (
    text.includes('tin học') ||
    text.includes('công nghệ') ||
    text.includes('tin') ||
    text.includes('cn') ||
    text.includes('máy tính')
  ) {
    return { code: 'TIN_HOC_CN', name: 'Tin học & Công nghệ' };
  }
  if (text.includes('âm nhạc') || text.includes('hát') || text.includes('nhạc')) {
    return { code: 'AM_NHAC', name: 'Âm nhạc' };
  }
  if (text.includes('mỹ thuật') || text.includes('vẽ') || text === 'mt') {
    return { code: 'MY_THUAT', name: 'Mỹ thuật' };
  }
  if (
    text.includes('thể chất') ||
    text.includes('thể dục') ||
    text.includes('gdtc') ||
    text === 'tc' ||
    text === 'td'
  ) {
    return { code: 'GD_THE_CHAT', name: 'Giáo dục thể chất' };
  }
  if (text.includes('trải nghiệm') || text.includes('hđtn') || text.includes('hdtn')) {
    return { code: 'HD_TRAI_NGHIEM', name: 'Hoạt động trải nghiệm' };
  }
  if (text.includes('tự học') || text.includes('hướng dẫn')) {
    return { code: 'TU_HOC', name: 'Tự học có hướng dẫn' };
  }
  if (text.includes('stem') || text.includes('robotics')) {
    return { code: 'STEM_ROBOTICS', name: 'STEM & Robotics' };
  }
  if (text.includes('kỹ năng') || text.includes('kns')) {
    return { code: 'KY_NANG_SONG', name: 'Kỹ Năng Sống' };
  }

  return { code: 'CUSTOM', name: rawText.trim() };
}

export default function TimetablePage() {
  const {
    classInfo,
    timetable,
    updateTimetableSlot,
    setTimetable,
    resetTimetableToStandard,
    customSubjects,
    schoolInfo,
    regenerateClassShareToken,
  } = useAppStore();
  const { profile } = useAuth();

  // Combine default subjects & custom subjects
  const allThemes: SubjectTheme[] = useMemo(() => {
    return [
      ...DEFAULT_SUBJECT_THEMES,
      ...customSubjects.map((cs) => ({
        code: cs.code,
        name: cs.name,
        shortName: cs.shortName,
        icon: cs.icon,
        bgColor: cs.bgColor,
        textColor: cs.textColor,
        borderColor: cs.borderColor,
        category: cs.category,
      })),
    ];
  }, [customSubjects]);

  // Scope state
  const [scope, setScope] = useState<TimetableScope>('FULL_YEAR');
  const [customStartWeek, setCustomStartWeek] = useState(1);
  const [customEndWeek, setCustomEndWeek] = useState(4);

  // Palette Filter & Active Quick-Assign Tool
  const [activePaletteSubject, setActivePaletteSubject] = useState<SubjectTheme | null>(null);

  // Drag & Drop State
  const [draggedSubject, setDraggedSubject] = useState<SubjectTheme | null>(null);
  const [draggedSlotSource, setDraggedSlotSource] = useState<{ day: DayOfWeek; period: number } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Edit Modal State
  const [editingSlot, setEditingSlot] = useState<{
    day: DayOfWeek;
    period: number;
    subjectCode: string;
    subjectName: string;
    note: string;
    teacherName: string;
  } | null>(null);

  // Excel Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedPreviewSlots, setImportedPreviewSlots] = useState<TimetableSlot[] | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy dữ liệu tiết học
  const getSlot = (day: DayOfWeek, period: number): TimetableSlot | undefined => {
    return timetable.find((s) => s.day === day && s.period === period);
  };

  // Drag Handlers
  const handleDragStartPalette = (e: React.DragEvent, theme: SubjectTheme) => {
    setDraggedSubject(theme);
    setDraggedSlotSource(null);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'PALETTE', code: theme.code, name: theme.name }));
  };

  const handleDragStartSlot = (e: React.DragEvent, day: DayOfWeek, period: number) => {
    setDraggedSubject(null);
    setDraggedSlotSource({ day, period });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'SLOT', day, period }));
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek, period: number) => {
    e.preventDefault();
    setDragOverCell(`${day}-${period}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDropOnSlot = (e: React.DragEvent, targetDay: DayOfWeek, targetPeriod: number) => {
    e.preventDefault();
    setDragOverCell(null);

    // Case 1: Dragged from Palette
    if (draggedSubject) {
      updateTimetableSlot(targetDay, targetPeriod, draggedSubject.code, draggedSubject.name);
      toast.success(`Đã xếp môn ${draggedSubject.name} vào Tiết ${targetPeriod} (${DAYS_OF_WEEK.find((d) => d.id === targetDay)?.name})`);
      setDraggedSubject(null);
      return;
    }

    // Case 2: Dragged from another Slot (Swap or Move)
    if (draggedSlotSource) {
      const sourceSlot = getSlot(draggedSlotSource.day, draggedSlotSource.period);
      const targetSlot = getSlot(targetDay, targetPeriod);

      if (!sourceSlot) return;

      if (draggedSlotSource.day === targetDay && draggedSlotSource.period === targetPeriod) {
        return; // Dropped on self
      }

      if (targetSlot) {
        // Swap slots
        updateTimetableSlot(
          targetDay,
          targetPeriod,
          sourceSlot.subjectCode,
          sourceSlot.subjectName,
          sourceSlot.note,
          sourceSlot.teacherName
        );
        updateTimetableSlot(
          draggedSlotSource.day,
          draggedSlotSource.period,
          targetSlot.subjectCode,
          targetSlot.subjectName,
          targetSlot.note,
          targetSlot.teacherName
        );
        toast.success(`Đã hoán đổi vị trí giữa 2 tiết học!`);
      } else {
        // Move slot to empty space
        updateTimetableSlot(
          targetDay,
          targetPeriod,
          sourceSlot.subjectCode,
          sourceSlot.subjectName,
          sourceSlot.note,
          sourceSlot.teacherName
        );
        updateTimetableSlot(draggedSlotSource.day, draggedSlotSource.period, 'TU_HOC', 'Tự học có hướng dẫn');
        toast.success(`Đã di chuyển tiết học sang ${DAYS_OF_WEEK.find((d) => d.id === targetDay)?.name} (Tiết ${targetPeriod})`);
      }

      setDraggedSlotSource(null);
    }
  };

  // Slot Click Handler (either quick-assign if palette selected or open edit)
  const handleSlotClick = (day: DayOfWeek, period: number) => {
    if (activePaletteSubject) {
      updateTimetableSlot(day, period, activePaletteSubject.code, activePaletteSubject.name);
      toast.success(`Đã gán ${activePaletteSubject.name} vào Tiết ${period} (${DAYS_OF_WEEK.find((d) => d.id === day)?.name})`);
      return;
    }
    handleOpenEdit(day, period);
  };

  // Clear single slot
  const handleClearSingleSlot = (day: DayOfWeek, period: number) => {
    updateTimetableSlot(day, period, 'TU_HOC', 'Tự học có hướng dẫn', '', '');
    toast.info(`Đã đặt lại Tiết ${period} về Tự học`);
  };

  // Open Edit Modal
  const handleOpenEdit = (day: DayOfWeek, period: number) => {
    const slot = getSlot(day, period);
    const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : getSubjectTheme('TIENG_VIET', customSubjects);
    setEditingSlot({
      day,
      period,
      subjectCode: slot ? slot.subjectCode : 'TIENG_VIET',
      subjectName: slot ? slot.subjectName : theme.name,
      note: slot?.note || '',
      teacherName: slot?.teacherName || classInfo.teacherName || '',
    });
  };

  // Save Slot from Edit Modal
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    updateTimetableSlot(
      editingSlot.day,
      editingSlot.period,
      editingSlot.subjectCode,
      editingSlot.subjectName,
      editingSlot.note,
      editingSlot.teacherName
    );

    toast.success(`Đã cập nhật Tiết ${editingSlot.period} (${DAYS_OF_WEEK.find((d) => d.id === editingSlot.day)?.name})`);
    setEditingSlot(null);
  };

  // Reset to default standard
  const handleResetToStandard = () => {
    if (confirm('Bạn có muốn khôi phục lại Thời khóa biểu mẫu chuẩn Khối 4 (2 buổi/ngày) theo chuẩn Tiểu học?')) {
      resetTimetableToStandard();
      toast.success('Đã áp dụng Thời khóa biểu chuẩn mẫu!');
    }
  };

  // Clear entire timetable
  const handleClearAll = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa trống toàn bộ 35 tiết của Lớp ${classInfo.name} để tự xếp mới từ đầu?`)) {
      const emptySlots: TimetableSlot[] = [];
      DAYS_OF_WEEK.forEach((d) => {
        PERIODS.forEach((p) => {
          emptySlots.push({
            id: `${classInfo.id}-${d.id.toLowerCase()}-p${p.period}`,
            classId: classInfo.id,
            day: d.id,
            period: p.period,
            session: p.session,
            subjectCode: 'TU_HOC',
            subjectName: 'Tự học có hướng dẫn',
          });
        });
      });
      setTimetable(emptySlots);
      toast.success('Đã làm sạch bảng thời khóa biểu!');
    }
  };

  // Secure Parent Link Helpers
  const shareToken = classInfo.shareToken || 'c4a1-8f92a4';
  const parentPublicUrl = typeof window !== 'undefined' ? `${window.location.origin}/hw/${shareToken}` : `https://gvcn-eta.vercel.app/hw/${shareToken}`;

  const handleCopyParentLink = () => {
    const text = `Kính gửi quý phụ huynh Lớp ${classInfo.name},\nĐây là liên kết tra cứu thời khóa biểu và bài tập về nhà của các con:\n🔗 ${parentPublicUrl}\n(Liên kết bảo mật riêng của lớp, không cần đăng nhập).`;
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép đường dẫn bảo mật dành cho Phụ huynh!');
  };

  const handleRegenerateToken = () => {
    if (confirm(`Bạn có chắc muốn tạo lại Mã Bảo Mật Mới cho Lớp ${classInfo.name}? Sau khi đổi mã, liên kết cũ sẽ bị vô hiệu hóa ngay lập tức để bảo vệ thông tin học sinh.`)) {
      const newToken = regenerateClassShareToken(classInfo.id);
      toast.success(`Đã tạo mã bảo mật mới (${newToken}) thành công!`);
    }
  };

  // EXCEL EXPORT
  const handleExportExcel = () => {
    try {
      const matrixData: any[][] = [
        [`TRƯỜNG TIỂU HỌC: ${schoolInfo.name.toUpperCase()}`],
        [`THỜI KHÓA BIỂU LỚP: ${classInfo.name} - NĂM HỌC ${schoolInfo.schoolYear || '2026-2027'}`],
        [`Giáo viên chủ nhiệm: ${classInfo.teacherName} • Áp dụng: ${scope === 'FULL_YEAR' ? 'Cả năm học' : scope === 'SEMESTER_1' ? 'Học kỳ 1' : scope === 'SEMESTER_2' ? 'Học kỳ 2' : `Tuần ${customStartWeek} - ${customEndWeek}`}`],
        [],
        ['Buổi', 'Tiết', 'Khung Giờ', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'],
      ];

      PERIODS.forEach((p) => {
        const row = [
          p.session === 'MORNING' ? 'Sáng' : 'Chiều',
          `Tiết ${p.period}`,
          p.time,
          getSlot('T2', p.period)?.subjectName || 'Tự học',
          getSlot('T3', p.period)?.subjectName || 'Tự học',
          getSlot('T4', p.period)?.subjectName || 'Tự học',
          getSlot('T5', p.period)?.subjectName || 'Tự học',
          getSlot('T6', p.period)?.subjectName || 'Tự học',
        ];
        matrixData.push(row);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(matrixData);

      ws['!cols'] = [
        { wch: 10 },
        { wch: 10 },
        { wch: 16 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, `TKB_Lop_${classInfo.name}`);
      XLSX.writeFile(wb, `ThoiKhoaBieu_Lop_${classInfo.name}_${schoolInfo.schoolYear || '2026-2027'}.xlsx`);
      toast.success('Đã xuất file Excel Thời Khóa Biểu thành công!');
    } catch (e: any) {
      toast.error(`Lỗi xuất Excel: ${e.message}`);
    }
  };

  // DOWNLOAD TEMPLATE EXCEL
  const handleDownloadTemplate = () => {
    try {
      const templateData: any[][] = [
        [`MẪU NHẬP THỜI KHÓA BIỂU TIỂU HỌC - LỚP ${classInfo.name}`],
        ['Hướng dẫn: Nhập tên môn học vào các ô tương ứng từ Thứ 2 đến Thứ 6. Hệ thống tự động nhận diện tất cả môn học.'],
        [],
        ['Tiết', 'Khung Giờ', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'],
        ['Tiết 1', '07:45 - 08:20', 'Chào cờ', 'Toán', 'Tiếng Việt', 'Toán', 'Tiếng Anh'],
        ['Tiết 2', '08:25 - 09:00', 'Tiếng Việt', 'Tiếng Việt', 'Toán', 'Tiếng Việt', 'Khoa học'],
        ['Tiết 3', '09:20 - 09:55', 'Toán', 'Khoa học', 'Tiếng Anh', 'Lịch sử & Địa lý', 'Toán'],
        ['Tiết 4', '10:00 - 10:35', 'Đạo đức', 'Âm nhạc', 'Mỹ thuật', 'Tiếng Anh', 'Tiếng Việt'],
        ['Tiết 5', '14:00 - 14:35', 'Tiếng Anh', 'Tiếng Việt', 'Tin học & CN', 'Đạo đức', 'HĐ trải nghiệm'],
        ['Tiết 6', '14:40 - 15:15', 'Giáo dục thể chất', 'Tin học & CN', 'Giáo dục thể chất', 'Tự học', 'Sinh hoạt lớp'],
        ['Tiết 7', '15:30 - 16:05', 'Tự học', 'HĐ trải nghiệm', 'Tự học', 'STEM', 'Sinh hoạt lớp'],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      ws['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Mau_Thoi_Khoa_Bieu');
      XLSX.writeFile(wb, `Mau_Nhap_ThoiKhoaBieu_TieuHoc.xlsx`);
      toast.success('Đã tải xuống file mẫu Excel!');
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`);
    }
  };

  // EXCEL IMPORT PARSER
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawData || rawData.length === 0) {
          toast.error('File Excel không có dữ liệu!');
          return;
        }

        const parsedSlots: TimetableSlot[] = [];
        let headerRowIndex = -1;
        let dayColMap: { [col: number]: DayOfWeek } = {};

        for (let r = 0; r < Math.min(rawData.length, 10); r++) {
          const row = rawData[r] || [];
          for (let c = 0; c < row.length; c++) {
            const cellText = (row[c] || '').toString().toLowerCase();
            if (cellText.includes('thứ hai') || cellText === 'thứ 2' || cellText === 't2') dayColMap[c] = 'T2';
            if (cellText.includes('thứ ba') || cellText === 'thứ 3' || cellText === 't3') dayColMap[c] = 'T3';
            if (cellText.includes('thứ tư') || cellText === 'thứ 4' || cellText === 't4') dayColMap[c] = 'T4';
            if (cellText.includes('thứ năm') || cellText === 'thứ 5' || cellText === 't5') dayColMap[c] = 'T5';
            if (cellText.includes('thứ sáu') || cellText === 'thứ 6' || cellText === 't6') dayColMap[c] = 'T6';
          }
          if (Object.keys(dayColMap).length >= 3) {
            headerRowIndex = r;
            break;
          }
        }

        if (headerRowIndex >= 0) {
          let periodCounter = 1;
          for (let r = headerRowIndex + 1; r < rawData.length; r++) {
            if (periodCounter > 7) break;
            const row = rawData[r] || [];
            if (row.length === 0) continue;

            const firstCell = (row[0] || row[1] || '').toString();
            let periodNum = periodCounter;
            const matchPeriod = firstCell.match(/tiết\s*(\d)/i);
            if (matchPeriod) {
              periodNum = parseInt(matchPeriod[1], 10);
            }

            Object.entries(dayColMap).forEach(([colIdxStr, dayCode]) => {
              const colIdx = parseInt(colIdxStr, 10);
              const cellVal = row[colIdx] ? row[colIdx].toString() : '';
              const resolved = resolveSubjectFromText(cellVal, customSubjects);

              parsedSlots.push({
                id: `${classInfo.id}-${dayCode.toLowerCase()}-p${periodNum}`,
                classId: classInfo.id,
                day: dayCode,
                period: periodNum,
                session: periodNum <= 4 ? 'MORNING' : 'AFTERNOON',
                subjectCode: resolved.code,
                subjectName: resolved.name,
              });
            });

            periodCounter++;
          }
        }

        if (parsedSlots.length > 0) {
          setImportedPreviewSlots(parsedSlots);
          setIsImportModalOpen(true);
          toast.success(`Đã đọc thành công ${parsedSlots.length} tiết học từ file Excel!`);
        } else {
          toast.error('Không tìm thấy bảng thời khóa biểu phù hợp trong file Excel. Vui lòng tải file mẫu để xem định dạng!');
        }
      } catch (err: any) {
        toast.error(`Lỗi đọc file: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Apply Previewed Import
  const handleApplyImport = () => {
    if (!importedPreviewSlots || importedPreviewSlots.length === 0) return;
    setTimetable(importedPreviewSlots);
    setIsImportModalOpen(false);
    setImportedPreviewSlots(null);
    toast.success(`Đã áp dụng Thời Khóa Biểu mới cho Lớp ${classInfo.name}!`);
  };

  // Copy full week schedule for Zalo Group
  const handleCopyWeekSchedule = () => {
    let text = `📅 [THỜI KHÓA BIỂU LỚP ${classInfo.name} - NĂM HỌC ${schoolInfo.schoolYear || '2026-2027'}]\n`;
    text += `🏫 ${schoolInfo.name} - GVCN: ${classInfo.teacherName}\n`;
    text += `📌 Áp dụng: ${scope === 'FULL_YEAR' ? 'Cả năm học' : scope === 'SEMESTER_1' ? 'Học kỳ 1' : scope === 'SEMESTER_2' ? 'Học kỳ 2' : `Tuần ${customStartWeek} - ${customEndWeek}`}\n\n`;

    DAYS_OF_WEEK.forEach((d) => {
      text += `🌟 ${d.name.toUpperCase()}:\n`;
      PERIODS.forEach((p) => {
        const slot = getSlot(d.id, p.period);
        const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;
        text += `  • ${p.name} (${p.time}): ${theme ? `${theme.icon} ${slot?.subjectName}` : 'Nghỉ'}${slot?.note ? ` (Dặn: ${slot.note})` : ''}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép toàn bộ Thời khóa biểu cả tuần vào bộ nhớ tạm để dán vào Zalo!');
  };

  // Subject statistics across week
  const subjectStats = useMemo(() => {
    const counts: { [code: string]: number } = {};
    timetable.forEach((s) => {
      if (s.subjectCode && s.subjectCode !== 'TU_HOC') {
        counts[s.subjectCode] = (counts[s.subjectCode] || 0) + 1;
      }
    });
    return counts;
  }, [timetable]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER & TOP CONTROLS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full uppercase">
                Lớp {classInfo.name}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                Khối {classInfo.grade} • 2 Buổi / Ngày
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                🏫 {schoolInfo.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Quản Lý Thời Khóa Biểu & Lịch Học Trực Quan</span>
            </h1>
            <p className="text-xs text-slate-500">
              Kéo thả các môn học để đổi tiết nhanh, nhập/xuất file Excel linh hoạt cho cả học kỳ, năm học hoặc từng tuần.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex w-full sm:w-auto justify-center items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Nhập File Excel</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex w-full sm:w-auto justify-center items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex w-full sm:w-auto justify-center items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Tải file mẫu Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>File Mẫu</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWeekSchedule}
              className="inline-flex w-full sm:w-auto justify-center items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-purple-600" />
              <span>Gửi Zalo</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex w-full sm:w-auto justify-center items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In Lịch</span>
            </button>
          </div>
        </div>

        {/* 2. PRIVATE PARENT SHARE LINK BAR (BẢO MẬT & RANDOM TOKEN) */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-3.5 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900">Liên kết Phụ huynh (Bảo mật ngẫu nhiên):</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                  {shareToken}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate" title={parentPublicUrl}>
                {parentPublicUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyParentLink}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sao Chép Link Phụ Huynh</span><span className="sm:hidden">Copy Link</span>
            </button>

            <a
              href={`/hw/${shareToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors"
              title="Xem trước trang Phụ huynh"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Xem</span>
            </a>

            <button
              type="button"
              onClick={handleRegenerateToken}
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              title="Tạo mã bảo mật mới nếu muốn vô hiệu hóa link cũ"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đổi mã</span>
            </button>
          </div>
        </div>

        {/* 3. TIMETABLE SCOPE & VERSION SELECTOR */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700 whitespace-nowrap">Phạm vi áp dụng TKB:</span>
            <div className="flex overflow-x-auto no-scrollbar gap-1.5">
              {[
                { id: 'FULL_YEAR', label: '🔄 Cả Năm Học (2026-2027)' },
                { id: 'SEMESTER_1', label: '🍂 Học Kỳ 1 (Tuần 1-18)' },
                { id: 'SEMESTER_2', label: '🌸 Học Kỳ 2 (Tuần 19-35)' },
                { id: 'CUSTOM_WEEKS', label: '🎯 Giai Đoạn / Tuần Cụ Thể' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id as TimetableScope)}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    scope === item.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {scope === 'CUSTOM_WEEKS' && (
            <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-xl border border-blue-200">
              <span className="font-bold text-blue-900">Từ tuần:</span>
              <input
                type="number"
                min={1}
                max={35}
                value={customStartWeek}
                onChange={(e) => setCustomStartWeek(Number(e.target.value))}
                className="w-12 p-1 text-center font-bold border rounded bg-slate-50"
              />
              <span className="font-bold text-blue-900">đến tuần:</span>
              <input
                type="number"
                min={1}
                max={35}
                value={customEndWeek}
                onChange={(e) => setCustomEndWeek(Number(e.target.value))}
                className="w-12 p-1 text-center font-bold border rounded bg-slate-50"
              />
            </div>
          )}

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToStandard}
              className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
            >
              Mẫu Chuẩn Khối 4
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer"
            >
              Làm Sạch Lưới
            </button>
          </div>
        </div>
      </div>

      {/* 4. SUBJECT PALETTE / TOOLBOX FOR DRAG & DROP */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Kho Môn Học (Kéo Thả Vào Lịch Hoặc Nhấp Chọn Để Gán Nhanh)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Kéo thẻ môn bên dưới thả vào bất kỳ ô tiết học nào trên lưới, hoặc nhấp chọn để bật chế độ dán nhanh.
              </p>
            </div>
          </div>

          {activePaletteSubject && (
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-900 px-3 py-1.5 rounded-2xl text-xs font-bold border border-purple-300 shadow-sm animate-pulse">
              <span>Đang chọn: {activePaletteSubject.icon} {activePaletteSubject.name}</span>
              <button
                type="button"
                onClick={() => setActivePaletteSubject(null)}
                className="w-5 h-5 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center text-purple-800 cursor-pointer"
                title="Hủy chọn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Subject Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {allThemes.map((theme) => {
            const isSelected = activePaletteSubject?.code === theme.code;

            return (
              <div
                key={theme.code}
                draggable
                onDragStart={(e) => handleDragStartPalette(e, theme)}
                onClick={() => {
                  if (activePaletteSubject?.code === theme.code) {
                    setActivePaletteSubject(null);
                  } else {
                    setActivePaletteSubject(theme);
                    toast.info(`Đang chọn ${theme.name}. Nhấp vào bất kỳ tiết nào trên lưới để gán!`);
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold cursor-grab active:cursor-grabbing select-none transition-all shadow-xs ${
                  theme.bgColor
                } ${theme.textColor} ${theme.borderColor} hover:scale-105 hover:shadow-md ${
                  isSelected ? 'ring-2 ring-purple-600 scale-105 shadow-md' : ''
                }`}
                title="Kéo thả vào ô tiết hoặc nhấp để chọn dán nhanh"
              >
                <GripVertical className="w-3 h-3 opacity-40 -ml-1" />
                <span className="text-sm">{theme.icon}</span>
                <span>{theme.name}</span>
                {subjectStats[theme.code] && (
                  <span className="ml-1 bg-white/80 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black border border-current/20">
                    {subjectStats[theme.code]}t
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. MAIN TIMETABLE GRID (DRAG & DROP TIMELINE MATRIX) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Bảng Thời Khóa Biểu Lớp {classInfo.name} (35 Tiết / Tuần)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
            💡 Bạn có thể kéo thả giữa 2 tiết học để hoán đổi vị trí
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-3xl shadow-xs">
          <table className="w-full min-w-[650px] text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-2 w-14 text-center border-r border-slate-200">Tiết</th>
                <th className="py-3 px-2 w-24 text-center border-r border-slate-200">Giờ Học</th>
                {DAYS_OF_WEEK.map((d) => (
                  <th key={d.id} className="py-3 px-3 text-center border-r last:border-r-0 border-slate-200 font-black text-slate-900 text-sm">
                    {d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* MORNING SESSION HEADER */}
              <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/60">
                <td colSpan={7} className="py-1.5 px-4 font-black text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Buổi Sáng: 4 Tiết (07:45 - 10:35)</span>
                </td>
              </tr>

              {PERIODS.filter((p) => p.session === 'MORNING').map((p) => (
                <tr key={p.period} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-2 text-center font-black text-slate-600 bg-slate-50/80 border-r border-slate-200">
                    {p.name}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-500 bg-slate-50/40 border-r border-slate-200 whitespace-nowrap">
                    {p.time}
                  </td>

                  {DAYS_OF_WEEK.map((d) => {
                    const slot = getSlot(d.id, p.period);
                    const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;
                    const cellKey = `${d.id}-${p.period}`;
                    const isDragOver = dragOverCell === cellKey;

                    return (
                      <td
                        key={d.id}
                        onDragOver={(e) => handleDragOver(e, d.id, p.period)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropOnSlot(e, d.id, p.period)}
                        onClick={() => handleSlotClick(d.id, p.period)}
                        className={`p-1.5 border-r last:border-r-0 border-slate-200 transition-all ${
                          isDragOver ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <div
                          draggable
                          onDragStart={(e) => handleDragStartSlot(e, d.id, p.period)}
                          className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer min-h-[64px] flex flex-col justify-between ${
                            theme ? `${theme.bgColor} ${theme.borderColor}` : 'bg-slate-50 border-dashed border-slate-200'
                          } hover:shadow-md hover:scale-[1.02]`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="text-base shrink-0">{theme?.icon || '✏️'}</span>
                              <span className={`font-bold text-xs truncate ${theme?.textColor || 'text-slate-800'}`}>
                                {slot?.subjectName || 'Tự học / Nghỉ'}
                              </span>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(d.id, p.period);
                                }}
                                className="w-5 h-5 rounded-md bg-white/90 text-slate-600 hover:text-blue-600 flex items-center justify-center shadow-xs cursor-pointer"
                                title="Sửa chi tiết"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearSingleSlot(d.id, p.period);
                                }}
                                className="w-5 h-5 rounded-md bg-white/90 text-slate-600 hover:text-rose-600 flex items-center justify-center shadow-xs cursor-pointer"
                                title="Xóa tiết (đặt về Tự học)"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {slot?.note ? (
                            <p className="text-[10px] text-slate-500 truncate mt-1 bg-white/70 px-1.5 py-0.5 rounded">
                              📝 {slot.note}
                            </p>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-mono">
                              {p.time.split(' - ')[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* AFTERNOON SESSION HEADER */}
              <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-y border-indigo-200/60">
                <td colSpan={7} className="py-1.5 px-4 font-black text-indigo-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sunset className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Buổi Chiều: 3 Tiết (14:00 - 16:05)</span>
                </td>
              </tr>

              {PERIODS.filter((p) => p.session === 'AFTERNOON').map((p) => (
                <tr key={p.period} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-2 text-center font-black text-slate-600 bg-slate-50/80 border-r border-slate-200">
                    {p.name}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-500 bg-slate-50/40 border-r border-slate-200 whitespace-nowrap">
                    {p.time}
                  </td>

                  {DAYS_OF_WEEK.map((d) => {
                    const slot = getSlot(d.id, p.period);
                    const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;
                    const cellKey = `${d.id}-${p.period}`;
                    const isDragOver = dragOverCell === cellKey;

                    return (
                      <td
                        key={d.id}
                        onDragOver={(e) => handleDragOver(e, d.id, p.period)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropOnSlot(e, d.id, p.period)}
                        onClick={() => handleSlotClick(d.id, p.period)}
                        className={`p-1.5 border-r last:border-r-0 border-slate-200 transition-all ${
                          isDragOver ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <div
                          draggable
                          onDragStart={(e) => handleDragStartSlot(e, d.id, p.period)}
                          className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer min-h-[64px] flex flex-col justify-between ${
                            theme ? `${theme.bgColor} ${theme.borderColor}` : 'bg-slate-50 border-dashed border-slate-200'
                          } hover:shadow-md hover:scale-[1.02]`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="text-base shrink-0">{theme?.icon || '✏️'}</span>
                              <span className={`font-bold text-xs truncate ${theme?.textColor || 'text-slate-800'}`}>
                                {slot?.subjectName || 'Tự học / Nghỉ'}
                              </span>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(d.id, p.period);
                                }}
                                className="w-5 h-5 rounded-md bg-white/90 text-slate-600 hover:text-blue-600 flex items-center justify-center shadow-xs cursor-pointer"
                                title="Sửa chi tiết"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearSingleSlot(d.id, p.period);
                                }}
                                className="w-5 h-5 rounded-md bg-white/90 text-slate-600 hover:text-rose-600 flex items-center justify-center shadow-xs cursor-pointer"
                                title="Xóa tiết (đặt về Tự học)"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {slot?.note ? (
                            <p className="text-[10px] text-slate-500 truncate mt-1 bg-white/70 px-1.5 py-0.5 rounded">
                              📝 {slot.note}
                            </p>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-mono">
                              {p.time.split(' - ')[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. EDIT SLOT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sửa Tiết {editingSlot.period} - {DAYS_OF_WEEK.find((d) => d.id === editingSlot.day)?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {PERIODS.find((p) => p.period === editingSlot.period)?.time}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Môn Học *</label>
                <select
                  value={editingSlot.subjectCode}
                  onChange={(e) => {
                    const theme = getSubjectTheme(e.target.value, customSubjects);
                    setEditingSlot({
                      ...editingSlot,
                      subjectCode: theme.code,
                      subjectName: theme.name,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  {allThemes.map((theme) => (
                    <option key={theme.code} value={theme.code}>
                      {theme.icon} {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Tên Chi Tiết / Phân Môn</label>
                <input
                  type="text"
                  placeholder="VD: Tiếng Việt (Luyện từ và câu), Toán (Hình học)..."
                  value={editingSlot.subjectName}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subjectName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Giáo Viên Giảng Dạy</label>
                <input
                  type="text"
                  placeholder="Họ tên thầy cô phụ trách..."
                  value={editingSlot.teacherName}
                  onChange={(e) => setEditingSlot({ ...editingSlot, teacherName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Dặn Dò Đồ Dùng / Phòng Học</label>
                <input
                  type="text"
                  placeholder="VD: Mang compa, thước kẻ, học phòng đa năng..."
                  value={editingSlot.note}
                  onChange={(e) => setEditingSlot({ ...editingSlot, note: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  Lưu Tiết Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. EXCEL IMPORT PREVIEW MODAL */}
      {isImportModalOpen && importedPreviewSlots && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Xem Trước File Excel Đã Nhập</h3>
                  <p className="text-xs text-slate-500">{importFileName} • {importedPreviewSlots.length} tiết học được nhận diện</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-600">
                Kiểm tra ma trận thời khóa biểu nhận diện được bên dưới trước khi ghi đè vào lớp {classInfo.name}:
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full min-w-[650px] text-xs text-center border-collapse">
                  <thead className="bg-slate-100 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r">Tiết</th>
                      {DAYS_OF_WEEK.map((d) => (
                        <th key={d.id} className="p-2 border-r last:border-r-0">{d.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PERIODS.map((p) => (
                      <tr key={p.period} className="hover:bg-slate-50">
                        <td className="p-2 font-bold bg-slate-50 border-r">{p.name}</td>
                        {DAYS_OF_WEEK.map((d) => {
                          const slot = importedPreviewSlots.find((s) => s.day === d.id && s.period === p.period);
                          const theme = slot ? getSubjectTheme(slot.subjectCode, customSubjects) : null;
                          return (
                            <td key={d.id} className="p-2 border-r last:border-r-0">
                              <span className="font-semibold text-slate-800">
                                {theme?.icon} {slot?.subjectName || 'Tự học'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end space-x-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
              >
                Áp Dụng Thời Khóa Biểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
