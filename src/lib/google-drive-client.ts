import { transformToEmbedUrl, ExternalResourceType } from './lesson-package-engine';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  type: ExternalResourceType;
  thumbnailLink?: string;
  webViewLink: string;
  embedUrl: string;
  modifiedTime?: string;
  size?: string;
}

const STORAGE_KEY_TOKEN = 'gvcn_google_access_token';
const STORAGE_KEY_TIME = 'gvcn_google_token_time';
const STORAGE_KEY_REFRESH = 'gvcn_google_refresh_token';

// ─── Token Management (Keep Login) ──────────────────────────────────

export function getStoredGoogleAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function isGoogleTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const timeStr = localStorage.getItem(STORAGE_KEY_TIME);
  if (!token || !timeStr) return true;

  const tokenTime = parseInt(timeStr, 10);
  // Google access token lasts 3600 seconds (60 mins). Consider expired after 55 mins.
  const elapsedSeconds = (Date.now() - tokenTime) / 1000;
  return elapsedSeconds > 3300;
}

export function saveGoogleTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEY_TIME, Date.now().toString());
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);
  }
}

export function clearGoogleTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_TIME);
  localStorage.removeItem(STORAGE_KEY_REFRESH);
}

// ─── Fetch Google Drive Files via API v3 ────────────────────────────

export async function fetchTeacherDriveFiles(
  accessToken: string | null,
  searchKeyword: string = '',
  filterCategory: 'ALL' | 'SLIDES' | 'DOCS' | 'PDF' = 'ALL'
): Promise<GoogleDriveFile[]> {
  // If we have a valid access token, fetch real files from Google Drive API v3
  if (accessToken && !isGoogleTokenExpired()) {
    try {
      // Build MIME filter query for classroom lesson materials
      let mimeQuery = '';
      if (filterCategory === 'SLIDES') {
        mimeQuery = `(mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation' or mimeType = 'application/vnd.ms-powerpoint')`;
      } else if (filterCategory === 'DOCS') {
        mimeQuery = `(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'application/msword')`;
      } else if (filterCategory === 'PDF') {
        mimeQuery = `(mimeType = 'application/pdf')`;
      } else {
        mimeQuery = `(mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'application/pdf')`;
      }

      let q = `trashed = false and ${mimeQuery}`;
      if (searchKeyword.trim()) {
        const sanitized = searchKeyword.trim().replace(/['\\]/g, '');
        q += ` and name contains '${sanitized}'`;
      }

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        q
      )}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,iconLink,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=40`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const files: GoogleDriveFile[] = (data.files || []).map((f: any) => {
          let type: ExternalResourceType = 'GENERIC_IFRAME';
          let embedUrl = `https://drive.google.com/file/d/${f.id}/preview`;

          if (f.mimeType === 'application/vnd.google-apps.presentation') {
            type = 'GOOGLE_SLIDES';
            embedUrl = `https://docs.google.com/presentation/d/${f.id}/embed?start=false&loop=false&delayms=3000`;
          } else if (f.mimeType === 'application/vnd.google-apps.document') {
            type = 'GOOGLE_DOCS';
            embedUrl = `https://docs.google.com/document/d/${f.id}/preview`;
          } else if (
            f.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            f.mimeType === 'application/vnd.ms-powerpoint'
          ) {
            type = 'POWERPOINT';
            embedUrl = `https://drive.google.com/file/d/${f.id}/preview`;
          } else if (
            f.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            f.mimeType === 'application/msword'
          ) {
            type = 'WORD';
            embedUrl = `https://drive.google.com/file/d/${f.id}/preview`;
          } else if (f.mimeType === 'application/pdf') {
            type = 'PDF';
            embedUrl = `https://drive.google.com/file/d/${f.id}/preview`;
          }

          return {
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            type,
            thumbnailLink: f.thumbnailLink,
            webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
            embedUrl,
            modifiedTime: f.modifiedTime,
            size: f.size,
          };
        });

        if (files.length > 0) {
          return files;
        }
      }
    } catch (err) {
      console.warn('Error querying Google Drive API, falling back to curated teacher library:', err);
    }
  }

  // ─── Curated Fallback Mock Drive for Demonstration & Quick Testing ───
  // Gives teacher immediate ready-to-present Grade 4 slide decks if no files found
  const mockDriveFiles: GoogleDriveFile[] = [
    {
      id: 'gdrive-toan-4-t1',
      name: 'Toán 4 - Bài 12: Các số có sáu chữ số (Slide Trình Chiếu)',
      mimeType: 'application/vnd.google-apps.presentation',
      type: 'GOOGLE_SLIDES',
      thumbnailLink: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300&auto=format&fit=crop&q=80',
      webViewLink: 'https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      embedUrl: 'https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/embed?start=false&loop=false&delayms=3000',
      modifiedTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      size: '2.4 MB',
    },
    {
      id: 'gdrive-pptx-khoahoc-4',
      name: 'Khoa Học 4 - Bài 5: Vai trò của nước trong đời sống (PowerPoint TV)',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      type: 'POWERPOINT',
      thumbnailLink: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80',
      webViewLink: 'https://onedrive.live.com/view.aspx?resid=khoahoc4',
      embedUrl: 'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fwww.gvcn.pro.vn%2Fsamples%2Fkhoahoc4.pptx',
      modifiedTime: new Date(Date.now() - 3600000 * 24).toISOString(),
      size: '5.1 MB',
    },
    {
      id: 'gdrive-tv-4-gdoc',
      name: 'Tiếng Việt 4 - Phiếu Học Tập & Luyện Đọc: Sự tích hoa cúc trắng',
      mimeType: 'application/vnd.google-apps.document',
      type: 'GOOGLE_DOCS',
      thumbnailLink: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80',
      webViewLink: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      embedUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
      modifiedTime: new Date(Date.now() - 3600000 * 48).toISOString(),
      size: '340 KB',
    },
    {
      id: 'gdrive-pdf-sgk-lsdl',
      name: 'Lịch Sử & Địa Lý 4 - SGK Điện Tử: Vùng Trung du Bắc Bộ (PDF)',
      mimeType: 'application/pdf',
      type: 'PDF',
      thumbnailLink: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&auto=format&fit=crop&q=80',
      webViewLink: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
      embedUrl: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview',
      modifiedTime: new Date(Date.now() - 3600000 * 72).toISOString(),
      size: '8.7 MB',
    },
    {
      id: 'gdrive-tinhoc-4',
      name: 'Tin Học 4 - Bài 3: Tạo bài trình chiếu đa phương tiện (Google Slides)',
      mimeType: 'application/vnd.google-apps.presentation',
      type: 'GOOGLE_SLIDES',
      thumbnailLink: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=80',
      webViewLink: 'https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
      embedUrl: 'https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/embed?start=false&loop=false&delayms=3000',
      modifiedTime: new Date(Date.now() - 3600000 * 12).toISOString(),
      size: '4.2 MB',
    },
  ];

  return mockDriveFiles.filter((f) => {
    const matchSearch =
      !searchKeyword.trim() || f.name.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchCategory =
      filterCategory === 'ALL' ||
      (filterCategory === 'SLIDES' && (f.type === 'GOOGLE_SLIDES' || f.type === 'POWERPOINT')) ||
      (filterCategory === 'DOCS' && (f.type === 'GOOGLE_DOCS' || f.type === 'WORD')) ||
      (filterCategory === 'PDF' && f.type === 'PDF');
    return matchSearch && matchCategory;
  });
}
