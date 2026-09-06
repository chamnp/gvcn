import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/lib/mcp-auth';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const queryKey = req.nextUrl.searchParams.get('key');
  const auth = await authenticateMcpRequest(authHeader, queryKey);

  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error || 'Yêu cầu xác thực API key' }, { status: 401 });
  }

  const body = await req.json();
  const rawToken = authHeader?.replace(/^Bearer\s+/i, '').trim() || queryKey?.trim() || '';
  const rpcArgs = {
    p_student_id: String(body.studentId || ''),
    p_points: Number(body.points),
    p_category: String(body.category || 'Khác'),
    p_reason: String(body.reason || ''),
    p_comment: body.comment ? String(body.comment) : null,
    p_date: body.date ? String(body.date) : null,
  };
  const rpcResult = rawToken.startsWith('gvcn_pat_')
    ? await supabase.rpc('add_star_log_pat_tx', { p_api_key: rawToken, ...rpcArgs })
    : await createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        { global: { headers: { Authorization: `Bearer ${rawToken}` } }, auth: { persistSession: false } }
      ).rpc('add_star_log_tx', rpcArgs);
  const result = rpcResult.error
    ? { success: false, error: rpcResult.error.message }
    : rpcResult.data;
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
