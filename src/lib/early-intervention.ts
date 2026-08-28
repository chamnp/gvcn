import {
  Student,
  DailyAttendance,
  SubjectAssessment,
  StarLog,
  EarlyInterventionAlert,
  TermType,
} from '@/types';
import { PRIMARY_SUBJECTS } from '@/lib/tt27-engine';

export function scanEarlyInterventionAlerts(
  students: Student[],
  attendances: DailyAttendance[],
  subjectAssessments: SubjectAssessment[],
  starLogs: StarLog[],
  currentTerm: TermType
): EarlyInterventionAlert[] {
  const alerts: EarlyInterventionAlert[] = [];

  students.forEach((st) => {
    // ----------------------------------------------------
    // 1. SCAN ATTENDANCE ISSUES (CHUYÊN CẦN)
    // ----------------------------------------------------
    const stAtt = attendances.filter((a) => a.studentId === st.id);
    const unexcused = stAtt.filter((a) => a.status === 'VANG_KHONG_PHEP').length;
    const excused = stAtt.filter((a) => a.status === 'VANG_CO_PHEP').length;
    const totalAbsences = unexcused + excused;
    const lates = stAtt.filter((a) => a.status === 'MUON').length;

    if (totalAbsences >= 3 || unexcused >= 1) {
      alerts.push({
        id: `${st.id}-att-absent`,
        studentId: st.id,
        studentName: st.fullName,
        studentAvatar: st.avatarUrl,
        category: 'ATTENDANCE',
        severity: unexcused >= 2 || totalAbsences >= 4 ? 'CRITICAL' : 'WARNING',
        title: `Vắng học nhiều (${totalAbsences} buổi)`,
        reason: `Học sinh đã nghỉ ${totalAbsences} buổi (${excused} có phép, ${unexcused} không phép). Nguy cơ hổng kiến thức bài học.`,
        metricValue: `${totalAbsences} buổi vắng`,
        actionRecommendation: `Gọi điện hoặc nhắn tin Zalo cho phụ huynh em ${st.fullName} (${st.parentPhone || 'Chưa có SĐT'}) để tìm hiểu lý do và gửi tài liệu ôn tập.`,
        actionType: 'CONTACT_PARENT',
      });
    }

    if (lates >= 2) {
      alerts.push({
        id: `${st.id}-att-late`,
        studentId: st.id,
        studentName: st.fullName,
        studentAvatar: st.avatarUrl,
        category: 'ATTENDANCE',
        severity: 'WARNING',
        title: `Đi học muộn (${lates} lần)`,
        reason: `Học sinh đã đi muộn ${lates} lần, ảnh hưởng đến giờ truy bài đầu giờ.`,
        metricValue: `${lates} lần muộn`,
        actionRecommendation: `Trao đổi với phụ huynh để nhắc nhở con dậy sớm và đi học đúng giờ.`,
        actionType: 'CONTACT_PARENT',
      });
    }

    // ----------------------------------------------------
    // 2. SCAN ACADEMIC ISSUES (HỌC TẬP TT27)
    // ----------------------------------------------------
    const stSubs = subjectAssessments.filter(
      (a) => a.studentId === st.id && a.term === currentTerm
    );
    const cLevelSubs = stSubs.filter((a) => a.level === 'C');
    const lowScoreSubs = stSubs.filter(
      (a) => a.score !== undefined && a.score !== null && a.score < 5.0
    );

    if (cLevelSubs.length > 0 || lowScoreSubs.length > 0) {
      const problematicNames = cLevelSubs.map((s) => {
        const info = PRIMARY_SUBJECTS.find((p) => p.code === s.subjectCode);
        return info?.shortName || s.subjectCode;
      });

      alerts.push({
        id: `${st.id}-academic-c`,
        studentId: st.id,
        studentName: st.fullName,
        studentAvatar: st.avatarUrl,
        category: 'ACADEMIC',
        severity: cLevelSubs.length >= 2 || lowScoreSubs.length > 0 ? 'CRITICAL' : 'WARNING',
        title: `Môn học ở mức Cần cố gắng (${problematicNames.join(', ') || 'Điểm thấp'})`,
        reason: `Học sinh chưa nắm vững kiến thức trọng tâm môn ${problematicNames.join(', ')}.`,
        metricValue: `${cLevelSubs.length} môn mức C`,
        actionRecommendation: `Lên kế hoạch phụ đạo 1-1 trong giờ tự học hoặc phân công "Đôi bạn cùng tiến" hỗ trợ em.`,
        actionType: 'TUTORING',
      });
    }

    // ----------------------------------------------------
    // 3. SCAN BEHAVIOR & DISCIPLINE (NỀ NẾP SAO)
    // ----------------------------------------------------
    const stStars = starLogs.filter((l) => l.studentId === st.id);
    const negativeLogs = stStars.filter((l) => l.points < 0);
    const totalPoints = stStars.reduce((sum, l) => sum + l.points, 0);

    if (negativeLogs.length >= 3 || totalPoints < 0) {
      alerts.push({
        id: `${st.id}-behavior-stars`,
        studentId: st.id,
        studentName: st.fullName,
        studentAvatar: st.avatarUrl,
        category: 'BEHAVIOR',
        severity: 'WARNING',
        title: `Nề nếp có dấu hiệu giảm sút (${negativeLogs.length} lần trừ sao)`,
        reason: `Học sinh bị nhắc nhở nhiều lần về nề nếp lớp học (tổng sao: ${totalPoints}).`,
        metricValue: `${totalPoints} ⭐`,
        actionRecommendation: `Gặp riêng em để lắng nghe, khích lệ và giao các nhiệm vụ nhỏ giúp em lấy lại tinh thần tích cực.`,
        actionType: 'REWARD_ENCOURAGE',
      });
    }

    // ----------------------------------------------------
    // 4. SCAN HEALTH & SEATING (THỊ LỰC / VỊ TRÍ NGỒI)
    // ----------------------------------------------------
    if (st.healthNotes && /cận|thị lực|mắt|mổ|tai|nghe kém/i.test(st.healthNotes)) {
      if (st.seatRow !== undefined && st.seatRow > 1) {
        alerts.push({
          id: `${st.id}-health-seat`,
          studentId: st.id,
          studentName: st.fullName,
          studentAvatar: st.avatarUrl,
          category: 'HEALTH_SEATING',
          severity: 'INFO',
          title: `Cận thị nhưng đang ngồi Hàng ${st.seatRow + 1}`,
          reason: `Ghi chú sức khỏe: "${st.healthNotes}". Vị trí ngồi hiện tại có thể gây mỏi mắt hoặc khó nhìn bảng.`,
          metricValue: `Hàng ${st.seatRow + 1}`,
          actionRecommendation: `Mở Sơ đồ lớp học và chuyển em ${st.fullName} lên Hàng 1 hoặc Hàng 2.`,
          actionType: 'CHANGE_SEAT',
        });
      }
    }
  });

  // Sort by severity: CRITICAL first, then WARNING, then INFO
  const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
