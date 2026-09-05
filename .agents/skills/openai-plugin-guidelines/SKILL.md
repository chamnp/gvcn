---
name: openai-plugin-guidelines
description: "Quy chuẩn phát triển và xuất bản Plugin cho ChatGPT & Codex theo chuẩn mới nhất của OpenAI (MCP Server + Skills + window.openai UI, Tool Annotations, Privacy & Safety Guidelines)"
---

# OpenAI Plugin Guidelines (ChatGPT & Codex Universal Directory)

Bộ quy chuẩn chính thức dựa trên tài liệu phát triển mới nhất của OpenAI: [OpenAI App Guidelines](https://developers.openai.com/plugins/app-guidelines).

---

## 1. Kiến Trúc Plugin Chuẩn Mới (Modern Plugin Architecture)

OpenAI đã chuyển đổi toàn bộ mô hình Plugin truyền thống (2023) sang kiến trúc **Model Context Protocol (MCP)** và **Agent Skills**:

| Loại Plugin | Thành Phần | Mục Đích |
|---|---|---|
| **Skills Only** | Thư mục `skills/` (chứa `SKILL.md`, references, templates) | Đóng gói quy trình, tri thức nghiệp vụ chuyên sâu |
| **MCP Only** | MCP Server (JSON-RPC 2.0 / SSE / Stream) | Cung cấp Tools, Resources để model tương tác với hệ thống |
| **Full Plugin (Khuyên Dùng)** | Gồm cả **Skill** + **MCP Server** (+ UI tương tác tuỳ chọn) | Giải pháp toàn diện kết hợp giữa tri thức chuẩn và công cụ dữ liệu thực tế |

---

## 2. Tiêu Chuẩn Đặt Tên & Đặc Tả Công Cụ (MCP Tools Specification)

### A. Tên công cụ (Tool Name)
- Phải là duy nhất trong phạm vi server.
- Sử dụng dạng động từ mô tả hành động trực quan (VD: `get_student_detail`, `mark_attendance`, `generate_lesson_plan`).
- **Nghiêm cấm**: Các từ ngữ so sánh, quảng cáo quá đà (như `best_tool`, `pick_me`, `official_gvcn`).

### B. Mô tả công cụ (Tool Description)
- Mô tả chính xác, khách quan chức năng thực tế của công cụ.
- Không được thêm các câu lệnh thiên vị, ép buộc model chọn công cụ này thay vì công cụ khác.
- Không khai báo phạm vi kích hoạt quá rộng vượt ngoài mục đích thực tế.

### C. Bắt Buộc Khai Báo Annotations (`annotations`)
Khi OpenAI quét công cụ (**Scan Tools**), mỗi công cụ **BẮT BUỘC** phải có đủ 3 thuộc tính annotations sau:

```json
"annotations": {
  "readOnlyHint": true,     // true: chỉ đọc dữ liệu, không thay đổi trạng thái hệ thống bên ngoài
  "openWorldHint": false,    // true: gửi dữ liệu ra môi trường công cộng bên ngoài (mạng xã hội, email công khai)
  "destructiveHint": false  // true: xóa hoặc thay đổi trạng thái vĩnh viễn không thể khôi phục
}
```

*Lưu ý: Thiếu hoặc khai báo sai annotations là nguyên nhân phổ biến nhất khiến Plugin bị từ chối duyệt (Review Rejection).*

---

## 3. Chính Sách Dữ Liệu & Quyền Riêng Tư (Privacy & Least Privilege)

1. **Thu Thập Tối Thiểu (Input Minimization)**:
   - Chỉ yêu cầu các tham số tối thiểu cần thiết để thực thi tác vụ.
   - **Nghiêm cấm**: Đòi hỏi toàn bộ lịch sử trò chuyện (chat transcripts) hoặc các trường thông tin chung chung "dự phòng".
   - Không đòi hỏi tọa độ GPS chính xác; chỉ dùng vị trí ước lượng từ hệ thống nếu thực sự cần.
2. **Phản Hồi Tối Thiểu (Response Minimization)**:
   - Dữ liệu trả về cho Model phải được tinh gọn, chỉ chứa nội dung giải quyết câu hỏi của người dùng.
   - **Bắt buộc lọc bỏ**: ID nội bộ không cần thiết, Trace ID, Request ID, Timestamp gỡ lỗi hoặc token bí mật.
3. **Dữ Liệu Bị Cấm Tuyệt Đối (Restricted Data)**:
   - Dữ liệu thẻ tín dụng (PCI DSS).
   - Hồ sơ bệnh án, sức khỏe được bảo vệ (PHI).
   - Số định danh cá nhân / Số CCCD / CMND.
   - Thông tin xác thực thô (mật khẩu, OTP, API key người dùng).

---

## 4. Quy Định Thương Mại & Kiếm Tiền (Monetization Policies)

- Hiện tại, OpenAI **chỉ cho phép bán hàng hoá vật lý (Physical goods)** qua Plugin.
- **Nghiêm cấm**: Bán sản phẩm/dịch vụ số, gói đăng ký (subscriptions), token, credits hoặc các luồng upsell trả phí dạng freemium ngay trong giao diện chat.
- Người dùng có thể đăng nhập tài khoản đã có sẵn gói dịch vụ để dùng tính năng.
- **Thanh toán**: Chỉ chuyển hướng ra trang checkout ngoài (External Checkout) trên tên miền đã xác minh.

---

## 5. Xác Minh Tên Miền & Xuất Bản (Domain Verification & Submission)

### A. Xác minh Tên Miền (Domain Challenge)
Đặt token xác minh tại đường dẫn chuẩn:
```text
GET /.well-known/openai-apps-challenge
Content-Type: text/plain
Response: <VERIFICATION_TOKEN>
```

### B. Hồ Sơ Nộp Duyệt (Submission Checklist)
1. **Tài khoản OpenAI**: Quyền tổ chức với quyền **Apps Management: Write**.
2. **Xác minh danh tính**: Hoàn thành Individual Verification hoặc Business Verification trong Settings tổ chức.
3. **Bộ Test Cases**:
   - **5 Test Cases Dương Tính (Positive)**: Các câu lệnh phổ biến, đầu vào chuẩn, kết quả mong đợi.
   - **3 Test Cases Phủ Định (Negative)**: Xử lý ngoại lệ an toàn, từ chối câu lệnh không hợp lệ hoặc dữ liệu không tồn tại.
4. **Chính sách pháp lý**: URL Điều khoản dịch vụ (`/terms`) và Chính sách quyền riêng tư (`/privacy`) hợp lệ.

---

## 6. Giao Diện Tương Tác Tuỳ Chọn (`window.openai` UI Bridge)

Khi tích hợp giao diện tương tác (MCP Apps UI) hiển thị trong khung chat ChatGPT:
- Sử dụng các API chuẩn trong `window.openai`:
  - `window.openai.toolInput`: Dữ liệu đầu vào của công cụ.
  - `window.openai.toolOutput`: Dữ liệu đầu ra có cấu trúc.
  - `window.openai.setWidgetState(state)`: Lưu snapshot trạng thái giao diện.
  - `window.openai.callTool(name, args)`: Gọi công cụ MCP tiếp theo từ UI.
  - `window.openai.sendFollowUpMessage({ prompt })`: Gửi tin nhắn tiếp nối vào hội thoại.
  - `window.openai.requestDisplayMode({ mode: 'fullscreen' | 'pip' })`: Chuyển chế độ hiển thị.
- Tránh dùng iframe bên ngoài nếu không thực sự cần thiết (việc dùng `frameDomains` phải qua xét duyệt thủ công đặc biệt).
