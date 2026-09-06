'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Presentation,
  Gamepad2,
  Heart,
  Download,
  Share2,
  Plus,
  CheckCircle2,
  ShieldCheck,
  User,
  GraduationCap,
  Copy,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CommunityResource, CommunityResourceType, GradeLevel } from '@/types';
import { toast } from 'sonner';

const RESOURCE_TYPES: { type: CommunityResourceType | 'ALL'; label: string; icon: any; color: string }[] = [
  { type: 'ALL', label: 'Tất cả tài nguyên', icon: Globe, color: 'text-blue-600 bg-blue-50' },
  { type: 'LESSON_PLAN', label: 'Kế hoạch bài dạy (CV 2345)', icon: Presentation, color: 'text-indigo-600 bg-indigo-50' },
  { type: 'COMMENT_BANK', label: 'Nhận xét Thông tư 27', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50' },
  { type: 'MEETING_TEMPLATE', label: 'Mẫu Họp Phụ Huynh', icon: UsersIcon, color: 'text-purple-600 bg-purple-50' },
  { type: 'GAME_ACTIVITY', label: 'Trò chơi & Khởi động', icon: Gamepad2, color: 'text-amber-600 bg-amber-50' },
];

function UsersIcon(props: any) {
  return <User {...props} />;
}

const GRADES = [
  { id: 0, label: 'Tất cả khối' },
  { id: 1, label: 'Khối 1' },
  { id: 2, label: 'Khối 2' },
  { id: 3, label: 'Khối 3' },
  { id: 4, label: 'Khối 4' },
  { id: 5, label: 'Khối 5' },
];

const SUBJECTS = [
  { code: 'ALL', label: 'Tất cả môn' },
  { code: 'TOAN', label: 'Toán' },
  { code: 'TIENG_VIET', label: 'Tiếng Việt' },
  { code: 'KHOA_HOC', label: 'Khoa học / TNXH' },
  { code: 'DAO_DUC', label: 'Đạo đức' },
  { code: 'HOAT_DONG_TRAI_NGHIEM', label: 'HĐ Trải nghiệm' },
  { code: 'LS_DL', label: 'Lịch sử & Địa lý' },
  { code: 'TIN_HOC_CN', label: 'Tin học & Công nghệ' },
];

export default function CommunityPage() {
  const { profile } = useAuth();
  const { activeClassId, classInfo } = useAppStore();

  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CommunityResourceType | 'ALL'>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  // Modals
  const [selectedResource, setSelectedResource] = useState<CommunityResource | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [likedResourceIds, setLikedResourceIds] = useState<Set<string>>(new Set());

  // Form state for sharing a resource
  const [shareForm, setShareForm] = useState<{
    title: string;
    description: string;
    type: CommunityResourceType;
    grade: number;
    subjectCode: string;
    contentRaw: string;
  }>({
    title: '',
    description: '',
    type: 'LESSON_PLAN',
    grade: classInfo.grade || 4,
    subjectCode: 'TOAN',
    contentRaw: '',
  });

  // Fetch resources from Supabase
  const loadCommunityResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('CommunityResource')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Lỗi khi tải tài nguyên cộng đồng:', error.message);
        toast.error('Không thể tải tài nguyên cộng đồng từ máy chủ.');
      } else if (data) {
        setResources(data as CommunityResource[]);
      }
    } catch (err: any) {
      console.warn('Lỗi kết nối cộng đồng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityResources();
  }, []);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchSearch =
        !searchQuery.trim() ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.authorSchool || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = selectedType === 'ALL' || r.type === selectedType;
      const matchGrade = selectedGrade === 0 || r.grade === 0 || r.grade === selectedGrade;
      const matchSubject =
        selectedSubject === 'ALL' || !r.subjectCode || r.subjectCode === selectedSubject;

      return matchSearch && matchType && matchGrade && matchSubject;
    });
  }, [resources, searchQuery, selectedType, selectedGrade, selectedSubject]);

  // Handle Like
  const handleLike = async (resourceId: string) => {
    if (!profile?.email) {
      toast.error('Vui lòng đăng nhập để thả tim bài học');
      return;
    }

    const isLiked = likedResourceIds.has(resourceId);
    const newLiked = new Set(likedResourceIds);

    if (isLiked) {
      newLiked.delete(resourceId);
    } else {
      newLiked.add(resourceId);
    }
    setLikedResourceIds(newLiked);

    setResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, likesCount: r.likesCount + (isLiked ? -1 : 1) } : r))
    );

    try {
      await supabase.from('CommunityInteraction').insert({
        id: `interact-${Date.now()}`,
        resourceId,
        userEmail: profile.email.toLowerCase(),
        action: 'LIKE',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {}
  };

  // Handle 1-Click Copy to Teacher's Active Class
  const handleCopyToMyClass = async (resource: CommunityResource) => {
    if (!activeClassId) {
      toast.error('Thầy/Cô vui lòng tạo hoặc chọn một lớp học để lưu tài nguyên này vào.');
      return;
    }

    try {
      if (resource.type === 'LESSON_PLAN') {
        const week = resource.content?.week || 1;
        const subjectCode = resource.subjectCode || 'TOAN';
        const planData = {
          id: `plan-${activeClassId}-${week}-${subjectCode}`,
          classId: activeClassId,
          grade: classInfo.grade || resource.grade || 4,
          subjectCode,
          subjectName: SUBJECTS.find((s) => s.code === subjectCode)?.label || subjectCode,
          textbook: resource.content?.textbook || 'KET_NOI',
          week,
          periodNumber: resource.content?.periodNumber || 1,
          title: resource.title,
          durationMinutes: resource.content?.durationMinutes || 35,
          objectives: resource.content?.objectives || {
            knowledgeAndSkills: [],
            generalCompetencies: [],
            qualities: [],
          },
          equipment: resource.content?.equipment || { teacher: [], students: [] },
          activities: resource.content?.activities || [],
          postLessonNotes: '',
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const { error } = await supabase.from('LessonPlan').upsert({
          id: planData.id,
          classId: activeClassId,
          week,
          subjectCode,
          data: planData,
          updatedAt: new Date().toISOString(),
        });

        if (error) {
          toast.error(`Không thể lưu bài dạy vào lớp: ${error.message}`);
          return;
        }

        toast.success(
          `Đã sao chép kế hoạch bài dạy vào Lớp ${classInfo.name}! Thầy/Cô có thể vào mục Giáo Án Điện Tử để xem.`
        );
      } else {
        // Copy text or comment bank
        navigator.clipboard.writeText(JSON.stringify(resource.content, null, 2));
        toast.success(`Đã sao chép nội dung "${resource.title}" vào bộ nhớ tạm!`);
      }
    } catch (err: any) {
      toast.error(`Lỗi khi sao chép tài nguyên: ${err?.message || 'Vui lòng thử lại'}`);
    }
  };

  // Handle Share New Resource
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) {
      toast.error('Vui lòng đăng nhập để chia sẻ tài nguyên');
      return;
    }
    if (!shareForm.title.trim()) {
      toast.error('Vui lòng điền tiêu đề tài liệu');
      return;
    }

    let parsedContent: any = {};
    try {
      parsedContent = shareForm.contentRaw.trim()
        ? JSON.parse(shareForm.contentRaw)
        : { text: shareForm.description };
    } catch (err) {
      parsedContent = { text: shareForm.contentRaw || shareForm.description };
    }

    const newRes: CommunityResource = {
      id: `res-${Date.now()}`,
      authorEmail: profile.email.toLowerCase(),
      authorName: profile.fullName || 'Giáo viên',
      authorSchool: profile.schoolName || classInfo.schoolName || 'Trường Tiểu học',
      authorAvatar: profile.avatarUrl || undefined,
      type: shareForm.type,
      grade: shareForm.grade,
      subjectCode: shareForm.subjectCode,
      title: shareForm.title.trim(),
      description: shareForm.description.trim(),
      content: parsedContent,
      likesCount: 1,
      downloadsCount: 0,
      isVerified: false,
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('CommunityResource').insert(newRes);
      if (error) {
        toast.error(`Lỗi khi chia sẻ tài nguyên: ${error.message}`);
        return;
      }

      setResources((prev) => [newRes, ...prev]);
      setIsShareModalOpen(false);
      setShareForm({
        title: '',
        description: '',
        type: 'LESSON_PLAN',
        grade: classInfo.grade || 4,
        subjectCode: 'TOAN',
        contentRaw: '',
      });
      toast.success('Đã chia sẻ tài nguyên lên Cộng đồng GVCN Pro thành công! Cảm ơn đóng góp của Thầy/Cô.');
    } catch (err: any) {
      toast.error(`Lỗi kết nối: ${err?.message || 'Vui lòng thử lại'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <Globe className="w-3.5 h-3.5 text-sky-200" />
            <span className="tracking-wide uppercase">CỘNG ĐỒNG GIÁO VIÊN CHỦ NHIỆM TIỂU HỌC (BETA)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            Mạng Lưới & Kho Tri Thức Mở Dành Cho GVCN
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Kết nối hơn 1.200 thầy cô giáo trên khắp 63 tỉnh thành: Chia sẻ Kế hoạch bài dạy chuẩn CV 2345,
            ngân hàng nhận xét Thông tư 27, kịch bản họp phụ huynh và bí quyết điều hành lớp học tích cực.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Đóng Góp Kế Hoạch Bài Dạy / Tài Liệu</span>
            </button>
            <div className="text-xs text-blue-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Được chia sẻ miễn phí 100% trong phiên bản BETA</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên bài dạy, từ khóa nhận xét, môn học, giáo viên hoặc trường..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(Number(e.target.value))}
              className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-slate-700 cursor-pointer"
            >
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-slate-700 cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {RESOURCE_TYPES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.type;
            return (
              <button
                key={cat.type}
                onClick={() => setSelectedType(cat.type)}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource Count Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>
          Đang hiển thị <strong>{filteredResources.length}</strong> tài nguyên phù hợp
        </span>
        <span>
          Lớp đang chọn để nhận giáo án: <strong className="text-blue-600">Lớp {classInfo.name || '4A1'} ({classInfo.schoolName || 'Tiểu học'})</strong>
        </span>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Đang tải kho tri thức cộng đồng GVCN...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy tài nguyên nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm nút bên dưới để là người đầu tiên chia sẻ tài liệu về chủ đề này.
          </p>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng Góp Tài Liệu Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => {
            const isLiked = likedResourceIds.has(res.id);
            const typeConfig = RESOURCE_TYPES.find((t) => t.type === res.type) || RESOURCE_TYPES[0];
            const Icon = typeConfig.icon;

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Card Header Tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${typeConfig.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{typeConfig.label}</span>
                    </span>

                    <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                      {res.grade > 0 && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-700">
                          Khối {res.grade}
                        </span>
                      )}
                      {res.isVerified && (
                        <span
                          title="Đã được kiểm duyệt chuẩn Thông tư 27 & CV 2345"
                          className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-0.5" />
                          Chuẩn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => setSelectedResource(res)}
                      className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer"
                    >
                      {res.title}
                    </h3>
                    {res.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {res.description}
                      </p>
                    )}
                  </div>

                  {/* Author metadata */}
                  <div className="flex items-center space-x-2.5 pt-2 border-t border-slate-100">
                    {res.authorAvatar ? (
                      <img
                        src={res.authorAvatar}
                        alt={res.authorName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                        {res.authorName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{res.authorName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{res.authorSchool || 'Tiểu học'}</p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-slate-500">
                    <button
                      onClick={() => handleLike(res.id)}
                      className={`flex items-center space-x-1 font-semibold transition-colors cursor-pointer ${
                        isLiked ? 'text-rose-600' : 'hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
                      <span>{res.likesCount}</span>
                    </button>
                    <span className="flex items-center space-x-1 font-semibold text-slate-400">
                      <Download className="w-3.5 h-3.5" />
                      <span>{res.downloadsCount}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedResource(res)}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => handleCopyToMyClass(res)}
                      className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Lưu về lớp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: View Resource Details */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {RESOURCE_TYPES.find((t) => t.type === selectedResource.type)?.label}
                </span>
                <h2 className="text-base font-bold text-slate-900">{selectedResource.title}</h2>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 text-xs leading-relaxed text-slate-700">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {selectedResource.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedResource.authorName}</p>
                    <p className="text-[11px] text-slate-400">{selectedResource.authorSchool || 'Trường Tiểu học'}</p>
                  </div>
                </div>
                {selectedResource.grade > 0 && (
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700">
                    Khối {selectedResource.grade}
                  </span>
                )}
              </div>

              {selectedResource.description && (
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-xs">Mô tả & Giới thiệu:</p>
                  <p className="text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {selectedResource.description}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-xs">Chi tiết nội dung học liệu:</p>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {typeof selectedResource.content === 'object'
                    ? JSON.stringify(selectedResource.content, null, 2)
                    : selectedResource.content}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                Cộng đồng GVCN Pro • Miễn phí trọn đời
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedResource(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleCopyToMyClass(selectedResource);
                    setSelectedResource(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Vào Lớp Của Tôi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Share / Upload Resource to Community */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Chia Sẻ Tài Liệu Lên Cộng Đồng</h2>
                <p className="text-xs text-slate-500">Giúp đỡ đồng nghiệp tiểu học trên toàn quốc</p>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tiêu đề tài liệu / Kế hoạch bài dạy *</label>
                <input
                  type="text"
                  required
                  value={shareForm.title}
                  onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                  placeholder="VD: Kế hoạch bài dạy Toán 4 - Tiết 12 hoặc Bộ nhận xét TT27 kỳ 1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Loại tài nguyên</label>
                  <select
                    value={shareForm.type}
                    onChange={(e) => setShareForm({ ...shareForm, type: e.target.value as CommunityResourceType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
                  >
                    <option value="LESSON_PLAN">Kế hoạch bài dạy (CV 2345)</option>
                    <option value="COMMENT_BANK">Nhận xét Thông tư 27</option>
                    <option value="MEETING_TEMPLATE">Mẫu Họp Phụ Huynh</option>
                    <option value="GAME_ACTIVITY">Trò chơi & Khởi động</option>
                    <option value="IEP_GUIDE">Kế hoạch phụ đạo IEP</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Khối lớp</label>
                  <select
                    value={shareForm.grade}
                    onChange={(e) => setShareForm({ ...shareForm, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
                  >
                    <option value={0}>Liên khối (Chung)</option>
                    <option value={1}>Khối 1</option>
                    <option value={2}>Khối 2</option>
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Môn học</label>
                <select
                  value={shareForm.subjectCode}
                  onChange={(e) => setShareForm({ ...shareForm, subjectCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
                >
                  {SUBJECTS.filter((s) => s.code !== 'ALL').map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={shareForm.description}
                  onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                  placeholder="Mô tả tóm tắt mục tiêu, điểm nổi bật của bài dạy hoặc tài liệu này..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nội dung chi tiết (Text hoặc JSON Kế hoạch bài dạy)</label>
                <textarea
                  rows={4}
                  value={shareForm.contentRaw}
                  onChange={(e) => setShareForm({ ...shareForm, contentRaw: e.target.value })}
                  placeholder="Dán nội dung giáo án, ngân hàng nhận xét hoặc kịch bản họp vào đây..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Chia Sẻ Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
