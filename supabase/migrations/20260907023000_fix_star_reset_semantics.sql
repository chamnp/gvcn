-- Keep reset configuration recurring and truthful: execution remains manual.
update public."Class"
set "starResetDay" = least(28, greatest(1, coalesce("starResetDay", 1)));

alter table public."Class" drop constraint if exists "Class_starResetDay_check";
alter table public."Class"
  add constraint "Class_starResetDay_check" check ("starResetDay" between 1 and 28);

alter table public."Class" alter column "starAutoReset" set default false;
update public."Class" set "starAutoReset" = false where "starAutoReset" is true;

comment on column public."Class"."starResetDay" is
  'Recurring reminder day (1..28) for a teacher-confirmed monthly star balance close.';
comment on column public."Class"."starAutoReset" is
  'Deprecated. Always false; monthly closing requires explicit teacher confirmation.';

notify pgrst, 'reload schema';
