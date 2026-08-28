import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AIConfig } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      audioBase64,
      mimeType = 'audio/webm',
      aiConfig,
      apiKey,
    } = body as {
      audioBase64: string;
      mimeType?: string;
      aiConfig?: AIConfig;
      apiKey?: string;
    };

    if (!audioBase64) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu âm thanh' }, { status: 400 });
    }

    const provider = aiConfig?.provider || 'GEMINI';
    const effectiveKey = (
      aiConfig?.apiKey ||
      apiKey ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();

    // 1. If Gemini API Key is available, use Gemini 2.5 Flash for high-accuracy Vietnamese speech-to-text
    if (effectiveKey && (provider === 'GEMINI' || !aiConfig?.baseUrl)) {
      try {
        const ai = new GoogleGenAI({ apiKey: effectiveKey });
        const cleanMimeType = mimeType.split(';')[0] || 'audio/webm';

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: audioBase64,
              },
            },
            {
              text: 'Bạn là trợ lý nhận diện giọng nói tiếng Việt chuyên môn sư phạm tiểu học. Hãy chuyển đổi đoạn ghi âm này thành văn bản nhận xét học sinh ngắn gọn, chuẩn chính tả tiếng Việt, có viết hoa đầu câu và dấu câu đầy đủ. Chỉ trả về duy nhất nội dung văn bản nhận dạng được, không kèm bất kỳ lời giải thích hay markdown nào khác.',
            },
          ],
        });

        const transcribed = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
        if (transcribed) {
          return NextResponse.json({ text: transcribed, source: 'GEMINI_AI' });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini Audio Transcription error:', geminiErr?.message || geminiErr);
      }
    }

    // 2. If OpenAI compatible endpoint with audio transcription is configured
    if (aiConfig?.baseUrl && effectiveKey) {
      try {
        // Try Whisper endpoint if supported
        const formData = new FormData();
        const byteCharacters = atob(audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'vi');

        const whisperRes = await fetch(`${aiConfig.baseUrl.replace(/\/+$/, '')}/audio/transcriptions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${effectiveKey}`,
          },
          body: formData,
        });

        if (whisperRes.ok) {
          const whisperData = await whisperRes.json();
          if (whisperData.text) {
            return NextResponse.json({ text: whisperData.text.trim(), source: 'WHISPER_AI' });
          }
        }
      } catch (whisperErr) {
        console.warn('Whisper API transcription error:', whisperErr);
      }
    }

    return NextResponse.json({
      error: 'Không thể chuyển đổi âm thanh',
      message: 'Vui lòng cấu hình API Key trong Cài đặt hoặc chọn câu mẫu có sẵn.',
    }, { status: 422 });
  } catch (error: any) {
    console.error('Server transcription fatal error:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xử lý âm thanh máy chủ' },
      { status: 500 }
    );
  }
}
