import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Student, SubjectAssessment, TraitAssessment, StarLog, DailyAttendance, AIConfig } from '@/types';
import { generateSmartComment } from '@/lib/comment-bank';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      student,
      subjects = [],
      traits = [],
      starLogs = [],
      attendances = [],
      aiConfig,
      apiKey,
      tone = 'standard',
      extraNotes,
    } = body as {
      student: Student;
      subjects: SubjectAssessment[];
      traits: TraitAssessment[];
      starLogs?: StarLog[];
      attendances?: DailyAttendance[];
      aiConfig?: AIConfig;
      apiKey?: string;
      tone?: 'standard' | 'encouraging' | 'detailed' | 'concise';
      extraNotes?: string;
    };

    if (!student || !student.fullName) {
      return NextResponse.json({ error: 'Thiếu thông tin học sinh' }, { status: 400 });
    }

    // Determine active provider, key, baseUrl, modelName
    const provider = aiConfig?.provider || 'GEMINI';
    const effectiveKey = (aiConfig?.apiKey || apiKey || (provider === 'GEMINI' ? process.env.GEMINI_API_KEY : '') || '').trim();
    const modelName = (aiConfig?.modelName || '').trim();
    const baseUrl = (aiConfig?.baseUrl || '').trim().replace(/\/+$/, '');
    const temperature = aiConfig?.temperature ?? 0.7;

    // Nếu không có API Key, sử dụng smart offline pedagogical engine
    if (!effectiveKey) {
      const fallbackComment = generateSmartComment(student, subjects, traits, extraNotes);
      return NextResponse.json({ success: true, comment: fallbackComment, source: 'offline_bank' });
    }

    // Build comprehensive context for the student
    const subjectSummary = subjects
      .map((s) => `${s.subjectCode}: mức ${s.level}${s.score !== undefined && s.score !== null ? ` (điểm ${s.score})` : ''}`)
      .join(', ');

    const traitSummary = traits
      .map((t) => `${t.traitCode}: mức ${t.level}`)
      .join(', ');

    // Extract behavior & star logs for this student
    const studentStars = starLogs.filter((l) => l.studentId === student.id);
    const totalStars = studentStars.reduce((sum, l) => sum + l.points, 0);
    const recentPraises = studentStars
      .filter((l) => l.reason)
      .slice(0, 4)
      .map((l) => l.reason + (l.comment ? ` ("${l.comment}")` : ''))
      .join('; ');

    const behaviorHistorySummary = studentStars.length > 0
      ? `Tổng ${totalStars} sao nề nếp thi đua. Các biểu hiện và nhận xét hàng ngày gần nhất của cô giáo: ${recentPraises || 'Ngoan ngoãn, chấp hành tốt nội quy'}`
      : 'Ý thức nề nếp tốt, tích cực tham gia các phong trào học tập của lớp.';

    // Attendance summary
    const studentAtt = attendances.filter((a) => a.studentId === student.id);
    const absentCount = studentAtt.filter((a) => a.status !== 'CO_MAT').length;
    const attendanceSummary = absentCount === 0
      ? 'Đi học chuyên cần, đúng giờ, tham gia đầy đủ các buổi học.'
      : `Đi học đều, có ${absentCount} buổi nghỉ học có lý do.`;

    const prompt = `
Bạn là một Giáo viên Chủ nhiệm Tiểu học chuẩn mực, giàu tình yêu thương và thấu hiểu học sinh tại Việt Nam.
Nhiệm vụ của bạn là viết một đoạn LỜI NHẬN XÉT HỌC BẠ / ĐÁNH GIÁ ĐỊNH KỲ (độ dài chuẩn mực 3 - 4 câu, khoảng 45 - 80 từ) cho học sinh tiểu học theo đúng tinh thần và quy định của THÔNG TƯ 27/2020/TT-BGDĐT.

=== HỒ SƠ & DỮ LIỆU THỰC TẾ CỦA HỌC SINH ===
- Họ và tên: ${student.fullName} (Giới tính: ${student.gender})
- Xưng hô phù hợp: "Em", "Em ${student.fullName.split(' ').pop()}"
- Kết quả học tập các môn học (T/H/C): ${subjectSummary || 'Hoàn thành tốt các môn học'}
- Đánh giá Phẩm chất & Năng lực (T/Đ/C): ${traitSummary || 'Đạt yêu cầu rèn luyện phẩm chất và năng lực'}
- Lịch sử nề nếp, tích sao & nhận xét hàng ngày: ${behaviorHistorySummary}
- Tình hình chuyên cần: ${attendanceSummary}
- Ghi chú riêng của cô giáo: ${extraNotes || 'Không có'}
- Phong cách nhận xét mong muốn: ${tone}

=== QUY TẮC BẮT BUỘC THEO THÔNG TƯ 27/2020/TT-BGDĐT ===
1. NGẮN GỌN & SÚC TÍCH: Viết đúng 3 - 4 câu, lời văn cô đọng, tự nhiên, vừa vặn để in vào sổ học bạ điện tử hoặc bảng đánh giá định kỳ.
2. KHÍCH LỆ & ĐỘNG VIÊN: Luôn nêu bật ưu điểm, sự tiến bộ nổi bật (trong học tập hoặc nề nếp/phẩm chất); sau đó nhẹ nhàng chỉ dẫn biện pháp khắc phục nếu có điểm cần cố gắng.
3. CÁ NHÂN HÓA: Dựa trên lịch sử nhận xét hàng ngày và điểm số môn học cụ thể của chính em đó, tránh nhận xét chung chung sáo rỗng.
4. TUYỆT ĐỐI KHÔNG so sánh em với học sinh khác, không dùng từ ngữ tiêu cực, không phán xét nặng nề.
5. ĐỊNH DẠNG ĐẦU RA: Chỉ trả về DUY NHẤT đoạn văn nhận xét bằng tiếng Việt. Tuyệt đối không thêm tiêu đề, không có "Lời nhận xét:", không bọc trong dấu ngoặc kép.
`;

    // 1. GOOGLE GEMINI PROVIDER
    if (provider === 'GEMINI') {
      try {
        const ai = new GoogleGenAI({ apiKey: effectiveKey });
        const selectedModel = modelName || 'gemini-2.5-flash';

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: prompt,
        });

        const text = response.text?.trim();
        if (text) {
          return NextResponse.json({ success: true, comment: text, source: 'gemini_ai', model: selectedModel });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, trying fallback:', geminiError?.message || geminiError);
      }
    }

    // 2. OPENAI & CUSTOM OPENAI-COMPATIBLE PROVIDERS (Xiaomi MIMO, DeepSeek, OpenRouter, Groq, Ollama, etc.)
    if (provider === 'OPENAI' || provider === 'CUSTOM_OPENAI') {
      try {
        const endpoint = baseUrl
          ? `${baseUrl}/chat/completions`
          : provider === 'OPENAI'
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

        const selectedModel = modelName || (provider === 'OPENAI' ? 'gpt-4o-mini' : 'mimo-v1');

        const aiResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveKey}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: 'system',
                content: 'Bạn là chuyên gia giáo dục tiểu học Việt Nam chuyên viết nhận xét học bạ theo Thông tư 27/2020/TT-BGDĐT.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature,
            max_tokens: 400,
          }),
        });

        if (aiResponse.ok) {
          const resJson = await aiResponse.json();
          const text = resJson.choices?.[0]?.message?.content?.trim();
          if (text) {
            return NextResponse.json({
              success: true,
              comment: text,
              source: provider === 'OPENAI' ? 'openai' : 'custom_openai',
              model: selectedModel,
            });
          }
        } else {
          const errText = await aiResponse.text();
          console.warn(`OpenAI/Custom AI API error (${aiResponse.status}):`, errText);
        }
      } catch (openAiError: any) {
        console.warn('OpenAI/Custom AI API call failed:', openAiError?.message || openAiError);
      }
    }

    // 3. ANTHROPIC CLAUDE PROVIDER
    if (provider === 'ANTHROPIC') {
      try {
        const endpoint = baseUrl ? `${baseUrl}/messages` : 'https://api.anthropic.com/v1/messages';
        const selectedModel = modelName || 'claude-3-5-haiku-20241022';

        const aiResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': effectiveKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: 400,
            temperature,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const resJson = await aiResponse.json();
          const text = resJson.content?.[0]?.text?.trim();
          if (text) {
            return NextResponse.json({
              success: true,
              comment: text,
              source: 'anthropic_claude',
              model: selectedModel,
            });
          }
        } else {
          const errText = await aiResponse.text();
          console.warn(`Anthropic Claude API error (${aiResponse.status}):`, errText);
        }
      } catch (claudeError: any) {
        console.warn('Anthropic API call failed:', claudeError?.message || claudeError);
      }
    }

    // 4. FALLBACK TO HIGH-QUALITY PEDAGOGICAL BANK
    const fallbackComment = generateSmartComment(student, subjects, traits, extraNotes);
    return NextResponse.json({ success: true, comment: fallbackComment, source: 'offline_fallback' });
  } catch (error: any) {
    console.error('API /api/generate-comment error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo nhận xét' }, { status: 500 });
  }
}
