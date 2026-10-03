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
    setting_toast_sub: 'اطلاع‌رسانی هنگام انتقال لینک به IDM',
    setting_bypass_title: 'کلید میانبر دور زدن (Bypass)',
    setting_bypass_sub: 'هنگام نگه داشتن این کلید، دانلود با مرورگر انجام می‌شود',
    bypass_alt: 'کلید Alt (پیش‌فرض)',
    bypass_shift: 'کلید Shift',
    bypass_ctrl: 'کلید Ctrl',
    bypass_none: 'غیرفعال',
    exts_covered: 'پسوندهای تحت پوشش',
    ext_input_placeholder: 'پسوند جدید (مثلاً: MKV)',
    btn_add: 'افزودن',
    btn_reset_exts: 'بازنشانی به پیش‌فرض',
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
    quick_download_title: 'Quick Download Link',
    quick_input_placeholder: 'Enter download URL here...',
    btn_download: 'Download',
    quick_msg_empty: 'Please enter a URL first.',
    quick_msg_invalid: 'URL must start with http:// or https://',
    quick_msg_sending: 'Sending to IDM...',
    quick_msg_success: '🚀 Link successfully sent to IDM dialog!',
    quick_msg_error: 'Failed to send to IDM.',
    quick_msg_bridge_error: 'Error connecting to IDM native bridge.',
    settings_title: 'Interception Settings',
    setting_enabled_title: 'Extension Enabled',
    setting_enabled_sub: 'Toggle master extension functionality',
    setting_intercept_links_title: 'Catch Download Links',
    setting_intercept_links_sub: 'Auto send file & media downloads to IDM',
    setting_intercept_browser_title: 'Catch Browser Downloads',
    setting_intercept_browser_sub: 'Cancel default browser download and send to IDM',
    setting_toast_title: 'In-Page Toast Notification',
    setting_toast_sub: 'Show status alert when sending links to IDM',
    setting_bypass_title: 'Bypass Hotkey',
    setting_bypass_sub: 'Hold this key while clicking to download via browser',
    bypass_alt: 'Alt key (Default)',
    bypass_shift: 'Shift key',
    bypass_ctrl: 'Ctrl key',
    bypass_none: 'Disabled',
    exts_covered: 'Monitored File Types',
    ext_input_placeholder: 'New extension (e.g. MKV)',
    btn_add: 'Add',
    btn_reset_exts: 'Reset to Default',
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

  const quickUrlInput = document.getElementById('quickUrlInput');
  const btnQuickDownload = document.getElementById('btnQuickDownload');
  const quickDownloadMsg = document.getElementById('quickDownloadMsg');

  const toggleEnabled = document.getElementById('toggleEnabled');
  const toggleInterceptLinks = document.getElementById('toggleInterceptLinks');
  const toggleInterceptBrowser = document.getElementById('toggleInterceptBrowser');
  const toggleShowToast = document.getElementById('toggleShowToast');
  const selectBypassKey = document.getElementById('selectBypassKey');

  const extCount = document.getElementById('extCount');
  const extTagsContainer = document.getElementById('extTagsContainer');
  const newExtInput = document.getElementById('newExtInput');
  const btnAddExt = document.getElementById('btnAddExt');
  const btnResetExts = document.getElementById('btnResetExts');

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

  // Load settings from storage
  const loadSettings = async () => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (settings) => {
        currentSettings = settings || {};
        toggleEnabled.checked = currentSettings.enabled !== false;
        toggleInterceptLinks.checked = currentSettings.interceptLinks !== false;
        toggleInterceptBrowser.checked = currentSettings.interceptBrowserDownloads !== false;
        toggleShowToast.checked = currentSettings.showToast !== false;
        selectBypassKey.value = currentSettings.bypassKey || 'Alt';

        // Apply saved language preference
        currentLang = currentSettings.language || 'fa';
        applyLanguage(currentLang);

        if (!currentSettings.extensions || !Array.isArray(currentSettings.extensions)) {
          currentSettings.extensions = [...DEFAULT_EXTENSIONS];
        }

        renderTags();
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

  toggleShowToast.addEventListener('change', async () => {
    currentSettings.showToast = toggleShowToast.checked;
    await saveSettings();
  });

  selectBypassKey.addEventListener('change', async () => {
    currentSettings.bypassKey = selectBypassKey.value;
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

  // Refresh connection
  btnRefresh.addEventListener('click', checkConnection);

  // Quick download
  btnQuickDownload.addEventListener('click', async () => {
    const dict = I18N[currentLang] || I18N.fa;
    const url = quickUrlInput.value.trim();
    if (!url) {
      quickDownloadMsg.className = 'form-msg error';
      quickDownloadMsg.textContent = dict.quick_msg_empty;
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      quickDownloadMsg.className = 'form-msg error';
      quickDownloadMsg.textContent = dict.quick_msg_invalid;
      return;
    }

    quickDownloadMsg.className = 'form-msg';
    quickDownloadMsg.textContent = dict.quick_msg_sending;

    chrome.runtime.sendMessage({ action: 'downloadWithIDM', url }, (res) => {
      if (chrome.runtime.lastError) {
        quickDownloadMsg.className = 'form-msg error';
        quickDownloadMsg.textContent = dict.quick_msg_bridge_error;
        return;
      }

      if (res && res.success) {
        quickDownloadMsg.className = 'form-msg success';
        quickDownloadMsg.textContent = dict.quick_msg_success;
        quickUrlInput.value = '';
      } else {
        quickDownloadMsg.className = 'form-msg error';
        quickDownloadMsg.textContent = res?.error || dict.quick_msg_error;
      }
    });
  });

  // Initial load
  await loadSettings();
  await checkConnection();
});
