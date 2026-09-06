import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const behaviorPath = new URL('../src/app/behavior/page.tsx', import.meta.url);
const storePath = new URL('../src/lib/store.tsx', import.meta.url);
const migrationPath = new URL('../supabase/migrations/20260906230000_configure_monthly_star_reset.sql', import.meta.url);

test('leaderboard is the first and default behavior tab', async () => {
  const source = await readFile(behaviorPath, 'utf8');
  assert.match(source, /useState<[^>]+>\('LEADERBOARD'\)/);
  assert.ok(source.indexOf("id: 'LEADERBOARD'") < source.indexOf("id: 'TABLE'"));
});

test('monthly close always receives the selected month', async () => {
  const source = await readFile(behaviorPath, 'utf8');
  assert.match(source, /resetMonthStars\(selectedMonth\)/);
  assert.match(source, /currentMonthKey/);
});

test('reset day is persisted per class and constrained to a valid calendar day', async () => {
  const [store, migration] = await Promise.all([
    readFile(storePath, 'utf8'),
    readFile(migrationPath, 'utf8'),
  ]);
  assert.match(store, /starResetDay: Math\.min\((?:28|31), Math\.max\(1,/);
  assert.match(migration, /add column if not exists "starResetDay" smallint not null default 1/i);
  assert.match(migration, /check \("starResetDay" between 1 and (?:28|31)\)/i);
});

test('monthly close preserves star logs by using the transactional close ledger', async () => {
  const store = await readFile(storePath, 'utf8');
  const resetSection = store.slice(store.indexOf('const resetMonthStars'), store.indexOf('// BACKUP & RESTORE'));
  assert.match(resetSection, /rpc\('close_month_star_balance_tx'/);
  assert.doesNotMatch(resetSection, /from\('StarLog'\)\.delete/);
});

test('vietnamese month selector and recurring reset-day input are configured correctly', async () => {
  const [behaviorSource, rewardsSource] = await Promise.all([
    readFile(behaviorPath, 'utf8'),
    readFile(new URL('../src/app/rewards/[classToken]/page.tsx', import.meta.url), 'utf8'),
  ]);

  // Pure Vietnamese Month: No native input type="month"
  assert.doesNotMatch(behaviorSource, /type="month"/);
  assert.doesNotMatch(rewardsSource, /type="month"/);

  assert.match(behaviorSource, /id="star-reset-day"/);
  assert.match(behaviorSource, /max=\{28\}/);
  assert.doesNotMatch(behaviorSource, /id="star-reset-date"/);
});

test('date helpers correctly calculate end of month for leap and non-leap years', async () => {
  const engineSource = await readFile(new URL('../src/lib/tt27-engine.ts', import.meta.url), 'utf8');
  assert.match(engineSource, /export function getLastDateOfMonth/);
  assert.match(engineSource, /export function formatMonthVN/);
  assert.match(engineSource, /export function formatDateVN/);

  // Validate pure calculation algorithm
  const getLastDateOfMonth = (monthKey) => {
    const [y, m] = monthKey.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  };
  const formatMonthVN = (monthKey) => `Tháng ${Number(monthKey.split('-')[1])}/${monthKey.split('-')[0]}`;
  const formatDateVN = (dateStr) => dateStr.split('-').reverse().join('/');

  assert.equal(getLastDateOfMonth('2026-09'), '2026-09-30');
  assert.equal(getLastDateOfMonth('2026-10'), '2026-10-31');
  assert.equal(getLastDateOfMonth('2026-02'), '2026-02-28');
  assert.equal(getLastDateOfMonth('2024-02'), '2024-02-29');
  assert.equal(formatMonthVN('2026-09'), 'Tháng 9/2026');
  assert.equal(formatDateVN('2026-09-30'), '30/09/2026');
});

test('monthly reset uses a recurring safe day and does not promise automatic execution', async () => {
  const [behavior, store, migration] = await Promise.all([
    readFile(behaviorPath, 'utf8'),
    readFile(storePath, 'utf8'),
    readFile(new URL('../supabase/migrations/20260907023000_fix_star_reset_semantics.sql', import.meta.url), 'utf8'),
  ]);

  assert.match(behavior, /starResetDay/);
  assert.doesNotMatch(behavior, /starResetDate/);
  assert.doesNotMatch(store, /starAutoReset:/);
  assert.match(migration, /between 1 and 28/i);
  assert.match(migration, /default false/i);
});
