import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AIConfig } from '@/types';

export const runtime = 'nodejs';

function offlinePolish(rawNote: string, studentName: string): string {
  const clean = rawNote.trim();
  const lastName = studentName.split(' ').pop() || studentName;
  if (!clean) return `Hôm nay em ${lastName} học tập chăm chỉ và ngoan ngoãn.`;
  return `Hôm nay em ${lastName}: ${clean}. Cô nhờ bố mẹ cùng theo dõi và phối hợp nhắc nhở con nhé!`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      rawNote,
      studentName,
      category = 'TIEN_BO',
      aiConfig,
    } = body as {
      rawNote: string;
      studentName: string;
      category?: string;
      aiConfig?: AIConfig;
    };

    if (!rawNote?.trim() || !studentName?.trim()) {
      return NextResponse.json({ error: 'Thiếu nội dung ghi chú hoặc tên học sinh' }, { status: 400 });
    }

    const lastName = studentName.trim().split(' ').pop() || studentName;
    const effectiveKey = (aiConfig?.apiKey || process.env.GEMINI_API_KEY || '').trim();
    const provider = aiConfig?.provider || (process.env.GEMINI_API_KEY ? 'GEMINI' : 'OFFLINE');

    // Prompt instructions
    const prompt = `
Bạn là Giáo viên Chủ nhiệm Tiểu học tại Việt Nam.
Giáo viên ghi chú vắn tắt biểu hiện của học sinh "${studentName}" trong ngày như sau:
"${rawNote}"

NHIỆM VỤ CỦA BẠN:
- Viết lại thành 1 ĐOẠN TIN NHẮN DẶN DÒ NGẮN (từ 1 đến 2 câu, khoảng 20-35 từ) để gửi cho Cha Mẹ học sinh qua sổ liên lạc điện tử.
- Văn phong: Ấm áp, tích cực, tinh tế, vừa khen ngợi khích lệ vừa dặn dò khéo léo (nếu có lỗi/quên đồ dùng), tôn trọng và thân tình với phụ huynh.
- Xưng hô: "Cô", gọi học sinh là "em ${lastName}" hoặc "con".
- TUYỆT ĐỐI KHÔNG xuất tiêu đề (#, ##), không gạch đầu dòng, không đặt trong dấu ngoặc kép. Chỉ trả lời đúng 1-2 câu văn hoàn chỉnh.
`;

    // 1. Google Gemini AI
    if (provider === 'GEMINI' && effectiveKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: effectiveKey });
        const selectedModel = aiConfig?.modelName || 'gemini-2.5-flash';
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: prompt,
        });
        const polished = response.text?.trim().replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();
        if (polished) {
          return NextResponse.json({ success: true, polished, source: 'Gemini AI' });
        }
      } catch (err: any) {
        console.warn('Gemini polish error:', err?.message || err);
      }
    }

    // 2. OpenAI or Custom AI
    if ((provider === 'OPENAI' || provider === 'CUSTOM_OPENAI') && effectiveKey) {
      try {
        const baseUrl = (aiConfig?.baseUrl || (provider === 'OPENAI' ? 'https://api.openai.com/v1' : 'https://api.xiaomimimo.com/v1')).replace(/\/+$/, '');
        const model = aiConfig?.modelName || (baseUrl.includes('xiaomimimo') ? 'mimo-v2.5' : 'gpt-4o-mini');
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'Bạn là GVCN Tiểu học tại Việt Nam. Viết lại ghi chú vắn tắt thành lời dặn phụ huynh ấm áp, tinh tế (1-2 câu ngắn). Không markdown, không ngoặc kép.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 300,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const polished = (data.choices?.[0]?.message?.content || '').trim().replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();
          if (polished) {
            return NextResponse.json({ success: true, polished, source: 'Custom AI' });
          }
        }
      } catch (err: any) {
        console.warn('Custom AI polish error:', err?.message || err);
      }
    }

    // Fallback offline formatting
    return NextResponse.json({
      success: true,
      polished: offlinePolish(rawNote, studentName),
      source: 'Mẫu chuẩn hóa cục bộ',
    });
  } catch (error: any) {
    console.error('API /api/daily-remark-polish error:', error);
    return NextResponse.json({ error: 'Lỗi xử lý làm mượt nhận xét' }, { status: 500 });
  }
}
