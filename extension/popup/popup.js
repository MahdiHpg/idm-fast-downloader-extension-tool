/**
 * IDM Fast Downloader - Popup Script
 */

const DEFAULT_EXTENSIONS = [
  'ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'BZ2', 'ISO', 'IMG', 'BIN', 'DMG', 'PKG',
  'EXE', 'MSI', 'APK', 'APPX', 'TORRENT',
  'MP4', 'MKV', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'M4V', '3GP',
  'MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A', 'WMA',
  'PDF', 'EPUB', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'
];

const I18N = {
  fa: {
    app_title: 'دانلود با IDM',
    author_made_with: 'ساخته شده با ❤️ - ',
    author_name: 'مهدی حیدرپور',
    status_checking: 'بررسی اتصال...',
    status_connected: 'متصل به IDM',
    status_disconnected: 'قطع ارتباط',
    status_error: 'خطا در بررسی',
    alert_checking_title: 'درحال بررسی وضعیت IDM',
    alert_checking_desc: 'لطفاً چند لحظه صبر کنید...',
    alert_connected_title: 'ارتباط با IDM فعال و آماده است',
    alert_disconnected_title: 'پل ارتباطی IDM متصل نیست!',
    alert_disconnected_desc: 'لطفاً فایل install.bat را اجرا کنید تا پل ثبت شود',
    refresh_btn_title: 'بررسی مجدد اتصال',
    quick_download_title: 'دانلود سریع لینک',
    quick_input_placeholder: 'لینک دانلود را اینجا وارد کنید...',
    btn_download: 'دانلود',
    quick_msg_empty: 'لطفاً ابتدا یک لینک وارد کنید.',
    quick_msg_invalid: 'لینک باید با http:// یا https:// شروع شود.',
    quick_msg_sending: 'درحال ارسال به IDM...',
    quick_msg_success: '🚀 لینک با موفقیت به IDM ارسال و پنجره دانلود باز شد!',
    quick_msg_error: 'خطا در ارسال به IDM.',
    quick_msg_bridge_error: 'خطا در ارتباط با پل IDM.',
    settings_title: 'تنظیمات رهگیری',
    setting_enabled_title: 'فعال بودن افزونه',
    setting_enabled_sub: 'روشن/خاموش کردن کلی عملکرد اکستنشن',
    setting_intercept_links_title: 'رهگیری کلیک روی لینک‌ها',
    setting_intercept_links_sub: 'ارسال خودکار لینک‌های دانلود فشرده و مدیا',
    setting_intercept_browser_title: 'رهگیری دانلودهای مرورگر',
    setting_intercept_browser_sub: 'لغو دانلود پیش‌فرض مرورگر و انتقال به IDM',
    setting_toast_title: 'نمایش پیام شناور در صفحه',
    setting_bypass_title: 'کلید میانبر دور زدن (Bypass)',
    setting_bypass_sub: 'هنگام نگه داشتن این کلید، دانلود با مرورگر انجام می‌شود',
    bypass_alt: 'کلید Alt (پیش‌فرض)',
    bypass_shift: 'کلید Shift',
    bypass_ctrl: 'کلید Ctrl',
    bypass_none: 'غیرفعال',
    setting_floating_video_title: 'نوار شناور روی پلیر ویدیو',
    setting_floating_video_sub: 'پیشنهاد دانلود هنگام پخش ویدیو و استریم‌ها',
    setting_preview_size_title: 'پیش‌نمایش حجم فایل‌ها',
    setting_preview_size_sub: 'استعلام و نمایش حجم در دانلود دسته‌ای',
    setting_instant_key_title: 'کلید دانلود آنی (Fast Click)',
    setting_instant_key_sub: 'کلیک روی لینک با این کلید، مستقیم دانلود را استارت می‌زند',
    instant_ctrl: 'کلید Ctrl (پیش‌فرض)',
    instant_alt: 'کلید Alt',
    instant_shift: 'کلید Shift',
    instant_none: 'غیرفعال',
    setting_queue_mode_title: 'حالت پیش‌فرض ارسال به IDM',
    setting_queue_mode_sub: 'نحوه دریافت لینک‌ها در IDM',
    queue_main: '📋 ارسال به صف اصلی (Main Queue)',
    queue_immediate: '🚀 شروع دانلود فوری (Start Immediately)',
    queue_scheduler: '🌙 صف زمان‌بندی / شبانه (Scheduler)',
    exts_covered: 'پسوندهای تحت پوشش',
    ext_input_placeholder: 'پسوند جدید (مثلاً: MKV)',
    btn_add: 'افزودن',
    btn_reset_exts: 'بازنشانی به پیش‌فرض',
    site_active: 'دانلود با IDM در این سایت فعال است',
    site_excluded: 'دانلود با IDM در این سایت غیرفعال است',
    btn_disable_site: '🚫 غیرفعال‌سازی در این سایت',
    btn_enable_site: '✅ فعال‌سازی در این سایت',
    excluded_sites_title: 'سایت‌های استثنا (غیرفعال)',
    excluded_sites_sub: 'دانلود با IDM در دامنه‌های زیر کاملاً غیرفعال خواهد بود و توسط خود مرورگر انجام می‌شود.',
    site_input_placeholder: 'دامنه جدید (مثلاً: youtube.com)',
    btn_add_site: 'افزودن',
    site_empty_list: 'هیچ سایتی در لیست استثناها ثبت نشده است.',
    footer_text: 'توسعه یافته برای هماهنگی کامل مرورگرها با IDM'
  },
  en: {
    app_title: 'IDM Downloader',
    author_made_with: 'Made with ❤️ by\u00A0',
    author_name: 'Mahdi Heydarpour',
    status_checking: 'Checking...',
    status_connected: 'Connected',
    status_disconnected: 'Disconnected',
    status_error: 'Check Error',
    alert_checking_title: 'Checking IDM status',
    alert_checking_desc: 'Please wait a moment...',
    alert_connected_title: 'Connected to IDM and ready',
    alert_disconnected_title: 'IDM Native Bridge not connected!',
    alert_disconnected_desc: 'Please run install.bat to register the native bridge',
    refresh_btn_title: 'Refresh connection status',
    settings_title: 'Interception Settings',
    setting_enabled_title: 'Extension Enabled',
    setting_enabled_sub: 'Toggle master extension functionality',
    setting_intercept_links_title: 'Catch Download Links',
    setting_intercept_links_sub: 'Auto send file & media downloads to IDM',
    setting_intercept_browser_title: 'Catch Browser Downloads',
    setting_intercept_browser_sub: 'Cancel default browser download and send to IDM',
    setting_floating_video_title: 'Floating Player Bar',
    setting_floating_video_sub: 'Show download prompt when playing streams & videos',
    setting_preview_size_title: 'File Size Preview',
    setting_preview_size_sub: 'Fetch & show file sizes in batch modal',
    setting_toast_title: 'In-Page Toast Notification',
    setting_toast_sub: 'Show status alert when sending links to IDM',
    setting_bypass_title: 'Bypass Hotkey',
    setting_bypass_sub: 'Hold this key while clicking to download via browser',
    bypass_alt: 'Alt key (Default)',
    bypass_shift: 'Shift key',
    bypass_ctrl: 'Ctrl key',
    bypass_none: 'Disabled',
    setting_instant_key_title: 'Instant Download Hotkey',
    setting_instant_key_sub: 'Hold this key while clicking a link to start download instantly',
    instant_ctrl: 'Ctrl key (Default)',
    instant_alt: 'Alt key',
    instant_shift: 'Shift key',
    instant_none: 'Disabled',
    setting_queue_mode_title: 'Default IDM Send Mode',
    setting_queue_mode_sub: 'How downloads are queued in IDM',
    queue_main: '📋 Main Download Queue',
    queue_immediate: '🚀 Start Immediately',
    queue_scheduler: '🌙 Scheduler / Night Queue',
    exts_covered: 'Monitored File Types',
    ext_input_placeholder: 'New extension (e.g. MKV)',
    btn_add: 'Add',
    btn_reset_exts: 'Reset to Default',
    site_active: 'IDM download is active on this site',
    site_excluded: 'IDM download is disabled on this site',
    btn_disable_site: '🚫 Disable on this site',
    btn_enable_site: '✅ Enable on this site',
    excluded_sites_title: 'Excluded Sites (Blocklist)',
    excluded_sites_sub: 'IDM downloads are completely disabled on these domains and handled natively by browser.',
    site_input_placeholder: 'New domain (e.g. youtube.com)',
    btn_add_site: 'Add',
    site_empty_list: 'No excluded sites added yet.',
    footer_text: 'Engineered for seamless browser integration with IDM'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const connectionBadge = document.getElementById('connectionBadge');
  const statusText = document.getElementById('statusText');
  const idmInfoBox = document.getElementById('idmInfoBox');
  const alertTitle = document.getElementById('alertTitle');
  const alertDesc = document.getElementById('alertDesc');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnLangFa = document.getElementById('btnLangFa');
  const btnLangEn = document.getElementById('btnLangEn');

  const toggleEnabled = document.getElementById('toggleEnabled');
  const toggleInterceptLinks = document.getElementById('toggleInterceptLinks');
  const toggleInterceptBrowser = document.getElementById('toggleInterceptBrowser');
  const toggleFloatingVideoBar = document.getElementById('toggleFloatingVideoBar');
  const togglePreviewFileSize = document.getElementById('togglePreviewFileSize');
  const toggleShowToast = document.getElementById('toggleShowToast');
  const selectBypassKey = document.getElementById('selectBypassKey');
  const selectInstantKey = document.getElementById('selectInstantKey');
  const selectQueueMode = document.getElementById('selectQueueMode');

  const extCount = document.getElementById('extCount');
  const extTagsContainer = document.getElementById('extTagsContainer');
  const newExtInput = document.getElementById('newExtInput');
  const btnAddExt = document.getElementById('btnAddExt');
  const btnResetExts = document.getElementById('btnResetExts');

  const currentSiteCard = document.getElementById('currentSiteCard');
  const currentSiteDomain = document.getElementById('currentSiteDomain');
  const currentSiteBadge = document.getElementById('currentSiteBadge');
  const btnToggleCurrentSite = document.getElementById('btnToggleCurrentSite');
  const btnToggleCurrentSiteText = document.getElementById('btnToggleCurrentSiteText');

  const excludedSitesCount = document.getElementById('excludedSitesCount');
  const excludedSitesContainer = document.getElementById('excludedSitesContainer');
  const newSiteInput = document.getElementById('newSiteInput');
  const btnAddSite = document.getElementById('btnAddSite');

  let currentSettings = {};
  let currentLang = 'fa';

  // Apply Language to UI
  const applyLanguage = (lang = 'fa') => {
    currentLang = lang === 'en' ? 'en' : 'fa';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';

    if (btnLangFa && btnLangEn) {
      btnLangFa.classList.toggle('active', currentLang === 'fa');
      btnLangEn.classList.toggle('active', currentLang === 'en');
    }

    const dict = I18N[currentLang] || I18N.fa;

    // Translate all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach((elem) => {
      const key = elem.getAttribute('data-i18n');
      if (dict[key]) {
        elem.textContent = dict[key];
      }
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach((elem) => {
      const key = elem.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        elem.setAttribute('placeholder', dict[key]);
      }
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach((elem) => {
      const key = elem.getAttribute('data-i18n-title');
      if (dict[key]) {
        elem.setAttribute('title', dict[key]);
      }
    });

    renderCurrentSiteStatus();
    renderExcludedSitesTags();
  };

  // Display version dynamically from manifest
  try {
    const manifest = chrome.runtime.getManifest();
    const badgeVersion = document.querySelector('.badge-version');
    if (badgeVersion && manifest && manifest.version) {
      badgeVersion.textContent = `v${manifest.version}`;
    }
  } catch {}

  // Check connection to IDM
  const checkConnection = async () => {
    const dict = I18N[currentLang] || I18N.fa;
    connectionBadge.className = 'header-status';
    statusText.textContent = dict.status_checking;
    idmInfoBox.className = 'alert-box';
    alertTitle.textContent = dict.alert_checking_title;
    alertDesc.textContent = dict.alert_checking_desc;

    try {
      chrome.runtime.sendMessage({ action: 'pingIDM' }, (res) => {
        if (chrome.runtime.lastError || !res || !res.connected) {
          connectionBadge.className = 'header-status disconnected';
          statusText.textContent = dict.status_disconnected;
          idmInfoBox.className = 'alert-box disconnected';
          alertTitle.textContent = dict.alert_disconnected_title;
          alertDesc.textContent = res?.error || dict.alert_disconnected_desc;
        } else {
          connectionBadge.className = 'header-status connected';
          statusText.textContent = dict.status_connected;
          idmInfoBox.className = 'alert-box connected';
          alertTitle.textContent = dict.alert_connected_title;
          alertDesc.textContent = res.idmPath || 'IDMan.exe';
        }
      });
    } catch (err) {
      connectionBadge.className = 'header-status disconnected';
      statusText.textContent = dict.status_error;
      idmInfoBox.className = 'alert-box disconnected';
      alertTitle.textContent = dict.status_error;
      alertDesc.textContent = err.message;
    }
  };

  // Render extension tags
  const renderTags = () => {
    const list = currentSettings.extensions || DEFAULT_EXTENSIONS;
    extCount.textContent = list.length;
    extTagsContainer.innerHTML = '';

    list.forEach((ext) => {
      const tag = document.createElement('span');
      tag.className = 'ext-tag';
      tag.textContent = ext;

      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn-remove-tag';
      btnRemove.innerHTML = '&times;';
      btnRemove.title = `حذف ${ext}`;
      btnRemove.addEventListener('click', async () => {
        currentSettings.extensions = currentSettings.extensions.filter((e) => e !== ext);
        await saveSettings();
        renderTags();
      });

      tag.appendChild(btnRemove);
      extTagsContainer.appendChild(tag);
    });
  };

  // Helper to check if a domain is excluded
  const isSiteExcluded = (host, list) => {
    if (!host || !Array.isArray(list) || list.length === 0) return false;
    const cleanHost = host.toLowerCase().trim().replace(/^www\./, '');
    return list.some((site) => {
      const clean = site.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
      if (!clean) return false;
      return cleanHost === clean || cleanHost.endsWith('.' + clean);
    });
  };

  let activeTabHostname = '';

  const initActiveTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && /^https?:\/\//i.test(tab.url)) {
        activeTabHostname = new URL(tab.url).hostname.toLowerCase().replace(/^www\./, '');
      }
    } catch {}
    renderCurrentSiteStatus();
  };

  const renderCurrentSiteStatus = () => {
    if (!currentSiteCard) return;
    if (!activeTabHostname) {
      currentSiteCard.style.display = 'none';
      return;
    }

    currentSiteCard.style.display = 'block';
    currentSiteDomain.textContent = activeTabHostname;

    const excluded = isSiteExcluded(activeTabHostname, currentSettings.excludedSites || []);
    const dict = I18N[currentLang] || I18N.fa;

    if (excluded) {
      currentSiteBadge.textContent = dict.site_excluded;
      currentSiteBadge.className = 'site-status-badge excluded';
      btnToggleCurrentSiteText.textContent = dict.btn_enable_site;
      btnToggleCurrentSite.className = 'btn-site-toggle active-excluded';
    } else {
      currentSiteBadge.textContent = dict.site_active;
      currentSiteBadge.className = 'site-status-badge';
      btnToggleCurrentSiteText.textContent = dict.btn_disable_site;
      btnToggleCurrentSite.className = 'btn-site-toggle';
    }
  };

  // Render excluded sites tags
  const renderExcludedSitesTags = () => {
    if (!excludedSitesContainer || !excludedSitesCount) return;

    if (!Array.isArray(currentSettings.excludedSites)) {
      currentSettings.excludedSites = [];
    }

    const list = currentSettings.excludedSites;
    excludedSitesCount.textContent = list.length;
    excludedSitesContainer.innerHTML = '';

    if (list.length === 0) {
      const dict = I18N[currentLang] || I18N.fa;
      const emptyNote = document.createElement('span');
      emptyNote.style.cssText = 'color: #64748b; font-size: 11px; padding: 4px;';
      emptyNote.textContent = dict.site_empty_list;
      excludedSitesContainer.appendChild(emptyNote);
      return;
    }

    list.forEach((site) => {
      const tag = document.createElement('span');
      tag.className = 'ext-tag';
      tag.textContent = site;

      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn-remove-tag';
      btnRemove.innerHTML = '&times;';
      btnRemove.title = `حذف ${site}`;
      btnRemove.addEventListener('click', async () => {
        currentSettings.excludedSites = currentSettings.excludedSites.filter((s) => s !== site);
        await saveSettings();
        renderExcludedSitesTags();
        renderCurrentSiteStatus();
      });

      tag.appendChild(btnRemove);
      excludedSitesContainer.appendChild(tag);
    });
  };

  const addExcludedSite = async () => {
    if (!newSiteInput) return;
    const rawVal = newSiteInput.value.trim().toLowerCase();
    const clean = rawVal.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').trim();
    if (!clean) return;

    if (!Array.isArray(currentSettings.excludedSites)) {
      currentSettings.excludedSites = [];
    }

    if (!currentSettings.excludedSites.includes(clean)) {
      currentSettings.excludedSites.push(clean);
      await saveSettings();
      newSiteInput.value = '';
      renderExcludedSitesTags();
      renderCurrentSiteStatus();
    }
  };

  // Load settings from storage
  const loadSettings = async () => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
        currentSettings = settings || {};
        toggleEnabled.checked = currentSettings.enabled !== false;
        toggleInterceptLinks.checked = currentSettings.interceptLinks !== false;
        toggleInterceptBrowser.checked = currentSettings.interceptBrowserDownloads !== false;
        toggleFloatingVideoBar.checked = currentSettings.floatingVideoBar !== false;
        togglePreviewFileSize.checked = currentSettings.previewFileSize !== false;
        toggleShowToast.checked = currentSettings.showToast !== false;
        selectBypassKey.value = currentSettings.bypassKey || 'Alt';
        selectInstantKey.value = currentSettings.instantKey || 'Ctrl';
        selectQueueMode.value = currentSettings.defaultQueue || 'queue';

        // Apply saved language preference
        currentLang = currentSettings.language || 'fa';
        applyLanguage(currentLang);

        if (!currentSettings.extensions || !Array.isArray(currentSettings.extensions)) {
          currentSettings.extensions = [...DEFAULT_EXTENSIONS];
        }

        if (!currentSettings.excludedSites || !Array.isArray(currentSettings.excludedSites)) {
          currentSettings.excludedSites = [];
        }

        renderTags();
        renderExcludedSitesTags();
        renderCurrentSiteStatus();
        resolve();
      });
    });
  };

  // Language switch listeners
  if (btnLangFa) {
    btnLangFa.addEventListener('click', async () => {
      currentLang = 'fa';
      currentSettings.language = 'fa';
      applyLanguage('fa');
      await saveSettings();
      await checkConnection();
    });
  }

  if (btnLangEn) {
    btnLangEn.addEventListener('click', async () => {
      currentLang = 'en';
      currentSettings.language = 'en';
      applyLanguage('en');
      await saveSettings();
      await checkConnection();
    });
  }

  // Save settings
  const saveSettings = async () => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'saveSettings', settings: currentSettings },
        (res) => resolve(res)
      );
    });
  };

  // Toggle Handlers
  toggleEnabled.addEventListener('change', async () => {
    currentSettings.enabled = toggleEnabled.checked;
    await saveSettings();
  });

  toggleInterceptLinks.addEventListener('change', async () => {
    currentSettings.interceptLinks = toggleInterceptLinks.checked;
    await saveSettings();
  });

  toggleInterceptBrowser.addEventListener('change', async () => {
    currentSettings.interceptBrowserDownloads = toggleInterceptBrowser.checked;
    await saveSettings();
  });

  toggleFloatingVideoBar.addEventListener('change', async () => {
    currentSettings.floatingVideoBar = toggleFloatingVideoBar.checked;
    await saveSettings();
  });

  togglePreviewFileSize.addEventListener('change', async () => {
    currentSettings.previewFileSize = togglePreviewFileSize.checked;
    await saveSettings();
  });

  toggleShowToast.addEventListener('change', async () => {
    currentSettings.showToast = toggleShowToast.checked;
    await saveSettings();
  });

  selectBypassKey.addEventListener('change', async () => {
    currentSettings.bypassKey = selectBypassKey.value;
    await saveSettings();
  });

  selectInstantKey.addEventListener('change', async () => {
    currentSettings.instantKey = selectInstantKey.value;
    await saveSettings();
  });

  selectQueueMode.addEventListener('change', async () => {
    currentSettings.defaultQueue = selectQueueMode.value;
    await saveSettings();
  });

  // Add extension tag
  const addExtension = async () => {
    const val = newExtInput.value.trim().toUpperCase().replace(/^\./, '');
    if (!val) return;

    if (!currentSettings.extensions.includes(val)) {
      currentSettings.extensions.push(val);
      await saveSettings();
      renderTags();
    }
    newExtInput.value = '';
  };

  btnAddExt.addEventListener('click', addExtension);
  newExtInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addExtension();
  });

  // Reset extensions
  btnResetExts.addEventListener('click', async () => {
    currentSettings.extensions = [...DEFAULT_EXTENSIONS];
    await saveSettings();
    renderTags();
  });

  // Current Site Toggle
  if (btnToggleCurrentSite) {
    btnToggleCurrentSite.addEventListener('click', async () => {
      if (!activeTabHostname) return;
      if (!Array.isArray(currentSettings.excludedSites)) {
        currentSettings.excludedSites = [];
      }

      const excluded = isSiteExcluded(activeTabHostname, currentSettings.excludedSites);
      if (excluded) {
        currentSettings.excludedSites = currentSettings.excludedSites.filter((site) => {
          const clean = site.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
          return !(activeTabHostname === clean || activeTabHostname.endsWith('.' + clean));
        });
      } else {
        if (!currentSettings.excludedSites.includes(activeTabHostname)) {
          currentSettings.excludedSites.push(activeTabHostname);
        }
      }

      await saveSettings();
      renderCurrentSiteStatus();
      renderExcludedSitesTags();
    });
  }

  // Add excluded site
  if (btnAddSite) {
    btnAddSite.addEventListener('click', addExcludedSite);
  }

  if (newSiteInput) {
    newSiteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addExcludedSite();
      }
    });
  }

  // Refresh connection
  btnRefresh.addEventListener('click', checkConnection);

  // Initial load
  await loadSettings();
  await initActiveTab();
  await checkConnection();
});
