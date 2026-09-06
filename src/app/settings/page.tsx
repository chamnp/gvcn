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

import {
  ApiKeyRecord,
  createApiKeyRecord,
  fetchApiKeysForTeacher,
  revokeApiKey,
} from '@/lib/mcp-auth';

type SettingsTab = 'PROFILE' | 'CLASS' | 'FEATURES' | 'DATA' | 'MCP_API' | 'SCHOOL';

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
    exportAllDataJSON,
    importAllDataJSON,
    regenerateClassShareToken,
    schoolClasses,
    switchClass,
    addClass,
    updateClass,
    deleteClass,
    featureFlags,
    setFeatureFlag,
    resetFeatureFlags,
  } = useAppStore();
  const { user, profile, isAdmin, updateProfile, teachers } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');

  // Support direct URL query parameter tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'FEATURES' || tabParam === 'CLASS' || tabParam === 'DATA' || tabParam === 'MCP_API' || tabParam === 'PROFILE') {
        setActiveTab(tabParam as SettingsTab);
      }
    }
  }, []);

  // User Profile Form State
  const [profileFullName, setProfileFullName] = useState(profile?.fullName || '');
  const [profileTitle, setProfileTitle] = useState(profile?.title || 'Giáo viên Chủ nhiệm');
  const [profileSchoolName, setProfileSchoolName] = useState(profile?.schoolName || classInfo.schoolName || '');
  const [profileDistrict, setProfileDistrict] = useState(profile?.district || '');
  const [profileProvince, setProfileProvince] = useState(profile?.province || 'Hà Nội');
  const [profileMainGrade, setProfileMainGrade] = useState<number>(profile?.mainGrade || 4);
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(profile?.avatarUrl || AVATAR_PRESETS[0].url);
  const [isProfileInitialized, setIsProfileInitialized] = useState(false);

  // Sync profile state when auth profile loads initially
  useEffect(() => {
    if (profile && !isProfileInitialized) {
      setProfileFullName(profile.fullName || '');
      setProfileTitle(profile.title || 'Giáo viên Chủ nhiệm');
      setProfileSchoolName(profile.schoolName || classInfo.schoolName || '');
      setProfileDistrict(profile.district || '');
      setProfileProvince(profile.province || 'Hà Nội');
      setProfileMainGrade(profile.mainGrade || 4);
      setProfilePhone(profile.phone || '');
      if (profile.avatarUrl) setProfileAvatarUrl(profile.avatarUrl);
      setIsProfileInitialized(true);
    }
  }, [profile, isProfileInitialized, classInfo.schoolName]);

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
  const [classSchoolName, setClassSchoolName] = useState(classInfo.schoolName || '');
  const [rows, setRows] = useState(classInfo.seatingGridRows || 5);
  const [cols, setCols] = useState(classInfo.seatingGridCols || 8);

  // Sync Class form state when classInfo changes (e.g. admin switches class)
  useEffect(() => {
    if (classInfo) {
      setClassName(classInfo.name || '');
      setGrade(classInfo.grade || 1);
      setTeacherName(classInfo.teacherName || '');
      setClassSchoolName(classInfo.schoolName || '');
      setRows(classInfo.seatingGridRows || 5);
      setCols(classInfo.seatingGridCols || 8);
    }
  }, [classInfo.id, classInfo.name, classInfo.schoolName, classInfo.grade, classInfo.teacherName, classInfo.seatingGridRows, classInfo.seatingGridCols]);

  // New Class Form State
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [newClassForm, setNewClassForm] = useState<{
    name: string;
    grade: GradeLevel;
    schoolName: string;
    schoolYear: string;
  }>({
    name: '',
    grade: 1,
    schoolName: '',
    schoolYear: getAcademicYearByDate(),
  });

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

  // ─── MCP & Personal Access Key Management State ───
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKeyRecord, setCreatedKeyRecord] = useState<ApiKeyRecord | null>(null);
  const [showKeySecretMap, setShowKeySecretMap] = useState<Record<string, boolean>>({});
  const [mcpTestTool, setMcpTestTool] = useState('get_class_overview');
  const [mcpTestResult, setMcpTestResult] = useState<string | null>(null);
  const [isMcpTesting, setIsMcpTesting] = useState(false);

  const loadApiKeys = useCallback(async () => {
    const email = user?.email || profile?.email || 'anhnnh4@gmail.com';
    const keys = await fetchApiKeysForTeacher(email);
    if (keys.length > 0) {
      setApiKeys(keys);
    } else {
      // Fallback default key for smooth trial
      const defaultKey: ApiKeyRecord = {
        id: 'key-default-1',
        key: 'gvcn_pat_demo_teacher_2026_pro',
        name: 'Khóa mặc định (Claude & ChatGPT)',
        teacherEmail: email,
        classId: 'demo-class',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setApiKeys([defaultKey]);
    }
  }, [user?.email, profile?.email]);

  useEffect(() => {
    if (activeTab === 'MCP_API') {
      loadApiKeys();
    }
  }, [activeTab, loadApiKeys]);

  const handleCreateNewKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error('Vui lòng nhập tên gợi nhớ cho khóa kết nối!');
      return;
    }

    const email = user?.email || profile?.email || 'anhnnh4@gmail.com';
    const { keyRecord, error } = await createApiKeyRecord(newKeyName.trim(), email, profile?.id, classInfo.id);

    if (keyRecord) {
      setApiKeys([keyRecord, ...apiKeys]);
      setCreatedKeyRecord(keyRecord);
      setNewKeyName('');
      toast.success('Đã tạo Khóa kết nối MCP mới thành công! 🎉');
    } else {
      toast.error(error || 'Không thể tạo khóa API.');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (confirm('Bạn có chắc chắn muốn thu hồi khóa này? Sau khi thu hồi, các ứng dụng AI sẽ không thể kết nối được nữa.')) {
      await revokeApiKey(keyId);
      setApiKeys(apiKeys.map((k) => (k.id === keyId ? { ...k, isActive: false } : k)));
      toast.success('Đã thu hồi khóa kết nối!');
    }
  };

  const handleTestMcpTool = async () => {
    setIsMcpTesting(true);
    setMcpTestResult(null);
    try {
      const activeKey = apiKeys.find((k) => k.isActive)?.key || 'gvcn_pat_demo';
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: mcpTestTool,
            arguments: {},
          },
        }),
      });

      const data = await res.json();
      setMcpTestResult(JSON.stringify(data, null, 2));
      if (data.result) {
        toast.success(`⚡ Tool ${mcpTestTool} đã phản hồi thành công!`);
      }
    } catch (e: any) {
      setMcpTestResult(JSON.stringify({ error: e?.message }, null, 2));
      toast.error('Lỗi khi gửi yêu cầu test MCP Tool');
    } finally {
      setIsMcpTesting(false);
    }
  };

  // Save User Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      fullName: profileFullName.trim(),
      title: profileTitle.trim(),
      schoolName: profileSchoolName.trim(),
      district: profileDistrict.trim(),
      province: profileProvince.trim(),
      mainGrade: profileMainGrade as GradeLevel,
      phone: profilePhone.trim(),
      avatarUrl: profileAvatarUrl,
    });

    if (classInfo.id) {
      setClassInfo({
        ...classInfo,
        teacherName: profileFullName.trim(),
        schoolName: profileSchoolName.trim() || classInfo.schoolName,
      });
    }
    toast.success('Đã lưu thông tin hồ sơ và trường công tác thành công!');
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
    updateSchoolInfo({
      name: schoolName,
      departmentName,
      schoolYear,
      principalName,
      address,
      phone,
      logoUrl: schoolLogoUrl,
    });
    if (classInfo.id) {
      setClassInfo({
        ...classInfo,
        schoolName,
      });
    }
    toast.success('Đã lưu thông tin trường học & logo thành công!');
  };

  const handleSyncRealDate = () => {
    const realTerm = getCurrentTermByDate();
    const realYear = getAcademicYearByDate();
    setCurrentTerm(realTerm);
    setSchoolYear(realYear);
    updateSchoolInfo({ schoolYear: realYear });
    toast.success(`Đã đồng bộ về ${TERMS.find((t) => t.id === realTerm)?.name} (${realYear})!`);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      toast.error('Vui lòng nhập tên lớp (ví dụ: 4A1)!');
      return;
    }
    const finalSchoolName = classSchoolName.trim() || profileSchoolName.trim() || classInfo.schoolName || schoolInfo.name;
    if (!finalSchoolName) {
      toast.error('Vui lòng nhập tên trường tiểu học!');
      return;
    }

    const updated = {
      ...classInfo,
      name: className.trim(),
      grade,
      schoolYear: classInfo.schoolYear || schoolInfo.schoolYear,
      schoolName: finalSchoolName,
      teacherName,
      teacherEmail: profile?.email || classInfo.teacherEmail,
      seatingGridRows: Number(rows),
      seatingGridCols: Number(cols),
    };

    const res = await updateClass(updated);
    if (res.success) {
      toast.success(`Đã lưu cấu hình Lớp ${className.trim()}!`);
    }
  };

  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassForm.name.trim()) {
      toast.error('Vui lòng nhập tên lớp (ví dụ: 4A1)');
      return;
    }
    const finalSchoolName = newClassForm.schoolName.trim() || profileSchoolName.trim() || classInfo.schoolName || 'Trường Tiểu học';
    const res = await addClass({
      name: newClassForm.name.trim(),
      grade: newClassForm.grade,
      schoolName: finalSchoolName,
      schoolYear: newClassForm.schoolYear,
      teacherName: profileFullName.trim() || 'Giáo viên',
      teacherEmail: profile?.email || '',
      totalStudents: 0,
      seatingGridRows: 5,
      seatingGridCols: 8,
    });
    if (res.success) {
      toast.success(`Đã tạo mới Lớp ${newClassForm.name.trim()}!`);
      setIsNewClassModalOpen(false);
      setNewClassForm({
        name: '',
        grade: 1,
        schoolName: profileSchoolName || classInfo.schoolName || '',
        schoolYear: getAcademicYearByDate(),
      });
    }
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
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) {
          toast.error('File sao lưu rỗng!');
          return;
        }
        const res = await importAllDataJSON(content);
        if (res.success) {
          toast.success('Khôi phục dữ liệu từ file sao lưu thành công! Đang tải lại trang...');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error(`Lỗi khi khôi phục dữ liệu: ${res.error || 'Dữ liệu không đúng định dạng'}`);
        }
      } catch (err: any) {
        toast.error(`Không thể đọc file sao lưu: ${err?.message || 'File JSON hỏng hoặc không đúng định dạng'}`);
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

  const handleResetDefault = () => {
    if (
      confirm(
        'Thao tác này chỉ xóa tùy chọn lưu trên trình duyệt và tải lại dữ liệu từ máy chủ. Dữ liệu học sinh, đánh giá và sao trên Supabase sẽ không bị xóa. Tiếp tục?'
      )
    ) {
      resetData();
      toast.info('Đã xóa tùy chọn cục bộ. Đang tải lại dữ liệu từ máy chủ.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
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
      <div className="flex overflow-x-auto no-scrollbar items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex shrink-0 whitespace-nowrap items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
          className={`flex shrink-0 whitespace-nowrap items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CLASS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Lớp Học & Phân Công</span>
        </button>

        <button
          onClick={() => setActiveTab('FEATURES')}
          className={`flex shrink-0 whitespace-nowrap items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'FEATURES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Bật/Tắt Tính Năng</span>
        </button>

        <button
          onClick={() => setActiveTab('DATA')}
          className={`flex shrink-0 whitespace-nowrap items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'DATA'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Mô Hình AI & Quản Lý Dữ Liệu</span>
        </button>

        <button
          onClick={() => setActiveTab('MCP_API')}
          className={`flex shrink-0 whitespace-nowrap items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MCP_API'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Khóa Kết Nối AI & MCP</span>
        </button>

        <button
          onClick={() => setActiveTab('SCHOOL')}
          className={`flex shrink-0 whitespace-nowrap items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SCHOOL'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Thông Tin Trường Học</span>
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
                  <label className="block font-semibold text-slate-700 mb-1">Trường Tiểu Học Công Tác (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Trường Tiểu học Chu Văn An"
                    value={profileSchoolName}
                    onChange={(e) => setProfileSchoolName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối Lớp Phụ Trách Chính</label>
                  <select
                    value={profileMainGrade}
                    onChange={(e) => setProfileMainGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value={1}>Khối 1</option>
                    <option value={2}>Khối 2</option>
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Quận Cầu Giấy"
                    value={profileDistrict}
                    onChange={(e) => setProfileDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tỉnh / Thành Phố</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hà Nội, TP.HCM..."
                    value={profileProvince}
                    onChange={(e) => setProfileProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
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
                  BETA Full Access
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
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">{profileSchoolName || 'Trường Tiểu học'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Trường công tác:</span>
                  <strong className="text-white truncate max-w-[170px]">{profileSchoolName || classInfo.schoolName || 'Tiểu học'}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Khối & Lớp:</span>
                  <span className="bg-blue-600/80 text-white font-bold px-2 py-0.5 rounded-md text-[11px]">
                    Khối {profileMainGrade} • Lớp {classInfo.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Địa phương:</span>
                  <strong className="text-slate-200 truncate max-w-[170px]">{[profileDistrict, profileProvince].filter(Boolean).join(', ') || 'Toàn quốc'}</strong>
                </div>
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trường Tiểu Học (*)</label>
              <input
                type="text"
                required
                value={classSchoolName}
                onChange={(e) => setClassSchoolName(e.target.value)}
                placeholder="Ví dụ: Trường Tiểu học Dịch Vọng A"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
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
                <option value="">-- Chọn Giáo viên Chủ nhiệm --</option>
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
                  {typeof window !== 'undefined' ? `${window.location.origin}/hw/${classInfo.shareToken || 'c4a1-8f92a4'}` : `https://www.gvcn.pro.vn/hw/${classInfo.shareToken || 'c4a1-8f92a4'}`}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
                  Mã: {classInfo.shareToken || 'c4a1-8f92a4'}
                </span>
              </div>
            </div>

            {/* SECTION: CLASSES MANAGEMENT (ADMIN VS TEACHER) */}
            {isAdmin ? (
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Danh Sách Tất Cả Các Lớp Trên Hệ Thống (Quản trị viên)</span>
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">
                        {schoolClasses.length} lớp
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Với tư cách Quản trị viên, bạn có quyền xem/chuyển đổi giữa bất kỳ lớp nào hoặc khởi tạo thêm lớp mới.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewClassForm({
                        name: '',
                        grade: (profile?.mainGrade as GradeLevel) || 1,
                        schoolName: profile?.schoolName || classInfo.schoolName || '',
                        schoolYear: getAcademicYearByDate(),
                      });
                      setIsNewClassModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Thêm Lớp Học Mới</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {schoolClasses.map((c) => {
                    const isActive = c.id === classInfo.id;
                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isActive
                            ? 'border-purple-500 bg-purple-50/40 shadow-xs ring-2 ring-purple-100'
                            : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                              <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Khối {c.grade}
                              </span>
                              {isActive && (
                                <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Đang chọn
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              🏫 {c.schoolName || 'Chưa đặt trường'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              GVCN: {c.teacherName || c.teacherEmail || 'Chưa gán'} • Năm học: {c.schoolYear || '2026-2027'}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            {!isActive ? (
                              <button
                                type="button"
                                onClick={() => {
                                  switchClass(c.id);
                                  toast.success(`Đã chuyển sang ${c.name}`);
                                }}
                                className="bg-white hover:bg-purple-50 text-purple-600 border border-purple-200 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs"
                              >
                                Chọn lớp này
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Hiện hành</span>
                              </span>
                            )}

                            {schoolClasses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn xóa lớp ${c.name}?`)) {
                                    deleteClass(c.id);
                                    toast.success(`Đã xóa lớp ${c.name}`);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa lớp học này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="pt-6 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>Lớp Chủ Nhiệm Duy Nhất Của Bạn:</span>
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">
                        Lớp {classInfo.name} - {classInfo.schoolName || 'Chưa cập nhật trường'}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Theo quy chuẩn hệ thống GVCN Pro, mỗi giáo viên quản lý 1 lớp chủ nhiệm độc lập do mình đăng ký. Nếu quý thầy cô cần cập nhật tên lớp, tên trường hoặc số hàng cột chỗ ngồi, vui lòng chỉnh sửa và bấm <strong>&ldquo;Lưu Cấu Hình Lớp Học&rdquo;</strong> ở biểu mẫu phía trên.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: FEATURES MANAGEMENT (FEATURE FLAGS) */}
      {activeTab === 'FEATURES' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bật / Tắt Phân Hệ & Tính Năng</h2>
                  <p className="text-xs text-slate-500">
                    Tùy biến thanh điều hướng và giao diện làm việc theo nhu cầu thực tế của lớp học.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetFeatureFlags();
                    toast.success('Đã khôi phục thiết lập tối giản ban đầu (5 tính năng cốt lõi)!');
                  }}
                  className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Khôi Phục Bản Chuẩn Tối Giản</span>
                </button>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs font-bold text-slate-800">
                    Chế độ phát hành: 5 Nghiệp Vụ Tác Nghiệp Chuẩn (Production-Ready)
                  </p>
                </div>
                <p className="text-[11px] text-slate-600">
                  Giao diện tập trung tối đa vào công việc hằng ngày của giáo viên chủ nhiệm. Các module chuyên môn Thông tư 27 & tiện ích mở rộng có thể kích hoạt linh hoạt khi cần.
                </p>
              </div>
            </div>
          </div>

          {/* Group 1: Core Daily Operations */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-5 bg-blue-600 rounded-full"></span>
                  <h3 className="text-sm font-bold text-slate-900">1. Nghiệp Vụ Tác Nghiệp Hàng Ngày (Khuyên dùng)</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Đã kiểm thử ổn định
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-4">
                5 công cụ chính phục vụ quản lý sĩ số, nề nếp, thời khóa biểu và giao bài tập hằng ngày.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  id: 'attendance' as const,
                  name: 'Điểm Danh Bán Trú & Chuyên Cần',
                  desc: 'Điểm danh có mặt/vắng, ghi chú lý do nghỉ, theo dõi suất ăn trưa và tổng hợp báo cáo bán trú.',
                  icon: Calendar,
                  badge: 'Cốt lõi',
                },
                {
                  id: 'behavior' as const,
                  name: 'Nề Nếp & Tích Sao Khen Thưởng',
                  desc: 'Cộng điểm sao khen thưởng, trừ điểm vi phạm, xếp hạng thi đua tổ và tổng kết tuần.',
                  icon: Crown,
                  badge: 'Cốt lõi',
                },
                {
                  id: 'timetable' as const,
                  name: 'Thời Khóa Biểu & Lịch Báo Giảng',
                  desc: 'Lịch dạy tuần, cấu hình giờ vào lớp (7h00 - 8h00) và thời lượng tiết học linh hoạt (35 - 45 phút).',
                  icon: Clock,
                  badge: 'Cốt lõi',
                },
                {
                  id: 'classroomTools' as const,
                  name: 'Công Cụ Lớp Học & Remote Trợ Giảng',
                  desc: 'Đồng hồ đếm ngược, bốc thăm ngẫu nhiên, chia nhóm và tích hợp điều khiển Remote từ điện thoại.',
                  icon: Zap,
                  badge: 'Tương tác',
                },
                {
                  id: 'homework' as const,
                  name: 'Giao Bài Tập & Cổng Học Sinh',
                  desc: 'Tạo bài tập tự luận/trắc nghiệm trực tuyến, cổng học sinh làm bài và phụ huynh nộp bài không cần tài khoản.',
                  icon: Edit3,
                  badge: 'Trực tuyến',
                },
              ].map((feat) => {
                const IconComponent = feat.icon;
                const isEnabled = featureFlags[feat.id];
                return (
                  <div
                    key={feat.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'bg-slate-50/70 border-slate-200'
                        : 'bg-slate-50/30 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isEnabled ? 'bg-white shadow-xs text-blue-600 border border-slate-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-800">{feat.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                            {feat.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={() => {
                        setFeatureFlag(feat.id, !isEnabled);
                        toast.success(
                          !isEnabled
                            ? `Đã kích hoạt module "${feat.name}" trên thanh điều hướng`
                            : `Đã tạm ẩn module "${feat.name}"`
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 2: Academic & TT27 Assessment */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-5 bg-purple-600 rounded-full"></span>
                  <h3 className="text-sm font-bold text-slate-900">2. Chuyên Môn & Đánh Giá Học Sinh (Thông tư 27)</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Lộ trình tiếp theo / Bật khi cần
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-4">
                Các nghiệp vụ đánh giá định kỳ, soạn giáo án và ngân hàng đề thi. Được bảo lưu toàn bộ dữ liệu khi tạm ẩn.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  id: 'assessment' as const,
                  name: 'Đánh Giá Học Sinh (Thông Tư 27)',
                  desc: 'Đánh giá môn học (T/H/C), phẩm chất & năng lực (T/Đ/C), bảng tổng hợp kết quả giáo dục và học bạ.',
                  icon: GraduationCap,
                  badge: 'TT27',
                },
                {
                  id: 'lessonPlans' as const,
                  name: 'Soạn Kế Hoạch Bài Dạy (Công Văn 2345)',
                  desc: 'Soạn giáo án 4 pha phát triển năng lực, tích hợp trợ lý AI gợi ý hoạt động dạy học theo khối lớp.',
                  icon: Layers,
                  badge: 'CV2345',
                },
                {
                  id: 'matrixExam' as const,
                  name: 'Ma Trận Đề Thi & Ngân Hàng Câu Hỏi',
                  desc: 'Thiết kế ma trận đề kiểm tra 3 mức độ, sinh đề thi môn Toán & Tiếng Việt định kỳ.',
                  icon: Cpu,
                  badge: 'Khảo thí',
                },
                {
                  id: 'iep' as const,
                  name: 'Kế Hoạch Giáo Dục Cá Nhân (IEP)',
                  desc: 'Hồ sơ theo dõi học sinh khuyết tật hòa nhập, mục tiêu điều chỉnh và nhật ký can thiệp sư phạm.',
                  icon: ShieldCheck,
                  badge: 'Hòa nhập',
                },
                {
                  id: 'aiAssistant' as const,
                  name: 'Trợ Lý AI Giáo Dục',
                  desc: 'Trợ lý ảo hỗ trợ viết lời nhận xét học bạ, soạn thông báo và tư vấn sư phạm bằng AI.',
                  icon: Bot,
                  badge: 'AI',
                },
              ].map((feat) => {
                const IconComponent = feat.icon;
                const isEnabled = featureFlags[feat.id];
                return (
                  <div
                    key={feat.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'bg-purple-50/30 border-purple-200'
                        : 'bg-slate-50/40 border-slate-200/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isEnabled ? 'bg-white shadow-xs text-purple-600 border border-purple-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-800">{feat.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700">
                            {feat.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={() => {
                        setFeatureFlag(feat.id, !isEnabled);
                        toast.success(
                          !isEnabled
                            ? `Đã kích hoạt module "${feat.name}" trên thanh điều hướng`
                            : `Đã tạm ẩn module "${feat.name}"`
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 3: Extended Utilities & Community */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-5 bg-amber-500 rounded-full"></span>
                  <h3 className="text-sm font-bold text-slate-900">3. Tiện Ích Mở Rộng & Hoạt Động Lớp</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Tùy chọn bổ sung
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-4">
                Các công cụ bổ trợ kết nối phụ huynh, văn hóa đọc và lưu giữ kỷ niệm học sinh.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  id: 'parentMeetings' as const,
                  name: 'Sổ Họp Phụ Huynh & Giao Tiếp',
                  desc: 'Biên bản họp phụ huynh đầu/cuối kỳ, ghi chép thu chi quỹ ban đại diện và tin nhắn kết nối.',
                  icon: Users,
                  badge: 'Gia đình',
                },
                {
                  id: 'readingCorner' as const,
                  name: 'Góc Đọc Sách & Văn Hóa Đọc',
                  desc: 'Theo dõi tủ sách lớp học, nhật ký đọc của từng học sinh và bảng vinh danh đọc sách.',
                  icon: Layers,
                  badge: 'Văn hóa',
                },
                {
                  id: 'moments' as const,
                  name: 'Khoảnh Khắc & Kỷ Yếu Lớp Học',
                  desc: 'Lưu giữ những bức ảnh, hoạt động ngoại khóa, sự kiện đáng nhớ của tập thể lớp.',
                  icon: ImageIcon,
                  badge: 'Kỷ yếu',
                },
                {
                  id: 'reports' as const,
                  name: 'Báo Cáo & Thống Kê Tổng Hợp',
                  desc: 'Thống kê tổng hợp số liệu học sinh, biểu đồ chuyên cần và xuất phiếu in ấn.',
                  icon: Database,
                  badge: 'Báo cáo',
                },
                {
                  id: 'community' as const,
                  name: 'Cộng Đồng Giáo Viên',
                  desc: 'Không gian giao lưu, trao đổi giáo án và tư liệu giảng dạy giữa các giáo viên.',
                  icon: Globe,
                  badge: 'Cộng đồng',
                },
              ].map((feat) => {
                const IconComponent = feat.icon;
                const isEnabled = featureFlags[feat.id];
                return (
                  <div
                    key={feat.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-slate-50/40 border-slate-200/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isEnabled ? 'bg-white shadow-xs text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-800">{feat.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700">
                            {feat.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={() => {
                        setFeatureFlag(feat.id, !isEnabled);
                        toast.success(
                          !isEnabled
                            ? `Đã kích hoạt module "${feat.name}" trên thanh điều hướng`
                            : `Đã tạm ẩn module "${feat.name}"`
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-amber-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
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
                <h2 className="text-base font-bold text-slate-900">Hồ Sơ Trường Công Tác & Niên Khóa</h2>
                <p className="text-xs text-slate-500">
                  Thông tin trường học xuất hiện trên tiêu đề các báo cáo, bảng tổng hợp đánh giá và học bạ TT27 của bạn.
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
                    <label className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tải Ảnh Logo Lên (PNG/JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </label>

                    {schoolLogoUrl && (
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
                        onClick={() => setSchoolLogoUrl(item.url)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          schoolLogoUrl === item.url
                            ? 'border-purple-600 ring-2 ring-purple-300 scale-105'
                            : 'border-slate-200 hover:border-slate-300'
                        } cursor-pointer`}
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
                    placeholder="Hoặc dán URL link ảnh logo trường..."
                    value={schoolLogoUrl}
                    onChange={(e) => setSchoolLogoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Trường Tiểu Học (*)</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cơ Quan Quản Lý Cấp Trên</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Niên Khóa / Năm Học</label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hiệu Trưởng / Đại Diện BGH</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại Trường</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Địa Chỉ Trường Học</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Hồ Sơ Trường Học</span>
              </button>
            </div>
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
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 overflow-hidden">
                    <span className="text-[10px] text-slate-400">Gợi ý nhanh URL:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrl('https://api.xiaomimimo.com/v1');
                        fetchModelsList(aiProvider, inputApiKey, 'https://api.xiaomimimo.com/v1');
                      }}
                      className="text-[10px] font-mono bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded text-orange-700 border border-orange-200 cursor-pointer truncate max-w-full"
                    >
                      Xiaomi MIMO (https://api.xiaomimimo.com/v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrl('https://api.openai.com/v1');
                        fetchModelsList(aiProvider, inputApiKey, 'https://api.openai.com/v1');
                      }}
                      className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700 cursor-pointer truncate max-w-full"
                    >
                      OpenAI (https://api.openai.com/v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrl('https://api.deepseek.com/v1');
                        fetchModelsList(aiProvider, inputApiKey, 'https://api.deepseek.com/v1');
                      }}
                      className="text-[10px] font-mono bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded text-blue-700 border border-blue-200 cursor-pointer truncate max-w-full"
                    >
                      DeepSeek (https://api.deepseek.com/v1)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrl('https://openrouter.ai/api/v1');
                        fetchModelsList(aiProvider, inputApiKey, 'https://openrouter.ai/api/v1');
                      }}
                      className="text-[10px] font-mono bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded text-purple-700 border border-purple-200 cursor-pointer truncate max-w-full"
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
                    <p className="text-xs text-slate-500">Khởi tạo và làm sạch danh sách học sinh của lớp.</p>
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
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Xóa tùy chọn trình duyệt:</span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-slate-500 hover:text-slate-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tải lại từ máy chủ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MCP SERVER & PERSONAL ACCESS KEYS */}
      {activeTab === 'MCP_API' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 rounded-3xl p-6 text-white shadow-xl border border-white/10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold">
                  <span>🧩 Gói Plugin Toàn Diện: Agent Skill + MCP Server</span>
                  <span className="bg-emerald-400 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
                    Chuẩn Mới
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  Cổng Kết Nối AI & Plugin Sư Phạm Cho Giáo Viên
                </h2>
                <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                  Kết hợp hoàn hảo giữa <strong>Agent Skill</strong> (Bộ tri thức Thông tư 27 & Công văn 2345) và <strong>MCP Server</strong> (16 công cụ kết nối dữ liệu thực tế) cho <strong>ChatGPT, Claude Desktop, Cursor, Gemini</strong>.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="/api/plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer shrink-0"
                >
                  <span>📦 Xem Plugin Manifest</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setNewKeyName('');
                    setCreatedKeyRecord(null);
                    setIsCreateKeyModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Key className="w-4 h-4" />
                  <span>+ TẠO KHÓA MỚI (API KEY)</span>
                </button>
              </div>
            </div>

            {/* Server Endpoints Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="bg-white/10 rounded-2xl p-3 border border-white/15">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase">Plugin Package (Skill + MCP):</span>
                <code className="text-xs text-white font-mono font-bold select-all">https://www.gvcn.pro.vn/api/plugin</code>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 border border-white/15">
                <span className="text-[10px] text-teal-300 font-bold block uppercase">OpenAPI 3.1 Spec (ChatGPT Actions):</span>
                <code className="text-xs text-white font-mono font-bold select-all">https://www.gvcn.pro.vn/api/v1/openapi.json</code>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 border border-white/15">
                <span className="text-[10px] text-blue-300 font-bold block uppercase">MCP Endpoint (JSON-RPC 2.0 / SSE):</span>
                <code className="text-xs text-white font-mono font-bold select-all">https://www.gvcn.pro.vn/api/mcp</code>
              </div>
            </div>
          </div>

          {/* VIP BANNER: Chrome Extension (Thay thế myGPT) */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 px-3 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Khuyên Dùng Thay Thế myGPT</span>
                  <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black uppercase">
                    1-Click Sư Phạm
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <span>🧩 Chrome Extension: GVCN Pro Classroom Copilot (v2.0)</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Trợ lý lớp học trực tiếp & trình chiếu: Đăng nhập Google để đồng bộ danh sách học sinh và thời khóa biểu. Thanh công cụ nổi <strong>🎓 Classroom Dock</strong> tự động gắn vào <strong>Google Slides, Canva, Hành trang số</strong> hỗ trợ <strong>Vòng quay may mắn bốc thăm</strong>, <strong>Bấm giờ thảo luận nhóm (CV 2345)</strong>, <strong>Khen thưởng sao nóng</strong> và <strong>Chuông hiệu lệnh lớp học</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <a
                  href="/downloads/gvcn-pro-extension.zip"
                  download="gvcn-pro-extension.zip"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>TẢI EXTENSION (.ZIP)</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const activeKey = apiKeys.find((k) => k.isActive)?.key || 'gvcn_pat_demo_teacher_2026_pro';
                    navigator.clipboard.writeText(activeKey);
                    toast.success('Đã sao chép API Key để kích hoạt Extension!');
                  }}
                  className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-300" />
                  <span>Sao Chép API Key Kích Hoạt</span>
                </button>
              </div>
            </div>

            {/* 3 Steps Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">1</span>
                  <span className="font-bold text-emerald-300">Tải & Giải nén</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Bấm nút <strong>TẢI EXTENSION (.ZIP)</strong> ở trên, sau đó giải nén file <code className="text-emerald-300 font-mono">gvcn-pro-extension.zip</code> vào một thư mục trên máy tính.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">2</span>
                  <span className="font-bold text-emerald-300">Mở chrome://extensions</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Trên trình duyệt Chrome/Cốc Cốc/Edge, truy cập <code className="text-teal-300 font-mono">chrome://extensions</code> và bật nút gạt <strong>Developer mode (Chế độ dành cho nhà phát triển)</strong> ở góc trên bên phải.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">3</span>
                  <span className="font-bold text-emerald-300">Load Unpacked & Sử Dụng</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Bấm nút <strong>Load unpacked (Tải tiện ích đã giải nén)</strong> và chọn thư mục vừa giải nén. Mở <code className="text-amber-300 font-mono">chatgpt.com</code> để thấy nút <strong>🎓 GVCN Pro</strong>!
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Không cần ChatGPT Plus
              </span>
              <span className="flex items-center gap-1 text-teal-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tích hợp thanh công cụ 1-click trên ChatGPT
              </span>
              <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Thanh bên Side Panel song song với vnEdu / SMAS
              </span>
              <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn Thông tư 27 & Công văn 2345
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Hoặc Kết Nối Qua MCP Server / OpenAPI Truyền Thống
            </h4>
          </div>

          {/* 4 Quick Connect Presets (1-Click Copy) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Claude Desktop */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Claude Desktop</h3>
                    <span className="text-[10px] text-slate-500 font-medium">Anthropic (macOS/Win)</span>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Dán vào file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">claude_desktop_config.json</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const activeKey = apiKeys.find((k) => k.isActive)?.key || 'gvcn_pat_YOUR_KEY';
                  const config = JSON.stringify(
                    {
                      mcpServers: {
                        'gvcn-pro': {
                          command: 'npx',
                          args: ['-y', 'mcp-remote', `https://www.gvcn.pro.vn/api/mcp?key=${activeKey}`],
                        },
                      },
                    },
                    null,
                    2
                  );
                  navigator.clipboard.writeText(config);
                  toast.success('Đã sao chép cấu hình Claude Desktop vào bộ nhớ tạm!');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                <span>Sao Chép Config JSON</span>
              </button>
            </div>

            {/* 2. Google Gemini Spark */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Google Gemini</h3>
                    <span className="text-[10px] text-slate-500 font-medium">Spark / AI Studio / Workspace</span>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Sử dụng Custom Tool / MCP Function Calling kết nối trực tiếp qua API.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const activeKey = apiKeys.find((k) => k.isActive)?.key || 'gvcn_pat_YOUR_KEY';
                  const snippet = `Endpoint: https://www.gvcn.pro.vn/api/mcp\nAuthorization: Bearer ${activeKey}`;
                  navigator.clipboard.writeText(snippet);
                  toast.success('Đã sao chép Endpoint & Token cho Gemini!');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-purple-600" />
                <span>Sao Chép URL & Token</span>
              </button>
            </div>

            {/* 3. ChatGPT Custom GPTs */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💬</span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">ChatGPT GPTs</h3>
                    <span className="text-[10px] text-slate-500 font-medium">OpenAI Custom Actions</span>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Nhập OpenAPI Schema URL vào mục Create Custom Action trên ChatGPT Plus.
                </p>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://www.gvcn.pro.vn/api/v1/openapi.json');
                    toast.success('Đã sao chép OpenAPI Schema URL cho ChatGPT!');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Sao Chép Schema URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `Bạn là Trợ Lý Giáo Viên Chủ Nhiệm Tiểu Học GVCN Pro.
Bạn có quyền truy cập trực tiếp vào hệ thống quản lý lớp học thông qua các Actions được cung cấp.
Quy tắc sư phạm:
1. Đánh giá môn học theo Thông tư 27/2020/TT-BGDĐT: mức T (Hoàn thành tốt), H (Hoàn thành), C (Chưa hoàn thành).
2. Đánh giá 5 phẩm chất và năng lực theo 3 mức: T (Tốt), Đ (Đạt), C (Cần cố gắng).
3. Soạn kế hoạch bài dạy theo đúng cấu trúc 4 hoạt động của Công văn 2345/BGDĐT-GDTH: Khởi động, Khám phá, Luyện tập, Vận dụng.
4. Lời nhận xét ấm áp, động viên, khen ngợi sự tiến bộ của học sinh.`;
                    navigator.clipboard.writeText(prompt);
                    toast.success('Đã sao chép System Prompt chuẩn sư phạm cho ChatGPT!');
                  }}
                  className="w-full py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>2. Copy Prompt Mẫu GPT</span>
                </button>
              </div>
            </div>

            {/* 4. Cursor / VSCode Cline */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Cursor / VSCode</h3>
                    <span className="text-[10px] text-slate-500 font-medium">MCP Server Settings</span>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Thêm vào Settings $\to$ Features $\to$ MCP Servers trên Cursor.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const activeKey = apiKeys.find((k) => k.isActive)?.key || 'gvcn_pat_YOUR_KEY';
                  navigator.clipboard.writeText(`https://www.gvcn.pro.vn/api/mcp?key=${activeKey}`);
                  toast.success('Đã sao chép MCP URL cho Cursor!');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-orange-600" />
                <span>Sao Chép URL Kết Nối</span>
              </button>
            </div>
          </div>

          {/* Active Keys List Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>Danh Sách Khóa Kết Nối Cá Nhân (Personal Access Tokens - PAT)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mỗi khóa được gắn liền với tài khoản và quyền hạn lớp học của bạn. Hãy bảo mật khóa này cẩn thận.
                </p>
              </div>
            </div>

            {apiKeys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Tên gợi nhớ</th>
                      <th className="py-2.5 px-3">Mã Khóa (API Key)</th>
                      <th className="py-2.5 px-3">Ngày tạo</th>
                      <th className="py-2.5 px-3">Lần dùng cuối</th>
                      <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apiKeys.map((k) => {
                      const isVisible = showKeySecretMap[k.id];
                      return (
                        <tr key={k.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 font-bold text-slate-900">{k.name}</td>
                          <td className="py-3 px-3 font-mono">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                              <span>
                                {isVisible ? k.key : `${k.key.slice(0, 12)}••••••••••••••••`}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowKeySecretMap((prev) => ({ ...prev, [k.id]: !prev[k.id] }))
                                }
                                className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                                title={isVisible ? 'Ẩn khóa' : 'Hiện khóa'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(k.key);
                                  toast.success('Đã sao chép khóa API!');
                                }}
                                className="p-0.5 text-blue-600 hover:text-blue-800 cursor-pointer"
                                title="Sao chép"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(k.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {k.lastUsedAt
                              ? new Date(k.lastUsedAt).toLocaleDateString('vi-VN')
                              : 'Chưa sử dụng'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                k.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {k.isActive ? 'Đang hoạt động' : 'Đã thu hồi'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {k.isActive && (
                              <button
                                type="button"
                                onClick={() => handleRevokeKey(k.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                              >
                                Thu hồi
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Chưa có khóa kết nối nào. Hãy bấm <strong>"+ Tạo Khóa Mới"</strong> ở góc phải.
              </div>
            )}
          </div>

          {/* Interactive Live Testing Console */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <span>🧪</span> Trình Kiểm Thử MCP Tool Trực Tiếp (Live Inspector)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn công cụ và bấm test để kiểm tra phản hồi từ cơ sở dữ liệu lớp học Lớp {classInfo.name}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 flex items-center gap-2">
                <select
                  value={mcpTestTool}
                  onChange={(e) => setMcpTestTool(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                >
                  <option value="get_class_overview">1. get_class_overview (Tổng quan lớp học)</option>
                  <option value="get_students">2. get_students (Danh sách học sinh)</option>
                  <option value="get_attendance_today">3. get_attendance_today (Điểm danh & bán trú)</option>
                  <option value="get_timetable">4. get_timetable (Thời khóa biểu)</option>
                  <option value="get_star_leaderboard">5. get_star_leaderboard (Bảng sao thi đua)</option>
                  <option value="get_subject_assessments">6. get_subject_assessments (Bảng điểm TT27)</option>
                  <option value="get_trait_assessments">7. get_trait_assessments (Phẩm chất & Năng lực)</option>
                  <option value="get_lesson_plans">8. get_lesson_plans (Kế hoạch bài dạy)</option>
                </select>

                <button
                  type="button"
                  disabled={isMcpTesting}
                  onClick={handleTestMcpTool}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isMcpTesting ? 'Đang gửi...' : 'Test Tool'}</span>
                </button>
              </div>
            </div>

            {mcpTestResult && (
              <div className="space-y-1.5 animate-in fade-in">
                <span className="text-[11px] font-bold text-slate-500">Phản hồi JSON-RPC 2.0:</span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[300px]">
                  {mcpTestResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE API KEY MODAL */}
      {isCreateKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Tạo Khóa Kết Nối MCP Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateKeyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {createdKeyRecord ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-xs">
                  <p className="font-black flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Đã tạo khóa thành công!</span>
                  </p>
                  <p className="text-slate-600">
                    Hãy sao chép và lưu trữ mã khóa này. Bạn sẽ không thể xem lại toàn bộ mã này sau khi đóng hộp thoại:
                  </p>
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-300 font-mono font-bold text-xs text-slate-900 break-all select-all flex items-center justify-between gap-2">
                    <span>{createdKeyRecord.key}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdKeyRecord.key);
                        toast.success('Đã sao chép khóa vào bộ nhớ tạm!');
                      }}
                      className="p-1 text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateKeyModalOpen(false);
                    setCreatedKeyRecord(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Đóng & Hoàn Tất
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateNewKey} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên gợi nhớ cho khóa:</label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="VD: Claude Desktop MacBook, ChatGPT Điện Thoại..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Đặt tên giúp bạn dễ dàng quản lý và thu hồi khóa khi cần.
                  </p>
                </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateKeyModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer"
                    >
                      Tạo Khóa Ngay
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      {/* MODAL: CREATE NEW CLASS */}
      {isNewClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <School className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Thêm Lớp Học Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Lớp (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 4A2, 5B, 1C..."
                  value={newClassForm.name}
                  onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối Lớp</label>
                <select
                  value={newClassForm.grade}
                  onChange={(e) => setNewClassForm({ ...newClassForm, grade: Number(e.target.value) as GradeLevel })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
                >
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trường Tiểu Học</label>
                <input
                  type="text"
                  placeholder="Tên trường học của lớp này..."
                  value={newClassForm.schoolName}
                  onChange={(e) => setNewClassForm({ ...newClassForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Niên Khóa / Năm Học</label>
                <input
                  type="text"
                  value={newClassForm.schoolYear}
                  onChange={(e) => setNewClassForm({ ...newClassForm, schoolYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Tạo Lớp Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
