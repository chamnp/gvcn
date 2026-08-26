import * as XLSX from 'xlsx';
import { Student } from '@/types';

/**
 * Đọc và chuẩn hóa dữ liệu học sinh từ file Excel tải lên
 */
export async function parseStudentExcelFile(file: File): Promise<Partial<Student>[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length === 0) return [];

  // Tìm hàng chứa tiêu đề cột (STT, Họ và tên, Ngày sinh, v.v.)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
    if (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('name') || rowStr.includes('stt')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (rawRows[headerRowIndex] || []).map((h) => String(h || '').trim().toLowerCase());
  
  // Xác định vị trí các cột
  const nameIndex = headers.findIndex((h) => h.includes('họ và tên') || h.includes('họ tên') || h.includes('fullname') || h.includes('tên'));
  const codeIndex = headers.findIndex((h) => h.includes('mã') || h.includes('code') || h.includes('sbd'));
  const dobIndex = headers.findIndex((h) => h.includes('ngày sinh') || h.includes('dob') || h.includes('sinh'));
  const genderIndex = headers.findIndex((h) => h.includes('giới tính') || h.includes('gender') || h.includes('nam/nữ'));
  const phoneIndex = headers.findIndex((h) => h.includes('sđt') || h.includes('điện thoại') || h.includes('phone') || h.includes('liên hệ'));
  const addressIndex = headers.findIndex((h) => h.includes('địa chỉ') || h.includes('address') || h.includes('nơi ở'));

  const results: Partial<Student>[] = [];

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const fullName = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : '';
    if (!fullName || fullName.length < 2) continue;

    const studentCode = codeIndex !== -1 && row[codeIndex] ? String(row[codeIndex]).trim() : `HS${String(results.length + 1).padStart(3, '0')}`;
    
    let dateOfBirth = '2016-01-01';
    if (dobIndex !== -1 && row[dobIndex]) {
      const val = row[dobIndex];
      if (typeof val === 'number') {
        // Excel serial date format
        const dateObj = XLSX.SSF.parse_date_code(val);
        dateOfBirth = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
      } else {
        const parts = String(val).split(/[/.-]/);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            dateOfBirth = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
    }

    let gender: 'Nam' | 'Nữ' = 'Nam';
    if (genderIndex !== -1 && row[genderIndex]) {
      const gStr = String(row[genderIndex]).toLowerCase();
      if (gStr.includes('nữ') || gStr.includes('nu') || gStr.includes('female') || gStr === 'f' || gStr === 'x') {
        gender = 'Nữ';
      }
    }

    const parentPhone = phoneIndex !== -1 ? String(row[phoneIndex] || '').trim() : '';
    const address = addressIndex !== -1 ? String(row[addressIndex] || '').trim() : '';

    results.push({
      studentCode,
      fullName,
      gender,
      dateOfBirth,
      parentPhone,
      address,
      isBoarding: true,
      seatRow: 0,
      seatCol: 0,
    });
  }

  return results;
}
