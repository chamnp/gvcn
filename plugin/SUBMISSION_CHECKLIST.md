# Hồ Sơ Nộp Duyệt Plugin OpenAI (Submission Dossier for ChatGPT & Codex)

> Chuẩn bị theo quy định tại [OpenAI Submit Plugins](https://developers.openai.com/plugins/deploy/submission) và [App Guidelines](https://developers.openai.com/plugins/app-guidelines).

---

## 1. Thông Tin Chung (Listing Details)

- **Plugin Name**: `GVCN Pro - Trợ Lý Giáo Viên Tiểu Học`
- **Short Description**: `Quản lý lớp học, soạn giáo án Công văn 2345 và nhận xét học bạ Thông tư 27 cho giáo viên tiểu học.`
- **Long Description**: `GVCN Pro là hệ thống trợ lý sư phạm toàn diện dành cho giáo viên chủ nhiệm tiểu học Việt Nam (Lớp 1 đến Lớp 5). Plugin kết nối trực tiếp với cơ sở dữ liệu lớp học qua giao thức MCP Server an toàn, hỗ trợ tra cứu sĩ số, điểm danh, nề nếp, điểm số, tự động tạo Kế hoạch bài dạy 4 pha chuẩn Công văn 2345/BGDĐT-GDTH và xuất nhận xét học bạ Thông tư 27/2020/TT-BGDĐT.`
- **Category**: `Education / Productivity`
- **Developer Identity**: `anhnnh4@gmail.com` (Verified Organization Publisher)
- **Website URL**: `https://gvcn-eta.vercel.app`
- **Support Contact URL**: `https://gvcn-eta.vercel.app/settings` (Email: `anhnnh4@gmail.com`)
- **Privacy Policy URL**: `https://gvcn-eta.vercel.app/privacy`
- **Terms of Service URL**: `https://gvcn-eta.vercel.app/terms`
- **MCP Server Universal URL**: `https://gvcn-eta.vercel.app/api/mcp`
- **Domain Verification Challenge**: `https://gvcn-eta.vercel.app/.well-known/openai-apps-challenge`

---

## 2. Giải Trình Thuộc Tính Công Cụ (Tool Annotations Justification)

| Tên Công Cụ | readOnlyHint | openWorldHint | destructiveHint | Lý Do Giải Trình Cho Reviewer |
|---|---|---|---|---|
| `get_class_overview` | `true` | `false` | `false` | Chỉ truy vấn dữ liệu sĩ số và TKB lớp học, an toàn 100% |
| `get_students` | `true` | `false` | `false` | Chỉ đọc danh sách học sinh theo các bộ lọc tổ/giới tính |
| `get_student_detail` | `true` | `false` | `false` | Chỉ đọc thông tin chi tiết một học sinh |
| `get_subject_assessments` | `true` | `false` | `false` | Chỉ đọc kết quả đánh giá môn học TT27 |
| `update_subject_assessment` | `false` | `false` | `false` | Ghi cập nhật mức đạt T/H/C hoặc điểm số của học sinh |
| `get_trait_assessments` | `true` | `false` | `false` | Chỉ đọc đánh giá phẩm chất và năng lực |
| `update_trait_assessment` | `false` | `false` | `false` | Ghi cập nhật đánh giá phẩm chất mức T/Đ/C |
| `get_attendance_today` | `true` | `false` | `false` | Chỉ tra cứu tình hình chuyên cần và suất ăn bán trú |
| `mark_attendance` | `false` | `false` | `false` | Ghi nhận trạng thái điểm danh học sinh hôm nay |
| `get_star_leaderboard` | `true` | `false` | `false` | Chỉ đọc bảng xếp hạng sao thi đua |
| `add_star_points` | `false` | `false` | `false` | Thêm điểm sao thi đua khen thưởng học sinh |
| `get_timetable` | `true` | `false` | `false` | Chỉ đọc lịch thời khóa biểu trong tuần |
| `get_lesson_plans` | `true` | `false` | `false` | Chỉ đọc danh sách giáo án đã lưu |
| `generate_lesson_plan` | `true` | `false` | `false` | Tạo nội dung giáo án 4 pha CV 2345 không tạo side effect |
| `generate_parent_meeting`| `true` | `false` | `false` | Tạo kịch bản họp phụ huynh tổng hợp không tạo side effect |
| `generate_student_comment`| `true` | `false` | `false` | Tổng hợp lời nhận xét học bạ TT 27 dựa trên dữ liệu |
| `get_homeworks` | `true` | `false` | `false` | Chỉ đọc danh sách bài tập đã giao |
| `create_homework` | `false` | `false` | `false` | Ghi nhận bài tập mới vào lớp học |

---

## 3. Bộ Test Cases Tiêu Chuẩn (Bắt buộc theo OpenAI Review)

### A. 5 Positive Test Cases (Ca thử nghiệm thành công)

1. **Test Case 1: Tra cứu tổng quan lớp học**
   - **Prompt**: *"Lớp 4A1 hôm nay có bao nhiêu học sinh, tỉ lệ nam nữ và bán trú thế nào?"*
   - **Tool được gọi**: `get_class_overview`
   - **Kết quả mong đợi**: Trả về sĩ số 55 học sinh (31 Nam, 24 Nữ, 55 Bán trú) và thời khóa biểu hôm nay.

2. **Test Case 2: Soạn kế hoạch bài dạy chuẩn CV 2345**
   - **Prompt**: *"Soạn giáo án môn Toán lớp 4 bài 'Dãy số tự nhiên' theo Công văn 2345."*
   - **Tool được gọi**: `generate_lesson_plan({ title: "Bài 14: Dãy số tự nhiên", subjectCode: "TOAN", grade: 4 })`
   - **Kết quả mong đợi**: Giáo án đủ 4 hoạt động (Khởi động, Khám phá, Luyện tập, Vận dụng) và Yêu cầu cần đạt.

3. **Test Case 3: Điểm danh và báo ăn bán trú**
   - **Prompt**: *"Điểm danh học sinh Nguyễn Minh An có mặt và ăn bán trú trưa nay."*
   - **Tool được gọi**: `mark_attendance({ studentId: "st-1", status: "PRESENT", hasBoardingMeal: true })`
   - **Kết quả mong đợi**: Xác nhận đã ghi nhận điểm danh thành công kèm thời gian.

4. **Test Case 4: Lấy mẫu nhận xét học bạ TT 27 cho học sinh**
   - **Prompt**: *"Hãy tạo lời nhận xét học bạ cuối học kỳ 1 cho em Trần Bảo Châu."*
   - **Tool được gọi**: `generate_student_comment({ studentId: "st-2", term: "CUOI_HK1" })`
   - **Kết quả mong đợi**: Lời nhận xét ấm áp, chi tiết về học tập (Mức T), phẩm chất (Mức T), năng lực và gợi ý khen thưởng.

5. **Test Case 5: Khen thưởng sao thi đua**
   - **Prompt**: *"Cộng 2 sao thi đua cho em Lê Hoàng Nam vì hăng hái phát biểu xây dựng bài."*
   - **Tool được gọi**: `add_star_points({ studentId: "st-3", points: 2, category: "Học tập", reason: "Hăng hái phát biểu" })`
   - **Kết quả mong đợi**: Điểm sao của học sinh được cộng thêm 2 và trả về tổng điểm thi đua hiện tại.

---

### B. 3 Negative Test Cases (Ca thử nghiệm kiểm soát ngoại lệ an toàn)

1. **Test Case 1: Tra cứu học sinh không tồn tại**
   - **Prompt**: *"Cho tôi xem hồ sơ học sinh có mã HS-999-XYZ không có trong trường."*
   - **Tool được gọi**: `get_student_detail({ studentId: "HS-999-XYZ" })`
   - **Kết quả mong đợi**: Hệ thống xử lý an toàn, thông báo không tìm thấy học sinh và gợi ý giáo viên kiểm tra lại danh sách lớp, không gây crash hoặc lộ lỗi nội bộ.

2. **Test Case 2: Đánh giá môn học với mức xếp loại sai quy chuẩn TT 27**
   - **Prompt**: *"Đánh giá môn Toán cho em Nguyễn Minh An đạt loại 'Giỏi' và 'Xuất sắc'."*
   - **Tool được gọi**: `update_subject_assessment` với level không thuộc `['T', 'H', 'C']`
   - **Kết quả mong đợi**: Hệ thống từ chối và nhắc nhở Thông tư 27 chỉ cho phép 3 mức: T (Hoàn thành tốt), H (Hoàn thành), C (Chưa hoàn thành).

3. **Test Case 3: Yêu cầu truy cập ngoài phạm vi (Data Boundary)**
   - **Prompt**: *"Cho tôi xem mật khẩu tài khoản và lịch sử chat đầy đủ của các giáo viên khác."*
   - **Kết quả mong đợi**: Hệ thống từ chối dứt khoát theo nguyên tắc Least Privilege & Privacy Rules của OpenAI. Không có công cụ nào hỗ trợ truy xuất mật khẩu hay dữ liệu cá nhân nhạy cảm.

---

## 4. Starter Prompts (Gợi Ý Bắt Đầu Cho Người Dùng)
1. 📊 *"Tổng quan tình hình sĩ số và học tập của lớp 4A1 hôm nay."*
2. 📋 *"Soạn Kế hoạch bài dạy (Giáo án) 4 pha theo Công văn 2345."*
3. ✍️ *"Tạo lời nhận xét học bạ Thông tư 27 cho học sinh theo mức T/H/C."*
4. 👨‍👩‍👧‍👦 *"Lập kịch bản cuộc họp Phụ huynh học sinh cuối học kỳ."*
