/**
 * IDM Fast Downloader - Content Script
 * Captures single download links and handles batch download selection
 */

(() => {
  'use strict';

  // Cache settings locally in content script
  let cachedSettings = {
    enabled: true,
    interceptLinks: true,
    showToast: true,
    instantKey: 'Ctrl',
    floatingVideoBar: true,
    previewFileSize: true,
    language: 'fa',
    excludedSites: [],
    extensions: [
      'ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'BZ2', 'ISO', 'IMG', 'BIN', 'DMG', 'PKG',
      'EXE', 'MSI', 'APK', 'APPX', 'TORRENT',
      'MP4', 'MKV', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'M4V', '3GP',
      'MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A', 'WMA',
      'PDF', 'EPUB', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'
    ]
  };

  const I18N_CONTENT = {
    fa: {
      toast_transferring: 'در حال انتقال لینک به IDM...',
      toast_instant_sent: '⚡ لینک به صورت آنی به IDM فرستاده شد',
      toast_bridge_error: 'خطا: پل ارتباطی IDM متصل نیست',
      toast_sent_success: 'لینک به IDM منتقل شد و پنجره باز شد',
      toast_copied: (n) => `${n} لینک با موفقیت کپی شد`,
      toast_copy_error: 'خطا در کپی کردن لینک‌ها',
      toast_txt_saved: (n) => `فایل متنی با ${n} لینک ذخیره شد`,
      toast_batch_success: (n) => `${n} لینک با موفقیت به صف IDM افزوده شد`,
      toast_batch_error: 'خطا در ارسال دسته‌ای به IDM',
      float_download: 'دانلود با IDM',
      float_copy: 'کپی لینک‌ها',
      float_txt: 'خروجی متنی',
      floating_player_btn: '🎬 دانلود این ویدیو',
      floating_player_title: 'دانلود ویدیو با IDM',
      modal_title: 'دانلود دسته‌ای با IDM',
      modal_subtitle: (n) => `${n} لینک دانلود شناسایی شد`,
      modal_select_all: 'انتخاب همه',
      modal_count: (sel, total) => `${sel} از ${total} انتخاب شده`,
      modal_count_with_size: (sel, total, sizeStr) => `${sel} از ${total} انتخاب شده ${sizeStr ? `• مجموع: ${sizeStr}` : ''}`,
      modal_cancel: 'لغو',
      modal_btn_copy: 'کپی لینک‌ها',
      modal_btn_txt: 'خروجی .txt',
      modal_btn_queue: 'ارسال به IDM',
      modal_btn_sending: 'در حال ارسال به IDM...',
      serial_btn_extract: 'استخراج قسمت‌ها و کیفیت‌ها (IDM)',
      serial_btn_float: '🎬 استخراج قسمت‌های سریال با IDM',
      serial_btn_float_count: (n) => `🎬 استخراج هوشمند قسمت‌ها (${n} فایل)`,
      serial_extracting: 'در حال استخراج لینک‌های تمام قسمت‌ها...',
      serial_season_label: 'فصل:',
      serial_quality_label: 'کیفیت ویدیو:',
      serial_audio_label: 'صوت / نسخه:',
      serial_audio_all: 'همه نسخه‌ها',
      serial_audio_dubbed: '🎙️ فقط دوبله فارسی',
      serial_audio_original: '🔊 فقط زبان اصلی',
      badge_dubbed: '🎙️ دوبله',
      badge_original: '🔊 زبان اصلی',
      serial_filter_dubbed: 'صوت دوبله',
      serial_filter_sub: 'زیرنویس‌ها (.srt)',
      serial_filter_sub_fa: 'زیرنویس فارسی (FA)',
      serial_filter_sub_en: 'زیرنویس انگلیسی (EN)',
      serial_filter_sub_other: 'سایر زیرنویس‌ها',
      serial_all_seasons: 'همه فصل‌ها',
      serial_season_prefix: 'فصل',
      serial_quality_all: 'تمام کیفیت‌ها',
      serial_quality_p: (q) => (q === 2160 ? '4K / 2160p' : `${q}p`),
      serial_no_episodes: 'هیچ قسمتی برای دانلود پیدا نشد.',
      serial_modal_title: 'دانلود دسته‌ای قسمت‌های سریال و فیلم با IDM',
      serial_modal_subtitle: (epCount, linkCount) => `${epCount} قسمت یافت شد (${linkCount} فایل آماده دانلود)`,
      serial_filter_apply: 'اعمال فیلتر',
      modal_drag_hint: 'برای جابجایی کلیک کنید و بکشید',
      toast_hls_started: (n) => `دانلود مستقیم ${n} استریم در پس‌زمینه آغاز شد (پوشه Downloads)`,
      toast_hls_error: 'خطا در شروع دانلود استریم',
      serial_btn_float_hls: '🎬 استخراج هوشمند قسمت‌ها (IDM)',
      modal_btn_hls_direct: 'دانلود مستقیم استریم (پوشه Downloads)',
      modal_btn_hls_sending: 'در حال شروع دانلود موازی...',
      hls_notice: 'ℹ️ این ویدیوها استریم آنلاین (HLS) هستند. برنامه تمامی قطعات را با سرعت بالا دانلود کرده و فایل کامل را در پوشه Downloads ذخیره می‌کند.'
    },
    en: {
      toast_transferring: 'Sending link to IDM...',
      toast_instant_sent: '⚡ Link sent to IDM instantly',
      toast_bridge_error: 'Error: IDM native bridge not connected',
      toast_sent_success: 'Link sent to IDM successfully',
      toast_copied: (n) => `${n} links copied to clipboard`,
      toast_copy_error: 'Failed to copy links',
      toast_txt_saved: (n) => `Saved ${n} links as .txt file`,
      toast_batch_success: (n) => `${n} links added to IDM queue`,
      toast_batch_error: 'Failed to send batch to IDM',
      float_download: 'Download with IDM',
      float_copy: 'Copy Links',
      float_txt: 'Export .TXT',
      floating_player_btn: '🎬 Download Video',
      floating_player_title: 'Download Video with IDM',
      modal_title: 'Batch Download with IDM',
      modal_subtitle: (n) => `${n} download links detected`,
      modal_select_all: 'Select All',
      modal_count: (sel, total) => `${sel} of ${total} selected`,
      modal_count_with_size: (sel, total, sizeStr) => `${sel} of ${total} selected ${sizeStr ? `• Total: ${sizeStr}` : ''}`,
      modal_cancel: 'Cancel',
      modal_btn_copy: 'Copy Links',
      modal_btn_txt: 'Export .txt',
      modal_btn_queue: 'Send to IDM',
      modal_btn_sending: 'Sending to IDM...',
      serial_btn_extract: 'Batch Extract Episodes (IDM)',
      serial_btn_float: '🎬 Batch Extract Episodes (IDM)',
      serial_btn_float_count: (n) => `🎬 Extract Episodes (${n} files)`,
      serial_extracting: 'Extracting all episode download links...',
      serial_season_label: 'Season:',
      serial_quality_label: 'Video Quality:',
      serial_audio_label: 'Audio / Version:',
      serial_audio_all: 'All Versions',
      serial_audio_dubbed: '🎙️ Persian Dubbed Only',
      serial_audio_original: '🔊 Original Audio Only',
      badge_dubbed: '🎙️ Dubbed',
      badge_original: '🔊 Original',
      serial_filter_dubbed: 'Dubbed Audio',
      serial_filter_sub: 'Subtitles (.srt)',
      serial_filter_sub_fa: 'Persian Subtitles (FA)',
      serial_filter_sub_en: 'English Subtitles (EN)',
      serial_filter_sub_other: 'Other Subtitles',
      serial_all_seasons: 'All Seasons',
      serial_season_prefix: 'Season',
      serial_quality_all: 'All Qualities',
      serial_quality_p: (q) => (q === 2160 ? '4K / 2160p' : `${q}p`),
      serial_no_episodes: 'No episodes found for download.',
      serial_modal_title: 'Batch Download Media & Episodes with IDM',
      serial_modal_subtitle: (epCount, linkCount) => `${epCount} episodes found (${linkCount} files ready for download)`,
      serial_filter_apply: 'Apply Filter',
      modal_drag_hint: 'Click and drag to move',
      toast_hls_started: (n) => `Direct download of ${n} streams started in Downloads folder`,
      toast_hls_error: 'Error starting HLS stream download',
      serial_btn_float_hls: '🎬 Batch Extract Episodes (IDM)',
      modal_btn_hls_direct: 'Direct Stream Download (Downloads folder)',
      modal_btn_hls_sending: 'Starting parallel download...',
      hls_notice: 'ℹ️ These files are online HLS streams. The app downloads all video segments in parallel and saves the complete file to your Downloads folder.'
    }
  };

  const getT = () => I18N_CONTENT[cachedSettings.language] || I18N_CONTENT.fa;

  // Verify extension context is still active (handles extension reloads/updates)
  const isExtensionValid = () => {
    try {
      return Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  };

  // Safe wrapper for chrome.runtime.sendMessage to completely prevent "Extension context invalidated" errors
  const safeSendMessage = (message, callback) => {
    try {
      if (!isExtensionValid()) {
        return;
      }
      chrome.runtime.sendMessage(message, (res) => {
        if (chrome.runtime?.lastError) {
          // Suppress context invalidated note or disconnected port
          return;
        }
        if (typeof callback === 'function') {
          callback(res);
        }
      });
    } catch {
      // Ignored: extension reloaded or context destroyed
    }
  };

  // Check if current page domain is in excluded sites list
  const isCurrentSiteExcluded = () => {
    if (!cachedSettings.excludedSites || !Array.isArray(cachedSettings.excludedSites) || cachedSettings.excludedSites.length === 0) {
      return false;
    }
    const currentHost = window.location.hostname.toLowerCase().replace(/^www\./, '');
    return cachedSettings.excludedSites.some((site) => {
      const clean = site.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
      if (!clean) return false;
      return currentHost === clean || currentHost.endsWith('.' + clean);
    });
  };

  let currentHlsActiveStream = null;
  let triggerVideoCheck = null;

  // Sync settings from storage
  const syncSettings = () => {
    try {
      if (!isExtensionValid() || !chrome.storage || !chrome.storage.local) return;
      chrome.storage.local.get('settings', (res) => {
        if (chrome.runtime?.lastError) return;
        if (res && res.settings) {
          cachedSettings = { ...cachedSettings, ...res.settings };
        }
      });
    } catch {
      // Storage might not be accessible if extension reloaded
    }
  };

  syncSettings();

  // Listen for storage updates
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (!isExtensionValid()) return;
        if (area === 'local' && changes.settings) {
          cachedSettings = { ...cachedSettings, ...changes.settings.newValue };
          if (isCurrentSiteExcluded()) {
            removeFloatBtn();
            const stickyMedia = document.getElementById('idm-media-sticky-btn');
            if (stickyMedia) stickyMedia.remove();
            const stickySerial = document.getElementById('idm-serial-sticky-btn');
            if (stickySerial) stickySerial.remove();
            document.querySelectorAll('.idm-video-float-bar').forEach((b) => b.remove());
          }
        }
      });
    } catch {}
  }

  // Toast Notification UI Element
  let toastContainer = null;

  const showToast = (message, type = 'info') => {
    if (!cachedSettings.showToast) return;

    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'idm-toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `idm-toast idm-toast-${type}`;

    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : '🚀');

    toast.innerHTML = `
      <span class="idm-toast-icon">${icon}</span>
      <span class="idm-toast-text">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      toast.classList.add('idm-toast-fadeout');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3500);
  };

  // Listen for background messages (like context menu toast feedback)
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((msg) => {
        if (!isExtensionValid()) return;
        if (msg.action === 'showToast') {
          showToast(msg.message, msg.status || 'info');
        }
      });
    } catch {}
  }

  // Helper to test if URL is a downloadable file
  const isDownloadableUrl = (urlStr, anchorElem) => {
    if (!urlStr || typeof urlStr !== 'string') return false;

    // Ignore javascript:, mailto:, and internal protocol schemes
    if (/^(javascript|mailto|tel|data|blob|about):/i.test(urlStr)) return false;

    // If anchor has explicit download attribute
    if (anchorElem && anchorElem.hasAttribute('download')) {
      return true;
    }

    try {
      const parsed = new URL(urlStr, window.location.href);
      const pathname = parsed.pathname.toLowerCase();

      // Check against configured extensions
      const exts = cachedSettings.extensions.map((ext) => '.' + ext.toLowerCase());
      const hasExt = exts.some((ext) => pathname.endsWith(ext));
      if (hasExt) return true;

      // Check query parameter (e.g. ?file=video.mp4 or ?download=file.zip)
      const search = parsed.search.toLowerCase();
      if (exts.some((ext) => search.includes(ext))) {
        return true;
      }
    } catch {
      return false;
    }

    return false;
  };

  // Check if instant download hotkey is currently pressed
  const isInstantKeyPressed = (event) => {
    const key = cachedSettings.instantKey;
    if (key === 'Ctrl' && (event.ctrlKey || event.metaKey)) return true;
    if (key === 'Alt' && event.altKey) return true;
    if (key === 'Shift' && event.shiftKey) return true;
    return false;
  };

  // Intercept single click on links
  window.addEventListener(
    'click',
    (event) => {
      if (!cachedSettings.enabled || !cachedSettings.interceptLinks || isCurrentSiteExcluded() || !isExtensionValid()) {
        return;
      }

      // Find anchor tag
      const anchor = event.target.closest('a');
      if (!anchor || !anchor.href) {
        return;
      }

      const href = anchor.href;

      if (isDownloadableUrl(href, anchor)) {
        // Stop browser navigation
        event.preventDefault();
        event.stopPropagation();

        const t = getT();
        // Only use explicit download attribute if it has a valid file extension
        let customFn = '';
        const dlAttr = (anchor.getAttribute('download') || '').trim();
        if (dlAttr && /\.[a-z0-9]{2,5}$/i.test(dlAttr)) {
          customFn = dlAttr;
        }

        // If instant hotkey is pressed, trigger silent/direct download
        if (isInstantKeyPressed(event)) {
          showToast(t.toast_instant_sent, 'success');
          safeSendMessage({
            action: 'downloadWithIDM',
            url: href,
            referer: window.location.href,
            filename: customFn,
            toQueue: true,
            silent: true
          });
          return;
        }

        showToast(t.toast_transferring, 'info');

        safeSendMessage(
          {
            action: 'downloadWithIDM',
            url: href,
            referer: window.location.href,
            filename: customFn
          },
          (res) => {
            if (res && res.success) {
              showToast(t.toast_sent_success, 'success');
            } else {
              showToast(res?.error || t.toast_bridge_error, 'error');
            }
          }
        );
      }
    },
    true // Capture phase to intercept before page scripts can swallow it
  );

  /* =========================================================
     BATCH DOWNLOAD SELECTION FEATURE
     ========================================================= */

  let floatBtn = null;
  let currentSelectedLinks = [];

  // Remove floating button from DOM
  const removeFloatBtn = () => {
    if (floatBtn && floatBtn.parentNode) {
      floatBtn.parentNode.removeChild(floatBtn);
    }
    floatBtn = null;
  };

  // Check if an anchor tag is candidate for batch download
  const isCandidateBatchAnchor = (anchor) => {
    if (!anchor || !anchor.href) return false;
    const href = anchor.href;

    // Ignore non-http links
    if (!/^https?:\/\//i.test(href)) return false;

    // Direct downloadable url test
    if (isDownloadableUrl(href, anchor)) return true;

    // Has download attribute
    if (anchor.hasAttribute('download')) return true;

    // Download keywords in text, title, class, or href
    const text = (anchor.innerText || '').toLowerCase();
    const title = (anchor.getAttribute('title') || '').toLowerCase();
    const className = (typeof anchor.className === 'string' ? anchor.className : '').toLowerCase();
    const lowerHref = href.toLowerCase();

    const keywords = [
      'دانلود', 'پارت', 'دریافت', 'لینک', 'download', 'part', 'dl', 'link', 'get', 'file',
      'سرور', 'نسخه', 'کیفیت', 'p30download', 'soft98', 'yasdl', 'shatelland'
    ];

    const hasKeyword = keywords.some((kw) => 
      text.includes(kw) || title.includes(kw) || className.includes(kw) || lowerHref.includes(kw)
    );

    if (hasKeyword) return true;

    // If anchor is within a download button or container class
    const parentContainer = anchor.closest('.download, .dl, .part, .links, [class*="download"], [class*="part"]');
    if (parentContainer) return true;

    return false;
  };

  // Extract all downloadable links within a user selection
  const getLinksFromSelection = (selection) => {
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      return [];
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const rootElem = container.nodeType === Node.ELEMENT_NODE ? container : (container.parentElement || document.body);

    const matched = [];
    const seenUrls = new Set();

    // 1. Gather all candidate anchors in and around the selection range
    // Search both within container and broader parents if container is tight
    const searchScope = rootElem.parentElement && rootElem.querySelectorAll('a[href]').length === 0 
      ? rootElem.parentElement 
      : rootElem;

    const anchors = searchScope.querySelectorAll('a[href]');

    anchors.forEach((anchor) => {
      try {
        let isInside = false;

        // Modern DOM range intersection
        if (typeof range.intersectsNode === 'function') {
          isInside = range.intersectsNode(anchor);
        } else if (typeof selection.containsNode === 'function') {
          isInside = selection.containsNode(anchor, true);
        }

        if (isInside) {
          const href = anchor.href;
          if (href && !seenUrls.has(href) && isCandidateBatchAnchor(anchor)) {
            seenUrls.add(href);
            const anchorText = anchor.innerText.trim();
            const title = anchorText || anchor.getAttribute('title') || anchor.getAttribute('aria-label') || href.split('/').pop().split('?')[0];
            matched.push({
              url: href,
              title: title.length > 50 ? title.substring(0, 50) + '...' : title
            });
          }
        }
      } catch {
        // Ignore cross-origin / pseudo DOM element errors
      }
    });

    // 2. Also inspect plain text in selection for direct URLs
    const selectedText = selection.toString();
    const urlMatches = selectedText.match(/https?:\/\/[^\s"'<>]+/gi) || [];
    urlMatches.forEach((rawUrl) => {
      if (!seenUrls.has(rawUrl)) {
        seenUrls.add(rawUrl);
        const fileName = rawUrl.split('/').pop().split('?')[0] || rawUrl;
        matched.push({
          url: rawUrl,
          title: fileName.length > 50 ? fileName.substring(0, 50) + '...' : fileName
        });
      }
    });

    return matched;
  };

  // Copy links to clipboard helper
  const copyLinksToClipboard = (urls) => {
    if (!urls || urls.length === 0) return;
    const t = getT();
    const text = urls.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showToast(t.toast_copied(urls.length), 'success');
    }).catch(() => {
      // Fallback using textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast(t.toast_copied(urls.length), 'success');
      } catch {
        showToast(t.toast_copy_error, 'error');
      }
      document.body.removeChild(ta);
    });
  };

  // Download links as a .txt file helper
  const exportLinksToTxtFile = (urls) => {
    if (!urls || urls.length === 0) return;
    const t = getT();
    const text = urls.join('\r\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const pageTitle = (document.title || 'links').replace(/[\\/:*?"<>|]/g, '').trim().substring(0, 30);
    a.download = `${pageTitle || 'idm-links'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(t.toast_txt_saved(urls.length), 'success');
  };

  // Position and display the floating action button
  const showFloatBtn = (rect, count) => {
    removeFloatBtn();
    const t = getT();
    const isRtl = cachedSettings.language !== 'en';

    floatBtn = document.createElement('div');
    floatBtn.id = 'idm-batch-float-btn';
    floatBtn.style.direction = isRtl ? 'rtl' : 'ltr';
    floatBtn.innerHTML = `
      <div class="idm-float-main-btn" title="${t.float_download}">
        <span class="idm-float-icon">📥</span>
        <span>${t.float_download}</span>
        <span class="idm-float-badge">${count}</span>
      </div>
      <div class="idm-float-actions">
        <button class="idm-float-action-btn" id="idm-float-copy" title="${t.float_copy}">
          <span class="idm-float-btn-icon">📋</span>
          <span class="idm-float-btn-text">${t.float_copy}</span>
        </button>
        <button class="idm-float-action-btn" id="idm-float-txt" title="${t.float_txt}">
          <span class="idm-float-btn-icon">📄</span>
          <span class="idm-float-btn-text">${t.float_txt}</span>
        </button>
      </div>
    `;

    // Position above or below selection
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let topPos = rect.top + scrollY - 50;
    if (topPos < scrollY + 10) {
      // If no room above, place below
      topPos = rect.bottom + scrollY + 10;
    }

    const leftPos = Math.max(10, rect.left + scrollX + (rect.width / 2) - 130);

    floatBtn.style.top = `${topPos}px`;
    floatBtn.style.left = `${leftPos}px`;

    floatBtn.addEventListener('mousedown', (e) => {
      // Prevent selection from clearing when clicking button
      e.preventDefault();
      e.stopPropagation();
    });

    const mainBtn = floatBtn.querySelector('.idm-float-main-btn');
    const copyBtn = floatBtn.querySelector('#idm-float-copy');
    const txtBtn = floatBtn.querySelector('#idm-float-txt');

    mainBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openBatchModal(currentSelectedLinks);
      removeFloatBtn();
    });

    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const urls = currentSelectedLinks.map((item) => item.url);
      copyLinksToClipboard(urls);
      removeFloatBtn();
    });

    txtBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const urls = currentSelectedLinks.map((item) => item.url);
      exportLinksToTxtFile(urls);
      removeFloatBtn();
    });

    document.body.appendChild(floatBtn);
  };

  // Open the batch modal dialog
  const openBatchModal = (items, filterOptions = null) => {
    // Remove any existing modal
    const oldModal = document.getElementById('idm-batch-modal-overlay');
    if (oldModal) oldModal.remove();

    if (!items || items.length === 0) {
      const t = getT();
      showToast(t.toast_batch_error, 'info');
      return;
    }

    const t = getT();
    const isRtl = cachedSettings.language !== 'en';

    const overlay = document.createElement('div');
    overlay.id = 'idm-batch-modal-overlay';
    overlay.style.direction = isRtl ? 'rtl' : 'ltr';

    let currentItems = [...items];

    // Filter controls HTML if filterOptions is provided
    let filterBarHtml = '';
    if (filterOptions) {
      let seasonOptionsHtml = `<option value="all">${t.serial_all_seasons}</option>`;
      if (filterOptions.seasons && filterOptions.seasons.length > 0) {
        filterOptions.seasons.forEach((s) => {
          seasonOptionsHtml += `<option value="${s.id}">${s.title}</option>`;
        });
      }

      let qualityOptionsHtml = `<option value="all">${t.serial_quality_all}</option>`;
      const availableQualities = filterOptions.qualities && filterOptions.qualities.length > 0
        ? filterOptions.qualities
        : [2160, 1080, 720, 480, 360];
      availableQualities.forEach((q) => {
        qualityOptionsHtml += `<option value="${q}">${t.serial_quality_p(q)}</option>`;
      });

      // Check audio version availability (Dubbed vs Original)
      const hasDubbedVideos = filterOptions.allItems && filterOptions.allItems.some((it) => !it.isSub && it.isDubbed);
      const hasOriginalVideos = filterOptions.allItems && filterOptions.allItems.some((it) => !it.isSub && !it.isDubbed);
      const hasAudioChoice = hasDubbedVideos && hasOriginalVideos;

      let audioOptionsHtml = '';
      if (hasAudioChoice) {
        audioOptionsHtml = `
          <div class="idm-filter-group">
            <label class="idm-filter-label">${t.serial_audio_label}</label>
            <select id="idm-filter-audio" class="idm-filter-select">
              <option value="all">${t.serial_audio_all}</option>
              <option value="dubbed">${t.serial_audio_dubbed}</option>
              <option value="original">${t.serial_audio_original}</option>
            </select>
          </div>
        `;
      }

      const hasSubs = filterOptions.allItems && filterOptions.allItems.some((it) => it.isSub);
      const hasFaSubs = filterOptions.allItems && filterOptions.allItems.some((it) => it.isSub && it.subLang === 'fa');
      const hasEnSubs = filterOptions.allItems && filterOptions.allItems.some((it) => it.isSub && it.subLang === 'en');
      const hasOtherSubs = filterOptions.allItems && filterOptions.allItems.some((it) => it.isSub && it.subLang !== 'fa' && it.subLang !== 'en');

      // Default checkbox states:
      const defFaChecked = true;
      const defEnChecked = (!hasFaSubs) || (cachedSettings.language === 'en');
      const defOtherChecked = true;

      // Filter initial currentItems to reflect default subtitle checkboxes
      if (hasSubs) {
        currentItems = filterOptions.allItems.filter((item) => {
          if (item.isSub) {
            if (item.subLang === 'fa') return defFaChecked;
            if (item.subLang === 'en') return defEnChecked;
            return defOtherChecked;
          }
          return true;
        });
      }

      let subCheckboxHtml = '';
      if (hasSubs) {
        let subItemsHtml = '';
        if (hasFaSubs) {
          subItemsHtml += `
            <label class="idm-filter-check-item">
              <input type="checkbox" id="idm-filter-sub-fa" ${defFaChecked ? 'checked' : ''} />
              <span>${t.serial_filter_sub_fa}</span>
            </label>
          `;
        }
        if (hasEnSubs) {
          subItemsHtml += `
            <label class="idm-filter-check-item">
              <input type="checkbox" id="idm-filter-sub-en" ${defEnChecked ? 'checked' : ''} />
              <span>${t.serial_filter_sub_en}</span>
            </label>
          `;
        }
        if (hasOtherSubs || (!hasFaSubs && !hasEnSubs)) {
          subItemsHtml += `
            <label class="idm-filter-check-item">
              <input type="checkbox" id="idm-filter-sub-other" ${defOtherChecked ? 'checked' : ''} />
              <span>${(hasFaSubs || hasEnSubs) ? t.serial_filter_sub_other : t.serial_filter_sub}</span>
            </label>
          `;
        }

        subCheckboxHtml = `
          <div class="idm-filter-group idm-filter-checkboxes">
            ${subItemsHtml}
          </div>
        `;
      }

      filterBarHtml = `
        <div class="idm-modal-filters">
          <div class="idm-filter-group">
            <label class="idm-filter-label">${t.serial_season_label}</label>
            <select id="idm-filter-season" class="idm-filter-select">
              ${seasonOptionsHtml}
            </select>
          </div>
          <div class="idm-filter-group">
            <label class="idm-filter-label">${t.serial_quality_label}</label>
            <select id="idm-filter-quality" class="idm-filter-select">
              ${qualityOptionsHtml}
            </select>
          </div>
          ${audioOptionsHtml}
          ${subCheckboxHtml}
        </div>
      `;
    }

    // Helper to format bytes into readable sizes
    const formatFileSize = (bytes) => {
      if (!bytes || isNaN(bytes) || bytes <= 0) return '';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };

    // Subtitle filename synchronization with video filename
    const syncSubtitleFilenames = (list) => {
      const videoBaseMap = new Map();
      list.forEach((item) => {
        if (!item.isSub && item.filename && item.seasonId !== undefined && item.episodeNum !== null) {
          const key = `${item.seasonId}_${item.episodeNum}`;
          const base = item.filename.replace(/\.[a-zA-Z0-9]+$/, '');
          videoBaseMap.set(key, base);
        }
      });

      list.forEach((item) => {
        if (item.isSub && item.seasonId !== undefined && item.episodeNum !== null) {
          const key = `${item.seasonId}_${item.episodeNum}`;
          const videoBase = videoBaseMap.get(key);
          if (videoBase) {
            const langSuffix = item.subLang === 'en' ? '.en' : (item.subLang === 'fa' ? '.fa' : '');
            item.filename = `${videoBase}${langSuffix}.srt`;
          }
        }
      });
    };

    const itemSizeCache = new Map();

    const renderItemsHtml = (list) => {
      if (list.length === 0) {
        return `<div class="idm-batch-empty">${t.serial_no_episodes}</div>`;
      }
      syncSubtitleFilenames(list);
      return list.map((item, index) => {
        let tagsHtml = '';
        if (item.isSub) {
          const badgeClass = item.subLang === 'en' ? 'idm-badge-sub-en' : 'idm-badge-sub-fa';
          tagsHtml = `<span class="idm-item-badge ${badgeClass}">${item.badge || 'SRT'}</span>`;
        } else {
          const qLabel = item.quality ? (item.quality === 2160 ? '4K' : `${item.quality}p`) : 'Video';
          tagsHtml += `<span class="idm-item-badge idm-badge-video">${qLabel}</span>`;
          if (item.isDubbed) {
            tagsHtml += `<span class="idm-item-badge idm-badge-dubbed">${t.badge_dubbed}</span>`;
          } else {
            tagsHtml += `<span class="idm-item-badge idm-badge-original">${t.badge_original}</span>`;
          }
          if (itemSizeCache.has(item.url)) {
            tagsHtml += `<span class="idm-item-badge idm-badge-size">${formatFileSize(itemSizeCache.get(item.url))}</span>`;
          }
        }
        const fnAttr = item.filename ? `data-filename="${encodeURIComponent(item.filename)}"` : '';
        return `
          <div class="idm-batch-item" data-index="${index}">
            <input type="checkbox" id="idm-check-${index}" class="idm-item-checkbox" checked data-url="${encodeURIComponent(item.url)}" ${fnAttr} />
            <label for="idm-check-${index}" class="idm-item-content">
              <span class="idm-item-title">${item.title} ${tagsHtml}</span>
              <span class="idm-item-url" title="${item.url}">${item.url}</span>
            </label>
          </div>
        `;
      }).join('');
    };

    const modalTitle = filterOptions ? t.serial_modal_title : t.modal_title;
    const modalSubtitle = filterOptions ? t.serial_modal_subtitle(filterOptions.episodeCount || currentItems.length, currentItems.length) : t.modal_subtitle(currentItems.length);

    overlay.innerHTML = `
      <div class="idm-batch-modal">
        <div class="idm-modal-header" title="${t.modal_drag_hint}">
          <div class="idm-modal-title-wrap">
            <span class="idm-modal-title-icon">${filterOptions ? '🎬' : '📥'}</span>
            <div>
              <div class="idm-modal-title">${modalTitle}</div>
              <div class="idm-modal-subtitle" id="idm-modal-sub">${modalSubtitle}</div>
            </div>
          </div>
          <div class="idm-modal-header-actions">
            <span class="idm-modal-drag-badge" title="${t.modal_drag_hint}">⋮⋮</span>
            <button class="idm-modal-close-btn" id="idm-modal-close" title="${t.modal_cancel}">✕</button>
          </div>
        </div>

        ${filterBarHtml}
        ${filterOptions && filterOptions.isHls ? `<div class="idm-hls-notice">${t.hls_notice}</div>` : ''}

        <div class="idm-modal-toolbar">
          <label class="idm-checkbox-label">
            <input type="checkbox" id="idm-select-all" checked />
            <span>${t.modal_select_all}</span>
          </label>
          <span class="idm-modal-count-badge" id="idm-selected-badge">${t.modal_count(currentItems.length, currentItems.length)}</span>
        </div>

        <div class="idm-modal-body" id="idm-items-container">
          ${renderItemsHtml(currentItems)}
        </div>

        <div class="idm-modal-footer">
          <div class="idm-btn-group-right">
            <button class="idm-btn idm-btn-outline" id="idm-btn-cancel">${t.modal_cancel}</button>
            <button class="idm-btn idm-btn-secondary" id="idm-btn-copy-links" title="${t.modal_btn_copy}">
              <span>📋 ${t.modal_btn_copy}</span>
            </button>
            <button class="idm-btn idm-btn-secondary" id="idm-btn-export-txt" title="${t.modal_btn_txt}">
              <span>📄 ${t.modal_btn_txt}</span>
            </button>
          </div>
          <div class="idm-btn-group-left">
            ${filterOptions && filterOptions.isHls ? `
            <button class="idm-btn idm-btn-success" id="idm-btn-direct-hls" title="${t.modal_btn_hls_direct}">
              <span>⚡ ${t.modal_btn_hls_direct}</span>
            </button>
            ` : `
            <button class="idm-btn idm-btn-primary" id="idm-btn-send-queue">
              <span>🚀 ${t.modal_btn_queue}</span>
            </button>
            `}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Modal Dragging Logic
    const modalElem = overlay.querySelector('.idm-batch-modal');
    const headerElem = overlay.querySelector('.idm-modal-header');

    let isDragging = false;
    let hasMoved = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let modalStartX = 0;
    let modalStartY = 0;

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved = true;
      }

      const modalWidth = modalElem.offsetWidth;
      const modalHeight = modalElem.offsetHeight;

      const minLeft = 10;
      const maxLeft = Math.max(10, window.innerWidth - modalWidth - 10);
      const minTop = 10;
      const maxTop = Math.max(10, window.innerHeight - modalHeight - 10);

      const targetLeft = Math.max(minLeft, Math.min(maxLeft, modalStartX + dx));
      const targetTop = Math.max(minTop, Math.min(maxTop, modalStartY + dy));

      modalElem.style.left = `${targetLeft}px`;
      modalElem.style.top = `${targetTop}px`;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      modalElem.classList.remove('idm-modal-dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e) => {
      if (
        e.target.closest('#idm-modal-close') ||
        e.target.closest('button') ||
        e.target.closest('input') ||
        e.target.closest('select') ||
        e.target.closest('a')
      ) {
        return;
      }
      if (e.button !== 0) return;

      isDragging = true;
      hasMoved = false;
      startMouseX = e.clientX;
      startMouseY = e.clientY;

      const rect = modalElem.getBoundingClientRect();
      modalStartX = rect.left;
      modalStartY = rect.top;

      modalElem.style.position = 'fixed';
      modalElem.style.left = `${modalStartX}px`;
      modalElem.style.top = `${modalStartY}px`;
      modalElem.style.right = 'auto';
      modalElem.style.bottom = 'auto';
      modalElem.style.margin = '0';
      modalElem.classList.add('idm-modal-dragging');

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };

    headerElem.addEventListener('mousedown', onMouseDown);

    // Touch support for tablets/touch devices
    const onTouchMove = (e) => {
      if (!isDragging || !e.touches || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startMouseX;
      const dy = touch.clientY - startMouseY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved = true;
      }

      const modalWidth = modalElem.offsetWidth;
      const modalHeight = modalElem.offsetHeight;

      const minLeft = 10;
      const maxLeft = Math.max(10, window.innerWidth - modalWidth - 10);
      const minTop = 10;
      const maxTop = Math.max(10, window.innerHeight - modalHeight - 10);

      const targetLeft = Math.max(minLeft, Math.min(maxLeft, modalStartX + dx));
      const targetTop = Math.max(minTop, Math.min(maxTop, modalStartY + dy));

      modalElem.style.left = `${targetLeft}px`;
      modalElem.style.top = `${targetTop}px`;
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      modalElem.classList.remove('idm-modal-dragging');
    };

    const onTouchStart = (e) => {
      if (e.target.closest('#idm-modal-close') || e.target.closest('button')) return;
      if (!e.touches || e.touches.length !== 1) return;
      const touch = e.touches[0];
      isDragging = true;
      hasMoved = false;
      startMouseX = touch.clientX;
      startMouseY = touch.clientY;

      const rect = modalElem.getBoundingClientRect();
      modalStartX = rect.left;
      modalStartY = rect.top;

      modalElem.style.position = 'fixed';
      modalElem.style.left = `${modalStartX}px`;
      modalElem.style.top = `${modalStartY}px`;
      modalElem.style.right = 'auto';
      modalElem.style.bottom = 'auto';
      modalElem.style.margin = '0';
      modalElem.classList.add('idm-modal-dragging');
    };

    headerElem.addEventListener('touchstart', onTouchStart, { passive: true });
    headerElem.addEventListener('touchmove', onTouchMove, { passive: true });
    headerElem.addEventListener('touchend', onTouchEnd);

    // Modal Interaction Logic
    const selectAllCheck = overlay.querySelector('#idm-select-all');
    const itemsContainer = overlay.querySelector('#idm-items-container');
    const countBadge = overlay.querySelector('#idm-selected-badge');
    const sendBtn = overlay.querySelector('#idm-btn-send-queue');
    const directHlsBtn = overlay.querySelector('#idm-btn-direct-hls');
    const copyModalBtn = overlay.querySelector('#idm-btn-copy-links');
    const txtModalBtn = overlay.querySelector('#idm-btn-export-txt');
    const closeBtn = overlay.querySelector('#idm-modal-close');
    const cancelBtn = overlay.querySelector('#idm-btn-cancel');

    const getCheckedItems = () => {
      const selected = [];
      const itemCheckboxes = overlay.querySelectorAll('.idm-item-checkbox');
      itemCheckboxes.forEach((cb) => {
        if (cb.checked) {
          const u = decodeURIComponent(cb.getAttribute('data-url'));
          const rawFn = cb.getAttribute('data-filename');
          const fn = rawFn ? decodeURIComponent(rawFn) : null;
          selected.push({ url: u, filename: fn });
        }
      });
      return selected;
    };

    const getCheckedUrls = () => {
      return getCheckedItems().map((it) => it.url);
    };

    const updateCount = () => {
      const itemCheckboxes = overlay.querySelectorAll('.idm-item-checkbox');
      const checkedCount = Array.from(itemCheckboxes).filter((c) => c.checked).length;

      let totalBytes = 0;
      let hasSizes = false;
      itemCheckboxes.forEach((cb) => {
        if (cb.checked) {
          const u = decodeURIComponent(cb.getAttribute('data-url'));
          if (itemSizeCache.has(u)) {
            totalBytes += itemSizeCache.get(u);
            hasSizes = true;
          }
        }
      });

      if (hasSizes && totalBytes > 0) {
        countBadge.textContent = t.modal_count_with_size(checkedCount, itemCheckboxes.length, formatFileSize(totalBytes));
      } else {
        countBadge.textContent = t.modal_count(checkedCount, itemCheckboxes.length);
      }

      if (sendBtn) sendBtn.disabled = checkedCount === 0;
      if (directHlsBtn) directHlsBtn.disabled = checkedCount === 0;
      copyModalBtn.disabled = checkedCount === 0;
      txtModalBtn.disabled = checkedCount === 0;
      selectAllCheck.checked = itemCheckboxes.length > 0 && checkedCount === itemCheckboxes.length;
      selectAllCheck.indeterminate = checkedCount > 0 && checkedCount < itemCheckboxes.length;
    };

    const bindItemCheckboxEvents = () => {
      const itemCheckboxes = overlay.querySelectorAll('.idm-item-checkbox');
      itemCheckboxes.forEach((cb) => {
        cb.addEventListener('change', updateCount);
      });
    };

    bindItemCheckboxEvents();

    // Async size preview fetcher
    const fetchSizesForItems = (list) => {
      if (cachedSettings.previewFileSize === false) return;
      list.forEach((item) => {
        if (item.isSub || itemSizeCache.has(item.url)) return;
        safeSendMessage({ action: 'getFileSize', url: item.url }, (res) => {
          if (res && res.success && res.size) {
            itemSizeCache.set(item.url, res.size);
            const cb = overlay.querySelector(`[data-url="${encodeURIComponent(item.url)}"]`);
            if (cb) {
              const label = cb.parentElement ? cb.parentElement.querySelector('.idm-item-title') : null;
              if (label && !label.querySelector('.idm-badge-size')) {
                const sBadge = document.createElement('span');
                sBadge.className = 'idm-item-badge idm-badge-size';
                sBadge.textContent = formatFileSize(res.size);
                label.appendChild(sBadge);
              }
            }
            updateCount();
          }
        });
      });
    };

    fetchSizesForItems(currentItems);

    selectAllCheck.addEventListener('change', () => {
      const itemCheckboxes = overlay.querySelectorAll('.idm-item-checkbox');
      itemCheckboxes.forEach((cb) => {
        cb.checked = selectAllCheck.checked;
      });
      updateCount();
    });

    // If filter controls exist, handle filtering
    if (filterOptions && filterOptions.allItems) {
      const seasonSelect = overlay.querySelector('#idm-filter-season');
      const qualitySelect = overlay.querySelector('#idm-filter-quality');
      const audioSelect = overlay.querySelector('#idm-filter-audio');
      const subFaCheck = overlay.querySelector('#idm-filter-sub-fa');
      const subEnCheck = overlay.querySelector('#idm-filter-sub-en');
      const subOtherCheck = overlay.querySelector('#idm-filter-sub-other');

      const applyFilters = () => {
        const selSeason = seasonSelect ? seasonSelect.value : 'all';
        const selQuality = qualitySelect ? qualitySelect.value : 'all';
        const selAudio = audioSelect ? audioSelect.value : 'all';
        const includeSubFa = subFaCheck ? subFaCheck.checked : false;
        const includeSubEn = subEnCheck ? subEnCheck.checked : false;
        const includeSubOther = subOtherCheck ? subOtherCheck.checked : false;

        const filtered = filterOptions.allItems.filter((item) => {
          if (selSeason !== 'all' && String(item.seasonId) !== String(selSeason)) {
            return false;
          }
          if (item.isSub) {
            if (item.subLang === 'fa') return includeSubFa;
            if (item.subLang === 'en') return includeSubEn;
            return includeSubOther;
          }
          if (selQuality !== 'all' && String(item.quality) !== String(selQuality)) {
            return false;
          }
          if (selAudio === 'dubbed' && !item.isDubbed) {
            return false;
          }
          if (selAudio === 'original' && item.isDubbed) {
            return false;
          }
          return true;
        });

        itemsContainer.innerHTML = renderItemsHtml(filtered);
        bindItemCheckboxEvents();
        updateCount();
        fetchSizesForItems(filtered);

        const subElem = overlay.querySelector('#idm-modal-sub');
        if (subElem) {
          subElem.textContent = t.serial_modal_subtitle(filterOptions.episodeCount || filtered.length, filtered.length);
        }
      };

      if (seasonSelect) seasonSelect.addEventListener('change', applyFilters);
      if (qualitySelect) qualitySelect.addEventListener('change', applyFilters);
      if (audioSelect) audioSelect.addEventListener('change', applyFilters);
      if (subFaCheck) subFaCheck.addEventListener('change', applyFilters);
      if (subEnCheck) subEnCheck.addEventListener('change', applyFilters);
      if (subOtherCheck) subOtherCheck.addEventListener('change', applyFilters);
    }

    const closeModal = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      overlay.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (hasMoved) {
        hasMoved = false;
        return;
      }
      if (e.target === overlay) closeModal();
    });

    // Copy checked links in modal
    copyModalBtn.addEventListener('click', () => {
      const urls = getCheckedUrls();
      if (urls.length === 0) return;
      copyLinksToClipboard(urls);
    });

    // Export checked links as .txt in modal
    txtModalBtn.addEventListener('click', () => {
      const urls = getCheckedUrls();
      if (urls.length === 0) return;
      exportLinksToTxtFile(urls);
    });

    // Send selected items to IDM
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const selectedItems = getCheckedItems();

        if (selectedItems.length === 0) return;

        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span>⏳ ${t.modal_btn_sending}</span>`;

        safeSendMessage(
          {
            action: 'batchDownloadWithIDM',
            items: selectedItems,
            urls: selectedItems.map((it) => it.url),
            queueMode: 'queue'
          },
          (res) => {
            closeModal();
            if (res && res.success) {
              showToast(t.toast_batch_success(selectedItems.length), 'success');
            } else {
              showToast(res?.error || t.toast_batch_error, 'error');
            }
          }
        );
      });
    }

    if (directHlsBtn) {
      directHlsBtn.addEventListener('click', () => {
        const selectedItems = getCheckedItems();
        if (selectedItems.length === 0) return;

        directHlsBtn.disabled = true;
        directHlsBtn.innerHTML = `<span>⏳ ${t.modal_btn_hls_sending}</span>`;

        safeSendMessage(
          {
            action: 'batchDownloadHls',
            items: selectedItems
          },
          (res) => {
            closeModal();
            if (res && res.success) {
              showToast(t.toast_hls_started(selectedItems.length), 'success');
            } else {
              showToast(res?.error || t.toast_hls_error, 'error');
            }
          }
        );
      });
    }
  };

  // Monitor mouseup / keyup / selection changes to display float button
  let selectionTimeout = null;

  const handleSelection = () => {
    if (!cachedSettings.enabled || isCurrentSiteExcluded()) {
      removeFloatBtn();
      return;
    }

    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
    }

    selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        removeFloatBtn();
        return;
      }

      const links = getLinksFromSelection(selection);
      if (links.length > 0) {
        currentSelectedLinks = links;
        const range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();

        // Fallback: if range rect has 0 width or height (happens in some block elements)
        if (!rect || rect.width === 0 || rect.height === 0) {
          const container = range.commonAncestorContainer;
          const elem = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
          if (elem) {
            rect = elem.getBoundingClientRect();
          }
        }

        if (rect && (rect.width > 0 || rect.height > 0)) {
          showFloatBtn(rect, links.length);
        }
      } else {
        removeFloatBtn();
      }
    }, 60);
  };

  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('keyup', handleSelection);

  // Clear float button when clicking away without a selection
  document.addEventListener('mousedown', (e) => {
    if (floatBtn && !floatBtn.contains(e.target)) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          removeFloatBtn();
        }
      }, 100);
    }
  });

  // Also remove float button on scroll if selection collapses
  window.addEventListener('scroll', () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      removeFloatBtn();
    }
  }, { passive: true });

  // -------------------------------------------------------------
  // Universal Serial & VOD Batch Extractor
  // -------------------------------------------------------------

  // Helper to create and attach the sticky action button
  const createStickyButton = (onClickHandler, labelText) => {
    const existing = document.getElementById('idm-media-sticky-btn') || document.getElementById('idm-serial-sticky-btn');
    if (existing) return existing;

    const t = getT();
    const isRtl = cachedSettings.language !== 'en';

    const stickyBtn = document.createElement('div');
    stickyBtn.id = 'idm-media-sticky-btn';
    stickyBtn.style.direction = isRtl ? 'rtl' : 'ltr';
    stickyBtn.innerHTML = `
      <div class="idm-serial-sticky-inner" title="${labelText || t.serial_btn_float}">
        <span class="idm-serial-icon">🎬</span>
        <span class="idm-serial-text">${labelText || t.serial_btn_float}</span>
      </div>
    `;

    // Make sticky button draggable
    let btnDragging = false;
    let btnMoved = false;
    let btnStartX = 0;
    let btnStartY = 0;
    let btnInitLeft = 0;
    let btnInitTop = 0;

    const onBtnMouseMove = (e) => {
      if (!btnDragging) return;
      const dx = e.clientX - btnStartX;
      const dy = e.clientY - btnStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        btnMoved = true;
        stickyBtn.style.bottom = 'auto';
        stickyBtn.style.right = 'auto';
        stickyBtn.style.left = `${Math.max(10, Math.min(window.innerWidth - stickyBtn.offsetWidth - 10, btnInitLeft + dx))}px`;
        stickyBtn.style.top = `${Math.max(10, Math.min(window.innerHeight - stickyBtn.offsetHeight - 10, btnInitTop + dy))}px`;
      }
    };

    const onBtnMouseUp = () => {
      if (!btnDragging) return;
      btnDragging = false;
      document.removeEventListener('mousemove', onBtnMouseMove);
      document.removeEventListener('mouseup', onBtnMouseUp);
    };

    const onBtnMouseDown = (e) => {
      if (e.button !== 0) return;
      btnDragging = true;
      btnMoved = false;
      btnStartX = e.clientX;
      btnStartY = e.clientY;
      const rect = stickyBtn.getBoundingClientRect();
      btnInitLeft = rect.left;
      btnInitTop = rect.top;

      document.addEventListener('mousemove', onBtnMouseMove);
      document.addEventListener('mouseup', onBtnMouseUp);
    };

    stickyBtn.addEventListener('mousedown', onBtnMouseDown);

    // Touch support for sticky button
    const onBtnTouchMove = (e) => {
      if (!btnDragging || !e.touches || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - btnStartX;
      const dy = touch.clientY - btnStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        btnMoved = true;
        stickyBtn.style.bottom = 'auto';
        stickyBtn.style.right = 'auto';
        stickyBtn.style.left = `${Math.max(10, Math.min(window.innerWidth - stickyBtn.offsetWidth - 10, btnInitLeft + dx))}px`;
        stickyBtn.style.top = `${Math.max(10, Math.min(window.innerHeight - stickyBtn.offsetHeight - 10, btnInitTop + dy))}px`;
      }
    };

    const onBtnTouchEnd = () => {
      btnDragging = false;
    };

    const onBtnTouchStart = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      btnDragging = true;
      btnMoved = false;
      const touch = e.touches[0];
      btnStartX = touch.clientX;
      btnStartY = touch.clientY;
      const rect = stickyBtn.getBoundingClientRect();
      btnInitLeft = rect.left;
      btnInitTop = rect.top;
    };

    stickyBtn.addEventListener('touchstart', onBtnTouchStart, { passive: true });
    stickyBtn.addEventListener('touchmove', onBtnTouchMove, { passive: true });
    stickyBtn.addEventListener('touchend', onBtnTouchEnd);

    stickyBtn.addEventListener('click', (e) => {
      if (btnMoved) {
        btnMoved = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClickHandler(e);
    });

    if (document.body) {
      document.body.appendChild(stickyBtn);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(stickyBtn);
      });
    }

    return stickyBtn;
  };

  // 1. Universal Page Media Links & Episode Scanner
  // (Detects movie/serial download links on portals like f2my.top, film2media, digimoviez, zarfilm, etc.)
  const scanDocumentForEpisodes = () => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const mediaRegex = /\.(mkv|mp4|avi|mov|wmv|ts|m4v|webm)($|\?)/i;
    const subRegex = /\.(srt|vtt|sub)($|\?)/i;

    const candidateItems = [];
    const seenUrls = new Set();

    anchors.forEach((a) => {
      const rawHref = a.getAttribute('href');
      if (!rawHref) return;

      let fullUrl = '';
      try {
        fullUrl = new URL(rawHref, window.location.href).href;
      } catch {
        return;
      }

      if (seenUrls.has(fullUrl)) return;

      const isVideo = mediaRegex.test(fullUrl);
      const isSub = subRegex.test(fullUrl);
      if (!isVideo && !isSub) return;

      // Extract filename from URL path
      let filename = '';
      try {
        const u = new URL(fullUrl);
        filename = decodeURIComponent(u.pathname.split('/').pop().split('?')[0]);
      } catch {}

      if (!filename) {
        filename = (a.textContent || a.title || '').trim();
      }

      // Detect season: e.g. S01, S1, /S01/, /Season-1/
      const sMatch = filename.match(/[Ss](\d{1,2})/i) || fullUrl.match(/\/S(?:eason[_-]?)?(\d{1,2})\b/i);
      const seasonId = sMatch ? parseInt(sMatch[1], 10) : 1;

      // Detect episode: e.g. E01, E12, Episode 3, قسمت 3
      const eMatch = filename.match(/[Ee](\d{1,3})/i) ||
                     filename.match(/(?:episode|قسمت)[._\s-]?(\d{1,3})/i) ||
                     (a.textContent && a.textContent.match(/(?:episode|قسمت)[._\s-]?(\d{1,3})/i));
      const epNum = eMatch ? parseInt(eMatch[1], 10) : null;

      // Detect quality: 2160p, 4k, 1080p, 720p, 480p, 360p
      const qMatch = filename.match(/(2160p|4k|1080p|720p|480p|360p)/i) ||
                     fullUrl.match(/(2160p|4k|1080p|720p|480p|360p)/i);
      let quality = 0;
      if (qMatch) {
        const qStr = qMatch[1].toLowerCase();
        if (qStr === '4k' || qStr === '2160p') quality = 2160;
        else if (qStr === '1080p') quality = 1080;
        else if (qStr === '720p') quality = 720;
        else if (qStr === '480p') quality = 480;
        else if (qStr === '360p') quality = 360;
      }

      // Dubbed detection
      const checkStr = [filename, fullUrl, a.textContent, a.title].filter(Boolean).join(' ');
      const isDubbedRegex = /(?:^|[^a-zA-Z0-9])(?:dub|dubbed|duble|dooble|farsi[._-]?dub|fa[._-]?dub|persian[._-]?dub)(?:$|[^a-zA-Z0-9])|دوبله/i;
      const isDubbed = isDubbedRegex.test(checkStr);

      // Subtitle language detection
      let subLang = null;
      if (isSub) {
        subLang = 'other';
        const checkStr = (filename + ' ' + fullUrl + ' ' + (a.textContent || '')).toLowerCase();
        if (/farsi|persian|fa\b|sub_fa|فارسی/i.test(checkStr)) {
          subLang = 'fa';
        } else if (/english|en\b|eng\b|sub_en|انگلیسی/i.test(checkStr)) {
          subLang = 'en';
        }
      }

      // Badge tag
      let badge = '';
      if (isSub) {
        if (subLang === 'fa') badge = 'SRT فارسی';
        else if (subLang === 'en') badge = 'SRT English';
        else badge = 'SRT';
      } else if (quality > 0) {
        badge = isDubbed ? `دوبله | ${quality === 2160 ? '4K' : quality + 'p'}` : (quality === 2160 ? '4K' : `${quality}p`);
      } else if (isDubbed) {
        badge = 'دوبله';
      }

      candidateItems.push({
        url: fullUrl,
        filename: filename,
        title: filename,
        seasonId: seasonId,
        episodeNum: epNum,
        quality: quality,
        isSub: isSub,
        subLang: subLang,
        isDubbed: isDubbed,
        badge: badge
      });

      seenUrls.add(fullUrl);
    });

    // Build distinct seasons
    const seasonMap = new Map();
    const curT = getT();
    candidateItems.forEach((it) => {
      if (!seasonMap.has(it.seasonId)) {
        seasonMap.set(it.seasonId, {
          id: it.seasonId,
          title: `${curT.serial_season_prefix} ${it.seasonId}`
        });
      }
    });

    const seasons = Array.from(seasonMap.keys())
      .sort((a, b) => a - b)
      .map((k) => seasonMap.get(k));

    // Build distinct qualities
    const qualities = Array.from(new Set(candidateItems.map((it) => it.quality).filter((q) => q > 0)))
      .sort((a, b) => b - a);

    return {
      items: candidateItems,
      seasons: seasons,
      qualities: qualities,
      episodeCount: candidateItems.filter((it) => !it.isSub).length || candidateItems.length
    };
  };

  const initUniversalMediaScanner = () => {
    const handleScan = () => {
      const scanResult = scanDocumentForEpisodes();

      // Only show sticky button if at least 3 media links are found
      const hasEpisodePattern = scanResult.items.some((it) => it.episodeNum !== null);
      const minThreshold = hasEpisodePattern ? 2 : 3;

      if (scanResult.items.length < minThreshold) return;

      const t = getT();
      const buttonLabel = t.serial_btn_float_count(scanResult.items.length);

      const existingBtn = document.getElementById('idm-media-sticky-btn') || document.getElementById('idm-serial-sticky-btn');
      if (existingBtn) {
        const textElem = existingBtn.querySelector('.idm-serial-text');
        if (textElem) textElem.textContent = buttonLabel;
        return;
      }

      createStickyButton(() => {
        // Re-scan live DOM in case tabs or accordion sections were expanded
        const liveResult = scanDocumentForEpisodes();
        const activeItems = liveResult.items.length > 0 ? liveResult.items : scanResult.items;
        const activeSeasons = liveResult.seasons.length > 0 ? liveResult.seasons : scanResult.seasons;
        const activeQualities = liveResult.qualities.length > 0 ? liveResult.qualities : scanResult.qualities;
        const activeCount = liveResult.episodeCount || scanResult.episodeCount;

        openBatchModal(activeItems, {
          allItems: activeItems,
          seasons: activeSeasons,
          qualities: activeQualities,
          episodeCount: activeCount
        });
      }, buttonLabel);
    };

    // Scan immediately
    handleScan();

    // Re-check after 1.5s in case page content / tabs lazy-loaded
    setTimeout(handleScan, 1500);

    // Also observe DOM additions (with debounce) for client-rendered SPAs/tabs
    let domTimer = null;
    const observer = new MutationObserver(() => {
      if (domTimer) clearTimeout(domTimer);
      domTimer = setTimeout(handleScan, 800);
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  // 2. Specialized VOD Streaming API Adapter
  // (For streaming platforms where links are fetched on demand via internal API)
  const initStreamingVodAdapter = (hostname, pathname) => {
    const match = pathname.match(/\/serial\/(\d+)/);
    if (!match) return;

    const contentId = match[1];
    const t = getT();

    // Clean root domain to prevent core.www subdomains
    const rootDomain = hostname.replace(/^www\./i, '');
    const apiBase = `https://core.${rootDomain}/api/v4/Content`;

    let stickyBtn = null;

    const extractEpisodesFromApi = async () => {
      const curT = getT();
      const currentPath = window.location.pathname;
      const curMatch = currentPath.match(/\/serial\/(\d+)/);
      const activeContentId = curMatch ? curMatch[1] : contentId;

      if (stickyBtn) {
        stickyBtn.classList.add('idm-serial-loading');
        const textElem = stickyBtn.querySelector('.idm-serial-text');
        if (textElem) textElem.textContent = curT.serial_extracting;
      }
      showToast(curT.serial_extracting, 'info');

      try {
        let seasons = [];
        let seriesEnglishTitle = '';
        try {
          const contentRes = await fetch(`${apiBase}/GetContent?Id=${activeContentId}`, {
            headers: { 'SourceEnvironment': 'Website' }
          });
          const contentData = await contentRes.json();
          if (contentData && contentData.Result) {
            seriesEnglishTitle = (contentData.Result.EnglishBody || '').trim().replace(/[^a-zA-Z0-9_\-\.]/g, '');
            if (Array.isArray(contentData.Result.SeasonList)) {
              seasons = contentData.Result.SeasonList.map((s) => ({
                id: s.SeasonId,
                title: s.SeasonTitle || `${curT.serial_season_prefix} ${s.SeasonId}`
              }));
            }
          }
        } catch (e) {
          console.debug('[IDM] Note: SeasonList fallback to season 1:', e);
        }

        if (seasons.length === 0) {
          seasons = [{ id: 1, title: `${curT.serial_season_prefix} 1` }];
        }

        if (!seriesEnglishTitle) {
          const urlSlugMatch = currentPath.match(/\/serial\/\d+-([^/]+)/);
          if (urlSlugMatch) {
            seriesEnglishTitle = urlSlugMatch[1].replace(/[^a-zA-Z0-9_\-\.]/g, '');
          }
        }

        const allItems = [];
        let totalEpisodes = 0;

        for (const season of seasons) {
          try {
            const attUrl = `${apiBase}/GetContentAttachments?Id=${activeContentId}&seasonId=${season.id}&generateLink=true`;
            const attRes = await fetch(attUrl, {
              headers: { 'SourceEnvironment': 'Website' }
            });
            const attData = await attRes.json();

            if (attData && attData.Result && Array.isArray(attData.Result.Attachments)) {
              const attachments = attData.Result.Attachments;
              totalEpisodes += attachments.length;

              attachments.forEach((att, epIdx) => {
                const epNum = epIdx + 1;
                const epTitle = att.Title || `${season.title} - قسمت ${epNum}`;
                const sPad = String(season.id).padStart(2, '0');
                const ePad = String(epNum).padStart(2, '0');
                const files = att.Files || [];

                files.forEach((f) => {
                  if (!f.Path) return;

                  if (f.Type === 9) {
                    const width = f.Width || 0;
                    let quality = 720;
                    if (width >= 1920) quality = 1080;
                    else if (width >= 1280) quality = 720;
                    else if (width >= 800) quality = 480;
                    else quality = 360;

                    let fileName = '';
                    try {
                      const parsed = new URL(f.Path);
                      fileName = parsed.searchParams.get('name') || '';
                    } catch {}

                    // Dubbed detection: check API flag att.IsDubbed, or check filename, url, and titles
                    const checkStr = [fileName, f.Path, att.Title, epTitle].filter(Boolean).join(' ');
                    const isDubbedRegex = /(?:^|[^a-zA-Z0-9])(?:dub|dubbed|duble|dooble|farsi[._-]?dub|fa[._-]?dub|persian[._-]?dub)(?:$|[^a-zA-Z0-9])|دوبله/i;
                    const isDubbed = Boolean(att.IsDubbed) || isDubbedRegex.test(checkStr);

                    if (!fileName) {
                      const prefix = seriesEnglishTitle || 'Episode';
                      const dubTag = isDubbed ? '-DUB' : '';
                      fileName = `${prefix}-S${sPad}E${ePad}${dubTag}_${quality}.mp4`;
                    }

                    allItems.push({
                      url: f.Path,
                      filename: fileName,
                      title: fileName || `${epTitle} (${quality}p)`,
                      seasonId: season.id,
                      episodeNum: epNum,
                      quality: quality,
                      badge: `${quality}p`,
                      isDubbed: isDubbed,
                      isSub: false
                    });
                  }

                  if (f.Type === 3) {
                    let subLang = 'fa';
                    if (f.Path.includes('sub_en') || f.Path.includes('en.srt')) subLang = 'en';
                    const subLabel = subLang === 'fa' ? 'فارسی' : 'English';

                    const prefix = seriesEnglishTitle || 'Episode';
                    const subFileName = `${prefix}-S${sPad}E${ePad}-sub_${subLang}.srt`;

                    allItems.push({
                      url: f.Path,
                      filename: subFileName,
                      title: `${epTitle} [زیرنویس ${subLabel}] (${subFileName})`,
                      seasonId: season.id,
                      episodeNum: epNum,
                      quality: 0,
                      badge: `SRT ${subLabel}`,
                      isSub: true,
                      subLang: subLang
                    });
                  }
                });
              });
            }
          } catch (err) {
            console.debug(`[IDM] Note: season ${season.id}:`, err);
          }
        }

        if (stickyBtn) {
          stickyBtn.classList.remove('idm-serial-loading');
          const textElem = stickyBtn.querySelector('.idm-serial-text');
          if (textElem) textElem.textContent = curT.serial_btn_float;
        }

        if (allItems.length === 0) {
          showToast(curT.serial_no_episodes, 'error');
          return;
        }

        const qualities = Array.from(new Set(allItems.map((it) => it.quality).filter((q) => q > 0)))
          .sort((a, b) => b - a);

        openBatchModal(allItems, {
          allItems: allItems,
          seasons: seasons,
          qualities: qualities,
          episodeCount: totalEpisodes
        });
      } catch (err) {
        if (stickyBtn) {
          stickyBtn.classList.remove('idm-serial-loading');
          const textElem = stickyBtn.querySelector('.idm-serial-text');
          if (textElem) textElem.textContent = curT.serial_btn_float;
        }
        showToast(curT.toast_bridge_error, 'error');
        console.debug('[IDM] Batch extraction note:', err);
      }
    };

    stickyBtn = createStickyButton(extractEpisodesFromApi, t.serial_btn_float);
  };

  // 3. Specialized HLS Streaming Portal Adapter
  // (For multi-segment HLS streaming portals with JWT content tokens and master playlists)
  const initHlsStreamingPortalAdapter = (hostname, pathname) => {
    const t = getT();
    const HLS_GATEWAY_VOD = atob('aHR0cHM6Ly9nYXRld2F5LnRlbGV3ZWJpb24ubmV0L2thbmRvby92b2QvY29udGVudC8=');

    const decodeJwtPayload = (token) => {
      if (!token || typeof token !== 'string') return null;
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          const jsonStr = decodeURIComponent(
            atob(b64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          return JSON.parse(jsonStr);
        }
      } catch (e) {
        try {
          let b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          return JSON.parse(atob(b64));
        } catch {}
      }
      return null;
    };

    const getContentIdFromPage = () => {
      const pathMatch = window.location.pathname.match(/(0x[a-f0-9]+)/i);
      if (pathMatch) return pathMatch[1];

      try {
        const script = document.getElementById('__NEXT_DATA__');
        if (script && script.textContent) {
          const nextData = JSON.parse(script.textContent);
          const pp = nextData?.props?.pageProps;
          if (pp?.id) return pp.id;
          if (pp?.alias && /^0x[a-f0-9]+$/i.test(pp.alias)) return pp.alias;
          if (pp?.serverData?.data?.content?.[0]?.content_id) {
            return pp.serverData.data.content[0].content_id;
          }
        }
      } catch {}

      return null;
    };

    const parseVariantStreams = async (masterStreamUrl) => {
      const variants = [];
      try {
        const pRes = await fetch(masterStreamUrl);
        if (!pRes.ok) throw new Error('Failed to fetch playlist');
        const text = await pRes.text();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.includes('RESOLUTION=')) {
            const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
            const q = resMatch ? parseInt(resMatch[1], 10) : 720;
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && !nextLine.startsWith('#')) {
              const fullUrl = new URL(nextLine, masterStreamUrl).href;
              variants.push({ quality: q, url: fullUrl });
            }
          }
        }
      } catch (e) {
        console.debug('[IDM] Note parsing variant playlist:', e);
      }

      if (variants.length === 0) {
        variants.push({ quality: 720, url: masterStreamUrl });
      }

      return variants.sort((a, b) => b.quality - a.quality);
    };

    let stickyBtn = null;

    const resolveActivePageStream = async () => {
      const contentId = getContentIdFromPage();
      if (!contentId) return;

      try {
        const cRes = await fetch(`${HLS_GATEWAY_VOD}get-content?content_id=${contentId}`);
        if (!cRes.ok) return;
        const cJson = await cRes.json();
        const c0 = cJson.body?.content?.[0];
        if (c0 && c0.content_token) {
          const payload = decodeJwtPayload(c0.content_token);
          const masterStreamUrl = payload?.content?.stream ? Object.values(payload.content.stream)[0] : null;
          if (masterStreamUrl) {
            const variants = await parseVariantStreams(masterStreamUrl);
            const bestVariant = variants[0] || { url: masterStreamUrl, quality: 720 };
            const persianTitle = c0.persian_title || 'ویدیو';
            const englishTitle = (c0.english_title || 'Video').replace(/[^a-zA-Z0-9_\-\.]/g, '') || 'Video';
            const epNum = c0.episode ? `_E${String(c0.episode).padStart(2, '0')}` : '';

            currentHlsActiveStream = {
              url: bestVariant.url,
              filename: `${englishTitle}${epNum}_${bestVariant.quality}p.ts`,
              title: `${persianTitle} (${bestVariant.quality}p)`,
              quality: bestVariant.quality,
              isHls: true
            };

            if (typeof triggerVideoCheck === 'function') {
              triggerVideoCheck();
            }
          }
        }
      } catch (e) {
        console.debug('[IDM] Error resolving active HLS stream:', e);
      }
    };

    const extractHlsEpisodes = async () => {
      const curT = getT();
      const contentId = getContentIdFromPage();

      if (!contentId) {
        showToast(curT.serial_no_episodes, 'error');
        return;
      }

      if (stickyBtn) {
        stickyBtn.classList.add('idm-serial-loading');
        const textElem = stickyBtn.querySelector('.idm-serial-text');
        if (textElem) textElem.textContent = curT.serial_extracting;
      }
      showToast(curT.serial_extracting, 'info');

      try {
        let serialContent = null;
        let serialParts = [];
        let seasons = [{ id: 1, title: `${curT.serial_season_prefix} 1` }];

        // Check content type or get parent serial id first
        let targetSerialId = null;
        try {
          const infoRes = await fetch(`${HLS_GATEWAY_VOD}get-content?content_id=${contentId}`);
          if (infoRes.ok) {
            const infoJson = await infoRes.json();
            const cInfo = infoJson.body?.content?.[0];
            if (cInfo) {
              if (cInfo.serial && cInfo.serial.content_id) {
                targetSerialId = cInfo.serial.content_id;
              } else if (cInfo.content_type === 'SERIAL') {
                targetSerialId = cInfo.content_id;
              } else if (cInfo.content_token) {
                serialContent = cInfo;
                serialParts = [cInfo];
              }
            }
          }
        } catch (e) {
          console.debug('[IDM] get-content pre-check note:', e);
        }

        const effectiveSerialId = targetSerialId || contentId;

        // If it may be a serial, query get-serial with pagination
        if (serialParts.length === 0) {
          try {
            let offset = 0;
            const pageSize = 50;
            let keepFetching = true;

            while (keepFetching && offset <= 200) {
              const serialUrl = `${HLS_GATEWAY_VOD}get-serial?content_id=${effectiveSerialId}&season=1&first=${pageSize}&offset=${offset}`;
              const sRes = await fetch(serialUrl);
              if (!sRes.ok) break;
              const sJson = await sRes.json();
              const c0 = sJson.body?.content?.[0];
              if (!c0 || !Array.isArray(c0.serial_parts) || c0.serial_parts.length === 0) {
                break;
              }

              if (!serialContent) {
                serialContent = c0;
                if (Array.isArray(c0.seasons) && c0.seasons.length > 0) {
                  seasons = c0.seasons.map((s) => ({
                    id: typeof s === 'object' ? s.id || s.season : s,
                    title: `${curT.serial_season_prefix} ${typeof s === 'object' ? s.id || s.season : s}`
                  }));
                }
              }

              serialParts.push(...c0.serial_parts);

              if (c0.serial_parts.length < pageSize) {
                keepFetching = false;
              } else {
                offset += pageSize;
              }
            }
          } catch (e) {
            console.debug('[IDM] get-serial note:', e);
          }
        }

        // If still no parts, fallback to single content if available
        if (serialParts.length === 0) {
          try {
            const contentUrl = `${HLS_GATEWAY_VOD}get-content?content_id=${contentId}`;
            const cRes = await fetch(contentUrl);
            if (cRes.ok) {
              const cJson = await cRes.json();
              const c0 = cJson.body?.content?.[0];
              if (c0 && c0.content_token) {
                serialContent = c0;
                serialParts = [c0];
              }
            }
          } catch (e) {
            console.debug('[IDM] get-content fallback note:', e);
          }
        }

        if (serialParts.length === 0 || !serialContent) {
          if (stickyBtn) {
            stickyBtn.classList.remove('idm-serial-loading');
            const textElem = stickyBtn.querySelector('.idm-serial-text');
            if (textElem) textElem.textContent = curT.serial_btn_float_hls;
          }
          showToast(curT.serial_no_episodes, 'error');
          return;
        }

        const persianTitle = serialContent.persian_title || 'ویدیو';
        const englishTitle = (serialContent.english_title || 'Video')
          .replace(/[^a-zA-Z0-9_\-\.]/g, '') || 'Video';

        // Extract variants for each episode in parallel
        const episodeTasks = serialParts.map(async (part, index) => {
          const epNum = part.episode || (index + 1);
          const sNum = part.season || 1;
          const sPad = String(sNum).padStart(2, '0');
          const ePad = String(epNum).padStart(2, '0');

          if (!part.content_token) return [];

          const payload = decodeJwtPayload(part.content_token);
          const masterStreamUrl = payload?.content?.stream ? Object.values(payload.content.stream)[0] : null;
          if (!masterStreamUrl) return [];

          const variants = await parseVariantStreams(masterStreamUrl);
          const isSingle = serialParts.length === 1;

          return variants.map((v) => ({
            url: v.url,
            filename: isSingle
              ? `${englishTitle}_${v.quality}p.ts`
              : `${englishTitle}-S${sPad}E${ePad}_${v.quality}p.ts`,
            title: isSingle
              ? `${persianTitle} (${v.quality}p)`
              : `${persianTitle} - فصل ${sNum} قسمت ${epNum} (${v.quality}p)`,
            seasonId: sNum,
            episodeNum: epNum,
            quality: v.quality,
            badge: `${v.quality}p`,
            isHls: true,
            isSub: false
          }));
        });

        const nestedItems = await Promise.all(episodeTasks);
        const allItems = nestedItems.flat();

        if (stickyBtn) {
          stickyBtn.classList.remove('idm-serial-loading');
          const textElem = stickyBtn.querySelector('.idm-serial-text');
          if (textElem) textElem.textContent = curT.serial_btn_float_hls;
        }

        if (allItems.length === 0) {
          showToast(curT.serial_no_episodes, 'error');
          return;
        }

        const qualities = Array.from(new Set(allItems.map((it) => it.quality).filter((q) => q > 0)))
          .sort((a, b) => b - a);

        openBatchModal(allItems, {
          allItems: allItems,
          seasons: seasons,
          qualities: qualities,
          episodeCount: serialParts.length,
          isHls: true
        });
      } catch (err) {
        if (stickyBtn) {
          stickyBtn.classList.remove('idm-serial-loading');
          const textElem = stickyBtn.querySelector('.idm-serial-text');
          if (textElem) textElem.textContent = curT.serial_btn_float_hls;
        }
        showToast(curT.toast_bridge_error, 'error');
        console.debug('[IDM] HLS batch extraction error:', err);
      }
    };

    const attachStickyIfEligible = () => {
      const cId = getContentIdFromPage();
      if (!cId) return;
      if (!document.getElementById('idm-media-sticky-btn') && !document.getElementById('idm-serial-sticky-btn')) {
        stickyBtn = createStickyButton(extractHlsEpisodes, t.serial_btn_float_hls);
      }
      resolveActivePageStream();
    };

    attachStickyIfEligible();

    // Listen for SPA navigation in Next.js
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        currentHlsActiveStream = null;
        setTimeout(attachStickyIfEligible, 500);
      }
    });
    urlObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
  };

  // Floating Video Player Downloader
  const initFloatingVideoDownloader = () => {
    const getVideoSource = (video) => {
      if (!video) return null;

      // If active HLS stream was resolved for current video/portal, return it
      if (currentHlsActiveStream && currentHlsActiveStream.url) {
        return currentHlsActiveStream.url;
      }

      // Check currentSrc or src
      let src = video.currentSrc || video.src || '';
      if (src && !src.startsWith('blob:') && !src.startsWith('mediasource:') && /^https?:\/\//i.test(src)) {
        return src;
      }

      // Check child <source> elements
      const sources = Array.from(video.querySelectorAll('source'));
      for (const s of sources) {
        const sSrc = s.src || s.getAttribute('src') || '';
        if (sSrc && !sSrc.startsWith('blob:') && !sSrc.startsWith('mediasource:') && /^https?:\/\//i.test(sSrc)) {
          return sSrc;
        }
      }

      // Check data attributes
      const dataUrl = video.getAttribute('data-src') || video.getAttribute('data-url') || '';
      if (dataUrl && !dataUrl.startsWith('blob:') && !dataUrl.startsWith('mediasource:') && /^https?:\/\//i.test(dataUrl)) {
        return dataUrl;
      }

      return null;
    };

    const attachFloatBarToVideo = (video) => {
      if (!cachedSettings.enabled || cachedSettings.floatingVideoBar === false || isCurrentSiteExcluded()) return;
      if (!video || video.dataset.idmFloatDismissed === 'true') return;
      if (video.offsetWidth > 0 && video.offsetWidth < 160) return;
      if (video.offsetHeight > 0 && video.offsetHeight < 100) return;

      // Verify behind the scenes if video has a valid direct downloadable HTTP/HTTPS source (not internal blob or MSE stream)
      const validSrc = getVideoSource(video);
      if (!validSrc) {
        // Blob / MSE stream cannot be directly downloaded by IDM (e.g. YouTube player).
        // Never show the floating button if it cannot be downloaded.
        return;
      }

      const isHls = Boolean(currentHlsActiveStream && currentHlsActiveStream.url === validSrc);

      const container = video.parentElement || video;
      if (container.querySelector('.idm-video-float-bar')) {
        const existingBar = container.querySelector('.idm-video-float-bar');
        existingBar.classList.remove('idm-float-hidden');
        return;
      }

      const cs = window.getComputedStyle(container);
      if (cs.position === 'static') {
        container.style.position = 'relative';
      }

      const t = getT();
      const bar = document.createElement('div');
      bar.className = 'idm-video-float-bar';
      bar.setAttribute('title', t.floating_player_title);

      bar.innerHTML = `
        <span class="idm-video-float-grip" title="${t.modal_drag_hint}">⋮⋮</span>
        <button class="idm-video-float-btn" type="button">
          <span class="idm-video-float-icon">🎬</span>
          <span>${t.floating_player_btn}</span>
          ${isHls ? `<span class="idm-hls-badge">${currentHlsActiveStream.quality || 720}p</span>` : ''}
        </button>
        <button class="idm-video-float-close" type="button" title="✕">✕</button>
      `;

      const downloadBtn = bar.querySelector('.idm-video-float-btn');
      const closeBtn = bar.querySelector('.idm-video-float-close');

      // Make video float bar draggable over video container
      let barDragging = false;
      let barStartX = 0;
      let barStartY = 0;
      let barInitLeft = 0;
      let barInitTop = 0;

      const onBarMouseMove = (e) => {
        if (!barDragging) return;
        const dx = e.clientX - barStartX;
        const dy = e.clientY - barStartY;
        bar.style.right = 'auto';
        bar.style.left = `${Math.max(4, Math.min(container.clientWidth - bar.offsetWidth - 4, barInitLeft + dx))}px`;
        bar.style.top = `${Math.max(4, Math.min(container.clientHeight - bar.offsetHeight - 4, barInitTop + dy))}px`;
      };

      const onBarMouseUp = () => {
        if (!barDragging) return;
        barDragging = false;
        document.removeEventListener('mousemove', onBarMouseMove);
        document.removeEventListener('mouseup', onBarMouseUp);
      };

      const onBarMouseDown = (e) => {
        if (e.target.closest('.idm-video-float-close') || e.target.closest('.idm-video-float-btn')) return;
        if (e.button !== 0) return;
        barDragging = true;
        barStartX = e.clientX;
        barStartY = e.clientY;
        const rect = bar.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();
        barInitLeft = rect.left - parentRect.left;
        barInitTop = rect.top - parentRect.top;

        document.addEventListener('mousemove', onBarMouseMove);
        document.addEventListener('mouseup', onBarMouseUp);
      };

      bar.addEventListener('mousedown', onBarMouseDown);

      let hideTimer = null;
      const resetHideTimer = () => {
        if (hideTimer) clearTimeout(hideTimer);
        bar.classList.remove('idm-float-hidden');
        hideTimer = setTimeout(() => {
          bar.classList.add('idm-float-hidden');
        }, 4000);
      };

      container.addEventListener('mouseenter', () => {
        bar.classList.remove('idm-float-hidden');
      });

      container.addEventListener('mouseleave', () => {
        bar.classList.add('idm-float-hidden');
      });

      container.addEventListener('mousemove', resetHideTimer);

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        video.dataset.idmFloatDismissed = 'true';
        bar.remove();
      });

      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const videoSrc = getVideoSource(video);
        if (!videoSrc) {
          bar.remove();
          return;
        }

        const rawTitle = (document.title || 'Video')
          .replace(/[\\/:*?"<>|]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 100);

        let ext = 'mp4';
        try {
          const u = new URL(videoSrc, window.location.href);
          const match = u.pathname.match(/\.(mp4|mkv|webm|mov|flv|m4v|avi|ts|m3u8)/i);
          if (match) ext = match[1].toLowerCase();
        } catch {}

        const filename = `${rawTitle}.${ext}`;
        const isInstant = isInstantKeyPressed(e);

        const isHls = Boolean(currentHlsActiveStream && currentHlsActiveStream.url === videoSrc);
        const targetFilename = (isHls && currentHlsActiveStream.filename) ? currentHlsActiveStream.filename : filename;

        safeSendMessage(
          {
            action: isHls ? 'downloadHls' : 'downloadWithIDM',
            url: videoSrc,
            filename: targetFilename,
            toQueue: true,
            startScheduler: false,
            silent: isInstant
          },
          (res) => {
            if (res && res.success) {
              showToast(isHls ? t.toast_hls_started(1) : (isInstant ? t.toast_instant_sent : t.toast_sent_success), 'success');
            } else {
              showToast(res?.error || t.toast_bridge_error, 'error');
            }
          }
        );
      });

      container.appendChild(bar);
      resetHideTimer();
    };

    triggerVideoCheck = () => {
      document.querySelectorAll('video').forEach((vid) => {
        attachFloatBarToVideo(vid);
      });
    };

    // Listen for video playback and interaction across all videos
    document.addEventListener('play', (e) => {
      if (e.target && e.target.tagName === 'VIDEO') {
        attachFloatBarToVideo(e.target);
      }
    }, true);

    document.addEventListener('playing', (e) => {
      if (e.target && e.target.tagName === 'VIDEO') {
        attachFloatBarToVideo(e.target);
      }
    }, true);

    document.addEventListener('mouseenter', (e) => {
      if (e.target && e.target.tagName === 'VIDEO') {
        attachFloatBarToVideo(e.target);
      }
    }, true);

    // Initial check for already playing/loaded videos
    document.querySelectorAll('video').forEach((vid) => {
      if (!vid.paused || vid.currentTime > 0) {
        attachFloatBarToVideo(vid);
      }
    });
  };

  // Main Extractor Initializer
  const initMediaBatchExtractor = () => {
    if (isCurrentSiteExcluded()) {
      return;
    }

    // Always initialize floating video player bar
    initFloatingVideoDownloader();

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Check if on recognized streaming VOD API platform
    const VOD_API_DOMAIN = atob('Z2FwZmlsbS5pcg==');
    if (hostname.includes(VOD_API_DOMAIN) && /\/serial\/\d+/i.test(pathname)) {
      initStreamingVodAdapter(hostname, pathname);
      return;
    }

    // Check if on recognized HLS streaming portal
    const HLS_PLATFORM_1 = atob('dGVsZXdlYmlvbi5uZXQ=');
    const HLS_PLATFORM_2 = atob('dGVsZXdlYmlvbi5jb20=');
    if (hostname.includes(HLS_PLATFORM_1) || hostname.includes(HLS_PLATFORM_2)) {
      initHlsStreamingPortalAdapter(hostname, pathname);
      return;
    }

    // Default: Universal DOM media scanner for all movie/serial download websites
    initUniversalMediaScanner();
  };

  // Run on load
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initMediaBatchExtractor);
  } else {
    initMediaBatchExtractor();
  }

})();
