'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Grid3X3,
  Users,
  Shuffle,
  Eye,
  Heart,
  Award,
  Sparkles,
  HelpCircle,
  Download,
  RotateCcw,
  Printer,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  UserCheck,
  UserX,
  Layers,
  Check,
  X,
  Compass,
  Layout,
  Crown,
  ChevronRight,
  RefreshCw,
  Share2,
  Plus,
  Minus,
  Settings2,
  Armchair,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Student } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export interface TeamDef {
  id: number;
  name: string;
  mascot: string;
  mascotName: string;
  colorName: string;
  borderClass: string;
  bgBadge: string;
  headerBg: string;
  cardBg: string;
  gradient: string;
}

export const ALL_TEAMS_PRESET: TeamDef[] = [
  {
    id: 1,
    name: 'Tổ 1',
    mascot: '🦁',
    mascotName: 'Sư Tử',
    colorName: 'Vàng Hổ Phách',
    borderClass: 'border-amber-300 hover:border-amber-500',
    bgBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    headerBg: 'from-amber-500 to-orange-500 text-white',
    cardBg: 'from-amber-50/70 via-white to-orange-50/30',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 2,
    name: 'Tổ 2',
    mascot: '🦅',
    mascotName: 'Đại Bàng',
    colorName: 'Xanh Đại Dương',
    borderClass: 'border-blue-300 hover:border-blue-500',
    bgBadge: 'bg-blue-100 text-blue-900 border-blue-300',
    headerBg: 'from-blue-600 to-indigo-600 text-white',
    cardBg: 'from-blue-50/70 via-white to-indigo-50/30',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 3,
    name: 'Tổ 3',
    mascot: '🐬',
    mascotName: 'Cá Heo',
    colorName: 'Xanh Ngọc Lục',
    borderClass: 'border-teal-300 hover:border-teal-500',
    bgBadge: 'bg-teal-100 text-teal-900 border-teal-300',
    headerBg: 'from-teal-600 to-emerald-600 text-white',
    cardBg: 'from-teal-50/70 via-white to-emerald-50/30',
    gradient: 'from-teal-500 to-emerald-500',
  },
  {
    id: 4,
    name: 'Tổ 4',
    mascot: '🐼',
    mascotName: 'Gấu Trúc',
    colorName: 'Tím Mộng Mơ',
    borderClass: 'border-purple-300 hover:border-purple-500',
    bgBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    headerBg: 'from-purple-600 to-pink-600 text-white',
    cardBg: 'from-purple-50/70 via-white to-pink-50/30',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 5,
    name: 'Tổ 5',
    mascot: '🐯',
    mascotName: 'Hổ Con',
    colorName: 'Đỏ Lửa',
    borderClass: 'border-rose-300 hover:border-rose-500',
    bgBadge: 'bg-rose-100 text-rose-900 border-rose-300',
    headerBg: 'from-rose-500 to-red-600 text-white',
    cardBg: 'from-rose-50/70 via-white to-red-50/30',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    id: 6,
    name: 'Tổ 6',
    mascot: '🦊',
    mascotName: 'Cáo Nâu',
    colorName: 'Cam Nắng',
    borderClass: 'border-orange-300 hover:border-orange-500',
    bgBadge: 'bg-orange-100 text-orange-900 border-orange-300',
    headerBg: 'from-orange-500 to-amber-600 text-white',
    cardBg: 'from-orange-50/70 via-white to-amber-50/30',
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    id: 7,
    name: 'Tổ 7',
    mascot: '🦄',
    mascotName: 'Kỳ Lân',
    colorName: 'Hồng Phấn',
    borderClass: 'border-fuchsia-300 hover:border-fuchsia-500',
    bgBadge: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
    headerBg: 'from-fuchsia-500 to-purple-600 text-white',
    cardBg: 'from-fuchsia-50/70 via-white to-purple-50/30',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
  {
    id: 8,
    name: 'Tổ 8',
    mascot: '🐉',
    mascotName: 'Rồng Xanh',
    colorName: 'Xanh Lá',
    borderClass: 'border-emerald-300 hover:border-emerald-500',
    bgBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    headerBg: 'from-emerald-600 to-cyan-600 text-white',
    cardBg: 'from-emerald-50/70 via-white to-cyan-50/30',
    gradient: 'from-emerald-600 to-cyan-600',
  },
];

export default function SeatingChartPage() {
  const {
    students,
    healthRecords,
    updateSeatPosition,
    swapSeatPositions,
    updateStudent,
    classInfo,
    updateClass,
    getStudentStars,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'SEATING' | 'TEAMS' | 'SETTINGS'>('SEATING');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // 1. Flexible Number of Teams (from classInfo.numberOfTeams or default 4, range 2-8)
  const numTeams = classInfo.numberOfTeams && classInfo.numberOfTeams >= 2 && classInfo.numberOfTeams <= 8
    ? classInfo.numberOfTeams
    : 4;

  // 2. Flexible Seats Per Desk (1: Bàn đơn, 2: Bàn đôi, 3: Bàn 3 chỗ, 4: Bàn 4 chỗ)
  const seatsPerDesk = classInfo.seatsPerDesk && classInfo.seatsPerDesk >= 1 && classInfo.seatsPerDesk <= 4
    ? classInfo.seatsPerDesk
    : 2;

  const activeTeams = useMemo(() => {
    return ALL_TEAMS_PRESET.slice(0, numTeams);
  }, [numTeams]);

  // Seating grid dimensions:
  // Rows: default 5 rows
  // Cols: numTeams * seatsPerDesk (e.g. 4 teams * 3 seats = 12 cols; 3 teams * 3 seats = 9 cols; 4 teams * 2 seats = 8 cols)
  const [customRows, setCustomRows] = useState(classInfo.seatingGridRows || 5);
  const rows = customRows;
  const cols = numTeams * seatsPerDesk;

  // Lấy học sinh ở vị trí row, col
  const getStudentAt = (row: number, col: number) => {
    return students.find((s) => s.seatRow === row && s.seatCol === col);
  };

  // Học sinh chưa được xếp chỗ
  const unassignedStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.seatRow === undefined ||
        s.seatRow === null ||
        s.seatRow < 0 ||
        s.seatRow >= rows ||
        s.seatCol === undefined ||
        s.seatCol === null ||
        s.seatCol < 0 ||
        s.seatCol >= cols
    );
  }, [students, rows, cols]);

  // Determine Team based on seat column index
  const getTeamForSeat = (col: number): TeamDef => {
    const teamIdx = Math.min(numTeams - 1, Math.floor(col / seatsPerDesk));
    return activeTeams[teamIdx] || activeTeams[0];
  };

  // Handle number of teams change
  const handleChangeNumTeams = (newCount: number) => {
    const count = Math.max(2, Math.min(8, newCount));
    updateClass({
      ...classInfo,
      numberOfTeams: count,
      seatingGridCols: count * seatsPerDesk,
    });
    toast.success(`Đã cập nhật lớp thành ${count} Tổ thi đua!`);
  };

  // Handle seats per desk change (1, 2, 3, 4 chỗ/bàn)
  const handleChangeSeatsPerDesk = (newSeats: number) => {
    const sCount = Math.max(1, Math.min(4, newSeats));
    updateClass({
      ...classInfo,
      seatsPerDesk: sCount,
      seatingGridCols: numTeams * sCount,
    });
    toast.success(`Đã chuyển cấu hình thành Bàn ${sCount} chỗ (${sCount} học sinh/bàn)! 🎉`);
  };

  // Click handler to swap / assign seats
  const handleCellClick = (row: number, col: number) => {
    const studentInCell = getStudentAt(row, col);

    if (selectedStudentId) {
      if (selectedStudentId === studentInCell?.id) {
        setSelectedStudentId(null);
        return;
      }

      const selectedStudent = students.find((s) => s.id === selectedStudentId);

      if (studentInCell && selectedStudent) {
        // Swap existing seats
        if (
          selectedStudent.seatRow !== undefined &&
          selectedStudent.seatRow >= 0 &&
          selectedStudent.seatRow < rows &&
          selectedStudent.seatCol !== undefined &&
          selectedStudent.seatCol >= 0 &&
          selectedStudent.seatCol < cols
        ) {
          swapSeatPositions(selectedStudentId, studentInCell.id);
          toast.success(`Đã hoán đổi chỗ ngồi giữa em ${selectedStudent.fullName} và ${studentInCell.fullName}!`);
        } else {
          // Put selected in cell, move previous to unassigned
          updateSeatPosition(studentInCell.id, -1, -1);
          updateSeatPosition(selectedStudentId, row, col);
          toast.success(`Đã xếp ${selectedStudent.fullName} vào bàn (Hàng ${row + 1}, Cột ${col + 1})!`);
        }
      } else if (selectedStudent) {
        // Move into empty desk
        updateSeatPosition(selectedStudentId, row, col);
        toast.success(`Đã xếp ${selectedStudent.fullName} vào bàn (Hàng ${row + 1}, Cột ${col + 1})!`);
      }
      setSelectedStudentId(null);
    } else if (studentInCell) {
      setSelectedStudentId(studentInCell.id);
      toast.info(`Đang chọn ${studentInCell.fullName}. Click vào bàn khác để đổi chỗ.`);
    }
  };

  // 1. Tự động xếp chỗ ngẫu nhiên
  const handleRandomizeSeats = () => {
    if (confirm('Bạn có muốn tự động xáo trộn và xếp lại vị trí chỗ ngồi cho cả lớp không?')) {
      const shuffled = [...students].sort(() => Math.random() - 0.5);
      const maxDesks = rows * cols;
      shuffled.forEach((s, idx) => {
        if (idx < maxDesks) {
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          updateSeatPosition(s.id, r, c);
        } else {
          updateSeatPosition(s.id, -1, -1);
        }
      });
      confetti({ particleCount: 80, spread: 60 });
      toast.success('Đã xếp ngẫu nhiên sơ đồ lớp!');
    }
  };

  // 2. Ưu tiên cận thị / thị lực ngồi 2 hàng đầu
  const handleOptimizeForVision = () => {
    const nearsighted = students.filter((s) => {
      const rec = (healthRecords || []).find((h) => h.studentId === s.id);
      const isDefect = rec ? rec.hasVisionDefect : false;
      const note = (s.healthNotes || '').toLowerCase();
      return isDefect || note.includes('cận') || note.includes('loạn') || note.includes('kính');
    });
    const normal = students.filter((s) => {
      const rec = (healthRecords || []).find((h) => h.studentId === s.id);
      const isDefect = rec ? rec.hasVisionDefect : false;
      const note = (s.healthNotes || '').toLowerCase();
      return !isDefect && !note.includes('cận') && !note.includes('loạn') && !note.includes('kính');
    });

    const combined = [...nearsighted, ...normal];
    const maxDesks = rows * cols;
    combined.forEach((s, idx) => {
      if (idx < maxDesks) {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        updateSeatPosition(s.id, r, c);
      } else {
        updateSeatPosition(s.id, -1, -1);
      }
    });
    confetti({ particleCount: 60 });
    toast.success(`Đã ưu tiên ${nearsighted.length} học sinh cận thị ngồi các bàn phía trên!`);
  };

  // 3. Xếp xen kẽ Nam - Nữ (Đôi bạn cùng tiến)
  const handleOptimizeBoyGirlPairing = () => {
    const boys = students.filter((s) => s.gender === 'Nam');
    const girls = students.filter((s) => s.gender === 'Nữ');

    const pairedList: Student[] = [];
    const maxLen = Math.max(boys.length, girls.length);
    for (let i = 0; i < maxLen; i++) {
      if (boys[i]) pairedList.push(boys[i]);
      if (girls[i]) pairedList.push(girls[i]);
    }

    const maxDesks = rows * cols;
    pairedList.forEach((s, idx) => {
      if (idx < maxDesks) {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        updateSeatPosition(s.id, r, c);
      } else {
        updateSeatPosition(s.id, -1, -1);
      }
    });
    confetti({ particleCount: 70 });
    toast.success('Đã xếp xen kẽ Nam - Nữ (Đôi bạn cùng tiến)!');
  };

  // 4. Xoay vòng đổi dãy bàn định kỳ (Tránh lệch mắt theo khuyến nghị y tế)
  const handleRotateAisles = () => {
    if (confirm('Xoay vòng dãy bàn (Dãy 1 sang Dãy 2, Dãy 2 sang Dãy 3,... Dãy cuối về Dãy 1)?')) {
      const shiftCols = seatsPerDesk; // mỗi dãy dịch chuyển đúng số ghế của 1 bàn
      students.forEach((s) => {
        if (s.seatRow !== undefined && s.seatRow >= 0 && s.seatCol !== undefined && s.seatCol >= 0) {
          const newCol = (s.seatCol + shiftCols) % cols;
          updateSeatPosition(s.id, s.seatRow, newCol);
        }
      });
      confetti({ particleCount: 80, spread: 70 });
      toast.success('Đã xoay vòng đổi dãy bàn cho cả lớp thành công! 🔄');
    }
  };

  // 5. Tự động đồng bộ Phân Tổ theo Sơ đồ chỗ ngồi hiện tại
  const handleSyncTeamsFromSeating = () => {
    if (confirm(`Bạn có muốn gán lại ${numTeams} Tổ cho tất cả học sinh tương ứng với Dãy bàn đang ngồi không?`)) {
      students.forEach((s) => {
        if (s.seatCol !== undefined && s.seatCol >= 0) {
          const team = getTeamForSeat(s.seatCol);
          const otherTags = (s.tags || []).filter((t) => !t.includes('Tổ '));
          const updatedTags = [...otherTags, `Tổ ${team.id}`];
          updateStudent({
            ...s,
            tags: updatedTags,
          });
        }
      });
      confetti({ particleCount: 100 });
      toast.success(`Đã đồng bộ nhãn ${numTeams} Tổ cho cả lớp theo Dãy bàn sơ đồ! 🎉`);
    }
  };

  // 6. Chia đều học sinh vào N Tổ cân bằng
  const handleAutoBalanceTeams = () => {
    if (confirm(`Chia đều cân bằng ${students.length} học sinh vào ${numTeams} Tổ (cân đối Nam/Nữ)?`)) {
      const boys = students.filter((s) => s.gender === 'Nam');
      const girls = students.filter((s) => s.gender === 'Nữ');

      const shuffledBoys = [...boys].sort(() => Math.random() - 0.5);
      const shuffledGirls = [...girls].sort(() => Math.random() - 0.5);

      const balancedStudents: Student[] = [];
      let bIdx = 0, gIdx = 0;
      while (bIdx < shuffledBoys.length || gIdx < shuffledGirls.length) {
        if (bIdx < shuffledBoys.length) balancedStudents.push(shuffledBoys[bIdx++]);
        if (gIdx < shuffledGirls.length) balancedStudents.push(shuffledGirls[gIdx++]);
      }

      balancedStudents.forEach((st, idx) => {
        const teamId = (idx % numTeams) + 1;
        const otherTags = (st.tags || []).filter((t) => !t.includes('Tổ '));
        const updatedTags = [...otherTags, `Tổ ${teamId}`];
        updateStudent({
          ...st,
          tags: updatedTags,
        });
      });

      confetti({ particleCount: 90 });
      toast.success(`Đã chia đều cả lớp vào ${numTeams} Tổ cân bằng Nam - Nữ!`);
    }
  };

  // Compute team members for Team Management Tab
  const teamGroups = useMemo(() => {
    return activeTeams.map((t) => {
      const members = students.filter((s, idx) => {
        // First check tag
        const tagTeam = (s.tags || []).find((tag) => tag.includes('Tổ '));
        if (tagTeam) {
          return tagTeam.includes(`Tổ ${t.id}`);
        }
        // Then check seatCol
        if (s.seatCol !== undefined && s.seatCol >= 0) {
          return getTeamForSeat(s.seatCol).id === t.id;
        }
        return (idx % numTeams) + 1 === t.id;
      });

      return {
        ...t,
        members,
      };
    });
  }, [students, activeTeams, numTeams, cols, seatsPerDesk]);

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-300">
      {/* 1. Header Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl shadow-md shadow-blue-500/25 ring-4 ring-blue-50">
            🪑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Sơ Đồ Chỗ Ngồi & Phân Chia Tổ
              </h1>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                Lớp {classInfo.name} ({numTeams} Dãy • Bàn {seatsPerDesk} chỗ)
              </span>
              <span className="hidden sm:inline-flex bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {students.length - unassignedStudents.length}/{students.length} Đã Xếp Chỗ
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kéo thả / 1-Click hoán đổi chỗ ngồi, hỗ trợ bàn 1-2-3-4 chỗ, tự động ưu tiên cận thị và liên thông {numTeams} Tổ
            </p>
          </div>
        </div>

        {/* Action Buttons & Flexible Config Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Seats per Desk Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
              <Armchair className="w-3.5 h-3.5" />
              <span>Ghế/Bàn:</span>
            </span>
            {[
              { id: 1, label: '1 Chỗ' },
              { id: 2, label: '2 Chỗ (Đôi)' },
              { id: 3, label: '3 Chỗ' },
              { id: 4, label: '4 Chỗ' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => handleChangeSeatsPerDesk(st.id)}
                className={`px-2 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  seatsPerDesk === st.id
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
                title={`Cấu hình Bàn ${st.id} chỗ ngồi`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Quick Number of Teams Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 px-2">Số Tổ:</span>
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => handleChangeNumTeams(count)}
                className={`px-2 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  numTeams === count
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
                title={`Chia lớp thành ${count} Tổ`}
              >
                {count}
              </button>
            ))}
          </div>

          <button
            onClick={handleSyncTeamsFromSeating}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Đồng bộ Tổ cho cả lớp theo Dãy bàn đang ngồi"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Gán Tổ Theo Dãy</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="In sơ đồ lớp khổ giấy A4"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In Sơ Đồ A4</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Optimization Presets Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-3.5 sm:p-4 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-base shrink-0">
            ✨
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">
              Thuật toán xếp chỗ tự động ({numTeams} Dãy bàn • Bàn {seatsPerDesk} chỗ • Tổng {rows * cols} chỗ):
            </span>
            <span className="text-[11px] text-slate-300 block truncate">Chọn tiêu chí sư phạm phù hợp cho lớp học</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleOptimizeForVision}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ưu Tiên Cận Thị</span>
          </button>

          <button
            onClick={handleOptimizeBoyGirlPairing}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Xen Kẽ Nam - Nữ</span>
          </button>

          <button
            onClick={handleRotateAisles}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Xoay Vòng Đổi Dãy</span>
          </button>

          <button
            onClick={handleAutoBalanceTeams}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Chia đều cả lớp vào các tổ cân bằng giới tính"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Chia Đều {numTeams} Tổ</span>
          </button>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('SEATING')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'SEATING'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span>Sơ Đồ Lớp Học ({numTeams} Dãy Bàn • Bàn {seatsPerDesk} Chỗ)</span>
        </button>

        <button
          onClick={() => setActiveTab('TEAMS')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'TEAMS'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản Lý {numTeams} Tổ ({students.length} Học Sinh)</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'SETTINGS'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Cấu Hình Bàn Ghế & Số Chỗ</span>
        </button>
      </div>

      {/* TAB 1: SƠ ĐỒ LỚP HỌC TRỰC QUAN THEO N TỔ VÀ K CHỖ/BÀN */}
      {activeTab === 'SEATING' && (
        <div className="space-y-4">
          {/* Teacher Desk & Podium Area */}
          <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white p-3 rounded-2xl shadow-sm text-center relative overflow-hidden flex items-center justify-between px-6">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <span>🚪 CỬA RA VÀO</span>
            </div>

            <div className="flex items-center space-x-2 font-black text-xs tracking-wider text-amber-300">
              <span>🎓 BỤC GIẢNG & BẢNG ĐEN LỚP HỌC 🎓</span>
            </div>

            <div className="text-[11px] font-bold text-amber-400 bg-white/10 px-3 py-1 rounded-xl border border-white/20">
              👩‍🏫 BÀN GIÁO VIÊN
            </div>
          </div>

          {/* Dynamic N Aisles Column Header Labels */}
          <div
            className="grid gap-3 text-center text-xs font-bold"
            style={{ gridTemplateColumns: `repeat(${numTeams}, minmax(0, 1fr))` }}
          >
            {activeTeams.map((team) => (
              <div
                key={team.id}
                className={`p-2 rounded-2xl bg-gradient-to-r ${team.headerBg} shadow-xs flex items-center justify-center space-x-1.5 truncate`}
              >
                <span>{team.mascot}</span>
                <span className="font-black truncate">DÃY {team.id} — {team.name.toUpperCase()} (Bàn {seatsPerDesk} chỗ)</span>
              </div>
            ))}
          </div>

          {/* Seating Desks Grid with Dynamic Blocks */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 overflow-x-auto">
            <div className="min-w-[850px] space-y-3">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex items-center space-x-3">
                  {/* Row Label */}
                  <div className="w-14 text-xs font-bold text-slate-400 uppercase text-right shrink-0">
                    Hàng {r + 1}
                  </div>

                  {/* N Blocks of Desks */}
                  <div
                    className="grid gap-3 flex-1"
                    style={{ gridTemplateColumns: `repeat(${numTeams}, minmax(0, 1fr))` }}
                  >
                    {activeTeams.map((team, blockIdx) => {
                      const startCol = blockIdx * seatsPerDesk;
                      const seatIndices = Array.from({ length: seatsPerDesk }, (_, i) => startCol + i);

                      return (
                        <div
                          key={blockIdx}
                          className={`p-2 rounded-2xl border-2 bg-gradient-to-br ${team.cardBg} ${team.borderClass} shadow-2xs grid gap-1.5`}
                          style={{ gridTemplateColumns: `repeat(${seatsPerDesk}, minmax(0, 1fr))` }}
                        >
                          {/* Seat slots (1, 2, 3 or 4 seats per desk) */}
                          {seatIndices.map((col, slotIdx) => {
                            const student = getStudentAt(r, col);
                            const isSelected = student && student.id === selectedStudentId;
                            const isTarget = selectedStudentId && !isSelected;
                            const isNearsighted =
                              student?.healthNotes?.toLowerCase().includes('cận') ||
                              (healthRecords || []).find((h) => h.studentId === student?.id)?.hasVisionDefect;
                            const stars = student ? getStudentStars(student.id) : 0;

                            return (
                              <button
                                key={col}
                                onClick={() => handleCellClick(r, col)}
                                className={`h-24 p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative cursor-pointer ${
                                  isSelected
                                    ? 'border-blue-600 ring-4 ring-blue-400 bg-blue-100 shadow-md scale-105 z-10'
                                    : isTarget
                                    ? 'border-dashed border-blue-400 bg-blue-50/60 hover:bg-blue-100 hover:border-blue-600'
                                    : student
                                    ? student.gender === 'Nam'
                                      ? 'border-blue-200 bg-white/90 hover:border-blue-400 hover:shadow-xs'
                                      : 'border-pink-200 bg-white/90 hover:border-pink-400 hover:shadow-xs'
                                    : 'border-dashed border-slate-300 bg-white/40 hover:bg-white text-slate-400'
                                }`}
                              >
                                {student ? (
                                  <>
                                    <div className="flex items-center justify-between w-full">
                                      <span
                                        className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                                          student.gender === 'Nam'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-pink-100 text-pink-800'
                                        }`}
                                      >
                                        {student.gender === 'Nam' ? '👦' : '👧'} G{slotIdx + 1}
                                      </span>

                                      <div className="flex items-center space-x-0.5">
                                        {isNearsighted && (
                                          <span title="Học sinh cận thị" className="text-xs">
                                            👓
                                          </span>
                                        )}
                                        {stars > 0 && (
                                          <span className="bg-amber-100 text-amber-900 text-[8px] sm:text-[9px] font-black px-1 py-0.2 rounded">
                                            ⭐{stars}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="my-auto">
                                      <p className="font-bold text-slate-900 text-[11px] sm:text-xs truncate leading-snug" title={student.fullName}>
                                        {student.fullName}
                                      </p>
                                      <p className="text-[8px] sm:text-[9px] text-slate-400 truncate font-mono">
                                        {student.studentCode}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between text-[7px] sm:text-[8px] text-slate-400 border-t border-slate-100 pt-0.5">
                                      <span className="truncate">{student.isBoarding ? '🍱 Bán trú' : '🏠 Về'}</span>
                                      <span className="font-bold text-slate-500">B{r + 1}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-semibold">
                                    + Ghế {slotIdx + 1}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unassigned Students Section */}
          {unassignedStudents.length > 0 && (
            <div className="bg-amber-50 rounded-3xl p-4 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-700" />
                  Học sinh chưa xếp chỗ ({unassignedStudents.length} em):
                </span>
                <span className="text-[11px] text-amber-700 font-medium">Click chọn học sinh rồi click vào bàn để xếp chỗ</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {unassignedStudents.map((st) => {
                  const isSelected = st.id === selectedStudentId;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        if (selectedStudentId === st.id) {
                          setSelectedStudentId(null);
                        } else {
                          setSelectedStudentId(st.id);
                          toast.info(`Đang chọn ${st.fullName}. Click vào bàn trống để xếp chỗ.`);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs scale-105'
                          : st.gender === 'Nam'
                          ? 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                          : 'bg-white text-pink-800 border-pink-200 hover:bg-pink-50'
                      }`}
                    >
                      <span>{st.fullName}</span>
                      <span className="text-[10px] opacity-75 font-mono">({st.studentCode})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUẢN LÝ DYNAMIC N TỔ (TEAM MANAGEMENT HUB) */}
      {activeTab === 'TEAMS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Danh Sách {numTeams} Tổ Thi Đua & Hoạt Động Nhóm ({students.length} Học Sinh)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các tổ thi đua được đồng bộ tự động với Sổ Nề Nếp, Bảng Thi Đua và Bàn Điều Khiển Lớp Học
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleAutoBalanceTeams}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Shuffle className="w-3.5 h-3.5 text-purple-600" />
                <span>Chia Đều {numTeams} Tổ</span>
              </button>

              <button
                onClick={handleSyncTeamsFromSeating}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gán Theo Sơ Đồ</span>
              </button>
            </div>
          </div>

          {/* Dynamic N Teams Columns Grid */}
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(4, numTeams)}, minmax(0, 1fr))`,
            }}
          >
            {teamGroups.map((team) => (
              <div
                key={team.id}
                className={`bg-gradient-to-br ${team.cardBg} rounded-3xl p-4 border-2 ${team.borderClass} shadow-xs space-y-3 flex flex-col justify-between`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{team.mascot}</span>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{team.name} ({team.mascotName})</h4>
                        <span className="text-[10px] text-slate-500">{team.members.length} Học sinh</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${team.bgBadge}`}>
                      {team.colorName}
                    </span>
                  </div>

                  {/* Student List in Team */}
                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {team.members.map((st, idx) => (
                      <div
                        key={st.id}
                        className="bg-white/90 p-2.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="min-w-0 flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">{st.fullName}</p>
                            <p className="text-[9px] text-slate-400 font-mono">
                              {st.studentCode} • {st.seatRow !== undefined && st.seatRow >= 0 ? `Bàn ${st.seatRow + 1}` : 'Chưa xếp'}
                            </p>
                          </div>
                        </div>

                        {/* Quick Team Switcher */}
                        <select
                          value={team.id}
                          onChange={(e) => {
                            const newTeamId = Number(e.target.value);
                            const otherTags = (st.tags || []).filter((t) => !t.includes('Tổ '));
                            const updatedTags = [...otherTags, `Tổ ${newTeamId}`];
                            updateStudent({
                              ...st,
                              tags: updatedTags,
                            });
                            toast.success(`Đã chuyển em ${st.fullName} sang Tổ ${newTeamId}!`);
                          }}
                          className="text-[10px] font-bold bg-slate-100 rounded-lg px-1.5 py-1 border border-slate-200 cursor-pointer"
                        >
                          {activeTeams.map((at) => (
                            <option key={at.id} value={at.id}>
                              {at.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CẤU HÌNH KIỂU BỐ TRÍ BÀN GHẾ & SỐ CHỖ */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Cấu Hình Số Tổ, Số Ghế Mỗi Bàn & Kích Thước Lớp {classInfo.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tùy biến số lượng tổ thi đua và số chỗ ngồi mỗi bàn (Bàn đơn, Bàn đôi, Bàn 3 chỗ, Bàn 4 chỗ) để chuẩn khớp với phòng học thực tế.
            </p>
          </div>

          {/* Choose Seats Per Desk */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Kiểu bàn học trong lớp (Hiện tại: <strong className="text-amber-600">Bàn {seatsPerDesk} Chỗ</strong>):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 1, title: 'Bàn Đơn (1 Chỗ)', desc: '1 học sinh / bàn (mô hình trường quốc tế)', badge: '1 Chỗ' },
                { id: 2, title: 'Bàn Đôi (2 Chỗ)', desc: '2 học sinh / bàn (phổ biến nhất)', badge: 'Khuyên Dùng' },
                { id: 3, title: 'Bàn 3 Chỗ', desc: '3 học sinh / bàn (lớp sĩ số đông 45-55 em)', badge: '3 Chỗ Phổ Biến' },
                { id: 4, title: 'Bàn 4 Chỗ', desc: '4 học sinh ghép cụm nhóm VNEN/STEM', badge: 'Bàn Cụm' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleChangeSeatsPerDesk(st.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    seatsPerDesk === st.id
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-400'
                      : 'border-slate-200 hover:border-amber-300 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {st.badge}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-1">{st.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{st.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Choose Number of Teams */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Số lượng Tổ trong lớp (Hiện tại: <strong className="text-blue-600">{numTeams} Tổ</strong>):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[2, 3, 4, 5, 6].map((count) => {
                const teamExample = ALL_TEAMS_PRESET.slice(0, count);
                return (
                  <button
                    key={count}
                    onClick={() => handleChangeNumTeams(count)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col justify-between items-center space-y-1.5 ${
                      numTeams === count
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-400'
                        : 'border-slate-200 hover:border-blue-300 bg-slate-50/50'
                    }`}
                  >
                    <span className="font-black text-sm text-slate-900">{count} TỔ</span>
                    <div className="flex items-center space-x-0.5 text-sm">
                      {teamExample.map((t) => (
                        <span key={t.id}>{t.mascot}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500">{count * seatsPerDesk} Ghế / Hàng</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Rows */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số hàng bàn (Hàng ghế từ trên xuống)</label>
              <input
                type="number"
                min={3}
                max={8}
                value={customRows}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCustomRows(val);
                  updateClass({ ...classInfo, seatingGridRows: val });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tổng sức chứa chỗ ngồi</label>
              <div className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-100 text-slate-700 flex items-center justify-between">
                <span>{rows} Hàng × {numTeams} Dãy × {seatsPerDesk} Chỗ</span>
                <span className="text-blue-600 font-black">{rows * cols} Chỗ ngồi</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
