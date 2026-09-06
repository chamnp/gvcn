import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL('../supabase/migrations/20260906190000_secure_star_rewards_access.sql', import.meta.url);
const storePath = new URL('../src/lib/store.tsx', import.meta.url);
const publicClassPath = new URL('../src/app/rewards/[classToken]/page.tsx', import.meta.url);
const publicStudentPath = new URL('../src/app/student/[token]/page.tsx', import.meta.url);

test('star reward tables deny direct anonymous access and enable RLS', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  for (const table of ['Class', 'Student', 'StarLog', 'StarCriterion', 'RewardProduct', 'RewardRedemption']) {
    assert.match(sql, new RegExp(`alter table public\\."${table}" enable row level security`, 'i'));
  }
  assert.match(sql, /revoke all on table[\s\S]+from anon;/i);
});

test('star mutations use authorized RPCs instead of direct table writes', async () => {
  const store = await readFile(storePath, 'utf8');
  const featureSection = store.slice(store.indexOf('// STAR REWARDS'), store.indexOf('// BACKUP & RESTORE'));
  assert.match(featureSection, /rpc\('add_star_log_tx'/);
  assert.match(featureSection, /rpc\('delete_star_log_tx'/);
  assert.match(featureSection, /rpc\('redeem_reward_idempotent_tx'/);
  assert.doesNotMatch(featureSection, /from\('StarLog'\)\s*\.insert/);
});

test('anonymous reward portals do not hydrate the global school store', async () => {
  const [classPage, studentPage] = await Promise.all([
    readFile(publicClassPath, 'utf8'),
    readFile(publicStudentPath, 'utf8'),
  ]);
  assert.doesNotMatch(classPage, /useAppStore/);
  assert.doesNotMatch(studentPage, /useAppStore/);
  assert.match(classPage, /get_public_class_rewards_bundle/);
  assert.match(studentPage, /get_student_portal_bundle/);
});

test('student portal requires PIN verification and redemption idempotency', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /private\.assert_student_portal_pin/);
  assert.match(sql, /"lockedUntil"/);
  assert.match(sql, /RewardRedemption_student_idempotency_key/);
  assert.match(sql, /pg_advisory_xact_lock/);
});
