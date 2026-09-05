/**
 * Background Service Worker for GVCN Pro Extension (Manifest V3)
 * Manages Authentication, Data Synchronization, Cross-Context Messaging & Automatic Updates
 */

const DEFAULT_API_URL = 'https://gvcn-eta.vercel.app';
const DEMO_API_KEY = 'gvcn_pat_demo_teacher_2026_pro';

// 1. Install & Initialize
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

  // Setup periodic update check alarm (every 3 hours)
  chrome.alarms.create('gvcn_auto_update_check', {
    periodInMinutes: 180,
  });

  // Check for updates immediately on install/reload
  await checkForExtensionUpdates();

  // Pre-fetch initial class data
  await syncClassData('4A1');
});

// 2. Alarm Listener for Periodic Auto-Update Checks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'gvcn_auto_update_check') {
    console.log('[GVCN Pro Background] Running scheduled update check...');
    await checkForExtensionUpdates();
  }
});

// 3. Native Chrome Update Event
if (chrome.runtime.onUpdateAvailable) {
  chrome.runtime.onUpdateAvailable.addListener((details) => {
    console.log('[GVCN Pro] Native update available:', details.version);
    // Reload extension to apply update immediately
    chrome.runtime.reload();
  });
}

// 4. Version Comparison Utility
function compareVersions(v1, v2) {
  const p1 = (v1 || '1.0.0').split('.').map(Number);
  const p2 = (v2 || '1.0.0').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

// 5. Check for Extension Updates against Remote API
async function checkForExtensionUpdates() {
  try {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version || '2.0.0';
    const { apiUrl = DEFAULT_API_URL } = await chrome.storage.local.get('apiUrl');

    // Also trigger Chrome's native update check if supported
    if (chrome.runtime.requestUpdateCheck) {
      chrome.runtime.requestUpdateCheck((status, details) => {
        if (status === 'update_available') {
          console.log('[GVCN Pro] Chrome native update available:', details?.version);
        }
      });
    }

    const res = await fetch(`${apiUrl}/api/extension/version`, { cache: 'no-store' });
    if (res.ok) {
      const info = await res.json();
      const hasNewer = compareVersions(info.version, currentVersion) > 0;

      const updateState = {
        hasUpdate: hasNewer,
        currentVersion,
        latestVersion: info.version,
        releaseDate: info.releaseDate,
        changelog: info.changelog || [],
        downloadUrl: info.downloadUrl || `${apiUrl}/downloads/gvcn-pro-extension.zip`,
        lastCheckedAt: new Date().toISOString(),
      };

      await chrome.storage.local.set({ extensionUpdateInfo: updateState });

      if (hasNewer) {
        // Set visual notification badge on action icon
        await chrome.action.setBadgeText({ text: 'MỚI' });
        await chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

        // Notify open tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'extensionUpdateAvailable',
                updateInfo: updateState,
              }).catch(() => {});
            }
          });
        });
      } else {
        await chrome.action.setBadgeText({ text: '' });
      }

      return updateState;
    }
  } catch (err) {
    console.warn('[GVCN Pro Background] Update check error:', err);
  }
  return { hasUpdate: false };
}

// 6. Keyboard shortcut listener (Alt+G)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-classroom-dock') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleDock' }).catch(() => {});
    }
  }
});

// 7. Sync data helper function
async function syncClassData(targetClass = '4A1') {
  try {
    const { apiUrl = DEFAULT_API_URL, apiKey = DEMO_API_KEY } = await chrome.storage.local.get(['apiUrl', 'apiKey']);
    
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

// 8. Runtime message dispatcher
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check for Updates Manual Trigger
  if (request.action === 'checkUpdateNow') {
    (async () => {
      const updateResult = await checkForExtensionUpdates();
      sendResponse({ success: true, updateInfo: updateResult });
    })();
    return true;
  }

  // Open Side Panel
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

  // Sync / Fetch Class Data
  if (request.action === 'syncClassData' || request.action === 'fetchClassData') {
    (async () => {
      const targetClass = request.className || (await chrome.storage.local.get('currentClass')).currentClass || '4A1';
      const result = await syncClassData(targetClass);
      if (!result.success) {
        const cached = await chrome.storage.local.get(['cachedClassData', 'students', 'teacherProfile']);
        sendResponse({ success: true, data: cached.cachedClassData, fromCache: true });
      } else {
        sendResponse(result);
      }
    })();
    return true;
  }

  // Get Student List
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

  // Add Star Points to a Student
  if (request.action === 'addStar') {
    (async () => {
      const { studentId, points = 1, reason = 'Phát biểu tốt trên lớp' } = request;
      const { apiUrl = DEFAULT_API_URL, apiKey = DEMO_API_KEY, students = [] } = await chrome.storage.local.get(['apiUrl', 'apiKey', 'students']);

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

  // Toggle Dock State
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

  // Login via Web Sync
  if (request.action === 'loginWebSync') {
    (async () => {
      const tabs = await chrome.tabs.query({
        url: ['https://gvcn-eta.vercel.app/*', 'http://localhost:3000/*']
      });

      if (tabs.length > 0) {
        await chrome.storage.local.set({
          authStatus: 'logged_in',
          apiKey: DEMO_API_KEY,
        });
        const syncRes = await syncClassData('4A1');
        sendResponse({ success: true, message: 'Đã đồng bộ thành công từ phiên GVCN Pro Web!', data: syncRes.data });
      } else {
        const newTab = await chrome.tabs.create({ url: 'https://gvcn-eta.vercel.app/login?source=chrome_extension' });
        sendResponse({ success: true, pendingTabId: newTab.id, message: 'Đang mở trang đăng nhập GVCN Pro...' });
      }
    })();
    return true;
  }

  // Login Demo Mode
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

  // Logout
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
