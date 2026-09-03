import React from 'react';
import Link from 'next/link';
import { FileText, ShieldAlert, CheckCircle2, ArrowLeft, Mail, Scale } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều Khoản Dịch Vụ (Terms of Service) | GVCN Pro',
  description: 'Điều khoản sử dụng phần mềm quản lý giáo viên chủ nhiệm tiểu học GVCN Pro.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium">Cập nhật lần cuối: 03/09/2026</span>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/30 shrink-0">
            <img src="/app-icon.jpg" alt="GVCN Pro Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                Quy Định Sử Dụng
              </span>
              <span className="text-xs text-blue-200">Phiên bản 1.0.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Điều Khoản Dịch Vụ (Terms of Service)
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Quy ước và điều khoản sử dụng nền tảng GVCN Pro
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <span>1. Chấp thuận các điều khoản</span>
            </h2>
            <p>
              Bằng việc đăng ký tài khoản, đăng nhập hoặc sử dụng bất kỳ tính năng nào của hệ thống <strong>GVCN Pro</strong> tại địa chỉ{' '}
              <a href="https://gvcn-eta.vercel.app" className="text-blue-600 font-bold underline" target="_blank" rel="noopener noreferrer">
                https://gvcn-eta.vercel.app
              </a>
              , bạn đồng ý tuân theo và chịu sự ràng buộc bởi các Điều khoản dịch vụ này cùng Chính sách quyền riêng tư của chúng tôi.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>2. Quyền và Trách nhiệm của Người Dùng (Giáo viên & Cán bộ QL)</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Bảo mật tài khoản:</strong> Người dùng có trách nhiệm tự bảo vệ thông tin đăng nhập tài khoản Google và mật khẩu cá nhân. Không cung cấp tài khoản cho người không có thẩm quyền truy cập vào dữ liệu học sinh của trường.
              </li>
              <li>
                <strong>Tính chính xác của dữ liệu:</strong> Giáo viên chịu trách nhiệm về tính trung thực, khách quan và chính xác của các đánh giá học sinh, điểm danh, nhận xét theo đúng tinh thần của Thông tư 27/2020/TT-BGDĐT.
              </li>
              <li>
                <strong>Bảo vệ trẻ em:</strong> Tuyệt đối không đăng tải, chia sẻ các hình ảnh, tài liệu xâm phạm đến quyền riêng tư, danh dự, nhân phẩm của học sinh tiểu học lên hệ thống.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>3. Quyền sở hữu trí tuệ & Dữ liệu giáo án</span>
            </h2>
            <p>
              Mọi kế hoạch bài dạy, bài giảng trình chiếu, tài liệu học tập do giáo viên tải lên hoặc soạn thảo trên GVCN Pro thuộc toàn quyền sở hữu của giáo viên và đơn vị trường học tương ứng. GVCN Pro không yêu cầu quyền sở hữu đối với nội dung bài dạy của bạn.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>4. Giới hạn trách nhiệm pháp lý</span>
            </h2>
            <p>
              Hệ thống được cung cấp trên nguyên tắc &quot;nguyên trạng&quot; (as is) với mục tiêu phục vụ tối đa công tác sư phạm. Chúng tôi nỗ lực tối đa để đảm bảo hệ thống vận hành liên tục 24/7 và sao lưu an toàn, nhưng không chịu trách nhiệm đối với các gián đoạn dịch vụ do sự cố hạ tầng Internet công cộng, thiên tai hoặc các sự kiện bất khả kháng.
            </p>
          </section>

          {/* Section 5: Contact */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>5. Thông tin liên hệ</span>
            </h2>
            <p className="text-xs sm:text-sm">
              Mọi ý kiến đóng góp hoặc yêu cầu giải đáp về Điều khoản dịch vụ, xin gửi thư điện tử về:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs sm:text-sm">
              <p>• <strong>Ban Quản Trị GVCN Pro:</strong>{' '}
                <a href="mailto:anhnnh4@gmail.com" className="text-blue-600 font-bold underline">
                  anhnnh4@gmail.com
                </a>
              </p>
              <p>• <strong>Website:</strong>{' '}
                <a href="https://gvcn-eta.vercel.app" className="text-blue-600 font-bold underline" target="_blank" rel="noopener noreferrer">
                  https://gvcn-eta.vercel.app
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p>© 2026 GVCN Pro. Toàn bộ quyền được bảo lưu.</p>
          <div className="flex items-center justify-center space-x-3 text-blue-600 font-bold">
            <Link href="/privacy" className="hover:underline">Chính Sách Quyền Riêng Tư (Privacy Policy)</Link>
            <span>•</span>
            <Link href="/login" className="hover:underline">Đăng Nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
