-- Persist features that previously existed only in browser localStorage.
create table if not exists public."LessonPlan" (
  id text primary key,
  "classId" text not null references public."Class"(id) on delete cascade,
  week integer not null check (week between 1 and 35),
  "subjectCode" text not null,
  data jsonb not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "LessonPlan_classId_week_idx"
  on public."LessonPlan" ("classId", week);

create table if not exists public."ClassroomToolConfig" (
  id text primary key,
  "ownerEmail" text not null,
  "classId" text not null references public."Class"(id) on delete cascade,
  tool text not null check (tool in ('TEAM_QUIZ', 'MYSTERY_CHEST')),
  data jsonb not null,
  "updatedAt" timestamptz not null default now(),
  unique ("ownerEmail", "classId", tool)
);

-- A learner may have only one current submission for a homework assignment.
create unique index if not exists "QuizSubmission_homework_student_key"
  on public."QuizSubmission" ("homeworkId", "studentId");

alter table public."LessonPlan" enable row level security;
alter table public."ClassroomToolConfig" enable row level security;

drop policy if exists "Authenticated users manage lesson plans" on public."LessonPlan";
create policy "Authenticated users manage lesson plans"
  on public."LessonPlan"
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Teachers manage their classroom tool config" on public."ClassroomToolConfig";
create policy "Teachers manage their classroom tool config"
  on public."ClassroomToolConfig"
  for all
  to authenticated
  using (lower("ownerEmail") = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (lower("ownerEmail") = lower(coalesce(auth.jwt() ->> 'email', '')));

grant select, insert, update, delete on public."LessonPlan" to authenticated;
grant select, insert, update, delete on public."ClassroomToolConfig" to authenticated;
