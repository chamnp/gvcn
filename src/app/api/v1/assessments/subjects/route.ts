import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/lib/mcp-auth';
import { executeTool } from '@/lib/mcp-executor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const queryKey = req.nextUrl.searchParams.get('key');
  const auth = await authenticateMcpRequest(authHeader, queryKey);

  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error || 'Yêu cầu xác thực API key' }, { status: 401 });
  }

  const subjectCode = req.nextUrl.searchParams.get('subjectCode') || undefined;
  const term = req.nextUrl.searchParams.get('term') || undefined;

  const result = await executeTool('get_subject_assessments', { subjectCode, term }, auth);
  return NextResponse.json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const queryKey = req.nextUrl.searchParams.get('key');
  const auth = await authenticateMcpRequest(authHeader, queryKey);

  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error || 'Yêu cầu xác thực API key' }, { status: 401 });
  }

  const body = await req.json();
  const result = await executeTool('update_subject_assessment', body, auth);
  return NextResponse.json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
