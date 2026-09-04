import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/lib/mcp-auth';
import { executeTool } from '@/lib/mcp-executor';

export const dynamic = 'force-dynamic';

// ─── 1. MCP Server Capabilities & Tools Catalog ──────────────────────────────

const MCP_SERVER_INFO = {
  name: 'gvcn-pro-mcp-server',
  version: '1.0.0',
  description: 'Trợ lý Giáo viên Chủ nhiệm Tiểu học Thông tư 27/2020/TT-BGDĐT & Công văn 2345/BGDĐT-GDTH',
};

const MCP_TOOLS_CATALOG = [
  {
    name: 'get_class_overview',
    description: 'Lấy tổng quan thông tin lớp học: Sĩ số, Nam/Nữ, Bán trú, TKB hôm nay, danh sách học sinh theo Thông tư 27.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_students',
    description: 'Lấy danh sách toàn bộ học sinh trong lớp hoặc lọc theo tổ, giới tính, trạng thái bán trú, tìm kiếm theo tên.',
    inputSchema: {
      type: 'object',
      properties: {
        teamId: { type: 'number', description: 'Lọc theo Tổ (1, 2, 3, 4)' },
        gender: { type: 'string', enum: ['Nam', 'Nữ'], description: 'Lọc theo giới tính' },
        isBoarding: { type: 'boolean', description: 'Lọc theo trạng thái ăn bán trú' },
        search: { type: 'string', description: 'Tìm kiếm theo họ tên hoặc mã học sinh' },
      },
    },
  },
  {
    name: 'get_student_detail',
    description: 'Tra cứu hồ sơ chi tiết của một học sinh: thông tin phụ huynh, điểm số các môn, mức đạt T/H/C TT27, phẩm chất, sao thi đua, sức khỏe/thị lực.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'Mã ID của học sinh' },
        studentName: { type: 'string', description: 'Hoặc họ và tên học sinh (VD: Nguyễn Minh An)' },
      },
    },
  },
  {
    name: 'get_subject_assessments',
    description: 'Lấy bảng đánh giá kết quả học tập các môn học (Toán, Tiếng Việt, Ngoại ngữ...) theo Thông tư 27 của lớp.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectCode: { type: 'string', description: 'Mã môn học (TOAN, TIENG_VIET, NGOAI_NGU, KHOA_HOC, LS_DL...)' },
        term: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'], description: 'Học kỳ đánh giá' },
      },
    },
  },
  {
    name: 'update_subject_assessment',
    description: 'Cập nhật đánh giá môn học cho một học sinh: Mức đạt (T: Hoàn thành tốt, H: Hoàn thành, C: Chưa hoàn thành), điểm kiểm tra định kỳ và lời nhận xét sư phạm.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'Mã ID học sinh' },
        subjectCode: { type: 'string', description: 'Mã môn học (TOAN, TIENG_VIET...)' },
        term: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'], description: 'Học kỳ' },
        level: { type: 'string', enum: ['T', 'H', 'C'], description: 'Mức đánh giá TT27' },
        score: { type: 'number', description: 'Điểm kiểm tra định kỳ (1-10 nếu có)' },
        comment: { type: 'string', description: 'Lời nhận xét của giáo viên' },
      },
      required: ['studentId', 'subjectCode', 'term', 'level'],
    },
  },
  {
    name: 'get_trait_assessments',
    description: 'Lấy kết quả đánh giá 5 phẩm chất (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm) và các năng lực theo Thông tư 27.',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'], description: 'Học kỳ' },
        traitCode: { type: 'string', description: 'Mã phẩm chất hoặc năng lực (VD: PC_CHAM_CHI, NL_TU_CHU...)' },
      },
    },
  },
  {
    name: 'update_trait_assessment',
    description: 'Cập nhật đánh giá phẩm chất / năng lực cho học sinh theo mức T (Tốt), Đ (Đạt), C (Cần cố gắng).',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'Mã ID học sinh' },
        traitCode: { type: 'string', description: 'Mã phẩm chất / năng lực' },
        term: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'] },
        level: { type: 'string', enum: ['T', 'Đ', 'C'], description: 'Mức đạt: T (Tốt), Đ (Đạt), C (Cần cố gắng)' },
        comment: { type: 'string', description: 'Nhận xét chi tiết' },
      },
      required: ['studentId', 'traitCode', 'term', 'level'],
    },
  },
  {
    name: 'get_attendance_today',
    description: 'Tra cứu tình hình điểm danh chuyên cần và số lượng suất ăn bán trú hôm nay của lớp.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Ngày cần tra cứu (định dạng YYYY-MM-DD, mặc định là hôm nay)' },
      },
    },
  },
  {
    name: 'mark_attendance',
    description: 'Điểm danh cho học sinh trong ngày: Có mặt, Vắng có phép, Vắng không phép và đăng ký suất ăn bán trú.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'Mã ID học sinh' },
        status: { type: 'string', enum: ['PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED'], description: 'Trạng thái điểm danh' },
        hasBoardingMeal: { type: 'boolean', description: 'Có ăn bán trú bữa trưa tại trường' },
        reason: { type: 'string', description: 'Lý do vắng mặt nếu có' },
      },
      required: ['studentId', 'status'],
    },
  },
  {
    name: 'get_star_leaderboard',
    description: 'Bảng xếp hạng sao thi đua chăm ngoan của lớp, danh sách top học sinh tích cực nhất.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Số lượng học sinh hiển thị (mặc định 10)' },
      },
    },
  },
  {
    name: 'add_star_points',
    description: 'Thưởng hoặc trừ sao thi đua cho học sinh kèm lý do sư phạm (Học tập hăng hái, Nề nếp tốt, Trực nhật sạch sẽ...).',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'Mã ID học sinh' },
        points: { type: 'number', description: 'Số sao thưởng (+1, +2, +5) hoặc trừ (-1)' },
        category: { type: 'string', description: 'Hạng mục: Học tập, Nề nếp, Chuyên cần, Giúp đỡ bạn, Khác' },
        reason: { type: 'string', description: 'Lý do cụ thể ghi nhận' },
      },
      required: ['studentId', 'points', 'reason'],
    },
  },
  {
    name: 'get_timetable',
    description: 'Lấy thời khóa biểu 2 buổi/ngày của lớp theo các thứ trong tuần (Thứ Hai đến Thứ Sáu).',
    inputSchema: {
      type: 'object',
      properties: {
        day: { type: 'string', enum: ['T2', 'T3', 'T4', 'T5', 'T6'], description: 'Thứ trong tuần (mặc định lấy cả tuần)' },
      },
    },
  },
  {
    name: 'get_lesson_plans',
    description: 'Tra cứu danh sách Kế hoạch bài dạy (Giáo án) điện tử của lớp theo tuần học hoặc môn học.',
    inputSchema: {
      type: 'object',
      properties: {
        week: { type: 'number', description: 'Tuần học (1 - 35)' },
        subjectCode: { type: 'string', description: 'Mã môn học (TOAN, TIENG_VIET...)' },
      },
    },
  },
  {
    name: 'generate_lesson_plan',
    description: 'Tự động tạo trọn gói Kế hoạch bài dạy 4 pha sư phạm chuẩn Công văn 2345/BGDĐT-GDTH kèm bộ Slide TV tương tác từ tên bài học bất kỳ.',
    inputSchema: {
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
  {
    name: 'generate_parent_meeting',
    description: 'Tự động tổng hợp dữ liệu lớp học để tạo kịch bản họp phụ huynh, bài phát biểu của cô giáo và phiếu trao đổi 1-1.',
    inputSchema: {
      type: 'object',
      properties: {
        meetingType: { type: 'string', enum: ['DAU_NAM', 'SO_KET_HK1', 'TONG_KET_CUOI_NAM'], description: 'Kỳ họp phụ huynh' },
      },
      required: ['meetingType'],
    },
  },
  {
    name: 'generate_student_comment',
    description: 'Sinh lời nhận xét học bạ tổng hợp chuẩn mực sư phạm Thông tư 27 cho một học sinh dựa trên điểm số và phẩm chất thực tế.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'Mã ID học sinh' },
        term: { type: 'string', enum: ['GIUA_HK1', 'CUOI_HK1', 'GIUA_HK2', 'CUOI_NAM'], description: 'Học kỳ' },
      },
      required: ['studentId'],
    },
  },
  {
    name: 'get_homeworks',
    description: 'Lấy danh sách bài tập về nhà của lớp đã giao cho học sinh.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectCode: { type: 'string', description: 'Lọc theo môn học' },
      },
    },
  },
  {
    name: 'create_homework',
    description: 'Giao bài tập về nhà mới cho cả lớp kèm hướng dẫn chi tiết và hạn nộp.',
    inputSchema: {
      type: 'object',
      properties: {
        subjectCode: { type: 'string', description: 'Mã môn học (TOAN, TIENG_VIET...)' },
        title: { type: 'string', description: 'Tiêu đề bài tập' },
        description: { type: 'string', description: 'Nội dung dặn dò làm bài' },
        dueDate: { type: 'string', description: 'Hạn hoàn thành (YYYY-MM-DD)' },
      },
      required: ['subjectCode', 'title', 'description'],
    },
  },
];

// ─── 2. HTTP Route Handlers (GET / POST / OPTIONS) ────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const queryKey = url.searchParams.get('key');
  const authHeader = req.headers.get('Authorization');

  const auth = await authenticateMcpRequest(authHeader, queryKey);

  // Return MCP Discovery Information
  return NextResponse.json(
    {
      mcpVersion: '2024-11-05',
      server: MCP_SERVER_INFO,
      authenticatedUser: auth.isAuthenticated
        ? { email: auth.teacherEmail, name: auth.teacherName, role: auth.role, className: auth.className }
        : null,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
      },
      toolsCount: MCP_TOOLS_CATALOG.length,
      tools: MCP_TOOLS_CATALOG,
      instructions:
        'Để kết nối với Claude Desktop, Cursor hoặc ChatGPT, sử dụng Endpoint URL này kèm Header: Authorization: Bearer <API_KEY> hoặc query parameter ?key=<API_KEY>.',
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const queryKey = url.searchParams.get('key');
  const authHeader = req.headers.get('Authorization');

  const auth = await authenticateMcpRequest(authHeader, queryKey);

  if (!auth.isAuthenticated) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: auth.error || 'Yêu cầu xác thực khóa MCP không thành công. Vui lòng cung cấp khóa API hợp lệ.',
        },
      },
      { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  try {
    const body = await req.json();

    // Standard MCP JSON-RPC 2.0 Method Handling
    const method = body.method || body.action;
    const id = body.id !== undefined ? body.id : 1;
    const params = body.params || body.arguments || {};

    // 1. Initialize Handshake
    if (method === 'initialize') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: MCP_SERVER_INFO,
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
              prompts: { listChanged: false },
            },
          },
        },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 2. Tools List
    if (method === 'tools/list' || method === 'list_tools') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS_CATALOG,
          },
        },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 3. Tool Call
    if (method === 'tools/call' || method === 'call_tool' || body.tool) {
      const toolName = params.name || body.tool;
      const toolArgs = params.arguments || params.args || body.arguments || {};

      const toolResult = await executeTool(toolName, toolArgs, auth);

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2),
              },
            ],
            isError: false,
          },
        },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 4. Resources List
    if (method === 'resources/list') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              {
                uri: 'gvcn://class/overview',
                name: 'Tổng quan Lớp học và Giáo viên chủ nhiệm',
                mimeType: 'application/json',
              },
              {
                uri: 'gvcn://class/timetable',
                name: 'Thời khóa biểu 2 buổi/ngày của lớp',
                mimeType: 'application/json',
              },
            ],
          },
        },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 5. Prompts List
    if (method === 'prompts/list') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            prompts: [
              {
                name: 'soan_giao_an_cv2345',
                description: 'Gợi ý cấu trúc Kế hoạch bài dạy chuẩn Công văn 2345 của Bộ GD&ĐT',
                arguments: [{ name: 'ten_bai_hoc', description: 'Tên bài học', required: true }],
              },
              {
                name: 'viet_nhan_xet_hoc_ba_tt27',
                description: 'Soạn lời nhận xét học bạ tổng hợp chuẩn Thông tư 27',
                arguments: [{ name: 'ten_hoc_sinh', description: 'Tên học sinh', required: true }],
              },
            ],
          },
        },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Fallback error for unknown methods
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Phương thức MCP không được hỗ trợ: ${method}`,
        },
      },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: err?.message || 'Lỗi xử lý yêu cầu MCP Server.',
        },
      },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
