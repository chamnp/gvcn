-- Allow starResetDay to span the full calendar month (1..31) and support starResetDate/starAutoReset
alter table public."Class"
  drop constraint if exists "Class_starResetDay_check";

alter table public."Class"
  add constraint "Class_starResetDay_check"
  check ("starResetDay" between 1 and 31);

alter table public."Class"
  add column if not exists "starResetDate" text;

alter table public."Class"
  add column if not exists "starAutoReset" boolean not null default true;

comment on column public."Class"."starResetDay" is
  'Day of month (1..31) for closing monthly available star balance.';
comment on column public."Class"."starResetDate" is
  'Specific date (YYYY-MM-DD) for closing monthly available star balance.';
comment on column public."Class"."starAutoReset" is
  'Whether to automatically close available stars when the closing date arrives.';

notify pgrst, 'reload schema';
