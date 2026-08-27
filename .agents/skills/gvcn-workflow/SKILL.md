---
name: gvcn-workflow
description: >-
  Comprehensive guide and dev workflow for GVCN Pro (Phần mềm Quản lý Giáo viên Chủ nhiệm Tiểu học Thông tư 27).
  Use this skill whenever developing, modifying, testing, querying Supabase, or deploying GVCN Pro to Vercel.
---

# GVCN Pro Development & Deployment Workflow

This skill provides full context, architecture guidelines, Supabase database access procedures, and Vercel deployment workflows for the **GVCN Pro** project.

---

## 1. Project Overview & Architecture

- **Domain**: Comprehensive classroom management system for Vietnamese Primary School Homeroom Teachers (GVCN Khối 1 - Khối 5) following the **Thông tư 27/2020/TT-BGDĐT** standard.
- **Framework**: Next.js 16 (Turbopack, App Router, React 19, TypeScript).
- **Styling**: Tailwind CSS, Lucide Icons, Sonner toasts.
- **Backend & Database**: Supabase PostgreSQL + Supabase Auth.
- **Deployment Platform**: Vercel Serverless (`https://gvcn-eta.vercel.app`).
- **Repository**: `https://github.com/chamnp/gvcn` (Branch `main`).

---

## 2. Supabase Configuration & Operations

- **Project Ref**: `lgyoekaaefzpymfxfggf`
- **Project URL**: `https://lgyoekaaefzpymfxfggf.supabase.co`
- **Primary Admin**: `anhnnh4@gmail.com`

### Database Schema
See full schema details in [database-schema.md](./references/database-schema.md).

### Querying or Updating Database via MCP
Use the Supabase MCP tool `execute_sql`:
```json
{
  "ServerName": "supabase",
  "ToolName": "execute_sql",
  "Arguments": {
    "query": "SELECT * FROM \"Teacher\" ORDER BY \"createdAt\" ASC;"
  }
}
```

### RBAC System (Role-Based Access Control)
1. `ADMIN_TEACHER`: Dual role (Principal/Vice-Principal who is also a Homeroom Teacher). Has full access to `/admin`, can switch classes, and manages their assigned class (`class-4a1`).
2. `ADMIN`: Full school administrator (BGH). Can manage all classes, faculty matrix, and school profile.
3. `TEACHER`: Regular teacher locked to their assigned class.
4. `PENDING`: New user awaiting BGH approval at `/unauthorized`.

---

## 3. Educational Standards & Business Logic (Thông tư 27)

All assessment engines are located in `src/lib/tt27-engine.ts`:
- **4 Terms**:
  - `GIUA_HK1` (Giữa Học kỳ 1: 01/09 -> 15/11)
  - `CUOI_HK1` (Cuối Học kỳ 1: 16/11 -> 15/01)
  - `GIUA_HK2` (Giữa Học kỳ 2: 16/01 -> 31/03)
  - `CUOI_NAM` (Cuối Năm học: 01/04 -> 31/08)
- **Automatic Real-time Sync**: `getCurrentTermByDate()` and `getAcademicYearByDate()`.
- **Subject Levels**: `T` (Hoàn thành tốt), `H` (Hoàn thành), `C` (Chưa hoàn thành).
- **Competency/Trait Levels**: `T` (Tốt), `Đ` (Đạt), `C` (Cần cố gắng).
- **Awards (Danh hiệu khen thưởng)**:
  - `Học sinh Xuất sắc`
  - `Học sinh Tiêu biểu hoàn thành tốt`
  - `Khen thưởng từng mặt`
  - `Hoàn thành chương trình lớp học`
  - `Chưa hoàn thành`

---

## 4. Key Codebase Map

| File Path | Description |
| :--- | :--- |
| `src/lib/store.tsx` | Global state store (School Info, Classes, Students, Assessments, Timetable, LocalStorage sync) |
| `src/lib/auth-context.tsx` | Supabase Auth provider, synchronous profile resolution, RBAC flags (`isAdmin`, `isTeacher`) |
| `src/lib/tt27-engine.ts` | TT27 evaluation engine, semester date rules, award classification |
| `src/lib/timetable-data.ts` | 2-session primary timetable matrix (7 periods/day) |
| `src/components/layout/auth-guard.tsx` | Route protection, redirection logic |
| `src/components/layout/app-shell.tsx` | Controls Header/Sidebar visibility on authenticated vs public routes |
| `src/app/admin/page.tsx` | School Profile settings, class management, faculty & staff directory matrix |
| `src/app/assessment/page.tsx` | TT27 assessment matrix for subjects & traits |
| `src/app/homework/page.tsx` | Homework assignment and QR code generator |
| `src/app/hw/[classId]/page.tsx` | Public homework portal for students/parents without login |

---

## 5. Development & Deployment Procedures

Follow these steps for every feature or bug fix:

### Step 1: Implement & Verify Types
Make sure all types in `src/types/index.ts` and UI components align with the TT27 domain.

### Step 2: Build & Validate
Always run Next.js production build to verify 0 TypeScript/build errors:
```bash
npm run build
```

### Step 3: Commit and Push to GitHub
```bash
git add .
git commit -m "feat/fix: <clear description>"
git push origin main
```

### Step 4: Verify Vercel Deployment Status
Run the automated check script:
```bash
node .agents/skills/gvcn-workflow/scripts/check-deploy.js
```
Confirm output shows `State: READY` and verify on `https://gvcn-eta.vercel.app`.
