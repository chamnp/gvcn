import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const fileParam = req.nextUrl.searchParams.get('file');

  try {
    if (fileParam === 'skill') {
      const filePath = path.join(process.cwd(), 'plugin/skills/gvcn-pro/SKILL.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (fileParam === 'chatgpt-instructions') {
      const filePath = path.join(process.cwd(), 'plugin/chatgpt/instructions.md');
      const content = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Default: return plugin.json manifest
    const manifestPath = path.join(process.cwd(), 'plugin/plugin.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể tải tài nguyên plugin' },
      { status: 500 }
    );
  }
}
