import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  getMonthlyRedemptionSummary,
  rankMonthlyStarLeaderboard,
} from '../src/lib/star-leaderboard.ts';

const item = (name, monthlyEarned) => ({ student: { fullName: name }, monthlyEarned });

test('zero and negative monthly scores are shown without a rank', () => {
  const result = rankMonthlyStarLeaderboard([
    item('An', 0),
    item('Bình', -1),
    item('Chi', 5),
  ]);

  assert.deepEqual(result.map(({ student, rank }) => [student.fullName, rank]), [
    ['Chi', 1],
    ['An', null],
    ['Bình', null],
  ]);
});

test('equal positive monthly scores share competition rank', () => {
  const result = rankMonthlyStarLeaderboard([
    item('Dung', 6),
    item('An', 10),
    item('Bình', 10),
    item('Chi', 8),
  ]);

  assert.deepEqual(result.map(({ student, rank }) => [student.fullName, rank]), [
    ['An', 1],
    ['Bình', 1],
    ['Chi', 3],
    ['Dung', 4],
  ]);
});

test('all-time stars do not break a monthly tie', () => {
  const result = rankMonthlyStarLeaderboard([
    { ...item('An', 4), allTimeStars: 4 },
    { ...item('Bình', 4), allTimeStars: 100 },
  ]);

  assert.deepEqual(result.map(({ rank }) => rank), [1, 1]);
});

test('teacher and public leaderboards use the same ranking rule', async () => {
  const [teacherPage, publicPage] = await Promise.all([
    readFile(new URL('../src/app/behavior/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/rewards/[classToken]/page.tsx', import.meta.url), 'utf8'),
  ]);

  for (const source of [teacherPage, publicPage]) {
    assert.match(source, /rankMonthlyStarLeaderboard\(scoredList\)/);
    assert.match(source, /item\.rank \?\? '—'/);
  }
});

test('period-close ledger is not counted as reward spending', () => {
  const summary = getMonthlyRedemptionSummary([
    { status: 'DELIVERED', totalStars: 7, items: [{ productId: 'pen' }] },
    { status: 'DELIVERED', totalStars: 13, items: [{ productId: 'system-period-close' }] },
    { status: 'CANCELLED', totalStars: 99, items: [{ productId: 'book' }] },
  ]);

  assert.deepEqual(summary, { rewardSpent: 7, closedBalance: 13, hasPeriodClose: true });
});

test('spending all stars on rewards does not mean the month was closed', () => {
  const rewardsOnly = getMonthlyRedemptionSummary([
    { status: 'DELIVERED', totalStars: 10, items: [{ productId: 'book' }] },
  ]);
  assert.equal(rewardsOnly.hasPeriodClose, false);
});
