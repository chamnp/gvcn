# Hướng Dẫn Phát Triển & Xuất Bản Plugin ChatGPT (OpenAI App Guidelines)

> **Tài liệu tham chiếu chính thức:** [OpenAI Plugin Guidelines](https://developers.openai.com/plugins/app-guidelines)  
> **Áp dụng cho:** Hệ sinh thái OpenAI ChatGPT, Codex Universal Directory và GVCN Pro Platform.

---

## 📑 MỤC LỤC
1. [Bản Chất Kiến Trúc Plugin Mới Của OpenAI](#1-bản-chất-kiến-trúc-plugin-mới-của-openai)
2. [Quy Chuẩn Thiết Kế Công Cụ (MCP Tools & Annotations)](#2-quy-chuẩn-thiết-kế-công-cụ-mcp-tools--annotations)
3. [Chính Sách Bảo Vệ Dữ Liệu & Quyền Riêng Tư (Privacy Rules)](#3-chính-sách-bảo-vệ-dữ-liệu--quyền-riêng-tư-privacy-rules)
4. [Quy Định Thương Mại & Giới Hạn Kiếm Tiền (Monetization Policies)](#4-quy-định-thương-mại--giới-hạn-kiếm-tiền-monetization-policies)
5. [Quy Trình Xác Minh Danh Tính & Nộp Duyệt (Submission Workflow)](#5-quy-trình-xác-minh-danh-tính--nộp-duyệt-submission-workflow)
6. [Giao Diện Tương Tác Trực Tiếp (`window.openai` UI Bridge)](#6-giao-diện-tương-tác-trực-tiếp-windowopenai-ui-bridge)
7. [Hiện Thực Hóa Cụ Thể Trên GVCN Pro](#7-hiện-thực-hóa-cụ-thể-trên-gvcn-pro)

---

## 1. Bản Chất Kiến Trúc Plugin Mới Của OpenAI

Trước đây (năm 2023), Plugin OpenAI sử dụng tệp `.well-known/ai-plugin.json` và OpenAPI thô. Hiện nay, OpenAI đã chuẩn hóa toàn bộ nền tảng theo mô hình:

### Mô hình 3 Trụ Cột:
1. **Agent Skills (`skills/`)**: Chứa tri thức nghiệp vụ, quy chuẩn sư phạm, quy trình nghiệp vụ chuyên sâu bằng Markdown (CV 2345, TT 27). Giúp LLM hiểu sâu về chuyên môn mà không cần hướng dẫn lặp lại.
2. **MCP Server (Model Context Protocol)**: Giao thức chuẩn công nghiệp (JSON-RPC 2.0 / SSE / Stream) cung cấp các Tools và Resources an toàn, có kiểm soát phân quyền (RBAC) và xác thực (Bearer PAT).
3. **Interactive UI (`window.openai`)**: Khung tương tác nhúng trực tiếp trong tin nhắn chat, hỗ trợ bảng biểu, nút bấm, chọn tệp, và phản hồi trực quan.

---

## 2. Quy Chuẩn Thiết Kế Công Cụ (MCP Tools & Annotations)

Đây là phần được đội ngũ kiểm duyệt của OpenAI (App Reviewers) soi xét kỹ lưỡng nhất:

### A. Tên và Mô tả công cụ
- **Tên công cụ (Name)**: Sử dụng động từ rõ ràng, viết thường nối dấu gạch dưới (snake_case).
  - ✅ Hợp lệ: `get_student_detail`, `mark_attendance`, `generate_lesson_plan`.
  - ❌ Bị từ chối: `best_tool`, `official_plugin_tool`, `super_search`.
- **Mô tả (Description)**: Mô tả khách quan, chính xác hành động thực tế. Không lôi kéo LLM ưu tiên công cụ này hơn công cụ của plugin khác.

### B. Bắt buộc khai báo Annotations
Mỗi công cụ MCP **phải có** khối thuộc tính `annotations`:

```json
{
  "name": "get_students",
  "description": "Lấy danh sách học sinh của lớp theo bộ lọc.",
  "inputSchema": { ... },
  "annotations": {
    "readOnlyHint": true,     // true nếu CHỈ ĐỌC, an toàn khi thử lại (idempotent)
    "openWorldHint": false,    // true nếu tương tác với mạng công cộng bên ngoài
    "destructiveHint": false  // true nếu XÓA hoặc làm mất dữ liệu vĩnh viễn
  }
}
```

#### Quy tắc phân loại:
| Thao tác | `readOnlyHint` | `openWorldHint` | `destructiveHint` |
|---|---|---|---|
| Tra cứu hồ sơ, danh sách, thời khóa biểu | `true` | `false` | `false` |
| Cập nhật điểm, điểm danh, thưởng sao | `false` | `false` | `false` |
| Xóa học sinh, đặt lại toàn bộ dữ liệu | `false` | `false` | `true` |
| Gửi email ra ngoài, thông báo Zalo | `false` | `true` | `false` |

---

## 3. Chính Sách Bảo Vệ Dữ Liệu & Quyền Riêng Tư (Privacy Rules)

### A. Giảm thiểu đầu vào (Input Minimization)
- Chỉ yêu cầu các trường tham số thực sự cần thiết.
- **Nghiêm cấm tuyệt đối**: Yêu cầu toàn bộ lịch sử đoạn chat của người dùng (raw chat transcripts) hoặc tạo các trường ngữ cảnh bao quát "dự phòng".
- Không đòi hỏi tọa độ GPS chính xác của người dùng.

### B. Giảm thiểu đầu ra (Response Minimization)
- Dữ liệu trả về cho mô hình ngôn ngữ phải được tinh gọn, phục vụ trực tiếp cho câu hỏi của người dùng.
- Lọc bỏ các thông tin chẩn đoán nội bộ: Trace IDs, Request IDs, Timestamps kỹ thuật, mã hóa lỗi hệ thống, mã băm mật khẩu hoặc API Key.

### C. Dữ liệu bị cấm thu thập (Restricted Data)
- Thông tin thẻ ngân hàng / thanh toán (PCI DSS).
- Hồ sơ y tế, bệnh án chuyên sâu (PHI).
- Số Căn cước công dân / Hộ chiếu / Mã định danh cá nhân trừ khi có giấy phép đặc biệt.
- Mật khẩu, OTP, Secret Key người dùng dạng bản rõ.

---

## 4. Quy Định Thương Mại & Giới Hạn Kiếm Tiền (Monetization Policies)

- **Chỉ cho phép hàng hóa vật lý (Physical goods)**: Hiện tại OpenAI chỉ cho phép giao dịch thương mại với sản phẩm vật lý (sách vở, đồng phục, thiết bị dạy học...).
- **Nghiêm cấm bán sản phẩm/dịch vụ số trong chat**:
  - Không bán gói nâng cấp tài khoản, gói hội viên (subscriptions), gói nạp credits/token trong khung chat.
  - Không nhúng luồng thanh toán trả phí ép buộc (paywall / upsell).
- **Trường hợp hợp lệ**: Cho phép người dùng đăng nhập bằng tài khoản đã có sẵn gói dịch vụ từ trước trên web chính.
- **Cơ chế thanh toán**: Chỉ sử dụng trang thanh toán bên ngoài (External Checkout) trên tên miền chính thức của nhà phát triển.

---

## 5. Quy Trình Xác Minh Danh Tính & Nộp Duyệt (Submission Workflow)

### Bước 1: Chuẩn bị quyền và xác minh trên OpenAI Platform
1. Đăng nhập [OpenAI Platform](https://platform.openai.com).
2. Vào **Settings > People & Roles**: gán quyền **Apps Management: Write** cho tài khoản nộp duyệt.
3. Vào **Settings > General**: Hoàn thành xác minh danh tính cá nhân (**Individual Verification**) hoặc doanh nghiệp (**Business Verification**).

### Bước 2: Xác minh Tên Miền (Domain Verification)
Đặt token xác minh của OpenAI cấp tại URL tĩnh:
```
https://gvcn-eta.vercel.app/.well-known/openai-apps-challenge
```
Nội dung phản hồi: Trả về chuỗi token dưới dạng `text/plain`.

### Bước 3: Chuẩn bị Bộ Test Cases (Bắt buộc khi nộp form)
OpenAI yêu cầu tối thiểu:
- **5 Positive Test Cases**: Các ca thử nghiệm thành công tiêu biểu với dữ liệu mẫu.
- **3 Negative Test Cases**: Các ca thử nghiệm khi người dùng nhập sai, thiếu quyền, hoặc yêu cầu ngoài phạm vi, kiểm tra khả năng bắt lỗi và phản hồi an toàn.

---

## 6. Giao Diện Tương Tác Trực Tiếp (`window.openai` UI Bridge)

Nếu plugin có giao diện tương tác nhúng trong ChatGPT:
- Tương tác thông qua đối tượng toàn cục `window.openai`:
  - `window.openai.toolInput`: Tham số đầu vào mà model đã gửi.
  - `window.openai.toolOutput`: Kết quả xử lý có cấu trúc.
  - `window.openai.setWidgetState(state)`: Lưu trạng thái của component UI qua các lượt chat.
  - `window.openai.callTool(name, args)`: Gọi công cụ MCP khác trực tiếp từ UI.
  - `window.openai.sendFollowUpMessage({ prompt })`: Gửi phản hồi tiếp tục vào cuộc hội thoại.
  - `window.openai.uploadFile(file)`: Tải tệp lên thư viện tệp của ChatGPT.

---

## 7. Hiện Thực Hóa Cụ Thể Trên GVCN Pro

| Hạng Mục | Trạng Thái GVCN Pro | Chi Tiết Kỹ Thuật |
|---|---|---|
| **MCP Server Endpoint** | ✅ Đã sẵn sàng | `https://gvcn-eta.vercel.app/api/mcp` (Hỗ trợ JSON-RPC 2.0 & REST) |
| **Tool Annotations** | ✅ Đạt chuẩn 100% | Toàn bộ 18 công cụ được gán đầy đủ `readOnlyHint`, `openWorldHint`, `destructiveHint` |
| **Domain Challenge Endpoint** | ✅ Đã sẵn sàng | `https://gvcn-eta.vercel.app/.well-known/openai-apps-challenge` |
| **Chính sách bảo mật** | ✅ Đạt chuẩn | `https://gvcn-eta.vercel.app/privacy` tuân thủ Điều khoản OpenAI & Google Limited Use |
| **Bảo mật dữ liệu** | ✅ Đạt chuẩn | Không lưu chat logs, không thu thập thẻ tín dụng, xác thực bằng PAT an toàn |
| **Thay thế myGPT tức thì** | ✅ Chrome Extension | Tiện ích mở rộng `gvcn-pro-extension.zip` tích hợp 1-click trực tiếp trên ChatGPT web |
