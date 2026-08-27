import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Student, SubjectAssessment, TraitAssessment } from '@/types';
import { generateSmartComment } from '@/lib/comment-bank';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student, subjects = [], traits = [], apiKey, tone = 'standard', extraNotes } = body as {
      student: Student;
      subjects: SubjectAssessment[];
      traits: TraitAssessment[];
      apiKey?: string;
      tone?: 'standard' | 'encouraging' | 'detailed' | 'concise';
      extraNotes?: string;
    };

    if (!student || !student.fullName) {
      return NextResponse.json({ error: 'Thiếu thông tin học sinh' }, { status: 400 });
    }

    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

    // Nếu không có API Key, sử dụng smart offline pedagogical engine
    if (!activeApiKey || activeApiKey.trim() === '') {
      const fallbackComment = generateSmartComment(student, subjects, traits, extraNotes);
      return NextResponse.json({ success: true, comment: fallbackComment, source: 'offline_bank' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: activeApiKey });

      const subjectSummary = subjects
        .map((s) => `${s.subjectCode}: mức ${s.level}${s.score !== undefined && s.score !== null ? ` (điểm ${s.score})` : ''}`)
        .join(', ');

      const traitSummary = traits
        .map((t) => `${t.traitCode}: mức ${t.level}`)
        .join(', ');

      const prompt = `
Bạn là một Giáo viên Chủ nhiệm Tiểu học giàu kinh nghiệm, tâm huyết tại Việt Nam.
Hãy viết một đoạn NHẬN XÉT HỌC BẠ (khoảng 3 - 4 câu) cho học sinh tiểu học theo đúng quy định Thông tư 27/2020/TT-BGDĐT.

Thông tin học sinh:
- Họ và tên: ${student.fullName} (gọi tên thân mật là em ${student.fullName.split(' ').pop()})
- Giới tính: ${student.gender}
- Kết quả môn học: ${subjectSummary || 'Hoàn thành các môn học theo yêu cầu'}
- Kết quả Phẩm chất & Năng lực: ${traitSummary || 'Đạt yêu cầu rèn luyện phẩm chất và năng lực'}
- Ghi chú thêm của giáo viên: ${extraNotes || 'Không có'}
- Phong cách nhận xét mong muốn: ${tone}

Yêu cầu nghiêm ngặt:
1. Văn phong sư phạm chuẩn mực, ấm áp, mang tính khích lệ, động viên sự tiến bộ của học sinh.
2. Không so sánh với học sinh khác.
3. Chỉ rõ ưu điểm nổi bật và gợi ý giải pháp khắc phục nếu còn điểm chưa hoàn thành.
4. Chỉ trả về duy nhất đoạn văn nhận xét, không thêm tiêu đề hay lời giải thích.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim();
      if (text) {
        return NextResponse.json({ success: true, comment: text, source: 'gemini_ai' });
      }

      const fallbackComment = generateSmartComment(student, subjects, traits, extraNotes);
      return NextResponse.json({ success: true, comment: fallbackComment, source: 'offline_fallback' });
    } catch (apiError: any) {
      console.warn('Gemini API call error in route handler, fallback to offline comment bank:', apiError?.message || apiError);
      const fallbackComment = generateSmartComment(student, subjects, traits, extraNotes);
      return NextResponse.json({ success: true, comment: fallbackComment, source: 'offline_fallback' });
    }
  } catch (error: any) {
    console.error('API /api/generate-comment error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo nhận xét' }, { status: 500 });
  }
}
