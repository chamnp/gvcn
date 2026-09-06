# Review Production Readiness — Nề nếp & Tích sao

## 1. Thông tin tài liệu

| Thuộc tính | Giá trị |
| --- | --- |
| Tính năng | Sổ Nề nếp, tích sao thi đua, bảng xếp hạng và đổi quà |
| Ngày review | 06/09/2026 |
| Baseline mã nguồn | `b17c10a5f0b5749a0b51346a8ef7f7f3e990bf80` (`main`) |
| Môi trường kiểm tra | Production `https://www.gvcn.pro.vn` và Supabase project `lgyoekaaefzpymfxfggf` |
| Phạm vi | UI giáo viên, trang công khai, hồ sơ học sinh, store, Supabase, API tích sao, dữ liệu seed/mock |
| Kết luận | **Chưa đủ điều kiện production-ready** |

> Lưu ý: báo cáo phản ánh baseline nêu trên và trạng thái production tại thời điểm review. Các thay đổi chưa commit xuất hiện sau baseline không nằm trong kết luận này và cần được review lại trước khi phát hành.

## 2. Tóm tắt điều hành

Tính năng đã có luồng nghiệp vụ tương đối đầy đủ: giáo viên có thể cộng/trừ sao, thưởng cả tổ/lớp, theo dõi bảng xếp hạng, cấu hình tiêu chí, quản lý quà, duyệt đơn đổi quà và chia sẻ trang công khai. Production build hiện biên dịch thành công.

Tuy nhiên, tính năng chưa thể coi là an toàn để vận hành chính thức vì còn các blocker sau:

1. Reset điểm theo tháng có thể xóa dữ liệu của toàn trường thay vì lớp đang chọn.
2. Token lớp công khai không hợp lệ vẫn fallback sang lớp đầu tiên sau khi dữ liệu tải xong.
3. Hồ sơ học sinh công khai chấp nhận ID/mã học sinh có thể đoán thay vì chỉ chấp nhận token bí mật.
4. Dữ liệu sao, tiêu chí, sản phẩm và đơn đổi quà chưa được phân vùng lớp nhất quán.
5. Quy trình đổi quà kiểm tra và ghi dữ liệu hoàn toàn ở client, không có transaction phía server.
6. Production còn dữ liệu mang dấu hiệu seed/mock.
7. “Mã QR” chia sẻ hiện chỉ là icon, không phải QR có thể quét.
8. Không có test tự động cho các luồng quan trọng; lint chưa đạt.

Khuyến nghị: thực hiện ngay giai đoạn cô lập rủi ro, sau đó sửa mô hình dữ liệu/RLS và chuyển các mutation quan trọng sang server transaction trước khi mở rộng sử dụng cho nhiều lớp.

## 3. Phạm vi và phương pháp review

### 3.1. Thành phần được kiểm tra

- `src/app/behavior/page.tsx`: màn hình quản lý nề nếp của giáo viên.
- `src/lib/store.tsx`: tải dữ liệu, tính số dư sao và các mutation Supabase.
- `src/app/rewards/[classToken]/page.tsx`: bảng thi đua/Shop công khai của lớp.
- `src/app/student/[token]/page.tsx`: hồ sơ và đổi quà của học sinh.
- `src/app/api/v1/rewards/star/route.ts`: API cộng sao.
- `src/lib/mcp-executor.ts`: xác thực phạm vi lớp của API/MCP.
- `src/components/layout/auth-guard.tsx`: phân loại route công khai.
- `src/data/mock-data.ts`: dữ liệu seed/demo.
- Schema Prisma, SQL hiện có và schema thực tế quan sát được qua Supabase REST.

### 3.2. Kiểm tra đã thực hiện

- Truy vết luồng dữ liệu bằng knowledge graph của codebase.
- Đọc các mutation và bộ lọc theo lớp.
- Chạy `npm run build`.
- Chạy ESLint toàn repository và riêng trang `/behavior`.
- Kiểm tra sự tồn tại của test unit/integration/E2E.
- Đọc thống kê production bằng anonymous key, không xuất dữ liệu cá nhân.
- Mở trang production bằng trình duyệt với token lớp cố ý không hợp lệ.
- Kiểm tra HTTP của `/behavior` và trang reward công khai.

## 4. Bằng chứng trạng thái hiện tại

### 4.1. Build, lint và test

| Hạng mục | Kết quả | Nhận xét |
| --- | --- | --- |
| `npm run build` | PASS | Next.js production build và TypeScript hoàn tất |
| `npm run lint` | FAIL | 308 errors, 936 warnings trên toàn repository |
| ESLint `src/app/behavior/page.tsx` | FAIL | 3 lỗi `no-explicit-any` tại baseline |
| Test tự động cho feature | Không tìm thấy | Chưa có unit, integration hoặc E2E cho tích sao/đổi quà |
| Git | Sạch tại thời điểm review | Local `main` trùng `origin/main` tại baseline |
| HTTP production | 200 | `/behavior` và route reward công khai phản hồi |
| Vercel `State: READY` | Chưa xác minh | Script thiếu `VERCEL_TOKEN`, chỉ in thông tin project |

### 4.2. Thống kê production tối thiểu

Các số liệu dưới đây chỉ là thống kê, không ghi lại tên hoặc thông tin nhận dạng học sinh:

| Bảng | Số bản ghi đọc được bằng anonymous key |
| --- | ---: |
| `Class` | 5 |
| `Student` | 55 |
| `StarLog` | 104 |
| `StarCriterion` | 25 |
| `RewardProduct` | 11 |
| `RewardRedemption` | 2 |

Quan sát schema production:

- `StarCriterion` chưa có cột `classId`.
- `RewardProduct` chưa có cột `classId`.
- `RewardRedemption` có `classId`.
- `StarLog` được gắn với `Student` qua `studentId`, nhưng các thao tác reset hiện không join qua lớp.

### 4.3. Dấu hiệu dữ liệu seed/mock

- 25 tiêu chí có ID dạng `sc-*`.
- 11 sản phẩm có ID `prod-1` đến `prod-11`.
- 2 đơn đổi quà có ID `rd-1` và `rd-2`, trùng ID được định nghĩa trong `src/data/mock-data.ts`.
- Không còn StarLog có ID seed dạng `sl-*`; vì vậy chưa đủ bằng chứng kết luận toàn bộ 104 StarLog là mock.
- 46 StarLog có ngày trong tháng 08/2026. Cần đối soát với giáo viên/lịch sử nhập thật trước khi quyết định xóa.

Kết luận về mock data: production chắc chắn còn catalog/tiêu chí/đơn đổi quà mang dấu hiệu seed. Không được xóa StarLog chỉ dựa trên ngày hoặc mẫu ID học sinh.

## 5. Findings chi tiết

### P0-01 — Reset tháng xóa dữ liệu toàn trường

**Vị trí:** `src/lib/store.tsx`, hàm `resetMonthStars()`, khoảng dòng 3393–3408 tại baseline.

**Hiện trạng:**

```ts
supabase.from('StarLog').delete().ilike('date', `${targetMonth}%`);
supabase.from('RewardRedemption').delete().eq('month', targetMonth);
```

Hai câu lệnh chỉ lọc theo tháng, không giới hạn `activeClassId` hoặc danh sách học sinh của lớp đang chọn. Phần state phía client cũng loại bỏ toàn bộ log/đơn cùng tháng.

Ngoài ra, lỗi của câu lệnh xóa `StarLog` bị bỏ qua vì code chỉ `await` rồi trả kết quả của câu lệnh xóa `RewardRedemption`. Không có rollback state cho mutation này.

**Ảnh hưởng:**

- Một giáo viên có thể làm mất điểm sao và đơn đổi quà của nhiều lớp.
- UI có thể báo thành công dù chỉ một phần dữ liệu được xóa.
- Khó khôi phục nếu không có backup/PITR.

**Xử lý đề xuất:**

- Tạm ẩn hoặc khóa nút “Reset tháng” trên production.
- Chuyển reset sang server action/RPC có transaction.
- Truyền `classId`, kiểm tra quyền giáo viên với lớp đó.
- Xác định `studentId` thuộc lớp rồi xóa StarLog bằng tập ID này.
- Xóa RewardRedemption bằng cả `classId` và `month`.
- Ghi audit log, số bản ghi dự kiến xóa và yêu cầu xác nhận hai bước.
- Không hiển thị toast thành công trước khi transaction hoàn tất.

**Acceptance criteria:**

- Reset lớp A không thay đổi bất kỳ dữ liệu nào của lớp B.
- Nếu một bước thất bại, không bảng nào bị thay đổi.
- Response trả về số StarLog và RewardRedemption đã xóa.
- Có audit record chứa người thao tác, lớp, tháng và số bản ghi.

### P0-02 — Token lớp sai fallback sang lớp đầu tiên

**Vị trí:** `src/app/rewards/[classToken]/page.tsx`, khoảng dòng 49–56.

**Hiện trạng:**

```ts
schoolClasses.find(/* token hoặc id */) || schoolClasses[0]
```

Khi token không khớp, trang dùng lớp đầu tiên. Lúc render ban đầu dữ liệu có thể chưa tải nên hiện “không tìm thấy”; sau khi store đồng bộ, trang tự chuyển sang dữ liệu lớp đầu tiên.

**Bằng chứng production:** token cố ý sai ban đầu hiện trạng thái không tìm thấy, sau vài giây hiển thị lớp đầu tiên, 11 sản phẩm và 25 tiêu chí.

**Ảnh hưởng:**

- Làm lộ thông tin lớp khi người dùng có link sai hoặc chủ động dò URL.
- Có thể lộ bảng xếp hạng và link hồ sơ học sinh khi lớp có dữ liệu.
- Trạng thái UI thay đổi gây hiểu nhầm rằng token hợp lệ.

**Xử lý đề xuất:**

- Không fallback sang `schoolClasses[0]`.
- Resolve token tại server bằng query chính xác và trả 404 nếu không khớp.
- Chỉ chấp nhận `shareToken`; không chấp nhận `classId` trên route công khai.
- Dùng token ngẫu nhiên đủ entropy và hỗ trợ rotate/revoke.
- Không tải toàn bộ danh sách lớp vào public client để tự resolve.

**Acceptance criteria:**

- Token sai luôn trả 404/invalid state và không đổi nội dung sau khi hydration.
- `classId` trực tiếp không mở được trang công khai.
- Token cũ không còn hiệu lực sau khi rotate.

### P0-03 — Hồ sơ học sinh có thể được dò bằng ID hoặc mã học sinh

**Vị trí:** `src/app/student/[token]/page.tsx`, khoảng dòng 123–130.

**Hiện trạng:** route công khai tìm học sinh theo một trong ba trường:

- `shareToken`;
- `id`;
- `studentCode`.

ID và mã học sinh thường có quy luật, không phải secret. Trang còn cho phép xem dữ liệu học tập và thực hiện các thao tác như đổi quà trước khi chứng minh quyền sở hữu bằng PIN.

Store chạy trên public route và đọc nhiều bảng ở phạm vi toàn trường. Kiểm tra production cho thấy anonymous key có thể đọc danh sách lớp, học sinh và StarLog.

**Ảnh hưởng:**

- Có thể dò hồ sơ trẻ em và dữ liệu học tập/rèn luyện.
- Có thể tạo yêu cầu đổi quà thay học sinh nếu biết URL có thể đoán.
- Vi phạm nguyên tắc tối thiểu hóa dữ liệu và kiểm soát truy cập.

**Xử lý đề xuất:**

- Route chỉ resolve `shareToken` ngẫu nhiên ở server.
- Không gửi danh sách toàn bộ học sinh xuống public client.
- Yêu cầu PIN/session ngắn hạn trước khi trả dữ liệu riêng tư hoặc cho phép mutation.
- Hash PIN bằng thuật toán phù hợp; không trả `customPin` về client.
- Rate limit và audit các lần xác thực sai.
- Tách endpoint public projection chỉ trả đúng trường cần thiết.

**Acceptance criteria:**

- ID hoặc studentCode không mở được hồ sơ.
- Anonymous request không thể liệt kê bảng `Student` hoặc dữ liệu đánh giá.
- Sai PIN bị rate limit; PIN đúng tạo session giới hạn đúng một học sinh.
- Không có secret/PIN thô trong response hoặc bundle client.

### P1-01 — Dữ liệu feature chưa được phân vùng lớp nhất quán

**Vị trí chính:**

- `src/lib/store.tsx`, initial fetch các bảng Star/Reward.
- `src/app/behavior/page.tsx`, các mảng `starLogs`, `starCriteria`, `rewardProducts`, `rewardRedemptions` được dùng trực tiếp.
- `src/app/rewards/[classToken]/page.tsx`, Shop và tiêu chí dùng mảng toàn cục.
- `src/app/student/[token]/page.tsx`, Shop/tiêu chí dùng mảng toàn cục.

**Hiện trạng:**

- `students` đã được derive theo `activeClassId`.
- `starLogs` được tải toàn bộ; một số phép tính theo học sinh vẫn đúng vì `studentId` duy nhất, nhưng lịch sử và tổng đếm sử dụng toàn bộ mảng.
- `rewardRedemptions` có `classId` nhưng trang giáo viên không lọc theo lớp.
- `RewardProduct` và `StarCriterion` chưa có `classId` trong schema production, nên đang dùng chung toàn trường.

**Ảnh hưởng:**

- Giáo viên có thể nhìn thấy hoặc xử lý đơn của lớp khác.
- Số lượng tab, nhật ký, Shop và tiêu chí không phản ánh lớp đang chọn.
- Một lớp chỉnh/xóa sản phẩm hoặc tiêu chí sẽ ảnh hưởng các lớp khác.
- Trang public của một lớp có thể hiển thị catalog của lớp khác.

**Xử lý đề xuất:**

- Bổ sung `classId NOT NULL` cho `StarLog`, `StarCriterion`, `RewardProduct`, bảo đảm `RewardRedemption.classId NOT NULL`.
- Backfill `StarLog.classId` qua quan hệ `Student.classId`.
- Backfill product/criterion theo quyết định nghiệp vụ: catalog chung toàn trường hoặc clone theo lớp. Không tự suy đoán.
- Tạo selectors theo lớp trong store hoặc bỏ tải toàn bộ, query theo route/class.
- Mọi mutation update/delete phải filter thêm `classId` và được RLS kiểm tra.

**Acceptance criteria:**

- Chuyển lớp làm thay đổi đúng toàn bộ log, tiêu chí, Shop và đơn đổi quà.
- Giáo viên lớp A không đọc/ghi bản ghi của lớp B.
- Trang public lớp A không hiển thị dữ liệu lớp B.

### P1-02 — Thêm sản phẩm mới lệch schema production

**Vị trí:** `src/lib/store.tsx`, hàm `addRewardProduct()`, khoảng dòng 3162–3174.

**Hiện trạng:** code luôn thêm `classId` vào payload `RewardProduct`, nhưng production chưa có cột `classId`. PostgREST sẽ từ chối payload có cột không tồn tại.

Mutation đang optimistic: UI thêm sản phẩm trước, hiển thị success toast ngay, sau đó mới có thể rollback và hiển thị error toast.

**Ảnh hưởng:**

- Chức năng “Thêm đồ dùng mới” thất bại trên production.
- Người dùng nhận thông báo thành công rồi lỗi, gây mất niềm tin.
- UI có thể chớp dữ liệu tạm thời hoặc lệch với realtime.

**Xử lý đề xuất:**

- Thực hiện migration schema trước khi deploy code phụ thuộc `classId`.
- Generate/định nghĩa type Supabase từ schema thật để TypeScript phát hiện lệch schema.
- Chỉ toast thành công sau khi server xác nhận.
- Bổ sung integration test tạo/sửa/xóa/restock sản phẩm.

### P1-03 — Đổi quà không atomic và tin dữ liệu từ client

**Vị trí:** `src/lib/store.tsx`, hàm `createRewardRedemption()`, khoảng dòng 3238–3329.

**Hiện trạng:** client tự thực hiện:

1. Tính số sao khả dụng từ state.
2. Kiểm tra tồn kho từ state.
3. Trừ từng sản phẩm bằng các request riêng.
4. Insert đơn đổi quà bằng request khác.

`totalStars`, giá sản phẩm, số lượng và thông tin học sinh đều xuất phát từ client. Không có lock, transaction hoặc idempotency key.

**Ảnh hưởng:**

- Hai tab/yêu cầu đồng thời có thể tiêu cùng một số sao.
- Có thể oversell sản phẩm.
- Trừ kho thành công nhưng tạo đơn thất bại, hoặc ngược lại.
- Client bị chỉnh sửa có thể gửi giá/tổng sao không đúng.
- Retry có thể tạo đơn trùng.

**Xử lý đề xuất:**

- Tạo RPC/server endpoint `redeem_reward` chạy trong transaction.
- Server lấy lại student, product và giá từ DB; không tin `studentName`, `unitStarPrice`, `totalStars` từ client.
- Khóa bản ghi sản phẩm cần đổi hoặc dùng update có điều kiện `stock >= quantity`.
- Tính số dư sao phía server.
- Insert đơn và giảm kho trong cùng transaction.
- Dùng idempotency key duy nhất cho mỗi checkout.
- Chỉ cho phép transition trạng thái hợp lệ: `PENDING -> DELIVERED` hoặc `PENDING -> CANCELLED`.
- Cancel và hoàn kho cũng phải là transaction idempotent.

**Acceptance criteria:**

- 20 request đồng thời không tạo số dư sao âm hoặc kho âm.
- Retry cùng idempotency key chỉ tạo một đơn.
- Không thể sửa giá/tổng sao từ client.
- Transaction thất bại không thay đổi kho hoặc đơn.

### P1-04 — QR chia sẻ là placeholder và link dùng ID có thể đoán

**Vị trí:** `src/app/behavior/page.tsx`, khoảng dòng 1690–1701.

**Hiện trạng:** component `QrCode` từ Lucide chỉ vẽ icon, không mã hóa URL. Link chia sẻ dùng `classInfo.id` thay vì `shareToken`.

**Ảnh hưởng:**

- Phụ huynh/học sinh không thể quét QR.
- URL có thể đoán và đang kết hợp với lỗi fallback token.

**Xử lý đề xuất:**

- Sinh QR thật từ URL canonical chứa `shareToken`.
- Thêm nút tải PNG/in QR.
- Kiểm thử QR bằng decoder trong test tự động.
- Không render QR khi chưa có token hợp lệ.

### P1-05 — Anonymous client đọc phạm vi dữ liệu quá rộng

**Vị trí:** `src/lib/store.tsx`, initial sync khoảng dòng 1029–1050.

**Hiện trạng:** cùng một AppStore được mount trên route nội bộ và route công khai, sau đó query toàn bộ các bảng như `Student`, `SubjectAssessment`, `TraitAssessment`, `StarLog`, `RewardRedemption`.

Anonymous key là public theo thiết kế Supabase; an toàn phải đến từ RLS và endpoint tối thiểu hóa dữ liệu. Production hiện trả được nhiều bảng ở phạm vi toàn trường cho anonymous request.

**Xử lý đề xuất:**

- Không mount global internal store trên public pages.
- Public pages gọi server endpoint riêng, resolve token và trả projection tối thiểu.
- Bật/siết RLS cho toàn bộ bảng chứa dữ liệu học sinh.
- Không tạo policy kiểu `USING (true)` cho bảng nội bộ.
- Tạo automated policy tests bằng các vai trò `anon`, `TEACHER`, `ADMIN`.

### P2-01 — Kiểu category không thống nhất

**Vị trí:**

- `src/types/index.ts`: `StarCriterionCategory` gồm `Học tập`, `Nề nếp`, `Phẩm chất`, `Nhắc nhở`, `Khác`.
- `src/app/behavior/page.tsx`: form lại có option `Phong trào` và ép kiểu bằng `as any`.

**Ảnh hưởng:** dữ liệu runtime có thể chứa category ngoài type, làm sai màu hiển thị, filter và báo cáo.

**Xử lý đề xuất:** thống nhất enum nghiệp vụ, loại bỏ `any`, thêm DB check constraint hoặc enum có migration rõ ràng.

### P2-02 — Thông báo thành công trước khi database xác nhận

Nhiều mutation gọi `void handleDbMutation(...)` rồi toast thành công ngay. Với thao tác cả tổ/cả lớp, nhiều request chạy độc lập và UI vẫn báo thành công dù một phần request thất bại.

**Xử lý đề xuất:** mutation trả `Promise<Result>`, UI `await`, hiển thị tiến trình và chỉ báo thành công khi transaction hoàn tất.

### P2-03 — Thiếu giới hạn và validate dữ liệu

- Điểm tiêu chí không có giới hạn min/max.
- API `add_star_points` dùng `Number(args.points)` nhưng chưa kiểm tra `Number.isFinite`, integer hoặc phạm vi cho phép.
- Lý do/comment chưa có giới hạn độ dài thống nhất.
- Số lượng restock và giỏ hàng dựa nhiều vào validation HTML/client.

**Xử lý đề xuất:** định nghĩa schema dùng chung phía server, ví dụ Zod, với các giới hạn nghiệp vụ rõ ràng.

## 6. Kiến trúc đích đề xuất

### 6.1. Nguyên tắc

1. Mọi dữ liệu tích sao/đổi quà phải có phạm vi lớp rõ ràng.
2. Public client không được đọc bảng nội bộ trực tiếp.
3. Mọi mutation ảnh hưởng số dư/kho phải chạy phía server trong transaction.
4. RLS là lớp bảo vệ bắt buộc, UI filter không phải cơ chế phân quyền.
5. Token public chỉ là capability giới hạn; dữ liệu riêng tư vẫn cần PIN/session.
6. Tất cả thao tác phá hủy phải có audit và khả năng rollback.

### 6.2. Luồng tích sao đề xuất

```text
Giáo viên đã đăng nhập
  -> Server action/API xác minh role + classId
  -> Xác minh student thuộc classId
  -> Validate points/category/reason
  -> Insert StarLog(classId, studentId, actorTeacherId, ...)
  -> Ghi AuditLog
  -> Trả record đã commit
  -> Client cập nhật UI
```

Thưởng tổ/cả lớp nên là một RPC/batch transaction thay vì gọi `addStarLog()` nhiều lần từ client.

### 6.3. Luồng đổi quà đề xuất

```text
Học sinh/phụ huynh có session đã xác minh
  -> POST /api/public/rewards/redeem với productId + quantity + idempotencyKey
  -> Resolve student từ session, không nhận studentId tùy ý
  -> Lock/conditional-update tồn kho
  -> Tính lại số sao và giá từ DB
  -> Insert RewardRedemption
  -> Commit transaction
  -> Trả đơn đã tạo
```

### 6.4. Phạm vi dữ liệu đề xuất

| Bảng | Scope | Khóa/phân quyền chính |
| --- | --- | --- |
| `StarLog` | Theo lớp và học sinh | `classId`, `studentId`, `actorTeacherId` |
| `StarCriterion` | Theo lớp hoặc trường theo quyết định nghiệp vụ | Bắt buộc chọn một scope rõ ràng |
| `RewardProduct` | Theo lớp hoặc catalog trường | `classId` hoặc `schoolId`, không để mơ hồ |
| `RewardRedemption` | Theo lớp và học sinh | `classId`, `studentId` |
| `RewardInventoryLedger` | Theo sản phẩm | Ghi tăng/giảm để audit tồn kho |
| `AuditLog` | Theo school/class/actor | Không cho client sửa/xóa |

## 7. Kế hoạch xử lý

### Giai đoạn 0 — Containment production

**Mục tiêu:** ngăn mất dữ liệu/lộ dữ liệu trong khi chờ sửa đầy đủ.

- [ ] Ẩn hoặc disable nút Reset tháng.
- [ ] Sửa ngay fallback token sai; không trả lớp đầu tiên.
- [ ] Tạm thời chỉ cho phép `/rewards/[shareToken]`, chặn class ID.
- [ ] Chặn truy cập `/student/[id]` và `/student/[studentCode]`.
- [ ] Nếu chưa siết RLS ngay được, tạm disable public profile/redeem.
- [ ] Chụp backup DB/PITR trước migration hoặc cleanup.
- [ ] Ghi nhận danh sách bảng/policy hiện tại để có phương án rollback.

**Exit criteria:** token sai không lộ dữ liệu; giáo viên không thể chạy reset toàn trường; public anonymous không liệt kê dữ liệu nội bộ.

### Giai đoạn 1 — Migration schema và RLS

**Mục tiêu:** thiết lập isolation ở tầng dữ liệu.

- [ ] Chốt phạm vi nghiệp vụ của tiêu chí và Shop: theo lớp hay dùng chung toàn trường.
- [ ] Thêm `classId` phù hợp vào các bảng class-scoped.
- [ ] Backfill bằng query có dry-run và kiểm tra số lượng.
- [ ] Thêm foreign key, `NOT NULL`, index và check constraints.
- [ ] Tạo RLS cho `ADMIN`, `ADMIN_TEACHER`, `TEACHER`, public session.
- [ ] Tạo bảng/luồng audit cho reset, thưởng batch, đổi/hủy quà.
- [ ] Generate lại Supabase database types.
- [ ] Viết policy tests trước khi áp dụng production.

Migration minh họa, cần hiệu chỉnh theo schema thực tế và chạy staging trước:

```sql
alter table "StarLog" add column if not exists "classId" text;

update "StarLog" sl
set "classId" = s."classId"
from "Student" s
where s.id = sl."studentId"
  and sl."classId" is null;

-- Chỉ đặt NOT NULL sau khi query kiểm tra không còn bản ghi null.
alter table "StarLog"
  alter column "classId" set not null;

create index if not exists "StarLog_classId_date_idx"
  on "StarLog" ("classId", "date");
```

Không áp dụng trực tiếp đoạn minh họa vào production nếu chưa xác định cách backfill `RewardProduct` và `StarCriterion`.

### Giai đoạn 2 — Server mutations và refactor client

**Mục tiêu:** loại bỏ client-trust và mutation phân mảnh.

- [ ] Tạo API/RPC `award_star`, `award_stars_batch`, `reset_month_stars`.
- [ ] Tạo API/RPC transaction `redeem_reward`, `fulfill_redemption`, `cancel_redemption`.
- [ ] Mọi endpoint xác minh role, lớp và ownership phía server.
- [ ] Chuyển store mutation sang async Result; loại bỏ success toast sớm.
- [ ] Query data theo lớp thay vì tải toàn trường.
- [ ] Tạo selectors `activeClassStarLogs`, `activeClassProducts`, `activeClassRedemptions`, `activeClassCriteria` nếu vẫn giữ store.
- [ ] Dùng realtime channel có filter theo `classId`.
- [ ] Chuẩn hóa category và validation schema.

### Giai đoạn 3 — Public pages và QR

**Mục tiêu:** công khai đúng phần cần công khai, không làm lộ hồ sơ.

- [ ] Resolve class/student token phía server.
- [ ] Trả 404 ổn định cho token sai.
- [ ] Thiết lập PIN session và rate limit.
- [ ] Tạo endpoint public projection tối thiểu.
- [ ] Sinh QR thật từ URL dùng `shareToken`.
- [ ] Thêm rotate/revoke token và kiểm thử token cũ.
- [ ] Xem xét ẩn họ tên đầy đủ trên bảng xếp hạng công khai theo chính sách riêng tư.

### Giai đoạn 4 — Làm sạch mock data

**Mục tiêu:** loại bỏ seed/demo mà không xóa nhầm dữ liệu thật.

- [ ] Backup các bảng liên quan.
- [ ] Xuất danh sách candidate theo ID `sc-*`, `prod-*`, `rd-*` vào báo cáo dry-run.
- [ ] Đối chiếu owner/timestamp/nội dung với giáo viên và quản trị viên.
- [ ] Quyết định giữ catalog thật, clone thành dữ liệu lớp, hoặc xóa.
- [ ] Không xóa StarLog theo tháng hoặc prefix học sinh.
- [ ] Chạy cleanup trong transaction; kiểm tra counts trước/sau.
- [ ] Ghi audit và lưu script rollback.

### Giai đoạn 5 — Test và hardening

**Mục tiêu:** chứng minh feature hoạt động đúng trước go-live.

- [ ] Unit test tính sao theo tháng và số dư sau đổi/hủy.
- [ ] Unit test validation điểm/category.
- [ ] Integration test RLS theo role và class.
- [ ] Integration test transaction đổi quà, hủy và hoàn kho.
- [ ] Concurrency test nhiều request đổi cùng một sản phẩm.
- [ ] E2E giáo viên cộng/trừ sao, thưởng tổ/lớp.
- [ ] E2E token sai, token rotate, PIN sai/đúng.
- [ ] E2E QR decode về đúng URL.
- [ ] E2E reset lớp A không ảnh hưởng lớp B.
- [ ] Đưa lint về 0 error trong phạm vi feature; cấu hình ESLint bỏ qua thư mục tool/generated nếu phù hợp.

### Giai đoạn 6 — Rollout production

**Mục tiêu:** phát hành có kiểm soát và quan sát được.

- [ ] Deploy staging với bản sao dữ liệu đã ẩn PII.
- [ ] Chạy migration dry-run và smoke test.
- [ ] Deploy schema trước, code tương thích ngược sau.
- [ ] Bật feature flag cho một lớp pilot.
- [ ] Theo dõi mutation error, duplicate redemption, stock âm và unauthorized access.
- [ ] Mở dần cho các lớp còn lại khi pilot ổn định.
- [ ] Xác nhận `npm run build` pass, lint scope pass và Vercel `State: READY`.
- [ ] Thực hiện post-deploy smoke test trên domain production.

## 8. Ma trận test bắt buộc

| ID | Kịch bản | Kết quả mong đợi |
| --- | --- | --- |
| STAR-01 | Giáo viên cộng +1 sao cho học sinh lớp mình | Một StarLog đúng lớp, đúng actor |
| STAR-02 | Giáo viên lớp A cộng sao cho học sinh lớp B | Bị từ chối 403/RLS |
| STAR-03 | Thưởng cả lớp 40 học sinh | Hoặc đủ 40 log, hoặc không có log nào nếu lỗi |
| STAR-04 | Gửi điểm `NaN`, số thập phân, ngoài phạm vi | Bị từ chối 400 |
| RESET-01 | Reset tháng của lớp A | Chỉ dữ liệu lớp A bị xóa |
| RESET-02 | Lỗi giữa transaction reset | Không dữ liệu nào bị thay đổi |
| PUBLIC-01 | Token lớp sai | 404, không fallback |
| PUBLIC-02 | Dùng class ID thay token | Không truy cập được |
| STUDENT-01 | Dùng student ID/studentCode | Không truy cập được |
| STUDENT-02 | PIN sai nhiều lần | Rate limit/lock tạm thời |
| REDEEM-01 | Đổi quà đủ sao/đủ kho | Tạo một đơn, kho giảm chính xác |
| REDEEM-02 | Chỉnh `totalStars` ở client | Server bỏ qua/từ chối |
| REDEEM-03 | 20 request đồng thời, kho còn 1 | Chỉ một request thành công |
| REDEEM-04 | Retry cùng idempotency key | Không tạo đơn trùng |
| CANCEL-01 | Hủy đơn pending hai lần | Chỉ hoàn kho một lần |
| CLASS-01 | Chuyển giữa hai lớp | Không lẫn log/quà/đơn/tiêu chí |
| QR-01 | Decode QR | URL đúng shareToken và HTTPS |
| MOCK-01 | Cleanup seed | Không xóa dữ liệu đã được xác nhận là thật |

## 9. Release gates

Không phát hành chính thức cho đến khi tất cả điều kiện sau đạt:

- [ ] Đóng toàn bộ finding P0.
- [ ] Đóng P1 về class scoping, transaction đổi quà, public access và QR.
- [ ] Không còn anonymous broad read đối với dữ liệu học sinh nội bộ.
- [ ] Migration/backfill được kiểm tra và có rollback.
- [ ] Không còn seed/mock redemption trên production, hoặc đã được xác nhận là dữ liệu thật.
- [ ] Build pass.
- [ ] ESLint feature scope 0 error.
- [ ] Test matrix trọng yếu pass trên staging.
- [ ] Concurrency test không tạo kho/số dư âm hoặc đơn trùng.
- [ ] Vercel deployment `State: READY`.
- [ ] Smoke test production pass bằng tài khoản `TEACHER`, `ADMIN` và anonymous.

## 10. Thứ tự ưu tiên đề xuất

| Thứ tự | Hạng mục | Ưu tiên | Phụ thuộc |
| ---: | --- | --- | --- |
| 1 | Khóa Reset tháng và sửa token fallback | P0 | Không |
| 2 | Chặn student ID/code và broad anonymous reads | P0 | Thiết kế public session tối thiểu |
| 3 | Backup, schema migration và RLS | P0/P1 | Quyết định scope catalog/criteria |
| 4 | Transaction thưởng batch/reset/đổi quà | P1 | Schema mới |
| 5 | Refactor store/query theo lớp | P1 | Schema + API |
| 6 | QR thật và token lifecycle | P1 | Public endpoint |
| 7 | Cleanup dữ liệu seed/mock | P1 | Backup + xác nhận nghiệp vụ |
| 8 | Test automation, lint và rollout pilot | P1/P2 | Các bản sửa hoàn tất |

## 11. Quyết định nghiệp vụ cần chốt trước khi triển khai

1. `StarCriterion` là bộ tiêu chí dùng chung toàn trường hay riêng từng lớp?
2. `RewardProduct` là kho chung của trường hay mỗi lớp có kho riêng?
3. Bảng xếp hạng công khai được phép hiển thị họ tên đầy đủ hay cần rút gọn?
4. Sao được tích lũy theo tháng, học kỳ hay toàn năm; sao âm có được mang sang tháng sau không?
5. Reset là xóa vĩnh viễn hay đóng kỳ và tạo kỳ mới? Khuyến nghị đóng kỳ, không xóa lịch sử.
6. Học sinh/phụ huynh xác thực bằng PIN nào và quy trình khôi phục PIN ra sao?
7. Ai được phép tạo/sửa quà, reset kỳ và duyệt/hủy đơn: `TEACHER`, `ADMIN_TEACHER`, hay chỉ `ADMIN`?

## 12. Khuyến nghị cuối cùng

Không nên tiếp tục dùng thao tác “Reset tháng” theo cách xóa log. Mô hình an toàn hơn là giữ StarLog bất biến, tạo `CompetitionPeriod` hoặc trạng thái kỳ thi đua, rồi tính bảng xếp hạng theo khoảng thời gian. Cách này giữ được lịch sử rèn luyện, hỗ trợ audit và tránh mất dữ liệu giáo dục.

Ưu tiên triển khai P0-01, P0-02 và P0-03 dưới dạng hotfix trước; sau đó thực hiện migration/RLS và transaction đổi quà trong một nhánh riêng có staging test. Chỉ dọn mock data sau khi đã backup và có xác nhận của người phụ trách dữ liệu.
