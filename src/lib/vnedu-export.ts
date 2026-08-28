import * as XLSX from "xlsx";
import { Student, SubjectAssessment, TraitAssessment, StudentTermSummary, ClassInfo, TermType } from "@/types";
import { PRIMARY_SUBJECTS, TRAIT_DEFINITIONS, TERMS } from "@/lib/tt27-engine";

// Xuất file Excel chuẩn cấu trúc Import của vnEdu (VNPT) và SMAS (Viettel)
export function exportVnEduAssessmentExcel(
  students: Student[],
  subjectAssessments: SubjectAssessment[],
  traitAssessments: TraitAssessment[],
  termSummaries: StudentTermSummary[],
  classInfo: ClassInfo,
  term: TermType
) {
  const termObj = TERMS.find((t) => t.id === term);
  const termName = termObj?.name || term;

  // Header Row 1: School and Class Info
  const headerData = [
    ["BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ HỌC SINH TIỂU HỌC (CHUẨN VNEDU / SMAS / THÔNG TƯ 27)"],
    [`Trường: ${classInfo.schoolName || "Trường Tiểu học"}`, "", `Lớp: ${classInfo.name}`, "", `Đợt đánh giá: ${termName}`, "", `GVCN: ${classInfo.teacherName}`],
    [],
  ];

  // Table Column Headers
  const colHeaders = [
    "STT",
    "Mã định danh HS (vnEdu)",
    "Họ và tên",
    "Ngày sinh",
    "Giới tính",
    // Subjects
    ...PRIMARY_SUBJECTS.flatMap((s) => [
      `${s.name} (Mức ĐG)`,
      ...(s.hasPeriodicTest ? [`${s.name} (Điểm KT)`] : []),
    ]),
    // Traits
    ...TRAIT_DEFINITIONS.map((t) => `${t.name} (Mức ĐG)`),
    // Summary
    "Đánh giá kết quả học tập",
    "Đánh giá phẩm chất & năng lực",
    "Danh hiệu khen thưởng",
    "Lời nhận xét tổng hợp của GVCN",
  ];

  // Rows Data
  const rows = students.map((st, idx) => {
    // Subject evaluations
    const subjectCols: (string | number)[] = [];
    PRIMARY_SUBJECTS.forEach((sub) => {
      const ass = subjectAssessments.find(
        (a) => a.studentId === st.id && a.subjectCode === sub.code && a.term === term
      );
      subjectCols.push(ass?.level || "");
      if (sub.hasPeriodicTest) {
        subjectCols.push(ass?.score !== undefined && ass.score !== null ? ass.score : "");
      }
    });

    // Trait evaluations
    const traitCols: string[] = [];
    TRAIT_DEFINITIONS.forEach((trait) => {
      const ass = traitAssessments.find(
        (t) => t.studentId === st.id && t.traitCode === trait.code && t.term === term
      );
      traitCols.push(ass?.level || "");
    });

    // Summary
    const summary = termSummaries.find((s) => s.studentId === st.id && s.term === term);

    return [
      idx + 1,
      st.studentCode,
      st.fullName,
      st.dateOfBirth,
      st.gender,
      ...subjectCols,
      ...traitCols,
      summary?.overallLearningLevel || "",
      summary?.overallTraitsLevel || "",
      summary?.awardTitle || "",
      summary?.teacherComment || "",
    ];
  });

  const fullData = [...headerData, colHeaders, ...rows];

  const ws = XLSX.utils.aoa_to_sheet(fullData);

  // Set column widths
  ws["!cols"] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Mã HS
    { wch: 24 }, // Họ tên
    { wch: 12 }, // Ngày sinh
    { wch: 10 }, // Giới tính
    ...PRIMARY_SUBJECTS.flatMap((s) => [
      { wch: 14 },
      ...(s.hasPeriodicTest ? [{ wch: 12 }] : []),
    ]),
    ...TRAIT_DEFINITIONS.map(() => ({ wch: 16 })),
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
    { wch: 50 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DanhSachDiem_vnEdu");

  const fileName = `BangDiem_vnEdu_${classInfo.name}_${term}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
