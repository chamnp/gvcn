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
  assert.match(source, /max=\{currentMonthKey\}/);
});

test('reset day is persisted per class and constrained to a valid calendar day', async () => {
  const [store, migration] = await Promise.all([
    readFile(storePath, 'utf8'),
    readFile(migrationPath, 'utf8'),
  ]);
  assert.match(store, /starResetDay: Math\.min\(28, Math\.max\(1,/);
  assert.match(migration, /add column if not exists "starResetDay" smallint not null default 1/i);
  assert.match(migration, /check \("starResetDay" between 1 and 28\)/i);
});

test('monthly close preserves star logs by using the transactional close ledger', async () => {
  const store = await readFile(storePath, 'utf8');
  const resetSection = store.slice(store.indexOf('const resetMonthStars'), store.indexOf('// BACKUP & RESTORE'));
  assert.match(resetSection, /rpc\('close_month_star_balance_tx'/);
  assert.doesNotMatch(resetSection, /from\('StarLog'\)\.delete/);
});
