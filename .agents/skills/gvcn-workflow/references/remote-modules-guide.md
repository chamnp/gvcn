# Hướng Dẫn Tích Hợp Adaptive Contextual Remote Control Cho Trò Chơi & Loại Slide Mới

Tài liệu này hướng dẫn cách mở rộng hoặc bổ sung hỗ trợ Remote Control trên điện thoại cho bất kỳ **Trò chơi lớp học** hoặc **Dạng Slide bài giảng** mới nào trong GVCN Pro.

---

## 1. Kiến Trúc Modular Remote Control

Hệ thống Remote Control trong GVCN Pro được thiết kế theo mô hình **Adaptive Contextual Adapter** (`src/lib/remote-modules/`):

```
src/lib/remote-modules/
├── types.ts                    # Interface chuẩn: RemoteGameModule, RemoteModuleProps
├── registry.ts                 # Registry tập trung quản lý tất cả các modules trò chơi
├── slide-adapters/             # Bộ điều khiển thích ứng theo từng loại layout Slide
│   ├── adaptive-slide-view.tsx # Master router phân phối điều khiển theo layout
│   ├── countdown-slide-controls.tsx
│   ├── quiz-slide-controls.tsx
│   ├── wheel-slide-controls.tsx
│   └── standard-slide-controls.tsx
└── game-adapters/              # Bộ điều khiển chuyên dụng cho từng trò chơi trên TV
    └── index.tsx               # Khai báo các module Game (WHEEL, TIMER, TRAFFIC, QUIZ, CHEST, ...)
```

---

## 2. Cách Tạo Thêm Hỗ Trợ Remote Cho 1 Trò Chơi / Công Cụ Lớp Học Mới

### Bước 1: Khai báo `TVModalType` trong `src/lib/remote-sync.ts`
Thêm định danh Modal của bạn:
```typescript
export type TVModalType =
  | 'WHEEL'
  | 'TIMER'
  | 'YOUR_NEW_GAME' // <-- Thêm vào đây
  ...
```

### Bước 2: Tạo định nghĩa Module trong `src/lib/remote-modules/game-adapters/index.tsx`
Tạo một object triển khai `RemoteGameModule`:
```typescript
export const YourNewGameModule: RemoteGameModule = {
  id: 'YOUR_NEW_GAME',
  title: 'Tên Trò Chơi Mới',
  iconEmoji: '🎯',
  shortDesc: 'Mô tả ngắn gọn về trò chơi',
  category: 'GAME', // 'GAME' | 'MANAGEMENT' | 'INTERACTION' | 'ENERGY'
  renderControls: ({ tvState, sendAction }: RemoteModuleProps) => (
    <div className="space-y-3 animate-in fade-in">
      <button
        onClick={() => sendAction('GAME_ACTION', { tool: 'YOUR_NEW_GAME', action: 'DO_SOMETHING' })}
        className="w-full py-3.5 rounded-2xl bg-indigo-600 active:scale-95 text-white font-black text-xs shadow-md"
      >
        🎯 Bấm Kích Hoạt Hành Động Trên TV
      </button>
    </div>
  ),
};
```

### Bước 3: Đăng ký Module vào `src/lib/remote-modules/registry.ts`
```typescript
export const REMOTE_GAME_MODULES: Record<TVModalType, RemoteGameModule | null> = {
  ...
  YOUR_NEW_GAME: YourNewGameModule,
};

export const ALL_REMOTE_GAMES: RemoteGameModule[] = [
  ...
  YourNewGameModule,
];
```

🎉 **Xong!** Điện thoại sẽ tự động:
- Hiển thị nút bật/tắt trò chơi trong Tab "Âm Thanh & Trò Chơi".
- Tự động hiển thị Banner & Bộ điều khiển chuyên dụng của trò chơi khi TV mở pop-up này.
- Cho phép đóng pop-up tức thì từ xa bằng 1 nút bấm `[✕ ĐÓNG TV]`.

---

## 3. Cách Bổ Sung Điều Khiển Cho 1 Loại Slide Mới

Nếu tạo một Layout Slide mới trong `LessonSlideLayout` (ví dụ `MINDMAP`, `DRAG_DROP`):

1. Tạo file component `src/lib/remote-modules/slide-adapters/mindmap-slide-controls.tsx`.
2. Mở `src/lib/remote-modules/slide-adapters/adaptive-slide-view.tsx` và thêm nhánh kiểm tra:
```typescript
if (layout === 'MINDMAP') {
  return <MindmapSlideControls {...props} />;
}
```
3. Trong `LessonPresentationModal`, đồng bộ các thuộc tính cần thiết qua `STATE_SYNC`.
