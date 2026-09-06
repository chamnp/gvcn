import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/lib/mcp-auth';
import { executeTool } from '@/lib/mcp-executor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const queryKey = req.nextUrl.searchParams.get('key');
  const queryClassId = req.nextUrl.searchParams.get('classId');
  const queryDate = req.nextUrl.searchParams.get('date');
  const queryTerm = req.nextUrl.searchParams.get('term');
  const auth = await authenticateMcpRequest(authHeader, queryKey);

  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error || 'Yêu cầu xác thực API key' }, { status: 401 });
  }

  const effectiveAuth = {
    ...auth,
    classId: queryClassId || auth.classId,
  };

  const args: Record<string, any> = {};
  if (queryDate) args.date = queryDate;
  if (queryTerm) args.term = queryTerm;

  const result = await executeTool('get_class_overview', args, effectiveAuth);
  return NextResponse.json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
