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
    bypassKey: 'Alt',
    showToast: true,
    language: 'fa',
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
      modal_title: 'دانلود دسته‌ای با IDM',
      modal_subtitle: (n) => `${n} لینک دانلود شناسایی شد`,
      modal_select_all: 'انتخاب همه',
      modal_count: (sel, total) => `${sel} از ${total} انتخاب شده`,
      modal_cancel: 'لغو',
      modal_btn_copy: 'کپی لینک‌ها',
      modal_btn_txt: 'خروجی .txt',
      modal_btn_queue: 'افزودن به صف دانلود IDM',
      modal_btn_sending: 'در حال ارسال به IDM...'
    },
    en: {
      toast_transferring: 'Sending link to IDM...',
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
      modal_title: 'Batch Download with IDM',
      modal_subtitle: (n) => `${n} download links detected`,
      modal_select_all: 'Select All',
      modal_count: (sel, total) => `${sel} of ${total} selected`,
      modal_cancel: 'Cancel',
      modal_btn_copy: 'Copy Links',
      modal_btn_txt: 'Export .txt',
      modal_btn_queue: 'Add to IDM Queue',
      modal_btn_sending: 'Sending to IDM...'
    }
  };

  const getT = () => I18N_CONTENT[cachedSettings.language] || I18N_CONTENT.fa;

  // Sync settings from storage
  const syncSettings = () => {
    try {
      chrome.storage.local.get('settings', (res) => {
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
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.settings) {
        cachedSettings = { ...cachedSettings, ...changes.settings.newValue };
      }
    });
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
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'showToast') {
      showToast(msg.message, msg.status || 'info');
    }
  });

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

  // Check if bypass key is currently pressed
  const isBypassKeyPressed = (event) => {
    const key = cachedSettings.bypassKey;
    if (key === 'Alt' && event.altKey) return true;
    if (key === 'Shift' && event.shiftKey) return true;
    if (key === 'Ctrl' && (event.ctrlKey || event.metaKey)) return true;
    return false;
  };

  // Intercept single click on links
  window.addEventListener(
    'click',
    (event) => {
      if (!cachedSettings.enabled || !cachedSettings.interceptLinks) {
        return;
      }

      // If user holds bypass key (e.g. Alt), allow normal browser action
      if (isBypassKeyPressed(event)) {
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
        showToast(t.toast_transferring, 'info');

        chrome.runtime.sendMessage(
          {
            action: 'downloadWithIDM',
            url: href,
            referer: window.location.href
          },
          (res) => {
            if (chrome.runtime.lastError) {
              showToast(t.toast_bridge_error, 'error');
              return;
            }

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
  const openBatchModal = (items) => {
    // Remove any existing modal
    const oldModal = document.getElementById('idm-batch-modal-overlay');
    if (oldModal) oldModal.remove();

    const t = getT();
    const isRtl = cachedSettings.language !== 'en';

    const overlay = document.createElement('div');
    overlay.id = 'idm-batch-modal-overlay';
    overlay.style.direction = isRtl ? 'rtl' : 'ltr';

    let itemsHtml = '';
    items.forEach((item, index) => {
      itemsHtml += `
        <div class="idm-batch-item" data-index="${index}">
          <input type="checkbox" id="idm-check-${index}" class="idm-item-checkbox" checked data-url="${encodeURIComponent(item.url)}" />
          <label for="idm-check-${index}" class="idm-item-content">
            <span class="idm-item-title">${item.title}</span>
            <span class="idm-item-url" title="${item.url}">${item.url}</span>
          </label>
        </div>
      `;
    });

    overlay.innerHTML = `
      <div class="idm-batch-modal">
        <div class="idm-modal-header">
          <div class="idm-modal-title-wrap">
            <span class="idm-modal-title-icon">📥</span>
            <div>
              <div class="idm-modal-title">${t.modal_title}</div>
              <div class="idm-modal-subtitle">${t.modal_subtitle(items.length)}</div>
            </div>
          </div>
          <button class="idm-modal-close-btn" id="idm-modal-close" title="${t.modal_cancel}">✕</button>
        </div>

        <div class="idm-modal-toolbar">
          <label class="idm-checkbox-label">
            <input type="checkbox" id="idm-select-all" checked />
            <span>${t.modal_select_all}</span>
          </label>
          <span class="idm-modal-count-badge" id="idm-selected-badge">${t.modal_count(items.length, items.length)}</span>
        </div>

        <div class="idm-modal-body">
          ${itemsHtml}
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
            <button class="idm-btn idm-btn-primary" id="idm-btn-send-queue">
              <span>🚀 ${t.modal_btn_queue}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Modal Interaction Logic
    const selectAllCheck = overlay.querySelector('#idm-select-all');
    const itemCheckboxes = overlay.querySelectorAll('.idm-item-checkbox');
    const countBadge = overlay.querySelector('#idm-selected-badge');
    const sendBtn = overlay.querySelector('#idm-btn-send-queue');
    const copyModalBtn = overlay.querySelector('#idm-btn-copy-links');
    const txtModalBtn = overlay.querySelector('#idm-btn-export-txt');
    const closeBtn = overlay.querySelector('#idm-modal-close');
    const cancelBtn = overlay.querySelector('#idm-btn-cancel');

    const getCheckedUrls = () => {
      const selectedUrls = [];
      itemCheckboxes.forEach((cb) => {
        if (cb.checked) {
          selectedUrls.push(decodeURIComponent(cb.getAttribute('data-url')));
        }
      });
      return selectedUrls;
    };

    const updateCount = () => {
      const checkedCount = Array.from(itemCheckboxes).filter((c) => c.checked).length;
      countBadge.textContent = t.modal_count(checkedCount, itemCheckboxes.length);
      sendBtn.disabled = checkedCount === 0;
      copyModalBtn.disabled = checkedCount === 0;
      txtModalBtn.disabled = checkedCount === 0;
      selectAllCheck.checked = checkedCount === itemCheckboxes.length;
      selectAllCheck.indeterminate = checkedCount > 0 && checkedCount < itemCheckboxes.length;
    };

    selectAllCheck.addEventListener('change', () => {
      itemCheckboxes.forEach((cb) => {
        cb.checked = selectAllCheck.checked;
      });
      updateCount();
    });

    itemCheckboxes.forEach((cb) => {
      cb.addEventListener('change', updateCount);
    });

    const closeModal = () => {
      overlay.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
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
    sendBtn.addEventListener('click', () => {
      const selectedUrls = getCheckedUrls();

      if (selectedUrls.length === 0) return;

      sendBtn.disabled = true;
      sendBtn.innerHTML = `<span>⏳ ${t.modal_btn_sending}</span>`;

      chrome.runtime.sendMessage(
        {
          action: 'batchDownloadWithIDM',
          urls: selectedUrls
        },
        (res) => {
          closeModal();
          if (chrome.runtime.lastError) {
            showToast(t.toast_bridge_error, 'error');
            return;
          }

          if (res && res.success) {
            showToast(t.toast_batch_success(selectedUrls.length), 'success');
          } else {
            showToast(res?.error || t.toast_batch_error, 'error');
          }
        }
      );
    });
  };

  // Monitor mouseup / keyup / selection changes to display float button
  let selectionTimeout = null;

  const handleSelection = () => {
    if (!cachedSettings.enabled) {
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

})();
