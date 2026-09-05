/**
 * Popup Script for GVCN Pro Extension
 */

document.addEventListener('DOMContentLoaded', async () => {
  const loggedOutSection = document.getElementById('loggedOutSection');
  const loggedInSection = document.getElementById('loggedInSection');

  const btnLoginGoogle = document.getElementById('btnLoginGoogle');
  const btnLoginWebSync = document.getElementById('btnLoginWebSync');
  const btnDemoTrial = document.getElementById('btnDemoTrial');
  const btnLogout = document.getElementById('btnLogout');

  const teacherAvatar = document.getElementById('teacherAvatar');
  const teacherName = document.getElementById('teacherName');
  const teacherInfo = document.getElementById('teacherInfo');
  const classSelect = document.getElementById('classSelect');

  const statTotal = document.getElementById('statTotal');
  const statPresent = document.getElementById('statPresent');
  const statAbsent = document.getElementById('statAbsent');
  const statBoarding = document.getElementById('statBoarding');

  const dockToggle = document.getElementById('dockToggle');
  const btnOpenSidePanel = document.getElementById('btnOpenSidePanel');
  const btnSyncNow = document.getElementById('btnSyncNow');

  // 1. Initial State Load
  async function refreshUI() {
    const data = await chrome.storage.local.get([
      'authStatus',
      'teacherProfile',
      'currentClass',
      'dockEnabled',
      'cachedClassData',
    ]);

    const isLoggedIn = data.authStatus === 'logged_in';

    if (!isLoggedIn) {
      loggedOutSection.classList.remove('hidden');
      loggedInSection.classList.add('hidden');
    } else {
      loggedOutSection.classList.add('hidden');
      loggedInSection.classList.remove('hidden');

      const profile = data.teacherProfile || {
        fullName: 'Cô Nguyễn Thị Minh Hằng',
        email: 'hangnm47@gmail.com',
        assignedClassName: '4A1',
        avatarUrl: 'icons/icon-48.png',
      };

      teacherName.textContent = profile.fullName;
      teacherInfo.textContent = `${profile.email} • Lớp ${data.currentClass || profile.assignedClassName || '4A1'}`;
      if (profile.avatarUrl) {
        teacherAvatar.src = profile.avatarUrl;
      }

      if (data.currentClass) {
        classSelect.value = data.currentClass;
      }

      dockToggle.checked = data.dockEnabled !== false;

      // Update statistics
      const classData = data.cachedClassData;
      if (classData) {
        statTotal.textContent = classData.currentClass?.totalStudents || 55;
        statPresent.textContent = classData.todayAttendance?.present || 54;
        statAbsent.textContent = classData.todayAttendance?.absent || 1;
        statBoarding.textContent = classData.todayAttendance?.boarding || 55;
      }
    }
  }

  // 2. Event Listeners for Login Flow
  btnLoginGoogle.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://gvcn-eta.vercel.app/login?source=chrome_extension' });
  });

  btnLoginWebSync.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'loginWebSync' }, (res) => {
      if (res && res.success) {
        alert(res.message || 'Đã đồng bộ thành công!');
        refreshUI();
      }
    });
  });

  btnDemoTrial.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'loginDemo' }, (res) => {
      if (res && res.success) {
        refreshUI();
      }
    });
  });

  btnLogout.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn đăng xuất khỏi tiện ích?')) {
      chrome.runtime.sendMessage({ action: 'logout' }, () => {
        refreshUI();
      });
    }
  });

  // 3. Class Switcher
  classSelect.addEventListener('change', (e) => {
    const chosen = e.target.value;
    chrome.storage.local.set({ currentClass: chosen }, () => {
      chrome.runtime.sendMessage({ action: 'syncClassData', className: chosen }, (res) => {
        refreshUI();
      });
    });
  });

  // 4. Dock Toggle
  dockToggle.addEventListener('change', (e) => {
    chrome.runtime.sendMessage({ action: 'toggleDockGlobal', enabled: e.target.checked });
  });

  // 5. Open Side Panel
  btnOpenSidePanel.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      window.close();
    }
  });

  // 6. Manual Sync
  btnSyncNow.addEventListener('click', () => {
    btnSyncNow.textContent = '⏳ Đang đồng bộ...';
    chrome.runtime.sendMessage({ action: 'syncClassData' }, (res) => {
      btnSyncNow.textContent = '✓ Đã đồng bộ!';
      setTimeout(() => {
        btnSyncNow.innerHTML = '<span>🔄 Đồng bộ dữ liệu mới nhất</span>';
      }, 1500);
      refreshUI();
    });
  });

  // Init
  refreshUI();
});
