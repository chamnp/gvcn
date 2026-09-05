/**
 * Background Service Worker for GVCN Pro Extension
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[GVCN Pro Extension] Installed successfully.');
  // Set default settings if not exists
  chrome.storage.sync.get(['apiUrl', 'apiKey'], (result) => {
    if (!result.apiUrl) {
      chrome.storage.sync.set({
        apiUrl: 'https://gvcn-eta.vercel.app',
        apiKey: 'gvcn_pat_demo_teacher_2026_pro',
      });
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    if (sender.tab && sender.tab.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
      sendResponse({ success: true });
    }
  }

  if (request.action === 'fetchClassData') {
    chrome.storage.sync.get(['apiUrl', 'apiKey'], async (cfg) => {
      const baseUrl = cfg.apiUrl || 'https://gvcn-eta.vercel.app';
      const key = cfg.apiKey || 'gvcn_pat_demo_teacher_2026_pro';
      try {
        const res = await fetch(`${baseUrl}/api/v1/overview`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        const data = await res.json();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'fetchStudents') {
    chrome.storage.sync.get(['apiUrl', 'apiKey'], async (cfg) => {
      const baseUrl = cfg.apiUrl || 'https://gvcn-eta.vercel.app';
      const key = cfg.apiKey || 'gvcn_pat_demo_teacher_2026_pro';
      try {
        const res = await fetch(`${baseUrl}/api/v1/students`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        const data = await res.json();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }
});
