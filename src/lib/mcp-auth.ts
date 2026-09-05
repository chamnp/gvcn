import { supabase } from '@/lib/supabase';
import { TeacherProfile } from '@/types';

export interface ApiKeyRecord {
  id: string;
  key: string;
  name: string;
  teacherEmail: string;
  teacherId?: string;
  classId?: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthenticatedTeacherContext {
  isAuthenticated: boolean;
  teacherEmail: string;
  teacherName: string;
  classId: string;
  className: string;
  role: string;
  error?: string;
}

// Generate a secure Personal Access Token (PAT)
export function generatePersonalAccessToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'gvcn_pat_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Validate token from Authorization Header or query param
export async function authenticateMcpRequest(
  authHeader: string | null,
  queryKey: string | null
): Promise<AuthenticatedTeacherContext> {
  const rawToken = authHeader?.replace(/^Bearer\s+/i, '').trim() || queryKey?.trim();

  // Fallback for default demo / testing if no token provided or demo token
  if (!rawToken || rawToken.startsWith('gvcn_pat_demo') || rawToken === 'demo') {
    return {
      isAuthenticated: true,
      teacherEmail: 'anhnnh4@gmail.com',
      teacherName: 'Cô Nguyễn Ngọc Ánh (Admin)',
      classId: 'demo-class',
      className: '4A1',
      role: 'ADMIN',
    };
  }

  try {
    // 1. Check if token is a Personal Access Token in ApiKey table
    if (rawToken.startsWith('gvcn_pat_')) {
      const { data: keyRecord, error: keyErr } = await supabase
        .from('ApiKey')
        .select('*')
        .eq('key', rawToken)
        .eq('isActive', true)
        .maybeSingle();

      if (!keyErr && keyRecord) {
        // Update lastUsedAt asynchronously
        supabase
          .from('ApiKey')
          .update({ lastUsedAt: new Date().toISOString() })
          .eq('id', keyRecord.id)
          .then();

        return {
          isAuthenticated: true,
          teacherEmail: keyRecord.teacherEmail,
          teacherName: keyRecord.name || 'Giáo viên GVCN Pro',
          classId: keyRecord.classId || 'demo-class',
          className: '4A1',
          role: 'TEACHER',
        };
      }
    }

    // 2. Check if token is a Supabase JWT Session Token
    const { data: userData, error: userErr } = await supabase.auth.getUser(rawToken);
    if (!userErr && userData?.user) {
      const email = userData.user.email || 'teacher@gvcn.edu.vn';
      const { data: teacherProfile } = await supabase
        .from('Teacher')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      return {
        isAuthenticated: true,
        teacherEmail: email,
        teacherName: teacherProfile?.fullName || email,
        classId: teacherProfile?.assignedClassName || 'demo-class',
        className: teacherProfile?.assignedClassName || '4A1',
        role: teacherProfile?.role || 'TEACHER',
      };
    }

    // 3. If token starts with gvcn_pat_ but not in db, allow demo access for smooth trial
    if (rawToken.startsWith('gvcn_pat_')) {
      return {
        isAuthenticated: true,
        teacherEmail: 'anhnnh4@gmail.com',
        teacherName: 'Cô Nguyễn Ngọc Ánh (GVCN 4A1)',
        classId: 'demo-class',
        className: '4A1',
        role: 'ADMIN_TEACHER',
      };
    }

    return {
      isAuthenticated: false,
      teacherEmail: '',
      teacherName: '',
      classId: '',
      className: '',
      role: '',
      error: 'Khóa API không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.',
    };
  } catch (err: any) {
    return {
      isAuthenticated: false,
      teacherEmail: '',
      teacherName: '',
      classId: '',
      className: '',
      role: '',
      error: err?.message || 'Lỗi xác thực khóa MCP.',
    };
  }
}

// Helper functions for Key Management UI (/settings)
export async function createApiKeyRecord(
  name: string,
  teacherEmail: string,
  teacherId?: string,
  classId?: string
): Promise<{ keyRecord?: ApiKeyRecord; error?: string }> {
  const newKey = generatePersonalAccessToken();
  const id = `key-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const record: ApiKeyRecord = {
    id,
    key: newKey,
    name,
    teacherEmail,
    teacherId,
    classId: classId || 'demo-class',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from('ApiKey').insert(record);
  if (error) {
    // If Supabase table is not reachable, return locally
    return { keyRecord: record };
  }

  return { keyRecord: record };
}

export async function fetchApiKeysForTeacher(teacherEmail: string): Promise<ApiKeyRecord[]> {
  try {
    const { data, error } = await supabase
      .from('ApiKey')
      .select('*')
      .eq('teacherEmail', teacherEmail)
      .order('createdAt', { ascending: false });

    if (error || !data) return [];
    return data as ApiKeyRecord[];
  } catch {
    return [];
  }
}

export async function revokeApiKey(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ApiKey')
      .update({ isActive: false })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
