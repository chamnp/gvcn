import LZString from 'lz-string';
import { LessonPlan } from '@/types';

export interface LessonPackageMetadata {
  format: 'GVCN_LESSON_PACKAGE';
  version: '1.0.0';
  exportedAt: string;
  authorName?: string;
  schoolName?: string;
  license?: string;
}

export interface LessonPackage {
  $schema: string;
  metadata: LessonPackageMetadata;
  lessonPlan: LessonPlan;
}

// ─── 1. PACKAGE EXPORT & DOWNLOAD (.gvcnlp) ─────────────────────────

export function createLessonPackage(
  plan: LessonPlan,
  authorName: string = 'Giáo viên GVCN',
  schoolName: string = 'Tiểu học'
): LessonPackage {
  return {
    $schema: 'https://gvcn.vn/schemas/lesson-package-v1.json',
    metadata: {
      format: 'GVCN_LESSON_PACKAGE',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      authorName,
      schoolName,
      license: 'CC-BY-SA-4.0',
    },
    lessonPlan: plan,
  };
}

export function downloadLessonPackageFile(
  plan: LessonPlan,
  authorName: string = 'Giáo viên GVCN',
  schoolName: string = 'Tiểu học'
) {
  const pkg = createLessonPackage(plan, authorName, schoolName);
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });

  // Sanitize filename: VD Toan4_Tuan1_Tiet1_Bai1.gvcnlp
  const cleanTitle = plan.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 40);
  const filename = `${plan.subjectCode}_T${plan.week}_P${plan.periodNumber}_${cleanTitle}.gvcnlp`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── 2. PACKAGE IMPORT (.gvcnlp) ────────────────────────────────────

export async function parseLessonPackageFile(file: File): Promise<LessonPlan> {
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Tập tin không đúng định dạng JSON hoặc đã bị lỗi khi tải về.');
  }

  // Support both wrapped package ({ metadata, lessonPlan }) and raw LessonPlan
  if (parsed.metadata?.format === 'GVCN_LESSON_PACKAGE' && parsed.lessonPlan) {
    return sanitizeImportedPlan(parsed.lessonPlan);
  }

  if (parsed.id && parsed.title && parsed.activities) {
    return sanitizeImportedPlan(parsed);
  }

  throw new Error('Tập tin không phải là gói giáo án GVCN Pro hợp lệ.');
}

function sanitizeImportedPlan(plan: any): LessonPlan {
  return {
    ...plan,
    // Assign a fresh ID so it won't accidentally overwrite an existing plan
    id: `plan-imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    updatedAt: new Date().toISOString(),
  };
}

// ─── 3. ZERO-STORAGE SHAREABLE URL (LZ-STRING ENCODING) ─────────────

export function encodeLessonPlanToShareUrl(plan: LessonPlan, baseUrl?: string): string {
  const pkg = createLessonPackage(plan);
  const jsonStr = JSON.stringify(pkg);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://www.gvcn.pro.vn');
  return `${origin}/lesson-plans?pkg=${compressed}`;
}

export function decodeLessonPlanFromShareString(compressedStr: string): LessonPlan | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressedStr);
    if (!decompressed) return null;
    const parsed = JSON.parse(decompressed);

    if (parsed.metadata?.format === 'GVCN_LESSON_PACKAGE' && parsed.lessonPlan) {
      return sanitizeImportedPlan(parsed.lessonPlan);
    }
    if (parsed.id && parsed.title) {
      return sanitizeImportedPlan(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

// ─── 4. SMART EMBED URL TRANSFORMER FOR PRESENTATIONS ───────────────

export type ExternalResourceType =
  | 'GOOGLE_SLIDES'
  | 'GOOGLE_DOCS'
  | 'POWERPOINT'
  | 'WORD'
  | 'CANVA'
  | 'PDF'
  | 'GENERIC_IFRAME';

export interface TransformedResource {
  embedUrl: string;
  originalUrl: string;
  type: ExternalResourceType;
  title: string;
}

export function transformToEmbedUrl(rawUrl: string): TransformedResource {
  const url = (rawUrl || '').trim();

  // 1. Google Slides
  if (url.includes('docs.google.com/presentation/d/')) {
    const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const id = match[1];
      return {
        embedUrl: `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`,
        originalUrl: url,
        type: 'GOOGLE_SLIDES',
        title: 'Google Slides Trình Chiếu',
      };
    }
  }

  // 2. Google Docs
  if (url.includes('docs.google.com/document/d/')) {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const id = match[1];
      return {
        embedUrl: `https://docs.google.com/document/d/${id}/preview`,
        originalUrl: url,
        type: 'GOOGLE_DOCS',
        title: 'Google Docs Văn Bản / Phiếu Học Tập',
      };
    }
  }

  // 3. Google Drive Shared File (PDF, PPTX, Word uploaded to Drive)
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const id = match[1];
      return {
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        originalUrl: url,
        type: 'PDF',
        title: 'Tài Liệu Google Drive (PPTX / PDF / Word)',
      };
    }
  }

  // 4. OneDrive Live
  if (url.includes('onedrive.live.com') && url.includes('view.aspx')) {
    return {
      embedUrl: url.replace('view.aspx', 'embed.aspx'),
      originalUrl: url,
      type: 'POWERPOINT',
      title: 'OneDrive Bài Giảng Trực Tuyến',
    };
  }

  // 3. Canva Presentation
  if (url.includes('canva.com/design/')) {
    let embedUrl = url;
    if (!url.includes('?embed') && !url.includes('/view')) {
      embedUrl = url.split('?')[0] + '/view?embed';
    } else if (url.includes('/view') && !url.includes('embed')) {
      embedUrl = url.replace('/view', '/view?embed');
    }
    return {
      embedUrl,
      originalUrl: url,
      type: 'CANVA',
      title: 'Canva Bài Giảng Trực Tuyến',
    };
  }

  // 4. Microsoft PowerPoint (.pptx, .ppt)
  const isPptx = url.endsWith('.pptx') || url.endsWith('.ppt') || url.includes('.pptx?') || url.includes('.ppt?');
  if (isPptx) {
    return {
      embedUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
      originalUrl: url,
      type: 'POWERPOINT',
      title: 'Microsoft PowerPoint Trực Tuyến',
    };
  }

  // 5. Microsoft Word (.docx, .doc)
  const isDocx = url.endsWith('.docx') || url.endsWith('.doc') || url.includes('.docx?') || url.includes('.doc?');
  if (isDocx) {
    return {
      embedUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
      originalUrl: url,
      type: 'WORD',
      title: 'Microsoft Word Trực Tuyến',
    };
  }

  // 6. PDF File
  if (url.endsWith('.pdf') || url.includes('.pdf?')) {
    return {
      embedUrl: url,
      originalUrl: url,
      type: 'PDF',
      title: 'Tài Liệu PDF / SGK Điện Tử',
    };
  }

  // 7. Generic iframe
  return {
    embedUrl: url,
    originalUrl: url,
    type: 'GENERIC_IFRAME',
    title: 'Học Liệu Web Nhúng',
  };
}
