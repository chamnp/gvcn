/**
 * GVCN Pro - Side Panel Controller
 */

let allStudents = [];
let timetable = [];

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadData();
  initLessonGenerator();
  initTT27Copy();
});

// Tab switching
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-target');
      ['tab-students', 'tab-schedule', 'tab-lessons', 'tab-tt27'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          if (id === targetId) {
            el.classList.remove('hidden');
          } else {
            el.classList.add('hidden');
          }
        }
      });
    });
  });
}

// Load and render students & schedule
function loadData() {
  const headerSub = document.getElementById('headerSub');
  const listEl = document.getElementById('studentList');
  const searchInput = document.getElementById('studentSearch');

  chrome.runtime.sendMessage({ action: 'fetchClassData' }, (res) => {
    if (res && res.data) {
      const d = res.data;
      if (headerSub && d.currentClass) {
        headerSub.textContent = `Lớp ${d.currentClass.name || '4A1'} • ${d.teacher?.fullName || 'Cô Minh Hằng'}`;
      }
      allStudents = d.students || [];
      timetable = d.timetable || [];
      renderStudentList(allStudents);
      renderTimetable(timetable);
    } else {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 20px; color: #ef4444; font-size: 12px;">
          Không thể kết nối đến GVCN Cloud. Đang sử dụng dữ liệu cục bộ.
        </div>
      `;
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allStudents.filter((s) => {
        const name = (s.fullName || '').toLowerCase();
        const code = (s.studentCode || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      });
      renderStudentList(filtered);
    });
  }
}

function renderStudentList(students) {
  const listEl = document.getElementById('studentList');
  if (!listEl) return;

  if (students.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 20px; color: #94a3b8; font-size: 12px;">
        Không tìm thấy học sinh nào phù hợp.
      </div>
    `;
    return;
  }

  listEl.innerHTML = students
    .map((s, idx) => {
      const genderBadge = s.gender === 'Nữ' ? '🌸' : '👦';
      return `
      <div class="student-item" data-idx="${idx}">
        <div>
          <div class="st-name">
            <span>${genderBadge} ${s.fullName}</span>
            <span style="font-size:11px; color:#f59e0b; font-weight:700;">⭐ ${s.stars || 0}</span>
          </div>
          <div class="st-code">
            ${s.studentCode || 'HS-4A1'} • Tổ ${s.teamId || 1} ${s.parentPhone ? '• 📞 ' + s.parentPhone : ''}
          </div>
        </div>
        <button class="btn-copy btn-copy-st" data-name="${s.fullName}" data-code="${s.studentCode || ''}" data-phone="${s.parentPhone || ''}" title="Sao chép thông tin">
          📋 Chép
        </button>
      </div>
    `;
    })
    .join('');

  listEl.querySelectorAll('.btn-copy-st').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.getAttribute('data-name');
      const code = btn.getAttribute('data-code');
      const phone = btn.getAttribute('data-phone');
      const textToCopy = `${name} (${code}) - Phụ huynh: ${phone || 'Chưa cập nhật'}`;
      copyToClipboard(textToCopy, btn);
    });
  });
}

function renderTimetable(slots) {
  const container = document.getElementById('timetableList');
  if (!container) return;

  if (!slots || slots.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 10px; color: #94a3b8; font-size: 12px;">
        Hôm nay không có lịch dạy hoặc là ngày nghỉ cuối tuần.
      </div>
    `;
    return;
  }

  container.innerHTML = slots.map((s) => `
    <div class="timetable-item">
      <div>
        <span class="period-badge">Tiết ${s.period}</span>
        <strong style="margin-left: 6px; color:#0f172a;">${s.subjectName}</strong>
      </div>
      <div style="font-size:11px; color:#64748b;">${s.time || ''}</div>
    </div>
  `).join('');
}

// Lesson Plan CV 2345 Generator
function initLessonGenerator() {
  const lessonInput = document.getElementById('lessonInput');
  const btnGenLesson = document.getElementById('btnGenLesson');
  const lessonOutput = document.getElementById('lessonOutput');
  const btnCopyLesson = document.getElementById('btnCopyLesson');

  if (btnGenLesson && lessonInput && lessonOutput) {
    btnGenLesson.addEventListener('click', () => {
      const topic = lessonInput.value.trim() || 'Dãy số tự nhiên (Môn Toán Lớp 4)';
      const prompt = `Hãy soạn Kế hoạch bài dạy (Giáo án) tiểu học chi tiết theo Công văn 2345/BGDĐT-GDTH cho:
- Môn học: Lớp 4
- Tên bài: ${topic}
- Cấu trúc chuẩn 4 pha bắt buộc:
  1. Hoạt động 1: Mở đầu / Khởi động (Trò chơi/kết nối, 5-7 phút)
  2. Hoạt động 2: Hình thành kiến thức mới (Khám phá, hoạt động nhóm, 12-15 phút)
  3. Hoạt động 3: Luyện tập, thực hành (Bài tập củng cố, 10-12 phút)
  4. Hoạt động 4: Vận dụng, trải nghiệm (Tình huống thực tiễn, 3-5 phút)
- Yêu cầu cần đạt (YCCĐ): Nêu rõ Năng lực đặc thù, Năng lực chung và Phẩm chất chủ yếu theo Thông tư 27 & CT GDPT 2018.`;
      lessonOutput.value = prompt;
    });
  }

  if (btnCopyLesson && lessonOutput) {
    btnCopyLesson.addEventListener('click', () => {
      if (!lessonOutput.value) {
        alert('Vui lòng tạo prompt trước khi sao chép!');
        return;
      }
      copyToClipboard(lessonOutput.value, btnCopyLesson);
    });
  }
}

// TT 27 Template Copy
function initTT27Copy() {
  const btnCopyTT27 = document.getElementById('btnCopyTT27');
  const tt27Template = document.getElementById('tt27Template');

  if (btnCopyTT27 && tt27Template) {
    btnCopyTT27.addEventListener('click', () => {
      copyToClipboard(tt27Template.value, btnCopyTT27);
    });
  }
}

// Helper to copy and provide feedback
function copyToClipboard(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btnElement.textContent;
    btnElement.textContent = '✓ Đã chép!';
    btnElement.style.background = '#10b981';
    btnElement.style.color = 'white';

    setTimeout(() => {
      btnElement.textContent = originalText;
      btnElement.style.background = '';
      btnElement.style.color = '';
    }, 1500);
  });
}
