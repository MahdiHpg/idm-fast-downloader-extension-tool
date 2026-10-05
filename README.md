# 🚀 IDM Fast Downloader (دانلود سریع با اینترنت دانلود منیجر)

<p align="center">
  <img src="extension/icons/icon-128.png" alt="IDM Fast Downloader Logo" width="100" height="100" style="border-radius: 20px;">
</p>

<p align="center">
  <b>پل ارتباطی مدرن، هوشمند و فوق‌العاده سریع بین تمام مرورگرها و نرم‌افزار محبوب Internet Download Manager (IDM)</b><br>
  <i>A blazing-fast, intelligent native bridge and browser extension connecting all web browsers directly to Internet Download Manager (IDM).</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.8.9-emerald?style=flat-square" alt="Version 1.8.9">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square" alt="Platform Windows">
  <img src="https://img.shields.io/badge/Languages-Persian%20%7C%20English-purple?style=flat-square" alt="Bilingual">
  <img src="https://img.shields.io/badge/AI%20Pair-Gemini%203.8%20Flash%20Medium-orange?style=flat-square" alt="Gemini 3.8 Flash Medium">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License MIT">
</p>

---

## 📌 فهرست مطالب | Table of Contents
- [فارسی (Persian)](#-فارسی-persian)
  - [داستان ساخت این افزونه](#-داستان-ساخت-این-افزونه)
  - [ویژگی‌های کلیدی](#-ویژگی‌های-کلیدی-نسخه-۱۸۹)
  - [ساختار فایل‌های پروژه](#-ساختار-فایل‌های-پروژه)
  - [راهنمای نصب سریع و آسان](#-راهنمای-نصب-سریع-و-آسان)
  - [نحوه استفاده از امکانات](#-نحوه-استفاده-از-امکانات)
- [English](#-english)
  - [About This Project](#-about-this-project)
  - [Key Features](#-key-features-v189)
  - [Quick Installation](#-quick-installation)
  - [How to Use](#-how-to-use)
- [توسعه‌دهنده و سازنده | Author](#-توسعه‌دهنده-و-سازنده--author)
- [لایسنس | License](#-لایسنس--license)

---

<div dir="rtl">

# 🇮🇷 فارسی (Persian)

سلام رفقا! 👋

اگر شما هم اهل دانلود فایل و بازی‌های چند پارته با اینترنت دانلود منیجر باشید، حتماً می‌دونید چقدر این قضیه کلافه‌کننده‌ست:
با هر بار آپدیت شدن خود نرم‌افزار IDM، افزونه رسمی مرورگرش اغلب دچار مشکل می‌شد یا از کار می‌افتاد؛ آپدیت‌های اکستنشن رسمی هم در استور مرورگرها خیلی دیر به دیر منتشر می‌شدند. روی مرورگرهایی مثل Brave یا نسخه‌های جدید کرومیوم هم که داستان‌های خودش رو داشت! از طرفی موقع دانلود پارت‌های مختلف، باید تک‌تک لینک‌ها رو دستی کپی می‌کردیم یا با باز شدن تب‌های تکراری سر و کله می‌زدیم.

همین موضوع باعث شد دست به کار بشم و ساعت‌ها وقت بذارم، سناریوهای مختلف رو با دقت تست کنم تا یک افزونه اختصاصی، مدرن و کاملاً مستقل خلق کنم؛ ابزاری که بدون وابستگی به باگ‌های افزونه رسمی، با یک کلیک لینک‌ها رو به IDM می‌فرسته و حتی قابلیت شناسایی هوشمند سلکت چند پارت، کپی یکجا، خروجی `.txt` و استخراج دسته‌ای سریال‌ها رو هم داره.

> 💡 **همراهی هوش مصنوعی:** در طول مسیر توسعه و ساخت این افزونه، با همکاری و هدایت مستقیم هوش مصنوعی **Gemini 3.8 Flash Medium**، کدهای بک‌اند C# و رابط کاربری فرانت بهینه‌سازی، ریفکتور و نهایی‌سازی شدند تا یک پروژه تمیز، بدون باگ و آماده انتشار به دست شما برسه.

---

### ✨ ویژگی‌های کلیدی (نسخه ۱.۸.۹)

- **⚡ رهگیری فوری کلیک (Click Interception):** با کلیک چپ روی هر فایل، مرورگر بدون معطلی دیالوگ تایید و ذخیره رسمی IDM رو باز می‌کنه.
- **⚡ دانلود مستقیم استریم‌های HLS چندقطعه‌ای به پوشه دلخواه:** پشتیبانی هوشمند از پرتال‌های استریم آنلاین با استریم‌های HLS (.m3u8). قابلیت انتخاب پوشه مقصد در ویندوز (Folder Picker)، دانلود چندنخی سگمنت‌ها توسط پل بومی و ادغام خودکار در یک فایل کامل در پوشه انتخابی کاربر همراه با نمایش زنده درصد پیشرفت و نام فایل.
- **🎬 استخراج هوشمند فیلم‌ها و سریال‌ها (Movie & Series Batch Extractor):** در تمامی سایت‌های مرجع دانلود فیلم و سریال و پلتفرم‌های استریم (چه فیلم‌های سینمایی تک‌قسمتی و چه سریال‌های چندفصله)، دکمه شناور هوشمند IDM ظاهر می‌شود تا بدون نیاز به جستجوی دستی بین لینک‌های شلوغ، با یک کلیک:
  - شناسایی هوشمند فیلم‌های سینمایی تک‌قسمتی، نمایش تمام کیفیت‌ها (4K, 1080p, 720p, 480p) و حذف دراپ‌داون غیرضروری فصل برای خلوت ماندن رابط کاربری.
  - تمام فصل‌ها، قسمت‌ها و کیفیت‌ها رو یکجا استخراج و دسته‌بندی می‌کنه.
  - فیلتر صوتی تفکیک نسخه‌های دوبله فارسی (`🎙️`) و زبان اصلی (`🔊`) در کنار تفکیک زیرنویس‌های فارسی، انگلیسی و سایر زبان‌ها.
  - هماهنگ‌سازی خودکار نام زیرنویس‌ها (`.srt`) با نام دقیق فایل ویدیو/فیلم جهت پخش و لود خودکار بدون نیاز به Rename دستی.
  - نام فایل‌ها رو با سوییچ رسمی `/f` مستقیماً با نام شفاف در صف دانلود IDM تنظیم می‌کنه تا اسم‌ها به صورت هش یا بدون پسوند ذخیره نشوند.
- **📁 انتخاب پوشه ذخیره‌سازی استریم‌ها (Custom Folder Picker):** امکان تعیین پوشه دلخواه در سیستم ویندوز هم از طریق مدال استخراج و هم از پنل پاپ‌آپ افزونه (ذخیره همیشگی در تنظیمات).
- **📺 نوار شناور روی پلیرهای ویدیو و استریم (Floating Player Bar):** هنگام پخش یا هاور روی پلیرهای ویدیو در وب‌سایت‌های مختلف، نوار شیک دانلود ظاهر می‌شود تا ویدیو با نام صفحه و پسوند درست مستقیماً به IDM منتقل شود.
- **📊 پیش‌نمایش حجم فایل‌ها پیش از دانلود (File Size Preview):** استعلام سبک و هوشمند حجم هر کیفیت و محاسبه مجموع حجم فایل‌های انتخابی در مدال دانلود دسته‌ای.
- **⚡ کلید دانلود آنی و مستقیم (Fast Action Click):** فشردن کلید Ctrl هنگام کلیک روی لینک، بدون باز شدن پنجره‌های اضافی دانلود را مستقیماً به صف می‌رسد.
- **🖱️ پنجره پاپ‌آپ با قابلیت جابجایی آزادانه (Freely Draggable Modal):** پاپ‌آپ دانلود دسته‌ای به طور پیش‌فرض در گوشه بالای صفحه قرار می‌گیرد تا محتوای سایت را نپوشاند و در صورت نیاز می‌توانید آن را با ماوس آزادانه در کل فضای مرورگر جابجا کنید.
- **🚫 لیست استثنا و مسدودسازی سایت‌ها (Excluded Sites / Domain Blocklist):** کلید سریع تک‌کلیکی در پاپ‌آپ برای غیرفعال‌سازی IDM در سایت‌های خاص و دانلود توسط خود مرورگر.
- **📥 دانلود هوشمند دسته‌ای (Batch Floating Bar):** با ماوس چند خط یا جدول پارت‌های دانلود (مثلاً پارت ۱ تا ۱۰) رو هایلایت/سلکت کنید؛ یک نوار ابزار شیک و کاربردی ظاهر می‌شه (دانلود با IDM، کپی لینک‌ها، خروجی متنی `.txt`).
- **🌐 دوزبانه (فارسی / English):** قابلیت سوییچ آنی زبان رابط کاربری بین `FA` و `EN` با یک کلیک.
- **🛡️ رهگیری دانلودهای مرورگر (Browser Interception):** دانلودهایی که آدرس مستقیم ندارند یا از طریق اسکریپت‌های سرور شروع می‌شن رو هم شکار می‌کنه و به IDM تحویل می‌ده.
- **🖱️ منوی راست‌کلیک (Context Menu):** گزینه «دانلود با IDM» برای هر لینک، عکس، صوت یا ویدیوی صفحه.
- **🎨 پاپ‌آپ تاریک و چشم‌نواز:** رابط کاربری مدرن با تم تاریک، بررسی زنده وضعیت اتصال پل بومی و مدیریت لیست پسوندها و سایت‌های استثنا.

---

### 📂 ساختار فایل‌های پروژه

```text
idm-fast-downloader/
├── extension/                       # سورس افزونه مرورگر (Manifest V3)
│   ├── icons/                       # آیکون‌ها در ابعاد 16, 32, 48, 128
│   ├── popup/                       # رابط کاربری پاپ‌آپ (HTML, CSS, JS)
│   ├── background.js                # سرویس ورکر پس‌زمینه و رهگیری هوشمند
│   ├── content.js                   # اسکریپت رهگیری کلیک‌ها و پنل شناور سلکت
│   ├── content.css                  # استایل نوتیفیکیشن‌ها و مدال دانلود دسته‌ای
│   └── manifest.json                # مانیفست اکستنشن (نسخه 1.8.9)
├── native-host/                     # پل ارتباطی بومی ویندوز
│   ├── IdmBridge.cs                 # سورس C# پل ارتباطی بر بستر استاندارد Stdio
│   ├── com.idm.nativehost.chrome.json
│   └── com.idm.nativehost.firefox.json
├── install.bat                      # اسکریپت نصب و کامپایل خودکار با یک کلیک
├── install.ps1                      # اسکریپت پاورشل کامپایل و رجیستری
├── uninstall.bat                    # اسکریپت حذف تمیز پل ارتباطی از رجیستری
├── uninstall.ps1                    # اسکریپت پاورشل حذف رجیستری
├── .gitignore                       # فایل ایگنور فایل‌های بیلد و سیستم‌عامل
└── README.md                        # همین راهنمای کامل
```

---

### 🛠️ راهنمای نصب سریع و آسان

نصب این افزونه در ۲ مرحله ساده و کمتر از ۱ دقیقه انجام می‌شه:

#### مرحله ۱: ثبت پل ارتباطی در ویندوز (تنها یک کلیک)
چون مرورگرها به دلایل امنیتی اجازه اجرای مستقیم فایل‌های `.exe` رو ندارند، باید پل ارتباطی Native Messaging ثبت بشه:
1. فایل زیپ سورس رو دانلود کنید یا با گیت کلون بگیرید.
2. روی فایل **`install.bat`** راست‌کلیک کرده و آن را اجرا کنید.
3. این اسکریپت پل C# رو با کامپایلر استاندارد و پیش‌فرض خود ویندوز (`csc.exe`) کامپایل می‌کنه و کلیدهای ریجستری رو در چند ثانیه ثبت می‌کنه.

#### مرحله ۲: بارگذاری افزونه در مرورگر
- **در مرورگرهای کرومیوم (Chrome, Edge, Brave, Opera):**
  1. در آدرس‌بار عبارت `chrome://extensions` (یا `edge://extensions` یا `brave://extensions`) رو تایپ کنید و Enter بزنید.
  2. در بالای صفحه گزینه **Developer mode** (حالت توسعه‌دهنده) رو روشن کنید.
  3. روی دکمه **Load unpacked** کلیک کنید.
  4. پوشه **`extension`** داخل همین پروژه رو انتخاب کنید.
  5. تبریک! افزونه نصب شد و آیکون اون بالای مرورگر ظاهر می‌شه. 🎉

- **در موزیلا فایرفاکس (Firefox):**
  1. وارد آدرس `about:debugging#/runtime/this-firefox` بشید.
  2. روی دکمه **Load Temporary Add-on...** کلیک کنید.
  3. فایل `manifest.json` درون پوشه **`extension-firefox`** (یا فایل فشرده `idm-fast-downloader-firefox.zip`) رو انتخاب کنید.
  > 💡 **نکته:** اگر می‌خواهید مستقیماً پوشه اصلی `extension` را لود کنید، کافیست در صفحه تنظیمات پیشرفته فایرفاکس (`about:config`) عبارت `extensions.backgroundServiceWorker.enabled` را جستجو کرده و روی `true` قرار دهید.

---

### 🎮 نحوه استفاده از امکانات

1. **دانلود تکی:** کافیه روی هر دکمه یا لینک دانلود کلیک کنید تا IDM مستقیماً روی صفحه شما باز بشه.
2. **دانلود دسته‌ای با انتخاب:** متن یا دکمه‌های چند پارت دانلود رو با ماوس بگیرید؛ نوار ابزار شناور باز می‌شه:
   - با کلیک روی **📥 دانلود با IDM** پنجره زیباش باز می‌شه، تیک‌های پارت‌های مدنظرتون رو چک می‌کنید و دکمه «افزودن به صف دانلود» رو می‌زنید.
   - با کلیک روی **📋 کپی لینک‌ها** همه لینک‌ها یکجا کپی می‌شن.
   - با کلیک روی **📄 خروجی متنی** فایل متنی آماده تحویل داده می‌شه.
3. **تغییر زبان:** وارد پاپ‌آپ افزونه بشید و از گوشه بالا سمت چپ بین **FA** و **EN** جابجا شید.

</div>

---

<div dir="ltr">

# 🇬🇧 English

Hi everyone! 👋

Anyone who relies on Internet Download Manager (IDM) knows the frustration:
Whenever the main IDM desktop app updates, its official browser integration often breaks or behaves erratically. Official store extensions take weeks or months to get updated, and working with modern Chromium browsers like Brave or Edge frequently turns into a headache. On top of that, trying to download multi-part game archives or series usually forces you into endless tab juggling and manual URL copying.

Tired of waiting for official fixes, I dedicated substantial time and careful testing to build this standalone solution from scratch: a clean, robust, and lightning-fast extension built with **C# Native Messaging** and **Manifest V3** that communicates directly with IDM without depending on broken official add-ons.

> 💡 **AI Pair Programming:** Throughout the entire process, I collaborated directly with **Gemini 3.8 Flash Medium** to brainstorm, develop, debug, and thoroughly test both the C# backend bridge and the frontend UI, delivering clean code and a smooth user experience.

---

### ✨ Key Features (v1.8.9)

- **⚡ Instant Download Hand-off:** Left-click on any supported file link to bypass the browser's slow downloader and trigger IDM's native save dialog immediately.
- **⚡ Direct HLS Stream Downloader & Custom Folder Picker:** Full support for multi-segment HLS streams (.m3u8) on streaming portals. Pick any destination folder on your PC with a native Windows folder dialog, download segments in parallel with multi-threading, and automatically merge them into a single high-quality video file directly in your target folder.
- **📁 Persistent Folder Setting:** Configure your preferred stream download directory from both the batch extractor modal and the extension popup settings.
- **🎬 Smart Movie & Serial Batch Extractor (VOD & Media Portals):** Automated detection on movie and TV show download sites. Whether it is a single movie with multiple qualities or a multi-season series:
  - Automatically identifies single movies, lists all available qualities (4K, 1080p, 720p, 480p), and cleanly omits the season filter.
  - Extracts all seasons, episodes, and qualities with one click.
  - Separate audio filter for Dubbed vs. Original releases alongside selective subtitle filters (Persian, English, etc.).
  - Auto-synchronizes subtitle filenames (`.srt`) with movie/video filenames for effortless auto-loading in VLC, PotPlayer, KMPlayer, etc.
  - Sends custom filenames directly via IDM's `/f` command-line switch so all files land neatly named in IDM's queue.
- **📺 Floating Player Bar:** Sleek floating button appearing on playing web videos/streams for one-click download with clean filename and extension.
- **📊 File Size Preview:** Asynchronously fetches exact file sizes for qualities and displays the total batch download size.
- **⚡ Instant Action Hotkey:** Hold `Ctrl` while clicking any link to silently push it directly to the download queue.
- **🖱️ Freely Draggable Modal:** Batch download dialog defaults to the top corner to prevent obscuring underlying webpage content, and can be freely dragged anywhere across the viewport.
- **🚫 Domain Exclusion Blocklist:** One-click toggle in the popup to disable IDM on specific sites and let the browser download natively.
- **📥 Intelligent Batch Floating Toolbar:** Highlight/select any text or table rows containing download links (e.g. multi-part archives) to reveal a smart floating bar:
  - 📥 **Download with IDM:** Opens an interactive batch checklist dialog to send all selected items directly to IDM's queue.
  - 📋 **Copy Links:** Copies all extracted downloadable URLs straight to your clipboard.
  - 📄 **Export .TXT:** Generates and downloads a clean text file of the selected links.
- **🌐 Full Bilingual Support (FA / EN):** Seamless one-click language toggle between English and Persian across both the popup and in-page modal dialogs.
- **🛡️ Browser Interception:** Catches redirected/script-driven downloads that don't have static file extensions in their URL.
- **🖱️ Right-Click Context Menu:** Send any link, media file, audio, or video directly to IDM with a single right-click.
- **🎨 Sleek Dark-themed Popup:** Live connection status monitoring, custom file extension manager, and domain blacklist controls.

---

### 🛠️ Quick Installation

#### Step 1: Register Native Host (One Click)
Because browsers cannot launch Windows executables directly due to sandbox security policies, run the native messaging installer:
1. Clone or download this repository.
2. Double-click **`install.bat`**.
3. It will automatically compile `native-host/IdmBridge.cs` using Windows' built-in .NET compiler (`csc.exe`) and set up the required registry keys.

#### Step 2: Load Extension in Browser
- **For Chromium Browsers (Chrome, Edge, Brave, Opera):**
  1. Navigate to `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
  2. Toggle **Developer mode** on (top-right corner).
  3. Click **Load unpacked**.
  4. Select the **`extension`** folder from this repository.
- **For Mozilla Firefox:**
  1. Navigate to `about:debugging#/runtime/this-firefox`.
  2. Click **Load Temporary Add-on...**.
  3. Select the `manifest.json` file inside the **`extension-firefox`** folder (or select `idm-fast-downloader-firefox.zip`).
  > 💡 **Tip:** To load the main `extension` folder directly in Firefox, navigate to `about:config` and set `extensions.backgroundServiceWorker.enabled` to `true`.

</div>

---

<div dir="rtl">

## 👨‍💻 توسعه‌دهنده و سازنده | Author

**مهدی حیدرپور (Mahdi Heydarpour)**
- 🌐 وب‌سایت شخصی: [https://mahdi-hp.ir/](https://mahdi-hp.ir/)
- 🐙 گیت‌هاب: [https://github.com/MahdiHpg](https://github.com/MahdiHpg)
- 💼 لینکدین: [https://linkedin.com/in/mahdi-heydarpour](https://linkedin.com/in/mahdi-heydarpour)

اگر این پروژه براتون مفید بود، ممنون می‌شم به ریپازیتوری یک ⭐️ **Star** بدید! دم همتون گرم ❤️

---

## 📜 لایسنس | License

این پروژه تحت مجوز [MIT License](LICENSE) منتشر شده است. استفاده، ویرایش و توسعه مجدد آن برای همگان آزاد است.

</div>
