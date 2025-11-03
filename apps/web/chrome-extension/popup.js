document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const infoEl = document.querySelector('.info');
  // Add new UI elements
  let syncEl = document.getElementById('last-sync');
  let unsentEl = document.getElementById('unsent-logs');
  if (!syncEl) {
    syncEl = document.createElement('div');
    syncEl.id = 'last-sync';
    syncEl.style.fontSize = '0.9em';
    syncEl.style.marginBottom = '4px';
    infoEl.parentNode.insertBefore(syncEl, infoEl.nextSibling);
  }
  if (!unsentEl) {
    unsentEl = document.createElement('div');
    unsentEl.id = 'unsent-logs';
    unsentEl.style.fontSize = '0.9em';
    unsentEl.style.marginBottom = '8px';
    syncEl.parentNode.insertBefore(unsentEl, syncEl.nextSibling);
  }
  const notTrackedNotice = document.getElementById('not-tracked-notice');
  // Get status from background
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, response => {
    if (response && response.isClockedIn) {
      statusEl.textContent = 'Tracking: ON (Clocked In)';
      statusEl.style.color = '#388e3c';
      if (notTrackedNotice) notTrackedNotice.style.display = 'none';
    } else {
      statusEl.textContent = 'Tracking: OFF (Clocked Out)';
      statusEl.style.color = '#b71c1c';
      if (notTrackedNotice) notTrackedNotice.style.display = 'block';
    }
  });
  // Get last sync and unsent logs from storage
  chrome.storage.local.get(['lastSyncTime', 'unsentLogs'], result => {
    if (result.lastSyncTime) {
      const d = new Date(result.lastSyncTime);
      syncEl.textContent = 'Last sync: ' + d.toLocaleString();
    } else {
      syncEl.textContent = 'Last sync: Never';
    }
    const unsent = Array.isArray(result.unsentLogs) ? result.unsentLogs.length : 0;
    unsentEl.textContent = 'Unsent logs: ' + unsent;
  });
}); 