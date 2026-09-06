import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const versionData = {
    name: 'GVCN Pro Classroom Copilot',
    version: '2.0.0',
    minSupportedVersion: '1.0.0',
    releaseDate: '2026-09-05',
    changelog: [
      '✨ Tái thiết kế thành Classroom Copilot v2.0 - Trợ lý sư phạm trực tiếp trên slide bài giảng.',
      '🎯 Thanh công cụ nổi (Floating Dock) trên Google Slides, Canva, Hành trang số (Shadow DOM).',
      '🎲 Vòng quay may mắn bốc thăm học sinh ngẫu nhiên kèm âm thanh hiệu ứng.',
      '⏱️ Đồng hồ đếm ngược hoạt động nhóm chuẩn CV 2345 kèm chuông báo êm dịu.',
      '⭐ Khen thưởng sao nóng và hiệu ứng sao bay khích lệ học sinh.',
      '🔔 Bộ chuông hiệu lệnh lớp học (chuông trật tự, tiếng vỗ tay, chuông hết giờ).',
      '👥 Chia nhóm ngẫu nhiên thần tốc (nhóm 4, nhóm 6, 2 đội thi đua).',
      '🔄 Cơ chế tự động kiểm tra và cập nhật phiên bản mới.'
    ],
    downloadUrl: 'https://www.gvcn.pro.vn/downloads/gvcn-pro-extension.zip',
    updateXmlUrl: 'https://www.gvcn.pro.vn/api/extension/updates.xml',
    docsUrl: 'https://www.gvcn.pro.vn/settings'
  };

  return NextResponse.json(versionData, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
