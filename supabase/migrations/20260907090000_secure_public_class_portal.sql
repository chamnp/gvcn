-- Secure, minimal data boundary for the public class portal (/hw/[shareToken]).
-- The shared class link is intentionally read-only. Personal actions continue in
-- the student portal after the learner's private token + PIN are verified.

alter table public."Class"
  add column if not exists "publicFeatureFlags" jsonb not null default
  '{"homework":true,"timetable":true,"attendance":true,"assessment":false,"reports":false,"moments":false,"parentMeetings":false}'::jsonb;

-- These fields were already used by the quiz UI but were missing from the
-- production table, causing assignment writes to fail and leaving no secure
-- server-side answer key to grade against.
alter table public."HomeworkAssignment"
  add column if not exists "isQuiz" boolean not null default false,
  add column if not exists "quizQuestions" jsonb not null default '[]'::jsonb,
  add column if not exists "timeLimitMinutes" integer not null default 0;

create or replace function public.get_public_portal_index_context()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'success', true,
    'school', (
      select jsonb_build_object(
        'name', info.name,
        'logoUrl', info."logoUrl",
        'schoolYear', info."schoolYear",
        'address', info.address
      )
      from public."SchoolInfo" info
      limit 1
    )
  );
$$;

revoke all on function public.get_public_portal_index_context() from public;
grant execute on function public.get_public_portal_index_context() to anon, authenticated;

create or replace function public.get_public_class_portal_bundle(p_class_share_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_class public."Class";
  v_flags jsonb;
begin
  if p_class_share_token is null or length(btrim(p_class_share_token)) < 8 then
    return jsonb_build_object('success', false, 'error', 'Liên kết lớp không hợp lệ hoặc đã hết hạn.');
  end if;

  select class.* into v_class
  from public."Class" as class
  where lower(class."shareToken") = lower(btrim(p_class_share_token))
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Liên kết lớp không hợp lệ hoặc đã hết hạn.');
  end if;

  v_flags := jsonb_build_object(
    'homework', true,
    'timetable', true,
    'attendance', true,
    'assessment', false,
    'reports', false,
    'moments', false,
    'parentMeetings', false
  ) || coalesce(v_class."publicFeatureFlags", '{}'::jsonb);

  return jsonb_build_object(
    'success', true,
    'school', (
      select jsonb_build_object(
        'name', info.name,
        'logoUrl', info."logoUrl",
        'schoolYear', info."schoolYear",
        'address', info.address,
        'phone', info.phone
      )
      from public."SchoolInfo" info
      limit 1
    ),
    'class', jsonb_build_object(
      'id', v_class.id,
      'name', v_class.name,
      'grade', v_class.grade,
      'schoolYear', v_class."schoolYear",
      'schoolName', v_class."schoolName",
      'teacherName', v_class."teacherName",
      'totalStudents', v_class."totalStudents"
    ),
    'featureFlags', v_flags,
    'homeworks', case when coalesce((v_flags ->> 'homework')::boolean, false) then
      coalesce((
        select jsonb_agg(
          (to_jsonb(h) - 'quizQuestions') || jsonb_build_object(
            'quizQuestions', coalesce((
              select jsonb_agg(question - 'correctAnswer' - 'answer')
              from jsonb_array_elements(coalesce(to_jsonb(h) -> 'quizQuestions', '[]'::jsonb)) question
            ), '[]'::jsonb)
          )
          order by h."assignedDate" desc, h."createdAt" desc
        )
        from public."HomeworkAssignment" h
        where h."classId" = v_class.id
      ), '[]'::jsonb)
    else '[]'::jsonb end,
    'customSubjects', case when coalesce((v_flags ->> 'homework')::boolean, false)
      or coalesce((v_flags ->> 'timetable')::boolean, false) then
      coalesce((select jsonb_agg(to_jsonb(s)) from public."CustomSubject" s), '[]'::jsonb)
    else '[]'::jsonb end,
    'timetable', case when coalesce((v_flags ->> 'timetable')::boolean, false) then
      coalesce((select jsonb_agg(to_jsonb(t)) from public."TimetableSlot" t where t."classId" = v_class.id), '[]'::jsonb)
    else '[]'::jsonb end,
    'events', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id, 'classId', e."classId", 'title', e.title,
          'date', e.date, 'time', e.time, 'location', e.location,
          'description', e.description, 'type', coalesce(e."eventType", 'OTHER'),
          'eventType', coalesce(e."eventType", 'OTHER'),
          'isImportant', e."isImportant", 'createdAt', e."createdAt"
        ) order by e.date
      )
      from public."ClassEvent" e
      where e."classId" = v_class.id
    ), '[]'::jsonb),
    'moments', case when coalesce((v_flags ->> 'moments')::boolean, false) then
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id, 'classId', m."classId", 'teacherName', m."teacherName",
            'category', m.category, 'title', m.title, 'content', m.content,
            'imageUrls', m."imageUrls", 'likesCount', m."likesCount",
            'createdAt', m."createdAt"
          ) order by m."createdAt" desc
        )
        from public."ClassMoment" m
        where m."classId" = v_class.id
      ), '[]'::jsonb)
    else '[]'::jsonb end,
    'conferenceSlots', case when coalesce((v_flags ->> 'parentMeetings')::boolean, false) then
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id, 'classId', c."classId", 'title', c.title,
            'date', c.date, 'startTime', c."startTime", 'endTime', c."endTime",
            'type', c.type, 'location', c.location, 'isBooked', c."isBooked",
            'createdAt', c."createdAt"
          ) order by c.date, c."startTime"
        )
        from public."ConferenceSlot" c
        where c."classId" = v_class.id
      ), '[]'::jsonb)
    else '[]'::jsonb end
  );
end;
$$;

revoke all on function public.get_public_class_portal_bundle(text) from public;
grant execute on function public.get_public_class_portal_bundle(text) to anon, authenticated;

create or replace function public.submit_student_leave_request(
  p_student_share_token text,
  p_pin text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_student public."Student";
  v_id text := 'lr-' || gen_random_uuid()::text;
  v_start date;
  v_end date;
  v_detail text;
begin
  v_student := private.assert_student_portal_pin(p_student_share_token, p_pin);
  if v_student.id is null then
    return jsonb_build_object('success', false, 'error', 'Phiên xác thực không hợp lệ hoặc đã hết hạn.');
  end if;

  begin
    v_start := (p_payload ->> 'startDate')::date;
    v_end := coalesce(nullif(p_payload ->> 'endDate', '')::date, v_start);
  exception when others then
    return jsonb_build_object('success', false, 'error', 'Ngày xin nghỉ không hợp lệ.');
  end;
  v_detail := btrim(coalesce(p_payload ->> 'reasonDetail', ''));
  if v_start > v_end or v_start < current_date - 7 or v_end > current_date + 90 then
    return jsonb_build_object('success', false, 'error', 'Khoảng ngày xin nghỉ không hợp lệ.');
  end if;
  if length(v_detail) < 5 or length(v_detail) > 1000 then
    return jsonb_build_object('success', false, 'error', 'Vui lòng mô tả lý do từ 5 đến 1000 ký tự.');
  end if;

  insert into public."LeaveRequest" (
    id, "classId", "studentId", "studentName", "parentName", "parentPhone",
    "startDate", "endDate", "reasonType", "reasonDetail", "hasBoardingMealCancel",
    "medicationNotes", "pickupPerson", status, "createdAt"
  ) values (
    v_id, v_student."classId", v_student.id, v_student."fullName",
    coalesce(nullif(v_student."parentName", ''), 'Phụ huynh em ' || v_student."fullName"),
    coalesce(v_student."parentPhone", ''), v_start::text, v_end::text,
    case when p_payload ->> 'reasonType' in ('OM_DAU', 'VIEC_GIA_DINH', 'KHAM_BENH', 'NGHI_PHEP', 'KHAC')
      then p_payload ->> 'reasonType' else 'KHAC' end,
    v_detail, coalesce((p_payload ->> 'hasBoardingMealCancel')::boolean, false),
    nullif(left(btrim(p_payload ->> 'medicationNotes'), 1000), ''),
    case when jsonb_typeof(p_payload -> 'pickupPerson') = 'object' then p_payload -> 'pickupPerson' else null end,
    'PENDING', now()
  );
  return jsonb_build_object('success', true, 'requestId', v_id);
end;
$$;

revoke all on function public.submit_student_leave_request(text, text, jsonb) from public;
grant execute on function public.submit_student_leave_request(text, text, jsonb) to anon, authenticated;

create or replace function public.book_student_conference_slot(
  p_student_share_token text,
  p_pin text,
  p_slot_id text,
  p_parent_name text,
  p_parent_phone text,
  p_topics text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_student public."Student";
  v_slot public."ConferenceSlot";
begin
  v_student := private.assert_student_portal_pin(p_student_share_token, p_pin);
  if v_student.id is null then
    return jsonb_build_object('success', false, 'error', 'Phiên xác thực không hợp lệ hoặc đã hết hạn.');
  end if;
  if length(btrim(coalesce(p_parent_name, ''))) < 2
     or length(btrim(coalesce(p_parent_phone, ''))) < 8 then
    return jsonb_build_object('success', false, 'error', 'Vui lòng nhập họ tên và số điện thoại liên hệ hợp lệ.');
  end if;

  select slot.* into v_slot from public."ConferenceSlot" slot
  where slot.id = p_slot_id and slot."classId" = v_student."classId"
  for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Khung giờ không tồn tại.');
  end if;
  if v_slot."isBooked" then
    return jsonb_build_object('success', false, 'error', 'Khung giờ vừa được phụ huynh khác đăng ký.');
  end if;

  update public."ConferenceSlot" set
    "isBooked" = true,
    "bookedStudentId" = v_student.id,
    "bookedStudentName" = v_student."fullName",
    "bookedParentName" = left(btrim(p_parent_name), 150),
    "bookedParentPhone" = left(btrim(p_parent_phone), 30),
    "parentDiscussionTopics" = nullif(left(btrim(p_topics), 1000), '')
  where id = v_slot.id;
  return jsonb_build_object('success', true, 'slotId', v_slot.id);
end;
$$;

revoke all on function public.book_student_conference_slot(text, text, text, text, text, text) from public;
grant execute on function public.book_student_conference_slot(text, text, text, text, text, text) to anon, authenticated;

create or replace function public.submit_student_quiz(
  p_student_share_token text,
  p_pin text,
  p_homework_id text,
  p_answers jsonb,
  p_time_spent_seconds integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_student public."Student";
  v_homework public."HomeworkAssignment";
  v_question jsonb;
  v_answer text;
  v_correct text;
  v_total_points numeric := 0;
  v_earned_points numeric := 0;
  v_total_count integer := 0;
  v_correct_count integer := 0;
  v_requires_review boolean := false;
  v_score numeric := 0;
  v_id text := 'sub-' || gen_random_uuid()::text;
begin
  v_student := private.assert_student_portal_pin(p_student_share_token, p_pin);
  if v_student.id is null then
    return jsonb_build_object('success', false, 'error', 'Phiên xác thực không hợp lệ hoặc đã hết hạn.');
  end if;
  if jsonb_typeof(p_answers) <> 'object' then
    return jsonb_build_object('success', false, 'error', 'Bài làm không hợp lệ.');
  end if;
  select homework.* into v_homework from public."HomeworkAssignment" homework
  where homework.id = p_homework_id and homework."classId" = v_student."classId"
  for update;
  if not found or jsonb_array_length(coalesce(to_jsonb(v_homework) -> 'quizQuestions', '[]'::jsonb)) = 0 then
    return jsonb_build_object('success', false, 'error', 'Bài trắc nghiệm không tồn tại.');
  end if;

  for v_question in select * from jsonb_array_elements(to_jsonb(v_homework) -> 'quizQuestions') loop
    v_total_count := v_total_count + 1;
    v_total_points := v_total_points + coalesce((v_question ->> 'points')::numeric, 1);
    v_answer := upper(btrim(coalesce(p_answers ->> (v_question ->> 'id'), '')));
    v_correct := upper(btrim(coalesce(v_question ->> 'correctAnswer', v_question ->> 'answer', '')));
    if coalesce(v_question ->> 'type', 'MULTIPLE_CHOICE') = 'MULTIPLE_CHOICE' then
      if v_correct <> '' and (v_answer = v_correct or v_answer like v_correct || '%') then
        v_correct_count := v_correct_count + 1;
        v_earned_points := v_earned_points + coalesce((v_question ->> 'points')::numeric, 1);
      end if;
    else
      v_requires_review := true;
    end if;
  end loop;
  if v_total_points > 0 then v_score := round((v_earned_points / v_total_points) * 10, 1); end if;

  insert into public."QuizSubmission" (
    id, "homeworkId", "classId", "studentId", "studentName", answers,
    score, "totalPoints", "correctCount", "totalCount", "timeSpentSeconds", "submittedAt"
  ) values (
    v_id, v_homework.id, v_student."classId", v_student.id, v_student."fullName", p_answers,
    v_score, 10, v_correct_count, v_total_count, greatest(0, least(coalesce(p_time_spent_seconds, 0), 14400)), now()
  ) on conflict ("homeworkId", "studentId") do update set
    answers = excluded.answers, score = excluded.score, "totalPoints" = excluded."totalPoints",
    "correctCount" = excluded."correctCount", "totalCount" = excluded."totalCount",
    "timeSpentSeconds" = excluded."timeSpentSeconds", "submittedAt" = excluded."submittedAt";

  return jsonb_build_object(
    'success', true, 'submissionId', v_id, 'score', v_score,
    'correctCount', v_correct_count, 'totalCount', v_total_count,
    'requiresReview', v_requires_review
  );
end;
$$;

revoke all on function public.submit_student_quiz(text, text, text, jsonb, integer) from public;
grant execute on function public.submit_student_quiz(text, text, text, jsonb, integer) to anon, authenticated;

create or replace function public.acknowledge_student_note(
  p_student_share_token text, p_pin text, p_note_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_student public."Student";
begin
  v_student := private.assert_student_portal_pin(p_student_share_token, p_pin);
  if v_student.id is null then return jsonb_build_object('success', false, 'error', 'Phiên xác thực không hợp lệ.'); end if;
  update public."FormativeNote" set "parentAcknowledged" = true, "parentAcknowledgedAt" = now()
  where id = p_note_id and "studentId" = v_student.id and visibility is distinct from 'PRIVATE_TEACHER';
  if not found then return jsonb_build_object('success', false, 'error', 'Không tìm thấy nhận xét.'); end if;
  return jsonb_build_object('success', true);
end;
$$;
revoke all on function public.acknowledge_student_note(text, text, text) from public;
grant execute on function public.acknowledge_student_note(text, text, text) to anon, authenticated;

create or replace function public.set_student_portal_progress(
  p_student_share_token text, p_pin text, p_type text, p_reference_id text, p_is_done boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_student public."Student"; v_id text;
begin
  v_student := private.assert_student_portal_pin(p_student_share_token, p_pin);
  if v_student.id is null then return jsonb_build_object('success', false, 'error', 'Phiên xác thực không hợp lệ.'); end if;
  if p_type not in ('HW_DONE', 'PACK_DONE') or length(coalesce(p_reference_id, '')) < 2 then
    return jsonb_build_object('success', false, 'error', 'Dữ liệu tiến độ không hợp lệ.');
  end if;
  if p_type = 'HW_DONE' and not exists (
    select 1 from public."HomeworkAssignment" h where h.id = p_reference_id and h."classId" = v_student."classId"
  ) then return jsonb_build_object('success', false, 'error', 'Bài tập không thuộc lớp của học sinh.'); end if;
  v_id := v_student.id || '_' || lower(p_type) || '_' || encode(digest(p_reference_id, 'sha256'), 'hex');
  insert into public."StudentHomeworkProgress" (id, "studentId", "classId", type, "referenceId", "isDone", "updatedAt")
  values (v_id, v_student.id, v_student."classId", p_type, left(p_reference_id, 200), coalesce(p_is_done, false), now())
  on conflict (id) do update set "isDone" = excluded."isDone", "updatedAt" = excluded."updatedAt";
  return jsonb_build_object('success', true);
end;
$$;
revoke all on function public.set_student_portal_progress(text, text, text, text, boolean) from public;
grant execute on function public.set_student_portal_progress(text, text, text, text, boolean) to anon, authenticated;

-- Keep the PIN-protected student bundle private and remove answer keys / other
-- families' booking details from its response.
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
    'featureFlags', v_class."publicFeatureFlags",
    'student', to_jsonb(v_student) - 'customPin' - 'shareToken',
    'subjectAssessments', coalesce((select jsonb_agg(to_jsonb(a)) from public."SubjectAssessment" a where a."studentId" = v_student.id), '[]'::jsonb),
    'traitAssessments', coalesce((select jsonb_agg(to_jsonb(a)) from public."TraitAssessment" a where a."studentId" = v_student.id), '[]'::jsonb),
    'termSummaries', coalesce((select jsonb_agg(to_jsonb(a)) from public."TermSummary" a where a."studentId" = v_student.id), '[]'::jsonb),
    'attendances', coalesce((select jsonb_agg(to_jsonb(a)) from public."DailyAttendance" a where a."studentId" = v_student.id), '[]'::jsonb),
    'starLogs', coalesce((select jsonb_agg(to_jsonb(l)) from public."StarLog" l where l."studentId" = v_student.id and l."classId" = v_student."classId"), '[]'::jsonb),
    'criteria', coalesce((select jsonb_agg(to_jsonb(c)) from public."StarCriterion" c where c."classId" is null or c."classId" = v_student."classId"), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(to_jsonb(p)) from public."RewardProduct" p where p."classId" is null or p."classId" = v_student."classId"), '[]'::jsonb),
    'redemptions', coalesce((select jsonb_agg(to_jsonb(r)) from public."RewardRedemption" r where r."studentId" = v_student.id and r."classId" = v_student."classId"), '[]'::jsonb),
    'homeworks', coalesce((
      select jsonb_agg(
        (to_jsonb(h) - 'quizQuestions') || jsonb_build_object(
          'quizQuestions', coalesce((
            select jsonb_agg(question - 'correctAnswer' - 'answer')
            from jsonb_array_elements(coalesce(to_jsonb(h) -> 'quizQuestions', '[]'::jsonb)) question
          ), '[]'::jsonb)
        ) order by h."assignedDate" desc, h."createdAt" desc
      ) from public."HomeworkAssignment" h where h."classId" = v_student."classId"
    ), '[]'::jsonb),
    'customSubjects', coalesce((select jsonb_agg(to_jsonb(s)) from public."CustomSubject" s), '[]'::jsonb),
    'timetable', coalesce((select jsonb_agg(to_jsonb(t)) from public."TimetableSlot" t where t."classId" = v_student."classId"), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e)) from public."ClassEvent" e where e."classId" = v_student."classId"), '[]'::jsonb),
    'leaveRequests', coalesce((select jsonb_agg(to_jsonb(l)) from public."LeaveRequest" l where l."studentId" = v_student.id), '[]'::jsonb),
    'conferenceSlots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'classId', c."classId", 'title', c.title, 'date', c.date,
        'startTime', c."startTime", 'endTime', c."endTime", 'type', c.type,
        'location', c.location, 'isBooked', c."isBooked", 'createdAt', c."createdAt"
      ) order by c.date, c."startTime")
      from public."ConferenceSlot" c where c."classId" = v_student."classId"
    ), '[]'::jsonb),
    'formativeNotes', coalesce((
      select jsonb_agg(to_jsonb(n) order by n.date desc)
      from public."FormativeNote" n
      where n."studentId" = v_student.id and n.visibility is distinct from 'PRIVATE_TEACHER'
    ), '[]'::jsonb),
    'progress', coalesce((select jsonb_agg(to_jsonb(p)) from public."StudentHomeworkProgress" p where p."studentId" = v_student.id), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_student_portal_bundle(text, text) from public;
grant execute on function public.get_student_portal_bundle(text, text) to anon, authenticated;

-- Public clients must never read or mutate these tables directly. Staff retain
-- class-scoped access; public presentation is provided only by the RPC above.
alter table public."HomeworkAssignment" enable row level security;
alter table public."QuizSubmission" enable row level security;
alter table public."TimetableSlot" enable row level security;
alter table public."ClassEvent" enable row level security;
alter table public."LeaveRequest" enable row level security;
alter table public."ClassMoment" enable row level security;
alter table public."ConferenceSlot" enable row level security;
alter table public."FormativeNote" enable row level security;
alter table public."StudentHomeworkProgress" enable row level security;

drop policy if exists public_portal_homework_staff_access on public."HomeworkAssignment";
create policy public_portal_homework_staff_access on public."HomeworkAssignment" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists public_portal_quiz_staff_access on public."QuizSubmission";
create policy public_portal_quiz_staff_access on public."QuizSubmission" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists public_portal_timetable_staff_access on public."TimetableSlot";
create policy public_portal_timetable_staff_access on public."TimetableSlot" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists public_portal_event_staff_access on public."ClassEvent";
create policy public_portal_event_staff_access on public."ClassEvent" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists public_portal_leave_staff_access on public."LeaveRequest";
drop policy if exists "Allow all on LeaveRequest" on public."LeaveRequest";
create policy public_portal_leave_staff_access on public."LeaveRequest" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists public_portal_moment_staff_access on public."ClassMoment";
drop policy if exists "Allow all on ClassMoment" on public."ClassMoment";
create policy public_portal_moment_staff_access on public."ClassMoment" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists public_portal_conference_staff_access on public."ConferenceSlot";
drop policy if exists "Allow all on ConferenceSlot" on public."ConferenceSlot";
create policy public_portal_conference_staff_access on public."ConferenceSlot" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists public_portal_note_staff_access on public."FormativeNote";
drop policy if exists "Allow all on FormativeNote" on public."FormativeNote";
create policy public_portal_note_staff_access on public."FormativeNote" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

drop policy if exists public_portal_progress_staff_access on public."StudentHomeworkProgress";
create policy public_portal_progress_staff_access on public."StudentHomeworkProgress" for all to authenticated
  using (public.can_manage_reward_class("classId"))
  with check (public.can_manage_reward_class("classId"));

revoke all on table
  public."HomeworkAssignment", public."QuizSubmission", public."TimetableSlot",
  public."ClassEvent", public."LeaveRequest", public."ClassMoment", public."ConferenceSlot",
  public."FormativeNote", public."StudentHomeworkProgress"
from anon;

grant select, insert, update, delete on table
  public."HomeworkAssignment", public."QuizSubmission", public."TimetableSlot",
  public."ClassEvent", public."LeaveRequest", public."ClassMoment", public."ConferenceSlot",
  public."FormativeNote", public."StudentHomeworkProgress"
to authenticated;

notify pgrst, 'reload schema';
