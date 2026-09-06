'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

  // Google Drive & Keep Login
  googleAccessToken: string | null;
  hasGoogleDriveConnected: boolean;
  connectGoogleDrive: () => Promise<{ error: any }>;
  
  // Profile Management for Current User
  updateProfile: (partial: Partial<TeacherProfile>) => Promise<void>;

  // Whitelist & Teacher Management (Synchronized with Supabase)
  teachers: TeacherProfile[];
  refreshTeachers: () => Promise<TeacherProfile[]>;
  addTeacher: (data: {
    email: string;
    fullName: string;
    role: UserRole;
    schoolName?: string;
    district?: string;
    province?: string;
    mainGrade?: any;
    planTier?: any;
    title?: string;
    department?: string;
    assignedClassName?: string;
    phone?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  updateTeacher: (id: string, partial: Partial<TeacherProfile>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
}

// Helper to get custom avatar from localStorage
function getCustomAvatar(email: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return localStorage.getItem(`gvcn_custom_avatar_${email.toLowerCase().trim()}`) || undefined;
  } catch (e) {
    return undefined;
  }
}

// Helper to synchronously resolve a profile given user & teacher list from Supabase
function resolveUserProfile(user: User | null, teachersList: TeacherProfile[]): TeacherProfile | null {
  if (!user) return null;
  const email = (user.email || '').toLowerCase().trim();
  const customAvatar = getCustomAvatar(email);

  // Platform Super Admin Check
  if (email === 'anhnnh4@gmail.com') {
    const matched = teachersList.find((t) => t.email.toLowerCase() === email);
    const resolvedAvatar =
      customAvatar ||
      matched?.avatarUrl ||
      user.user_metadata?.avatar_url ||
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80';

    return {
      id: matched?.id || `admin-${user.id}`,
      email,
      fullName: matched?.fullName || user.user_metadata?.full_name || 'Quản Trị Viên GVCN Pro',
      role: 'ADMIN',
      title: 'Quản Trị Nền Tảng (Super Admin)',
      schoolName: matched?.schoolName || 'GVCN Pro Platform',
      district: matched?.district || '',
      province: matched?.province || 'Toàn quốc',
      planTier: 'BETA_ALL_ACCESS',
      reputationPoints: 9999,
      phone: matched?.phone || '024 3839 0134',
      avatarUrl: resolvedAvatar,
      isActive: true,
      createdAt: matched?.createdAt || new Date().toISOString(),
    };
  }

  // Teacher Profile from Supabase
  const matched = teachersList.find((t) => t.email.toLowerCase() === email);
  if (matched) {
    return {
      ...matched,
      planTier: matched.planTier || 'BETA_ALL_ACCESS',
      avatarUrl: customAvatar || matched.avatarUrl || user.user_metadata?.avatar_url,
    };
  }

  // Registered teacher pending Super Admin approval
  return {
    id: `pending-${user.id}`,
    email,
    fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Giáo viên mới',
    role: 'PENDING',
    title: 'Chờ duyệt kích hoạt',
    schoolName: 'Chưa cập nhật trường',
    planTier: 'BETA_ALL_ACCESS',
    assignedClassName: undefined,
    avatarUrl: customAvatar || user.user_metadata?.avatar_url,
    isActive: false,
    createdAt: new Date().toISOString(),
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const isSignedOut = localStorage.getItem('gvcn_signed_out') === 'true';
        if (isSignedOut) return null;

        // Development mock if explicitly set by developer in localStorage
        if (process.env.NODE_ENV === 'development') {
          const mockEmail = localStorage.getItem('gvcn_mock_email');
          if (mockEmail) {
            const isHang = mockEmail === 'hangnm47@gmail.com';
            const isAdmin = mockEmail === 'anhnnh4@gmail.com';
            const fullName = isHang ? 'Cô Nguyễn Thị Minh Hằng' : isAdmin ? 'Quản Trị Viên GVCN Pro' : 'Giáo viên';

            return {
              id: `user-${mockEmail.replace(/[^a-z0-9]/g, '')}`,
              app_metadata: {},
              user_metadata: { full_name: fullName },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              email: mockEmail,
            } as User;
          }
        }
      } catch (e) {}
    }
    return null;
  });
  const [session, setSession] = useState<Session | null>(null);
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gvcn_teachers');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gvcn_google_access_token');
    }
    return null;
  });

  // Synchronously compute current profile from (user, teachers)
  const profile = useMemo(() => {
    return resolveUserProfile(user, teachers);
  }, [user, teachers]);

  const teachersRef = useRef<TeacherProfile[]>(teachers);
  teachersRef.current = teachers;
  const inFlightTeachersPromise = useRef<Promise<TeacherProfile[]> | null>(null);

  // Fetch teachers from Supabase - stable callback with deduplication
  const refreshTeachers = useCallback(async (): Promise<TeacherProfile[]> => {
    if (inFlightTeachersPromise.current) {
      return inFlightTeachersPromise.current;
    }

    const fetchPromise = (async () => {
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
            schoolName: row.schoolName || (row.email === 'anhnnh4@gmail.com' ? 'GVCN Pro Platform' : 'Trường Tiểu học'),
            district: row.district || '',
            province: row.province || '',
            mainGrade: row.mainGrade || undefined,
            planTier: (row.planTier || 'BETA_ALL_ACCESS') as any,
            reputationPoints: row.reputationPoints || 0,
            badges: Array.isArray(row.badges) ? row.badges : [],
            title: row.title || (row.role === 'ADMIN' ? 'Quản Trị Nền Tảng' : 'Giáo viên Chủ nhiệm'),
            department: row.department || undefined,
            assignedClassId: row.assignedClassId || undefined,
            assignedClassName: row.assignedClassName || undefined,
            phone: row.phone || undefined,
            avatarUrl: row.avatarUrl || undefined,
            isActive: row.isActive !== false,
            createdAt: row.createdAt || new Date().toISOString(),
          }));

          setTeachers(mapped);
          teachersRef.current = mapped;
          try {
            localStorage.setItem('gvcn_teachers', JSON.stringify(mapped));
          } catch (e) {}
          return mapped;
        }
      } catch (err) {
        console.warn('Error fetching teachers from Supabase:', err);
      } finally {
        inFlightTeachersPromise.current = null;
      }

      return teachersRef.current;
    })();

    inFlightTeachersPromise.current = fetchPromise;
    return fetchPromise;
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const [{ data: { session } }, dbTeachers] = await Promise.all([
          supabase.auth.getSession(),
          refreshTeachers(),
        ]);

        if (isMounted) {
          setSession(session);
          if (session?.provider_token) {
            setGoogleAccessToken(session.provider_token);
            try {
              localStorage.setItem('gvcn_google_access_token', session.provider_token);
              localStorage.setItem('gvcn_google_token_time', Date.now().toString());
              if (session.provider_refresh_token) {
                localStorage.setItem('gvcn_google_refresh_token', session.provider_refresh_token);
              }
            } catch (e) {}
          }
          let currentUser = session?.user ?? null;
          if (!currentUser && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            const mockEmail = localStorage.getItem('gvcn_mock_email');
            if (mockEmail) {
              currentUser = {
                id: 'mock-user-hang-4a1',
                app_metadata: {},
                user_metadata: { full_name: 'Cô Nguyễn Thị Minh Hằng' },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
                email: mockEmail,
              } as User;
            }
          }
          setUser(currentUser);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        setSession(session);
        if (session?.provider_token) {
          setGoogleAccessToken(session.provider_token);
          try {
            localStorage.setItem('gvcn_google_access_token', session.provider_token);
            localStorage.setItem('gvcn_google_token_time', Date.now().toString());
            if (session.provider_refresh_token) {
              localStorage.setItem('gvcn_google_refresh_token', session.provider_refresh_token);
            }
          } catch (e) {}
        }
        let currentUser = session?.user ?? null;
        if (!currentUser && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          const mockEmail = localStorage.getItem('gvcn_mock_email');
          if (mockEmail) {
            currentUser = {
              id: 'mock-user-hang-4a1',
              app_metadata: {},
              user_metadata: { full_name: 'Cô Nguyễn Thị Minh Hằng' },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              email: mockEmail,
            } as User;
          }
        }
        setUser(currentUser);
        setLoading(false);
      }
    });

    // Realtime subscription on Teacher table
    const teacherChannel = supabase
      .channel('gvcn_teacher_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Teacher' },
        () => {
          if (isMounted) refreshTeachers();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(teacherChannel);
    };
  }, [refreshTeachers]);

  // Google OAuth - Standard clean login without forcing consent prompt
  const signInWithGoogle = async () => {
    try {
      localStorage.removeItem('gvcn_signed_out');
    } catch (e) {}
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://www.gvcn.pro.vn';
    const redirectTo = `${origin}/login`;

    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (res.error) {
      toast.error('Lỗi đăng nhập Google: ' + res.error.message);
    }
    return { error: res.error };
  };

  // Optional on-demand Google Drive connection (using non-sensitive drive.file scope)
  const connectGoogleDrive = async () => {
    try {
      localStorage.removeItem('gvcn_signed_out');
    } catch (e) {}
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://www.gvcn.pro.vn';
    const redirectTo = `${origin}/lesson-plans?gdrive=connected`;

    const res = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'https://www.googleapis.com/auth/drive.file',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (res.error) {
      toast.error('Lỗi kết nối Google Drive: ' + res.error.message);
    }
    return { error: res.error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      localStorage.removeItem('gvcn_signed_out');
    } catch (e) {}
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error) {
      toast.error(res.error.message);
    } else {
      toast.success('Đăng nhập thành công!');
    }
    return { error: res.error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      localStorage.removeItem('gvcn_signed_out');
    } catch (e) {}
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
    try {
      localStorage.removeItem('gvcn_signed_out');
    } catch (e) {}
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://www.gvcn.pro.vn';
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
    try {
      localStorage.setItem('gvcn_signed_out', 'true');
      localStorage.removeItem('gvcn_mock_email');
      localStorage.removeItem('gvcn_google_access_token');
      localStorage.removeItem('gvcn_google_token_time');
      localStorage.removeItem('gvcn_google_refresh_token');
    } catch (e) {}
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setGoogleAccessToken(null);
    toast.info('Đã đăng xuất');
  };

  // USER PROFILE UPDATE (Synchronized with Supabase & App State)
  const updateProfile = async (partial: Partial<TeacherProfile>) => {
    if (!profile) return;
    const cleanEmail = (profile.email || user?.email || '').toLowerCase().trim();

    // 0. Persist custom avatar immediately to localStorage
    if (partial.avatarUrl) {
      try {
        localStorage.setItem(`gvcn_custom_avatar_${cleanEmail}`, partial.avatarUrl);
      } catch (e) {}
    }

    // 1. Update in Supabase Teacher table
    try {
      const { error } = await supabase.from('Teacher').upsert(
        {
          email: cleanEmail,
          fullName: partial.fullName || profile.fullName,
          schoolName: partial.schoolName !== undefined ? partial.schoolName : profile.schoolName,
          district: partial.district !== undefined ? partial.district : profile.district,
          province: partial.province !== undefined ? partial.province : profile.province,
          mainGrade: partial.mainGrade !== undefined ? partial.mainGrade : profile.mainGrade,
          title: partial.title !== undefined ? partial.title : profile.title,
          department: partial.department !== undefined ? partial.department : profile.department,
          phone: partial.phone !== undefined ? partial.phone : profile.phone,
          avatarUrl: partial.avatarUrl !== undefined ? partial.avatarUrl : profile.avatarUrl,
          role: profile.role,
          assignedClassId: partial.assignedClassId !== undefined ? partial.assignedClassId : profile.assignedClassId,
          isActive: profile.isActive,
        },
        { onConflict: 'email' }
      );
      if (error) {
        console.error('Supabase update profile error:', error.message);
        toast.error(`Không thể lưu hồ sơ lên máy chủ: ${error.message}`);
        return;
      }
    } catch (e: any) {
      console.warn('Supabase update profile network exception:', e);
      toast.error(`Lỗi kết nối khi cập nhật hồ sơ: ${e?.message || 'Vui lòng thử lại'}`);
      return;
    }

    // 2. Also update Supabase auth metadata if full_name or avatar_url changed
    if (partial.fullName || partial.avatarUrl) {
      try {
        const { data: updatedAuthUser } = await supabase.auth.updateUser({
          data: {
            full_name: partial.fullName || profile.fullName,
            avatar_url: partial.avatarUrl || profile.avatarUrl,
          },
        });
        if (updatedAuthUser?.user) {
          setUser(updatedAuthUser.user);
        }
      } catch (e) {}
    }

    // 3. Update local teachers array
    let found = false;
    const updatedTeachers = teachers.map((t) => {
      if (t.email.toLowerCase() === cleanEmail) {
        found = true;
        return {
          ...t,
          ...partial,
          avatarUrl: partial.avatarUrl !== undefined ? partial.avatarUrl : t.avatarUrl,
        };
      }
      return t;
    });

    if (!found) {
      updatedTeachers.push({
        ...profile,
        ...partial,
        email: cleanEmail,
        avatarUrl: partial.avatarUrl !== undefined ? partial.avatarUrl : profile.avatarUrl,
      });
    }

    setTeachers(updatedTeachers);
    try {
      localStorage.setItem('gvcn_teachers', JSON.stringify(updatedTeachers));
    } catch (e) {}

    toast.success('Đã cập nhật thông tin hồ sơ của bạn!');
  };

  // TEACHER MANAGEMENT ACTIONS (Synced with Supabase)
  const addTeacher = async (data: {
    email: string;
    fullName: string;
    role: UserRole;
    schoolName?: string;
    district?: string;
    province?: string;
    mainGrade?: any;
    planTier?: any;
    title?: string;
    department?: string;
    assignedClassName?: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.fullName.trim();
    const classId = data.assignedClassName ? `class-${data.assignedClassName.replace('Lớp ', '').toLowerCase()}` : undefined;

    // Write to Supabase
    try {
      const { error } = await supabase.from('Teacher').upsert(
        {
          email: cleanEmail,
          fullName: cleanName,
          role: data.role,
          schoolName: data.schoolName || 'Trường Tiểu học',
          district: data.district || '',
          province: data.province || '',
          mainGrade: data.mainGrade || null,
          planTier: data.planTier || 'BETA_ALL_ACCESS',
          title: data.title || (data.role === 'ADMIN' ? 'Quản Trị Nền Tảng' : 'Giáo viên Chủ nhiệm'),
          department: data.department || null,
          assignedClassId: classId,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          isActive: true,
        },
        { onConflict: 'email' }
      );
      if (error) {
        console.error('Supabase upsert teacher error:', error.message);
        toast.error(`Không thể cấp quyền cho giáo viên: ${error.message}`);
        return;
      }
    } catch (e: any) {
      console.warn('Supabase upsert teacher network exception:', e);
      toast.error(`Lỗi kết nối khi cấp quyền giáo viên: ${e?.message || 'Vui lòng thử lại'}`);
      return;
    }

    const newT: TeacherProfile = {
      id: `t-${Date.now()}`,
      email: cleanEmail,
      fullName: cleanName,
      role: data.role,
      schoolName: data.schoolName || 'Trường Tiểu học',
      district: data.district || '',
      province: data.province || '',
      mainGrade: data.mainGrade || undefined,
      planTier: data.planTier || 'BETA_ALL_ACCESS',
      reputationPoints: 0,
      badges: [],
      title: data.title || 'Giáo viên',
      department: data.department || undefined,
      assignedClassId: classId,
      assignedClassName: data.assignedClassName || (classId ? `Lớp ${data.assignedClassName}` : undefined),
      phone: data.phone,
      avatarUrl: data.avatarUrl,
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

    const previousTeachers = teachers;
    const updated = teachers.map((t) => (t.id === id ? { ...t, ...partial, assignedClassId: classId } : t));
    setTeachers(updated);

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('Teacher')
        .update({
          role: cleanRole,
          isActive: cleanActive,
          assignedClassId: classId,
          fullName: partial.fullName || existing.fullName,
          schoolName: partial.schoolName !== undefined ? partial.schoolName : existing.schoolName,
          district: partial.district !== undefined ? partial.district : existing.district,
          province: partial.province !== undefined ? partial.province : existing.province,
          mainGrade: partial.mainGrade !== undefined ? partial.mainGrade : existing.mainGrade,
          planTier: partial.planTier !== undefined ? partial.planTier : existing.planTier,
          reputationPoints: partial.reputationPoints !== undefined ? partial.reputationPoints : existing.reputationPoints,
          title: partial.title !== undefined ? partial.title : existing.title,
          phone: partial.phone !== undefined ? partial.phone : existing.phone,
          avatarUrl: partial.avatarUrl !== undefined ? partial.avatarUrl : existing.avatarUrl,
        })
        .eq('email', existing.email.toLowerCase());

      if (error) {
        setTeachers(previousTeachers);
        console.error('Supabase update teacher error:', error.message);
        toast.error(`Không thể cập nhật giáo viên trên máy chủ: ${error.message}`);
        return;
      }
    } catch (e: any) {
      setTeachers(previousTeachers);
      console.warn('Supabase update teacher exception:', e);
      toast.error(`Lỗi kết nối khi cập nhật giáo viên: ${e?.message || 'Vui lòng thử lại'}`);
      return;
    }

    try {
      localStorage.setItem('gvcn_teachers', JSON.stringify(updated));
    } catch (e) {}

    toast.success('Đã cập nhật thông tin và quyền giáo viên!');
  };

  const deleteTeacher = async (id: string) => {
    const existing = teachers.find((t) => t.id === id);
    if (!existing) return;

    const previousTeachers = teachers;
    const updated = teachers.filter((t) => t.id !== id);
    setTeachers(updated);

    // Delete in Supabase
    try {
      const { error } = await supabase.from('Teacher').delete().eq('email', existing.email.toLowerCase());
      if (error) {
        setTeachers(previousTeachers);
        console.error('Supabase delete teacher error:', error.message);
        toast.error(`Không thể xóa tài khoản giáo viên: ${error.message}`);
        return;
      }
    } catch (e: any) {
      setTeachers(previousTeachers);
      console.warn('Supabase delete teacher exception:', e);
      toast.error(`Lỗi kết nối khi xóa tài khoản giáo viên: ${e?.message || 'Vui lòng thử lại'}`);
      return;
    }

    try {
      localStorage.setItem('gvcn_teachers', JSON.stringify(updated));
    } catch (e) {}

    toast.success('Đã gỡ tài khoản cán bộ/giáo viên');
  };

  // Auth & RBAC Flags (Supports Admin, Teacher, and Dual Admin+Teacher)
  const isPrimaryAdmin = (user?.email || '').toLowerCase().trim() === 'anhnnh4@gmail.com';

  const isAdmin =
    user !== null &&
    (isPrimaryAdmin ||
      profile?.role === 'ADMIN' ||
      profile?.role === 'ADMIN_TEACHER');

  const isTeacher =
    user !== null &&
    (isPrimaryAdmin ||
      profile?.role === 'TEACHER' ||
      profile?.role === 'ADMIN_TEACHER');

  const isAuthorized =
    user !== null &&
    (isPrimaryAdmin ||
      (profile !== null &&
        profile.isActive &&
        (profile.role === 'ADMIN' || profile.role === 'TEACHER' || profile.role === 'ADMIN_TEACHER')));

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
        googleAccessToken,
        hasGoogleDriveConnected: Boolean(googleAccessToken),
        connectGoogleDrive,
        updateProfile,
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
