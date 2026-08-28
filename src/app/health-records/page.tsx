'use client';

import React, { useState, useMemo } from 'react';
import {
  Heart,
  Table,
  FileSpreadsheet,
  Layers,
  Activity,
  Eye,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Edit,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { HealthRecord } from '@/types';
import { HealthRecordEditorModal } from '@/components/health/health-record-editor-modal';
import { toast } from 'sonner';

export default function HealthRecordsPage() {
  const { healthRecords, addHealthRecord, updateHealthRecord, deleteHealthRecord, students, classInfo } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'VISION' | 'ALLERGY' | 'BMI'>('ALL');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchData, setBatchData] = useState<Record<string, { heightCm: number; weightKg: number; hasVision: boolean; allergy: string }>>({});

  const filteredRecords = useMemo(() => {
    return healthRecords.filter((r) => {
      const matchSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (filterTab === 'VISION') return r.hasVisionDefect;
      if (filterTab === 'ALLERGY') return r.allergies && r.allergies.length > 0;
      if (filterTab === 'BMI') return r.bmiCategory !== 'BINH_THUONG';
      return true;
    });
  }, [healthRecords, searchQuery, filterTab]);

  const handleOpenBatchModal = () => {
    const initial: Record<string, { heightCm: number; weightKg: number; hasVision: boolean; allergy: string }> = {};
    students.forEach((st) => {
      const existing = healthRecords.find((r) => r.studentId === st.id);
      initial[st.id] = {
        heightCm: existing ? existing.heightCm : 135,
        weightKg: existing ? existing.weightKg : 30,
        hasVision: existing ? existing.hasVisionDefect : (st.healthNotes || '').toLowerCase().includes('cận'),
        allergy: existing && existing.allergies ? existing.allergies.join(', ') : '',
      };
    });
    setBatchData(initial);
    setIsBatchModalOpen(true);
  };

  const handleSaveBatch = () => {
    students.forEach((st) => {
      const d = batchData[st.id];
      if (!d) return;
      const heightM = d.heightCm / 100;
      const bmi = Number((d.weightKg / (heightM * heightM || 1)).toFixed(1));
      let bmiCategory: any = 'BINH_THUONG';
      if (bmi < 14) bmiCategory = 'SUY_DINH_DUONG';
      else if (bmi >= 19 && bmi < 22) bmiCategory = 'NGUY_CO_THUA_CAN';
      else if (bmi >= 22) bmiCategory = 'BEO_PHI';

      const allergiesArr = d.allergy ? d.allergy.split(',').map((s) => s.trim()).filter(Boolean) : [];
      const existing = healthRecords.find((r) => r.studentId === st.id);

      if (existing) {
        updateHealthRecord({
          ...existing,
          heightCm: d.heightCm,
          weightKg: d.weightKg,
          bmi,
          bmiCategory,
          hasVisionDefect: d.hasVision,
          leftEye: d.hasVision ? '7/10' : '10/10',
          rightEye: d.hasVision ? '7/10' : '10/10',
          allergies: allergiesArr,
          checkupDate: new Date().toISOString().split('T')[0],
        });
      } else {
        addHealthRecord({
          studentId: st.id,
          studentName: st.fullName,
          classId: classInfo.id,
          checkupDate: new Date().toISOString().split('T')[0],
          heightCm: d.heightCm,
          weightKg: d.weightKg,
          bmi,
          bmiCategory,
          leftEye: d.hasVision ? '7/10' : '10/10',
          rightEye: d.hasVision ? '7/10' : '10/10',
          hasVisionDefect: d.hasVision,
          allergies: allergiesArr,
        });
      }
    });
    setIsBatchModalOpen(false);
    toast.success(`Đã lưu cập nhật sức khỏe cho toàn bộ ${students.length} học sinh!`);
  };

  const visionDefectCount = healthRecords.filter((r) => r.hasVisionDefect).length;
  const allergyCount = healthRecords.filter((r) => r.allergies && r.allergies.length > 0).length;
  const abnormalBMICount = healthRecords.filter((r) => r.bmiCategory !== 'BINH_THUONG').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <span>🩺 Y Tế & Chăm Sóc Bán Trú</span>
            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
              Khám Định Kỳ
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Sổ Theo Dõi Sức Khỏe & Thể Chất Học Sinh
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            Quản lý chỉ số BMI, thị lực cận thị học đường, tiền sử dị ứng thực phẩm và dặn dò bán trú lớp {classInfo.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setIsEditorOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white text-emerald-950 font-black text-xs shadow-lg hover:bg-emerald-50 transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>+ Nhập Hồ Sơ Sức Khỏe</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Đã Khám Sức Khỏe</p>
          <h3 className="text-2xl font-black text-slate-900">{healthRecords.length}/{students.length}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Đạt {Math.round((healthRecords.length / (students.length || 1)) * 100)}%</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-blue-200 bg-blue-50/30 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-blue-600 uppercase">👓 Cận Thị Học Đường</p>
          <h3 className="text-2xl font-black text-blue-700">{visionDefectCount}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Cần ngồi bàn trên</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-200 bg-rose-50/30 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-rose-600 uppercase">⚠️ Dị Ứng Thực Phẩm</p>
          <h3 className="text-2xl font-black text-rose-700">{allergyCount}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Lưu ý nhà bếp bán trú</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200 bg-amber-50/30 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-amber-600 uppercase">⚖️ Cần Chỉnh BMI</p>
          <h3 className="text-2xl font-black text-amber-700">{abnormalBMICount}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Thừa cân / suy dinh dưỡng</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: `Tất Cả (${healthRecords.length})` },
            { id: 'VISION', label: `👓 Cận Thị (${visionDefectCount})` },
            { id: 'ALLERGY', label: `⚠️ Dị Ứng (${allergyCount})` },
            { id: 'BMI', label: `⚖️ Thể Chất (${abnormalBMICount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as 'ALL' | 'VISION' | 'ALLERGY' | 'BMI')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-black text-[10px]">
              <tr>
                <th className="p-4">Học Sinh</th>
                <th className="p-4 text-center">Chiều Cao</th>
                <th className="p-4 text-center">Cân Nặng</th>
                <th className="p-4 text-center">BMI</th>
                <th className="p-4 text-center">Thị Lực (T/P)</th>
                <th className="p-4">Dị Ứng & Ghi Chú Bán Trú</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Chưa có dữ liệu khám sức khỏe phù hợp
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-black text-slate-900">
                      {r.studentName}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800">
                      {r.heightCm} cm
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800">
                      {r.weightKg} kg
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-black text-[10px] ${
                        r.bmiCategory === 'BINH_THUONG'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.bmiCategory === 'SUY_DINH_DUONG'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.bmi} ({r.bmiCategory === 'BINH_THUONG' ? 'Chuẩn' : r.bmiCategory === 'SUY_DINH_DUONG' ? 'Gầy' : 'Thừa cân'})
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        r.hasVisionDefect ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-700'
                      }`}>
                        {r.leftEye} / {r.rightEye}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      {r.allergies && r.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.allergies.map((a, i) => (
                            <span key={i} className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              ⚠️ {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Không có dị ứng</span>
                      )}
                      {r.medicalNotes && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">{r.medicalNotes}</p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(r);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Xóa hồ sơ sức khỏe của em ${r.studentName}?`)) {
                              deleteHealthRecord(r.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HealthRecordEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRecord(null);
        }}
        onSave={(newRec) => addHealthRecord(newRec)}
        onUpdate={(updated) => updateHealthRecord(updated)}
        initialRecord={editingRecord}
        students={students}
        classId={classInfo.id}
      />

      {/* Batch Health Editor Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in" onClick={() => setIsBatchModalOpen(false)}>
          <div className="bg-white max-w-5xl w-full h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Bảng Nhập Nhanh Thể Lực & Sức Khỏe Toàn Lớp ({students.length} Học Sinh)</span>
                </h3>
                <p className="text-xs text-emerald-100">Nhập chiều cao, cân nặng và tự động tính BMI cho cả lớp</p>
              </div>
              <button type="button" onClick={() => setIsBatchModalOpen(false)} className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">Họ và Tên</th>
                    <th className="p-3 w-28 text-center">Chiều Cao (cm)</th>
                    <th className="p-3 w-28 text-center">Cân Nặng (kg)</th>
                    <th className="p-3 w-28 text-center">Chỉ Số BMI</th>
                    <th className="p-3 w-24 text-center">Cận Thị</th>
                    <th className="p-3">Dị Ứng / Ghi Chú Ăn Uống</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st, idx) => {
                    const d = batchData[st.id] || { heightCm: 135, weightKg: 30, hasVision: false, allergy: '' };
                    const heightM = (d.heightCm || 135) / 100;
                    const bmi = Number(((d.weightKg || 30) / (heightM * heightM || 1)).toFixed(1));
                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{st.fullName}</td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min={90}
                            max={190}
                            value={d.heightCm}
                            onChange={(e) => setBatchData({ ...batchData, [st.id]: { ...d, heightCm: Number(e.target.value) } })}
                            className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min={15}
                            max={90}
                            value={d.weightKg}
                            onChange={(e) => setBatchData({ ...batchData, [st.id]: { ...d, weightKg: Number(e.target.value) } })}
                            className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs font-bold"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            bmi < 14 ? 'bg-amber-100 text-amber-800' : bmi >= 22 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {bmi}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={d.hasVision}
                            onChange={(e) => setBatchData({ ...batchData, [st.id]: { ...d, hasVision: e.target.checked } })}
                            className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            placeholder="VD: Dị ứng tôm, đậu phộng..."
                            value={d.allergy}
                            onChange={(e) => setBatchData({ ...batchData, [st.id]: { ...d, allergy: e.target.value } })}
                            className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button type="button" onClick={() => setIsBatchModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200">Đóng</button>
              <button type="button" onClick={handleSaveBatch} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu Toàn Bộ Số Liệu ({students.length} Học Sinh)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
