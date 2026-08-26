'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Student } from '@/types';
import { toast } from 'sonner';

export default function SeatingChartPage() {
  const { students, updateSeatPosition, classInfo, getStudentStars } = useAppStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const rows = classInfo.seatingGridRows || 5;
  const cols = classInfo.seatingGridCols || 8;

  // Lấy học sinh ở vị trí row, col
  const getStudentAt = (row: number, col: number) => {
    return students.find((s) => s.seatRow === row && s.seatCol === col);
  };

  // Học sinh chưa được xếp chỗ
  const unassignedStudents = students.filter(
    (s) => s.seatRow === undefined || s.seatRow === null || s.seatRow >= rows || s.seatCol >= cols
  );

  // Xử lý click chọn đổi chỗ
  const handleCellClick = (row: number, col: number) => {
    const studentInCell = getStudentAt(row, col);

    if (selectedStudentId) {
      // Đang có 1 học sinh được chọn, thực hiện chuyển/đổi chỗ
      updateSeatPosition(selectedStudentId, row, col);
      toast.success('Đã cập nhật vị trí chỗ ngồi!');
      setSelectedStudentId(null);
    } else if (studentInCell) {
      // Chọn học sinh này để chuẩn bị đổi chỗ
      setSelectedStudentId(studentInCell.id);
      toast.info(`Đang chọn ${studentInCell.fullName}. Click vào bàn khác để đổi chỗ.`);
    }
  };

  // Tự động xếp chỗ ngẫu nhiên
  const handleRandomizeSeats = () => {
    if (confirm('Bạn có muốn tự động xáo trộn và xếp lại vị trí chỗ ngồi cho cả lớp không?')) {
      const shuffled = [...students].sort(() => Math.random() - 0.5);
      shuffled.forEach((s, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        updateSeatPosition(s.id, r, c);
      });
      toast.success('Đã xếp ngẫu nhiên sơ đồ lớp!');
    }
  };

  // Xếp ưu tiên cận thị lên 2 hàng đầu
  const handleOptimizeForVision = () => {
    const nearsighted = students.filter((s) => (s.healthNotes || '').toLowerCase().includes('cận'));
    const normal = students.filter((s) => !(s.healthNotes || '').toLowerCase().includes('cận'));
    
    const combined = [...nearsighted, ...normal];
    combined.forEach((s, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      updateSeatPosition(s.id, r, c);
    });
    toast.success('Đã ưu tiên học sinh cận thị ngồi các bàn phía trên!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Grid3X3 className="w-7 h-7 text-blue-600" />
            <span>Sơ Đồ Chỗ Ngồi Lớp {classInfo.name}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Click vào học sinh rồi click vào vị trí bàn mới để đổi chỗ nhanh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOptimizeForVision}
            className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <Eye className="w-4 h-4 text-amber-600" />
            <span>Ưu tiên Cận thị bàn đầu</span>
          </button>

          <button
            onClick={handleRandomizeSeats}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <Shuffle className="w-4 h-4 text-slate-600" />
            <span>Xáo trộn ngẫu nhiên</span>
          </button>
        </div>
      </div>

      {/* Podium / Black Board Indicator */}
      <div className="bg-slate-800 text-white text-center py-2.5 rounded-xl shadow-xs font-bold text-xs tracking-wider flex items-center justify-center space-x-2">
        <span>🎓 BỤC GIẢNG & BẢNG ĐEN LỚP HỌC 🎓</span>
      </div>

      {/* Grid Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 overflow-x-auto">
        <div className="min-w-[760px] space-y-4">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center space-x-3">
              {/* Row Label */}
              <div className="w-16 text-xs font-bold text-slate-400 uppercase text-right shrink-0">
                Bàn {r + 1}
              </div>

              {/* Seats in Row */}
              <div className="grid grid-cols-8 gap-2.5 flex-1">
                {Array.from({ length: cols }).map((_, c) => {
                  const student = getStudentAt(r, c);
                  const isSelected = student && student.id === selectedStudentId;
                  const isTarget = selectedStudentId && !isSelected;
                  const isNearsighted = student?.healthNotes?.toLowerCase().includes('cận');
                  const stars = student ? getStudentStars(student.id) : 0;

                  return (
                    <button
                      key={c}
                      onClick={() => handleCellClick(r, c)}
                      className={`h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500 bg-blue-50 shadow-md scale-105 z-10'
                          : isTarget
                          ? 'border-dashed border-blue-300 bg-blue-50/40 hover:bg-blue-100/50 hover:border-blue-500'
                          : student
                          ? student.gender === 'Nam'
                            ? 'border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:shadow-xs'
                            : 'border-pink-200 bg-pink-50/50 hover:border-pink-400 hover:shadow-xs'
                          : 'border-dashed border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-300'
                      }`}
                    >
                      {student ? (
                        <>
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                                student.gender === 'Nam'
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-pink-200 text-pink-800'
                              }`}
                            >
                              {c + 1}
                            </span>
                            <div className="flex items-center space-x-1">
                              {isNearsighted && (
                                <span title="Cận thị" className="text-amber-600 text-xs">
                                  👓
                                </span>
                              )}
                              {stars > 0 && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1 rounded flex items-center">
                                  ⭐{stars}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="my-auto">
                            <p className="font-bold text-slate-900 text-xs truncate leading-tight">
                              {student.fullName}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate font-mono">
                              {student.studentCode}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-200/50 pt-1">
                            <span>{student.isBoarding ? '🍱 Bán trú' : '🏠 Về trưa'}</span>
                            {student.tags?.[0] && (
                              <span className="font-semibold text-indigo-600 truncate max-w-[50px]">
                                {student.tags[0]}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                          Bàn trống
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guide Note */}
      <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 flex items-start space-x-3 border border-slate-200">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-800">Hướng dẫn sử dụng Sơ đồ lớp:</h4>
          <p className="mt-0.5 leading-relaxed">
            • <strong>Đổi chỗ</strong>: Nhấp chuột vào một học sinh, sau đó nhấp vào ô bàn muốn chuyển đến (vị trí cũ và mới sẽ tự động hoán đổi).<br />
            • <strong>Quy ước màu</strong>: Màu xanh dương nhạt là Học sinh Nam, Màu hồng nhạt là Học sinh Nữ, Biểu tượng kính 👓 là học sinh cận thị cần ưu tiên bàn đầu.
          </p>
        </div>
      </div>
    </div>
  );
}
