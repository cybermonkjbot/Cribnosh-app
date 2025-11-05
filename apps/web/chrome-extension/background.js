// CribNosh Activity Tracker Background Script

const POLL_INTERVAL = 30000; // 30 seconds
const LOG_SEND_INTERVAL = 5 * 60 * 1000; // 5 minutes

let isClockedIn = false;
let activityLogs = [];
let currentActivity = null;
let idleState = 'active';
let userIdentifier = null;
let unsentLogs = [];
let lastSyncTime = null;

const BASE_URL = '';
const CLOCKIN_STATUS_URL = BASE_URL + '/api/staff/clockin-status';
const LOGS_ENDPOINT = BASE_URL + '/api/timelogs/activity-tracker';

// Load user identifier and unsent logs from storage on startup
chrome.storage.local.get(['userIdentifier', 'unsentLogs'], result => {
  if (result.userIdentifier) userIdentifier = result.userIdentifier;
  if (Array.isArray(result.unsentLogs)) unsentLogs = result.unsentLogs;
});

// Helper: Try to fetch user identifier from staff portal DOM or API
async function fetchUserIdentifier() {
  // Try to get from API first (customize endpoint as needed)
  try {
    const res = await fetch('https://your-staff-portal-domain.com/api/staff/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.email) return data.email;
      if (data.username) return data.username;
    }
  } catch {}
  // Fallback: Try to scrape from DOM (if portal is open)
  return new Promise(resolve => {
    chrome.tabs.query({ url: '*://your-staff-portal-domain.com/*' }, tabs => {
      if (tabs.length === 0) return resolve(null);
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          // Customize selector as needed
          const el = document.querySelector('[data-user-email]');
          return el ? el.getAttribute('data-user-email') : null;
        }
      }, results => {
        resolve(results && results[0] && results[0].result);
      });
    });
  });
}

// On clock-in, ensure userIdentifier is set
async function ensureUserIdentifier() {
  if (!userIdentifier) {
    userIdentifier = await fetchUserIdentifier();
    if (userIdentifier) {
      chrome.storage.local.set({ userIdentifier });
    }
  }
}

function generateBatchId() {
  return (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
  );
}

// Enhanced log sending with batchId and atomic removal
async function sendLogsToBackend(logs) {
  if (!userIdentifier || !Array.isArray(logs) || logs.length === 0) return;
  const batchId = generateBatchId();
  const batch = { batchId, logs, user: userIdentifier, timestamp: Date.now() };
  // Add to unsentLogs and persist
  unsentLogs.push(batch);
  chrome.storage.local.set({ unsentLogs });
  let sent = false;
  try {
    const res = await fetch(LOGS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user: userIdentifier, logs, batchId })
    });
    if (res.ok) {
      lastSyncTime = Date.now();
      chrome.storage.local.set({ lastSyncTime });
      sent = true;
    } else {
      throw new Error('Failed to send logs');
    }
  } catch (e) {
    // Retry with exponential backoff (up to 3 times)
    for (let i = 1; i <= 3; i++) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      try {
        const res = await fetch(LOGS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ user: userIdentifier, logs, batchId })
        });
        if (res.ok) {
          lastSyncTime = Date.now();
          chrome.storage.local.set({ lastSyncTime });
          sent = true;
          break;
        }
      } catch {}
    }
  }
  // Only remove from unsentLogs if sent
  if (sent) {
    unsentLogs = unsentLogs.filter(b => b.batchId !== batchId);
    chrome.storage.local.set({ unsentLogs });
  }
  return sent;
}

// On clock-in, browser startup, or network reconnect, resend all unsent logs
async function resendUnsentLogs() {
  if (!userIdentifier || !Array.isArray(unsentLogs) || unsentLogs.length === 0) return;
  // Copy to avoid mutation during iteration
  const batches = [...unsentLogs];
  for (const batch of batches) {
    await sendLogsToBackend(batch.logs);
  }
}

// On clock-in, ensure user and resend unsent logs
async function onClockIn() {
  await ensureUserIdentifier();
  await resendUnsentLogs();
}

// On clock-out or browser shutdown, flush logs
async function flushLogs() {
  if (currentActivity) endCurrentActivity();
  if (activityLogs.length > 0) {
    await sendLogsToBackend(activityLogs);
    activityLogs = [];
    chrome.storage.local.set({ activityLogs });
  }
}

// Poll clock-in status
timerPollClockin();
setInterval(timerPollClockin, POLL_INTERVAL);

function timerPollClockin() {
  fetch(CLOCKIN_STATUS_URL, { credentials: 'include' })
    .then(res => res.json())
    .then(async data => {
      const wasClockedIn = isClockedIn;
      isClockedIn = !!data.clockedIn;
      if (isClockedIn && !wasClockedIn) {
        await onClockIn();
      }
      if (!isClockedIn && wasClockedIn) {
        await flushLogs();
      }
      if (!isClockedIn) {
        endCurrentActivity();
      }
    })
    .catch(() => { isClockedIn = false; });
}

// Listen for tab and window changes
chrome.tabs.onActivated.addListener(handleTabChange);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === 'complete') handleTabChange({ tabId });
});
chrome.windows.onFocusChanged.addListener(handleTabChange);

// Listen for idle state changes
chrome.idle.onStateChanged.addListener(state => {
  idleState = state;
  if (isClockedIn && currentActivity) {
    currentActivity.idleState = state;
  }
});

function handleTabChange(activeInfo) {
  if (!isClockedIn) return;
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    if (tabs.length === 0) return;
    const tab = tabs[0];
    endCurrentActivity();
    currentActivity = {
      url: tab.url,
      title: tab.title,
      start: Date.now(),
      idleState
    };
  });
}

function endCurrentActivity() {
  if (currentActivity) {
    currentActivity.end = Date.now();
    activityLogs.push(currentActivity);
    currentActivity = null;
    chrome.storage.local.set({ activityLogs });
  }
}

// Batch send logs every 5 minutes
setInterval(() => {
  if (!isClockedIn || activityLogs.length === 0) return;
  const logsToSend = [...activityLogs];
  activityLogs = [];
  chrome.storage.local.set({ activityLogs });
  
  // Send logs to CribNosh backend
  fetch('https://cribnosh.com/api/timelogs/batch', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('cribnosh_token')}`
    },
    credentials: 'include',
    body: JSON.stringify({ 
      logs: logsToSend,
      userId: localStorage.getItem('cribnosh_user_id'),
      batchId: generateBatchId(),
      timestamp: Date.now()
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Logs sent successfully:', data);
    // Mark logs as sent
    chrome.storage.local.get(['sentLogs'], (result) => {
      const sentLogs = result.sentLogs || [];
      sentLogs.push(...logsToSend.map(log => log.id));
      chrome.storage.local.set({ sentLogs });
    });
  })
  .catch(error => {
    console.error('Failed to send logs:', error);
    // Re-add logs to queue for retry
    activityLogs.unshift(...logsToSend);
    chrome.storage.local.set({ activityLogs });
  });
}, LOG_SEND_INTERVAL);

// On browser shutdown, end current activity
chrome.runtime.onSuspend.addListener(() => {
  endCurrentActivity();
});

// Respond to popup.js status requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    sendResponse({ isClockedIn });
  }
});

// Listen for online/offline events
window.addEventListener('online', () => {
  resendUnsentLogs();
});

// On extension startup, resend unsent logs
chrome.runtime.onStartup?.addListener(() => {
  resendUnsentLogs();
}); 