import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Trash2, ArrowLeft, Mail, Globe, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính Sách Quyền Riêng Tư (Privacy Policy) | GVCN Pro',
  description: 'Chính sách bảo mật và quyền riêng tư của phần mềm GVCN Pro - Tuân thủ Thông tư 27/2020/TT-BGDĐT và Google API Services User Data Policy.',
};

export default function PrivacyPolicyPage() {
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
                Chính Thức
              </span>
              <span className="text-xs text-blue-200">Phiên bản 1.0.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Chính Sách Quyền Riêng Tư (Privacy Policy)
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Phần mềm Quản lý Giáo viên Chủ nhiệm Tiểu học Thông tư 27 (GVCN Pro)
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-sm leading-relaxed text-slate-700">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>1. Giới thiệu tổng quan & Phạm vi áp dụng</span>
            </h2>
            <p>
              Chào mừng bạn đến với <strong>GVCN Pro</strong> (gọi tắt là &quot;Ứng dụng&quot;, &quot;Hệ thống&quot; hoặc &quot;chúng tôi&quot;), tại địa chỉ trang web chính thức:{' '}
              <a href="https://www.gvcn.pro.vn" className="text-blue-600 font-bold underline" target="_blank" rel="noopener noreferrer">
                https://www.gvcn.pro.vn
              </a>.
            </p>
            <p>
              GVCN Pro được phát triển nhằm hỗ trợ các thầy cô giáo tiểu học tại Việt Nam thực hiện công tác chủ nhiệm, soạn kế hoạch bài dạy theo Công văn 2345/BGDĐT, đánh giá học sinh theo Thông tư 27/2020/TT-BGDĐT và trình chiếu bài giảng tương tác trên Smart TV.
            </p>
            <p>
              Chúng tôi cam kết bảo vệ tối đa quyền riêng tư và dữ liệu cá nhân của người dùng, tuân thủ nghiêm ngặt quy định của <strong>Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân của Chính phủ Việt Nam</strong>, <strong>Luật An toàn thông tin mạng</strong> và <strong>Chính sách dữ liệu người dùng của Google (Google API Services User Data Policy)</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              <span>2. Thông tin chúng tôi thu thập</span>
            </h2>
            <div className="space-y-2 pl-2">
              <p>Khi bạn sử dụng GVCN Pro, chúng tôi có thể thu thập các loại dữ liệu sau:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>
                  <strong>Thông tin tài khoản đăng nhập Google:</strong> Khi bạn chọn đăng nhập bằng Google OAuth, hệ thống nhận được thông tin cơ bản được công khai gồm: Địa chỉ Email (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">tên@gmail.com</code>), Họ và tên hiển thị và Ảnh đại diện (Avatar).
                </li>
                <li>
                  <strong>Thông tin phân quyền nhà trường (RBAC):</strong> Chức danh giảng dạy (Giáo viên chủ nhiệm, Ban giám hiệu, Tổ trưởng chuyên môn) và Lớp học được phân công phụ trách.
                </li>
                <li>
                  <strong>Dữ liệu học tập & nề nếp lớp học:</strong> Danh sách học sinh trong lớp (họ tên, mã học sinh), điểm danh hàng ngày, nhật ký khen thưởng sao tích cực, đánh giá định kỳ theo Thông tư 27. Dữ liệu này chỉ lưu trữ trong phạm vi trường học của bạn.
                </li>
                <li>
                  <strong>Học liệu giảng dạy từ Google Drive:</strong> Khi bạn sử dụng chức năng nạp bài giảng, hệ thống chỉ đọc đường dẫn và ID của tập tin Google Slides/Docs/PDF mà bạn <strong>chủ động lựa chọn</strong> để hỗ trợ trình chiếu trên màn hình TV lớp học.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: MANDATORY GOOGLE LIMITED USE DISCLOSURE */}
          <section className="space-y-3 p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200">
            <h2 className="text-base font-black text-blue-950 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>3. Cam kết tuân thủ chính sách dữ liệu người dùng của Google (Google User Data Policy)</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-900 leading-relaxed font-medium">
              Việc GVCN Pro sử dụng và chuyển giao thông tin nhận được từ các API của Google cho bất kỳ ứng dụng nào khác sẽ tuân thủ nghiêm ngặt{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline font-bold"
              >
                Chính sách dữ liệu người dùng của dịch vụ Google API (Google API Services User Data Policy)
              </a>
              , bao gồm các <strong>yêu cầu về Sử dụng có giới hạn (Limited Use requirements)</strong>.
            </p>
            <div className="text-xs text-blue-800 space-y-1 pl-3 border-l-2 border-blue-400">
              <p>• GVCN Pro <strong>KHÔNG BAO GIỜ</strong> bán, cho thuê hoặc chuyển giao dữ liệu người dùng Google cho bên thứ ba vì mục đích quảng cáo, môi giới dữ liệu hoặc tiếp thị.</p>
              <p>• GVCN Pro <strong>KHÔNG</strong> sử dụng dữ liệu người dùng Google để huấn luyện các mô hình trí tuệ nhân tạo (AI/LLM) tổng quát mà không có sự đồng ý rõ ràng của người dùng.</p>
              <p>• GVCN Pro chỉ sử dụng quyền truy cập Google để xác thực danh tính giáo viên và đọc các tập tin bài giảng mà giáo viên chọn trình chiếu.</p>
            </div>
          </section>

          {/* Section 3.1: OpenAI Plugin & MCP Privacy Compliance */}
          <section className="space-y-3 p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200">
            <h2 className="text-base font-black text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>3.1. Tuân thủ Nguyên tắc Quyền riêng tư của OpenAI (OpenAI App Guidelines)</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
              Đối với các kết nối qua OpenAI ChatGPT Plugins, Custom Actions và giao thức Model Context Protocol (MCP), GVCN Pro tuân thủ nghiêm ngặt{' '}
              <a
                href="https://developers.openai.com/plugins/app-guidelines"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline font-bold"
              >
                Quy chuẩn nhà phát triển OpenAI (OpenAI Developer Guidelines)
              </a>:
            </p>
            <div className="text-xs text-emerald-800 space-y-1 pl-3 border-l-2 border-emerald-400">
              <p>• <strong>Thu thập tối thiểu (Input Minimization):</strong> Hệ thống không bao giờ thu thập hay lưu trữ toàn bộ lịch sử hội thoại (chat transcripts) của người dùng trên ChatGPT.</p>
              <p>• <strong>Phản hồi tối thiểu (Response Minimization):</strong> Chỉ trả về các trường dữ liệu cần thiết để mô hình trả lời câu hỏi nghiệp vụ, tự động lọc bỏ các mã chẩn đoán, trace ID, token nội bộ.</p>
              <p>• <strong>Không thu thập dữ liệu bị cấm:</strong> Không xử lý dữ liệu thanh toán (PCI DSS), không đòi hỏi định danh quốc gia, không xử lý bệnh án y tế chuyên sâu.</p>
              <p>• <strong>Xác thực có kiểm soát:</strong> Mọi thao tác truy xuất qua API / MCP đều bắt buộc xác thực bằng Personal Access Token (PAT) gắn liền với phân quyền của giáo viên.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              <span>4. Mục đích sử dụng thông tin</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Xác thực & Bảo mật tài khoản</span>
                </div>
                <p className="text-slate-500 text-xs">Đảm bảo chỉ các giáo viên được nhà trường phê duyệt mới có quyền truy cập hồ sơ học sinh.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Quản lý học sinh Thông tư 27</span>
                </div>
                <p className="text-slate-500 text-xs">Tự động tổng hợp kết quả học tập, năng lực, phẩm chất và xuất file Word chuẩn BGH duyệt.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Trình chiếu bài dạy trên Smart TV</span>
                </div>
                <p className="text-slate-500 text-xs">Hiển thị slide Google Slides, PowerPoint, hỗ trợ Bút Laser ảo điều khiển bằng điện thoại.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đồng bộ dữ liệu thời gian thực</span>
                </div>
                <p className="text-slate-500 text-xs">Lưu trữ bảo mật trên hạ tầng đám mây Supabase PostgreSQL có mã hóa dữ liệu.</p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>5. Lưu trữ, Thu hồi quyền & Yêu cầu xóa dữ liệu</span>
            </h2>
            <p>
              Người dùng có toàn quyền kiểm soát dữ liệu cá nhân của mình bất kỳ lúc nào:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Thu hồi quyền truy cập Google:</strong> Bạn có thể thu hồi quyền truy cập của GVCN Pro vào tài khoản Google của mình bất kỳ lúc nào tại trang quản lý tài khoản Google:{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-bold underline"
                >
                  https://myaccount.google.com/permissions
                </a>.
              </li>
              <li>
                <strong>Yêu cầu xóa toàn bộ tài khoản và dữ liệu:</strong> Bạn có quyền yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu học sinh, giáo án đã nhập bằng cách gửi email về:{' '}
                <a href="mailto:anhnnh4@gmail.com" className="text-blue-600 font-bold underline">
                  anhnnh4@gmail.com
                </a>{' '}
                với tiêu đề <em>&quot;Yêu cầu xóa dữ liệu tài khoản GVCN Pro&quot;</em>. Yêu cầu của bạn sẽ được xử lý và xóa hoàn tất trong vòng <strong>48 giờ làm việc</strong>.
              </li>
            </ul>
          </section>

          {/* Section 6: Contact Information */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>6. Thông tin liên hệ Ban Quản Trị & Nhà Phát Triển</span>
            </h2>
            <p className="text-xs sm:text-sm">
              Nếu bạn có bất kỳ câu hỏi, góp ý hoặc yêu cầu hỗ trợ nào liên quan đến Chính sách quyền riêng tư này, vui lòng liên hệ với chúng tôi:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs sm:text-sm">
              <p>• <strong>Đơn vị phát triển:</strong> GVCN Pro Development Team</p>
              <p>• <strong>Email đại diện / Quản trị viên:</strong>{' '}
                <a href="mailto:anhnnh4@gmail.com" className="text-blue-600 font-bold underline">
                  anhnnh4@gmail.com
                </a>
              </p>
              <p>• <strong>Trang web ứng dụng:</strong>{' '}
                <a href="https://www.gvcn.pro.vn" className="text-blue-600 font-bold underline" target="_blank" rel="noopener noreferrer">
                  https://www.gvcn.pro.vn
                </a>
              </p>
              <p>• <strong>Địa chỉ:</strong> Hà Nội, Việt Nam</p>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p>© 2026 GVCN Pro. Toàn bộ quyền được bảo lưu.</p>
          <div className="flex items-center justify-center space-x-3 text-blue-600 font-bold">
            <Link href="/terms" className="hover:underline">Điều Khoản Dịch Vụ (Terms of Service)</Link>
            <span>•</span>
            <Link href="/login" className="hover:underline">Đăng Nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
