-- Secure production boundary for Nề nếp / Tích sao / Đổi quà.
-- Public users may only use narrow SECURITY DEFINER RPCs; authenticated staff are
-- restricted to classes resolved from their Teacher profile.

create schema if not exists private;

create table if not exists private.student_portal_attempt (
  "studentId" text primary key references public."Student"(id) on delete cascade,
  "failedCount" integer not null default 0,
  "lockedUntil" timestamptz,
  "updatedAt" timestamptz not null default now()
);

alter table public."RewardRedemption"
  add column if not exists "idempotencyKey" text;

create unique index if not exists "RewardRedemption_student_idempotency_key"
  on public."RewardRedemption" ("studentId", "idempotencyKey")
  where "idempotencyKey" is not null;

create or replace function private.student_pin_matches(p_student public."Student", p_pin text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $$
  select case
    when coalesce(p_student."isActivated", false) then
      p_student."customPin" is not null and p_student."customPin" = p_pin
    else
      p_student."dateOfBirth" is not null
      and to_char(p_student."dateOfBirth"::date, 'DDMM') = p_pin
  end;
$$;

revoke all on function private.student_pin_matches(public."Student", text) from public, anon, authenticated;

create or replace function private.assert_student_portal_pin(
  p_student_share_token text,
  p_pin text
)
returns public."Student"
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_student public."Student";
  v_attempt private.student_portal_attempt;
begin
  if p_student_share_token is null or btrim(p_student_share_token) = ''
     or p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    return null;
  end if;

  select student.* into v_student
  from public."Student" as student
  where lower(student."shareToken") = lower(btrim(p_student_share_token))
  for update;

  if not found then
    return null;
  end if;

  select attempt.* into v_attempt
  from private.student_portal_attempt as attempt
  where attempt."studentId" = v_student.id
  for update;

  if found and v_attempt."lockedUntil" is not null and v_attempt."lockedUntil" > now() then
    return null;
  end if;

  if not private.student_pin_matches(v_student, p_pin) then
    insert into private.student_portal_attempt ("studentId", "failedCount", "lockedUntil", "updatedAt")
    values (v_student.id, 1, null, now())
    on conflict ("studentId") do update
    set "failedCount" = case
          when private.student_portal_attempt."updatedAt" < now() - interval '15 minutes' then 1
          else private.student_portal_attempt."failedCount" + 1
        end,
        "lockedUntil" = case
          when (case
            when private.student_portal_attempt."updatedAt" < now() - interval '15 minutes' then 1
            else private.student_portal_attempt."failedCount" + 1
          end) >= 5 then now() + interval '15 minutes'
          else null
        end,
        "updatedAt" = now();
    return null;
  end if;

  delete from private.student_portal_attempt where "studentId" = v_student.id;
  return v_student;
end;
$$;

revoke all on function private.assert_student_portal_pin(text, text) from public, anon, authenticated;

create or replace function public.add_star_log_tx(
  p_student_id text,
  p_points integer,
  p_category text,
  p_reason text,
  p_comment text default null,
  p_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_class_id text;
  v_id text := 'star-' || gen_random_uuid()::text;
  v_date date := coalesce(p_date, timezone('Asia/Ho_Chi_Minh', now())::date);
  v_created_at timestamptz := now();
begin
  select student."classId" into v_class_id
  from public."Student" as student
  where student.id = p_student_id;

  if not found or v_class_id is null or not public.can_manage_reward_class(v_class_id) then
    return jsonb_build_object('success', false, 'error', 'Bạn không có quyền cộng sao cho học sinh này.');
  end if;
  if p_points is null or p_points = 0 or p_points < -10 or p_points > 10 then
    return jsonb_build_object('success', false, 'error', 'Số sao phải là số nguyên khác 0 trong khoảng -10 đến 10.');
  end if;
  if p_reason is null or length(btrim(p_reason)) < 2 or length(btrim(p_reason)) > 200 then
    return jsonb_build_object('success', false, 'error', 'Lý do cộng/trừ sao không hợp lệ.');
  end if;
  if v_date > timezone('Asia/Ho_Chi_Minh', now())::date then
    return jsonb_build_object('success', false, 'error', 'Không thể ghi sao cho ngày trong tương lai.');
  end if;

  insert into public."StarLog" (
    id, "classId", "studentId", points, category, reason, comment, date, "createdAt"
  ) values (
    v_id, v_class_id, p_student_id, p_points,
    left(coalesce(nullif(btrim(p_category), ''), 'Khác'), 100),
    btrim(p_reason), nullif(left(btrim(p_comment), 500), ''), v_date, v_created_at
  );

  return jsonb_build_object(
    'success', true,
    'star_log', jsonb_build_object(
      'id', v_id, 'classId', v_class_id, 'studentId', p_student_id,
      'points', p_points, 'category', left(coalesce(nullif(btrim(p_category), ''), 'Khác'), 100),
      'reason', btrim(p_reason), 'comment', nullif(left(btrim(p_comment), 500), ''),
      'date', v_date, 'createdAt', v_created_at
    )
  );
end;
$$;

revoke all on function public.add_star_log_tx(text, integer, text, text, text, date) from public, anon;
grant execute on function public.add_star_log_tx(text, integer, text, text, text, date) to authenticated;

create or replace function public.delete_star_log_tx(p_log_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_class_id text;
begin
  select log."classId" into v_class_id
  from public."StarLog" as log
  where log.id = p_log_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Không tìm thấy lịch sử sao.');
  end if;
  if not public.can_manage_reward_class(v_class_id) then
    return jsonb_build_object('success', false, 'error', 'Bạn không có quyền xóa lịch sử sao này.');
  end if;

  delete from public."StarLog" where id = p_log_id;
  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.delete_star_log_tx(text) from public, anon;
grant execute on function public.delete_star_log_tx(text) to authenticated;

-- Replace redeem RPC with an idempotent signature. The student row lock continues
-- to serialize balance checks and inventory updates for the same student.
alter table public."RewardRedemption"
  alter column "idempotencyKey" drop default;

create or replace function public.redeem_reward_idempotent_tx(
  p_student_share_token text,
  p_items jsonb,
  p_student_note text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_student_id text;
  v_existing public."RewardRedemption";
  v_result jsonb;
begin
  if p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9_-]{16,100}$' then
    return jsonb_build_object('success', false, 'error', 'Mã yêu cầu đổi quà không hợp lệ.');
  end if;

  select student.id into v_student_id
  from public."Student" student
  where lower(student."shareToken") = lower(btrim(p_student_share_token));
  if not found then
    return jsonb_build_object('success', false, 'error', 'Liên kết học sinh không hợp lệ hoặc đã hết hạn.');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_student_id || ':' || p_idempotency_key, 0));
  select redemption.* into v_existing
  from public."RewardRedemption" redemption
  where redemption."studentId" = v_student_id
    and redemption."idempotencyKey" = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'success', true, 'redemption_id', v_existing.id,
      'total_stars', v_existing."totalStars", 'month', v_existing.month,
      'requested_at', v_existing."requestedAt", 'idempotent_replay', true
    );
  end if;

  v_result := public.redeem_reward_tx(p_student_share_token, p_items, p_student_note);
  if coalesce((v_result ->> 'success')::boolean, false) then
    update public."RewardRedemption"
    set "idempotencyKey" = p_idempotency_key
    where id = v_result ->> 'redemption_id';
  end if;
  return v_result;
end;
$$;

revoke all on function public.redeem_reward_idempotent_tx(text, jsonb, text, text) from public;
grant execute on function public.redeem_reward_idempotent_tx(text, jsonb, text, text) to anon, authenticated;

create or replace function public.get_public_class_rewards_bundle(p_class_share_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_class public."Class";
begin
  select class.* into v_class
  from public."Class" as class
  where lower(class."shareToken") = lower(btrim(p_class_share_token));
  if not found then
    return jsonb_build_object('success', false, 'error', 'Liên kết lớp không hợp lệ hoặc đã hết hạn.');
  end if;

  return jsonb_build_object(
    'success', true,
    'school', (select jsonb_build_object('name', info.name, 'logoUrl', info."logoUrl", 'schoolYear', info."schoolYear") from public."SchoolInfo" info limit 1),
    'class', jsonb_build_object('id', v_class.id, 'name', v_class.name, 'grade', v_class.grade, 'schoolYear', v_class."schoolYear", 'schoolName', v_class."schoolName", 'teacherName', v_class."teacherName", 'totalStudents', v_class."totalStudents"),
    'students', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'classId', s."classId", 'studentCode', s."studentCode", 'fullName', s."fullName", 'avatarUrl', s."avatarUrl") order by s."fullName") from public."Student" s where s."classId" = v_class.id), '[]'::jsonb),
    'starLogs', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'classId', l."classId", 'studentId', l."studentId", 'points', l.points, 'date', l.date, 'createdAt', l."createdAt")) from public."StarLog" l where l."classId" = v_class.id), '[]'::jsonb),
    'criteria', coalesce((select jsonb_agg(to_jsonb(c) order by c.points desc) from public."StarCriterion" c where c."classId" is null or c."classId" = v_class.id), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(to_jsonb(p) order by p."starPrice") from public."RewardProduct" p where p."classId" is null or p."classId" = v_class.id), '[]'::jsonb),
    'redemptions', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'classId', r."classId", 'studentId', r."studentId", 'totalStars', r."totalStars", 'month', r.month, 'status', r.status, 'requestedAt', r."requestedAt")) from public."RewardRedemption" r where r."classId" = v_class.id), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_public_class_rewards_bundle(text) from public;
grant execute on function public.get_public_class_rewards_bundle(text) to anon, authenticated;

create or replace function public.get_public_student_lookup_context()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'success', true,
    'school', (select jsonb_build_object('name', info.name, 'logoUrl', info."logoUrl", 'schoolYear', info."schoolYear") from public."SchoolInfo" info limit 1),
    'classes', coalesce((select jsonb_agg(jsonb_build_object('id', class.id, 'name', class.name, 'grade', class.grade, 'teacherName', class."teacherName") order by class.grade, class.name) from public."Class" class), '[]'::jsonb)
  );
$$;

revoke all on function public.get_public_student_lookup_context() from public;
grant execute on function public.get_public_student_lookup_context() to anon, authenticated;

create or replace function public.lookup_student_portal(
  p_class_id text,
  p_identifier text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_student public."Student";
begin
  if p_identifier is null or length(btrim(p_identifier)) < 2 then
    return jsonb_build_object('success', false, 'error', 'Thông tin xác thực không hợp lệ.');
  end if;
  select student.* into v_student
  from public."Student" student
  where student."classId" = p_class_id
    and (lower(btrim(student."studentCode")) = lower(btrim(p_identifier))
      or lower(btrim(student."fullName")) = lower(btrim(p_identifier)))
  limit 1;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Thông tin xác thực không hợp lệ.');
  end if;
  v_student := private.assert_student_portal_pin(v_student."shareToken", p_pin);
  if v_student.id is null then
    return jsonb_build_object('success', false, 'error', 'Thông tin xác thực không hợp lệ hoặc đã bị khóa tạm thời.');
  end if;
  return jsonb_build_object('success', true, 'studentToken', v_student."shareToken", 'studentName', v_student."fullName");
end;
$$;

revoke all on function public.lookup_student_portal(text, text, text) from public;
grant execute on function public.lookup_student_portal(text, text, text) to anon, authenticated;

create or replace function public.get_student_portal_bundle(p_student_share_token text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_student public."Student";
  v_class public."Class";
begin
  v_student := private.assert_student_portal_pin(p_student_share_token, p_pin);
  if v_student.id is null then
    return jsonb_build_object('success', false, 'error', 'Thông tin xác thực không hợp lệ hoặc đã bị khóa tạm thời.');
  end if;
  select class.* into v_class from public."Class" class where class.id = v_student."classId";

  return jsonb_build_object(
    'success', true,
    'school', (select jsonb_build_object('name', info.name, 'logoUrl', info."logoUrl", 'schoolYear', info."schoolYear") from public."SchoolInfo" info limit 1),
    'class', to_jsonb(v_class) - 'shareToken',
    'student', to_jsonb(v_student) - 'customPin' - 'shareToken',
    'subjectAssessments', coalesce((select jsonb_agg(to_jsonb(a)) from public."SubjectAssessment" a where a."studentId" = v_student.id), '[]'::jsonb),
    'traitAssessments', coalesce((select jsonb_agg(to_jsonb(a)) from public."TraitAssessment" a where a."studentId" = v_student.id), '[]'::jsonb),
    'termSummaries', coalesce((select jsonb_agg(to_jsonb(a)) from public."TermSummary" a where a."studentId" = v_student.id), '[]'::jsonb),
    'attendances', coalesce((select jsonb_agg(to_jsonb(a)) from public."DailyAttendance" a where a."studentId" = v_student.id), '[]'::jsonb),
    'starLogs', coalesce((select jsonb_agg(to_jsonb(l)) from public."StarLog" l where l."studentId" = v_student.id and l."classId" = v_student."classId"), '[]'::jsonb),
    'criteria', coalesce((select jsonb_agg(to_jsonb(c)) from public."StarCriterion" c where c."classId" is null or c."classId" = v_student."classId"), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(to_jsonb(p)) from public."RewardProduct" p where p."classId" is null or p."classId" = v_student."classId"), '[]'::jsonb),
    'redemptions', coalesce((select jsonb_agg(to_jsonb(r)) from public."RewardRedemption" r where r."studentId" = v_student.id and r."classId" = v_student."classId"), '[]'::jsonb),
    'homeworks', coalesce((select jsonb_agg(to_jsonb(h)) from public."HomeworkAssignment" h where h."classId" = v_student."classId"), '[]'::jsonb),
    'customSubjects', coalesce((select jsonb_agg(to_jsonb(s)) from public."CustomSubject" s where s."classId" is null or s."classId" = v_student."classId"), '[]'::jsonb),
    'timetable', coalesce((select jsonb_agg(to_jsonb(t)) from public."TimetableSlot" t where t."classId" = v_student."classId"), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e)) from public."ClassEvent" e where e."classId" = v_student."classId"), '[]'::jsonb),
    'leaveRequests', coalesce((select jsonb_agg(to_jsonb(l)) from public."LeaveRequest" l where l."studentId" = v_student.id), '[]'::jsonb),
    'conferenceSlots', coalesce((select jsonb_agg(to_jsonb(c)) from public."ConferenceSlot" c where c."classId" = v_student."classId"), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_student_portal_bundle(text, text) from public;
grant execute on function public.get_student_portal_bundle(text, text) to anon, authenticated;

create or replace function public.set_student_portal_pin(
  p_student_share_token text,
  p_current_pin text,
  p_new_pin text,
  p_parent_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_student public."Student";
begin
  v_student := private.assert_student_portal_pin(p_student_share_token, p_current_pin);
  if v_student.id is null then
    return jsonb_build_object('success', false, 'error', 'Thông tin xác thực không hợp lệ hoặc đã bị khóa tạm thời.');
  end if;
  if p_new_pin is null or p_new_pin !~ '^[0-9]{4,6}$' then
    return jsonb_build_object('success', false, 'error', 'Mã PIN mới phải gồm 4 đến 6 chữ số.');
  end if;

  update public."Student"
  set "customPin" = p_new_pin,
      "isActivated" = true,
      "parentPhone" = coalesce(nullif(left(btrim(p_parent_phone), 30), ''), "parentPhone"),
      "updatedAt" = now()
  where id = v_student.id;
  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.set_student_portal_pin(text, text, text, text) from public;
grant execute on function public.set_student_portal_pin(text, text, text, text) to anon, authenticated;

-- RLS: no direct anonymous table access; staff are scoped by Teacher assignment.
alter table public."Class" enable row level security;
alter table public."Student" enable row level security;
alter table public."StarLog" enable row level security;
alter table public."StarCriterion" enable row level security;
alter table public."RewardProduct" enable row level security;
alter table public."RewardRedemption" enable row level security;

grant execute on function public.can_manage_reward_class(text) to authenticated;

drop policy if exists class_staff_access on public."Class";
create policy class_staff_access on public."Class" for all to authenticated
  using (public.can_manage_reward_class(id))
  with check (public.can_manage_reward_class(id));

drop policy if exists student_staff_access on public."Student";
create policy student_staff_access on public."Student" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists star_log_staff_access on public."StarLog";
create policy star_log_staff_access on public."StarLog" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists star_criterion_staff_access on public."StarCriterion";
drop policy if exists star_criterion_staff_read on public."StarCriterion";
drop policy if exists star_criterion_staff_write on public."StarCriterion";
create policy star_criterion_staff_read on public."StarCriterion" for select to authenticated
  using ("classId" is null or public.can_manage_reward_class("classId"));
create policy star_criterion_staff_write on public."StarCriterion" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists reward_product_staff_access on public."RewardProduct";
drop policy if exists reward_product_staff_read on public."RewardProduct";
drop policy if exists reward_product_staff_write on public."RewardProduct";
create policy reward_product_staff_read on public."RewardProduct" for select to authenticated
  using ("classId" is null or public.can_manage_reward_class("classId"));
create policy reward_product_staff_write on public."RewardProduct" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists reward_redemption_staff_access on public."RewardRedemption";
create policy reward_redemption_staff_access on public."RewardRedemption" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

revoke all on table public."Class", public."Student", public."StarLog", public."StarCriterion", public."RewardProduct", public."RewardRedemption" from anon;
grant select, insert, update, delete on table public."Class", public."Student", public."StarLog", public."StarCriterion", public."RewardProduct", public."RewardRedemption" to authenticated;

notify pgrst, 'reload schema';
