'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { TeacherProfile, UserRole } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: TeacherProfile | null;
  isAuthorized: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithOtp: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  
  // Whitelist & Teacher Management (Synchronized with Supabase)
  teachers: TeacherProfile[];
  refreshTeachers: () => Promise<TeacherProfile[]>;
  addTeacher: (data: {
    email: string;
    fullName: string;
    role: UserRole;
    title?: string;
    department?: string;
    assignedClassName?: string;
    phone?: string;
  }) => Promise<void>;
  updateTeacher: (id: string, partial: Partial<TeacherProfile>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
}

const DEFAULT_TEACHERS: TeacherProfile[] = [
  {
    id: 't-admin-1',
    email: 'anhnnh4@gmail.com',
    fullName: 'Admin Quản Trị Viên (Hiệu Trưởng)',
    role: 'ADMIN_TEACHER',
    title: 'Hiệu trưởng kiêm GVCN',
    department: 'Ban Giám Hiệu',
    assignedClassId: 'class-4a1',
    assignedClassName: 'Lớp 4A1',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-teacher-1',
    email: 'cham@chuyenkhoan.vn',
    fullName: 'Cô Nguyễn Thị Mai',
    role: 'TEACHER',
    title: 'Giáo viên Chủ nhiệm',
    department: 'Tổ Khối 4',
    assignedClassId: 'class-4a1',
    assignedClassName: 'Lớp 4A1',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-teacher-2',
    email: 'leha@school.edu.vn',
    fullName: 'Cô Lê Thị Hà',
    role: 'TEACHER',
    title: 'Tổ trưởng Khối 1 & GVCN',
    department: 'Tổ Khối 1',
    assignedClassId: 'class-1a1',
    assignedClassName: 'Lớp 1A1',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-teacher-3',
    email: 'thucuc@school.edu.vn',
    fullName: 'Cô Trần Thu Cúc',
    role: 'TEACHER',
    title: 'Giáo viên Chủ nhiệm',
    department: 'Tổ Khối 2',
    assignedClassId: 'class-2a1',
    assignedClassName: 'Lớp 2A1',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-teacher-4',
    email: 'vannam@school.edu.vn',
    fullName: 'Thầy Phạm Văn Nam',
    role: 'TEACHER',
    title: 'Giáo viên Chủ nhiệm',
    department: 'Tổ Khối 3',
    assignedClassId: 'class-3a1',
    assignedClassName: 'Lớp 3A1',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-teacher-5',
    email: 'minhduc@school.edu.vn',
    fullName: 'Thầy Hoàng Minh Đức',
    role: 'TEACHER',
    title: 'Tổ trưởng Khối 5 & GVCN',
    department: 'Tổ Khối 5',
    assignedClassId: 'class-5a1',
    assignedClassName: 'Lớp 5A1',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [teachers, setTeachers] = useState<TeacherProfile[]>(DEFAULT_TEACHERS);
  const [loading, setLoading] = useState(true);

  // Fetch teachers from Supabase (with fallback to localStorage / defaults)
  const refreshTeachers = useCallback(async (): Promise<TeacherProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('Teacher')
        .select('*')
        .order('createdAt', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: TeacherProfile[] = data.map((row: any) => ({
          id: row.id,
          email: (row.email || '').toLowerCase().trim(),
          fullName: row.fullName || 'Giáo viên',
          role: (row.role || 'TEACHER') as UserRole,
          title: row.title || (row.role === 'ADMIN' ? 'Ban Giám Hiệu' : row.role === 'ADMIN_TEACHER' ? 'BGH kiêm GVCN' : 'Giáo viên Chủ nhiệm'),
          department: row.department || (row.role === 'ADMIN' ? 'Ban Giám Hiệu' : 'Tổ Chuyên môn'),
          assignedClassId: row.assignedClassId || undefined,
          assignedClassName: row.assignedClassName || (row.assignedClassId ? `Lớp ${row.assignedClassId.replace('class-', '').toUpperCase()}` : 'Lớp 4A1'),
          phone: row.phone || undefined,
          avatarUrl: row.avatarUrl || undefined,
          isActive: row.isActive !== false,
          createdAt: row.createdAt || new Date().toISOString(),
        }));

        setTeachers(mapped);
        try {
          localStorage.setItem('gvcn_teachers', JSON.stringify(mapped));
        } catch (e) {}
        return mapped;
      }
    } catch (err) {
      console.warn('Error fetching teachers from Supabase:', err);
    }

    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('gvcn_teachers');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTeachers(parsed);
        return parsed;
      }
    } catch (e) {}

    return DEFAULT_TEACHERS;
  }, []);

  // Initial load of teachers
  useEffect(() => {
    refreshTeachers();
  }, [refreshTeachers]);

  // Check role & profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const email = (user.email || '').toLowerCase().trim();
    const existing = teachers.find((t) => t.email.toLowerCase() === email);

    // 1. Primary Admin Account
    if (email === 'anhnnh4@gmail.com') {
      const adminProf: TeacherProfile = {
        id: existing?.id || `admin-${user.id}`,
        email,
        fullName: existing?.fullName || user.user_metadata?.full_name || 'Admin Quản Trị Viên (Hiệu Trưởng)',
        role: existing?.role || 'ADMIN_TEACHER',
        title: existing?.title || 'Hiệu trưởng kiêm GVCN',
        department: existing?.department || 'Ban Giám Hiệu',
        assignedClassId: existing?.assignedClassId || 'class-4a1',
        assignedClassName: existing?.assignedClassName || 'Lớp 4A1',
        isActive: true,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      setProfile(adminProf);
      return;
    }

    // 2. Check if user email is in whitelist
    if (existing) {
      setProfile(existing);
    } else {
      // 3. User is logged in but NOT in whitelist -> Record as PENDING in Supabase & state
      const pendingProfile: TeacherProfile = {
        id: `pending-${user.id}`,
        email,
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Giáo viên mới',
        role: 'PENDING',
        title: 'Chờ duyệt',
        department: 'Chưa phân bổ',
        assignedClassName: undefined,
        isActive: false,
        createdAt: new Date().toISOString(),
      };
      setProfile(pendingProfile);

      // Auto-register pending request in Supabase for Admin to see
      (async () => {
        try {
          const { error } = await supabase.from('Teacher').insert({
            email,
            fullName: pendingProfile.fullName,
            role: 'PENDING',
            title: pendingProfile.title,
            department: pendingProfile.department,
            isActive: false,
          });
          if (!error) {
            refreshTeachers();
          }
        } catch (e) {}
      })();
    }
  }, [user, teachers, refreshTeachers]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Google OAuth
  const signInWithGoogle = async () => {
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://gvcn-eta.vercel.app';
    const redirectTo = `${origin}/login`;

    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (res.error) {
      toast.error('Lỗi đăng nhập Google: ' + res.error.message);
    }
    return { error: res.error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) {
      toast.error(res.error.message);
    } else {
      toast.success('Đăng nhập thành công!');
    }
    return { error: res.error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'Giáo viên',
        },
      },
    });
    if (res.error) {
      toast.error(res.error.message);
    } else {
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email xác nhận.');
    }
    return { error: res.error };
  };

  const signInWithOtp = async (email: string) => {
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://gvcn-eta.vercel.app';
    const res = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/login`,
      },
    });
    if (res.error) {
      toast.error(res.error.message);
    } else {
      toast.success('Đã gửi mã/link đăng nhập vào email!');
    }
    return { error: res.error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    toast.info('Đã đăng xuất');
  };

  // TEACHER MANAGEMENT ACTIONS (Synced with Supabase)
  const addTeacher = async (data: {
    email: string;
    fullName: string;
    role: UserRole;
    title?: string;
    department?: string;
    assignedClassName?: string;
    phone?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.fullName.trim();
    const classId = data.assignedClassName ? `class-${data.assignedClassName.replace('Lớp ', '').toLowerCase()}` : undefined;

    // Write to Supabase
    try {
      await supabase.from('Teacher').upsert(
        {
          email: cleanEmail,
          fullName: cleanName,
          role: data.role,
          title: data.title,
          department: data.department,
          assignedClassId: classId,
          phone: data.phone,
          isActive: true,
        },
        { onConflict: 'email' }
      );
    } catch (e) {
      console.warn('Supabase upsert teacher error:', e);
    }

    const newT: TeacherProfile = {
      id: `t-${Date.now()}`,
      email: cleanEmail,
      fullName: cleanName,
      role: data.role,
      title: data.title || 'Giáo viên',
      department: data.department || 'Tổ Chuyên môn',
      assignedClassId: classId,
      assignedClassName: data.assignedClassName || (classId ? `Lớp ${data.assignedClassName}` : undefined),
      phone: data.phone,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...teachers.filter((t) => t.email.toLowerCase() !== cleanEmail), newT];
    setTeachers(updated);
    try {
      localStorage.setItem('gvcn_teachers', JSON.stringify(updated));
    } catch (e) {}

    toast.success(`Đã cấp quyền cho cán bộ/giáo viên ${data.email}!`);
  };

  const updateTeacher = async (id: string, partial: Partial<TeacherProfile>) => {
    const existing = teachers.find((t) => t.id === id);
    if (!existing) return;

    const cleanRole = partial.role || existing.role;
    const cleanActive = partial.isActive !== undefined ? partial.isActive : existing.isActive;
    const cleanClass = partial.assignedClassName !== undefined ? partial.assignedClassName : existing.assignedClassName;
    const classId = cleanClass ? `class-${cleanClass.replace('Lớp ', '').toLowerCase()}` : undefined;

    // Update in Supabase
    try {
      await supabase
        .from('Teacher')
        .update({
          role: cleanRole,
          isActive: cleanActive,
          assignedClassId: classId,
          fullName: partial.fullName || existing.fullName,
          title: partial.title !== undefined ? partial.title : existing.title,
          department: partial.department !== undefined ? partial.department : existing.department,
          phone: partial.phone !== undefined ? partial.phone : existing.phone,
        })
        .eq('email', existing.email.toLowerCase());
    } catch (e) {
      console.warn('Supabase update teacher error:', e);
    }

    const updated = teachers.map((t) => (t.id === id ? { ...t, ...partial, assignedClassId: classId } : t));
    setTeachers(updated);
    try {
      localStorage.setItem('gvcn_teachers', JSON.stringify(updated));
    } catch (e) {}

    toast.success('Đã cập nhật quyền và phân công cán bộ/giáo viên!');
  };

  const deleteTeacher = async (id: string) => {
    const existing = teachers.find((t) => t.id === id);
    if (!existing) return;

    // Delete in Supabase
    try {
      await supabase.from('Teacher').delete().eq('email', existing.email.toLowerCase());
    } catch (e) {
      console.warn('Supabase delete teacher error:', e);
    }

    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);
    try {
      localStorage.setItem('gvcn_teachers', JSON.stringify(updated));
    } catch (e) {}

    toast.success('Đã gỡ tài khoản cán bộ/giáo viên');
  };

  // Auth & RBAC Flags (Supports Admin, Teacher, and Dual Admin+Teacher)
  const isAdmin =
    user !== null &&
    profile !== null &&
    (profile.role === 'ADMIN' || profile.role === 'ADMIN_TEACHER');

  const isTeacher =
    user !== null &&
    profile !== null &&
    (profile.role === 'TEACHER' || profile.role === 'ADMIN_TEACHER');

  const isAuthorized =
    user !== null &&
    profile !== null &&
    profile.isActive &&
    (profile.role === 'ADMIN' || profile.role === 'TEACHER' || profile.role === 'ADMIN_TEACHER');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthorized,
        isAdmin,
        isTeacher,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithOtp,
        signOut,
        teachers,
        refreshTeachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
