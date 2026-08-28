import * as XLSX from 'xlsx';
import { GradeLevel, TermType } from '@/types';
import { ExamQuestion, TT27Level, QuestionType } from '@/lib/question-bank-data';

// 1. SMART TEXT PARSER FOR PASTED WORD / ZALO EXAMS
export function parseRawTextToQuestions(
  rawText: string,
  subjectCode: string,
  grade: GradeLevel,
  term: TermType
): ExamQuestion[] {
  if (!rawText || !rawText.trim()) return [];

  const parsedQuestions: ExamQuestion[] = [];
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  let currentQ: Partial<ExamQuestion> | null = null;
  let currentOptions: string[] = [];
  let currentContentLines: string[] = [];

  const flushCurrent = () => {
    if (currentQ && currentContentLines.length > 0) {
      const fullContent = currentContentLines.join(' ');
      
      // Determine Level based on keywords if not set
      let level: TT27Level = currentQ.level || 'MUC_1';
      if (fullContent.toLowerCase().includes('mức 3') || fullContent.toLowerCase().includes('nâng cao') || fullContent.toLowerCase().includes('thuận tiện')) {
        level = 'MUC_3';
      } else if (fullContent.toLowerCase().includes('mức 2') || fullContent.toLowerCase().includes('kết nối') || fullContent.toLowerCase().includes('tính diện tích') || fullContent.toLowerCase().includes('đặt tính')) {
        level = 'MUC_2';
      } else if (fullContent.toLowerCase().includes('mức 1') || fullContent.toLowerCase().includes('nhận biết')) {
        level = 'MUC_1';
      }

      // Determine Type (Multiple choice if options exist)
      const hasOptions = currentOptions.length >= 2;
      const type: QuestionType = hasOptions ? 'MULTIPLE_CHOICE' : 'ESSAY';

      // Determine points (default 1.0 for MC, 2.0 for Essay)
      let points = currentQ.points || (type === 'MULTIPLE_CHOICE' ? 1.0 : 2.0);
      if (level === 'MUC_3' && type === 'ESSAY') points = 2.5;

      parsedQuestions.push({
        id: 'q-import-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        subjectCode: currentQ.subjectCode || subjectCode,
        grade: currentQ.grade || grade,
        term: currentQ.term || term,
        strand: currentQ.strand || (subjectCode === 'TOAN' ? 'Số và phép tính' : 'Luyện từ và câu'),
        level,
        type,
        content: fullContent.replace(/^Câu\s*\d+[:.]?\s*(\(.*?\))?\s*/i, '').trim(),
        options: hasOptions ? currentOptions : undefined,
        correctAnswer: currentQ.correctAnswer || (hasOptions ? 'A' : 'Lời giải chi tiết theo thang điểm.'),
        points,
        explanation: currentQ.explanation || '',
        createdAt: new Date().toISOString(),
      });
    }
    currentQ = null;
    currentOptions = [];
    currentContentLines = [];
  };

  for (const line of lines) {
    const isNewQuestionHeader = /^(câu|bài|question|câu hỏi)\s*\d+[:.]?/i.test(line);

    if (isNewQuestionHeader) {
      flushCurrent();
      currentQ = {
        subjectCode,
        grade,
        term,
        strand: subjectCode === 'TOAN' ? 'Số và phép tính' : 'Luyện từ và câu',
        level: 'MUC_1',
      };

      // Check level in header
      if (/mức 3/i.test(line)) currentQ.level = 'MUC_3';
      else if (/mức 2/i.test(line)) currentQ.level = 'MUC_2';
      else if (/mức 1/i.test(line)) currentQ.level = 'MUC_1';

      currentContentLines.push(line);
    } else if (currentQ) {
      // Check if line is option A, B, C, D
      const isOptionA = /^A[.)\s]/i.test(line);
      const isOptionB = /^B[.)\s]/i.test(line);
      const isOptionC = /^C[.)\s]/i.test(line);
      const isOptionD = /^D[.)\s]/i.test(line);

      // Check if line is inline options: A. ... B. ... C. ... D. ...
      if (line.includes('A.') && line.includes('B.')) {
        const parts = line.split(/(?=[A-D][.])/);
        parts.forEach((p) => {
          if (p.trim()) currentOptions.push(p.trim());
        });
      } else if (isOptionA || isOptionB || isOptionC || isOptionD) {
        currentOptions.push(line);
      } else if (/^(đáp án|đ\/a|da|key|answer)[:.]?\s*/i.test(line)) {
        const ans = line.replace(/^(đáp án|đ\/a|da|key|answer)[:.]?\s*/i, '').trim();
        currentQ.correctAnswer = ans;
      } else if (/^(hướng dẫn chấm|giải thích|lời giải)[:.]?\s*/i.test(line)) {
        currentQ.explanation = line.replace(/^(hướng dẫn chấm|giải thích|lời giải)[:.]?\s*/i, '').trim();
      } else {
        currentContentLines.push(line);
      }
    } else {
      // If started without 'Câu 1', start first question
      currentQ = { subjectCode, grade, term, level: 'MUC_1' };
      currentContentLines.push(line);
    }
  }

  flushCurrent();
  return parsedQuestions;
}

// 2. PARSE EXCEL (.xlsx / .xls) FILE TO QUESTIONS
export async function parseExcelToQuestions(
  fileData: ArrayBuffer,
  defaultSubject: string,
  defaultGrade: GradeLevel,
  defaultTerm: TermType
): Promise<ExamQuestion[]> {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length <= 1) return [];

  const questions: ExamQuestion[] = [];
  // Assume Row 0 is header: STT, Môn, Khối, Mạch kiến thức, Mức độ, Dạng bài, Nội dung, Phương án A, B, C, D, Đáp án, Điểm, Hướng dẫn
  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || !row[4] && !row[6]) continue;

    // Extract fields safely with fallbacks
    const subject = (row[1] || defaultSubject).toString().toUpperCase().trim();
    const grade = Number(row[2]) || defaultGrade;
    const strand = (row[3] || 'Kiến thức chung').toString().trim();
    const levelStr = (row[4] || '1').toString().toUpperCase().trim();
    const level: TT27Level = levelStr.includes('3') ? 'MUC_3' : levelStr.includes('2') ? 'MUC_2' : 'MUC_1';
    const typeStr = (row[5] || 'TN').toString().toUpperCase().trim();
    const type: QuestionType = typeStr.includes('TL') || typeStr.includes('TỰ LUẬN') ? 'ESSAY' : 'MULTIPLE_CHOICE';
    const content = (row[6] || '').toString().trim();
    if (!content) continue;

    const optA = row[7] ? 'A. ' + row[7].toString().replace(/^A[.)\s]*/i, '').trim() : '';
    const optB = row[8] ? 'B. ' + row[8].toString().replace(/^B[.)\s]*/i, '').trim() : '';
    const optC = row[9] ? 'C. ' + row[9].toString().replace(/^C[.)\s]*/i, '').trim() : '';
    const optD = row[10] ? 'D. ' + row[10].toString().replace(/^D[.)\s]*/i, '').trim() : '';
    const options = type === 'MULTIPLE_CHOICE' && optA ? [optA, optB, optC, optD].filter(Boolean) : undefined;

    const correctAnswer = (row[11] || (type === 'MULTIPLE_CHOICE' ? 'A' : 'Lời giải chi tiết')).toString().trim();
    const points = Number(row[12]) || (type === 'MULTIPLE_CHOICE' ? 1.0 : 2.0);
    const explanation = row[13] ? row[13].toString().trim() : '';

    questions.push({
      id: 'q-excel-' + Date.now() + '-' + i,
      subjectCode: subject.includes('TIẾNG VIỆT') || subject.includes('TIENG_VIET') ? 'TIENG_VIET' : subject.includes('KHOA') ? 'KHOA_HOC' : subject.includes('LỊCH SỬ') ? 'LICH_SU_DIA_LY' : 'TOAN',
      grade: grade as GradeLevel,
      term: defaultTerm,
      strand,
      level,
      type,
      content,
      options,
      correctAnswer,
      points,
      explanation,
      createdAt: new Date().toISOString(),
    });
  }

  return questions;
}

// 3. EXPORT QUESTIONS TO EXCEL
export function exportQuestionsToExcel(
  questions: ExamQuestion[],
  subjectName: string,
  grade: number
) {
  const data: (string | number)[][] = [
    [
      'STT',
      'Môn học',
      'Khối lớp',
      'Mạch kiến thức',
      'Mức độ TT27',
      'Hình thức',
      'Nội dung câu hỏi',
      'Phương án A',
      'Phương án B',
      'Phương án C',
      'Phương án D',
      'Đáp án đúng',
      'Điểm số',
      'Hướng dẫn chấm & Ghi chú',
    ],
  ];

  questions.forEach((q, idx) => {
    const optA = q.options?.[0]?.replace(/^A[.)\s]*/i, '') || '';
    const optB = q.options?.[1]?.replace(/^B[.)\s]*/i, '') || '';
    const optC = q.options?.[2]?.replace(/^C[.)\s]*/i, '') || '';
    const optD = q.options?.[3]?.replace(/^D[.)\s]*/i, '') || '';

    data.push([
      idx + 1,
      q.subjectCode === 'TOAN' ? 'Toán' : q.subjectCode === 'TIENG_VIET' ? 'Tiếng Việt' : q.subjectCode,
      q.grade,
      q.strand,
      q.level === 'MUC_1' ? 'Mức 1 (Nhận biết)' : q.level === 'MUC_2' ? 'Mức 2 (Kết nối)' : 'Mức 3 (Vận dụng)',
      q.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Tự luận',
      q.content,
      optA,
      optB,
      optC,
      optD,
      q.correctAnswer,
      q.points,
      q.explanation || '',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'NganHangCauHoi_TT27');

  const fileName = `NganHangCauHoi_${subjectName}_Khoi${grade}_TT27.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// 4. DOWNLOAD EXCEL TEMPLATE
export function downloadQuestionBankTemplate() {
  const templateData: (string | number)[][] = [
    [
      'STT',
      'Môn học',
      'Khối lớp',
      'Mạch kiến thức',
      'Mức độ TT27 (MUC_1/MUC_2/MUC_3)',
      'Hình thức (TN/TL)',
      'Nội dung câu hỏi',
      'Phương án A',
      'Phương án B',
      'Phương án C',
      'Phương án D',
      'Đáp án đúng',
      'Điểm số',
      'Hướng dẫn chấm & Ghi chú',
    ],
    [
      1,
      'TOAN',
      4,
      'Số và phép tính',
      'MUC_1',
      'TN',
      'Số gồm 5 trăm nghìn, 7 chục nghìn và 2 đơn vị viết là:',
      '570 002',
      '57 002',
      '507 002',
      '570 200',
      'A',
      1.0,
      'Nhận biết cấu tạo số tự nhiên',
    ],
    [
      2,
      'TOAN',
      4,
      'Hình học và đo lường',
      'MUC_2',
      'TL',
      'Một mảnh đất hình chữ nhật có nửa chu vi 120m, chiều dài hơn chiều rộng 30m. Tính diện tích?',
      '',
      '',
      '',
      '',
      'Dài 75m, rộng 45m. Diện tích = 3375 m²',
      2.5,
      'Tìm 2 số khi biết tổng và hiệu',
    ],
    [
      3,
      'TIENG_VIET',
      4,
      'Luyện từ và câu',
      'MUC_1',
      'TN',
      'Từ nào dưới đây là từ ghép tổng hợp?',
      'Xe đạp',
      'Nhà cửa',
      'Bút chì',
      'Hoa hồng',
      'B',
      1.0,
      'Nhà cửa chỉ chung nơi ở',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Import_TT27');

  XLSX.writeFile(wb, 'Mau_Nhap_Ngan_Hang_Cau_Hoi_TT27.xlsx');
}

// 5. READY-TO-USE PRESET PACKAGES (TOÁN & TIẾNG VIỆT KHỐI 1 - 5)
export const PRESET_PACKAGES: {
  id: string;
  name: string;
  subjectCode: string;
  grade: GradeLevel;
  term: TermType;
  description: string;
  questionCount: number;
  questions: ExamQuestion[];
}[] = [
  {
    id: 'pkg-toan-k4-g1',
    name: 'Bộ Đề Ôn Tập Giữa HK1 Môn Toán Lớp 4 (Chuẩn TT27)',
    subjectCode: 'TOAN',
    grade: 4,
    term: 'GIUA_HK1',
    description: 'Trọn bộ 10 câu hỏi bao phủ mạch Số & phép tính, Góc & đơn vị đo lường.',
    questionCount: 10,
    questions: [
      {
        id: 'pkg-t4-01',
        subjectCode: 'TOAN',
        grade: 4,
        term: 'GIUA_HK1',
        strand: 'Số và phép tính',
        level: 'MUC_1',
        type: 'MULTIPLE_CHOICE',
        content: 'Chữ số 8 trong số 582 340 có giá trị là bao nhiêu?',
        options: ['A. 80 000', 'B. 8 000', 'C. 800', 'D. 800 000'],
        correctAnswer: 'A',
        points: 1.0,
        explanation: 'Chữ số 8 nằm ở hàng chục nghìn.',
        createdAt: '2026-08-28T08:00:00Z',
      },
      {
        id: 'pkg-t4-02',
        subjectCode: 'TOAN',
        grade: 4,
        term: 'GIUA_HK1',
        strand: 'Hình học và đo lường',
        level: 'MUC_1',
        type: 'MULTIPLE_CHOICE',
        content: '3 thế kỷ = ............ năm. Số thích hợp điền vào chỗ chấm là:',
        options: ['A. 30', 'B. 300', 'C. 3 000', 'D. 300 000'],
        correctAnswer: 'B',
        points: 1.0,
        explanation: '1 thế kỷ = 100 năm => 3 thế kỷ = 300 năm.',
        createdAt: '2026-08-28T08:00:00Z',
      },
      {
        id: 'pkg-t4-03',
        subjectCode: 'TOAN',
        grade: 4,
        term: 'GIUA_HK1',
        strand: 'Số và phép tính',
        level: 'MUC_2',
        type: 'MULTIPLE_CHOICE',
        content: 'Tìm x biết: x - 34 500 = 12 500',
        options: ['A. x = 47 000', 'B. x = 22 000', 'C. x = 46 000', 'D. x = 48 000'],
        correctAnswer: 'A',
        points: 1.0,
        explanation: 'x = 12 500 + 34 500 = 47 000.',
        createdAt: '2026-08-28T08:00:00Z',
      },
      {
        id: 'pkg-t4-04',
        subjectCode: 'TOAN',
        grade: 4,
        term: 'GIUA_HK1',
        strand: 'Số và phép tính',
        level: 'MUC_3',
        type: 'ESSAY',
        content: 'Một cửa hàng ngày thứ nhất bán được 350 kg gạo, ngày thứ hai bán được gấp đôi ngày thứ nhất. Ngày thứ ba bán bằng trung bình cộng của cả hai ngày đầu. Hỏi cả 3 ngày bán được bao nhiêu kg gạo?',
        correctAnswer: 'Ngày thứ hai bán: 350 × 2 = 700 kg. Ngày thứ ba bán: (350 + 700) : 2 = 525 kg. Cả 3 ngày bán: 350 + 700 + 525 = 1 575 kg. Đáp số: 1 575 kg',
        points: 2.5,
        explanation: 'Giải bài toán phối hợp trung bình cộng và gấp lên nhiều lần.',
        createdAt: '2026-08-28T08:00:00Z',
      },
    ],
  },
  {
    id: 'pkg-tv-k4-g1',
    name: 'Bộ Đề Ôn Tập Giữa HK1 Môn Tiếng Việt Lớp 4 (Chuẩn TT27)',
    subjectCode: 'TIENG_VIET',
    grade: 4,
    term: 'GIUA_HK1',
    description: 'Trọn bộ câu hỏi Luyện từ & câu, Đọc hiểu văn bản và Tập làm văn.',
    questionCount: 8,
    questions: [
      {
        id: 'pkg-tv4-01',
        subjectCode: 'TIENG_VIET',
        grade: 4,
        term: 'GIUA_HK1',
        strand: 'Luyện từ và câu',
        level: 'MUC_1',
        type: 'MULTIPLE_CHOICE',
        content: 'Từ nào dưới đây là từ láy?',
        options: ['A. Xanh xao', 'B. Cây cối', 'C. Xe cộ', 'D. Bàn ghế'],
        correctAnswer: 'A',
        points: 1.0,
        explanation: 'Xanh xao là từ láy âm đầu x.',
        createdAt: '2026-08-28T08:00:00Z',
      },
      {
        id: 'pkg-tv4-02',
        subjectCode: 'TIENG_VIET',
        grade: 4,
        term: 'GIUA_HK1',
        strand: 'Luyện từ và câu',
        level: 'MUC_2',
        type: 'ESSAY',
        content: 'Đặt 1 câu có sử dụng từ ghép và 1 câu có sử dụng từ láy để tả cảnh trường em.',
        correctAnswer: '- Câu từ ghép: Sân trường em rợp bóng cây xanh. (1.0đ) | - Câu từ láy: Những tia nắng lấp lánh rọi qua kẽ lá. (1.0đ)',
        points: 2.0,
        explanation: 'Đặt câu đúng ngữ pháp và đúng yêu cầu từ loại.',
        createdAt: '2026-08-28T08:00:00Z',
      },
      {
        id: 'pkg-tv4-03',
        subjectCode: 'TIENG_VIET',
        grade: 4,
        term: 'GIUA_HK1',
        strand: 'Tập làm văn',
        level: 'MUC_3',
        type: 'ESSAY',
        content: 'Viết thư thăm hỏi một người bạn ở xa và kể cho bạn nghe về tình hình học tập và sinh hoạt của lớp em trong học kỳ này.',
        correctAnswer: 'Bố cục thư 3 phần đầy đủ: Đầu thư (địa điểm, thời gian, lời chào), Phần chính (thăm hỏi, kể chuyện lớp), Cuối thư (lời chúc, ký tên).',
        points: 4.0,
        explanation: 'Đánh giá kỹ năng viết thư cá nhân theo chuẩn GDPT 2018.',
        createdAt: '2026-08-28T08:00:00Z',
      },
    ],
  },
];
