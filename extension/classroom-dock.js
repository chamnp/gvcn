/**
 * GVCN Pro Classroom Copilot - Floating Classroom Dock
 * Injected into all presentation pages (Google Slides, Canva, Hanhtrangso, YouTube, etc.)
 * Encapsulated via Shadow DOM to prevent any CSS/JS conflicts with host pages.
 */

(function () {
  // Prevent duplicate injection or running on GVCN Pro main web app
  if (document.getElementById('gvcn-classroom-dock-host')) return;
  if (
    window.location.hostname.includes('gvcn-eta.vercel.app') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return;
  }

  console.log('[GVCN Pro] Initializing Classroom Dock on page...');

  // State
  let isDockVisible = true;
  let isDockCollapsed = false;
  let students = [];
  let currentClass = '4A1';
  let timerInterval = null;
  let timerRemainingSec = 180; // Default 3 mins
  let timerTotalSec = 180;
  let isTimerRunning = false;
  let activeModal = null; // 'wheel', 'timer', 'star', 'sound', 'group', 'briefing'
  let currentWinner = null;
  let isSpinning = false;
  let selectedStudentForStar = null;
  let selectedStarReason = 'Phát biểu hăng hái';

  // Audio Synthesizer (Web Audio API - Zero External Asset Dependency)
  const AudioEngine = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    // Attention Bell (3 melodious chimes)
    playAttentionBell() {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 1.2);
        }, i * 280);
      });
    },
    // Gentle Gong / End of Time
    playTimeUpGong() {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.8);
    },
    // Cheerful Star Fanfare
    playStarFanfare() {
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.6);
        }, i * 110);
      });
    },
    // Applause Synth
    playApplause() {
      this.init();
      if (!this.ctx) return;
      // White noise buffer for rhythmic clapping
      for (let c = 0; c < 12; c++) {
        setTimeout(() => {
          const bufferSize = this.ctx.sampleRate * 0.08;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1000;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start();
        }, c * 100);
      }
    }
  };

  // Create Host Element & Shadow Root (Zero dimensions to prevent any layout shifts)
  const host = document.createElement('div');
  host.id = 'gvcn-classroom-dock-host';
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.overflow = 'visible';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';

  (document.body || document.documentElement).appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Inject CSS link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('classroom-dock.css');
  shadow.appendChild(link);

  // Template Container
  const root = document.createElement('div');
  root.id = 'gvcn-root';
  shadow.appendChild(root);

  // Load Initial Data from background
  async function loadData() {
    chrome.runtime.sendMessage({ action: 'fetchClassData' }, (res) => {
      if (res && res.data) {
        students = res.data.students || [];
        currentClass = res.data.currentClass?.name || '4A1';
        render();
      } else {
        // Fallback demo students
        students = [
          { id: 'hs-1', fullName: 'Vũ Huệ An', gender: 'Nữ', teamId: 1, stars: 18 },
          { id: 'hs-2', fullName: 'Đào Châm Anh', gender: 'Nữ', teamId: 1, stars: 15 },
          { id: 'hs-3', fullName: 'Nguyễn Minh An', gender: 'Nam', teamId: 2, stars: 22 },
          { id: 'hs-4', fullName: 'Trần Bảo Châu', gender: 'Nữ', teamId: 2, stars: 24 },
          { id: 'hs-5', fullName: 'Lê Hoàng Nam', gender: 'Nam', teamId: 3, stars: 19 },
          { id: 'hs-6', fullName: 'Phạm Đức Duy', gender: 'Nam', teamId: 3, stars: 16 },
          { id: 'hs-7', fullName: 'Hoàng Lan Hương', gender: 'Nữ', teamId: 4, stars: 20 },
          { id: 'hs-8', fullName: 'Đỗ Tuấn Kiệt', gender: 'Nam', teamId: 4, stars: 17 },
        ];
        render();
      }
    });
  }

  // Position coordinates for dragging
  let dockPos = { x: window.innerWidth - 380, y: window.innerHeight - 80 };
  try {
    const saved = localStorage.getItem('gvcn_dock_pos');
    if (saved) dockPos = JSON.parse(saved);
  } catch (e) {}

  // Render UI
  function render() {
    root.innerHTML = `
      <!-- Collapsed Floating Bubble -->
      <div id="gvcn-bubble" class="gvcn-bubble ${!isDockCollapsed ? 'gvcn-hidden' : ''}" style="bottom: 24px; right: 24px;">
        <span class="gvcn-bubble-icon">🎓</span>
        <span class="gvcn-bubble-text">
          GVCN Pro
          <span class="gvcn-bubble-class">${currentClass}</span>
        </span>
      </div>

      <!-- Main Horizontal Dock -->
      <div id="gvcn-dock" class="gvcn-dock ${isDockCollapsed || !isDockVisible ? 'gvcn-hidden' : ''}" style="left: ${dockPos.x}px; top: ${dockPos.y}px;">
        <div class="gvcn-drag-handle" id="gvcn-drag" title="Kéo thả vị trí">⋮⋮</div>
        
        <button class="gvcn-dock-btn" id="btn-tool-wheel" title="Vòng quay bốc thăm học sinh">
          <span class="gvcn-dock-btn-icon">🎲</span>
          <span class="gvcn-dock-btn-label">Bốc Thăm</span>
        </button>

        <button class="gvcn-dock-btn" id="btn-tool-timer" title="Bấm giờ hoạt động nhóm">
          <span class="gvcn-dock-btn-icon">⏱️</span>
          <span class="gvcn-dock-btn-label">Bấm Giờ</span>
        </button>

        <button class="gvcn-dock-btn" id="btn-tool-star" title="Khen thưởng sao nóng">
          <span class="gvcn-dock-btn-icon">⭐</span>
          <span class="gvcn-dock-btn-label">Tặng Sao</span>
        </button>

        <button class="gvcn-dock-btn" id="btn-tool-sound" title="Chuông hiệu lệnh lớp học">
          <span class="gvcn-dock-btn-icon">🔔</span>
          <span class="gvcn-dock-btn-label">Chuông</span>
        </button>

        <button class="gvcn-dock-btn" id="btn-tool-group" title="Chia nhóm ngẫu nhiên">
          <span class="gvcn-dock-btn-icon">👥</span>
          <span class="gvcn-dock-btn-label">Chia Nhóm</span>
        </button>

        <button class="gvcn-dock-btn" id="btn-tool-briefing" title="Nhắc việc & Sĩ số hôm nay">
          <span class="gvcn-dock-btn-icon">📢</span>
          <span class="gvcn-dock-btn-label">Nhắc Việc</span>
        </button>

        <div class="gvcn-divider"></div>

        <button class="gvcn-close-btn" id="btn-dock-minimize" title="Thu nhỏ (Alt+G)">
          <span>➖</span>
        </button>
      </div>

      <!-- Mini Floating Timer (when modal is closed but timer is running) -->
      <div id="gvcn-mini-timer" class="gvcn-mini-timer ${!isTimerRunning || activeModal === 'timer' ? 'gvcn-hidden' : ''}">
        <span>⏱️</span>
        <span id="gvcn-mini-timer-text">${formatTime(timerRemainingSec)}</span>
      </div>

      <!-- Modals Container -->
      <div id="gvcn-modal-container" class="${!activeModal ? 'gvcn-hidden' : ''}">
        ${renderActiveModal()}
      </div>
    `;

    attachEvents();
  }

  function renderActiveModal() {
    if (!activeModal) return '';

    // MODAL 1: RANDOM PICKER / WHEEL
    if (activeModal === 'wheel') {
      return `
        <div class="gvcn-modal-overlay" id="gvcn-overlay">
          <div class="gvcn-modal-card">
            <div class="gvcn-modal-header">
              <div class="gvcn-modal-title">🎲 Bốc Thăm Ngẫu Nhiên (Lớp ${currentClass})</div>
              <button class="gvcn-close-btn" id="btn-modal-close">✕</button>
            </div>
            <div class="gvcn-modal-body">
              <div class="gvcn-wheel-container">
                <div class="gvcn-wheel-canvas-box">
                  <div class="gvcn-wheel-pointer"></div>
                  <canvas id="gvcn-canvas-wheel" width="260" height="260"></canvas>
                </div>

                ${currentWinner ? `
                  <div class="gvcn-winner-banner">
                    <div class="gvcn-winner-sub">🎉 Chúc mừng em</div>
                    <div class="gvcn-winner-name">${currentWinner.fullName}</div>
                    <div class="gvcn-winner-sub">Tổ ${currentWinner.teamId || 1} • Đang có ${currentWinner.stars || 0} ⭐</div>
                    <button class="gvcn-btn-primary" id="btn-reward-winner" style="margin-top: 10px;">
                      ⭐ Thưởng +1 Sao Khích Lệ
                    </button>
                  </div>
                ` : ''}

                <div style="display:flex; gap:10px; width:100%; justify-content:center; margin-top:8px;">
                  <button class="gvcn-btn-primary" id="btn-spin-wheel" ${isSpinning ? 'disabled' : ''} style="flex:1; font-size:15px; padding:12px;">
                    ${isSpinning ? '🌀 Đang quay...' : '🎯 Bắt Đầu Quay'}
                  </button>
                  <button class="gvcn-btn-secondary" id="btn-quick-pick" title="Chọn tức thì không cần quay">
                    ⚡ Bốc Nhanh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // MODAL 2: CLASSROOM TIMER
    if (activeModal === 'timer') {
      return `
        <div class="gvcn-modal-overlay" id="gvcn-overlay">
          <div class="gvcn-modal-card">
            <div class="gvcn-modal-header">
              <div class="gvcn-modal-title">⏱️ Đồng Hồ Đếm Ngược Hoạt Động Nhóm</div>
              <button class="gvcn-close-btn" id="btn-modal-close">✕</button>
            </div>
            <div class="gvcn-modal-body">
              <div class="gvcn-timer-presets">
                <button class="gvcn-preset-btn ${timerTotalSec === 60 ? 'active' : ''}" data-sec="60">1 Phút</button>
                <button class="gvcn-preset-btn ${timerTotalSec === 120 ? 'active' : ''}" data-sec="120">2 Phút</button>
                <button class="gvcn-preset-btn ${timerTotalSec === 180 ? 'active' : ''}" data-sec="180">3 Phút</button>
                <button class="gvcn-preset-btn ${timerTotalSec === 300 ? 'active' : ''}" data-sec="300">5 Phút</button>
                <button class="gvcn-preset-btn ${timerTotalSec === 600 ? 'active' : ''}" data-sec="600">10 Phút</button>
              </div>

              <div class="gvcn-timer-big" id="gvcn-timer-num">${formatTime(timerRemainingSec)}</div>

              <div style="display:flex; gap:10px; justify-content:center; margin-top:12px;">
                <button class="gvcn-btn-primary" id="btn-timer-toggle" style="flex:2; font-size:15px;">
                  ${isTimerRunning ? '⏸️ Tạm Dừng' : '▶️ Bắt Đầu'}
                </button>
                <button class="gvcn-btn-secondary" id="btn-timer-reset" style="flex:1;">
                  🔄 Đặt Lại
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // MODAL 3: INSTANT STAR REWARD
    if (activeModal === 'star') {
      return `
        <div class="gvcn-modal-overlay" id="gvcn-overlay">
          <div class="gvcn-modal-card">
            <div class="gvcn-modal-header">
              <div class="gvcn-modal-title">⭐ Khen Thưởng Sao Nóng Trên Lớp</div>
              <button class="gvcn-close-btn" id="btn-modal-close">✕</button>
            </div>
            <div class="gvcn-modal-body">
              <input type="text" id="gvcn-star-search" class="gvcn-search-input" placeholder="🔍 Tìm tên học sinh phát biểu tốt...">
              
              <div class="gvcn-student-chips" id="gvcn-student-chips">
                ${students.slice(0, 30).map((s) => `
                  <div class="gvcn-chip ${selectedStudentForStar?.id === s.id ? 'selected' : ''}" data-id="${s.id}">
                    <span>${s.gender === 'Nữ' ? '🌸' : '👦'}</span>
                    <span>${s.fullName}</span>
                    <span style="font-size:10px; opacity:0.8;">(${s.stars || 0} ⭐)</span>
                  </div>
                `).join('')}
              </div>

              <div style="font-size:12px; font-weight:700; color:#64748b; margin-bottom:6px;">LÝ DO KHEN THƯỞNG:</div>
              <div class="gvcn-reason-tags">
                ${['Phát biểu hăng hái', 'Làm bài xuất sắc', 'Giúp đỡ bạn bè', 'Chữ viết sạch đẹp', 'Trật tự nề nếp'].map((r) => `
                  <span class="gvcn-reason-tag ${selectedStarReason === r ? 'active' : ''}" data-reason="${r}">${r}</span>
                `).join('')}
              </div>

              <div style="display:flex; gap:8px; margin-top:10px;">
                <button class="gvcn-btn-primary" id="btn-give-1-star" style="flex:1;">+1 ⭐ Thưởng</button>
                <button class="gvcn-btn-primary" id="btn-give-2-stars" style="flex:1; background:linear-gradient(135deg, #f59e0b, #d97706);">+2 ⭐ Xuất Sắc</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // MODAL 4: CLASSROOM ATTENTION CHIMES
    if (activeModal === 'sound') {
      return `
        <div class="gvcn-modal-overlay" id="gvcn-overlay">
          <div class="gvcn-modal-card">
            <div class="gvcn-modal-header">
              <div class="gvcn-modal-title">🔔 Chuông & Hiệu Lệnh Lớp Học</div>
              <button class="gvcn-close-btn" id="btn-modal-close">✕</button>
            </div>
            <div class="gvcn-modal-body">
              <div class="gvcn-sound-grid">
                <div class="gvcn-sound-card" id="snd-attention">
                  <div class="gvcn-sound-icon">🛎️</div>
                  <div>
                    <div class="gvcn-sound-name">Chuông Trật Tự</div>
                    <div class="gvcn-sound-sub">Nhắc lớp ổn định</div>
                  </div>
                </div>
                <div class="gvcn-sound-card" id="snd-applause">
                  <div class="gvcn-sound-icon">👏</div>
                  <div>
                    <div class="gvcn-sound-name">Tiếng Vỗ Tay</div>
                    <div class="gvcn-sound-sub">Tuyên dương cả lớp</div>
                  </div>
                </div>
                <div class="gvcn-sound-card" id="snd-timeup">
                  <div class="gvcn-sound-icon">⏰</div>
                  <div>
                    <div class="gvcn-sound-name">Chuông Hết Giờ</div>
                    <div class="gvcn-sound-sub">Hết giờ thảo luận</div>
                  </div>
                </div>
                <div class="gvcn-sound-card" id="snd-fanfare">
                  <div class="gvcn-sound-icon">🎺</div>
                  <div>
                    <div class="gvcn-sound-name">Fanfare Khởi Sắc</div>
                    <div class="gvcn-sound-sub">Trả lời đúng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // MODAL 5: GROUP MAKER
    if (activeModal === 'group') {
      return `
        <div class="gvcn-modal-overlay" id="gvcn-overlay">
          <div class="gvcn-modal-card" style="width: 520px;">
            <div class="gvcn-modal-header">
              <div class="gvcn-modal-title">👥 Chia Nhóm Ngẫu Nhiên Thần Tốc</div>
              <button class="gvcn-close-btn" id="btn-modal-close">✕</button>
            </div>
            <div class="gvcn-modal-body">
              <div style="display:flex; gap:8px; margin-bottom:12px;">
                <button class="gvcn-btn-secondary gvcn-grp-type active" data-type="4" style="flex:1;">Nhóm 4 em</button>
                <button class="gvcn-btn-secondary gvcn-grp-type" data-type="6" style="flex:1;">Nhóm 6 em</button>
                <button class="gvcn-btn-secondary gvcn-grp-type" data-type="2teams" style="flex:1;">2 Đội Thi Đua</button>
              </div>
              <div id="gvcn-group-results" style="max-height:300px; overflow-y:auto; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                ${renderGeneratedGroups(4)}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // MODAL 6: DAILY BRIEFING
    if (activeModal === 'briefing') {
      return `
        <div class="gvcn-modal-overlay" id="gvcn-overlay">
          <div class="gvcn-modal-card">
            <div class="gvcn-modal-header">
              <div class="gvcn-modal-title">📢 Thông Tin Lớp Học Trong Ngày</div>
              <button class="gvcn-close-btn" id="btn-modal-close">✕</button>
            </div>
            <div class="gvcn-modal-body">
              <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:10px; border:1px solid #e2e8f0;">
                <div style="font-weight:800; color:#0f172a; margin-bottom:4px;">📊 Sĩ số hôm nay: 55 học sinh</div>
                <div style="font-size:12px; color:#059669;">✓ Có mặt: 54 học sinh</div>
                <div style="font-size:12px; color:#ef4444;">✗ Vắng: 1 học sinh (Trần Đức Minh - Có phép)</div>
                <div style="font-size:12px; color:#475569;">🍽️ Bán trú: 55 học sinh</div>
              </div>
              <div style="background:#ecfdf5; padding:12px; border-radius:12px; border:1px solid #a7f3d0;">
                <div style="font-weight:800; color:#065f46; margin-bottom:4px;">📌 Nhắc việc giáo viên chủ nhiệm:</div>
                <ul style="font-size:12px; color:#047857; padding-left:18px; line-height:1.6;">
                  <li>Nhắc học sinh mang đầy đủ đồ dùng môn Mĩ thuật chiều nay.</li>
                  <li>Tổ 3 chuẩn bị trực nhật và xếp bàn ghế trước giờ ăn bán trú.</li>
                  <li>Thu phiếu đăng ký ngoại khóa bảo tàng hạn cuối thứ 6.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  function renderGeneratedGroups(sizeOrType) {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    if (sizeOrType === '2teams') {
      const mid = Math.ceil(shuffled.length / 2);
      const team1 = shuffled.slice(0, mid);
      const team2 = shuffled.slice(mid);
      return `
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:10px;">
          <div style="font-weight:800; color:#1d4ed8; margin-bottom:6px;">🐉 ĐỘI RỒNG VÀNG (${team1.length} em)</div>
          <div style="font-size:11.5px; line-height:1.5;">${team1.slice(0, 8).map(s => s.fullName).join(', ')}...</div>
        </div>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:10px;">
          <div style="font-weight:800; color:#b91c1c; margin-bottom:6px;">🐯 ĐỘI HỔ TRẮNG (${team2.length} em)</div>
          <div style="font-size:11.5px; line-height:1.5;">${team2.slice(0, 8).map(s => s.fullName).join(', ')}...</div>
        </div>
      `;
    }

    const size = parseInt(sizeOrType) || 4;
    const numGroups = Math.ceil(shuffled.length / size);
    let html = '';
    for (let i = 0; i < Math.min(numGroups, 8); i++) {
      const grpMembers = shuffled.slice(i * size, (i + 1) * size);
      html += `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px;">
          <div style="font-weight:800; font-size:12px; color:#0f172a; margin-bottom:4px;">Nhóm ${i + 1} (${grpMembers.length} em)</div>
          <div style="font-size:11px; color:#475569;">${grpMembers.map(s => s.fullName).join(', ')}</div>
        </div>
      `;
    }
    return html;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // Draw Canvas Lucky Wheel
  function drawWheel(angle = 0) {
    const canvas = shadow.getElementById('gvcn-canvas-wheel');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const r = w / 2;
    ctx.clearRect(0, 0, w, h);

    const pool = students.length > 0 ? students.slice(0, 16) : [{ fullName: 'Học sinh 1' }];
    const count = pool.length;
    const arc = (2 * Math.PI) / count;
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(angle);

    for (let i = 0; i < count; i++) {
      const start = i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 4, start, end);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px -apple-system, Roboto, sans-serif';
      ctx.fillText(pool[i].fullName.split(' ').slice(-2).join(' '), r - 16, 4);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  // Spin Wheel Animation
  function spinWheel() {
    if (isSpinning || students.length === 0) return;
    isSpinning = true;
    AudioEngine.playAttentionBell();

    const pool = students.slice(0, 16);
    const chosenIndex = Math.floor(Math.random() * pool.length);
    const arc = (2 * Math.PI) / pool.length;
    
    // Calculate final angle pointing at top pointer (3*PI/2)
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = extraSpins * 2 * Math.PI + (3 * Math.PI / 2) - (chosenIndex * arc + arc / 2);

    let start = null;
    const duration = 3600;

    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = ease * targetAngle;

      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        currentWinner = pool[chosenIndex];
        AudioEngine.playStarFanfare();
        render();
        // Redraw wheel at resting angle
        setTimeout(() => drawWheel(targetAngle), 50);
      }
    }
    requestAnimationFrame(animate);
  }

  // Quick Pick without wheel
  function quickPick() {
    if (students.length === 0) return;
    const idx = Math.floor(Math.random() * students.length);
    currentWinner = students[idx];
    AudioEngine.playStarFanfare();
    render();
  }

  // Flying Star FX
  function spawnFlyingStar(x, y) {
    const star = document.createElement('div');
    star.className = 'gvcn-flying-star';
    star.textContent = '⭐';
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    shadow.appendChild(star);
    setTimeout(() => star.remove(), 1300);
  }

  // Event Listeners
  function attachEvents() {
    // 1. Bubble click -> expand dock
    const bubble = shadow.getElementById('gvcn-bubble');
    if (bubble) {
      bubble.addEventListener('click', () => {
        isDockCollapsed = false;
        render();
      });
    }

    // 2. Dock minimize -> collapse to bubble
    const btnMin = shadow.getElementById('btn-dock-minimize');
    if (btnMin) {
      btnMin.addEventListener('click', () => {
        isDockCollapsed = true;
        render();
      });
    }

    // 3. Tool buttons
    const tools = ['wheel', 'timer', 'star', 'sound', 'group', 'briefing'];
    tools.forEach((t) => {
      const btn = shadow.getElementById(`btn-tool-${t}`);
      if (btn) {
        btn.addEventListener('click', () => {
          activeModal = activeModal === t ? null : t;
          render();
          if (activeModal === 'wheel') {
            setTimeout(() => drawWheel(0), 50);
          }
        });
      }
    });

    // 4. Modal close / overlay click
    const btnClose = shadow.getElementById('btn-modal-close');
    const overlay = shadow.getElementById('gvcn-overlay');
    if (btnClose) btnClose.addEventListener('click', () => { activeModal = null; render(); });
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          activeModal = null;
          render();
        }
      });
    }

    // 5. Wheel actions
    const btnSpin = shadow.getElementById('btn-spin-wheel');
    const btnQuick = shadow.getElementById('btn-quick-pick');
    const btnRewardWinner = shadow.getElementById('btn-reward-winner');
    if (btnSpin) btnSpin.addEventListener('click', spinWheel);
    if (btnQuick) btnQuick.addEventListener('click', quickPick);
    if (btnRewardWinner && currentWinner) {
      btnRewardWinner.addEventListener('click', (e) => {
        const rect = btnRewardWinner.getBoundingClientRect();
        spawnFlyingStar(rect.left + 50, rect.top);
        AudioEngine.playStarFanfare();
        chrome.runtime.sendMessage({
          action: 'addStar',
          studentId: currentWinner.id,
          points: 1,
          reason: 'Trả lời bài xuất sắc trong vòng quay ngẫu nhiên'
        });
        btnRewardWinner.textContent = '✓ Đã Thưởng +1 ⭐';
        btnRewardWinner.disabled = true;
      });
    }

    // 6. Timer Actions
    const btnTimerToggle = shadow.getElementById('btn-timer-toggle');
    const btnTimerReset = shadow.getElementById('btn-timer-reset');
    if (btnTimerToggle) {
      btnTimerToggle.addEventListener('click', () => {
        isTimerRunning = !isTimerRunning;
        if (isTimerRunning) {
          clearInterval(timerInterval);
          timerInterval = setInterval(() => {
            if (timerRemainingSec > 0) {
              timerRemainingSec--;
              const numEl = shadow.getElementById('gvcn-timer-num');
              const miniText = shadow.getElementById('gvcn-mini-timer-text');
              if (numEl) numEl.textContent = formatTime(timerRemainingSec);
              if (miniText) miniText.textContent = formatTime(timerRemainingSec);
            } else {
              clearInterval(timerInterval);
              isTimerRunning = false;
              AudioEngine.playTimeUpGong();
              render();
            }
          }, 1000);
        } else {
          clearInterval(timerInterval);
        }
        render();
      });
    }
    if (btnTimerReset) {
      btnTimerReset.addEventListener('click', () => {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerRemainingSec = timerTotalSec;
        render();
      });
    }
    shadow.querySelectorAll('.gvcn-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerTotalSec = parseInt(btn.getAttribute('data-sec'));
        timerRemainingSec = timerTotalSec;
        render();
      });
    });

    // 7. Mini timer click -> reopen timer modal
    const miniTimer = shadow.getElementById('gvcn-mini-timer');
    if (miniTimer) {
      miniTimer.addEventListener('click', () => {
        activeModal = 'timer';
        render();
      });
    }

    // 8. Sounds Trigger
    const sndAttention = shadow.getElementById('snd-attention');
    const sndApplause = shadow.getElementById('snd-applause');
    const sndTimeup = shadow.getElementById('snd-timeup');
    const sndFanfare = shadow.getElementById('snd-fanfare');
    if (sndAttention) sndAttention.addEventListener('click', () => AudioEngine.playAttentionBell());
    if (sndApplause) sndApplause.addEventListener('click', () => AudioEngine.playApplause());
    if (sndTimeup) sndTimeup.addEventListener('click', () => AudioEngine.playTimeUpGong());
    if (sndFanfare) sndFanfare.addEventListener('click', () => AudioEngine.playStarFanfare());

    // 9. Star Awarding
    shadow.querySelectorAll('.gvcn-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const id = chip.getAttribute('data-id');
        selectedStudentForStar = students.find((s) => s.id === id);
        render();
      });
    });
    shadow.querySelectorAll('.gvcn-reason-tag').forEach((tag) => {
      tag.addEventListener('click', () => {
        selectedStarReason = tag.getAttribute('data-reason');
        render();
      });
    });
    const starSearch = shadow.getElementById('gvcn-star-search');
    if (starSearch) {
      starSearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const chipsContainer = shadow.getElementById('gvcn-student-chips');
        if (chipsContainer) {
          const filtered = students.filter(s => s.fullName.toLowerCase().includes(q));
          chipsContainer.innerHTML = filtered.slice(0, 30).map(s => `
            <div class="gvcn-chip ${selectedStudentForStar?.id === s.id ? 'selected' : ''}" data-id="${s.id}">
              <span>${s.gender === 'Nữ' ? '🌸' : '👦'}</span>
              <span>${s.fullName}</span>
              <span style="font-size:10px; opacity:0.8;">(${s.stars || 0} ⭐)</span>
            </div>
          `).join('');
          chipsContainer.querySelectorAll('.gvcn-chip').forEach(c => {
            c.addEventListener('click', () => {
              selectedStudentForStar = students.find(s => s.id === c.getAttribute('data-id'));
              render();
            });
          });
        }
      });
    }
    const btnGive1 = shadow.getElementById('btn-give-1-star');
    const btnGive2 = shadow.getElementById('btn-give-2-stars');
    [btnGive1, btnGive2].forEach((btn, idx) => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          if (!selectedStudentForStar) {
            alert('Vui lòng chọn 1 học sinh nhận thưởng!');
            return;
          }
          const points = idx === 0 ? 1 : 2;
          const rect = btn.getBoundingClientRect();
          spawnFlyingStar(rect.left + 40, rect.top);
          AudioEngine.playStarFanfare();

          chrome.runtime.sendMessage({
            action: 'addStar',
            studentId: selectedStudentForStar.id,
            points,
            reason: selectedStarReason
          });

          selectedStudentForStar.stars = (selectedStudentForStar.stars || 0) + points;
          alert(`✓ Đã thưởng +${points} ⭐ cho ${selectedStudentForStar.fullName}!`);
        });
      }
    });

    // 10. Dragging Floating Dock
    const dragHandle = shadow.getElementById('gvcn-drag');
    const dockEl = shadow.getElementById('gvcn-dock');
    if (dragHandle && dockEl) {
      let isDragging = false;
      let startX, startY, initLeft, initTop;

      dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = dockEl.getBoundingClientRect();
        initLeft = rect.left;
        initTop = rect.top;
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        dockPos.x = Math.max(10, Math.min(window.innerWidth - 380, initLeft + dx));
        dockPos.y = Math.max(10, Math.min(window.innerHeight - 80, initTop + dy));
        dockEl.style.left = `${dockPos.x}px`;
        dockEl.style.top = `${dockPos.y}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          try {
            localStorage.setItem('gvcn_dock_pos', JSON.stringify(dockPos));
          } catch (e) {}
        }
      });
    }
  }

  // Listen to messages from background / popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'toggleDock') {
      isDockVisible = !isDockVisible;
      render();
    }
    if (msg.action === 'setDockVisibility') {
      isDockVisible = msg.visible;
      render();
    }
    if (msg.action === 'studentStarUpdated') {
      const match = students.find((s) => s.id === msg.studentId);
      if (match && msg.stars !== undefined) {
        match.stars = msg.stars;
        render();
      }
    }
  });

  // Start
  loadData();
})();
