<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GVCN Pro Project Rules & Guidelines

## 1. Domain: Thông tư 27/2020/TT-BGDĐT
- System manages Vietnamese Primary Schools (Grades 1 to 5).
- 4 Terms: `GIUA_HK1`, `CUOI_HK1`, `GIUA_HK2`, `CUOI_NAM`.
- Term and academic year are automatically calculated based on real-time calendar dates (`getCurrentTermByDate()`, `getAcademicYearByDate()`).
- Never alter Thông tư 27 grading scales (Subjects: T/H/C; Traits & Competencies: T/Đ/C; Awards: Xuất sắc, Tiêu biểu, Hoàn thành, Chưa hoàn thành).

## 2. Authentication & RBAC (Role-Based Access Control)
- Primary Admin: `anhnnh4@gmail.com`
- Roles: `ADMIN_TEACHER` (Admin kiêm GVCN), `ADMIN` (Quản trị viên BGH), `TEACHER` (Giáo viên chủ nhiệm), `PENDING` (Chờ duyệt).
- Always ensure synchronous profile resolution in `src/lib/auth-context.tsx` to prevent race-condition flash redirects to `/unauthorized`.
- Standalone public pages (`/login`, `/unauthorized`, `/demo`, `/hw/*`) use `AppShell` to hide internal navigation menus.

## 3. Supabase Integration
- Project Ref: `lgyoekaaefzpymfxfggf` (`https://lgyoekaaefzpymfxfggf.supabase.co`)
- Database Table: `Teacher` (stores staff profiles, roles, and class assignments).
- To inspect or run migrations, use Supabase MCP `execute_sql`.

## 4. Vercel Deployment & Workflow
- Team ID: `team_2yh3CpurkFhBq4AK3croKlxd` | Project ID: `prj_WRY7j9gepdqOFQPN3ygnmwD60Mz2`
- Production URL: `https://gvcn-eta.vercel.app`
- GitHub Repo: `https://github.com/chamnp/gvcn` (Branch `main`)
- **Required Workflow for every change**:
  1. `npm run build` (Must pass with 0 errors).
  2. `git add . && git commit -m "..." && git push origin main`.
  3. Run `.agents/skills/gvcn-workflow/scripts/check-deploy.js` to confirm `State: READY`.

