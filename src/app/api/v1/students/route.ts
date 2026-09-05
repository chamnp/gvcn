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

  const searchParams = req.nextUrl.searchParams;
  const teamId = searchParams.get('teamId') ? parseInt(searchParams.get('teamId')!) : undefined;
  const gender = searchParams.get('gender') || undefined;
  const isBoarding = searchParams.get('isBoarding') !== null ? searchParams.get('isBoarding') === 'true' : undefined;
  const search = searchParams.get('search') || undefined;

  const result = await executeTool('get_students', { teamId, gender, isBoarding, search }, auth);
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
