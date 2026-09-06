'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Sparkles,
  Plus,
  Search,
  Star,
  CheckCircle2,
  RotateCcw,
  Users,
  Award,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ClassroomBook, BookBorrowLog, BookCategory } from '@/types';
import { FeatureGate } from '@/components/layout/feature-gate';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function ReadingCornerPage() {
  const { classroomBooks, addClassroomBook, bookBorrowLogs, borrowBook, returnBook, students, classInfo } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ClassroomBook | null>(null);
  const [selectedLog, setSelectedLog] = useState<BookBorrowLog | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [studentReview, setStudentReview] = useState('');
  const [ratingStars, setRatingStars] = useState(5);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookCategory, setNewBookCategory] = useState<BookCategory>('VAN_HOC');
  const [newBookQuantity, setNewBookQuantity] = useState(1);

  const filteredBooks = useMemo(() => {
    return classroomBooks.filter((b) => {
      const matchCat = selectedCategory === 'ALL' || b.category === selectedCategory;
      const matchSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [classroomBooks, selectedCategory, searchQuery]);

  const activeBorrows = bookBorrowLogs.filter((l) => l.status === 'BORROWED');
  const returnedLogsWithReview = bookBorrowLogs.filter((l) => l.status === 'RETURNED' && l.studentReview);

  const studentBorrowCounts = useMemo(() => {
    const counts: Record<string, { studentName: string; count: number }> = {};
    bookBorrowLogs.forEach((l) => {
      if (!counts[l.studentId]) counts[l.studentId] = { studentName: l.studentName, count: 0 };
      counts[l.studentId].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [bookBorrowLogs]);

  const handleBorrowSubmit = () => {
    if (!selectedBook || !selectedStudentId) return;
    const st = students.find((s) => s.id === selectedStudentId);
    if (!st) return;

    borrowBook({
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      studentId: st.id,
      studentName: st.fullName,
      classId: classInfo.id,
      borrowDate: new Date().toISOString().split('T')[0],
    });

    setIsBorrowModalOpen(false);
  };

  const handleAddBookSubmit = () => {
    if (!newBookTitle.trim() || !newBookAuthor.trim()) return;
    addClassroomBook({
      classId: classInfo.id,
      code: `S${classroomBooks.length + 1}`.padStart(4, '0'),
      title: newBookTitle.trim(),
      author: newBookAuthor.trim(),
      category: newBookCategory,
      totalCopies: newBookQuantity,
      availableCopies: newBookQuantity,
      coverEmoji: '📖',
    });
    setIsAddBookOpen(false);
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookQuantity(1);
    toast.success(`Đã thêm sách "${newBookTitle.trim()}" vào tủ sách lớp!`);
  };

  const handleReturnSubmit = () => {
    if (!selectedLog) return;
    returnBook(selectedLog.id, studentReview, ratingStars);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setIsReturnModalOpen(false);
    setStudentReview('');
  };

  return (
    <FeatureGate feature="readingCorner" featureName="Góc Đọc Sách & Văn Hóa Đọc">
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <span>📚 Phong Trào Tiết Đọc Thư Viện</span>
            <span className="bg-white text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">
              Văn Hóa Đọc
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Tủ Sách & Góc Đọc Lớp Học Thông Minh
          </h1>

          <p className="text-xs sm:text-sm text-amber-100 font-medium">
            Quản lý mượn trả truyện, viết nhật ký cảm nhận sách và vinh danh Đại sứ Văn hóa Đọc Lớp {classInfo.name}.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-xs font-bold text-amber-100">Đang Mượn Đọc</span>
            <p className="text-2xl font-black text-white">{activeBorrows.length} cuốn</p>
          </div>
        </div>
      </div>

      {studentBorrowCounts.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2">
            <span>👑 Bảng Vinh Danh Đại Sứ Văn Hóa Đọc Tháng:</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {studentBorrowCounts.map((amb, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <div>
                    <h5 className="font-black text-xs text-slate-900">{amb.studentName}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold">Đã đọc <strong>{amb.count} cuốn sách</strong></p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Top {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'Tất Cả Sách' },
            { id: 'VAN_HOC', label: '📖 Văn Học' },
            { id: 'KHOA_HOC', label: '🔬 Khoa Học' },
            { id: 'TRUYEN_TRANH', label: '🎨 Truyện Tranh' },
            { id: 'KY_NANG_SONG', label: '🌟 Kỹ Năng' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên sách, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{book.coverEmoji}</span>
                <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {book.code}
                </span>
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900 line-clamp-2 leading-tight">
                  {book.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Tác giả: {book.author}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-semibold">Tồn kho:</span>
                <span className={`font-black ${book.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {book.availableCopies} / {book.totalCopies} cuốn
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={book.availableCopies === 0}
              onClick={() => {
                setSelectedBook(book);
                setIsBorrowModalOpen(true);
              }}
              className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{book.availableCopies > 0 ? 'Mượn Sách Này' : 'Đã Hết Sách'}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <span>📖 Danh Sách Học Sinh Đang Mượn Đọc ({activeBorrows.length}):</span>
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {activeBorrows.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Hiện không có học sinh nào đang mượn sách.</p>
            ) : (
              activeBorrows.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate">{log.bookTitle}</p>
                    <p className="text-[11px] text-slate-500">Người mượn: <strong>{log.studentName}</strong> • {log.borrowDate}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLog(log);
                      setIsReturnModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Trả Sách
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <span>🌟 Nhật Ký Cảm Nhận Sách Của Các Em:</span>
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {returnedLogsWithReview.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có cảm nhận sách nào được gửi.</p>
            ) : (
              returnedLogsWithReview.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">{rev.studentName}</span>
                    <div className="flex text-amber-400 text-xs">
                      {Array.from({ length: rev.ratingStars || 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-amber-900">"{rev.bookTitle}"</p>
                  <p className="text-[11px] text-slate-700 italic">"{rev.studentReview}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isBorrowModalOpen && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-black text-base text-slate-900">Mượn Sách: {selectedBook.title}</h3>
            <div>
              <label className="block font-bold text-xs text-slate-700 mb-1">Chọn Học Sinh Mượn:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.studentCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBorrowModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBorrowSubmit}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                Xác Nhận Mượn Sách
              </button>
            </div>
          </div>
        </div>
      )}

      {isReturnModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-black text-base text-slate-900">Trả Sách: {selectedLog.bookTitle}</h3>
            <p className="text-xs text-slate-500">Học sinh: <strong>{selectedLog.studentName}</strong></p>

            <div>
              <label className="block font-bold text-xs text-slate-700 mb-1">Đánh Giá Cuốn Sách:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatingStars(s)}
                    className={`text-2xl cursor-pointer ${s <= ratingStars ? 'text-amber-400' : 'text-slate-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-xs text-slate-700 mb-1">Cảm Nhận Của Em Sau Khi Đọc (1-2 câu):</label>
              <textarea
                rows={3}
                placeholder="VD: Cuốn sách rất bổ ích, giúp em hiểu thêm nhiều điều..."
                value={studentReview}
                onChange={(e) => setStudentReview(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReturnSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer"
              >
                Hoàn Tất Trả Sách 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {isAddBookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setIsAddBookOpen(false)}>
          <div className="bg-white max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <h3 className="font-black text-base">📚 Thêm Sách Mới Vào Tủ Sách Lớp</h3>
              <p className="text-xs text-emerald-100">Bổ sung sách vào kho lưu trữ của lớp</p>
            </div>
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold mb-1">Tên Sách (*):</label>
                <input type="text" value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} placeholder="VD: Dế Mèn Phiêu Lưu Ký..." className="w-full p-2.5 rounded-xl border border-slate-300 text-xs" />
              </div>
              <div>
                <label className="block font-bold mb-1">Tác Giả (*):</label>
                <input type="text" value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} placeholder="VD: Tô Hoài..." className="w-full p-2.5 rounded-xl border border-slate-300 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Thể Loại:</label>
                  <select value={newBookCategory} onChange={(e) => setNewBookCategory(e.target.value as BookCategory)} className="w-full p-2.5 rounded-xl border border-slate-300 text-xs">
                    <option value="VAN_HOC">Văn Học</option>
                    <option value="KHOA_HOC">Khoa Học</option>
                    <option value="TRUYEN_TRANH">Truyện Tranh / Cổ Tích</option>
                    <option value="KY_NANG_SONG">Kỹ Năng Sống</option>
                    <option value="LICH_SU">Lịch Sử</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Số Lượng:</label>
                  <input type="number" min={1} max={20} value={newBookQuantity} onChange={(e) => setNewBookQuantity(Number(e.target.value))} className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-center" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between">
              <button type="button" onClick={() => setIsAddBookOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">Hủy</button>
              <button type="button" onClick={handleAddBookSubmit} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thêm Sách</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </FeatureGate>
  );
}
