-- Production hardening for Nề nếp / Tích sao / Đổi quà.
-- Scope decision: StarCriterion and RewardProduct with classId IS NULL are legacy
-- global catalog entries; all newly-created entries are class-scoped.

alter table public."StarLog"
  add column if not exists "classId" text;

alter table public."StarCriterion"
  add column if not exists "classId" text;

alter table public."RewardProduct"
  add column if not exists "classId" text;

update public."StarLog" as star_log
set "classId" = student."classId"
from public."Student" as student
where student.id = star_log."studentId"
  and star_log."classId" is null;

update public."RewardRedemption" as redemption
set "classId" = student."classId"
from public."Student" as student
where student.id = redemption."studentId"
  and redemption."classId" is null;

do $$
begin
  if exists (select 1 from public."StarLog" where "classId" is null) then
    raise exception 'Cannot enforce StarLog.classId: orphan StarLog rows remain';
  end if;
  if exists (select 1 from public."RewardRedemption" where "classId" is null) then
    raise exception 'Cannot enforce RewardRedemption.classId: orphan redemption rows remain';
  end if;
end
$$;

alter table public."StarLog"
  alter column "classId" set not null;

alter table public."RewardRedemption"
  alter column "classId" set not null;

create index if not exists "StarLog_classId_studentId_date_idx"
  on public."StarLog" ("classId", "studentId", "date");

create index if not exists "StarCriterion_classId_idx"
  on public."StarCriterion" ("classId");

create index if not exists "RewardProduct_classId_available_idx"
  on public."RewardProduct" ("classId", "isAvailable");

create index if not exists "RewardRedemption_classId_month_status_idx"
  on public."RewardRedemption" ("classId", "month", "status");

create unique index if not exists "Class_shareToken_lower_key"
  on public."Class" (lower("shareToken"))
  where "shareToken" is not null and btrim("shareToken") <> '';

create unique index if not exists "Student_shareToken_lower_key"
  on public."Student" (lower("shareToken"))
  where "shareToken" is not null and btrim("shareToken") <> '';

create or replace function public.can_manage_reward_class(p_class_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public."Teacher" as teacher
    where lower(teacher.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and teacher.role in ('ADMIN', 'ADMIN_TEACHER', 'TEACHER')
      and (
        teacher.role = 'ADMIN'
        or lower(teacher.email) = 'anhnnh4@gmail.com'
        or teacher."assignedClassId" = p_class_id
      )
  );
$$;

revoke all on function public.can_manage_reward_class(text) from public, anon, authenticated;

-- Remove the legacy overload that trusted class/student identity and prices from the client.
drop function if exists public.redeem_reward_tx(
  text, text, text, text, text, text, jsonb, text, text
);

create or replace function public.redeem_reward_tx(
  p_student_share_token text,
  p_items jsonb,
  p_student_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_student_id text;
  v_class_id text;
  v_student_name text;
  v_student_code text;
  v_student_avatar text;
  v_product_id text;
  v_product_name text;
  v_product_image text;
  v_product_price integer;
  v_product_stock integer;
  v_quantity integer;
  v_total integer := 0;
  v_earned integer := 0;
  v_spent integer := 0;
  v_month text := to_char(timezone('Asia/Ho_Chi_Minh', now()), 'YYYY-MM');
  v_redemption_id text := 'rd-' || gen_random_uuid()::text;
  v_requested_at timestamptz := now();
  v_canonical_items jsonb := '[]'::jsonb;
  v_item jsonb;
begin
  if p_student_share_token is null or btrim(p_student_share_token) = '' then
    return jsonb_build_object('success', false, 'error', 'Liên kết học sinh không hợp lệ hoặc đã hết hạn.');
  end if;

  select student.id, student."classId", student."fullName", student."studentCode", student."avatarUrl"
  into v_student_id, v_class_id, v_student_name, v_student_code, v_student_avatar
  from public."Student" as student
  where lower(student."shareToken") = lower(btrim(p_student_share_token))
  for update;

  if not found or v_class_id is null then
    return jsonb_build_object('success', false, 'error', 'Liên kết học sinh không hợp lệ hoặc đã hết hạn.');
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 20 then
    return jsonb_build_object('success', false, 'error', 'Giỏ quà không hợp lệ.');
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as items(item)
    group by item ->> 'productId'
    having count(*) > 1
  ) then
    return jsonb_build_object('success', false, 'error', 'Giỏ quà chứa sản phẩm trùng lặp.');
  end if;

  -- Lock every requested product in a deterministic order to prevent overselling/deadlocks.
  perform 1
  from public."RewardProduct" as product
  where product.id in (
    select item ->> 'productId' from jsonb_array_elements(p_items) as items(item)
  )
  order by product.id
  for update;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := v_item ->> 'productId';
    if coalesce(v_item ->> 'quantity', '') !~ '^[1-9][0-9]*$'
       or (v_item ->> 'quantity')::integer > 100 then
      return jsonb_build_object('success', false, 'error', 'Số lượng sản phẩm không hợp lệ.');
    end if;
    v_quantity := (v_item ->> 'quantity')::integer;

    select product.name, product."imageUrl", product."starPrice", product.stock
    into v_product_name, v_product_image, v_product_price, v_product_stock
    from public."RewardProduct" as product
    where product.id = v_product_id
      and (product."classId" is null or product."classId" = v_class_id)
      and product."isAvailable" = true;

    if not found then
      return jsonb_build_object('success', false, 'error', 'Có món quà không còn khả dụng cho lớp này.');
    end if;
    if v_product_price <= 0 then
      return jsonb_build_object('success', false, 'error', 'Giá sao của món quà không hợp lệ.');
    end if;
    if v_product_stock < v_quantity then
      return jsonb_build_object('success', false, 'error', 'Số lượng tồn kho không đủ cho món ' || v_product_name || '.');
    end if;

    v_total := v_total + (v_product_price * v_quantity);
    v_canonical_items := v_canonical_items || jsonb_build_array(jsonb_build_object(
      'productId', v_product_id,
      'productName', v_product_name,
      'quantity', v_quantity,
      'unitStarPrice', v_product_price,
      'imageUrl', v_product_image
    ));
  end loop;

  select coalesce(sum(star_log.points), 0)::integer
  into v_earned
  from public."StarLog" as star_log
  where star_log."studentId" = v_student_id
    and star_log."classId" = v_class_id
    and left(star_log.date::text, 7) = v_month;

  select coalesce(sum(redemption."totalStars"), 0)::integer
  into v_spent
  from public."RewardRedemption" as redemption
  where redemption."studentId" = v_student_id
    and redemption."classId" = v_class_id
    and redemption.month = v_month
    and redemption.status <> 'CANCELLED';

  if greatest(0, v_earned - v_spent) < v_total then
    return jsonb_build_object('success', false, 'error', 'Số sao khả dụng không đủ để đổi giỏ quà này.');
  end if;

  for v_item in select value from jsonb_array_elements(v_canonical_items)
  loop
    update public."RewardProduct"
    set stock = stock - (v_item ->> 'quantity')::integer,
        "isAvailable" = (stock - (v_item ->> 'quantity')::integer) > 0
    where id = v_item ->> 'productId';
  end loop;

  insert into public."RewardRedemption" (
    id, "classId", "studentId", "studentName", "studentCode", "studentAvatar",
    items, "totalStars", month, status, "studentNote", "requestedAt"
  ) values (
    v_redemption_id, v_class_id, v_student_id, v_student_name, v_student_code, v_student_avatar,
    v_canonical_items, v_total, v_month, 'PENDING', nullif(left(btrim(p_student_note), 500), ''), v_requested_at
  );

  return jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'total_stars', v_total,
    'month', v_month,
    'requested_at', v_requested_at
  );
end;
$$;

revoke all on function public.redeem_reward_tx(text, jsonb, text) from public;
grant execute on function public.redeem_reward_tx(text, jsonb, text) to anon, authenticated;

create or replace function public.fulfill_reward_redemption_tx(p_redemption_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_class_id text;
  v_status text;
  v_delivered_at timestamptz := now();
begin
  select redemption."classId", redemption.status
  into v_class_id, v_status
  from public."RewardRedemption" as redemption
  where redemption.id = p_redemption_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn đổi quà.');
  end if;
  if not public.can_manage_reward_class(v_class_id) then
    return jsonb_build_object('success', false, 'error', 'Bạn không có quyền xử lý đơn của lớp này.');
  end if;
  if v_status <> 'PENDING' then
    return jsonb_build_object('success', false, 'error', 'Chỉ có thể trao quà cho đơn đang chờ.');
  end if;

  update public."RewardRedemption"
  set status = 'DELIVERED', "deliveredAt" = v_delivered_at
  where id = p_redemption_id;

  return jsonb_build_object('success', true, 'delivered_at', v_delivered_at);
end;
$$;

revoke all on function public.fulfill_reward_redemption_tx(text) from public, anon;
grant execute on function public.fulfill_reward_redemption_tx(text) to authenticated;

create or replace function public.cancel_reward_redemption_tx(p_redemption_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_class_id text;
  v_status text;
  v_items jsonb;
  v_item jsonb;
begin
  select redemption."classId", redemption.status, redemption.items
  into v_class_id, v_status, v_items
  from public."RewardRedemption" as redemption
  where redemption.id = p_redemption_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Không tìm thấy đơn đổi quà.');
  end if;
  if not public.can_manage_reward_class(v_class_id) then
    return jsonb_build_object('success', false, 'error', 'Bạn không có quyền xử lý đơn của lớp này.');
  end if;
  if v_status <> 'PENDING' then
    return jsonb_build_object('success', false, 'error', 'Chỉ có thể huỷ đơn đang chờ.');
  end if;

  perform 1
  from public."RewardProduct" as product
  where product.id in (
    select item ->> 'productId' from jsonb_array_elements(v_items) as items(item)
  )
  order by product.id
  for update;

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    update public."RewardProduct"
    set stock = stock + (v_item ->> 'quantity')::integer,
        "isAvailable" = true
    where id = v_item ->> 'productId'
      and ("classId" is null or "classId" = v_class_id);
  end loop;

  update public."RewardRedemption"
  set status = 'CANCELLED'
  where id = p_redemption_id;

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.cancel_reward_redemption_tx(text) from public, anon;
grant execute on function public.cancel_reward_redemption_tx(text) to authenticated;

create or replace function public.close_month_star_balance_tx(p_class_id text, p_month text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_student record;
  v_earned integer;
  v_spent integer;
  v_available integer;
  v_now timestamptz := now();
  v_id text;
  v_rows jsonb := '[]'::jsonb;
begin
  if p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
     or p_month > to_char(timezone('Asia/Ho_Chi_Minh', now()), 'YYYY-MM') then
    return jsonb_build_object('success', false, 'error', 'Tháng chốt số dư không hợp lệ.');
  end if;
  if not public.can_manage_reward_class(p_class_id) then
    return jsonb_build_object('success', false, 'error', 'Bạn không có quyền chốt số dư của lớp này.');
  end if;

  perform 1 from public."Class" where id = p_class_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Không tìm thấy lớp học.');
  end if;

  for v_student in
    select student.id, student."fullName", student."studentCode", student."avatarUrl"
    from public."Student" as student
    where student."classId" = p_class_id
    order by student.id
    for update
  loop
    select coalesce(sum(star_log.points), 0)::integer
    into v_earned
    from public."StarLog" as star_log
    where star_log."classId" = p_class_id
      and star_log."studentId" = v_student.id
      and left(star_log.date::text, 7) = p_month;

    select coalesce(sum(redemption."totalStars"), 0)::integer
    into v_spent
    from public."RewardRedemption" as redemption
    where redemption."classId" = p_class_id
      and redemption."studentId" = v_student.id
      and redemption.month = p_month
      and redemption.status <> 'CANCELLED';

    v_available := greatest(0, v_earned - v_spent);
    if v_available > 0 then
      v_id := 'rd-close-' || gen_random_uuid()::text;
      insert into public."RewardRedemption" (
        id, "classId", "studentId", "studentName", "studentCode", "studentAvatar",
        items, "totalStars", month, status, "studentNote", "requestedAt", "deliveredAt"
      ) values (
        v_id, p_class_id, v_student.id, v_student."fullName", v_student."studentCode", v_student."avatarUrl",
        jsonb_build_array(jsonb_build_object(
          'productId', 'system-period-close',
          'productName', 'Chốt số dư thi đua tháng',
          'quantity', 1,
          'unitStarPrice', v_available
        )),
        v_available, p_month, 'DELIVERED',
        'Chốt số dư khả dụng cuối tháng mở chu kỳ thi đua mới', v_now, v_now
      );

      v_rows := v_rows || jsonb_build_array(jsonb_build_object(
        'id', v_id,
        'classId', p_class_id,
        'studentId', v_student.id,
        'studentName', v_student."fullName",
        'studentCode', v_student."studentCode",
        'studentAvatar', v_student."avatarUrl",
        'items', jsonb_build_array(jsonb_build_object(
          'productId', 'system-period-close',
          'productName', 'Chốt số dư thi đua tháng',
          'quantity', 1,
          'unitStarPrice', v_available
        )),
        'totalStars', v_available,
        'month', p_month,
        'status', 'DELIVERED',
        'studentNote', 'Chốt số dư khả dụng cuối tháng mở chu kỳ thi đua mới',
        'requestedAt', v_now,
        'deliveredAt', v_now
      ));
    end if;
  end loop;

  return jsonb_build_object('success', true, 'redemptions', v_rows);
end;
$$;

revoke all on function public.close_month_star_balance_tx(text, text) from public, anon;
grant execute on function public.close_month_star_balance_tx(text, text) to authenticated;

notify pgrst, 'reload schema';
