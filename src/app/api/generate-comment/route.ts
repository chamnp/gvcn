import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Student, SubjectAssessment, TraitAssessment, StarLog, DailyAttendance, AIConfig, AIGenerationSettings } from '@/types';
import { generateSmartComment } from '@/lib/comment-bank';

export const runtime = 'nodejs';

function cleanAIComment(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();
  // Remove markdown headers like # or ##
  text = text.replace(/^#+.*$/gm, '').trim();
  // Remove prefixes like "Lời nhận xét:", "Nhận xét:", "Đánh giá:", "Học bạ:"
  text = text.replace(/^(Lời nhận xét|Nhận xét|Đánh giá|Học bạ|Nhận xét giáo viên|Đánh giá định kỳ)\s*:\s*/i, '');
  // Remove surrounding quotes
  text = text.replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();
  // Remove markdown formatting
  text = text.replace(/\*\*/g, '').replace(/\*/g, '');
  // Remove multiple newlines
  text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  return text;
}

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
      aiGenSettings,
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
      aiGenSettings?: AIGenerationSettings;
      apiKey?: string;
      tone?: string;
      extraNotes?: string;
    };

    if (!student || !student.fullName) {
      return NextResponse.json({ error: 'Thiếu thông tin học sinh' }, { status: 400 });
    }

    // Determine active provider, key, baseUrl, modelName
    const provider = aiConfig?.provider || 'CUSTOM_OPENAI';
    const effectiveKey = (aiConfig?.apiKey || apiKey || (provider === 'GEMINI' ? process.env.GEMINI_API_KEY : '') || '').trim();
    let modelName = (aiConfig?.modelName || '').trim();
    const baseUrl = (aiConfig?.baseUrl || '').trim().replace(/\/+$/, '');
    const temperature = aiConfig?.temperature ?? 0.7;

    // Normalize Xiaomi MIMO model name
    if (baseUrl.includes('xiaomimimo') || provider === 'CUSTOM_OPENAI') {
      if (!modelName || modelName === 'mimo-v1' || modelName === 'mimo' || modelName === 'gemini-2.5-flash') {
        modelName = 'mimo-v2.5';
      }
    }

    // Determine generation parameters
    const targetWordCount = aiGenSettings?.targetWordCount || 60;
    const targetSentenceCount = aiGenSettings?.targetSentenceCount || 3;
    const effectiveTone = aiGenSettings?.tone || tone || 'standard';
    const customToneDescription = aiGenSettings?.customToneText || '';

    const incSubjects = aiGenSettings?.includeSubjectGrades !== false;
    const incTraits = aiGenSettings?.includeTraitsAndCompetencies !== false;
    const incStars = aiGenSettings?.includeDailyStarsAndComments !== false;
    const incAttendance = aiGenSettings?.includeAttendanceAndBoarding !== false;

    // Nếu không có API Key, sử dụng smart offline pedagogical engine
    if (!effectiveKey) {
      const fallbackComment = generateSmartComment(student, subjects, traits, extraNotes, starLogs, attendances, aiGenSettings);
      return NextResponse.json({ success: true, comment: fallbackComment, source: 'Mẫu Sư Phạm Ngoại Tuyến (Offline)', isRealAI: false });
    }

    // Build comprehensive context for the student
    const subjectSummary = incSubjects && subjects.length > 0
      ? subjects
          .map((s) => `${s.subjectCode}: mức ${s.level}${s.score !== undefined && s.score !== null ? ` (điểm ${s.score})` : ''}`)
          .join(', ')
      : 'Không bắt buộc phân tích chi tiết từng môn.';

    const traitSummary = incTraits && traits.length > 0
      ? traits
          .map((t) => `${t.traitCode}: mức ${t.level}`)
          .join(', ')
      : 'Không bắt buộc phân tích chi tiết từng phẩm chất.';

    // Extract behavior & star logs for this student
    const studentStars = starLogs.filter((l) => l.studentId === student.id);
    const totalStars = studentStars.reduce((sum, l) => sum + l.points, 0);
    const recentPraises = studentStars
      .filter((l) => l.reason)
      .slice(0, 5)
      .map((l) => l.reason + (l.comment ? ` ("${l.comment}")` : ''))
      .join('; ');

    const behaviorHistorySummary = incStars && studentStars.length > 0
      ? `Tổng ${totalStars} sao nề nếp thi đua. Các biểu hiện và nhận xét hàng ngày của cô giáo: ${recentPraises || 'Ngoan ngoãn, chấp hành tốt nội quy'}`
      : incStars
      ? 'Ý thức nề nếp tốt, tích cực tham gia các phong trào học tập của lớp.'
      : 'Bỏ qua chi tiết sao nề nếp.';

    // Attendance summary
    const studentAtt = attendances.filter((a) => a.studentId === student.id);
    const absentCount = studentAtt.filter((a) => a.status !== 'CO_MAT').length;
    const attendanceSummary = incAttendance
      ? absentCount === 0
        ? 'Đi học chuyên cần, đúng giờ, tham gia đầy đủ các buổi học.'
        : `Đi học đều, có ${absentCount} buổi nghỉ học có lý do.`
      : 'Bỏ qua chi tiết chuyên cần.';

    // Tone instructions
    let toneInstruction = 'Chuẩn mực sư phạm Thông tư 27/2020/TT-BGDĐT, ấm áp và khích lệ sự tiến bộ của học sinh.';
    if (effectiveTone === 'encouraging') {
      toneInstruction = 'Thân mật, ấm áp, chan chứa tình yêu thương và truyền cảm hứng tự tin cho học sinh.';
    } else if (effectiveTone === 'detailed') {
      toneInstruction = 'Tỉ mỉ, chi tiết, phân tích rõ ràng điểm mạnh vượt trội và khía cạnh cần tiếp tục phát huy.';
    } else if (effectiveTone === 'concise') {
      toneInstruction = 'Rất ngắn gọn, súc tích, câu chữ cô đọng vừa vặn in vào sổ học bạ điện tử.';
    } else if (effectiveTone === 'custom' && customToneDescription) {
      toneInstruction = `Tùy chỉnh riêng theo giáo viên: ${customToneDescription}`;
    }

    const prompt = `
Bạn là một Giáo viên Chủ nhiệm Tiểu học chuẩn mực tại Việt Nam.
Nhiệm vụ của bạn là viết một đoạn LỜI NHẬN XÉT HỌC BẠ cho học sinh tiểu học theo Thông tư 27/2020/TT-BGDĐT.

=== THAM SỐ YÊU CẦU ===
- Độ dài: Khoảng ${targetWordCount} từ (đúng ${targetSentenceCount} câu).
- Phong cách: ${toneInstruction}

=== THÔNG TIN HỌC SINH ===
- Họ và tên: ${student.fullName} (${student.gender})
- Xưng hô: "Em", "Em ${student.fullName.split(' ').pop()}"
- Kết quả học tập: ${subjectSummary}
- Năng lực & Phẩm chất: ${traitSummary}
- Nề nếp & Nhận xét hàng ngày của cô: ${behaviorHistorySummary}
- Chuyên cần: ${attendanceSummary}
- Định hướng riêng: ${extraNotes || 'Không có'}

=== QUY TẮC BẮT BUỘC ===
1. CHỈ TRẢ VỀ DUY NHẤT 1 đoạn văn nhận xét ngắn gọn (đúng ${targetSentenceCount} câu, ~${targetWordCount} từ).
2. TUYỆT ĐỐI KHÔNG xuất tiêu đề (#, ##), không gạch đầu dòng, không đề mục, không có "Lời nhận xét:".
3. Tích cực, ấm áp, kết hợp điểm môn học và sao nề nếp hàng ngày.
`;

    // 1. OPENAI & CUSTOM OPENAI-COMPATIBLE PROVIDERS (Xiaomi MIMO, DeepSeek, OpenRouter, Groq, Ollama, etc.)
    if (provider === 'OPENAI' || provider === 'CUSTOM_OPENAI') {
      try {
        const endpoint = baseUrl
          ? `${baseUrl}/chat/completions`
          : provider === 'OPENAI'
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://api.xiaomimimo.com/v1/chat/completions';

        const selectedModel = modelName || (baseUrl.includes('xiaomimimo') ? 'mimo-v2.5' : 'gpt-4o-mini');

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
                content: 'Bạn là Giáo viên Chủ nhiệm Tiểu học tại Việt Nam. QUY TẮC BẮT BUỘC: Bạn CHỈ ĐƯỢC trả về DUY NHẤT 1 đoạn văn nhận xét học bạ ngắn gọn (khoảng 3 câu, 50-60 từ). TUYỆT ĐỐI KHÔNG xuất tiêu đề, không markdown, không gạch đầu dòng, không đề mục, không bọc ngoặc kép.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature,
            max_tokens: 800,
          }),
        });

        if (aiResponse.ok) {
          const resJson = await aiResponse.json();
          const rawText = resJson.choices?.[0]?.message?.content?.trim() || resJson.choices?.[0]?.message?.reasoning_content?.trim();
          const text = cleanAIComment(rawText);
          if (text) {
            return NextResponse.json({
              success: true,
              comment: text,
              source: baseUrl.includes('xiaomimimo') ? 'Xiaomi MIMO AI' : provider === 'OPENAI' ? 'OpenAI GPT' : 'Custom AI',
              model: selectedModel,
              isRealAI: true,
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

    // 2. GOOGLE GEMINI PROVIDER
    if (provider === 'GEMINI') {
      try {
        const ai = new GoogleGenAI({ apiKey: effectiveKey });
        const selectedModel = modelName || 'gemini-2.5-flash';

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: prompt,
        });

        const rawText = response.text?.trim() || '';
        const text = cleanAIComment(rawText);
        if (text) {
          return NextResponse.json({
            success: true,
            comment: text,
            source: 'Google Gemini AI',
            model: selectedModel,
            isRealAI: true,
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, trying fallback:', geminiError?.message || geminiError);
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
            max_tokens: 500,
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
          const rawText = resJson.content?.[0]?.text?.trim() || '';
          const text = cleanAIComment(rawText);
          if (text) {
            return NextResponse.json({
              success: true,
              comment: text,
              source: 'Anthropic Claude AI',
              model: selectedModel,
              isRealAI: true,
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
    const fallbackComment = generateSmartComment(student, subjects, traits, extraNotes, starLogs, attendances, aiGenSettings);
    return NextResponse.json({
      success: true,
      comment: fallbackComment,
      source: 'Mẫu Sư Phạm Ngoại Tuyến (Offline)',
      isRealAI: false,
    });
  } catch (error: any) {
    console.error('API /api/generate-comment error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo nhận xét' }, { status: 500 });
  }
}
