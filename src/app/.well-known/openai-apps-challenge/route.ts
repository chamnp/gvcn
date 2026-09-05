import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * OpenAI Apps Domain Verification Endpoint
 * Docs: https://developers.openai.com/plugins/deploy/submission#domain-verification
 */
export async function GET() {
  const token = process.env.OPENAI_APPS_CHALLENGE_TOKEN || 'gvcn_pro_openai_challenge_token_2026';
  return new NextResponse(token, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
