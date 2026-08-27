'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { TeacherProfile, UserRole } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: TeacherProfile | null;
  isAuthorized: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithOtp: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  
  // Whitelist & Teacher Management
  teachers: TeacherProfile[];
  addTeacher: (email: string, fullName: string, role: UserRole, assignedClassName?: string) => Promise<void>;
  updateTeacher: (id: string, partial: Partial<TeacherProfile>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
}

const DEFAULT_TEACHERS: TeacherProfile[] = [
  {
    id: 't-admin-1',
    email: 'anhnnh4@gmail.com',
    fullName: 'Admin Quản Trị Viên',
    role: 'ADMIN',
    assignedClassName: 'Tất cả các lớp',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-teacher-1',
    email: 'cham@chuyenkhoan.vn',
    fullName: 'Cô Nguyễn Thị Mai',
    role: 'TEACHER',
    assignedClassName: 'Lớp 4A1',
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

  // Load teachers from localStorage or Supabase
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gvcn_teachers');
      if (saved) {
        setTeachers(JSON.parse(saved));
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const saveTeachers = (newTeachers: TeacherProfile[]) => {
    setTeachers(newTeachers);
    try {
      localStorage.setItem('gvcn_teachers', JSON.stringify(newTeachers));
    } catch (e) {
      console.warn(e);
    }
  };

  // Check role & profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const email = user.email?.toLowerCase();
    const existing = teachers.find((t) => t.email.toLowerCase() === email);

    if (existing) {
      setProfile(existing);
    } else if (email === 'anhnnh4@gmail.com') {
      const adminProfile: TeacherProfile = {
        id: `t-${user.id}`,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || 'Admin Quản Trị Viên',
        role: 'ADMIN',
        assignedClassName: 'Tất cả các lớp',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setProfile(adminProfile);
    } else {
      // Tài khoản mới chưa có trong whitelist -> Đặt trạng thái PENDING chờ Admin duyệt
      const pendingProfile: TeacherProfile = {
        id: `t-${user.id}`,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Giáo viên mới',
        role: 'PENDING',
        assignedClassName: undefined,
        isActive: false,
        createdAt: new Date().toISOString(),
      };
      setProfile(pendingProfile);
    }
  }, [user, teachers]);

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
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
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
    const res = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
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

  // TEACHER MANAGEMENT ACTIONS
  const addTeacher = async (email: string, fullName: string, role: UserRole, assignedClassName?: string) => {
    const newT: TeacherProfile = {
      id: `t-${Date.now()}`,
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      role,
      assignedClassName: assignedClassName || 'Lớp 4A1',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    saveTeachers([...teachers, newT]);
    toast.success(`Đã cấp quyền giáo viên cho email ${email}!`);
  };

  const updateTeacher = async (id: string, partial: Partial<TeacherProfile>) => {
    saveTeachers(teachers.map((t) => (t.id === id ? { ...t, ...partial } : t)));
    toast.success('Đã cập nhật thông tin giáo viên!');
  };

  const deleteTeacher = async (id: string) => {
    saveTeachers(teachers.filter((t) => t.id !== id));
    toast.success('Đã gỡ quyền truy cập của giáo viên');
  };

  const isAuthorized = !user || (profile !== null && profile.isActive && profile.role !== 'PENDING');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthorized,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithOtp,
        signOut,
        teachers,
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
