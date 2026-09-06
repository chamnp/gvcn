import * as XLSX from 'xlsx';
import { Student, TeacherProfile, UserRole, SubjectLevel } from '@/types';

/**
 * Chuẩn hóa chuỗi tiếng Việt (bỏ dấu, chuyển thường, xử lý đ/Đ, giữ chữ cái và số)
 * để đối soát tên cột trong file Excel một cách chính xác nhất.
 */
function normalizeHeader(str: any): string {
  return String(str || '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Xử lý ngày sinh từ nhiều định dạng Excel:
 * - Số serial Excel (ví dụ 42444)
 * - Đối tượng Date
 * - Chuỗi DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, YYYY/MM/DD, DD/MM/YY, YYYY
 */
function parseDateValue(val: any): string {
  if (val === undefined || val === null || val === '') return '2016-01-01';

  // Excel serial number
  if (typeof val === 'number') {
    try {
      const dateObj = XLSX.SSF.parse_date_code(val);
      if (dateObj && dateObj.y && dateObj.m && dateObj.d) {
        return `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
      }
    } catch {
      // Bỏ qua nếu không parse được
    }
  }

  // Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  // Lấy phần ngày trước dấu cách nếu có kèm giờ
  const cleanDateStr = str.split(/\s+/)[0];

  // Khớp DD/MM/YYYY hoặc DD-MM-YYYY hoặc DD.MM.YYYY
  const dmyMatch = cleanDateStr.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Khớp YYYY-MM-DD hoặc YYYY/MM/DD
  const ymdMatch = cleanDateStr.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Khớp DD/MM/YY
  const dmy2Match = cleanDateStr.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/);
  if (dmy2Match) {
    const d = dmy2Match[1].padStart(2, '0');
    const m = dmy2Match[2].padStart(2, '0');
    const y = parseInt(dmy2Match[3], 10) > 30 ? `19${dmy2Match[3]}` : `20${dmy2Match[3]}`;
    return `${y}-${m}-${d}`;
  }

  // Chỉ có năm (ví dụ: "2016")
  const yMatch = cleanDateStr.match(/^(\d{4})$/);
  if (yMatch) {
    return `${yMatch[1]}-01-01`;
  }

  if (val) {
    console.warn(`[Excel Import] Không thể phân tích ngày sinh từ "${val}". Mặc định dùng "2016-01-01".`);
  }
  return '2016-01-01';
}

/**
 * Chuẩn hóa số điện thoại:
 * - Giữ lại chữ số
 * - Bù số 0 ở đầu nếu bị Excel cắt (ví dụ: 912345678 -> 0912345678)
 * - Chuyển +84... hoặc 84... thành 0...
 */
function parsePhoneValue(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  let phone = String(val).trim().replace(/[^\d+]/g, '');
  if (phone.startsWith('+84')) {
    phone = '0' + phone.substring(3);
  } else if (phone.startsWith('84') && phone.length === 11) {
    phone = '0' + phone.substring(2);
  } else if (/^[35789]\d{8}$/.test(phone)) {
    // Excel làm mất số 0 đầu của SĐT 10 chữ số
    phone = '0' + phone;
  }
  return phone;
}

/**
 * Đọc và chuẩn hóa dữ liệu học sinh từ file Excel tải lên
 * Hỗ trợ mọi cấu trúc file:
 * 1. File mẫu tải từ hệ thống GVCN Pro (có dòng tiêu đề/hướng dẫn đầu)
 * 2. File xuất từ VnEdu / SMAS / CSDL Ngành (cột Họ đệm riêng, Tên riêng, cột Nữ riêng)
 * 3. File Excel/CSV do giáo viên tự lập với các tên cột thông dụng
 */
export async function parseStudentExcelFile(file: File): Promise<Partial<Student>[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel không có trang tính (sheet) nào.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!rawRows || rawRows.length === 0) return [];

  // Tìm hàng chứa tiêu đề cột bằng thuật toán tính điểm nhận diện thông minh
  let bestHeaderRowIndex = -1;
  let maxScore = -1;

  for (let r = 0; r < Math.min(20, rawRows.length); r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    let score = 0;
    const normRow = row.map((cell) => normalizeHeader(cell));

    normRow.forEach((h) => {
      if (!h) return;
      if (h === 'stt' || h.includes('so tt') || h.includes('so thu tu')) score += 2;
      else if (h.includes('ho va ten') || h.includes('ho ten') || h.includes('fullname') || h.includes('ten hoc sinh')) score += 5;
      else if (h.includes('ho dem') || h.includes('ho va chu dem') || h.includes('ho lot') || h === 'ho') score += 3;
      else if (h === 'ten' || h === 'ten hs') score += 3;
      else if (h.includes('ma hoc sinh') || h.includes('ma hs') || h.includes('ma dinh danh') || h.includes('sbd') || h === 'ma' || h.includes('code') || h.includes('ma dd')) score += 3;
      else if (h.includes('ngay sinh') || h.includes('sinh ngay') || h.includes('dob') || h.includes('nam sinh')) score += 3;
      else if (h.includes('gioi tinh') || h.includes('gender') || h.includes('nam nu') || h === 'nu' || h === 'nu x') score += 3;
      else if (h.includes('sdt') || h.includes('dien thoai') || h.includes('phone') || h.includes('lien he') || h.includes('mobile')) score += 3;
      else if (h.includes('phu huynh') || h.includes('cha me') || h.includes('parent') || h.includes('bo me') || h.includes('nguoi giam ho')) score += 2;
      else if (h.includes('ban tru') || h.includes('boarding') || h.includes('an trua')) score += 2;
      else if (h.includes('suc khoe') || h.includes('ghi chu') || h.includes('health') || h.includes('nang khieu')) score += 1;
    });

    if (score > maxScore && score >= 4) {
      maxScore = score;
      bestHeaderRowIndex = r;
    }
  }

  if (bestHeaderRowIndex === -1) {
    bestHeaderRowIndex = 0;
  }

  const rawHeaders = rawRows[bestHeaderRowIndex] || [];
  const headers = rawHeaders.map((h) => normalizeHeader(h));

  // Xác định vị trí các cột
  let nameIndex = headers.findIndex((h) => h.includes('ho va ten') || h.includes('ho ten') || h.includes('fullname') || h.includes('ten hoc sinh'));
  const hoIndex = headers.findIndex((h) => h.includes('ho va chu dem') || h.includes('ho dem') || h.includes('ho lot') || h === 'ho');
  const tenIndex = headers.findIndex((h) => h === 'ten' || h === 'ten hs');

  if (nameIndex === -1 && tenIndex !== -1 && hoIndex === -1) {
    nameIndex = tenIndex;
  }

  const codeIndex = headers.findIndex((h) => h.includes('ma hoc sinh') || h.includes('ma hs') || h.includes('ma dinh danh') || h.includes('sbd') || h === 'ma' || h.includes('code') || h.includes('ma dd'));
  const dobIndex = headers.findIndex((h) => h.includes('ngay sinh') || h.includes('sinh ngay') || h.includes('dob') || h.includes('nam sinh') || h.includes('date of birth'));
  const genderIndex = headers.findIndex((h) => h.includes('gioi tinh') || h.includes('gender') || h.includes('nam nu') || h.includes('phai'));
  const femaleColIndex = headers.findIndex((h) => h === 'nu' || h === 'nu x' || h.includes('nu x') || h.includes('nu danh dau'));

  // Cột SĐT (Ưu tiên nhận diện trước cột phụ huynh để tránh nhầm lẫn "SĐT Phụ huynh")
  const phoneIndex = headers.findIndex((h) => h.includes('sdt') || h.includes('dien thoai') || h.includes('phone') || h.includes('lien he') || h.includes('mobile') || h === 'dd');
  
  // Cột Họ tên phụ huynh (loại trừ cột đã được gán là SĐT)
  const parentNameIndex = headers.findIndex((h, idx) => idx !== phoneIndex && (h.includes('phu huynh') || h.includes('cha me') || h.includes('parent') || h.includes('bo me') || h.includes('nguoi giam ho') || h.includes('ten bo') || h.includes('ten me')));

  const boardingIndex = headers.findIndex((h) => h.includes('ban tru') || h.includes('boarding') || h.includes('an trua') || h.includes('an ban tru'));
  const healthIndex = headers.findIndex((h) => h.includes('suc khoe') || h.includes('ghi chu') || h.includes('health') || h.includes('nang khieu') || h.includes('khuyet tat'));

  const results: Partial<Student>[] = [];

  for (let i = bestHeaderRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    // Lấy họ và tên
    let fullName = '';
    if (nameIndex !== -1 && row[nameIndex] !== undefined) {
      fullName = String(row[nameIndex] || '').trim();
    } else if (hoIndex !== -1 && tenIndex !== -1) {
      const ho = String(row[hoIndex] || '').trim();
      const ten = String(row[tenIndex] || '').trim();
      fullName = `${ho} ${ten}`.trim();
    }

    fullName = fullName.replace(/\s+/g, ' ');

    // Bỏ qua dòng trống, dòng lặp tiêu đề hoặc dòng tổng kết chân trang
    if (!fullName || fullName.length < 2) continue;
    const normFullName = normalizeHeader(fullName);
    if (
      normFullName.includes('tong so') ||
      normFullName.includes('tong cong') ||
      normFullName.includes('nguoi lap') ||
      normFullName.includes('hieu truong') ||
      normFullName.includes('giao vien') ||
      normFullName.includes('ho va ten')
    ) {
      continue;
    }

    const studentCode = codeIndex !== -1 && row[codeIndex]
      ? String(row[codeIndex]).trim()
      : `HS${String(results.length + 1).padStart(3, '0')}`;

    const dateOfBirth = dobIndex !== -1 ? parseDateValue(row[dobIndex]) : '2016-01-01';

    // Giới tính: hỗ trợ cả cột 'Nữ (x)' và cột 'Giới tính'
    let gender: 'Nam' | 'Nữ' = 'Nam';
    if (femaleColIndex !== -1 && row[femaleColIndex] !== undefined && row[femaleColIndex] !== null && String(row[femaleColIndex]).trim() !== '') {
      const fVal = String(row[femaleColIndex]).toLowerCase().trim();
      if (fVal === 'x' || fVal === '1' || fVal === 'nu' || fVal === 'c' || fVal === 'v') {
        gender = 'Nữ';
      }
    } else if (genderIndex !== -1 && row[genderIndex]) {
      const gStr = normalizeHeader(row[genderIndex]);
      if (gStr.includes('nu') || gStr.includes('female') || gStr === 'f' || gStr === 'gai' || gStr === '2' || gStr === 'x') {
        gender = 'Nữ';
      }
    }

    const parentName = parentNameIndex !== -1 ? String(row[parentNameIndex] || '').trim().replace(/\s+/g, ' ') : '';
    const parentPhone = phoneIndex !== -1 ? parsePhoneValue(row[phoneIndex]) : '';

    let isBoarding = false;
    if (boardingIndex !== -1 && row[boardingIndex] !== undefined && row[boardingIndex] !== null) {
      const bStr = normalizeHeader(row[boardingIndex]);
      isBoarding = bStr === 'co' || bStr === 'yes' || bStr === 'true' || bStr === '1' || bStr === 'x' || bStr.includes('ban tru');
    }

    const healthNotes = healthIndex !== -1 ? String(row[healthIndex] || '').trim() : '';

    results.push({
      studentCode,
      fullName,
      gender,
      dateOfBirth,
      parentName,
      parentPhone,
      isBoarding,
      healthNotes,
      seatRow: 0,
      seatCol: 0,
    });
  }

  return results;
}

/**
 * Đọc danh sách phân công giáo viên từ file Excel tải lên
 */
export async function parseTeacherExcelFile(file: File): Promise<TeacherProfile[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel không có trang tính (sheet) nào.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!rawRows || rawRows.length === 0) return [];

  // Tìm hàng tiêu đề thông qua tính điểm nhận diện
  let bestHeaderRowIndex = -1;
  let maxScore = -1;

  for (let r = 0; r < Math.min(20, rawRows.length); r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    let score = 0;
    const normRow = row.map((cell) => normalizeHeader(cell));

    normRow.forEach((h) => {
      if (!h) return;
      if (h === 'stt' || h.includes('so tt') || h.includes('so thu tu')) score += 2;
      else if (h.includes('email') || h.includes('thu dien tu') || h.includes('tai khoan')) score += 5;
      else if (h.includes('ho va ten') || h.includes('ho ten') || h.includes('giao vien') || h.includes('can bo') || h.includes('fullname')) score += 4;
      else if (h.includes('chuc vu') || h.includes('chuc danh') || h.includes('vi tri')) score += 3;
      else if (h.includes('to chuyen mon') || h.includes('to') || h.includes('khoa') || h.includes('phong')) score += 3;
      else if (h.includes('vai tro') || h.includes('role') || h.includes('quyen')) score += 3;
      else if (h.includes('lop phu trach') || h.includes('phan cong') || h.includes('chu nhiem') || h.includes('lop')) score += 3;
      else if (h.includes('sdt') || h.includes('dien thoai') || h.includes('phone') || h.includes('so dien thoai')) score += 2;
    });

    if (score > maxScore && score >= 4) {
      maxScore = score;
      bestHeaderRowIndex = r;
    }
  }

  if (bestHeaderRowIndex === -1) {
    bestHeaderRowIndex = 0;
  }

  const rawHeaders = rawRows[bestHeaderRowIndex] || [];
  const headers = rawHeaders.map((h) => normalizeHeader(h));

  const emailIndex = headers.findIndex((h) => h.includes('email') || h.includes('thu dien tu') || h.includes('tai khoan'));
  const nameIndex = headers.findIndex((h) => h.includes('ho va ten') || h.includes('ho ten') || h.includes('fullname') || h.includes('giao vien') || h.includes('can bo') || h === 'ten');
  const titleIndex = headers.findIndex((h) => h.includes('chuc vu') || h.includes('chuc danh') || h.includes('vi tri'));
  const deptIndex = headers.findIndex((h) => h.includes('to chuyen mon') || h.includes('to') || h.includes('phong') || h.includes('khoa'));
  const roleIndex = headers.findIndex((h) => h.includes('vai tro') || h.includes('role') || h.includes('quyen'));
  const classIndex = headers.findIndex((h) => h.includes('lop phu trach') || h.includes('phan cong') || h.includes('chu nhiem') || h.includes('lop') || h.includes('class'));
  const phoneIndex = headers.findIndex((h) => h.includes('sdt') || h.includes('dien thoai') || h.includes('phone') || h.includes('so dien thoai'));

  const results: TeacherProfile[] = [];

  for (let i = bestHeaderRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const email = emailIndex !== -1 ? String(row[emailIndex] || '').trim().toLowerCase() : '';
    const fullName = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';

    if (!email || !email.includes('@')) continue;

    let role: UserRole = 'TEACHER';
    if (roleIndex !== -1 && row[roleIndex]) {
      const rStr = normalizeHeader(row[roleIndex]);
      if (rStr.includes('admin teacher') || (rStr.includes('admin') && rStr.includes('gvcn')) || (rStr.includes('kiem') && rStr.includes('admin'))) {
        role = 'ADMIN_TEACHER';
      } else if (rStr.includes('admin') || rStr.includes('quan tri') || rStr.includes('hieu truong') || rStr.includes('bgh')) {
        role = 'ADMIN';
      }
    }

    const title = titleIndex !== -1 && row[titleIndex] ? String(row[titleIndex]).trim() : undefined;
    const department = deptIndex !== -1 && row[deptIndex] ? String(row[deptIndex]).trim() : undefined;
    const phone = phoneIndex !== -1 ? parsePhoneValue(row[phoneIndex]) : undefined;
    const rawClass = classIndex !== -1 ? String(row[classIndex] || '').trim() : '';
    const assignedClassName = rawClass
      ? rawClass.startsWith('Lớp') || rawClass.includes('Tất cả') || rawClass.includes('Không')
        ? rawClass
        : `Lớp ${rawClass}`
      : undefined;

    results.push({
      id: `t-${Date.now()}-${results.length}`,
      email,
      fullName: fullName || email.split('@')[0],
      role,
      title: title || (role === 'ADMIN' ? 'Ban Giám Hiệu' : role === 'ADMIN_TEACHER' ? 'BGH kiêm GVCN' : 'Giáo viên Chủ nhiệm'),
      department: department || (role === 'ADMIN' ? 'Ban Giám Hiệu' : 'Tổ Chuyên môn'),
      assignedClassName,
      phone,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}

export interface ParsedSubjectScoreItem {
  studentId: string;
  studentCode: string;
  studentName: string;
  score?: number;
  level: SubjectLevel;
  comment: string;
  isMatched: boolean;
  statusText?: string;
}

export interface ParseSubjectScoreResult {
  detectedSubjectCode?: string;
  items: ParsedSubjectScoreItem[];
  unmatchedRows: { rowNumber: number; rawName: string; rawCode: string; reason: string }[];
}

/**
 * Đọc file Excel điểm môn học và đối soát với danh sách học sinh của lớp
 */
export async function parseSubjectScoreExcelFile(
  file: File,
  students: Student[]
): Promise<ParseSubjectScoreResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel không có trang tính (sheet) nào.');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!rawRows || rawRows.length === 0) {
    return { items: [], unmatchedRows: [] };
  }

  // Cố gắng nhận diện mã môn học từ tiêu đề hoặc tên file
  let detectedSubjectCode: string | undefined;
  const fileNameNorm = normalizeHeader(file.name);
  if (fileNameNorm.includes('toan')) detectedSubjectCode = 'TOAN';
  else if (fileNameNorm.includes('tieng viet') || fileNameNorm.includes('tv')) detectedSubjectCode = 'TIENG_VIET';
  else if (fileNameNorm.includes('tieng anh') || fileNameNorm.includes('anh') || fileNameNorm.includes('ta')) detectedSubjectCode = 'TIENG_ANH';
  else if (fileNameNorm.includes('khoa hoc')) detectedSubjectCode = 'KHOA_HOC';
  else if (fileNameNorm.includes('lich su') || fileNameNorm.includes('dia ly')) detectedSubjectCode = 'LICH_SU_DIA_LY';
  else if (fileNameNorm.includes('tin hoc')) detectedSubjectCode = 'TIN_HOC';
  else if (fileNameNorm.includes('cong nghe')) detectedSubjectCode = 'CONG_NGHE';
  else if (fileNameNorm.includes('dao duc')) detectedSubjectCode = 'DAO_DUC';
  else if (fileNameNorm.includes('am nhac')) detectedSubjectCode = 'AM_NHAC';
  else if (fileNameNorm.includes('my thuat')) detectedSubjectCode = 'MY_THUAT';
  else if (fileNameNorm.includes('the duc') || fileNameNorm.includes('giao duc the chat')) detectedSubjectCode = 'GDTC';
  else if (fileNameNorm.includes('hdtn')) detectedSubjectCode = 'HDTN';

  // Quét 10 dòng đầu để tìm header row và bổ sung nhận diện môn học nếu chưa có
  let bestHeaderRowIndex = -1;
  let maxScore = -1;

  for (let r = 0; r < Math.min(15, rawRows.length); r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rowText = row.map((c) => normalizeHeader(c)).join(' ');
    if (!detectedSubjectCode) {
      if (rowText.includes('toan')) detectedSubjectCode = 'TOAN';
      else if (rowText.includes('tieng viet')) detectedSubjectCode = 'TIENG_VIET';
      else if (rowText.includes('tieng anh')) detectedSubjectCode = 'TIENG_ANH';
      else if (rowText.includes('khoa hoc')) detectedSubjectCode = 'KHOA_HOC';
      else if (rowText.includes('lich su')) detectedSubjectCode = 'LICH_SU_DIA_LY';
      else if (rowText.includes('tin hoc')) detectedSubjectCode = 'TIN_HOC';
      else if (rowText.includes('cong nghe')) detectedSubjectCode = 'CONG_NGHE';
    }

    let score = 0;
    const normRow = row.map((cell) => normalizeHeader(cell));

    normRow.forEach((h) => {
      if (!h) return;
      if (h === 'stt' || h.includes('so tt')) score += 2;
      else if (h.includes('ho va ten') || h.includes('ho ten') || h.includes('ten hoc sinh') || h === 'ten') score += 5;
      else if (h.includes('ma hoc sinh') || h.includes('ma hs') || h.includes('code') || h === 'ma') score += 4;
      else if (h.includes('diem') || h.includes('diem so') || h.includes('score') || h.includes('diem kt')) score += 4;
      else if (h.includes('muc') || h.includes('danh gia') || h.includes('t h c') || h.includes('muc dg')) score += 3;
      else if (h.includes('nhan xet') || h.includes('loi nhan xet') || h.includes('comment')) score += 3;
    });

    if (score > maxScore && score >= 4) {
      maxScore = score;
      bestHeaderRowIndex = r;
    }
  }

  if (bestHeaderRowIndex === -1) {
    bestHeaderRowIndex = 0;
  }

  const rawHeaders = rawRows[bestHeaderRowIndex] || [];
  const headers = rawHeaders.map((h) => normalizeHeader(h));

  const codeIndex = headers.findIndex(
    (h) => h.includes('ma hoc sinh') || h.includes('ma hs') || h.includes('code') || h === 'ma'
  );
  const nameIndex = headers.findIndex(
    (h) => h.includes('ho va ten') || h.includes('ho ten') || h.includes('ten hoc sinh') || h === 'ten'
  );
  const scoreIndex = headers.findIndex(
    (h) => h.includes('diem') || h.includes('diem so') || h.includes('score') || h.includes('diem kt')
  );
  const levelIndex = headers.findIndex(
    (h) => (h.includes('muc') && (h.includes('dg') || h.includes('danh gia') || h.includes('t h c') || h.includes('dat'))) || h === 'muc'
  );
  const commentIndex = headers.findIndex(
    (h) => h.includes('nhan xet') || h.includes('loi nhan xet') || h.includes('comment') || h.includes('y kien')
  );

  const items: ParsedSubjectScoreItem[] = [];
  const unmatchedRows: { rowNumber: number; rawName: string; rawCode: string; reason: string }[] = [];

  for (let i = bestHeaderRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const rawCode = codeIndex !== -1 && row[codeIndex] !== undefined ? String(row[codeIndex]).trim() : '';
    const rawName = nameIndex !== -1 && row[nameIndex] !== undefined ? String(row[nameIndex]).trim() : '';

    if (!rawName && !rawCode) continue;

    const normName = normalizeHeader(rawName);
    if (
      normName.includes('tong so') ||
      normName.includes('tong cong') ||
      normName.includes('nguoi lap') ||
      normName.includes('hieu truong') ||
      normName.includes('giao vien')
    ) {
      continue;
    }

    // Tìm học sinh tương ứng trong danh sách lớp
    let matchedStudent: Student | undefined;

    if (rawCode) {
      const codeClean = rawCode.toLowerCase();
      matchedStudent = students.find((s) => s.studentCode.toLowerCase() === codeClean);
    }

    if (!matchedStudent && normName) {
      matchedStudent = students.find((s) => normalizeHeader(s.fullName) === normName);
    }

    if (!matchedStudent && normName) {
      // Tìm tương đối nếu họ tên bị thừa khoảng trắng hoặc ký tự đặc biệt
      matchedStudent = students.find(
        (s) => normalizeHeader(s.fullName).includes(normName) || normName.includes(normalizeHeader(s.fullName))
      );
    }

    // Xử lý điểm số
    let parsedScore: number | undefined;
    if (scoreIndex !== -1 && row[scoreIndex] !== undefined && row[scoreIndex] !== null && String(row[scoreIndex]).trim() !== '') {
      const rawScoreStr = String(row[scoreIndex]).replace(',', '.').trim();
      const num = parseFloat(rawScoreStr);
      if (!isNaN(num)) {
        parsedScore = Math.min(10, Math.max(0, Math.round(num * 10) / 10));
      }
    }

    // Xử lý mức đánh giá T / H / C
    let parsedLevel: SubjectLevel = 'H';
    let hasExplicitLevel = false;

    if (levelIndex !== -1 && row[levelIndex] !== undefined && row[levelIndex] !== null) {
      const lStr = normalizeHeader(row[levelIndex]);
      if (lStr === 't' || lStr.includes('tot') || lStr.includes('hoan thanh tot')) {
        parsedLevel = 'T';
        hasExplicitLevel = true;
      } else if (lStr === 'c' || lStr.includes('chua') || lStr.includes('co gang')) {
        parsedLevel = 'C';
        hasExplicitLevel = true;
      } else if (lStr === 'h' || lStr.includes('dat') || lStr.includes('hoan thanh')) {
        parsedLevel = 'H';
        hasExplicitLevel = true;
      }
    }

    // Nếu không có mức rõ ràng nhưng có điểm số, tự suy luận mức hợp lý
    if (!hasExplicitLevel && parsedScore !== undefined) {
      if (parsedScore >= 9) parsedLevel = 'T';
      else if (parsedScore >= 5) parsedLevel = 'H';
      else parsedLevel = 'C';
    }

    // Xử lý lời nhận xét
    let parsedComment = '';
    if (commentIndex !== -1 && row[commentIndex] !== undefined && row[commentIndex] !== null) {
      parsedComment = String(row[commentIndex]).trim();
    }

    if (matchedStudent) {
      items.push({
        studentId: matchedStudent.id,
        studentCode: matchedStudent.studentCode,
        studentName: matchedStudent.fullName,
        score: parsedScore,
        level: parsedLevel,
        comment: parsedComment,
        isMatched: true,
      });
    } else {
      unmatchedRows.push({
        rowNumber: i + 1,
        rawName,
        rawCode,
        reason: 'Không tìm thấy học sinh này trong danh sách lớp',
      });
    }
  }

  return {
    detectedSubjectCode,
    items,
    unmatchedRows,
  };
}
