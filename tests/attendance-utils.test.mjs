import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getCompletedAttendanceDates,
  getIsoDateRange,
  getUnrecordedStudentIds,
  mergeAttendanceByDay,
  paginate,
  resolveDailyBoardingMeal,
  summarizeAttendance,
} from '../src/lib/attendance-utils.ts';

test('closing a day only selects students without an existing attendance record', () => {
  const existing = [
    { studentId: 'leave-1', date: '2026-09-07' },
    { studentId: 'leave-2', date: '2026-09-07' },
  ];

  assert.deepEqual(
    getUnrecordedStudentIds(existing, ['present-1', 'leave-1', 'present-2', 'leave-2'], '2026-09-07'),
    ['present-1', 'present-2']
  );
});

test('monthly attendance only includes dates closed for the whole class', () => {
  const records = [
    { studentId: 's1', date: '2026-09-07', status: 'CO_MAT', hasBoardingMeal: true },
    { studentId: 's2', date: '2026-09-07', status: 'VANG_CO_PHEP', hasBoardingMeal: false },
    { studentId: 's1', date: '2026-09-08', status: 'CO_MAT', hasBoardingMeal: true },
  ];
  const completedDates = getCompletedAttendanceDates(records, ['s1', 's2'], '2026-09');

  assert.deepEqual(completedDates, ['2026-09-07']);
  assert.equal(
    summarizeAttendance(records.filter((record) => record.studentId === 's1'), '2026-09', new Set(completedDates)).tracked,
    1
  );
});

test('approved leave expands to every calendar date in its range', () => {
  assert.deepEqual(getIsoDateRange('2026-09-29', '2026-10-02'), [
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
  ]);
});

test('realtime merge replaces the same student/date even when database id changes', () => {
  const current = [{
    id: 'temporary-id',
    studentId: 'student-1',
    date: '2026-09-06',
    status: 'CO_MAT',
    hasBoardingMeal: true,
  }];

  const merged = mergeAttendanceByDay(current, {
    ...current[0],
    id: 'database-id',
    status: 'MUON',
  });

  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'database-id');
  assert.equal(merged[0].status, 'MUON');
});

test('monthly summary counts only records in the selected month and treats late as attended', () => {
  const summary = summarizeAttendance([
    { date: '2026-09-01', status: 'CO_MAT', hasBoardingMeal: true },
    { date: '2026-09-02', status: 'MUON', hasBoardingMeal: true },
    { date: '2026-09-03', status: 'VANG_CO_PHEP', hasBoardingMeal: false },
    { date: '2026-08-31', status: 'CO_MAT', hasBoardingMeal: true },
  ], '2026-09');

  assert.deepEqual(summary, {
    present: 1,
    excused: 1,
    unexcused: 0,
    late: 1,
    meals: 2,
    tracked: 3,
    attendanceRate: 67,
  });
});

test('pagination clamps an out-of-range page after filtering', () => {
  const result = paginate(['a', 'b', 'c'], 10, 2);

  assert.deepEqual(result.items, ['c']);
  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 2);
});

test('daily meal defaults to the regular registration but keeps a saved one-day exception', () => {
  assert.equal(resolveDailyBoardingMeal(true, 'CO_MAT'), true);
  assert.equal(resolveDailyBoardingMeal(false, 'CO_MAT'), false);
  assert.equal(resolveDailyBoardingMeal(true, 'VANG_CO_PHEP'), false);
  assert.equal(resolveDailyBoardingMeal(true, 'MUON', false), false);
  assert.equal(resolveDailyBoardingMeal(false, 'MUON', true), true);
});
