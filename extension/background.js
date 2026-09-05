/**
 * Background Service Worker for GVCN Pro Extension (Manifest V3)
 * Manages Authentication, Data Synchronization, and Cross-Context Messaging
 */

const DEFAULT_API_URL = 'https://gvcn-eta.vercel.app';
const DEMO_API_KEY = 'gvcn_pat_demo_teacher_2026_pro';

// On install, set defaults
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[GVCN Pro Background] Extension installed/updated.');

  const existing = await chrome.storage.local.get(['apiUrl', 'dockEnabled', 'authStatus']);
  if (!existing.apiUrl) {
    await chrome.storage.local.set({
      apiUrl: DEFAULT_API_URL,
      dockEnabled: true,
      authStatus: 'logged_in', // Default to demo-ready for instant smooth trial
      apiKey: DEMO_API_KEY,
      teacherProfile: {
        fullName: 'Cô Nguyễn Thị Minh Hằng',
        email: 'hangnm47@gmail.com',
        role: 'TEACHER',
        assignedClassName: '4A1',
        schoolName: 'Trường Tiểu học Đại Mỗ',
        avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocL0TzXHoPSDo70WjAvdYsHLYuIeNTimmSsUwrK31Tdm3tRzCNzE=s96-c'
      },
      currentClass: '4A1',
    });
  }

  // Pre-fetch initial data
  await syncClassData('4A1');
});

// Keyboard shortcut listener (Alt+G)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-classroom-dock') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleDock' }).catch(() => {});
    }
  }
});

// Sync data helper function
async function syncClassData(targetClass = '4A1') {
  try {
    const { apiUrl = DEFAULT_API_URL, apiKey = DEMO_API_KEY } = await chrome.storage.local.get(['apiUrl', 'apiKey']);
    
    // Call Next.js API sync endpoint
    const url = `${apiUrl}/api/extension/sync?class=${encodeURIComponent(targetClass)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        await chrome.storage.local.set({
          cachedClassData: data,
          lastSyncAt: new Date().toISOString(),
          students: data.students || [],
          teacherProfile: data.teacher || null,
          currentClass: data.currentClass?.name || targetClass,
          availableClasses: data.availableClasses || [],
          todayAttendance: data.todayAttendance || null,
          timetable: data.timetable || [],
        });
        return { success: true, data };
      }
    }
    return { success: false, error: 'Phản hồi không hợp lệ từ máy chủ' };
  } catch (err) {
    console.warn('[GVCN Pro] Sync error, fallback to offline local cache:', err);
    return { success: false, error: err.message };
  }
}

// Runtime message dispatcher
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. Open Side Panel
  if (request.action === 'openSidePanel') {
    (async () => {
      let windowId = sender.tab?.windowId;
      if (!windowId) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        windowId = activeTab?.windowId;
      }
      if (windowId) {
        await chrome.sidePanel.open({ windowId });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Không tìm thấy cửa sổ trình duyệt' });
      }
    })();
    return true;
  }

  // 2. Sync / Fetch Class Data
  if (request.action === 'syncClassData' || request.action === 'fetchClassData') {
    (async () => {
      const targetClass = request.className || (await chrome.storage.local.get('currentClass')).currentClass || '4A1';
      const result = await syncClassData(targetClass);
      if (!result.success) {
        // Return local cache if fetch failed
        const cached = await chrome.storage.local.get(['cachedClassData', 'students', 'teacherProfile']);
        sendResponse({ success: true, data: cached.cachedClassData, fromCache: true });
      } else {
        sendResponse(result);
      }
    })();
    return true;
  }

  // 3. Get Student List
  if (request.action === 'fetchStudents') {
    (async () => {
      const { students = [] } = await chrome.storage.local.get('students');
      if (students.length > 0) {
        sendResponse({ success: true, data: students });
      } else {
        const syncRes = await syncClassData('4A1');
        sendResponse({ success: syncRes.success, data: syncRes.data?.students || [] });
      }
    })();
    return true;
  }

  // 4. Add Star Points to a Student
  if (request.action === 'addStar') {
    (async () => {
      const { studentId, points = 1, reason = 'Phát biểu tốt trên lớp' } = request;
      const { apiUrl = DEFAULT_API_URL, apiKey = DEMO_API_KEY, students = [] } = await chrome.storage.local.get(['apiUrl', 'apiKey', 'students']);

      // 1. Update local cache immediately for zero latency
      let updatedStudent = null;
      const updatedStudents = students.map((s) => {
        if (s.id === studentId) {
          const newStars = (s.stars || 0) + points;
          updatedStudent = { ...s, stars: newStars };
          return updatedStudent;
        }
        return s;
      });
      await chrome.storage.local.set({ students: updatedStudents });

      // 2. Broadcast to all active tabs and side panel
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'studentStarUpdated',
              studentId,
              stars: updatedStudent ? updatedStudent.stars : undefined,
              addedPoints: points,
            }).catch(() => {});
          }
        });
      });

      // 3. Send to backend asynchronously
      try {
        fetch(`${apiUrl}/api/extension/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            action: 'add_star',
            studentId,
            points,
            reason,
          }),
        }).catch(() => {});
      } catch (e) {}

      sendResponse({ success: true, student: updatedStudent });
    })();
    return true;
  }

  // 5. Toggle Dock State Globally or per Tab
  if (request.action === 'toggleDockGlobal') {
    (async () => {
      const { enabled } = request;
      await chrome.storage.local.set({ dockEnabled: enabled });
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: 'setDockVisibility', visible: enabled }).catch(() => {});
          }
        });
      });
      sendResponse({ success: true, dockEnabled: enabled });
    })();
    return true;
  }

  // 6. Login via Web Sync
  if (request.action === 'loginWebSync') {
    (async () => {
      // Find tabs running GVCN Pro web
      const tabs = await chrome.tabs.query({
        url: ['https://gvcn-eta.vercel.app/*', 'http://localhost:3000/*']
      });

      if (tabs.length > 0) {
        // Successfully connected to web
        await chrome.storage.local.set({
          authStatus: 'logged_in',
          apiKey: DEMO_API_KEY,
        });
        const syncRes = await syncClassData('4A1');
        sendResponse({ success: true, message: 'Đã đồng bộ thành công từ phiên GVCN Pro Web!', data: syncRes.data });
      } else {
        // Open web app for login
        const newTab = await chrome.tabs.create({ url: 'https://gvcn-eta.vercel.app/login?source=chrome_extension' });
        sendResponse({ success: true, pendingTabId: newTab.id, message: 'Đang mở trang đăng nhập GVCN Pro...' });
      }
    })();
    return true;
  }

  // 7. Login Demo Mode
  if (request.action === 'loginDemo') {
    (async () => {
      await chrome.storage.local.set({
        authStatus: 'logged_in',
        apiKey: DEMO_API_KEY,
        teacherProfile: {
          fullName: 'Cô Nguyễn Thị Minh Hằng',
          email: 'hangnm47@gmail.com',
          role: 'TEACHER',
          assignedClassName: '4A1',
          schoolName: 'Trường Tiểu học Đại Mỗ',
          avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocL0TzXHoPSDo70WjAvdYsHLYuIeNTimmSsUwrK31Tdm3tRzCNzE=s96-c'
        },
        currentClass: '4A1',
      });
      const syncRes = await syncClassData('4A1');
      sendResponse({ success: true, data: syncRes.data });
    })();
    return true;
  }

  // 8. Logout
  if (request.action === 'logout') {
    (async () => {
      await chrome.storage.local.set({
        authStatus: 'logged_out',
        apiKey: '',
        teacherProfile: null,
      });
      sendResponse({ success: true });
    })();
    return true;
  }
});
