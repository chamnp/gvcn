import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const xmlContent = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='gvcn-pro-copilot'>
    <updatecheck codebase='https://gvcn-eta.vercel.app/downloads/gvcn-pro-extension.zip' version='2.0.0' />
  </app>
</gupdate>`;

  return new NextResponse(xmlContent, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
