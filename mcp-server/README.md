# GVCN Pro - Model Context Protocol (MCP) & ChatGPT Integration Guide

Tài liệu hướng dẫn kết nối **GVCN Pro** với các trợ lý AI hàng đầu: **Claude Desktop, OpenAI ChatGPT (Custom GPTs / Actions), Cursor, Windsurf, OpenCode**.

---

## ⚡ 1. Kết Nối Claude Desktop (Anthropic)

Mở tập tin cấu hình của Claude Desktop:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Thêm cấu hình `mcpServers` sau:

### Cách 1: Chạy trực tiếp qua Node.js (Khuyên dùng)
```json
{
  "mcpServers": {
    "gvcn-pro": {
      "command": "node",
      "args": ["/Users/chamnp/workspace/selfprod/gvcn/mcp-server/index.mjs"],
      "env": {
        "GVCN_API_KEY": "gvcn_pat_demo_teacher_2026_pro",
        "GVCN_API_URL": "https://www.gvcn.pro.vn/api/mcp"
      }
    }
  }
}
```

### Cách 2: Kết nối từ xa qua `mcp-remote`
```json
{
  "mcpServers": {
    "gvcn-pro": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://www.gvcn.pro.vn/api/mcp?key=gvcn_pat_demo_teacher_2026_pro"
      ]
    }
  }
}
```

Khởi động lại Claude Desktop. Bạn sẽ thấy biểu tượng chiếc búa (hammer icon) xuất hiện với 16 công cụ sư phạm của GVCN Pro!

---

## 💬 2. Kết Nối OpenAI ChatGPT (Custom GPT / Plugin Action)

Để tạo Custom GPT hoặc Custom Action trên **ChatGPT Plus / Team / Enterprise**:

1. Vào **ChatGPT** $\to$ **Explore GPTs** $\to$ **Create a GPT**.
2. Tại tab **Configure**:
   - **Name**: `Trợ Lý GVCN Pro - Lớp 4A1`
   - **Description**: `Trợ lý Giáo viên Chủ nhiệm Tiểu học chuẩn Thông tư 27 & Công văn 2345.`
3. Kéo xuống mục **Actions** $\to$ Bấm **Create new action**.
4. Tại mục **Schema**:
   - Bấm **Import from URL**.
   - Dán URL sau:
     ```
     https://www.gvcn.pro.vn/api/v1/openapi.json
     ```
   - ChatGPT sẽ tự động nạp toàn bộ danh sách 10 API endpoints sư phạm.
5. Tại mục **Authentication**:
   - Chọn **Authentication Type**: `API Key`
   - **Auth Type**: `Bearer`
   - **API Key**: `gvcn_pat_demo_teacher_2026_pro` (hoặc khóa PAT bạn tạo tại mục Cài đặt).
6. Tại mục **Instructions** của GPT, dán System Prompt mẫu:
   ```text
   Bạn là Trợ Lý Giáo Viên Chủ Nhiệm Tiểu Học GVCN Pro.
   Bạn có quyền truy cập trực tiếp vào hệ thống quản lý lớp học thông qua các Actions được cung cấp.
   Quy tắc nghiệp vụ:
   - Luôn tuân thủ Thông tư 27/2020/TT-BGDĐT: Đánh giá môn học theo 3 mức (T: Hoàn thành tốt, H: Hoàn thành, C: Chưa hoàn thành). Đánh giá phẩm chất & năng lực theo mức (T: Tốt, Đ: Đạt, C: Cần cố gắng).
   - Soạn giáo án theo đúng cấu trúc 4 hoạt động của Công văn 2345/BGDĐT-GDTH (Khởi động, Khám phá, Luyện tập, Vận dụng).
   - Giọng điệu chuẩn mực, ấm áp, động viên học sinh và sư phạm.
   ```
7. Bấm **Save / Publish**!

---

## ⚡ 3. Kết Nối Cursor / Windsurf

Trong dự án của bạn, tạo hoặc chỉnh sửa file `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gvcn-pro": {
      "command": "node",
      "args": ["/Users/chamnp/workspace/selfprod/gvcn/mcp-server/index.mjs"],
      "env": {
        "GVCN_API_KEY": "gvcn_pat_demo_teacher_2026_pro",
        "GVCN_API_URL": "https://www.gvcn.pro.vn/api/mcp"
      }
    }
  }
}
```

---

## 🛠 4. Danh Sách Các Công Cụ (Tools Catalog)

| Tên Công Cụ | Chức Năng Chính |
|---|---|
| `get_class_overview` | Lấy tổng quan sĩ số, nam/nữ, bán trú, khối lớp |
| `get_students` | Tra cứu danh sách học sinh, lọc theo tổ, bán trú |
| `get_student_detail` | Hồ sơ học bạ, điểm số, sao thi đua, liên hệ phụ huynh |
| `get_subject_assessments` | Bảng điểm đánh giá môn học Thông tư 27 |
| `update_subject_assessment` | Chấm điểm, xếp loại T/H/C và nhận xét môn học |
| `get_trait_assessments` | Đánh giá 5 phẩm chất & năng lực cốt lõi |
| `update_trait_assessment` | Xếp loại T/Đ/C phẩm chất học sinh |
| `get_attendance_today` | Tình hình điểm danh và suất ăn bán trú hôm nay |
| `mark_attendance` | Điểm danh học sinh (Có mặt / Vắng phép) |
| `get_star_leaderboard` | Bảng vàng thi đua khen thưởng sao nề nếp |
| `add_star_points` | Thưởng sao chăm ngoan, phát biểu tốt |
| `get_timetable` | Thời khóa biểu 2 buổi/ngày cả tuần |
| `generate_lesson_plan` | Soạn giáo án chuẩn Công văn 2345/BGDĐT |
| `generate_student_comment` | Sinh nhận xét học bạ Thông tư 27 cá nhân hóa |
| `generate_parent_meeting` | Tạo kịch bản họp phụ huynh & bài phát biểu cô giáo |
| `get_homeworks` / `create_homework` | Quản lý bài tập về nhà của lớp |
