import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getIsoDateRange,
  mergeAttendanceByDay,
  paginate,
  summarizeAttendance,
} from '../src/lib/attendance-utils.ts';

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
