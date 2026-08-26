-- SUPABASE SQL SCHEMA FOR GVCN PRO

CREATE TABLE IF NOT EXISTS "Class" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "grade" INTEGER NOT NULL,
  "schoolYear" TEXT NOT NULL,
  "schoolName" TEXT DEFAULT 'Trường Tiểu học Chu Văn An',
  "teacherName" TEXT DEFAULT 'Nguyễn Thị Mai',
  "seatingGridRows" INTEGER DEFAULT 5,
  "seatingGridCols" INTEGER DEFAULT 8,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Student" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "classId" TEXT NOT NULL REFERENCES "Class"("id") ON DELETE CASCADE,
  "studentCode" TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  "gender" TEXT NOT NULL,
  "dateOfBirth" TEXT NOT NULL,
  "birthPlace" TEXT,
  "ethnicity" TEXT DEFAULT 'Kinh',
  "address" TEXT,
  "parentName" TEXT,
  "parentPhone" TEXT,
  "isBoarding" BOOLEAN DEFAULT true,
  "seatRow" INTEGER DEFAULT 0,
  "seatCol" INTEGER DEFAULT 0,
  "healthNotes" TEXT,
  "tags" TEXT,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SubjectAssessment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "subjectCode" TEXT NOT NULL,
  "term" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "subjectCode", "term")
);

CREATE TABLE IF NOT EXISTS "TraitAssessment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "traitCode" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "term" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "traitCode", "term")
);

CREATE TABLE IF NOT EXISTS "TermSummary" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "term" TEXT NOT NULL,
  "overallLearningLevel" TEXT,
  "overallTraitsLevel" TEXT,
  "awardTitle" TEXT,
  "awardDetail" TEXT,
  "teacherComment" TEXT,
  "promotedToNextGrade" BOOLEAN DEFAULT true,
  "summerRemediation" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "term")
);

CREATE TABLE IF NOT EXISTS "DailyAttendance" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "date" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "hasBoardingMeal" BOOLEAN DEFAULT true,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "date")
);

CREATE TABLE IF NOT EXISTS "StarLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId" TEXT NOT NULL REFERENCES "Student"("id") ON DELETE CASCADE,
  "points" INTEGER NOT NULL DEFAULT 1,
  "category" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ClassFundTransaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "classId" TEXT NOT NULL REFERENCES "Class"("id") ON DELETE CASCADE,
  "studentId" TEXT REFERENCES "Student"("id") ON DELETE SET NULL,
  "type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "date" TEXT NOT NULL,
  "payerName" TEXT,
  "notes" TEXT,
  "receiptUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
