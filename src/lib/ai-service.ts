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

  // Gọi qua API Route để bảo mật API key server-side
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
        apiKey,
        tone,
        extraNotes,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.comment) {
        return data.comment;
      }
    }
  } catch (err) {
    console.warn('Network error calling /api/generate-comment, fallback to local pedagogical bank:', err);
  }

  // Fallback ngoại tuyến (100% offline-ready)
  return generateSmartComment(student, subjects, traits, extraNotes);
}
