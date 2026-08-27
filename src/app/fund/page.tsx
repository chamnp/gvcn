'use client';

import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Copy,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { FundTransaction, TransactionType } from '@/types';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const INCOME_CATEGORIES = [
  'Quỹ hội Cha Mẹ Học Sinh',
  'Đồng phục & Dụng cụ',
  'Ủng hộ & Tài trợ phong trào',
  'Thu khác',
];

const EXPENSE_CATEGORIES = [
  'Cơ sở vật chất & Rèm/Nước',
  'Hoạt động & Sự kiện (Trung Thu, 20/11)',
  'Khen thưởng & Quà tặng học sinh',
  'Vệ sinh & Y tế lớp học',
  'Chi khác',
];

export default function FundPage() {
  const { classInfo, transactions, addTransaction, updateTransaction, deleteTransaction } = useAppStore();

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FundTransaction | null>(null);

  // Form State
  const [formType, setFormType] = useState<TransactionType>('INCOME');
  const [formCategory, setFormCategory] = useState(INCOME_CATEGORIES[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPayer, setFormPayer] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.payerOrReceiver && t.payerOrReceiver.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Open Modal
  const handleOpenAdd = (type: TransactionType = 'INCOME') => {
    setEditingTx(null);
    setFormType(type);
    setFormCategory(type === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setFormTitle('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPayer('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: FundTransaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormTitle(tx.title);
    setFormAmount(tx.amount);
    setFormDate(tx.date);
    setFormPayer(tx.payerOrReceiver || '');
    setFormNotes(tx.notes || '');
    setIsModalOpen(true);
  };

  // Save Transaction
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount || Number(formAmount) <= 0) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và số tiền hợp lệ');
      return;
    }

    if (editingTx) {
      updateTransaction({
        ...editingTx,
        type: formType,
        category: formCategory,
        title: formTitle.trim(),
        amount: Number(formAmount),
        date: formDate,
        payerOrReceiver: formPayer.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      toast.success('Đã cập nhật khoản thu/chi thành công!');
    } else {
      addTransaction({
        type: formType,
        category: formCategory,
        title: formTitle.trim(),
        amount: Number(formAmount),
        date: formDate,
        payerOrReceiver: formPayer.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      toast.success(
        formType === 'INCOME'
          ? `Đã ghi nhận khoản thu: +${Number(formAmount).toLocaleString('vi-VN')} đ`
          : `Đã ghi nhận khoản chi: -${Number(formAmount).toLocaleString('vi-VN')} đ`
      );
    }
    setIsModalOpen(false);
  };

  // Delete
  const handleDelete = (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa giao dịch "${title}" không?`)) {
      deleteTransaction(id);
      toast.success(`Đã xóa khoản: ${title}`);
    }
  };

  // Copy Zalo Report
  const handleCopyZaloReport = () => {
    const incomeList = transactions
      .filter((t) => t.type === 'INCOME')
      .map(
        (t, idx) =>
          `  ${idx + 1}. ${t.title}: +${t.amount.toLocaleString('vi-VN')}đ (${t.date.split('-').reverse().join('/')})`
      )
      .join('\n');

    const expenseList = transactions
      .filter((t) => t.type === 'EXPENSE')
      .map(
        (t, idx) =>
          `  ${idx + 1}. ${t.title}: -${t.amount.toLocaleString('vi-VN')}đ (${t.date.split('-').reverse().join('/')}${t.notes ? ` - ${t.notes}` : ''})`
      )
      .join('\n');

    const text = `💰 [BÁO CÁO CÔNG KHAI THU CHI QUỸ LỚP ${classInfo.name}]
🏫 Trường: ${classInfo.schoolName} - Năm học ${classInfo.schoolYear}
👩‍🏫 GVCN: ${classInfo.teacherName}

📊 TỔNG KẾT TÀI CHÍNH:
📥 Tổng số tiền đã thu: ${totalIncome.toLocaleString('vi-VN')} VNĐ
📤 Tổng số tiền đã chi: ${totalExpense.toLocaleString('vi-VN')} VNĐ
💵 SỐ DƯ HIỆN TẠI TRONG QUỸ: ${balance.toLocaleString('vi-VN')} VNĐ

--------------------------------
📥 DANH SÁCH CÁC KHOẢN THU:
${incomeList || '  (Chưa có khoản thu nào)'}

--------------------------------
📤 DANH SÁCH CÁC KHOẢN CHI:
${expenseList || '  (Chưa có khoản chi nào)'}

Kính gửi quý phụ huynh nắm rõ tình hình thu chi của lớp. Mọi thắc mắc xin vui lòng liên hệ Ban đại diện CMHS hoặc GVCN. Trân trọng!`;

    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép báo cáo quỹ lớp! Bạn có thể dán trực tiếp vào nhóm Zalo Phụ huynh.');
  };

  // Export Excel Report
  const handleExportExcel = () => {
    const headers = ['STT', 'Ngày', 'Loại Giao Dịch', 'Danh Mục', 'Nội Dung Thu / Chi', 'Số Tiền Thu (+)', 'Số Tiền Chi (-)', 'Người Giao Dịch', 'Ghi Chú'];

    const rows = transactions.map((t, idx) => [
      idx + 1,
      t.date,
      t.type === 'INCOME' ? 'Thu' : 'Chi',
      t.category,
      t.title,
      t.type === 'INCOME' ? t.amount : '',
      t.type === 'EXPENSE' ? t.amount : '',
      t.payerOrReceiver || '',
      t.notes || '',
    ]);

    const titleRows = [
      [`BÁO CÁO THU CHI QUỸ LỚP ${classInfo.name} - NĂM HỌC ${classInfo.schoolYear}`],
      [`Trường: ${classInfo.schoolName} - GVCN: ${classInfo.teacherName}`],
      [`Tổng Thu: ${totalIncome.toLocaleString('vi-VN')} đ | Tổng Chi: ${totalExpense.toLocaleString('vi-VN')} đ | Số Dư: ${balance.toLocaleString('vi-VN')} đ`],
      [],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `QuyLop_${classInfo.name}`);
    XLSX.writeFile(workbook, `Bao_Cao_Quy_Lop_${classInfo.name}_${classInfo.schoolYear}.xlsx`);
    toast.success('Đã xuất file Excel báo cáo quỹ lớp!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-600" />
            <span>Quản Lý Quỹ Lớp {classInfo.name}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận thu chi minh bạch, theo dõi số dư tự động và xuất báo cáo công khai gửi Zalo phụ huynh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyZaloReport}
            className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <Copy className="w-4 h-4 text-blue-600" />
            <span>Sao chép Zalo Phụ Huynh</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => handleOpenAdd('INCOME')}
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thu Quỹ</span>
          </button>

          <button
            onClick={() => handleOpenAdd('EXPENSE')}
            className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>- Chi Quỹ</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Thu</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              +{totalIncome.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {transactions.filter((t) => t.type === 'INCOME').length} khoản thu
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng Chi</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              -{totalExpense.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {transactions.filter((t) => t.type === 'EXPENSE').length} khoản chi
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Số Dư Quỹ Hiện Tại</p>
            <h3 className={`text-2xl font-black mt-1 ${balance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
              {balance.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {balance >= 0 ? 'Quỹ hoạt động bình thường' : 'Cần bổ sung ngân quỹ'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo nội dung thu/chi, danh mục, người giao dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('INCOME')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Khoản Thu
          </button>
          <button
            onClick={() => setTypeFilter('EXPENSE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Khoản Chi
          </button>
        </div>
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
                <th className="py-3 px-4">Nội Dung Thu / Chi</th>
                <th className="py-3 px-4">Danh Mục</th>
                <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                <th className="py-3 px-4">Người Giao Dịch / Ghi Chú</th>
                <th className="py-3 px-4 text-right w-24">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy khoản thu/chi nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                      {tx.date.split('-').reverse().join('/')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.type === 'INCOME' ? 'Thu (+)' : 'Chi (-)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{tx.title}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-black font-mono text-sm ${
                        tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {tx.amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      <div>
                        {tx.payerOrReceiver && (
                          <p className="font-semibold text-slate-800">{tx.payerOrReceiver}</p>
                        )}
                        {tx.notes && <p className="text-[11px] text-slate-400">{tx.notes}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id, tx.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Add / Edit Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900">
              {editingTx
                ? `Chỉnh Sửa Khoản ${editingTx.type === 'INCOME' ? 'Thu' : 'Chi'}`
                : `Thêm Khoản ${formType === 'INCOME' ? 'Thu Quỹ Mới' : 'Chi Quỹ Mới'}`}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('INCOME');
                    setFormCategory(INCOME_CATEGORIES[0]);
                  }}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    formType === 'INCOME'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Khoản Thu (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('EXPENSE');
                    setFormCategory(EXPENSE_CATEGORIES[0]);
                  }}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    formType === 'EXPENSE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Khoản Chi (-)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội Dung Giao Dịch (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thu quỹ phụ huynh Đợt 1 / Mua máy lọc nước..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số Tiền (VNĐ) (*)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    placeholder="500000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-black font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày Giao Dịch</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Danh Mục Phân Loại</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {(formType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {formType === 'INCOME' ? 'Người Nộp / Đơn Vị Nộp' : 'Người Nhận / Cửa Hàng Chi'}
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ban đại diện CMHS / Nhà sách Giáo dục..."
                  value={formPayer}
                  onChange={(e) => setFormPayer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Thêm (Hóa đơn, chứng từ)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Có hóa đơn VAT số 00123 / Mua tặng 30 em..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow-xs ${
                    formType === 'INCOME'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingTx ? 'Lưu Thay Đổi' : formType === 'INCOME' ? 'Ghi Nhận Khoản Thu' : 'Ghi Nhận Khoản Chi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
