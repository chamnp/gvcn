import { GoogleGenAI } from '@google/genai';
import { Student, SubjectAssessment, TraitAssessment } from '@/types';
import { generateSmartComment } from './comment-bank';

export interface GenerateCommentRequest {
  student: Student;
  subjects: SubjectAssessment[];
  traits: TraitAssessment[];
  apiKey?: string;
  tone?: 'standard' | 'encouraging' | 'detailed' | 'concise';
  extraNotes?: string;
}

export async function generateStudentAIComment(req: GenerateCommentRequest): Promise<string> {
  const { student, subjects, traits, apiKey, tone = 'standard', extraNotes } = req;
  const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

  // Nếu không có API Key, sử dụng smart offline pedagogical engine
  if (!activeApiKey || activeApiKey.trim() === '') {
    return generateSmartComment(student, subjects, traits, extraNotes);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: activeApiKey });
    
    const subjectSummary = subjects
      .map((s) => `${s.subjectCode}: mức ${s.level}${s.score ? ` (điểm ${s.score})` : ''}`)
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
- Kết quả môn học: ${subjectSummary}
- Kết quả Phẩm chất & Năng lực: ${traitSummary}
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
    if (text) return text;
    return generateSmartComment(student, subjects, traits, extraNotes);
  } catch (error) {
    console.warn('Gemini API call error, fallback to offline comment bank:', error);
    return generateSmartComment(student, subjects, traits, extraNotes);
  }
}
