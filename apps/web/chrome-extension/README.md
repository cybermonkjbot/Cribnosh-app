# CribNosh Activity Tracker Chrome Extension

## Overview
This Chrome extension tracks browser activity (active tab, page title, idle/active time) **only when the user is clocked in** via the CribNosh staff portal. It is designed to be subtle, privacy-respecting, and easy to use.

## Features
- Tracks active tab URL, page title, and idle/active status
- Only tracks when user is clocked in (integrates with staff portal)
- Batches and sends logs to your backend
- Minimal popup UI for status and privacy info
- No tracking outside work hours

## Installation
1. Download or clone the `chrome-extension` folder to your computer.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `chrome-extension` folder.
5. The CribNosh Activity Tracker icon should appear in your Chrome toolbar.

## Configuration
- **API Endpoints:**
  - Edit `background.js` and set the correct URLs for `CLOCKIN_STATUS_URL` (your staff portal clock-in status endpoint) and `LOGS_ENDPOINT` (your backend log receiver).
  - Example:
    ```js
    const CLOCKIN_STATUS_URL = 'https://yourdomain.com/api/staff/clockin-status';
    const LOGS_ENDPOINT = 'https://yourdomain.com/api/activity-logs';
    ```
- **Authentication:**
  - The extension uses browser cookies for authentication by default (`credentials: 'include'`). Ensure your endpoints accept authenticated requests from the browser.

## Privacy & Security
- No data is tracked or sent unless the user is clocked in.
- All tracked data is visible to the user in the popup (status only; logs are not shown by default).
- No screenshots or keystrokes are ever recorded.
- All code is open and auditable.

## Uninstall
- Go to `chrome://extensions/`.
- Find "CribNosh Activity Tracker" and click **Remove**.

## Support
For questions or help, contact your CribNosh admin team. 