'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Database,
  Key,
  School,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Users,
  UserPlus,
  Trash2,
  Lock,
  Building,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Clock,
  UserCircle,
  Camera,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Layers,
  HelpCircle,
  Crown,
  AlertTriangle,
  Bot,
  Cpu,
  Eye,
  EyeOff,
  Radio,
  Zap,
  Globe,
  Sliders,
  CheckCheck,
  XCircle,
  RefreshCw,
  Edit3,
  List,
  Copy,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { GradeLevel, UserRole, AIProviderType, AIConfig } from '@/types';
import { TERMS, getCurrentTermByDate, getAcademicYearByDate } from '@/lib/tt27-engine';
import { toast } from 'sonner';
import Link from 'next/link';

const AVATAR_PRESETS = [
  { id: 'av-1', label: 'Cô giáo thanh lịch', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-2', label: 'Cô giáo năng động', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-3', label: 'Cô giáo hiền hậu', url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-4', label: 'Cô giáo trẻ trung', url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-5', label: 'Thầy giáo mẫu mực', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'av-6', label: 'Thầy giáo nhiệt huyết', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

const DEPARTMENTS = [
  'Ban Giám Hiệu',
  'Tổ Khối 1',
  'Tổ Khối 2',
  'Tổ Khối 3',
  'Tổ Khối 4',
  'Tổ Khối 5',
  'Tổ Năng khiếu (Âm nhạc, Mỹ thuật, Thể dục, Tin học, Tiếng Anh)',
  'Tổ Văn phòng & Hành chính',
];

const AI_VENDOR_PRESETS = [
  {
    id: 'xiaomi',
    name: 'Xiaomi MIMO / MiLM',
    provider: 'CUSTOM_OPENAI' as AIProviderType,
    badge: 'Khuyên dùng (Đã cấu hình)',
    icon: '🟠',
    defaultModel: 'mimo-v2.5',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    description: 'Mô hình Xiaomi MIMO theo chuẩn định dạng OpenAI, hỗ trợ chìa khóa cá nhân.',
    models: ['mimo-v2.5', 'mimo-v2.5-pro'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    provider: 'GEMINI' as AIProviderType,
    badge: 'Tốc độ cao',
    icon: '✨',
    defaultModel: 'gemini-2.5-flash',
    baseUrl: '',
    description: 'Tối ưu nhận xét tiếng Việt, hỗ trợ chìa khóa tích hợp sẵn hoặc khóa riêng.',
    models: ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    provider: 'OPENAI' as AIProviderType,
    badge: 'Phổ biến',
    icon: '🟢',
    defaultModel: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    description: 'Mô hình GPT-4o-mini & GPT-4o từ OpenAI, độ chính xác cao và viết văn sư phạm phong phú.',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    provider: 'ANTHROPIC' as AIProviderType,
    badge: 'Văn phong ấm áp',
    icon: '🟣',
    defaultModel: 'claude-3-5-haiku-20241022',
    baseUrl: 'https://api.anthropic.com/v1',
    description: 'Claude 3.5 Haiku/Sonnet với ngôn ngữ tự nhiên, ấm áp, rất phù hợp học sinh tiểu học.',
    models: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    provider: 'CUSTOM_OPENAI' as AIProviderType,
    badge: 'Tiết kiệm',
    icon: '🐳',
    defaultModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    description: 'DeepSeek-V3 Chat với chi phí cực rẻ, khả năng xử lý tiếng Việt rất mượt mà.',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Đa mô hình)',
    provider: 'CUSTOM_OPENAI' as AIProviderType,
    badge: 'Tổng hợp',
    icon: '🔀',
    defaultModel: 'openai/gpt-4o-mini',
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'Cổng kết nối hơn 100+ mô hình AI toàn cầu chỉ với 1 tài khoản duy nhất.',
    models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-haiku', 'deepseek/deepseek-chat'],
  },
];

type SettingsTab = 'PROFILE' | 'CLASS' | 'SCHOOL' | 'DATA';

export default function SettingsPage() {
  const {
    schoolInfo,
    updateSchoolInfo,
    autoCalendarTerm,
    classInfo,
    setClassInfo,
    currentTerm,
    setCurrentTerm,
    apiKey,
    setApiKey,
    aiConfig,
    setAiConfig,
    resetData,
    students,
    clearClassStudents,
    loadDemoStudents,
    exportAllDataJSON,
    importAllDataJSON,
    regenerateClassShareToken,
  } = useAppStore();
  const { user, profile, isAdmin, updateProfile, teachers } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');

  // User Profile Form State
  const [profileFullName, setProfileFullName] = useState(profile?.fullName || '');
  const [profileTitle, setProfileTitle] = useState(profile?.title || '');
  const [profileDepartment, setProfileDepartment] = useState(profile?.department || 'Tổ Khối 4');
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(profile?.avatarUrl || AVATAR_PRESETS[0].url);
  const [isProfileInitialized, setIsProfileInitialized] = useState(false);

  // Sync profile state when auth profile loads initially
  useEffect(() => {
    if (profile && !isProfileInitialized) {
      setProfileFullName(profile.fullName || '');
      setProfileTitle(profile.title || '');
      setProfileDepartment(profile.department || 'Tổ Khối 4');
      setProfilePhone(profile.phone || '');
      if (profile.avatarUrl) setProfileAvatarUrl(profile.avatarUrl);
      setIsProfileInitialized(true);
    }
  }, [profile, isProfileInitialized]);

  // School Form State
  const [schoolName, setSchoolName] = useState(schoolInfo.name);
  const [departmentName, setDepartmentName] = useState(schoolInfo.departmentName);
  const [schoolYear, setSchoolYear] = useState(schoolInfo.schoolYear);
  const [principalName, setPrincipalName] = useState(schoolInfo.principalName);
  const [address, setAddress] = useState(schoolInfo.address || '');
  const [phone, setPhone] = useState(schoolInfo.phone || '');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(schoolInfo.logoUrl || '');

  // Class Form State
  const [className, setClassName] = useState(classInfo.name);
  const [grade, setGrade] = useState<GradeLevel>(classInfo.grade);
  const [teacherName, setTeacherName] = useState(classInfo.teacherName);
  const [rows, setRows] = useState(classInfo.seatingGridRows || 5);
  const [cols, setCols] = useState(classInfo.seatingGridCols || 8);

  // Multi-Vendor AI Form State
  const [aiProvider, setAiProvider] = useState<AIProviderType>(aiConfig?.provider || 'CUSTOM_OPENAI');
  const [inputApiKey, setInputApiKey] = useState(aiConfig?.apiKey || apiKey || 'sk-sjozamgxafx93e1ut7zizxetbf653tx3amguacizr6c40jby');
  const [baseUrl, setBaseUrl] = useState(aiConfig?.baseUrl || 'https://api.xiaomimimo.com/v1');
  const [modelName, setModelName] = useState(aiConfig?.modelName === 'mimo-v1' ? 'mimo-v2.5' : aiConfig?.modelName || 'mimo-v2.5');
  const [temperature, setTemperature] = useState(aiConfig?.temperature ?? 0.7);
  const [showKey, setShowKey] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    provider?: string;
    model?: string;
    latencyMs?: number;
    message?: string;
    error?: string;
  } | null>(null);

  // Dynamic Models List State
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [useCustomModelInput, setUseCustomModelInput] = useState(false);

  // Fetch Models from Server / Provider API
  const fetchModelsList = useCallback(async (prov = aiProvider, key = inputApiKey, base = baseUrl) => {
    setIsFetchingModels(true);
    try {
      const res = await fetch('/api/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: prov,
          apiKey: key,
          baseUrl: base,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setFetchedModels(data.models);
        // If current model is not in the list, set to first one
        if (!data.models.includes(modelName)) {
          setModelName(data.models[0]);
        }
      }
    } catch (e) {
      console.warn('Could not fetch models list:', e);
    } finally {
      setIsFetchingModels(false);
    }
  }, [aiProvider, inputApiKey, baseUrl, modelName]);

  // Sync AI Config when loaded
  useEffect(() => {
    if (aiConfig) {
      setAiProvider(aiConfig.provider || 'CUSTOM_OPENAI');
      setInputApiKey(aiConfig.apiKey || apiKey || 'sk-sjozamgxafx93e1ut7zizxetbf653tx3amguacizr6c40jby');
      setBaseUrl(aiConfig.baseUrl || 'https://api.xiaomimimo.com/v1');
      const validModel = (!aiConfig.modelName || aiConfig.modelName === 'mimo-v1') ? 'mimo-v2.5' : aiConfig.modelName;
      setModelName(validModel);
      setTemperature(aiConfig.temperature ?? 0.7);
    }
  }, [aiConfig, apiKey]);

  // Fetch models on tab change or initial load
  useEffect(() => {
    if (activeTab === 'DATA' && fetchedModels.length === 0) {
      fetchModelsList(aiProvider, inputApiKey, baseUrl);
    }
  }, [activeTab, aiProvider, inputApiKey, baseUrl, fetchModelsList, fetchedModels.length]);

  // Apply Preset
  const handleApplyVendorPreset = (preset: typeof AI_VENDOR_PRESETS[0]) => {
    setAiProvider(preset.provider);
    setModelName(preset.defaultModel);
    setBaseUrl(preset.baseUrl);
    setTestResult(null);
    setUseCustomModelInput(false);
    fetchModelsList(preset.provider, inputApiKey, preset.baseUrl);
    toast.info(`Đã chọn cấu hình ${preset.name} (${preset.defaultModel})`);
  };

  // Save AI Config
  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: AIConfig = {
      provider: aiProvider,
      apiKey: inputApiKey.trim(),
      baseUrl: baseUrl.trim(),
      modelName: modelName.trim() || 'mimo-v1',
      temperature,
    };
    setAiConfig(newConfig);
    toast.success(`Đã lưu cấu hình AI ${aiProvider} (${modelName}) thành công!`);
  };

  // Test AI Connection
  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    setTestResult(null);
    try {
      const testConfig: AIConfig = {
        provider: aiProvider,
        apiKey: inputApiKey.trim(),
        baseUrl: baseUrl.trim(),
        modelName: modelName.trim() || 'mimo-v1',
        temperature,
      };

      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiConfig: testConfig }),
      });

      const data = await res.json();
      setTestResult(data);

      if (data.success) {
        toast.success(`Kết nối AI thành công (${data.latencyMs}ms)! ${data.provider} (${data.model}) đã sẵn sàng.`);
      } else {
        toast.error(`Lỗi kết nối: ${data.error || 'Kiểm tra thất bại'}`);
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        error: e?.message || 'Không thể kết nối đến máy chủ kiểm tra API',
      });
      toast.error('Lỗi khi gửi yêu cầu kiểm tra AI');
    } finally {
      setIsTestingAi(false);
    }
  };

  // Save User Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      fullName: profileFullName.trim(),
      title: profileTitle.trim(),
      department: profileDepartment,
      phone: profilePhone.trim(),
      avatarUrl: profileAvatarUrl,
    });

    if (profile?.assignedClassId === classInfo.id || profile?.assignedClassName === `Lớp ${classInfo.name}`) {
      setClassInfo({
        ...classInfo,
        teacherName: profileFullName.trim(),
      });
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Dung lượng ảnh logo không được vượt quá 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setSchoolLogoUrl(base64);
        toast.success('Đã tải lên ảnh logo trường!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Chỉ Quản trị viên / Ban Giám Hiệu mới có quyền thay đổi thông tin toàn trường!');
      return;
    }
    updateSchoolInfo({
      name: schoolName,
      departmentName,
      schoolYear,
      principalName,
      address,
      phone,
      logoUrl: schoolLogoUrl,
    });
    toast.success('Đã lưu thông tin hồ sơ trường học & logo thành công!');
  };

  const handleSyncRealDate = () => {
    const realTerm = getCurrentTermByDate();
    const realYear = getAcademicYearByDate();
    setCurrentTerm(realTerm);
    if (isAdmin) {
      setSchoolYear(realYear);
      updateSchoolInfo({ schoolYear: realYear });
    }
    toast.success(`Đã đồng bộ về ${TERMS.find((t) => t.id === realTerm)?.name} (${realYear})!`);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassInfo({
      ...classInfo,
      name: className,
      grade,
      schoolYear: schoolInfo.schoolYear,
      schoolName: schoolInfo.name,
      teacherName,
      seatingGridRows: Number(rows),
      seatingGridCols: Number(cols),
    });
    toast.success(`Đã lưu cấu hình Lớp ${className}!`);
  };

  const handleExportBackup = () => {
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GVCN_PRO_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Đã xuất file sao lưu toàn bộ hệ thống!');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const res = importAllDataJSON(content);
      if (res.success) {
        toast.success('Khôi phục dữ liệu từ file sao lưu thành công! Đang tải lại trang...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(`Lỗi khi khôi phục dữ liệu: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearStudents = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ danh sách học sinh của Lớp ${classInfo.name} để chuẩn bị nhập danh sách lớp học thật không?`)) {
      clearClassStudents();
      toast.success(`Đã làm sạch danh sách học sinh Lớp ${classInfo.name}. Bạn có thể nhập file Excel ngay bây giờ!`);
    }
  };

  const handleLoadDemo = () => {
    if (confirm(`Nạp lại 30 học sinh mẫu cho Lớp ${classInfo.name}?`)) {
      loadDemoStudents();
      toast.success(`Đã nạp 30 học sinh mẫu cho Lớp ${classInfo.name}!`);
    }
  };

  const handleResetDefault = () => {
    if (
      confirm(
        'CẢNH BÁO: Thao tác này sẽ đặt lại toàn bộ dữ liệu (học sinh, điểm đánh giá, tích sao) về trạng thái mặc định ban đầu. Bạn có chắc chắn không?'
      )
    ) {
      resetData();
      toast.info('Đã đặt lại dữ liệu mặc định.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-blue-600 shrink-0" />
            <span>Cài Đặt & Cấu Hình Hệ Thống</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý thông tin hồ sơ cá nhân, phân công giáo viên, mô hình AI đa nhà cung cấp và sao lưu hệ thống.
          </p>
        </div>

        {/* Real-time Semester Badge */}
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs shrink-0">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-bold text-blue-900">
            {TERMS.find((t) => t.id === currentTerm)?.name} • {schoolInfo.schoolYear}
          </span>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCircle className="w-4 h-4" />
          <span>Hồ Sơ Của Tôi</span>
        </button>

        <button
          onClick={() => setActiveTab('CLASS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CLASS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Lớp Học & Phân Công</span>
        </button>

        <button
          onClick={() => setActiveTab('SCHOOL')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SCHOOL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Thông Tin Trường Học</span>
        </button>

        <button
          onClick={() => setActiveTab('DATA')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'DATA'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Mô Hình AI & Quản Lý Dữ Liệu</span>
        </button>
      </div>

      {/* TAB 1: USER PROFILE & DIGITAL TEACHER ID */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Edit Form (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Thông Tin Hồ Sơ Giáo Viên</h2>
                <p className="text-xs text-slate-500">
                  Cập nhật họ tên, ảnh đại diện, chức danh và thông tin liên lạc cá nhân.
                </p>
              </div>

              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                {profile?.role === 'ADMIN_TEACHER'
                  ? '👑 BGH kiêm GVCN'
                  : profile?.role === 'ADMIN'
                  ? '👑 Ban Giám Hiệu'
                  : '👩‍🏫 Giáo Viên Chủ Nhiệm'}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">Chọn Ảnh Đại Diện (Avatar)</label>
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={profileAvatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow-xs">
                      <Camera className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-[240px] space-y-2">
                    <p className="text-[11px] text-slate-500 font-medium">Chọn nhanh mẫu đại diện bên dưới hoặc dán link ảnh:</p>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setProfileAvatarUrl(av.url)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                            profileAvatarUrl === av.url ? 'border-blue-600 scale-105 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
                          }`}
                          title={av.label}
                        >
                          <img src={av.url} alt={av.label} className="w-9 h-9 object-cover" />
                          {profileAvatarUrl === av.url && (
                            <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <input
                      type="url"
                      placeholder="Hoặc dán URL ảnh đại diện tùy thích..."
                      value={profileAvatarUrl}
                      onChange={(e) => setProfileAvatarUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và Tên Của Bạn (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cô Nguyễn Thị Mai"
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức Danh / Vị Trí</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giáo viên Chủ nhiệm, Tổ trưởng..."
                    value={profileTitle}
                    onChange={(e) => setProfileTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổ Chuyên Môn</label>
                  <select
                    value={profileDepartment}
                    onChange={(e) => setProfileDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="0912 345 678"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Đăng Nhập (Cố định)</label>
                <input
                  type="text"
                  disabled
                  value={profile?.email || user?.email || ''}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi Hồ Sơ</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live Digital Teacher Card Preview (1 Col) */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 space-y-4 relative overflow-hidden">
              {/* Decorative background circle */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                    Thẻ Giáo Viên Điện Tử
                  </span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Hoạt động
                </span>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <img
                  src={profileAvatarUrl}
                  alt={profileFullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0"
                />
                <div className="overflow-hidden">
                  <h3 className="font-black text-base truncate">{profileFullName || 'Giáo viên'}</h3>
                  <p className="text-xs text-blue-300 font-medium truncate">{profileTitle || 'Giáo viên Chủ nhiệm'}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{profileDepartment}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Trường:</span>
                  <strong className="text-white truncate max-w-[170px]">{schoolInfo.name}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Lớp phụ trách:</span>
                  <span className="bg-blue-600/80 text-white font-bold px-2 py-0.5 rounded-md text-[11px]">
                    Lớp {classInfo.name}
                  </span>
                </div>
                {profilePhone && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Số điện thoại:</span>
                    <strong className="font-mono text-white">{profilePhone}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200/80 text-xs text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Tự động đồng bộ toàn hệ thống:</span>
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Khi bạn thay đổi họ tên hoặc ảnh đại diện tại đây, thông tin sẽ được lưu giữ vĩnh viễn và đồng bộ ngay trên Header, Danh bạ, Sổ chủ nhiệm và Báo cáo TT27.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS & TEACHER ASSIGNMENT */}
      {activeTab === 'CLASS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Cấu Hình Lớp Học ({classInfo.name})</h2>
                <p className="text-xs text-slate-500">
                  Thiết lập tên lớp, khối học, giáo viên chủ nhiệm và quy cách sơ đồ chỗ ngồi.
                </p>
              </div>
            </div>

            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-3 py-1 rounded-full">
              Khối {classInfo.grade} • {students.length} Học sinh
            </span>
          </div>

          <form onSubmit={handleSaveClass} className="space-y-4 text-xs max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Lớp (*)</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 4A1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value={1}>Khối 1</option>
                  <option value={2}>Khối 2</option>
                  <option value={3}>Khối 3</option>
                  <option value={4}>Khối 4</option>
                  <option value={5}>Khối 5</option>
                </select>
              </div>
            </div>

            {/* TEACHER SELECTION DROPDOWN (REFER USER PROFILE) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Giáo Viên Chủ Nhiệm Phụ Trách (*)</label>
                {profile && (
                  <button
                    type="button"
                    onClick={() => setTeacherName(profile.fullName)}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gán tôi ({profile.fullName}) làm GVCN</span>
                  </button>
                )}
              </div>

              <select
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Chọn Giáo viên Chủ nhiệm từ danh bạ toàn trường --</option>
                {profile && (
                  <option value={profile.fullName}>
                    ✨ [Tôi] {profile.fullName} ({profile.title || 'GV'} - {profile.department || 'Tổ'})
                  </option>
                )}
                {teachers
                  .filter((t) => t.fullName !== profile?.fullName)
                  .map((t) => (
                    <option key={t.id} value={t.fullName}>
                      {t.fullName} ({t.title || 'Giáo viên'} - {t.department || 'Tổ chuyên môn'})
                    </option>
                  ))}
              </select>

              <input
                type="text"
                placeholder="Hoặc tự nhập tên giáo viên nếu chưa có trong danh sách..."
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số hàng bàn ghế (Sơ đồ lớp)</label>
                <input
                  type="number"
                  min={3}
                  max={8}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số cột bàn ghế (Sơ đồ lớp)</label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình Lớp Học</span>
              </button>
            </div>
          </form>

          {/* SECURE RANDOM SHARE TOKEN SECTION */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-4 border border-blue-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Mã Bảo Mật & Liên Kết Dành Cho Phụ Huynh Lớp {classInfo.name}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Mỗi lớp sở hữu 1 mã bảo mật ngẫu nhiên để chống người lạ đoán link.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const shareToken = classInfo.shareToken || 'c4a1-8f92a4';
                      const url = `${window.location.origin}/hw/${shareToken}`;
                      navigator.clipboard.writeText(url);
                      toast.success(`Đã sao chép link phụ huynh: ${url}`);
                    }}
                    className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn tạo lại Mã Bảo Mật Mới cho Lớp ${classInfo.name}? Liên kết cũ sẽ bị vô hiệu hóa ngay lập tức.`)) {
                        const newToken = regenerateClassShareToken(classInfo.id);
                        toast.success(`Đã tạo mã mới: ${newToken}`);
                      }
                    }}
                    className="inline-flex items-center space-x-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tạo Lại Mã Mới</span>
                  </button>
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/hw/${classInfo.shareToken || 'c4a1-8f92a4'}` : `https://gvcn-eta.vercel.app/hw/${classInfo.shareToken || 'c4a1-8f92a4'}`}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
                  Mã: {classInfo.shareToken || 'c4a1-8f92a4'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHOOL PROFILE & REAL CALENDAR SYNC */}
      {activeTab === 'SCHOOL' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Hồ Sơ Toàn Trường & Niên Khóa</h2>
                <p className="text-xs text-slate-500">
                  Thông tin này xuất hiện trên đầu trang mọi báo cáo, bảng điểm và học bạ TT27.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncRealDate}
              className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
              title="Tự động đồng bộ theo thời gian thực"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Đồng Bộ Lịch Thực Tế (2026-2027)</span>
            </button>
          </div>

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Chế độ chỉ xem dành cho Giáo viên. Chỉ Ban Giám Hiệu (Admin) mới có quyền sửa đổi thông tin toàn trường.</span>
            </div>
          )}

          <form onSubmit={handleSaveSchool} className="space-y-4 text-xs max-w-3xl">
            {/* School Logo Selector & Uploader */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Logo & Biểu Trưng Trường Học
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative shrink-0">
                  {schoolLogoUrl ? (
                    <img
                      src={schoolLogoUrl}
                      alt="Logo trường"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500 shadow-md bg-white"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 border-2 border-dashed border-purple-300 flex items-center justify-center text-purple-600 text-2xl font-bold">
                      🏫
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-[260px] space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={`inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors ${!isAdmin ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tải Ảnh Logo Lên (PNG/JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={!isAdmin}
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>

                    {schoolLogoUrl && isAdmin && (
                      <button
                        type="button"
                        onClick={() => setSchoolLogoUrl('')}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Xóa logo
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">Hoặc chọn mẫu biểu trưng trường học có sẵn bên dưới:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        id: 'lotus',
                        label: 'Búp Sen & Ngọn Đuốc',
                        url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
                      },
                      {
                        id: 'school',
                        label: 'Ngôi Trường Thân Thiện',
                        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&auto=format&fit=crop&q=80',
                      },
                      {
                        id: 'books',
                        label: 'Trang Sách Tri Thức',
                        url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&auto=format&fit=crop&q=80',
                      },
                      {
                        id: 'grad',
                        label: 'Huy Hiệu Giáo Dục',
                        url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=150&auto=format&fit=crop&q=80',
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => setSchoolLogoUrl(item.url)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          schoolLogoUrl === item.url
                            ? 'border-purple-600 ring-2 ring-purple-300 scale-105'
                            : 'border-slate-200 hover:border-slate-300'
                        } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={item.label}
                      >
                        <img src={item.url} alt={item.label} className="w-8 h-8 object-cover bg-white" />
                        {schoolLogoUrl === item.url && (
                          <div className="absolute inset-0 bg-purple-600/40 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <input
                    type="url"
                    disabled={!isAdmin}
                    placeholder="Hoặc dán URL link ảnh logo trường..."
                    value={schoolLogoUrl}
                    onChange={(e) => setSchoolLogoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:ring-1 focus:ring-purple-500 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Trường Tiểu Học (*)</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cơ Quan Quản Lý Cấp Trên</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Niên Khóa / Năm Học</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 disabled:bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hiệu Trưởng / Đại Diện BGH</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại Trường</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Trường Học</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 disabled:bg-slate-50"
              />
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Hồ Sơ Trường Học</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: MULTI-VENDOR AI ASSISTANT & BACKUP / RESTORE */}
      {activeTab === 'DATA' && (
        <div className="space-y-6">
          {/* AI Multi-Vendor Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Cấu Hình Mô Hình Trí Tuệ Nhân Tạo (Multi-Vendor AI)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tùy chọn đa dạng nhà cung cấp (Xiaomi MIMO, Google Gemini, OpenAI ChatGPT, Anthropic Claude, DeepSeek, OpenRouter) để tự động sinh nhận xét học bạ TT27.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                <span>Đang dùng: {aiProvider} ({modelName})</span>
              </span>
            </div>

            {/* Quick Vendor Presets */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800 text-xs">
                1. Chọn nhanh Nhà Cung Cấp AI (Vendor Presets):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {AI_VENDOR_PRESETS.map((preset) => {
                  const isSelected = aiProvider === preset.provider && (baseUrl === preset.baseUrl || (!baseUrl && !preset.baseUrl));
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyVendorPreset(preset)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-200 shadow-xs'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{preset.icon}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-100">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs mt-1 truncate">{preset.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{preset.defaultModel}</p>
                      </div>

                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-purple-700">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Đang chọn</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed AI Form */}
            <form onSubmit={handleSaveAiConfig} className="space-y-4 text-xs pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provider Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Định Dạng Nhà Cung Cấp (Provider Protocol)
                  </label>
                  <select
                    value={aiProvider}
                    onChange={(e) => {
                      const newProv = e.target.value as AIProviderType;
                      setAiProvider(newProv);
                      fetchModelsList(newProv, inputApiKey, baseUrl);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    <option value="CUSTOM_OPENAI">Custom OpenAI-Compatible (Xiaomi MIMO, DeepSeek, OpenRouter, Groq)</option>
                    <option value="GEMINI">Google Gemini API</option>
                    <option value="OPENAI">OpenAI API (ChatGPT Standard)</option>
                    <option value="ANTHROPIC">Anthropic Claude API (Claude 3.5)</option>
                  </select>
                </div>

                {/* Dynamic Model Selector (Fetched from server) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">
                      Mô Hình AI (Model ID)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchModelsList(aiProvider, inputApiKey, baseUrl)}
                        disabled={isFetchingModels}
                        className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                        title="Tải lại danh sách mô hình từ API"
                      >
                        <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                        <span>{isFetchingModels ? 'Đang tải...' : 'Tải lại Model'}</span>
                      </button>

                      <span className="text-slate-300">|</span>

                      <button
                        type="button"
                        onClick={() => setUseCustomModelInput(!useCustomModelInput)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {useCustomModelInput ? (
                          <>
                            <List className="w-3 h-3" />
                            <span>Chọn từ danh sách</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3 h-3" />
                            <span>Tự nhập</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {!useCustomModelInput && fetchedModels.length > 0 ? (
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                    >
                      {fetchedModels.map((m) => (
                        <option key={m} value={m}>
                          🤖 {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="Ví dụ: mimo-v1, gpt-4o-mini, gemini-2.5-flash..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  )}

                  <p className="text-[10px] text-slate-400">
                    {fetchedModels.length > 0
                      ? `✨ Đã nạp ${fetchedModels.length} mô hình khả dụng cho nhà cung cấp này.`
                      : 'Đang dùng danh sách mô hình mặc định.'}
                  </p>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    Khóa API Bí Mật (API Key)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {aiProvider === 'GEMINI' ? 'Để trống nếu dùng khóa máy chủ mặc định' : 'Bắt buộc khi dùng nhà cung cấp ngoài'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    placeholder="sk-sjozamgxafx93e1ut7zizxetbf653tx3amguacizr6c40jby (sk-...)"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Base URL (for Custom / OpenAI-Compatible endpoints) */}
              {(aiProvider === 'CUSTOM_OPENAI' || aiProvider === 'OPENAI' || aiProvider === 'ANTHROPIC') && (
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-700">
                    Địa Chỉ Máy Chủ API (Base URL Endpoint)
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.xiaomimimo.com/v1 hoặc https://api.openai.com/v1..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-400">Gợi ý nhanh URL:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrl('https://api.xiaomimimo.com/v1');
                        fetchModelsList(aiProvider, inputApiKey, 'https://api.xiaomimimo.com/v1');
                      }}
                      className="text-[10px] font-mono bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded text-orange-700 border border-orange-200 cursor-pointer"
                    >
                      Xiaomi MIMO (https://api.xiaomimimo.com/v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrl('https://api.openai.com/v1');
                        fetchModelsList(aiProvider, inputApiKey, 'https://api.openai.com/v1');
                      }}
                      className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700 cursor-pointer"
                    >
                      OpenAI (https://api.openai.com/v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrl('https://api.deepseek.com/v1');
                        fetchModelsList(aiProvider, inputApiKey, 'https://api.deepseek.com/v1');
                      }}
                      className="text-[10px] font-mono bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-blue-700 border border-blue-200 cursor-pointer"
                    >
                      DeepSeek (https://api.deepseek.com/v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrl('https://openrouter.ai/api/v1');
                        fetchModelsList(aiProvider, inputApiKey, 'https://openrouter.ai/api/v1');
                      }}
                      className="text-[10px] font-mono bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded text-purple-700 border border-purple-200 cursor-pointer"
                    >
                      OpenRouter (https://openrouter.ai/api/v1)
                    </button>
                  </div>
                </div>
              )}

              {/* Temperature Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Độ Sáng Tạo & Đa Dạng Văn Phong (Temperature)</label>
                  <span className="font-mono font-bold text-purple-700">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>0.0 (Chuẩn mực, tối giản)</span>
                  <span>0.7 (Cân bằng khuyên dùng)</span>
                  <span>1.0 (Phong phú, giàu cảm xúc)</span>
                </div>
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-bold">
                      {testResult.success
                        ? `Kết nối thành công (${testResult.latencyMs}ms)! ${testResult.provider || ''} (${testResult.model || ''})`
                        : 'Kiểm tra kết nối thất bại'}
                    </p>
                    <p className="text-[11px] leading-relaxed break-words font-mono">
                      {testResult.message || testResult.error}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestAiConnection}
                  disabled={isTestingAi}
                  className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Zap className={`w-4 h-4 text-amber-500 ${isTestingAi ? 'animate-spin' : ''}`} />
                  <span>{isTestingAi ? 'Đang gửi gói tin test...' : '⚡ Kiểm Tra Kết Nối AI (Test)'}</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình AI</span>
                </button>
              </div>
            </form>
          </div>

          {/* Backup & Restore & Data Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup & Restore */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Sao Lưu & Khôi Phục File</h2>
                    <p className="text-xs text-slate-500">Xuất/nhập file sao lưu toàn diện cho toàn bộ lớp học.</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-600">
                    Tải về bản sao lưu toàn bộ danh sách học sinh, điểm đánh giá TT27, điểm danh và nề nếp tích sao để lưu trữ an toàn:
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Xuất File JSON Toàn Lớp</span>
                    </button>

                    <label className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Nhập File Khôi Phục</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportBackupFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox / Clear Data */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Quản Lý Danh Sách Học Sinh</h2>
                    <p className="text-xs text-slate-500">Khởi tạo lớp mới hoặc nạp dữ liệu mẫu.</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleClearStudents}
                    className="w-full p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span>Xóa Học Sinh Lớp {classInfo.name}</span>
                    </div>
                    <span className="text-[10px] text-rose-600">Bắt đầu lớp mới →</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Nạp 30 Học Sinh Mẫu (Demo)</span>
                    </div>
                    <span className="text-[10px] text-blue-600">Dùng thử →</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Khôi phục cài đặt gốc:</span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-slate-500 hover:text-slate-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại toàn bộ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
