# GVCN PRO - Phần Mềm Quản Lý Lớp Học & Đánh Giá Học Sinh Tiểu Học

> **GVCN Pro** là phần mềm trợ lý toàn diện dành cho Giáo viên Chủ nhiệm Tiểu học tại Việt Nam, chuẩn hóa theo **Thông tư 27/2020/TT-BGDĐT** (Chương trình GDPT 2018), tích hợp **Trợ lý Sư phạm AI** sinh lời nhận xét học bạ tự động và hệ thống xuất báo cáo Excel tương thích VnEdu, SMAS.

---

## 🌟 Các Tính Năng Nổi Bật

### 1. 📊 Đánh Giá Học Sinh Chuẩn Thông Tư 27/2020/TT-BGDĐT
* **Đánh giá Môn học & HĐGD**: Mức độ đạt được (**T / H / C**) + Điểm kiểm tra định kỳ (thang điểm 10).
* **Đánh giá 5 Phẩm chất & Năng lực**: 5 Phẩm chất chủ yếu + 3 Năng lực chung + 6 Năng lực đặc thù theo mức **Tốt (T)**, **Đạt (Đ)**, **Cần cố gắng (C)**.
* **Chấm nhanh cả lớp (Batch Rating)**: 1-Click đặt nhanh tất cả là T/Đ rồi chỉ sửa các trường hợp ngoại lệ.
* **Tự động xét danh hiệu Khen thưởng**: Tự động tính toán *Học sinh Xuất sắc*, *Học sinh Tiêu biểu hoàn thành tốt* theo đúng quy định tại Điều 13, Thông tư 27.

### 2. 🤖 Trợ Lý Sư Phạm AI (Sinh Nhận Xét Học Bạ 1-Click)
* **Ngân hàng 200+ mẫu nhận xét chuẩn mực sư phạm Offline**: Hoạt động 100% không cần mạng, tự động chèn tên học sinh, biến đổi câu từ không trùng lặp giữa các em.
* **Tích hợp Gemini AI API**: Tùy chọn sinh nhận xét độc bản, cá nhân hóa sâu sắc theo tính cách và năng khiếu riêng.
* **Sinh hàng loạt 1-Click**: Tạo toàn bộ lời nhận xét học bạ cho cả lớp chỉ trong vài giây.

### 3. 👥 Quản Lý Hồ Sơ Học Sinh & Sơ Đồ Lớp Tương Tác
* Quản lý thông tin chi tiết: Sĩ số, Nam/Nữ, Ngày sinh, Phụ huynh, SĐT, Bán trú, Sức khỏe/Cận thị.
* **Nhập danh sách từ Excel** và **Xuất danh sách học sinh**.
* **Sơ đồ lớp trực quan**: Kéo thả hoán đổi vị trí chỗ ngồi, tự động tối ưu học sinh cận thị ngồi bàn đầu.

### 4. 📅 Điểm Danh & Kiểm Diện Bán Trú Hàng Ngày
* Điểm danh 1 chạm (Có mặt, Vắng có phép, Vắng không phép).
* Tự động tổng hợp và **Sao chép tin nhắn báo cáo suất ăn gửi Nhà bếp qua Zalo**.

### 5. ⭐ Nề Nếp & Tích Sao Khen Thưởng (ClassDojo Style)
* Thưởng sao cho cá nhân hoặc cả lớp (Phát biểu tốt, Vở sạch chữ đẹp, Giúp bạn...).
* Hiệu ứng pháo hoa (**Confetti**) và âm thanh tạo động lực học tập.

### 6. 💰 Quản Lý Quỹ Lớp Minh Bạch
* Ghi nhận các khoản thu (Quỹ hội cha mẹ HS, đồng phục...) và khoản chi (Cơ sở vật chất, liên hoan...).
* Tự động tính số dư và xuất báo cáo công khai gửi Zalo phụ huynh.

### 7. 📑 Xuất Báo Cáo & Tương Thích VnEdu / SMAS
* **Xuất Excel Mẫu 1 (TT27)**: Bảng tổng hợp kết quả đánh giá giáo dục chuẩn mẫu Bộ GD&ĐT.
* **Xuất file nhập điểm VnEdu / SMAS**: Tương thích định dạng cột để import trực tiếp lên phần mềm trường.
* **In Phiếu kết quả học tập cá nhân**: Phiếu liên lạc điện tử đẹp mắt để gửi phụ huynh.

---

## 🛠️ Công Nghệ Sử Dụng

* **Framework**: Next.js 15 (App Router, React 19, TypeScript)
* **Styling**: Tailwind CSS, Lucide Icons, Sonner Toasts, Canvas-Confetti
* **Database**: Supabase (PostgreSQL) + Prisma ORM
* **Excel Engine**: SheetJS (XLSX)
* **AI Service**: Google Gemini API (`@google/genai`) + Built-in Rule-based Pedagogical Engine
* **Deployment**: Vercel Ready

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Cấu hình biến môi trường:
Tạo file `.env` từ `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://lgyoekaaefzpymfxfggf.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_onQMozx8AHJ4CiOK1esVBw_bO8M2Cu3"
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.lgyoekaaefzpymfxfggf.supabase.co:5432/postgres"
GEMINI_API_KEY=""
```

### 3. Chạy môi trường phát triển:
```bash
npm run dev
```
Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Hướng Dẫn Deploy Lên Vercel

1. Đẩy mã nguồn lên kho Git (GitHub / GitLab).
2. Truy cập [Vercel Dashboard](https://vercel.com) -> Chọn **Add New Project** -> Chọn Repository `gvcn`.
3. Trong phần **Environment Variables**, thêm:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `DATABASE_URL` (với mật khẩu Supabase của bạn)
   * `GEMINI_API_KEY` (tùy chọn)
4. Nhấn **Deploy**. Ứng dụng sẽ sẵn sàng phục vụ chỉ trong 1 phút!

---

## 📄 Bản Quyền & Giấy Phép
Dự án được xây dựng phục vụ ngành giáo dục tiểu học Việt Nam.
