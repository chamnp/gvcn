'use client';

import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Download,
  Copy,
  Receipt,
  Calendar,
  DollarSign,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ClassFundTransaction } from '@/types';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function FinancePage() {
  const { fundTransactions, addTransaction, deleteTransaction, classInfo, students } = useAppStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  const [formData, setFormData] = useState<{
    type: 'INCOME' | 'EXPENSE';
    category: string;
    title: string;
    amount: number;
    date: string;
    notes: string;
  }>({
    type: 'INCOME',
    category: 'Quỹ phụ huynh',
    title: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const totalIncome = fundTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = fundTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const filteredTransactions = fundTransactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.amount <= 0) {
      toast.error('Vui lòng nhập đầy đủ nội dung và số tiền hợp lệ');
      return;
    }

    addTransaction(formData);
    toast.success('Đã thêm giao dịch quỹ lớp thành công!');
    setIsAddModalOpen(false);
    setFormData({
      type: 'INCOME',
      category: 'Quỹ phụ huynh',
      title: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa khoản "${title}"?`)) {
      deleteTransaction(id);
      toast.success('Đã xóa giao dịch');
    }
  };

  const handleExportExcel = () => {
    const headers = ['STT', 'Ngày Tháng', 'Loại', 'Danh Mục', 'Nội Dung', 'Số Tiền (VNĐ)', 'Ghi Chú'];
    const rows = fundTransactions.map((t, idx) => [
      idx + 1,
      t.date,
      t.type === 'INCOME' ? 'THU' : 'CHI',
      t.category,
      t.title,
      t.amount,
      t.notes || '',
    ]);

    const titleRows = [
      [`BÁO CÁO THU CHI QUỸ LỚP ${classInfo.name} - NĂM HỌC ${classInfo.schoolYear}`],
      [`Tổng thu: ${totalIncome.toLocaleString('vi-VN')} đ | Tổng chi: ${totalExpense.toLocaleString('vi-VN')} đ | Số dư hiện tại: ${balance.toLocaleString('vi-VN')} đ`],
      [],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ThuChiQuyLop');
    XLSX.writeFile(workbook, `Bao_Cao_Thu_Chi_Quy_Lop_${classInfo.name}_${classInfo.schoolYear}.xlsx`);
    toast.success('Đã xuất file báo cáo thu chi quỹ lớp!');
  };

  const handleCopyZaloSummary = () => {
    const text = `💰 [BÁO CÁO CÔNG KHAI QUỸ LỚP ${classInfo.name}]
🏫 Trường: ${classInfo.schoolName} - Năm học: ${classInfo.schoolYear}
📅 Tính đến ngày: ${new Date().toLocaleDateString('vi-VN')}

🟢 TỔNG THU: ${totalIncome.toLocaleString('vi-VN')} đ
🔴 TỔNG CHI: ${totalExpense.toLocaleString('vi-VN')} đ
💎 SỐ DƯ HIỆN TẠI: ${balance.toLocaleString('vi-VN')} đ

Mọi khoản thu - chi đều có chứng từ hóa đơn đầy đủ và được lưu trữ minh bạch. Kính gửi quý phụ huynh theo dõi!`;

    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép báo cáo! Bạn có thể dán vào nhóm Zalo Phụ huynh.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-purple-600" />
            <span>Quản Lý Thu Chi & Quỹ Lớp {classInfo.name}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi chép minh bạch các khoản thu - chi của Hội cha mẹ học sinh và hoạt động ngoại khóa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyZaloSummary}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>Sao chép gửi Zalo PH</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Phiếu Thu / Chi</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Số dư */}
        <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-5 rounded-2xl shadow-md space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-200">Số Dư Quỹ Hiện Tại</p>
          <h2 className="text-3xl font-black">{balance.toLocaleString('vi-VN')} <span className="text-sm font-normal text-purple-200">VNĐ</span></h2>
          <p className="text-xs text-purple-200 flex items-center gap-1 pt-1 border-t border-purple-600/50">
            <span>Sĩ số đóng góp: <strong>{students.length}</strong> học sinh</span>
          </p>
        </div>

        {/* Tổng thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Các Khoản Thu</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              +{totalIncome.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {fundTransactions.filter((t) => t.type === 'INCOME').length} giao dịch thu
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Tổng chi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Các Khoản Chi</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              -{totalExpense.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {fundTransactions.filter((t) => t.type === 'EXPENSE').length} giao dịch chi
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Tất cả ({fundTransactions.length})
        </button>
        <button
          onClick={() => setFilterType('INCOME')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filterType === 'INCOME' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Khoản Thu
        </button>
        <button
          onClick={() => setFilterType('EXPENSE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filterType === 'EXPENSE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Khoản Chi
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-28">Ngày</th>
                <th className="py-3 px-4 w-24 text-center">Loại</th>
                <th className="py-3 px-4 w-36">Danh Mục</th>
                <th className="py-3 px-4">Nội Dung Chi Tiết</th>
                <th className="py-3 px-4 text-right w-36">Số Tiền (VNĐ)</th>
                <th className="py-3 px-4 text-right w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx, idx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{tx.date}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type === 'INCOME' ? 'THU' : 'CHI'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{tx.category}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{tx.title}</p>
                    {tx.notes && <p className="text-[11px] text-slate-500 mt-0.5">{tx.notes}</p>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                    <span className={tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}>
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {tx.amount.toLocaleString('vi-VN')} đ
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(tx.id, tx.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Transaction */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Thêm Giao Dịch Quỹ Lớp</h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại Giao Dịch</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                  >
                    <option value="INCOME">🟢 Khoản Thu (+)</option>
                    <option value="EXPENSE">🔴 Khoản Chi (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Tháng</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Danh Mục</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quỹ phụ huynh, Dụng cụ học tập, Khen thưởng, Liên hoan..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội Dung Thu / Chi (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Mua quà tặng ngày 20/11 cho các thầy cô bộ môn"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số Tiền (VNĐ) (*)</label>
                <input
                  type="number"
                  required
                  step="1000"
                  min="1000"
                  placeholder="VD: 500000"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú / Chứng Từ</label>
                <input
                  type="text"
                  placeholder="VD: Có hóa đơn đỏ siêu thị Coopmart..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                >
                  Lưu Giao Dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
