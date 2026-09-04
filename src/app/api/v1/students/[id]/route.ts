import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/lib/mcp-auth';
import { executeTool } from '@/lib/mcp-executor';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const authHeader = req.headers.get('Authorization');
  const queryKey = req.nextUrl.searchParams.get('key');
  const auth = await authenticateMcpRequest(authHeader, queryKey);

  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error || 'Yêu cầu xác thực API key' }, { status: 401 });
  }

  const result = await executeTool('get_student_detail', { studentId: id }, auth);
  return NextResponse.json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
