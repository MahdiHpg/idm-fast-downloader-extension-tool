/**
 * IDM Fast Downloader - Background Service Worker
 * Manifest V3 compatible
 */

const NATIVE_HOST_NAME = 'com.idm.nativehost';

const DEFAULT_SETTINGS = {
  enabled: true,
  interceptLinks: true,
  interceptBrowserDownloads: true,
  bypassKey: 'Alt', // 'Alt' | 'Shift' | 'Ctrl' | 'None'
  showToast: true,
  language: 'fa', // 'fa' | 'en'
  extensions: [
    'ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'BZ2', 'ISO', 'IMG', 'BIN', 'DMG', 'PKG',
    'EXE', 'MSI', 'APK', 'APPX', 'TORRENT',
    'MP4', 'MKV', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'M4V', '3GP',
    'MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A', 'WMA',
    'PDF', 'EPUB', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'
  ]
};

// Cache recently handled URLs to prevent duplicate interception loops
const recentDownloads = new Map();
const RECENT_TTL = 8000; // 8 seconds

const cleanRecentDownloads = () => {
  const now = Date.now();
  for (const [url, time] of recentDownloads.entries()) {
    if (now - time > RECENT_TTL) {
      recentDownloads.delete(url);
    }
  }
};

// Setup default settings and context menus on install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const existing = await chrome.storage.local.get('settings');
    if (!existing.settings) {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    } else {
      // Merge new fields if any
      await chrome.storage.local.set({
        settings: { ...DEFAULT_SETTINGS, ...existing.settings }
      });
    }

    // Create Context Menu
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'idm-download-context',
        title: '🚀 دانلود با IDM',
        contexts: ['link', 'image', 'video', 'audio', 'selection']
      });
    });
  } catch (err) {
    console.error('Error during onInstalled:', err);
  }
});

// Helper to get active settings
const getSettings = async () => {
  const data = await chrome.storage.local.get('settings');
  return data.settings || DEFAULT_SETTINGS;
};

// Send URL to IDM Native Messaging Host
const sendToIDM = async (url, referer = '') => {
  if (!url || typeof url !== 'string') {
    return { success: false, error: 'لینک معتبر نیست' };
  }

  // Prevent sending local / blob / data URLs to IDM (IDM cannot download internal browser memory streams)
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('chrome:') || url.startsWith('edge:') || url.startsWith('about:')) {
    return { success: false, error: 'لینک‌های داخلی و blob در IDM قابل دانلود مستقیم نیستند' };
  }

  cleanRecentDownloads();
  recentDownloads.set(url, Date.now());

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST_NAME,
        { action: 'download', url: url.trim(), referer: referer || '' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Native messaging error:', chrome.runtime.lastError.message);
            resolve({
              success: false,
              error: chrome.runtime.lastError.message || 'پل ارتباطی IDM نصب نیست یا پاسخ نمی‌دهد'
            });
            return;
          }

          if (response && response.status === 'ok') {
            resolve({ success: true, response });
          } else {
            resolve({
              success: false,
              error: response?.message || 'خطا در برقراری ارتباط با IDM'
            });
          }
        }
      );
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
};

// Ping IDM Native Host to check connectivity
const pingIDM = async () => {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST_NAME,
        { action: 'ping' },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({
              connected: false,
              error: chrome.runtime.lastError.message
            });
            return;
          }

          if (response && response.status === 'ok' && response.action === 'pong') {
            resolve({
              connected: true,
              idmPath: response.idmPath
            });
          } else {
            resolve({
              connected: false,
              error: response?.message || 'پاسخ نامعتبر از IDM'
            });
          }
        }
      );
    } catch (err) {
      resolve({ connected: false, error: err.message });
    }
  });
};

// Handle Context Menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'idm-download-context') {
    let targetUrl = info.linkUrl || info.srcUrl;

    if (!targetUrl && info.selectionText) {
      const text = info.selectionText.trim();
      if (/^https?:\/\//i.test(text)) {
        targetUrl = text;
      }
    }

    if (targetUrl) {
      const result = await sendToIDM(targetUrl, tab?.url || '');
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'showToast',
          status: result.success ? 'success' : 'error',
          message: result.success ? 'لینک با موفقیت به IDM ارسال شد' : (result.error || 'خطا در ارسال به IDM')
        }).catch(() => {});
      }
    }
  }
});

// Handle messages from content script & popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'downloadWithIDM') {
        const result = await sendToIDM(message.url, message.referer || sender.tab?.url || '');
        sendResponse(result);
        return;
      }

      if (message.action === 'pingIDM') {
        const result = await pingIDM();
        sendResponse(result);
        return;
      }

      if (message.action === 'getSettings') {
        const settings = await getSettings();
        sendResponse(settings);
        return;
      }

      if (message.action === 'saveSettings') {
        await chrome.storage.local.set({ settings: message.settings });
        sendResponse({ success: true });
        return;
      }

      if (message.action === 'batchDownloadWithIDM') {
        const urls = message.urls;
        if (!Array.isArray(urls) || urls.length === 0) {
          sendResponse({ success: false, error: 'هیچ لینکی ارسال نشد' });
          return;
        }

        const result = await new Promise((resolve) => {
          try {
            chrome.runtime.sendNativeMessage(
              NATIVE_HOST_NAME,
              { action: 'batchDownload', urls, toQueue: true },
              (response) => {
                if (chrome.runtime.lastError) {
                  resolve({ success: false, error: chrome.runtime.lastError.message });
                  return;
                }
                if (response && response.status === 'ok') {
                  resolve({ success: true, count: urls.length });
                } else {
                  resolve({ success: false, error: response?.message || 'خطا در ارسال دسته‌ای به IDM' });
                }
              }
            );
          } catch (err) {
            resolve({ success: false, error: err.message });
          }
        });

        sendResponse(result);
        return;
      }

      sendResponse({ success: false, error: 'Unknown action' });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true; // Keep channel open for async response
});

// Intercept browser-initiated downloads (e.g. dynamic buttons, redirects, Content-Disposition)
chrome.downloads.onCreated.addListener(async (downloadItem) => {
  try {
    const settings = await getSettings();
    if (!settings.enabled || !settings.interceptBrowserDownloads) {
      return;
    }

    const downloadUrl = downloadItem.finalUrl || downloadItem.url;
    if (!downloadUrl || !/^https?:\/\//i.test(downloadUrl)) {
      return;
    }

    // Check if this URL was recently sent to IDM to prevent infinite intercept loops
    cleanRecentDownloads();
    if (recentDownloads.has(downloadUrl)) {
      return;
    }

    // Determine if file matches extension or if it was marked as download
    const urlObj = new URL(downloadUrl);
    const pathname = urlObj.pathname.toLowerCase();
    const exts = settings.extensions.map((e) => e.toLowerCase());

    const hasMatchingExtension = exts.some((ext) => pathname.endsWith('.' + ext));
    const isExplicitDownload = downloadItem.danger === 'safe' || hasMatchingExtension;

    if (hasMatchingExtension || isExplicitDownload) {
      // Cancel browser download immediately
      try {
        await chrome.downloads.cancel(downloadItem.id);
        await chrome.downloads.erase({ id: downloadItem.id });
      } catch (cancelErr) {
        console.warn('Could not cancel browser download:', cancelErr);
      }

      // Forward to IDM
      const result = await sendToIDM(downloadUrl, downloadItem.referrer || '');
      if (result.success) {
        console.log('Browser download successfully redirected to IDM:', downloadUrl);
      }
    }
  } catch (err) {
    console.error('Error in downloads.onCreated listener:', err);
  }
});
