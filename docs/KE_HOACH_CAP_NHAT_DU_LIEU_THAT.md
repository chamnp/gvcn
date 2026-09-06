# Kế hoạch cập nhật: loại bỏ mock data và chuẩn hóa lưu trữ Supabase

## 1. Mục tiêu

Đảm bảo mọi chức năng nghiệp vụ của GVCN Pro sử dụng dữ liệu thật, có phạm vi theo giáo viên/lớp, ghi thành công vào Supabase trước khi giao diện báo thành công và không âm thầm quay về dữ liệu mẫu khi truy vấn lỗi hoặc trả về rỗng.

Kế hoạch này bao phủ bốn nhóm vấn đề đã phát hiện:

1. API/MCP và Chrome Extension từng có đường chạy dùng dữ liệu giả hoặc cơ chế xác thực demo.
2. Một số màn hình lưu dữ liệu nghiệp vụ trong `localStorage` thay vì database.
3. Nhiều lệnh ghi Supabase không kiểm tra trường `error`, dễ làm giao diện báo thành công dù database không thay đổi.
4. Một số bộ sinh nội dung theo mẫu cố định được gắn nhãn “AI”, gây hiểu nhầm về nguồn dữ liệu và khả năng xử lý.

## 2. Nguyên tắc triển khai

- Supabase là nguồn dữ liệu chuẩn duy nhất cho dữ liệu nghiệp vụ.
- `localStorage` chỉ được dùng cho tùy chọn giao diện, token phiên, cache có thể tái tạo hoặc trạng thái chưa cần đồng bộ nhiều thiết bị.
- Không tự động nạp dữ liệu mẫu khi database rỗng hoặc truy vấn lỗi.
- Dữ liệu demo chỉ được tạo sau thao tác chủ động của người dùng và phải được ghi thật vào database.
- Mọi lệnh `insert`, `upsert`, `update`, `delete` phải kiểm tra lỗi trước khi cập nhật trạng thái thành công trên giao diện.
- Mọi API phải xác thực, xác định đúng hồ sơ giáo viên và giới hạn dữ liệu theo lớp được phân công.
- Bộ sinh nội dung cố định phải ghi rõ là “mẫu sư phạm”; chỉ dùng nhãn “AI” khi thật sự gọi mô hình và có xử lý lỗi/fallback minh bạch.
- Không thay đổi các thang đánh giá theo Thông tư 27: môn học `T/H/C`, phẩm chất và năng lực `T/Đ/C`.

## 3. Phạm vi thay đổi chi tiết

### P0 — Xác thực và cô lập dữ liệu API/MCP

| Hạng mục | File chính | Công việc | Tiêu chí nghiệm thu | Trạng thái |
|---|---|---|---|---|
| Loại bỏ PAT demo/bypass | `src/lib/mcp-auth.ts` | Không chấp nhận token thiếu, token mẫu, token hết hạn hoặc token không tồn tại trong `ApiKey`; dùng bộ sinh token mật mã an toàn | Request thiếu/sai token nhận `401`; không còn tài khoản quản trị fallback | Đã triển khai, cần kiểm thử hồi quy |
| Ánh xạ danh tính thật | `src/lib/mcp-auth.ts` | Sau khi xác thực, đọc hồ sơ `Teacher` và lớp thật thay vì dựng teacher/class tĩnh | Context trả về đúng email, vai trò và `classId` hiện hành | Đã triển khai, cần kiểm thử dữ liệu production |
| MCP dùng dữ liệu thật | `src/lib/mcp-executor.ts` | Thay toàn bộ danh sách học sinh, điểm danh, sao, đánh giá, bài tập, thời khóa biểu và tổng quan giả bằng truy vấn Supabase | Kết quả thay đổi theo dữ liệu của lớp; không còn mảng trả về cố định | Đã triển khai, cần kiểm thử từng tool |
| Ghi đánh giá qua MCP | `src/lib/mcp-executor.ts` | `update_trait_assessment` phải `upsert` vào bảng tương ứng và trả lỗi khi Supabase lỗi | Đọc lại record sau khi ghi cho kết quả trùng khớp | Đã triển khai, cần kiểm thử tích hợp |
| Bảo vệ Extension Sync API | `src/app/api/extension/sync/route.ts` | Bắt buộc auth cho `GET/POST`, giới hạn theo lớp, lấy học sinh/điểm danh/sao/thời khóa biểu thật | Không token nhận `401`; giáo viên không đọc/ghi được lớp khác | Đã triển khai, cần kiểm thử CORS và extension |
| Đồng bộ schema công khai | `public/openapi.json`, `src/app/api/mcp/openapi.json/route.ts`, `src/app/api/v1/openapi.json/route.ts`, `plugin/plugin.json`, `mcp-server/index.mjs` | Mô tả đúng Bearer auth, endpoint production và hành vi dữ liệu thật | OpenAPI parse hợp lệ; client không còn dùng khóa demo | Đang hoàn thiện trong worktree |

### P0 — Tính toàn vẹn khi ghi database

| Hạng mục | File chính | Công việc | Tiêu chí nghiệm thu | Trạng thái |
|---|---|---|---|---|
| CRUD giáo viên | `src/lib/auth-context.tsx` | Kiểm tra `{ error }` của Supabase trước khi cập nhật state/toast; rollback hoặc giữ state cũ nếu lỗi | Mô phỏng lỗi RLS/network không xuất hiện thông báo thành công giả | Đang hoàn thiện trong worktree |
| CRUD dữ liệu lớp | `src/lib/store.tsx` | Chuẩn hóa helper ghi dữ liệu; loại các lời gọi `.then()` bỏ qua kết quả; bổ sung rollback cho thao tác optimistic | Không còn mutation nghiệp vụ nào bỏ qua lỗi Supabase | Chưa hoàn tất toàn bộ |
| Import hàng loạt | `src/lib/store.tsx`, các trang import | Thu thập lỗi theo bảng, chỉ báo thành công sau khi tất cả batch cần thiết hoàn tất; hiển thị phần thất bại | Import lỗi một bảng phải báo rõ bảng/bản ghi lỗi | Cần triển khai |
| Quiz submission | `src/lib/store.tsx` | Upsert theo cặp `homeworkId + studentId`, kiểm tra lỗi và rollback | Một học sinh chỉ có một bài nộp hiện hành cho mỗi bài tập | Đã triển khai, chờ migration |

### P1 — Chuyển dữ liệu nghiệp vụ khỏi localStorage

| Chức năng | Nguồn cũ | Nguồn mới | File liên quan | Trạng thái |
|---|---|---|---|---|
| Giáo án | `localStorage`/mẫu khởi tạo | Bảng `LessonPlan` | `src/app/lesson-plans/page.tsx` | Đã triển khai, chờ migration và kiểm thử |
| Ngân hàng câu hỏi ma trận | `localStorage` + dữ liệu mẫu | Bảng `MatrixQuestion` | `src/app/matrix-exam/page.tsx` | Đã triển khai, cần kiểm thử import/xóa |
| Bộ câu hỏi thi đua nhóm | `localStorage` | Bảng `ClassroomToolConfig`, tool `TEAM_QUIZ` | `src/components/classroom/team-quiz-battle-modal.tsx`, `src/lib/classroom-tool-config.ts` | Đang hoàn thiện trong worktree |
| Cấu hình Chiếc rương bí ẩn | `localStorage` | Bảng `ClassroomToolConfig`, tool `MYSTERY_CHEST` | `src/components/classroom/mystery-chest-modal.tsx`, `src/lib/classroom-tool-config.ts` | Đang hoàn thiện trong worktree |
| Google Drive picker | Danh sách file giả khi thiếu token/API lỗi | API Google Drive thật; trạng thái rỗng/lỗi minh bạch | `src/lib/google-drive-client.ts` | Đã khôi phục client thật, cần kiểm thử OAuth |
| Store nghiệp vụ toàn cục | Giá trị `INITIAL_*` và cache cục bộ | Trạng thái rỗng cho đến khi Supabase trả dữ liệu | `src/lib/store.tsx` | Đã triển khai phần khởi tạo/tải dữ liệu; còn mutation cũ cần chuẩn hóa |

Các dữ liệu được phép tiếp tục lưu cục bộ:

- token OAuth Google và thời điểm hết hạn;
- lớp/ học kỳ đang chọn trên giao diện;
- cấu hình giờ bắt đầu và thời lượng tiết học dùng cho hiển thị;
- cache thông báo đã đọc, với Supabase là bản đồng bộ chính nếu tính năng hỗ trợ;
- bản nháp chưa bấm lưu, nếu giao diện ghi rõ đây là bản nháp trên thiết bị.

### P1 — Migration Supabase

Migration hiện có: `supabase/migrations/20260906110000_persist_lesson_plans_and_classroom_tools.sql`.

Nội dung:

- tạo bảng `LessonPlan`;
- tạo bảng `ClassroomToolConfig`;
- tạo unique index cho `QuizSubmission(homeworkId, studentId)`;
- bật RLS và cấp quyền CRUD cho role phù hợp.

Việc cần hoàn tất trước khi coi là production-ready:

1. Áp migration lên project Supabase `lgyoekaaefzpymfxfggf`.
2. Kiểm tra dữ liệu trùng trong `QuizSubmission` trước khi tạo unique index.
3. Siết policy `LessonPlan` theo lớp/giáo viên thay vì chỉ dựa trên role `authenticated`.
4. Kiểm tra policy `ClassroomToolConfig` bằng email trong JWT và trường `ownerEmail`.
5. Xác nhận Realtime publication nếu UI cần cập nhật đa thiết bị tức thời.

Các truy vấn xác minh tối thiểu sau migration:

```sql
select to_regclass('public."LessonPlan"') as lesson_plan_table;
select to_regclass('public."ClassroomToolConfig"') as classroom_tool_config_table;

select "homeworkId", "studentId", count(*)
from public."QuizSubmission"
group by "homeworkId", "studentId"
having count(*) > 1;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where tablename in ('LessonPlan', 'ClassroomToolConfig')
order by tablename, policyname;
```

### P1 — Gắn nhãn đúng cho chức năng sinh nội dung

| Khu vực | Hành vi hiện tại | Cập nhật cần làm | Trạng thái |
|---|---|---|---|
| Soạn giáo án | Hàm sinh cấu trúc 4 pha theo mẫu cố định nhưng một số vị trí còn ghi “AI” | Đổi nhãn thành “Trình tạo giáo án theo mẫu” hoặc tích hợp API AI thật | Cần hoàn tất nhãn giao diện |
| IEP | Sinh gợi ý từ template/quy tắc | Đổi thành “Gợi ý sư phạm theo mẫu”; chỉ ghi AI khi có request tới provider | Cần triển khai |
| Quiz thi đua | Sinh câu hỏi từ danh sách cục bộ | Dùng nhãn “Tạo câu hỏi mẫu” | Đang hoàn thiện |
| Nhận xét học sinh qua MCP | Tổng hợp từ dữ liệu thật và bộ quy tắc | Trả thêm trường `generationMode` để client biết nguồn tạo | Đã triển khai, cần kiểm thử contract |

## 4. Thứ tự thực hiện

### Giai đoạn 1 — Chặn rủi ro bảo mật và dữ liệu giả

1. Khóa toàn bộ đường xác thực demo và admin fallback.
2. Bắt buộc Bearer token trên MCP/Extension API.
3. Áp phạm vi giáo viên/lớp cho mọi truy vấn.
4. Thay payload giả bằng truy vấn Supabase và trả lỗi minh bạch.

Điều kiện qua giai đoạn: test thiếu token, token sai, lớp khác và truy vấn database lỗi đều cho kết quả đúng, không rò dữ liệu.

### Giai đoạn 2 — Hoàn tất persistence

1. Áp migration.
2. Chuyển giáo án và cấu hình công cụ lớp học sang bảng mới.
3. Bỏ fallback tự động sang `INITIAL_*`, `SAMPLE_*` hoặc cache cũ.
4. Giữ “Nạp dữ liệu demo” như thao tác riêng, có xác nhận và ghi database.

Điều kiện qua giai đoạn: tạo dữ liệu ở trình duyệt A, đăng nhập trình duyệt B và nhìn thấy cùng dữ liệu sau khi đồng bộ.

### Giai đoạn 3 — Chuẩn hóa toàn bộ mutation

1. Liệt kê tất cả `insert/upsert/update/delete` trong `src/lib/store.tsx` và `src/lib/auth-context.tsx`.
2. Mỗi mutation phải có xử lý thành công, lỗi, rollback và log có ngữ cảnh.
3. Không cập nhật toast thành công trước response thành công.
4. Với thao tác nhiều bảng, xác định rõ atomicity hoặc thông báo partial failure.

Điều kiện qua giai đoạn: tìm kiếm tĩnh không còn `.then()` rỗng trên mutation Supabase và test lỗi mạng không làm mất dữ liệu UI âm thầm.

### Giai đoạn 4 — Minh bạch nguồn sinh nội dung

1. Kiểm kê toàn bộ chuỗi “AI”, “Gemini”, “tự động sinh”.
2. Đối chiếu từng nút với call graph thực tế.
3. Đổi nhãn các hàm template; bổ sung trạng thái provider/model cho AI thật.
4. Không để API key mặc định trong source hoặc bundle trình duyệt.

Điều kiện qua giai đoạn: mọi nhãn AI đều dẫn tới request model thật hoặc được ghi rõ là chế độ template/fallback.

### Giai đoạn 5 — Kiểm thử, phát hành và giám sát

1. Chạy type-check/lint nếu có script.
2. Chạy `npm run build` và yêu cầu 0 lỗi.
3. Smoke test các luồng: login, đổi lớp, học sinh, điểm danh, đánh giá, sao, bài tập, giáo án, ma trận đề, công cụ lớp học, Extension và MCP.
4. Kiểm tra dữ liệu trực tiếp trong Supabase sau mỗi thao tác ghi.
5. Commit, push `main` và theo dõi Vercel bằng script `.agents/skills/gvcn-workflow/scripts/check-deploy.js` đến `State: READY`.
6. Kiểm tra log production cho lỗi RLS, `401/403`, schema cache và constraint.

## 5. Ma trận kiểm thử nghiệm thu

| Kịch bản | Kết quả mong đợi |
|---|---|
| Database trả mảng rỗng | UI hiển thị empty state, không nạp dữ liệu mẫu |
| Database trả lỗi | UI báo lỗi, giữ dữ liệu cũ hợp lệ hoặc rollback, không báo thành công |
| Refresh/trình duyệt khác | Dữ liệu nghiệp vụ đã lưu vẫn tồn tại |
| Giáo viên A gọi dữ liệu lớp B | Bị từ chối hoặc trả tập rỗng theo policy |
| MCP không có Bearer token | HTTP/JSON-RPC trả lỗi xác thực |
| PAT hết hạn hoặc bị revoke | Không thể truy cập dữ liệu |
| Tạo rồi sửa/xóa giáo án | Bảng `LessonPlan` phản ánh đúng từng thao tác |
| Lưu bộ câu hỏi công cụ lớp | Bảng `ClassroomToolConfig` lưu đúng `ownerEmail + classId + tool` |
| Nộp lại cùng một bài quiz | Record cũ được cập nhật, không phát sinh bản trùng |
| OAuth Drive thiếu/hết hạn | Hiển thị yêu cầu đăng nhập lại, không trả file giả |
| Chức năng template | UI ghi rõ “theo mẫu”, response có `generationMode` nếu qua API |

## 6. Definition of Done

Chỉ đánh dấu hoàn tất khi đáp ứng đồng thời các điều kiện sau:

- [ ] Không còn bypass xác thực, token mẫu hoặc admin fallback trong runtime production.
- [ ] Không còn dữ liệu mẫu được tự động dùng thay cho lỗi/rỗng từ Supabase.
- [ ] Tất cả dữ liệu nghiệp vụ trong phạm vi kế hoạch có bảng lưu trữ và policy phù hợp.
- [ ] Tất cả mutation quan trọng kiểm tra lỗi và không báo thành công giả.
- [ ] Migration đã áp dụng và truy vấn xác minh trả kết quả đúng.
- [ ] Nhãn AI/template phản ánh đúng cách nội dung được tạo.
- [ ] `npm run build` hoàn tất với 0 lỗi.
- [ ] Smoke test API/MCP/Extension và các màn hình chính đạt yêu cầu.
- [ ] Commit đã push lên `origin/main`.
- [ ] Vercel deployment có `State: READY` và production smoke test đạt yêu cầu.

## 7. Kế hoạch rollback

- Không xóa ngay dữ liệu cũ trong `localStorage`; chỉ ngừng đọc làm nguồn chuẩn trong bản phát hành đầu tiên.
- Migration mới chỉ thêm bảng/index, không thay đổi cấu trúc bảng hiện hữu ngoài unique index.
- Nếu lỗi production, rollback ứng dụng về commit trước migration; giữ nguyên hai bảng mới để tránh mất dữ liệu đã ghi.
- Chỉ xóa bảng mới sau khi đã export/đối chiếu dữ liệu và có phê duyệt riêng.
- Với unique index, nếu phát hiện dữ liệu lịch sử trùng, dừng migration, hợp nhất record theo `updatedAt` mới nhất rồi mới chạy lại.

## 8. Nhật ký triển khai

| Mốc | Commit/thay đổi | Ghi chú |
|---|---|---|
| 06/09/2026 | `f872287` | Cập nhật thời khóa biểu và xác thực MCP theo danh tính thật |
| 06/09/2026 | `d4acf67` | Chuyển giáo án/công cụ lớp sang Supabase, làm sạch trạng thái mock ban đầu, thêm migration |
| 06/09/2026 | `b9d16d9` | Khôi phục Google Drive client để sửa lỗi build |
| 06/09/2026 | Worktree hiện tại | Đồng bộ Extension/plugin/OpenAPI, chuẩn hóa cấu hình công cụ lớp và xử lý lỗi CRUD giáo viên |

Tài liệu này là checklist sống: cập nhật cột “Trạng thái” và Definition of Done sau mỗi vòng build, migration, smoke test và deploy.
