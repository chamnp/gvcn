-- Per-class monthly star-balance close day.
-- We deliberately constrain the day to 1..28 so it exists in every month.
alter table public."Class"
  add column if not exists "starResetDay" smallint not null default 1;

alter table public."Class"
  drop constraint if exists "Class_starResetDay_check";

alter table public."Class"
  add constraint "Class_starResetDay_check"
  check ("starResetDay" between 1 and 28);

comment on column public."Class"."starResetDay" is
  'Day of month (1..28) when teachers are reminded to close the monthly available-star balance.';
