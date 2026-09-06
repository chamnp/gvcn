import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req?: Request) {
  let origin = 'https://www.gvcn.pro.vn';
  if (req?.headers) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    if (host) origin = `${proto}://${host}`;
  }

  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'GVCN Pro Smart Classroom API & MCP Server',
      description:
        'Cổng kết nối AI thông minh quản lý giáo viên chủ nhiệm tiểu học chuẩn Thông tư 27/2020/TT-BGDĐT và Công văn 2345/BGDĐT-GDTH.',
      version: '1.0.0',
    },
    servers: [
      {
        url: origin,
        description: 'GVCN Pro Production Server',
      },
    ],
    paths: {
      '/api/mcp': {
        post: {
          summary: 'Thực thi các lệnh và công cụ sư phạm GVCN Pro',
          operationId: 'executeMcpTool',
          description:
            'Gọi các công cụ tra cứu học sinh, đánh giá Thông tư 27, điểm danh, thời khóa biểu, giáo án CV 2345.',
          security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    method: {
                      type: 'string',
                      example: 'tools/call',
                      description: 'Phương thức JSON-RPC hoặc tên tool',
                    },
                    params: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                          example: 'get_class_overview',
                          description: 'Tên công cụ cần gọi',
                        },
                        arguments: {
                          type: 'object',
                          description: 'Các tham số tương ứng của công cụ',
                        },
                      },
                    },
                  },
                  required: ['method'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Kết quả trả về thành công từ GVCN Pro Database',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
            '401': {
              description: 'Khóa API không hợp lệ hoặc thiếu quyền truy cập',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API_KEY',
          description: 'Nhập Khóa kết nối GVCN Personal Access Token dạng gvcn_pat_...',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'query',
          name: 'key',
          description: 'Truyền khóa qua tham số URL ?key=gvcn_pat_...',
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
