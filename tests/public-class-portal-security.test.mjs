import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL('../supabase/migrations/20260907090000_secure_public_class_portal.sql', import.meta.url);
const publicPortalPath = new URL('../src/app/hw/[classId]/page.tsx', import.meta.url);
const studentPortalPath = new URL('../src/app/student/[token]/page.tsx', import.meta.url);

test('public class bundle is token-scoped and never returns student records or quiz answer keys', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  const publicBundle = sql.slice(
    sql.indexOf('create or replace function public.get_public_class_portal_bundle'),
    sql.indexOf('create or replace function public.submit_student_leave_request'),
  );

  assert.match(publicBundle, /where lower\(class\."shareToken"\) = lower\(btrim\(p_class_share_token\)\)/);
  assert.match(publicBundle, /question - 'correctAnswer' - 'answer'/);
  assert.doesNotMatch(publicBundle, /from public\."Student"/);
  assert.doesNotMatch(publicBundle, /from public\."QuizSubmission"/);
});

test('disabled public modules are filtered before rendering navigation', async () => {
  const source = await readFile(publicPortalPath, 'utf8');

  assert.match(source, /if \(flags\.homework\) tabs\.push/);
  assert.match(source, /if \(flags\.timetable\)/);
  assert.match(source, /if \(flags\.moments\) tabs\.push/);
  assert.match(source, /if \(flags\.parentMeetings\) tabs\.push/);
});

test('student mutations use PIN-protected RPCs instead of anonymous table writes', async () => {
  const source = await readFile(studentPortalPath, 'utf8');

  assert.match(source, /rpc\('acknowledge_student_note'/);
  assert.match(source, /rpc\('set_student_portal_progress'/);
  assert.doesNotMatch(source, /from\('FormativeNote'\)\s*\.update/);
  assert.doesNotMatch(source, /from\('StudentHomeworkProgress'\)\s*\.upsert/);
});
