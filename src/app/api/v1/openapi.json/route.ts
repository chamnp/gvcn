import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  const origin = 'https://gvcn-eta.vercel.app';

  const spec = {
    openapi: '3.0.1',
    info: {
      title: 'GVCN Pro API',
      description:
        'Cổng kết nối AI quản lý lớp học tiểu học GVCN Pro chuẩn Thông tư 27/2020/TT-BGDĐT và Công văn 2345/BGDĐT-GDTH.',
      version: '1.0.0',
    },
    servers: [
      {
        url: origin,
        description: 'GVCN Pro Production Server',
      },
    ],
    paths: {
      '/api/v1/overview': {
        get: {
          summary: 'Lấy tổng quan thông tin lớp học',
          operationId: 'getClassOverview',
          description: 'Trả về sĩ số, số nam, số nữ, số học sinh bán trú, khối lớp, năm học của lớp hiện tại.',
          responses: {
            '200': {
              description: 'Thông tin tổng quan lớp học thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/students': {
        get: {
          summary: 'Lấy danh sách học sinh trong lớp',
          operationId: 'getStudents',
          description: 'Tra cứu danh sách học sinh, có thể lọc theo tổ (teamId: 1, 2, 3, 4), giới tính (Nam/Nữ), trạng thái bán trú hoặc tìm kiếm theo tên.',
          parameters: [
            {
              name: 'teamId',
              in: 'query',
              required: false,
              schema: { type: 'integer' },
              description: 'Lọc theo Tổ (1, 2, 3, 4)',
            },
            {
              name: 'gender',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['Nam', 'Nữ'] },
              description: 'Lọc theo giới tính',
            },
            {
              name: 'isBoarding',
              in: 'query',
              required: false,
              schema: { type: 'boolean' },
              description: 'Lọc theo trạng thái ăn bán trú',
            },
            {
              name: 'search',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Tìm kiếm theo họ tên hoặc mã học sinh',
            },
          ],
          responses: {
            '200': {
              description: 'Danh sách học sinh',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/students/{id}': {
        get: {
          summary: 'Tra cứu hồ sơ chi tiết một học sinh',
          operationId: 'getStudentDetail',
          description: 'Xem chi tiết thông tin học sinh: liên hệ phụ huynh, điểm số môn học, số sao thi đua, mức đánh giá Thông tư 27.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Mã ID của học sinh (VD: st-1, st-2 hoặc mã học sinh)',
            },
          ],
          responses: {
            '200': {
              description: 'Hồ sơ chi tiết học sinh',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/assessments/subjects': {
        get: {
          summary: 'Lấy bảng điểm đánh giá môn học Thông tư 27',
          operationId: 'getSubjectAssessments',
          description: 'Tra cứu bảng đánh giá môn học (Toán, Tiếng Việt, Khoa học...) theo các học kỳ: GIUA_HK1, CUOI_HK1, GIUA_HK2, CUOI_NAM.',
          parameters: [
            {
              name: 'subjectCode',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Mã môn học (TOAN, TIENG_VIET, NGOAI_NGU, KHOA_HOC, LS_DL, TIN_HOC)',
            },
            {
              name: 'term',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'] },
              description: 'Học kỳ đánh giá',
            },
          ],
          responses: {
            '200': {
              description: 'Kết quả đánh giá môn học',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Cập nhật đánh giá môn học cho học sinh',
          operationId: 'updateSubjectAssessment',
          description: 'Cập nhật mức đạt Thông tư 27 (T: Tốt, H: Hoàn thành, C: Chưa hoàn thành), điểm số và nhận xét giáo viên cho 1 học sinh.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string', description: 'Mã ID học sinh' },
                    subjectCode: { type: 'string', description: 'Mã môn học (TOAN, TIENG_VIET...)' },
                    term: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'], description: 'Học kỳ' },
                    level: { type: 'string', enum: ['T', 'H', 'C'], description: 'Mức đạt: T, H, C' },
                    score: { type: 'number', description: 'Điểm kiểm tra định kỳ (1-10 nếu có)' },
                    comment: { type: 'string', description: 'Lời nhận xét của cô giáo' },
                  },
                  required: ['studentId', 'subjectCode', 'term', 'level'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Cập nhật đánh giá môn học thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/assessments/traits': {
        get: {
          summary: 'Lấy kết quả đánh giá 5 phẩm chất và năng lực',
          operationId: 'getTraitAssessments',
          description: 'Tra cứu kết quả 5 phẩm chất (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm) và năng lực cốt lõi theo Thông tư 27.',
          parameters: [
            {
              name: 'term',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'] },
              description: 'Học kỳ',
            },
            {
              name: 'traitCode',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Mã phẩm chất hoặc năng lực',
            },
          ],
          responses: {
            '200': {
              description: 'Bảng đánh giá phẩm chất và năng lực',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Cập nhật phẩm chất / năng lực cho học sinh',
          operationId: 'updateTraitAssessment',
          description: 'Cập nhật mức đạt: T (Tốt), Đ (Đạt), C (Cần cố gắng) kèm nhận xét chi tiết.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string', description: 'Mã ID học sinh' },
                    traitCode: { type: 'string', description: 'Mã phẩm chất / năng lực' },
                    term: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'] },
                    level: { type: 'string', enum: ['T', 'Đ', 'C'], description: 'Mức đạt: T, Đ, C' },
                    comment: { type: 'string', description: 'Nhận xét chi tiết' },
                  },
                  required: ['studentId', 'traitCode', 'term', 'level'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Cập nhật thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/rewards/star': {
        post: {
          summary: 'Tặng sao khen thưởng nề nếp cho học sinh',
          operationId: 'awardStudentStar',
          description: 'Cộng sao tích cực kèm lời khen và lý do (phát biểu hay, làm bài tốt, giúp đỡ bạn, vệ sinh lớp sạch).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string', description: 'Mã ID học sinh' },
                    stars: { type: 'number', description: 'Số sao khen thưởng (mặc định 1)' },
                    reason: { type: 'string', description: 'Lý do khen thưởng' },
                  },
                  required: ['studentId', 'reason'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Tặng sao khen thưởng thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/timetable': {
        get: {
          summary: 'Lấy thời khóa biểu lớp học',
          operationId: 'getTimetable',
          description: 'Thời khóa biểu 2 buổi/ngày (sáng và chiều) từ Thứ Hai đến Thứ Sáu.',
          parameters: [
            {
              name: 'day',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['T2', 'T3', 'T4', 'T5', 'T6'] },
              description: 'Thứ trong tuần (bỏ trống để lấy cả tuần)',
            },
          ],
          responses: {
            '200': {
              description: 'Thời khóa biểu lớp học',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/lessons/generate': {
        post: {
          summary: 'Tự động tạo kế hoạch bài dạy chuẩn Công văn 2345',
          operationId: 'generateLessonPlan',
          description: 'Sinh giáo án 4 pha sư phạm (Khởi động, Khám phá, Luyện tập, Vận dụng) kèm bộ câu hỏi tương tác từ tên bài học bất kỳ.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'Tên bài học (VD: Bài 14: Dãy số tự nhiên)' },
                    subjectCode: { type: 'string', description: 'Mã môn học (TOAN, TIENG_VIET, KHOA_HOC...)' },
                    grade: { type: 'number', description: 'Khối lớp (1-5, mặc định 4)' },
                    week: { type: 'number', description: 'Tuần học (1-35)' },
                    periodNumber: { type: 'number', description: 'Tiết theo PPCT' },
                  },
                  required: ['title', 'subjectCode'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Kế hoạch bài dạy chi tiết',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/comments/generate': {
        post: {
          summary: 'Sinh lời nhận xét học bạ Thông tư 27',
          operationId: 'generateStudentComment',
          description: 'Tạo lời nhận xét học bạ chuẩn mực sư phạm Thông tư 27 dựa trên kết quả môn học và biểu hiện thực tế.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    studentId: { type: 'string', description: 'Mã ID học sinh' },
                    term: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'], description: 'Học kỳ' },
                  },
                  required: ['studentId'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Lời nhận xét sư phạm gợi ý',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/meetings/script': {
        post: {
          summary: 'Tạo kịch bản họp phụ huynh và bài phát biểu',
          operationId: 'generateMeetingScript',
          description: 'Tự động tổng hợp dữ liệu lớp tạo bài phát biểu của cô giáo và phiếu trao đổi 1-1 với phụ huynh.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    meetingType: {
                      type: 'string',
                      enum: ['DAU_NAM', 'SO_KET_HK1', 'TONG_KET_CUOI_NAM'],
                      description: 'Kỳ họp phụ huynh',
                    },
                  },
                  required: ['meetingType'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Kịch bản họp phụ huynh và bài phát biểu',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
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
          description: 'Nhập mã Personal Access Token GVCN Pro (dạng gvcn_pat_...)',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  };

  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
