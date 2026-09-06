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
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let token = 'gvcn_pat_';
  for (const byte of bytes) {
    token += chars.charAt(byte % chars.length);
  }
  return token;
}

const unauthenticated = (error: string): AuthenticatedTeacherContext => ({
  isAuthenticated: false,
  teacherEmail: '',
  teacherName: '',
  classId: '',
  className: '',
  role: '',
  error,
});

async function resolveTeacherContext(
  email: string,
  fallbackClassId?: string
): Promise<AuthenticatedTeacherContext> {
  const { data: teacher, error: teacherError } = await supabase
    .from('Teacher')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (teacherError) {
    return unauthenticated(`Không thể xác minh hồ sơ giáo viên: ${teacherError.message}`);
  }
  if (!teacher || teacher.isActive === false || teacher.role === 'PENDING') {
    return unauthenticated('Tài khoản chưa được cấp quyền hoặc đã bị vô hiệu hóa.');
  }

  const assignedClassId = fallbackClassId || teacher.assignedClassId || '';
  const assignedClassName = teacher.assignedClassName?.replace(/^Lớp\s+/i, '').trim() || '';
  let classId = assignedClassId;
  let className = assignedClassName;

  if (assignedClassId || assignedClassName) {
    let classQuery = supabase.from('Class').select('id, name');
    classQuery = assignedClassId
      ? classQuery.eq('id', assignedClassId)
      : classQuery.eq('name', assignedClassName);
    const { data: classRecord, error: classError } = await classQuery.maybeSingle();
    if (classError) {
      return unauthenticated(`Không thể xác minh lớp được phân công: ${classError.message}`);
    }
    if (classRecord) {
      classId = classRecord.id;
      className = classRecord.name;
    }
  }

  return {
    isAuthenticated: true,
    teacherEmail: teacher.email,
    teacherName: teacher.fullName || teacher.email,
    classId,
    className,
    role: teacher.role,
  };
}

// Validate token from Authorization Header or query param
export async function authenticateMcpRequest(
  authHeader: string | null,
  queryKey: string | null
): Promise<AuthenticatedTeacherContext> {
  const rawToken = authHeader?.replace(/^Bearer\s+/i, '').trim() || queryKey?.trim();

  if (!rawToken) {
    return unauthenticated('Thiếu khóa API hoặc access token.');
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

      if (keyErr) {
        return unauthenticated(`Không thể xác minh khóa API: ${keyErr.message}`);
      }

      if (keyRecord) {
        if (keyRecord.expiresAt && new Date(keyRecord.expiresAt).getTime() <= Date.now()) {
          return unauthenticated('Khóa API đã hết hạn.');
        }

        void supabase
          .from('ApiKey')
          .update({ lastUsedAt: new Date().toISOString() })
          .eq('id', keyRecord.id)
          .then(({ error }) => {
            if (error) console.warn('Không thể cập nhật thời điểm sử dụng khóa API:', error.message);
          });

        return resolveTeacherContext(keyRecord.teacherEmail, keyRecord.classId);
      }

      return unauthenticated('Khóa API không hợp lệ hoặc đã bị thu hồi.');
    }

    // 2. Check if token is a Supabase JWT Session Token
    const { data: userData, error: userErr } = await supabase.auth.getUser(rawToken);
    if (!userErr && userData?.user) {
      const email = userData.user.email;
      if (!email) return unauthenticated('Tài khoản không có địa chỉ email hợp lệ.');
      return resolveTeacherContext(email);
    }

    return unauthenticated('Khóa API không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.');
  } catch (err: any) {
    return unauthenticated(err?.message || 'Lỗi xác thực khóa MCP.');
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
    classId,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from('ApiKey').insert(record);
  if (error) {
    return { error: `Không thể lưu khóa API: ${error.message}` };
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
