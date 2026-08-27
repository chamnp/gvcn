# GVCN Pro Database Schema & Supabase Reference

## Supabase Project Details
- **Project Ref**: `lgyoekaaefzpymfxfggf`
- **Project URL**: `https://lgyoekaaefzpymfxfggf.supabase.co`
- **Auth Provider**: Google OAuth, Email/Password, Magic Link OTP
- **Redirect URI**: `${window.location.origin}/login` (Production: `https://gvcn-eta.vercel.app/login`)

---

## 1. Table `Teacher`
Stores school staff, faculty members, assigned roles, and class allocations.

```sql
CREATE TABLE IF NOT EXISTS "Teacher" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'TEACHER', -- 'ADMIN' | 'TEACHER' | 'ADMIN_TEACHER' | 'PENDING'
  "title" TEXT,                            -- e.g. 'Hiệu trưởng kiêm GVCN', 'Tổ trưởng Khối 4', 'GV Tiếng Anh'
  "department" TEXT,                       -- e.g. 'Ban Giám Hiệu', 'Tổ Khối 4', 'Tổ Năng khiếu'
  "assignedClassId" TEXT,                  -- e.g. 'class-4a1'
  "phone" TEXT,
  "avatarUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 2. Managing Data via MCP Tool
You can query or modify the database using the Supabase MCP tool:
```json
{
  "ServerName": "supabase",
  "ToolName": "execute_sql",
  "Arguments": {
    "query": "SELECT * FROM \"Teacher\" ORDER BY \"createdAt\" ASC;"
  }
}
```

---

## 3. LocalStorage State Sync Keys (`STORAGE_PREFIX = 'gvcn_pro_'`)
- `gvcn_pro_schoolInfo`: School profile (`name`, `departmentName`, `schoolYear`, `principalName`, `address`, `phone`).
- `gvcn_pro_schoolClasses`: Array of `ClassInfo`.
- `gvcn_pro_activeClassId`: Currently active class (`class-4a1`).
- `gvcn_pro_students`: Array of `Student`.
- `gvcn_pro_currentTerm`: Current active assessment term (`GIUA_HK1`, `CUOI_HK1`, `GIUA_HK2`, `CUOI_NAM`).
- `gvcn_pro_subjectAssessments`: Assessments for subjects.
- `gvcn_pro_traitAssessments`: Assessments for traits & competencies.
- `gvcn_pro_timetable`: 2 sessions/day timetable matrix slots.
- `gvcn_pro_homeworks`: Homework assignments with public QR codes.
- `gvcn_teachers`: Cached teacher profiles list.
