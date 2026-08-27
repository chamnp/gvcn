import { Student, SubjectAssessment, TraitAssessment, StarLog, DailyAttendance, AIConfig, AIGenerationSettings } from '@/types';
import { generateSmartComment } from './comment-bank';

export interface GenerateCommentRequest {
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
}

export interface GeneratedCommentResult {
  comment: string;
  source: string;
  isRealAI: boolean;
  model?: string;
}

export async function generateStudentAICommentFull(req: GenerateCommentRequest): Promise<GeneratedCommentResult> {
  const { student, subjects, traits, starLogs = [], attendances = [], aiConfig, aiGenSettings, apiKey, tone = 'standard', extraNotes } = req;

  // 1. Chế độ TỰ ĐỘNG NGOẠI TUYẾN (Offline Smart Pedagogical Bank)
  if (aiGenSettings?.mode === 'OFFLINE_BANK') {
    const offlineComment = generateSmartComment(
      student,
      subjects,
      traits,
      extraNotes,
      starLogs,
      attendances,
      aiGenSettings
    );
    return {
      comment: offlineComment,
      source: 'Mẫu Sư Phạm Ngoại Tuyến (Offline)',
      isRealAI: false,
    };
  }

  // 2. Chế độ AI TRỰC TUYẾN (Online LLM)
  try {
    const res = await fetch('/api/generate-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student,
        subjects,
        traits,
        starLogs,
        attendances,
        aiConfig,
        aiGenSettings,
        apiKey: aiConfig?.apiKey || apiKey,
        tone: aiGenSettings?.tone || tone,
        extraNotes: [aiGenSettings?.classDirectivePrompt, extraNotes].filter(Boolean).join('; '),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.comment) {
        return {
          comment: data.comment,
          source: data.source || 'AI Provider',
          isRealAI: !!data.isRealAI,
          model: data.model,
        };
      }
    }
  } catch (err) {
    console.warn('Network error calling /api/generate-comment, fallback to local pedagogical bank:', err);
  }

  // Fallback ngoại tuyến (100% offline-ready)
  return {
    comment: generateSmartComment(student, subjects, traits, extraNotes, starLogs, attendances, aiGenSettings),
    source: 'Mẫu Sư Phạm Ngoại Tuyến (Fallback)',
    isRealAI: false,
  };
}

export async function generateStudentAIComment(req: GenerateCommentRequest): Promise<string> {
  const res = await generateStudentAICommentFull(req);
  return res.comment;
}
