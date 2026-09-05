/**
 * Content Script for ChatGPT (chatgpt.com)
 * Injects GVCN Pro Teacher Toolbar directly into ChatGPT interface
 */

(function () {
  console.log('[GVCN Pro] ChatGPT content script loaded.');

  function injectTeacherButton() {
    if (document.getElementById('gvcn-chatgpt-btn')) return;

    // Find ChatGPT prompt form or footer area
    const textarea = document.querySelector('#prompt-textarea') || document.querySelector('textarea');
    if (!textarea) return;

    const form = textarea.closest('form') || textarea.parentElement;
    if (!form) return;

    const container = document.createElement('div');
    container.id = 'gvcn-chatgpt-container';
    container.innerHTML = `
      <button id="gvcn-chatgpt-btn" type="button" title="GVCN Pro - Trợ lý Giáo viên Tiểu học">
        <span class="gvcn-icon">🎓</span>
        <span class="gvcn-label">GVCN Pro</span>
      </button>
      <div id="gvcn-chatgpt-menu" class="gvcn-hidden">
        <div class="gvcn-menu-header">
          <strong>GVCN Pro Copilot (Lớp 4A1)</strong>
          <span class="gvcn-badge">TT27 & CV2345</span>
        </div>
        <div class="gvcn-menu-items">
          <button type="button" class="gvcn-item" data-action="class-data">
            <span class="gvcn-item-icon">📊</span>
            <div>
              <div class="gvcn-item-title">Nạp dữ liệu lớp 4A1</div>
              <div class="gvcn-item-desc">Đưa sĩ số, bán trú vào chat để AI nắm thông tin</div>
            </div>
          </button>
          <button type="button" class="gvcn-item" data-action="lesson-plan">
            <span class="gvcn-item-icon">📝</span>
            <div>
              <div class="gvcn-item-title">Soạn giáo án CV 2345 (4 pha)</div>
              <div class="gvcn-item-desc">Khởi động, Khám phá, Luyện tập, Vận dụng</div>
            </div>
          </button>
          <button type="button" class="gvcn-item" data-action="tt27-comment">
            <span class="gvcn-item-icon">🌟</span>
            <div>
              <div class="gvcn-item-title">Nhận xét học bạ Thông tư 27</div>
              <div class="gvcn-item-desc">Môn học (T/H/C) & Phẩm chất (T/Đ/C)</div>
            </div>
          </button>
          <button type="button" class="gvcn-item" data-action="parent-meeting">
            <span class="gvcn-item-icon">👨‍👩‍👧</span>
            <div>
              <div class="gvcn-item-title">Kịch bản Họp Phụ Huynh</div>
              <div class="gvcn-item-desc">Bài phát biểu cô giáo & kế hoạch lớp</div>
            </div>
          </button>
        </div>
      </div>
    `;

    // Insert before textarea or at form top
    form.parentNode.insertBefore(container, form);

    const btn = document.getElementById('gvcn-chatgpt-btn');
    const menu = document.getElementById('gvcn-chatgpt-menu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('gvcn-hidden');
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        menu.classList.add('gvcn-hidden');
      }
    });

    menu.querySelectorAll('.gvcn-item').forEach((item) => {
      item.addEventListener('click', async (e) => {
        const action = item.getAttribute('data-action');
        menu.classList.add('gvcn-hidden');
        await handleAction(action);
      });
    });
  }

  async function handleAction(action) {
    if (action === 'class-data') {
      chrome.runtime.sendMessage({ action: 'fetchClassData' }, (res) => {
        if (res && res.success && res.data) {
          const d = res.data;
          const text = `Dưới đây là thông tin hiện tại của lớp tôi phụ trách:
- Lớp: ${d.className} (Khối ${d.grade}, Năm học ${d.schoolYear})
- Giáo viên chủ nhiệm: ${d.teacherName}
- Tổng sĩ số: ${d.totalStudents} học sinh (Nam: ${d.genderDistribution?.male || 0}, Nữ: ${d.genderDistribution?.female || 0})
- Số học sinh ăn bán trú: ${d.boardingStudents} học sinh
- Quy chuẩn áp dụng: ${d.standardCompliance}

Hãy đóng vai trợ lý giáo viên chủ nhiệm, chào cô giáo và hỏi xem hôm nay tôi cần hỗ trợ công việc gì (điểm danh, nề nếp, sổ chủ nhiệm hay soạn bài)?`;
          insertIntoChatGPT(text);
        } else {
          insertIntoChatGPT(`Dưới đây là thông tin lớp 4A1 (sĩ số 55 học sinh, 31 Nam, 24 Nữ, 55 Bán trú). Hãy hỗ trợ tôi công tác chủ nhiệm lớp theo chuẩn Thông tư 27/2020/TT-BGDĐT.`);
        }
      });
    }

    if (action === 'lesson-plan') {
      const lessonTitle = prompt('Nhập tên bài học cần soạn (hoặc bấm OK để dùng mẫu):', 'Bài 14: Dãy số tự nhiên - Toán lớp 4');
      if (lessonTitle === null) return;
      const text = `Hãy đóng vai chuyên gia sư phạm tiểu học, soạn cho tôi Kế hoạch bài dạy (Giáo án) chuẩn mực theo đúng Công văn 2345/BGDĐT-GDTH cho:
- Bài học: ${lessonTitle || 'Bài 14: Dãy số tự nhiên'}
- Môn học: Toán lớp 4 (Bộ sách Kết nối tri thức với cuộc sống)

YÊU CẦU CẤU TRÚC BẮT BUỘC ĐỦ 4 HOẠT ĐỘNG:
1. Hoạt động 1: Khởi động (Warm-up / 3-5 phút): Thiết kế một trò chơi ngắn tạo hứng thú và kết nối kiến thức cũ.
2. Hoạt động 2: Khám phá (Discovery / 10-12 phút): Hướng dẫn học sinh thảo luận, phát hiện kiến thức trọng tâm bài học.
3. Hoạt động 3: Luyện tập / Thực hành (Practice / 12-15 phút): Hệ thống bài tập có lời văn, hướng dẫn sửa lỗi sai phổ biến.
4. Hoạt động 4: Vận dụng (Application / 3-5 phút): Tình huống liên hệ thực tế cuộc sống và dặn dò.`;
      insertIntoChatGPT(text);
    }

    if (action === 'tt27-comment') {
      const studentName = prompt('Nhập tên học sinh cần nhận xét (hoặc bấm OK để dùng mẫu):', 'Nguyễn Minh An');
      if (studentName === null) return;
      const text = `Hãy viết lời nhận xét học bạ cuối học kỳ cho học sinh ${studentName || 'Nguyễn Minh An'} lớp 4 theo chuẩn Thông tư 27/2020/TT-BGDĐT:
1. Đánh giá kết quả học tập các môn học (Mức Hoàn thành tốt - T): Nêu rõ ưu điểm về tư duy logic môn Toán và kỹ năng đọc diễn cảm Tiếng Việt.
2. Đánh giá 5 phẩm chất chủ yếu (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm): Mức Tốt (T).
3. Đánh giá năng lực cốt lõi (Tự chủ, Giao tiếp hợp tác, Giải quyết vấn đề): Mức Tốt (T).
4. Đề xuất danh hiệu khen thưởng: Học sinh Xuất sắc (theo Điều 13 Thông tư 27).
5. Văn phong sư phạm: Ấm áp, tôn trọng, mang tính khích lệ và chỉ rõ điểm mạnh riêng của em.`;
      insertIntoChatGPT(text);
    }

    if (action === 'parent-meeting') {
      const text = `Hãy soạn cho tôi bài phát biểu của Giáo viên Chủ nhiệm trong buổi Họp Phụ Huynh Lớp 4A1 (Học kỳ 1) với phong cách chân thành, cởi mở, gắn kết nhà trường và gia đình:
1. Lời chào và báo cáo tổng quan tình hình lớp (sĩ số 55 em, nề nếp bán trú tốt, học sinh tích cực).
2. Tuyên dương sự tiến bộ của các em về phẩm chất, năng lực theo tinh thần Thông tư 27.
3. Phương hướng học kỳ tới và lời kêu gọi phụ huynh đồng hành cùng con trong việc tự học và rèn luyện kỹ năng sống.`;
      insertIntoChatGPT(text);
    }
  }

  function insertIntoChatGPT(text) {
    const textarea = document.querySelector('#prompt-textarea') || document.querySelector('textarea');
    if (!textarea) return;

    textarea.focus();
    if (textarea.tagName === 'DIV') {
      // ChatGPT contenteditable div
      textarea.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    } else {
      textarea.value = text;
    }

    // Trigger input event so ChatGPT's React state updates and Send button enables
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Periodic check to inject button when navigating ChatGPT SPA
  setInterval(injectTeacherButton, 1000);
})();
