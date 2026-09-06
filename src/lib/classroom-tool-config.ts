import { supabase } from '@/lib/supabase';

export type ClassroomTool = 'TEAM_QUIZ' | 'MYSTERY_CHEST';

function configId(ownerEmail: string, classId: string, tool: ClassroomTool) {
  return `${tool}:${classId}:${ownerEmail.toLowerCase()}`;
}

export async function loadClassroomToolConfig<T>(
  ownerEmail: string,
  classId: string,
  tool: ClassroomTool
): Promise<T | null> {
  if (!ownerEmail || !classId) return null;
  const { data, error } = await supabase
    .from('ClassroomToolConfig')
    .select('data')
    .eq('ownerEmail', ownerEmail.toLowerCase())
    .eq('classId', classId)
    .eq('tool', tool)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.data as T | undefined) || null;
}

export async function saveClassroomToolConfig<T>(
  ownerEmail: string,
  classId: string,
  tool: ClassroomTool,
  data: T
): Promise<void> {
  if (!ownerEmail || !classId) throw new Error('Thiếu giáo viên hoặc lớp để lưu cấu hình.');
  const { error } = await supabase.from('ClassroomToolConfig').upsert({
    id: configId(ownerEmail, classId, tool),
    ownerEmail: ownerEmail.toLowerCase(),
    classId,
    tool,
    data,
    updatedAt: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
