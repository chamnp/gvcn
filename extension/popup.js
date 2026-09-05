/**
 * Popup Script for GVCN Pro Extension
 */

document.addEventListener('DOMContentLoaded', async () => {
  const btnSidePanel = document.getElementById('btnOpenSidePanel');
  const statTotal = document.getElementById('statTotal');
  const statMale = document.getElementById('statMale');
  const statFemale = document.getElementById('statFemale');
  const statBoarding = document.getElementById('statBoarding');
  const statusText = document.getElementById('statusText');

  // Open side panel
  btnSidePanel.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      window.close(); // Close popup after opening side panel
    }
  });

  // Fetch live class data
  chrome.runtime.sendMessage({ action: 'fetchClassData' }, (res) => {
    if (res && res.success && res.data) {
      const d = res.data;
      statTotal.textContent = d.totalStudents || 55;
      statMale.textContent = d.genderDistribution?.male || 31;
      statFemale.textContent = d.genderDistribution?.female || 24;
      statBoarding.textContent = d.boardingStudents || 55;
      statusText.textContent = `Lớp ${d.className || '4A1'} (${d.teacherName || 'Cô Ánh'})`;
    }
  });
});
