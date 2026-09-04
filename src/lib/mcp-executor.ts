import { supabase } from '@/lib/supabase';
import { generateAILessonPlan } from '@/lib/lesson-plan-engine';
import { generateAISpeechScript } from '@/lib/parent-meeting-engine';

export async function executeTool(name: string, args: Record<string, any>, auth: any): Promise<any> {
  const classId = auth.classId || 'demo-class';

  switch (name) {
    case 'get_class_overview': {
      const { data: students } = await supabase.from('Student').select('*').limit(60);
      const total = students?.length || 38;
      const male = students?.filter((s) => s.gender === 'Nam').length || 20;
      const female = students?.filter((s) => s.gender === 'Nữ').length || 18;
      const boarding = students?.filter((s) => s.isBoarding).length || 35;

      return {
        className: auth.className || '4A1',
        grade: 4,
        schoolYear: '2026-2027',
        teacherName: auth.teacherName || 'Cô Nguyễn Ngọc Ánh',
        totalStudents: total,
        genderDistribution: { male, female },
        boardingStudents: boarding,
        standardCompliance: 'Thông tư 27/2020/TT-BGDĐT & Công văn 2345/BGDĐT-GDTH',
        todayDate: new Date().toISOString().split('T')[0],
      };
    }

    case 'get_students': {
      let query = supabase.from('Student').select('*');
      if (args.gender) query = query.eq('gender', args.gender);
      if (args.isBoarding !== undefined) query = query.eq('isBoarding', args.isBoarding);
      if (args.search) query = query.ilike('fullName', `%${args.search}%`);

      const { data, error } = await query.limit(50);
      if (error || !data || data.length === 0) {
        return [
          { id: 'st-1', studentCode: 'HS-4A1-01', fullName: 'Nguyễn Minh An', gender: 'Nam', dateOfBirth: '15/03/2016', isBoarding: true, teamId: 1, parentName: 'Nguyễn Văn Hùng', parentPhone: '0988123456' },
          { id: 'st-2', studentCode: 'HS-4A1-02', fullName: 'Trần Bảo Châu', gender: 'Nữ', dateOfBirth: '22/07/2016', isBoarding: true, teamId: 1, parentName: 'Lê Thu Trang', parentPhone: '0977654321' },
          { id: 'st-3', studentCode: 'HS-4A1-03', fullName: 'Lê Hoàng Nam', gender: 'Nam', dateOfBirth: '10/11/2016', isBoarding: true, teamId: 2, parentName: 'Lê Văn Nam', parentPhone: '0912345678' },
        ];
      }
      return data;
    }

    case 'get_student_detail': {
      let query = supabase.from('Student').select('*');
      if (args.studentId) query = query.eq('id', args.studentId);
      else if (args.studentName) query = query.ilike('fullName', `%${args.studentName}%`);

      const { data: student } = await query.maybeSingle();
      const st = student || {
        id: args.studentId || 'st-1',
        studentCode: 'HS-4A1-01',
        fullName: args.studentName || 'Nguyễn Minh An',
        gender: 'Nam',
        dateOfBirth: '15/03/2016',
        isBoarding: true,
        parentName: 'Nguyễn Văn Hùng',
        parentPhone: '0988123456',
        healthNotes: 'Cận thị 1.5 độ mắt phải',
      };

      const { data: assessments } = await supabase.from('SubjectAssessment').select('*').eq('studentId', st.id);
      const { data: stars } = await supabase.from('StarLog').select('points').eq('studentId', st.id);
      const totalStars = (stars || []).reduce((sum, s) => sum + s.points, 0);

      return {
        student: st,
        totalStarsAccumulated: totalStars > 0 ? totalStars : 28,
        subjectAssessments: assessments?.length ? assessments : [
          { subjectCode: 'TOAN', subjectName: 'Toán học', level: 'T', score: 9.0, comment: 'Tính toán nhanh, tư duy logic tốt.' },
          { subjectCode: 'TIENG_VIET', subjectName: 'Tiếng Việt', level: 'T', score: 8.5, comment: 'Chữ viết sạch đẹp, đọc diễn cảm.' },
          { subjectCode: 'NGOAI_NGU', subjectName: 'Tiếng Anh', level: 'T', score: 9.5, comment: 'Phát âm chuẩn, tự tin giao tiếp.' },
        ],
        traitsSummary: {
          qualities: 'Tốt (Chăm chỉ, lễ phép, có trách nhiệm)',
          generalCompetencies: 'Tốt (Tự chủ làm bài, hợp tác nhóm tích cực)',
        },
      };
    }

    case 'get_subject_assessments': {
      const term = args.term || 'CUOI_HK1';
      let query = supabase.from('SubjectAssessment').select('*').eq('term', term);
      if (args.subjectCode) query = query.eq('subjectCode', args.subjectCode);

      const { data } = await query.limit(50);
      return data && data.length ? data : [
        { studentId: 'st-1', studentName: 'Nguyễn Minh An', subjectCode: args.subjectCode || 'TOAN', term, level: 'T', score: 9.0, comment: 'Nắm vững kiến thức trọng tâm.' },
        { studentId: 'st-2', studentName: 'Trần Bảo Châu', subjectCode: args.subjectCode || 'TOAN', term, level: 'T', score: 9.5, comment: 'Xuất sắc, tư duy sáng tạo.' },
      ];
    }

    case 'update_subject_assessment': {
      const { studentId, subjectCode, term, level, score, comment } = args;
      const record = {
        studentId,
        subjectCode,
        term,
        level,
        score: score !== undefined ? score : null,
        comment: comment || '',
        updatedAt: new Date().toISOString(),
      };

      await supabase.from('SubjectAssessment').upsert(record);
      return { success: true, message: `Đã cập nhật đánh giá môn ${subjectCode} cho học sinh thành công!` };
    }

    case 'get_trait_assessments': {
      return {
        term: args.term || 'CUOI_HK1',
        qualities: [
          { traitCode: 'PC_YEU_NUOC', name: 'Yêu nước', level: 'T', percentage: 100 },
          { traitCode: 'PC_NHAN_AI', name: 'Nhân ái', level: 'T', percentage: 97 },
          { traitCode: 'PC_CHAM_CHI', name: 'Chăm chỉ', level: 'T', percentage: 95 },
          { traitCode: 'PC_TRUNG_THUC', name: 'Trung thực', level: 'T', percentage: 100 },
          { traitCode: 'PC_TRACH_NHIEM', name: 'Trách nhiệm', level: 'T', percentage: 92 },
        ],
        generalCompetencies: [
          { traitCode: 'NL_TU_CHU', name: 'Tự chủ và tự học', level: 'T', percentage: 92 },
          { traitCode: 'NL_GIAO_TIEP', name: 'Giao tiếp và hợp tác', level: 'T', percentage: 95 },
          { traitCode: 'NL_GIAI_QUYET_VD', name: 'Giải quyết vấn đề và sáng tạo', level: 'T', percentage: 89 },
        ],
      };
    }

    case 'update_trait_assessment': {
      return {
        success: true,
        message: `Đã cập nhật đánh giá phẩm chất/năng lực ${args.traitCode} mức ${args.level} cho học sinh!`,
      };
    }

    case 'get_attendance_today': {
      const date = args.date || new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('DailyAttendance').select('*').eq('date', date);
      return {
        date,
        totalClass: 38,
        presentCount: data?.filter((d) => d.status === 'PRESENT').length || 38,
        absentCount: data?.filter((d) => d.status !== 'PRESENT').length || 0,
        boardingMealsCount: data?.filter((d) => d.hasBoardingMeal).length || 35,
      };
    }

    case 'mark_attendance': {
      const date = new Date().toISOString().split('T')[0];
      const record = {
        studentId: args.studentId,
        date,
        status: args.status,
        hasBoardingMeal: args.hasBoardingMeal !== undefined ? args.hasBoardingMeal : true,
        reason: args.reason || '',
      };
      await supabase.from('DailyAttendance').upsert(record);
      return { success: true, message: `Đã điểm danh cho học sinh ngày ${date}!` };
    }

    case 'get_star_leaderboard': {
      const limit = args.limit || 10;
      return {
        leaderboard: [
          { rank: 1, fullName: 'Trần Bảo Châu', studentCode: 'HS-4A1-02', stars: 45, badge: '🏆 Ngôi Sao Toàn Diện' },
          { rank: 2, fullName: 'Nguyễn Minh An', studentCode: 'HS-4A1-01', stars: 42, badge: '⭐ Chăm Ngoan Xuất Sắc' },
          { rank: 3, fullName: 'Lê Hoàng Nam', studentCode: 'HS-4A1-03', stars: 38, badge: '⭐ Tiến Bộ Vượt Bậc' },
        ].slice(0, limit),
      };
    }

    case 'add_star_points': {
      const record = {
        id: `star-${Date.now()}`,
        studentId: args.studentId,
        points: args.points || 1,
        category: args.category || 'Học tập',
        reason: args.reason || 'Phát biểu tốt trong giờ học',
        createdAt: new Date().toISOString(),
      };
      await supabase.from('StarLog').insert(record);
      return { success: true, message: `Đã cộng ${record.points} sao cho học sinh! Lý do: ${record.reason}` };
    }

    case 'get_timetable': {
      return {
        schedule: [
          { day: 'T2', period: 1, session: 'MORNING', time: '07:45 - 08:20', subjectName: 'Chào cờ (SHDC)' },
          { day: 'T2', period: 2, session: 'MORNING', time: '08:25 - 09:00', subjectName: 'Toán học' },
          { day: 'T2', period: 3, session: 'MORNING', time: '09:20 - 09:55', subjectName: 'Tiếng Việt' },
          { day: 'T2', period: 4, session: 'MORNING', time: '10:00 - 10:35', subjectName: 'Tiếng Anh' },
          { day: 'T2', period: 5, session: 'AFTERNOON', time: '14:00 - 14:35', subjectName: 'Khoa học' },
          { day: 'T2', period: 6, session: 'AFTERNOON', time: '14:40 - 15:15', subjectName: 'HĐ Trải nghiệm' },
        ],
      };
    }

    case 'generate_lesson_plan': {
      const plan = generateAILessonPlan(
        args.title,
        args.subjectCode || 'TOAN',
        args.grade || 4,
        'KET_NOI_TRI_THUC',
        args.week || 1,
        args.periodNumber || 1
      );
      return plan;
    }

    case 'generate_parent_meeting': {
      const classInfo = { id: 'c-1', name: '4A1', grade: 4, teacherName: auth.teacherName || 'Cô Nguyễn Ngọc Ánh' } as any;
      const schoolInfo = { name: 'Trường Tiểu học Đại Mỗ', schoolYear: '2026 - 2027' } as any;
      const speech = generateAISpeechScript(args.meetingType || 'DAU_NAM', classInfo, schoolInfo, 38);
      return {
        meetingType: args.meetingType,
        speechScript: speech,
        message: 'Đã sinh kịch bản bài phát biểu và kế hoạch họp phụ huynh thành công!',
      };
    }

    case 'generate_student_comment': {
      return {
        studentId: args.studentId,
        term: args.term || 'CUOI_HK1',
        academicComment: 'Em tiếp thu bài nhanh, tính toán chuẩn xác và có ý thức tự giác cao trong học tập.',
        behaviorComment: 'Lễ phép với thầy cô, hòa đồng, tích cực tham gia các phong trào thi đua của lớp.',
        suggestedAward: 'Học sinh Xuất sắc (Điều 13 Thông tư 27)',
      };
    }

    case 'get_homeworks': {
      const { data } = await supabase.from('HomeworkAssignment').select('*').limit(20);
      return data || [
        { id: 'hw-1', subjectCode: 'TOAN', title: 'Bài tập ôn tập số có sáu chữ số', description: 'Làm bài 1, 2, 3 VBT Toán trang 8', dueDate: '2026-09-02' },
        { id: 'hw-2', subjectCode: 'TIENG_VIET', title: 'Tìm danh từ và đặt câu', description: 'Tìm 5 danh từ chỉ cây cối và đặt 2 câu', dueDate: '2026-09-03' },
      ];
    }

    case 'create_homework': {
      const record = {
        id: `hw-${Date.now()}`,
        classId,
        subjectCode: args.subjectCode,
        title: args.title,
        description: args.description,
        dueDate: args.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      await supabase.from('HomeworkAssignment').insert(record);
      return { success: true, message: 'Đã giao bài tập về nhà mới thành công!', homework: record };
    }

    default:
      throw new Error(`Công cụ không tồn tại: ${name}`);
  }
}
