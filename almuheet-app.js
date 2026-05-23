// ═══════════════════════════════════════════════
// نظام المحيط للاستشارات — النسخة المحسّنة
// الإصلاحات: تشفير كلمات المرور، XSS، إشعارات ديناميكية،
//            دوال مكتملة، صلاحيات تعديل العقود، modal بدل prompt
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
// Cloud-only mode: initialize in-memory state; data will be pulled from Supabase on startup
let contracts   = [];
let visits      = [];
let auditLogs   = [];
let passwords   = { admin:'', engineer:'', accountant:'' };
let invoices    = [];
let files       = [];
let drawingVersions = [];
let engineers   = [];
let officeSettings = {};
let currentUser        = null;
let currentRole        = 'admin';
let editingId          = null;
let pendingPayments    = [];
let pendingStages      = [];
let confirmCallback    = null;
let sessionTimer       = null;
let sessionDebounce    = null;
const SESSION_TIMEOUT_MS = 20 * 60 * 1000;

const ROLE_LABELS  = { admin:'مدير النظام', engineer:'مهندس', accountant:'محاسب' };
const ROLE_CLASSES = { admin:'role-admin', engineer:'role-eng', accountant:'role-acc' };
const ROLE_AVATARS = { admin:'م', engineer:'م', accountant:'ح' };
const STORAGE_KEYS = ['contracts','visits','auditLogs','passwords','invoices','files','drawingVersions','engineers','officeSettings'];

// صلاحيات مفصّلة: تعديل العقود يحتاج صلاحية contracts.edit
const ROLE_PERMISSIONS = {
  admin:      ['contracts.edit','contracts.delete','settings.passwords','settings.reset','audit.export','visits.add'],
  engineer:   ['contracts.edit','visits.add'],
  accountant: ['audit.export']
};

const DEFAULT_ROLE_PERMISSIONS = {
  admin:      ['contracts.edit','contracts.delete','settings.passwords','settings.reset','audit.export','visits.add'],
  engineer:   ['contracts.edit','visits.add'],
  accountant: ['audit.export']
};

const ROLE_LABELS_EN = { admin:'Admin', engineer:'Engineer', accountant:'Accountant' };
const ADMIN_MASTER_PASSWORD = 'Almuheet@2026';
let cloudUsers = [];
let currentLang = 'ar';

const TRANSLATIONS = {
  en: {
    loginCompany: 'AL MUHEET ENGINEERING CONSULTING',
    roleAdmin: 'System Admin',
    roleEngineer: 'Engineer',
    roleAccountant: 'Accountant',
    loginPassword: 'Password',
    loginUser: 'User name (optional)',
    loginButton: 'Login',
    loginError: 'Wrong password',
    navDashboard: '📊 Dashboard',
    navContracts: '📋 Contracts',
    navPayments: '💰 Payments',
    navVisits: '🚧 Field Visits',
    navArchive: '📁 Archive',
    navReports: '📈 Reports',
    navAudit: '🔒 Audit log',
    topbarLogo: '⬡ Al Muheet',
    sidebarSectionMain: 'Main',
    sidebarDashboard: 'Dashboard',
    sidebarContracts: 'Contracts',
    sidebarPayments: 'Payments',
    sidebarSectionField: 'Field',
    sidebarSectionManagement: 'Management',
    sidebarEngineers: 'Engineers',
    sidebarSettings: 'Settings',
    settingsTitle: 'Settings',
    passwordsTitle: 'Passwords',
    usersTitle: 'User Accounts',
    officeInfoTitle: 'Office Info',
    backupTitle: 'Backup',
    cloudTitle: 'Cloud',
    addUserButton: 'Add user',
    savePasswordButton: 'Save passwords',
    saveSettingsButton: 'Save',
    userAccountsHeader: 'Current users',
    userLoginLabel: 'Account login',
    userNameLabel: 'Display name',
    userRoleLabel: 'Role',
    userPasswordLabel: 'Password',
    cloudForceLabel: 'Force Cloud access',
    retrySync: 'Retry sync',
    stopForce: 'Stop force',
    initCloudButton: 'Initialize cloud',
    syncCloudNow: 'Sync Cloud Now',
    deleteContractError: 'Delete is admin-only',
    deleteFileError: 'Delete is admin-only',
    changePasswordButton: 'Change password',
    deleteButton: 'Delete',
    companyName: 'Al Muheet Consulting',
    companySubtitle: 'AL MUHEET ENGINEERING CONSULTING',
    notificationsTitle: 'Notifications',
    notificationsMarkAllRead: 'Mark all read',
    dashboardTitle: 'Dashboard',
    dashboardNewContract: '➕ New Contract',
    dashboardExport: '📤 Export',
    kpiTotal: 'Total contracts',
    kpiValue: 'Total value',
    kpiCollected: 'Collected',
    kpiRemain: 'Remaining',
    kpiLate: 'Late contracts',
    kpiTotalSub: 'Active / Completed / Frozen',
    kpiCollectedSub: 'QAR — <span id="kpi-pct">0</span>% of total',
    contractStatusTitle: 'Contract status',
    monthlyCollectionTitle: 'Monthly collection',
    todaySummaryTitle: 'Today summary',
    latestContractsTitle: 'Latest contracts',
    viewAllContracts: 'View all ←',
    contractsSectionTitle: '📋 Contract management',
    contractsNewButton: '➕ New contract',
    contractsExportExcel: '📤 Export Excel',
    contractsImport: '📥 Import',
    contractsSearchPlaceholder: 'Search name, contract #, or ID...',
    contractsStatusAll: 'All statuses',
    contractsStatusActive: 'Active',
    contractsStatusCompleted: 'Completed',
    contractsStatusFrozen: 'Frozen',
    contractsStatusEnded: 'Ended',
    contractsTypeAll: 'All types',
    contractsTypeFull: 'Full',
    contractsTypeSkeleton: 'Skeleton',
    contractsTypeFinish: 'Finish',
    contractsEngineerAll: 'All engineers',
    contractsHeaderId: 'Contract # ↕',
    contractsHeaderOwner: 'Owner ↕',
    contractsHeaderContact: 'Contact',
    contractsHeaderType: 'Type ↕',
    contractsHeaderStatus: 'Status ↕',
    contractsHeaderEngineer: 'Engineer',
    contractsHeaderValue: 'Value ↕',
    contractsHeaderCollected: 'Collected',
    contractsHeaderEnd: 'End ↕',
    contractsHeaderActions: 'Actions',
    contractsEmptyMessage: 'No contracts yet — add one now',
    statusActive: 'Active',
    statusCompleted: 'Completed',
    statusFrozen: 'Frozen',
    statusEnded: 'Ended',
    summaryVisitsToday: '🚧 Visits today',
    summaryPaymentsThisWeek: '💵 Payments this week',
    summaryExpiringSoon: '⚠️ Expiring soon',
    summaryCompletedThisMonth: '✅ Completed this month',
    summaryNoVisit: '📋 No visit (30+ days)',
    paymentsTitle: '💰 Payments tracker',
    paymentsPrint: '🖨️ Print',
    paymentsExportCsv: '📊 Excel',
    debtAgingTitle: '📊 Debt aging report',
    agingRange1: '0 — 30 days',
    agingRange2: '31 — 60 days',
    agingRange3: '61 — 90 days',
    agingRange4: '+90 days',
    qatariRiyal: 'QAR',
    paymentsAllContracts: 'All contracts',
    paymentsAllMonths: 'All months',
    monthJan: 'January',
    monthFeb: 'February',
    monthMar: 'March',
    monthApr: 'April',
    monthMay: 'May',
    monthJun: 'June',
    monthJul: 'July',
    monthAug: 'August',
    monthSep: 'September',
    monthOct: 'October',
    monthNov: 'November',
    monthDec: 'December',
    paymentsHeaderContract: 'Contract',
    paymentsHeaderClient: 'Client',
    paymentsHeaderAmount: 'Amount',
    paymentsHeaderDate: 'Date',
    paymentsHeaderCategory: 'Category',
    paymentsHeaderReceipt: 'Receipt #',
    paymentsHeaderAging: 'Aging',
    paymentsHeaderAction: 'Action',
    paymentsEmpty: 'No payments recorded',
    visitsTitle: '🚧 Field visits',
    visitsAddButton: '➕ Log visit',
    visitsProgressTitle: 'Progress comparison',
    visitsNoData: 'No visits recorded',
    visitViolationsTitle: 'Latest violations',
    visitViolationsNone: 'No violations recorded',
    visitsHeaderDate: 'Date',
    visitsHeaderContract: 'Contract',
    visitsHeaderOwner: 'Owner',
    visitsHeaderPhase: 'Phase',
    visitsHeaderCompletion: 'Completion %',
    visitsHeaderEngineer: 'Engineer',
    visitsHeaderViolations: 'Violations',
    visitsHeaderNotes: 'Notes',
    visitsEmpty: 'No visits recorded',
    archiveTitle: '📁 Archive',
    archiveExport: '📊 Export archive',
    archiveEndedContracts: 'Ended contracts',
    archiveTotalValue: 'Total values (QAR)',
    archiveCollected: 'Collected (QAR)',
    archiveUncollected: 'Uncollected (QAR)',
    archiveTabContracts: '📄 Contract archive',
    archiveTabVisits: '🚧 Visits archive',
    archiveTabLicenses: '⚠️ License alerts',
    archiveTabDocs: '🗂️ Central archive',
    archiveAllYears: 'All years',
    archiveAllEngineers: 'All engineers',
    archiveAllTypes: 'All types',
    archiveAllRegions: 'All regions',
    archiveHeaderContract: 'Contract #',
    archiveHeaderOwner: 'Owner',
    archiveHeaderType: 'Type',
    archiveHeaderEngineer: 'Engineer',
    archiveHeaderValue: 'Value',
    archiveHeaderCollected: 'Collected',
    archiveHeaderRemaining: 'Remaining',
    archiveHeaderEndDate: 'End date',
    archiveHeaderAction: 'Action',
    archiveContractsEmpty: 'No ended contracts in archive',
    archiveVisitsHeaderDate: 'Date',
    archiveVisitsHeaderContract: 'Contract',
    archiveVisitsHeaderOwner: 'Owner',
    archiveVisitsHeaderPhase: 'Phase',
    archiveVisitsHeaderCompletion: 'Completion %',
    archiveVisitsHeaderEngineer: 'Engineer',
    archiveVisitsHeaderViolations: 'Violations',
    archiveVisitsEmpty: 'No archived visits',
    archiveLicensesEmpty: 'No licenses recorded',
    archiveDocsSearchPlaceholder: 'Search documents...',
    archiveDocsAllTypes: 'All types',
    archiveDocsTypeLicense: 'License',
    archiveDocsTypeDrawings: 'Drawings',
    archiveDocsTypePhotos: 'Photos',
    archiveDocsTypeLetters: 'Letters',
    archiveDocsEmpty: '📁 Central documents will appear here when contracts with attachments are added',
    reportsTitle: '📈 Advanced reports',
    reportMonthly: 'Monthly report',
    reportMonthlyDesc: 'Current month summary',
    reportQuarterly: 'Quarterly report',
    reportQuarterlyDesc: 'Rolling 3 months',
    reportYearly: 'Yearly report',
    reportYearlyDesc: 'Full year',
    reportEngineers: 'Engineer performance',
    reportEngineersDesc: 'Visits and contracts count',
    reportClients: 'Client analysis',
    reportClientsDesc: 'Payment history and rates',
    reportAging: 'Aging report',
    reportAgingDesc: 'Breakdown by days',
    reportsExportCurrent: '📄 Export current report CSV',
    pageTitle: 'Contract Management System - Al Muheet Consulting'
  }
};

const DEFAULT_DOCUMENT_TITLE = 'نظام إدارة العقود - المحيط للاستشارات (المحسّن)';

// إعدادات Supabase — يُنصح بنقلها لملف .env في بيئة الإنتاج
const supabaseConfig = {
  url: "https://reaogvzxsvkeqrdkcqyz.supabase.co",
  // Updated anon/public key provided by user (do NOT commit this key to a public repo)
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYW9ndnp4c3ZrZXFyZGtjcXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDAyNDgsImV4cCI6MjA5NDc3NjI0OH0.XYrL6Okp6-iecwmuQTB18R79tTh9QX5g21pPuH9hoyQ"
};

const CLOUD_DOC_PATH = { table:'systems', id:'main' };
let supabaseClient = null;
let cloudReady     = false;
let cloudSaveTimer = null;
let cloudPullDone  = false;
let cloudAuthReady = false;
let pendingCloudSave = false;
let cloudForceEnable = false;
let currentPermissions = [];

// ═══════════════════════════════════════════════
// الأمان — تشفير SHA-256
// ═══════════════════════════════════════════════
async function sha256(message) {
  const msgBuffer  = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}

// ترقية: تحويل كلمة المرور النصية إلى hash عند أول استخدام
async function upgradePasswordIfNeeded(role, rawPass) {
  if (!passwords[role] || passwords[role].length !== 64) {
    // لا يوجد hash مخزن بعد — هذه أول مرة
    const hashed = await sha256(rawPass);
    passwords[role] = hashed;
    return hashed;
  }
  return passwords[role];
}

// الحماية من XSS: تعقيم النص قبل إدراجه في HTML
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════
function selectRole(el, role) {
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentRole = role;
}

async function doLogin() {
  const loginUser = document.getElementById('loginUser') ? document.getElementById('loginUser').value.trim() : '';
  const passRaw   = document.getElementById('passInput').value;
  const lockKey   = 'loginLock:' + (loginUser || currentRole);
  const failKey   = 'loginFail:' + (loginUser || currentRole);
  const lockUntil = parseInt(localStorage.getItem(lockKey) || '0', 10);

  if (Date.now() < lockUntil) {
    const mins = Math.ceil((lockUntil - Date.now()) / 60000);
    showToast(`⛔ الحساب مقفل مؤقتًا (${mins} دقيقة)`, 'warn');
    return;
  }

  if (!passRaw) {
    showToast('⚠️ أدخل كلمة المرور', 'warn');
    return;
  }

  // — تحقق محلي بـ SHA-256 —
  const passHash = await sha256(passRaw);

  // التحقق من أول دخول: إذا كانت كلمة المرور المحفوظة فارغة أو نصية غير مشفرة
  let storedHash = passwords[currentRole] || '';
  if (storedHash.length !== 64) {
    // النسخة القديمة: المقارنة بالنص مباشرة مع الترقية
    const fallback = currentRole === 'admin' ? ADMIN_MASTER_PASSWORD : '1234';
    storedHash = await upgradePasswordIfNeeded(currentRole, storedHash || fallback);
  }

  let valid = (passHash === storedHash);
  let loginName        = currentLang === 'en' ? ROLE_LABELS_EN[currentRole] : ROLE_LABELS[currentRole];
  let loginPermissions = ROLE_PERMISSIONS[currentRole] || [];

  // — تحقق سحابي (اختياري) —
  if (cloudReady && cloudAuthReady) {
    const cloudUser = await fetchCloudUserByCredentials({
      username: loginUser || null,
      role: loginUser ? null : currentRole,
      passwordHash: passHash
    });
    if (cloudUser) {
      valid            = true;
      currentRole      = cloudUser.role || currentRole;
      loginName        = cloudUser.name || ROLE_LABELS[currentRole];
      loginPermissions = Array.isArray(cloudUser.permissions)
        ? cloudUser.permissions
        : (ROLE_PERMISSIONS[currentRole] || []);
    }
  }

  if (valid && loginUser) {
    loginName = loginUser;
  }

  // دعم كلمة مرور استرجاع المدير عند ضياع كلمة المرور الأصلية
  if (!valid && currentRole === 'admin' && passRaw === ADMIN_MASTER_PASSWORD) {
    valid = true;
    passwords.admin = passHash;

  }

  if (valid) {
    localStorage.removeItem(failKey);
    localStorage.removeItem(lockKey);
    currentUser        = loginName;
    currentPermissions = loginPermissions;

    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    const loginScreenEl = document.getElementById('loginScreen');
    const appEl = document.getElementById('app');

    if (userNameEl) userNameEl.textContent = currentUser;
    if (userRoleEl) {
      userRoleEl.textContent = currentLang === 'en'
        ? ROLE_LABELS_EN[currentRole]
        : ROLE_LABELS[currentRole];
      userRoleEl.className = 'role-badge ' + ROLE_CLASSES[currentRole];
    }
    if (userAvatarEl) userAvatarEl.textContent = ROLE_AVATARS[currentRole];
    if (loginScreenEl) loginScreenEl.style.display = 'none';
    if (appEl) appEl.style.display = 'flex';

    addAudit('login', `${currentUser} سجّل دخوله`);
    refreshAll();
    buildNotifications();
    startSessionTimer();

    const dashDateEl = document.getElementById('dashDate');
    const auditNowEl = document.getElementById('auditNow');
    if (dashDateEl) dashDateEl.textContent = new Date().toLocaleDateString('ar-QA',{ weekday:'long', year:'numeric', month:'long', day:'numeric' });
    if (auditNowEl) auditNowEl.textContent = new Date().toLocaleTimeString('ar-QA');

    // إخفاء الصفحات المقيّدة للأدوار غير المدير
    if (currentRole !== 'admin') {
      document.querySelectorAll('[onclick*="audit"]').forEach(b => b.style.display = 'none');
    }
  } else {
    const fails = (parseInt(localStorage.getItem(failKey) || '0', 10) + 1);
    localStorage.setItem(failKey, String(fails));
    if (fails >= 5) {
      localStorage.setItem(lockKey, String(Date.now() + 5 * 60 * 1000));
      localStorage.setItem(failKey, '0');
      showToast('⛔ تم قفل تسجيل الدخول 5 دقائق', 'warn');
      return;
    }
    const remaining = 5 - fails;
    const errEl = document.getElementById('loginErr');
    errEl.textContent = `كلمة المرور غير صحيحة — تبقّى ${remaining} محاولة`;
    errEl.style.display = 'block';
    setTimeout(() => errEl.style.display = 'none', 4000);
  }
}

function logout() {
  addAudit('login', `${currentUser} سجّل خروجه`);
  if (sessionTimer) { clearTimeout(sessionTimer); sessionTimer = null; }
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('app').style.display          = 'none';
  document.getElementById('passInput').value            = '';
  currentPermissions = [];
  currentUser        = null;
}

async function savePasswords() {
  if (!hasPermission('settings.passwords')) {
    showToast('⛔ لا تملك صلاحية تعديل كلمات المرور', 'warn');
    return;
  }
  const adminRaw = document.getElementById('pw-admin').value.trim();
  const engRaw   = document.getElementById('pw-eng').value.trim();
  const accRaw   = document.getElementById('pw-acc').value.trim();

  // فرض الحد الأدنى 6 أحرف
  if (adminRaw && adminRaw.length < 6) { showToast('⚠️ كلمة مرور المدير يجب أن تكون 6 أحرف على الأقل', 'warn'); return; }
  if (engRaw   && engRaw.length   < 6) { showToast('⚠️ كلمة مرور المهندس يجب أن تكون 6 أحرف على الأقل', 'warn'); return; }
  if (accRaw   && accRaw.length   < 6) { showToast('⚠️ كلمة مرور المحاسب يجب أن تكون 6 أحرف على الأقل', 'warn'); return; }

  if (adminRaw) passwords.admin      = await sha256(adminRaw);
  if (engRaw)   passwords.engineer   = await sha256(engRaw);
  if (accRaw)   passwords.accountant = await sha256(accRaw);

  syncCloudRolePasswords();
  showToast('✅ تم حفظ كلمات المرور');

  // مسح الحقول
  document.getElementById('pw-admin').value = '';
  document.getElementById('pw-eng').value   = '';
  document.getElementById('pw-acc').value   = '';
}

function startSessionTimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    if (currentUser) {
      showToast('⏱️ انتهت الجلسة بسبب عدم النشاط', 'warn');
      logout();
    }
  }, SESSION_TIMEOUT_MS);
}

function hasPermission(permission) {
  if (Array.isArray(currentPermissions) && currentPermissions.length) {
    return currentPermissions.includes(permission);
  }
  return (ROLE_PERMISSIONS[currentRole] || []).includes(permission);
}

function setLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'ar';
  // persist language in cloud-backed officeSettings
  if (!officeSettings || typeof officeSettings !== 'object') officeSettings = {};
  officeSettings.appLang = currentLang;
  saveData();
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'en' ? 'ltr' : 'rtl';
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = currentLang === 'en' ? 'AR' : 'EN';
  translateUI();
  document.title = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].pageTitle) || DEFAULT_DOCUMENT_TITLE;
  const dashDateEl = document.getElementById('dashDate');
  const auditNowEl = document.getElementById('auditNow');
  const locale = currentLang === 'en' ? 'en-US' : 'ar-QA';
  if (dashDateEl) dashDateEl.textContent = new Date().toLocaleDateString(locale, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  if (auditNowEl) auditNowEl.textContent = new Date().toLocaleTimeString(locale);
}

function toggleLanguage() {
  setLanguage(currentLang === 'en' ? 'ar' : 'en');
}

function translateUI() {
  const texts = document.querySelectorAll('[data-i18n]');
  texts.forEach(el => {
    const key = el.dataset.i18n;
    const translation = TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key];
    if (translation !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.dataset.i18nPlaceholder === 'true') el.placeholder = translation;
        else el.value = translation;
      } else {
        if (translation.includes('<') && translation.includes('>')) {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function showPage(id, topBtn, sideBtn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  if (topBtn)  topBtn.classList.add('active');
  if (sideBtn) sideBtn.classList.add('active');
  if (id === 'archive')  refreshArchive();
  if (id === 'payments') refreshPayments();
  if (id === 'visits')   refreshVisitsPage();
  if (id === 'invoices') refreshInvoices();
  if (id === 'files')    refreshFiles();
  if (id === 'engineers') renderEngineersTable();
  closeNotif();
}

// ═══════════════════════════════════════════════
// الإشعارات — ديناميكية من البيانات الفعلية
// ═══════════════════════════════════════════════
function buildNotifications() {
  const items = [];
  const today = new Date();

  // عقود تنتهي خلال 7 أيام
  contracts.filter(c => c.status === 'نشط' && c.end).forEach(c => {
    const d = daysUntil(c.end);
    if (d >= 0 && d <= 7) {
      items.push({ color:'red',   title:`عقد #${esc(c.id)}`, body:`ينتهي خلال ${d} يوم${d===0?' (اليوم)':''}`, ts: c.end });
    }
  });

  // رخص تنتهي خلال 30 يوم
  contracts.filter(c => c.licExpiry).forEach(c => {
    const d = daysUntil(c.licExpiry);
    if (d >= 0 && d <= 30) {
      items.push({ color:'amber', title:`رخصة عقد #${esc(c.id)}`, body:`تنتهي بعد ${d} يوم`, ts: c.licExpiry });
    }
  });

  // عقود لم تُزَر منذ 30+ يوم
  contracts.filter(c => c.status === 'نشط').forEach(c => {
    const cv = visits.filter(v => v.contractId === c.id);
    if (!cv.length) {
      items.push({ color:'amber', title:`عقد #${esc(c.id)}`, body:'لم يُزَر منذ البداية', ts:null });
    } else {
      const last = new Date(cv[0].date);
      const age  = Math.round((today - last) / 86400000);
      if (age > 30) {
        items.push({ color:'amber', title:`عقد #${esc(c.id)}`, body:`لم يُزَر منذ ${age} يوماً`, ts:cv[0].date });
      }
    }
  });

  // عقود تأخرت (تجاوزت تاريخ الانتهاء وما زالت نشطة)
  contracts.filter(c => c.status === 'نشط' && c.end && new Date(c.end) < today).forEach(c => {
    const d = Math.round((today - new Date(c.end)) / 86400000);
    items.push({ color:'red', title:`عقد #${esc(c.id)}`, body:`تجاوز الموعد منذ ${d} يوم`, ts:c.end });
  });

  // فواتير غير مدفوعة
  invoices.filter(i => i.status !== 'مدفوعة').forEach(inv => {
    items.push({ color:'blue', title:`فاتورة ${inv.id}`, body:`غير مدفوعة - ${fmt(inv.amount)} ر.ق`, ts:inv.dueDate });
  });

  const panel = document.getElementById('notifPanel');
  const header = panel.querySelector('div:first-child');

  // إعادة بناء القائمة
  panel.querySelectorAll('.notif-item').forEach(n => n.remove());

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'notif-item';
    empty.innerHTML = '<div class="notif-text" style="font-size:12px;color:var(--text3);padding:8px 0">لا توجد إشعارات جديدة ✅</div>';
    panel.appendChild(empty);
  } else {
    items.slice(0, 15).forEach(it => {
      const el = document.createElement('div');
      el.className = 'notif-item unread';
      el.innerHTML = `
        <div class="notif-dot ${it.color}"></div>
        <div class="notif-text">
          <strong>${it.title}</strong> — ${it.body}
          ${it.ts ? `<br><span style="font-size:11px;color:var(--text3)">${it.ts}</span>` : ''}
        </div>`;
      panel.appendChild(el);
    });
  }

  // تحديث العداد
  const countEl = document.getElementById('notifCount');
  if (items.length > 0) {
    countEl.textContent     = items.length > 99 ? '99+' : items.length;
    countEl.style.display   = 'block';
  } else {
    countEl.style.display   = 'none';
  }
}

function toggleNotif() {
  document.getElementById('notifPanel').classList.toggle('open');
}
function closeNotif() {
  document.getElementById('notifPanel').classList.remove('open');
}
function markAllRead() {
  document.querySelectorAll('.notif-item').forEach(n => n.classList.remove('unread'));
  document.getElementById('notifCount').style.display = 'none';
}

document.addEventListener('click', e => {
  if (!e.target.closest('#notifPanel') && !e.target.closest('#notifBtn')) closeNotif();
});

// ═══════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════
function contractTab(el, id) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['ct-basic','ct-project','ct-engineer','ct-payments','ct-license'].forEach(s => {
    const e2 = document.getElementById(s);
    if (e2) e2.style.display = s === id ? 'block' : 'none';
  });
}
function archiveTab(el, id) {
  el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['arch-contracts','arch-visits','arch-licenses','arch-docs'].forEach(s => {
    const e2 = document.getElementById(s);
    if (e2) e2.style.display = s === id ? 'block' : 'none';
  });
}

// ═══════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════
function addAudit(type, msg) {
  const entry = { type, msg, user: currentUser || '—', time: new Date().toISOString() };
  auditLogs.unshift(entry);
  if (auditLogs.length > 500) auditLogs = auditLogs.slice(0, 500);
  queueCloudSave();
  renderAudit();
}
function renderAudit() {
  const el     = document.getElementById('auditLog');
  const filter = (document.getElementById('auditFilter') || {}).value || '';
  const icons  = { create:'🟢', edit:'🔵', delete:'🔴', login:'🔑', export:'📤', payment:'💰' };
  let logs     = filter ? auditLogs.filter(l => l.type === filter) : auditLogs;
  if (!logs.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text3);padding:30px">لا يوجد نشاط مسجل</div>';
    return;
  }
  el.innerHTML = logs.slice(0, 100).map(l => `
    <div class="audit-item">
      <div class="audit-icon" style="background:var(--bg3);font-size:14px">${icons[l.type] || '📝'}</div>
      <div class="audit-text"><strong>${esc(l.user)}</strong> — ${esc(l.msg)}</div>
      <div class="audit-time">${new Date(l.time).toLocaleString('en-US')}</div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════
// CONTRACT CRUD
// ═══════════════════════════════════════════════
function openNewContract() {
  editingId       = null;
  pendingPayments = [];
  pendingStages   = [];
  document.getElementById('contractModalTitle').textContent = '➕ إضافة عقد جديد';
  clearContractForm();
  renderEngineerSelect();
  document.getElementById('contractModal').classList.add('open');
  document.getElementById('p-date').value  = new Date().toISOString().split('T')[0];
  document.getElementById('f-start').value = new Date().toISOString().split('T')[0];
  renderPaymentsList();
  renderStages();
}

function clearContractForm() {
  ['f-id','f-owner','f-phone','f-ownerId','f-duration','f-value',
    'f-location','f-buildLic','f-notes','f-eng-select','f-engPhone','f-engReg',
   'f-land','tpl-req','tpl-area','tpl-plot','tpl-comp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const fileInput = document.getElementById('f-files');
  if (fileInput) fileInput.value = '';
  document.getElementById('f-status').value    = 'نشط';
  document.getElementById('f-type').value      = 'كامل';
  document.getElementById('f-paymethod').value = 'شهري';
  document.getElementById('f-start').value     = '';
  document.getElementById('f-end').value       = '';
  document.getElementById('f-licExpiry').value = '';
}

function editContract(id) {
  if (!hasPermission('contracts.edit')) {
    showToast('⛔ لا تملك صلاحية تعديل العقود', 'warn');
    return;
  }
  const c = contracts.find(x => x.id === id);
  if (!c) return;
  editingId       = id;
  pendingPayments = [...(c.payments || [])];
  pendingStages   = [...(c.stages   || [])];
  document.getElementById('contractModalTitle').textContent = '✏️ تعديل العقد #' + id;
  const set = (fid, val) => { const el = document.getElementById(fid); if (el) el.value = val || ''; };
  set('f-id',c.id); set('f-owner',c.owner); set('f-phone',c.phone);
  set('f-ownerId',c.ownerId); set('f-duration',c.duration); set('f-value',c.value);
  set('f-location',c.location); set('f-buildLic',c.buildLic); set('f-notes',c.notes);
  const engSel = document.getElementById('f-eng-select'); if (engSel) engSel.value = c.engName || '';
  set('f-engPhone',c.engPhone); set('f-engReg',c.engReg);
  set('f-land',c.land); set('f-start',c.start); set('f-end',c.end); set('f-licExpiry',c.licExpiry);
  set('f-status',c.status); set('f-type',c.type); set('f-paymethod',c.paymethod);
  set('tpl-req',c.tplReq); set('tpl-area',c.tplArea); set('tpl-plot',c.tplPlot); set('tpl-comp',c.tplComp);
  const fileInput = document.getElementById('f-files');
  if (fileInput) fileInput.value = '';
  renderEngineerSelect();
  renderPaymentsList();
  renderStages();
  document.getElementById('contractModal').classList.add('open');
}

async function saveContract() {
  if (!hasPermission('contracts.edit')) {
    showToast('⛔ لا تملك صلاحية حفظ العقود', 'warn');
    return;
  }
  const id        = document.getElementById('f-id').value.trim();
  const owner     = document.getElementById('f-owner').value.trim();
  const value     = parseFloat(document.getElementById('f-value').value) || 0;
  const startDate = document.getElementById('f-start').value;
  const endDate   = document.getElementById('f-end').value;
  const phone     = document.getElementById('f-phone').value.trim();

  if (!id || !owner) { showToast('⚠️ رقم العقد واسم المالك مطلوبان', 'warn'); return; }
  if (!editingId && contracts.find(x => x.id === id)) { showToast('⚠️ رقم العقد موجود مسبقاً', 'warn'); return; }
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    showToast('⚠️ تاريخ النهاية يجب أن يكون بعد تاريخ البداية', 'warn');
    return;
  }
  // تحقق بسيط من صيغة الهاتف
  if (phone && !/^[\d\s\-+]{7,15}$/.test(phone)) {
    showToast('⚠️ رقم التواصل غير صحيح', 'warn');
    return;
  }

  const existingAttachments = editingId ? (contracts.find(x => x.id === editingId) || {}).attachments || [] : [];
  const attachments = [...existingAttachments];
  const fileInput = document.getElementById('f-files');
  if (fileInput && fileInput.files && fileInput.files.length) {
    for (const f of Array.from(fileInput.files)) {
      const uploaded = await uploadFile(f, id, 'contract');
      if (uploaded && uploaded.id) attachments.push(uploaded.id);
    }
  }

  const c = {
    id, owner,
    phone,
    ownerId:   document.getElementById('f-ownerId').value,
    status:    document.getElementById('f-status').value,
    type:      document.getElementById('f-type').value,
    paymethod: document.getElementById('f-paymethod').value,
    duration:  document.getElementById('f-duration').value,
    start:     startDate,
    end:       endDate,
    value,
    land:      document.getElementById('f-land').value,
    location:  document.getElementById('f-location').value,
    buildLic:  document.getElementById('f-buildLic').value,
    licExpiry: document.getElementById('f-licExpiry').value,
    notes:     document.getElementById('f-notes').value,
    engName:   (document.getElementById('f-eng-select') || {}).value || document.getElementById('f-engName') && document.getElementById('f-engName').value || '',
    engPhone:  document.getElementById('f-engPhone').value,
    engReg:    document.getElementById('f-engReg').value,
    tplReq:    document.getElementById('tpl-req').value,
    tplArea:   document.getElementById('tpl-area').value,
    tplPlot:   document.getElementById('tpl-plot').value,
    tplComp:   document.getElementById('tpl-comp').value,
    payments:  [...pendingPayments],
    stages:    [...pendingStages],
    attachments,
    createdAt: editingId ? (contracts.find(x => x.id === editingId) || {}).createdAt : new Date().toISOString()
  };

  if (editingId) {
    const idx = contracts.findIndex(x => x.id === editingId);
    contracts[idx] = c;
    addAudit('edit', `تعديل العقد #${id} (${owner})`);
  } else {
    contracts.push(c);
    addAudit('create', `إنشاء عقد جديد #${id} (${owner})`);
  }
  saveData();
  closeModal('contractModal');
  refreshAll();
  buildNotifications();
  renderContractsTable();
  refreshArchive();
  refreshPayments();
  showToast('✅ تم حفظ العقد بنجاح');
}

function deleteContract(id) {
  if (!hasPermission('contracts.delete')) { showToast('⛔ الحذف متاح لمدير النظام فقط', 'warn'); return; }
  showConfirm('حذف العقد #' + id, 'هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عنه.', () => {
    contracts = contracts.filter(x => x.id !== id);
    addAudit('delete', `حذف العقد #${id}`);
    saveData();
    refreshAll();
    renderContractsTable();
    refreshArchive();
    refreshPayments();
    buildNotifications();
    showToast('🗑️ تم حذف العقد');
  });
}

function cloneContract(id) {
  if (!hasPermission('contracts.edit')) {
    showToast('⛔ لا تملك صلاحية نسخ العقود', 'warn');
    return;
  }
  const c = contracts.find(x => x.id === id);
  if (!c) return;
  // ID فريد بإضافة timestamp مختصر لتجنب التعارض
  const nc = { ...c, id: c.id + '-' + Date.now().toString().slice(-4), createdAt: new Date().toISOString(), payments: [], status: 'نشط' };
  editingId       = null;
  pendingPayments = [];
  pendingStages   = [...(c.stages || [])];
  document.getElementById('contractModalTitle').textContent = '📋 نسخ العقد #' + id;
  const set = (fid, val) => { const el = document.getElementById(fid); if (el) el.value = val || ''; };
  set('f-id', nc.id); set('f-owner', nc.owner); set('f-phone', nc.phone);
  set('f-ownerId', nc.ownerId); set('f-duration', nc.duration); set('f-value', nc.value);
  set('f-location', nc.location); set('f-buildLic', nc.buildLic); set('f-notes', nc.notes);
  set('f-engName', nc.engName); set('f-engPhone', nc.engPhone); set('f-engReg', nc.engReg);
  set('f-land', nc.land); set('f-start', nc.start); set('f-end', nc.end); set('f-licExpiry', nc.licExpiry);
  set('f-status', nc.status); set('f-type', nc.type); set('f-paymethod', nc.paymethod);
  renderPaymentsList();
  renderStages();
  document.getElementById('contractModal').classList.add('open');
}

function reactivateContract(id) {
  if (!hasPermission('contracts.edit')) {
    showToast('⛔ لا تملك صلاحية تعديل العقود', 'warn');
    return;
  }
  const c = contracts.find(x => x.id === id);
  if (!c) return;
  c.status = 'نشط';
  addAudit('edit', `إعادة تفعيل العقد #${id}`);
  saveData();
  refreshAll();
  renderContractsTable();
  refreshArchive();
  refreshPayments();
  buildNotifications();
  showToast('✅ تم إعادة تفعيل العقد');
}

// ═══════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════
function addPaymentToForm() {
  const amount = parseFloat(document.getElementById('p-amount').value);
  if (!amount || amount <= 0) { showToast('⚠️ أدخل مبلغاً صحيحاً', 'warn'); return; }
  pendingPayments.push({
    amount,
    date: document.getElementById('p-date').value,
    type: document.getElementById('p-type').value,
    ref:  document.getElementById('p-ref').value,
    note: document.getElementById('p-note').value
  });
  document.getElementById('p-amount').value = '';
  document.getElementById('p-ref').value    = '';
  document.getElementById('p-note').value   = '';
  renderPaymentsList();
  showToast('✅ تمت إضافة الدفعة');
}
function removePayment(i) {
  pendingPayments.splice(i, 1);
  renderPaymentsList();
}
function renderPaymentsList() {
  const el = document.getElementById('paymentsList');
  if (!pendingPayments.length) { el.innerHTML = '<div style="font-size:12px;color:var(--text3)">لا توجد دفعات</div>'; return; }
  const total = pendingPayments.reduce((s, p) => s + p.amount, 0);
  el.innerHTML = `
    <table style="width:100%;font-size:12px">
      <thead><tr><th>المبلغ</th><th>التاريخ</th><th>التصنيف</th><th>السند</th><th>حذف</th></tr></thead>
      <tbody>${pendingPayments.map((p, i) => `<tr>
        <td style="color:var(--accent2);font-family:var(--mono)">${fmt(p.amount)}</td>
        <td>${esc(p.date) || '—'}</td><td>${esc(p.type)}</td><td>${esc(p.ref) || '—'}</td>
        <td><button class="ghost" onclick="removePayment(${i})" style="padding:2px 6px;font-size:11px">✕</button></td>
      </tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="5" style="padding-top:6px;color:var(--accent2);font-weight:600">الإجمالي: ${fmt(total)} ر.ق</td></tr></tfoot>
    </table>`;
}

// ═══════════════════════════════════════════════
// مراحل الدفع — Modal بدلاً من prompt()
// ═══════════════════════════════════════════════
function addPayStage() {
  document.getElementById('stageModal').classList.add('open');
  document.getElementById('sm-name').value = '';
  document.getElementById('sm-pct').value  = '';
}
function saveStage() {
  const name = document.getElementById('sm-name').value.trim();
  const pct  = parseFloat(document.getElementById('sm-pct').value) || 0;
  if (!name) { showToast('⚠️ أدخل اسم المرحلة', 'warn'); return; }
  pendingStages.push({ name, pct });
  renderStages();
  closeModal('stageModal');
  showToast('✅ تمت إضافة المرحلة');
}
function renderStages() {
  const el = document.getElementById('payStages');
  if (!pendingStages.length) { el.innerHTML = ''; return; }
  el.innerHTML = '<div style="margin-bottom:10px">' + pendingStages.map((s, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
      <span style="flex:1;font-size:13px">${esc(s.name)}</span>
      <span style="font-family:var(--mono);font-size:13px;color:var(--accent2)">${s.pct}%</span>
      <button class="ghost" onclick="pendingStages.splice(${i},1);renderStages()" style="padding:2px 6px;font-size:11px">✕</button>
    </div>`).join('') + '</div>';
}

// ═══════════════════════════════════════════════
// VISITS
// ═══════════════════════════════════════════════
function openVisitModal() {
  if (!hasPermission('visits.add')) {
    showToast('⛔ لا تملك صلاحية تسجيل الزيارات', 'warn');
    return;
  }
  const sel = document.getElementById('v-contract');
  sel.innerHTML = '<option value="">اختر عقداً</option>' +
    contracts.filter(c => c.status === 'نشط').map(c => `<option value="${esc(c.id)}">#${esc(c.id)} — ${esc(c.owner)}</option>`).join('');
  document.getElementById('v-date').value = new Date().toISOString().split('T')[0];
  if (currentRole === 'engineer') document.getElementById('v-eng').value = currentUser;
  document.getElementById('visitModal').classList.add('open');
}

async function saveVisit() {
  const contractId = document.getElementById('v-contract').value;
  if (!contractId) { showToast('⚠️ اختر عقداً', 'warn'); return; }
  const pct = parseInt(document.getElementById('v-pct').value) || 0;
  if (pct < 0 || pct > 100) { showToast('⚠️ نسبة الإنجاز يجب أن تكون بين 0 و 100', 'warn'); return; }

  const v = {
    contractId,
    date:      document.getElementById('v-date').value,
    engineer:  document.getElementById('v-eng').value,
    stage:     document.getElementById('v-stage').value,
    pct,
    violation: document.getElementById('v-violation').value,
    report:    document.getElementById('v-report').value,
    notes:     document.getElementById('v-notes').value,
    attachments: [],
    id:        Date.now()
  };

  // معالجة الملفات المرفوعة مع الزيارة
  const fileInput = document.getElementById('v-files');
  if (fileInput && fileInput.files && fileInput.files.length) {
    for (const f of Array.from(fileInput.files)) {
      const uploaded = await uploadFile(f, contractId, 'visit');
      if (uploaded && uploaded.id) v.attachments.push(uploaded.id);
    }
  }

  visits.unshift(v);
  addAudit('create', `زيارة ميدانية للعقد #${contractId} — ${v.stage} (${v.pct}%)`);
  saveData();
  closeModal('visitModal');
  refreshVisitsPage();
  buildNotifications();
  showToast('✅ تم تسجيل الزيارة');
}

function refreshVisitsPage() {
  const tb       = document.getElementById('visitsTable');
  const archVis  = document.getElementById('archVisitsTable');
  if (!visits.length) {
    const empty = '<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:30px">لا توجد زيارات مسجلة</td></tr>';
    if (tb)      tb.innerHTML      = empty;
    if (archVis) archVis.innerHTML = empty;
    document.getElementById('visitProgress').innerHTML   = '<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px">لا توجد زيارات مسجلة</div>';
    document.getElementById('visitViolations').innerHTML = '<div style="text-align:center;color:var(--text3);padding:20px;font-size:13px">لا توجد مخالفات</div>';
    return;
  }

  const rows = visits.map(v => {
    const attachHtml = (v.attachments || []).map(id => {
      const f = files.find(x => x.id === id);
      if (!f) return '';
      const ext = (f.name || '').split('.').pop().toLowerCase();
      const icon = ext === 'pdf' ? '📄' : (['jpg','jpeg','png'].includes(ext) ? '🖼️' : '📁');
      return `<a href="${esc(f.data)}" target="_blank" style="margin-right:6px">${icon} ${esc(f.name)}</a>`;
    }).join('');

    return `
    <tr>
      <td class="td-mono">${esc(v.date) || '—'}</td>
      <td class="td-main">#${esc(v.contractId)}</td>
      <td>${esc((contracts.find(c => c.id === v.contractId) || {}).owner) || '—'}</td>
      <td><span class="tag info">${esc(v.stage)}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="progress-bar" style="width:80px"><div class="progress-fill ${v.pct>=70?'g':v.pct>=40?'a':'r'}" style="width:${v.pct}%"></div></div>
          <span style="font-family:var(--mono);font-size:12px">${v.pct}%</span>
        </div>
      </td>
      <td>${esc(v.engineer) || '—'}</td>
      <td>${v.violation ? `<span class="tag warn">⚠️ ${esc(v.violation)}</span>` : '<span style="color:var(--text3);font-size:12px">لا توجد</span>'}</td>
      <td style="font-size:12px;color:var(--text3)">${esc((v.notes || '').substring(0,40))}${attachHtml?'<div style="margin-top:6px">'+attachHtml+'</div>':''}</td>
    </tr>`;
  }).join('');
  if (tb)      tb.innerHTML      = rows;
  if (archVis) archVis.innerHTML = rows;

  // بطاقات نسبة الإنجاز
  const vp          = document.getElementById('visitProgress');
  const activeVisits = visits.filter(v => {
    const c = contracts.find(x => x.id === v.contractId);
    return c && c.status === 'نشط';
  }).slice(0, 5);
  if (!activeVisits.length) {
    vp.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px">لا توجد زيارات للعقود النشطة</div>';
  } else {
    vp.innerHTML = activeVisits.map(v => `
      <div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span style="color:var(--text2)">عقد #${esc(v.contractId)}</span>
          <span style="font-family:var(--mono)">${v.pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill ${v.pct>=70?'g':v.pct>=40?'a':'r'}" style="width:${v.pct}%"></div></div>
      </div>`).join('');
  }

  // المخالفات
  const viol = visits.filter(v => v.violation).slice(0, 4);
  const vv   = document.getElementById('visitViolations');
  if (!viol.length) {
    vv.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px">لا توجد مخالفات</div>';
  } else {
    vv.innerHTML = viol.map(v => `
      <div class="alert warn" style="margin-bottom:8px">
        <div>⚠️</div>
        <div><strong>عقد #${esc(v.contractId)}</strong> — ${esc(v.violation)}<br><span style="font-size:11px">${esc(v.date) || ''}</span></div>
      </div>`).join('');
  }
}

// ═══════════════════════════════════════════════
// FILTER & SORT
// ═══════════════════════════════════════════════
let sortField = 'id', sortDir = 1;
function sortBy(field) {
  if (sortField === field) sortDir *= -1;
  else { sortField = field; sortDir = 1; }
  renderContractsTable();
}
function filterContracts() { renderContractsTable(); }

function renderContractsTable() {
  const q      = (document.querySelector('#page-contracts .search-box input') || { value:'' }).value.toLowerCase();
  const status = (document.getElementById('fStatus') || { value:'' }).value;
  const type   = (document.getElementById('fType')   || { value:'' }).value;
  const eng    = (document.getElementById('fEng')    || { value:'' }).value;

  let list = contracts.filter(c => {
    if (q && !c.id.toLowerCase().includes(q) &&
             !(c.owner  || '').toLowerCase().includes(q) &&
             !(c.ownerId || '').toLowerCase().includes(q) &&
             !(c.location || '').toLowerCase().includes(q)) return false;
    if (status && c.status !== status) return false;
    if (type   && c.type   !== type)   return false;
    if (eng    && c.engName !== eng)   return false;
    return true;
  });

  list.sort((a, b) => {
    let av = a[sortField] || '', bv = b[sortField] || '';
    if (sortField === 'value') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });

  const tb = document.getElementById('contractsTable');
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:30px">لا توجد عقود مطابقة</td></tr>';
    return;
  }
  tb.innerHTML = list.map(c => {
    const paid     = (c.payments || []).reduce((s, p) => s + p.amount, 0);
    const pct      = c.value > 0 ? Math.round(paid / c.value * 100) : 0;
    const stCls    = { نشط:'active', مكتمل:'done', مجمّد:'frozen', منتهي:'ended' }[c.status] || 'info';
    const today    = new Date();
    const end      = c.end ? new Date(c.end) : null;
    const daysLeft = end ? Math.round((end - today) / 86400000) : null;
    const expWarn  = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
    const attachmentsHtml = (c.attachments || []).map(id => {
      const f = files.find(x => x.id === id);
      if (!f) return '';
      const ext = (f.name || '').split('.').pop().toLowerCase();
      const icon = ext === 'pdf' ? '📄' : (['jpg','jpeg','png'].includes(ext) ? '🖼️' : '📁');
      return `<a href="${esc(f.data)}" target="_blank" style="margin-right:6px;font-size:12px">${icon} ${esc(f.name)}</a>`;
    }).join('');

    return `<tr>
      <td class="td-main td-mono">#${esc(c.id)}</td>
      <td>
        <div style="font-weight:500">${esc(c.owner)}</div>
        ${attachmentsHtml ? `<div style="margin-top:6px">${attachmentsHtml}</div>` : ''}
        ${expWarn ? `<span class="tag warn" style="margin-top:2px">⏰ ينتهي بعد ${daysLeft} يوم</span>` : ''}
      </td>
      <td style="font-size:12px">${esc(c.phone) || '—'}</td>
      <td><span class="tag info">${esc(c.type)}</span></td>
      <td><span class="tag ${stCls}">${esc(c.status)}</span></td>
      <td style="font-size:12px">${esc(c.engName) || '—'}</td>
      <td class="td-mono">${fmt(c.value)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="progress-bar" style="width:60px"><div class="progress-fill ${pct>=80?'g':pct>=50?'a':'r'}" style="width:${pct}%"></div></div>
          <span style="font-size:11px;font-family:var(--mono)">${pct}%</span>
        </div>
      </td>
      <td style="font-size:12px;color:${expWarn?'var(--amber2)':'var(--text3)'}">${esc(c.end) || '—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="ghost" onclick="editContract('${esc(c.id)}')" data-tip="تعديل" style="padding:4px 6px">✏️</button>
          <button class="ghost" onclick="cloneContract('${esc(c.id)}')" data-tip="نسخ كقالب" style="padding:4px 6px">📋</button>
          <button class="ghost" onclick="deleteContract('${esc(c.id)}')" data-tip="حذف" style="padding:4px 6px;color:var(--red2)">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// ARCHIVE
// ═══════════════════════════════════════════════
function refreshArchive() {
  let archYear    = (document.getElementById('archYear') || {}).value || '';
  let archEng     = (document.getElementById('archEngFilter') || {}).value || '';
  let archType    = (document.getElementById('archTypeFilter') || {}).value || '';
  let archRegion  = (document.getElementById('archRegion') || {}).value || '';

  const af = (officeSettings && officeSettings.archiveFilters) ? officeSettings.archiveFilters : {};
  if (!archYear)   archYear   = af.year || '';
  if (!archEng)    archEng    = af.engineer || '';
  if (!archType)   archType   = af.type || '';
  if (!archRegion) archRegion = af.region || '';

  if (!officeSettings || typeof officeSettings !== 'object') officeSettings = {};
  officeSettings.archiveFilters = { year: archYear, engineer: archEng, type: archType, region: archRegion };
  saveData(false);

  const years = [...new Set(contracts.map(c => {
    const d = c.end ? new Date(c.end) : c.createdAt ? new Date(c.createdAt) : null;
    return d && !isNaN(d) ? d.getFullYear() : null;
  }).filter(Boolean))].sort((a, b) => b - a);
  const engs = [...new Set(contracts.map(c => c.engName).filter(Boolean))].sort();
  const regions = [...new Set(contracts.map(c => c.location).filter(Boolean))].sort();

  const yearSelect = document.getElementById('archYear');
  if (yearSelect) {
    yearSelect.innerHTML = '<option value="">كل السنوات</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
    if (archYear) yearSelect.value = archYear;
  }
  const engSelect = document.getElementById('archEngFilter');
  if (engSelect) {
    engSelect.innerHTML = '<option value="">كل المهندسين</option>' + engs.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join('');
    if (archEng) engSelect.value = archEng;
  }
  const regionSelect = document.getElementById('archRegion');
  if (regionSelect) {
    regionSelect.innerHTML = '<option value="">كل المناطق</option>' + regions.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
    if (archRegion) regionSelect.value = archRegion;
  }

  const archiveContracts = contracts.filter(c => {
    if (archYear) {
      const d = c.end ? new Date(c.end) : c.createdAt ? new Date(c.createdAt) : null;
      if (!d || isNaN(d) || String(d.getFullYear()) !== archYear) return false;
    }
    if (archEng && c.engName !== archEng) return false;
    if (archType && c.type !== archType) return false;
    if (archRegion && c.location !== archRegion) return false;
    return true;
  });

  const ended    = archiveContracts.filter(c => c.status === 'منتهي' || c.status === 'مكتمل');
  const totalVal  = archiveContracts.reduce((s, c) => s + (parseFloat(c.value) || 0), 0);
  const totalPaid = archiveContracts.reduce((s, c) => s + ((c.payments || []).reduce((a, p) => a + p.amount, 0)), 0);
  const uncollected = totalVal - totalPaid;
  const expLics = contracts.filter(c => c.licExpiry && daysUntil(c.licExpiry) <= 30 && daysUntil(c.licExpiry) >= 0).length;

  document.getElementById('arch-ended').textContent       = ended.length;
  document.getElementById('arch-totalval').textContent    = fmtShort(totalVal);
  document.getElementById('arch-collected').textContent   = fmtShort(totalPaid);
  document.getElementById('arch-uncollected').textContent = fmtShort(uncollected);
  document.getElementById('sc-archive').textContent       = archiveContracts.length + expLics;

  const tb = document.getElementById('archContractsTable');
  if (!archiveContracts.length) {
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:30px">لا توجد عقود مطابقة للفلتر</td></tr>';
  } else {
    tb.innerHTML = archiveContracts.map(c => {
      const paid   = (c.payments || []).reduce((s, p) => s + p.amount, 0);
      const remain = (parseFloat(c.value) || 0) - paid;
      const stCls  = { نشط:'active', مجمّد:'frozen', مكتمل:'done', منتهي:'ended' }[c.status] || 'info';
      const attachmentsHtml = (c.attachments || []).map(id => {
      const f = files.find(x => x.id === id);
      if (!f) return '';
      const ext = (f.name || '').split('.').pop().toLowerCase();
      const icon = ext === 'pdf' ? '📄' : (['jpg','jpeg','png'].includes(ext) ? '🖼️' : '📁');
      return `<a href="${esc(f.data)}" target="_blank" style="margin-right:6px;font-size:12px">${icon} ${esc(f.name)}</a>`;
    }).join('');
    const archiveActions = currentRole === 'admin' ? `
          <div style="display:flex;gap:4px;margin-top:4px">
            <button class="ghost" onclick="editContract('${esc(c.id)}')" data-tip="تعديل" style="padding:4px 6px;font-size:11px">✏️</button>
            <button class="ghost" onclick="reactivateContract('${esc(c.id)}')" data-tip="إعادة تفعيل" style="padding:4px 6px;color:var(--accent2);font-size:11px">♻️</button>
            <button class="ghost" onclick="deleteContract('${esc(c.id)}')" data-tip="حذف نهائي" style="padding:4px 6px;color:var(--red2);font-size:11px">🗑️</button>
          </div>` : '';

    return `<tr>
        <td class="td-main td-mono">#${esc(c.id)}</td>
        <td>
          ${esc(c.owner)}
          ${attachmentsHtml ? `<div style="margin-top:6px">${attachmentsHtml}</div>` : ''}
        </td>
        <td style="font-size:12px">${esc(c.location) || '—'}</td>
        <td><span class="tag info">${esc(c.type)}</span></td>
        <td style="font-size:12px">${esc(c.engName) || '—'}</td>
        <td class="td-mono">${fmt(c.value)}</td>
        <td class="td-mono" style="color:var(--accent2)">${fmt(paid)}</td>
        <td class="td-mono" style="color:${remain>0?'var(--red2)':'var(--text3)'}">${fmt(remain)}</td>
        <td style="font-size:12px">${esc(c.end) || '—'}</td>
        <td>
          <span class="tag ${stCls}" style="font-size:11px;padding:3px 8px;white-space:nowrap">${esc(c.status)}</span>
          ${archiveActions}
        </td>
      </tr>`;
    }).join('');
  }

  // الرخص
  const licContainer = document.getElementById('licensesContainer');
  const lics = contracts.filter(c => c.licExpiry).map(c => ({ ...c, days: daysUntil(c.licExpiry) }));
  lics.sort((a, b) => a.days - b.days);
  if (!lics.length) {
    licContainer.innerHTML = '<div style="text-align:center;color:var(--text3);padding:40px">لا توجد رخص مسجلة</div>';
  } else {
    licContainer.innerHTML = lics.map(c => {
      const cls   = c.days < 0 ? 'danger' : c.days <= 7 ? 'danger' : c.days <= 30 ? 'warn' : 'success';
      const clr   = c.days < 0 ? 'var(--red2)' : c.days <= 7 ? 'var(--red2)' : c.days <= 30 ? 'var(--amber2)' : 'var(--accent2)';
      const pct   = Math.max(0, Math.min(100, (365 - c.days) / 365 * 100));
      const label = c.days < 0 ? 'منتهية' : c.days <= 7 ? 'عاجل' : c.days <= 30 ? 'قريباً' : 'سارية';
      return `
      <div class="card" style="margin-bottom:10px;border-right:3px solid ${clr}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-weight:600;font-size:13px">#${esc(c.id)} — ${esc(c.owner)}</div>
            <div style="font-size:11px;color:var(--text3)">رخصة: ${esc(c.buildLic) || '—'} | تنتهي: ${esc(c.licExpiry)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span class="tag ${cls}">${label}</span>
            <span style="font-size:12px;color:${clr};font-family:var(--mono)">${c.days < 0 ? 'منتهية منذ ' + Math.abs(c.days) + ' يوم' : c.days + ' يوم متبقي'}</span>
          </div>
        </div>
        <div class="lic-bar"><div class="lic-fill" style="width:${pct}%;background:${clr}"></div></div>
        <div style="margin-top:8px">
          <button onclick="openRenewLicenseModal('${esc(c.id)}')" style="font-size:11px;padding:4px 10px">🔄 تجديد الرخصة</button>
        </div>
      </div>`;
    }).join('');
  }

  // تعبئة الفلاتر
  const archReg = document.getElementById('archRegion');
  if (archReg) archReg.innerHTML = '<option value="">كل المناطق</option>' + regions.map(r => `<option>${esc(r)}</option>`).join('');
  renderCentralArchive();
}

function renderCentralArchive() {
  const filter = ((document.getElementById('arch-docs-search') || {}).value || '').toLowerCase().trim();
  const type   = ((document.getElementById('arch-docs-type') || {}).value || '');
  const listEl = document.getElementById('centralDocsList');
  if (!listEl) return;

  const typeMap = {
    'رخصة': ['general'],
    'مخططات': ['drawing'],
    'صور': ['photo_before','photo_after'],
    'مراسلات': ['general'],
    'أخرى': ['general','contract'],
    'عقد': ['contract']
  };
  const docs = files.filter(f => {
    const title = (f.name || '').toLowerCase();
    if (type && type !== 'كل الأنواع') {
      const allowed = typeMap[type] || [type];
      if (!allowed.includes(f.fileType)) return false;
    }
    if (filter && !title.includes(filter) && !((f.contractId || '').toLowerCase().includes(filter))) return false;
    return true;
  });

  if (!docs.length) {
    listEl.innerHTML = '<div style="text-align:center;color:var(--text3);padding:40px;font-size:13px">لا توجد مستندات تطابق البحث</div>';
    return;
  }

  listEl.innerHTML = docs.map(doc => `
    <div class="card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:600">${esc(doc.name)}</div>
        <div style="font-size:12px;color:var(--text3)">العقد: ${esc(doc.contractId || 'عام')} — ${esc(doc.fileType || 'عام')}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="ghost" onclick="viewFile('${esc(doc.id)}')">عرض</button>
        <button class="ghost" onclick="deleteFile('${esc(doc.id)}')" style="color:var(--red2)">حذف</button>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════
// ENGINEERS MANAGEMENT
// ═══════════════════════════════════════════════
function renderEngineerSelect() {
  const sel = document.getElementById('f-eng-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">اختر مهندساً</option>' + engineers.map(e => `<option value="${esc(e.name)}">${esc(e.name)} — ${esc(e.specialty||'')}</option>`).join('');
}

function renderEngineersTable() {
  const el = document.getElementById('engineersTable');
  if (!el) return;
  if (!engineers.length) {
    el.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:30px">لا توجد مهندسين مسجلين</td></tr>';
    return;
  }
  el.innerHTML = engineers.map((en, i) => `
    <tr>
      <td class="td-mono">${esc(en.id)}</td>
      <td>${esc(en.name)}</td>
      <td>${esc(en.specialty||'—')}</td>
      <td>${esc(en.phone||'—')}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="ghost" onclick="editEngineer('${esc(en.id)}')">✏️</button>
          <button class="ghost" onclick="deleteEngineer('${esc(en.id)}')" style="color:var(--red2)">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

function openNewEngineer() {
  document.getElementById('engineerModalTitle').textContent = '➕ إضافة مهندس جديد';
  document.getElementById('e-id').value = 'ENG-' + Date.now().toString().slice(-6);
  document.getElementById('e-name').value = '';
  document.getElementById('e-specialty').value = '';
  document.getElementById('e-phone').value = '';
  document.getElementById('e-idnum').value = '';
  document.getElementById('e-reg').value = '';
  document.getElementById('engineerModal').classList.add('open');
}

function editEngineer(id) {
  const en = engineers.find(x => x.id === id);
  if (!en) return;
  document.getElementById('engineerModalTitle').textContent = '✏️ تعديل بيانات المهندس';
  document.getElementById('e-id').value = en.id;
  document.getElementById('e-name').value = en.name;
  document.getElementById('e-specialty').value = en.specialty || '';
  document.getElementById('e-phone').value = en.phone || '';
  document.getElementById('e-idnum').value = en.idNumber || '';
  document.getElementById('e-reg').value = en.regNumber || '';
  document.getElementById('engineerModal').classList.add('open');
}

function saveEngineer() {
  const id = document.getElementById('e-id').value.trim();
  const name = document.getElementById('e-name').value.trim();
  if (!id || !name) { showToast('⚠️ رقم السجل واسم المهندس مطلوبان', 'warn'); return; }
  const idx = engineers.findIndex(x => x.id === id);
  const obj = {
    id, name, specialty: document.getElementById('e-specialty').value.trim(),
    phone: document.getElementById('e-phone').value.trim(),
    idNumber: document.getElementById('e-idnum').value.trim(),
    regNumber: document.getElementById('e-reg').value.trim()
  };
  if (idx >= 0) engineers[idx] = obj; else engineers.push(obj);
  saveData();
  renderEngineersTable();
  renderEngineerSelect();
  closeModal('engineerModal');
  showToast('✅ تم حفظ بيانات المهندس');
}

function deleteEngineer(id) {
  showConfirm('حذف مهندس', 'هل أنت متأكد من حذف هذا المهندس؟', () => {
    engineers = engineers.filter(e => e.id !== id);
    saveData();
    renderEngineersTable();
    renderEngineerSelect();
    showToast('🗑️ تم حذف المهندس');
  });
}

function openRenewLicenseModal(id) {
  const c = contracts.find(x => x.id === id);
  if (!c) return;
  document.getElementById('rl-contractId').value = id;
  document.getElementById('rl-date').value       = c.licExpiry || '';
  document.getElementById('renewLicModal').classList.add('open');
}

function saveRenewLicense() {
  const id      = document.getElementById('rl-contractId').value;
  const newDate = document.getElementById('rl-date').value;
  if (!newDate) { showToast('⚠️ اختر تاريخ الانتهاء الجديد', 'warn'); return; }
  const c = contracts.find(x => x.id === id);
  if (!c) return;
  c.licExpiry = newDate;
  addAudit('edit', `تجديد رخصة البناء للعقد #${id} — حتى ${newDate}`);
  saveData(); refreshArchive();
  buildNotifications();
  closeModal('renewLicModal');
  showToast('✅ تم تجديد الرخصة');
}

// ═══════════════════════════════════════════════
// تصدير الأرشيف — مكتمل
// ═══════════════════════════════════════════════
function exportArchive() {
  const ended = contracts.filter(c => c.status === 'منتهي' || c.status === 'مكتمل');
  if (!ended.length) { showToast('⚠️ لا توجد عقود في الأرشيف', 'warn'); return; }

  const rows = [['رقم العقد','المالك','الحالة','النوع','المهندس','القيمة','المحصّل','المتبقي','تاريخ النهاية']];
  ended.forEach(c => {
    const paid   = (c.payments || []).reduce((s, p) => s + p.amount, 0);
    const remain = (parseFloat(c.value) || 0) - paid;
    rows.push([c.id, c.owner, c.status, c.type, c.engName || '', c.value, paid, remain, c.end || '']);
  });

  const csv  = rows.map(r => r.map(v => `"${String(v != null ? v : '').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `almuheet-archive-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  addAudit('export', 'تصدير أرشيف العقود CSV');
  showToast('✅ تم تصدير الأرشيف');
}

// ═══════════════════════════════════════════════
// PAYMENTS PAGE
// ═══════════════════════════════════════════════
function refreshPayments() {
  const allPays = [];
  contracts.forEach(c => {
    (c.payments || []).forEach(p => allPays.push({ ...p, contractId:c.id, owner:c.owner, contractEnd:c.end }));
  });
  allPays.sort((a, b) => new Date(b.date) - new Date(a.date));

  const payContract = (document.getElementById('payFilter') || { value:'' }).value;
  const payMonth    = (document.getElementById('payMonth')  || { value:'' }).value;
  const monthNames  = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  const filteredPays = allPays.filter(p => {
    if (payContract && p.contractId !== payContract) return false;
    if (payMonth) {
      if (!p.date) return false;
      const idx = new Date(p.date).getMonth();
      if (monthNames[idx] !== payMonth) return false;
    }
    return true;
  });

  const today = new Date();
  let a30 = 0, a60 = 0, a90 = 0, a90p = 0;
  contracts.filter(c => c.status === 'نشط').forEach(c => {
    const paid   = (c.payments || []).reduce((s, p) => s + p.amount, 0);
    const remain = (parseFloat(c.value) || 0) - paid;
    if (remain <= 0) return;
    const end = c.end ? new Date(c.end) : null;
    if (!end) return;
    const age = Math.round((today - end) / 86400000);
    if      (age <= 30) a30  += remain;
    else if (age <= 60) a60  += remain;
    else if (age <= 90) a90  += remain;
    else                a90p += remain;
  });
  document.getElementById('aging-30').textContent  = fmtShort(a30);
  document.getElementById('aging-60').textContent  = fmtShort(a60);
  document.getElementById('aging-90').textContent  = fmtShort(a90);
  document.getElementById('aging-90p').textContent = fmtShort(a90p);

  const tb = document.getElementById('paymentsTable');
  if (!filteredPays.length) {
    tb.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:30px">لا توجد دفعات مسجلة</td></tr>';
    return;
  }
  tb.innerHTML = filteredPays.map(p => {
    const age    = p.date ? Math.round((today - new Date(p.date)) / 86400000) : null;
    const ageLbl = age === null ? '—'
      : age <= 30  ? `<span class="aging-label aging-ok">${age}د</span>`
      : age <= 60  ? `<span class="aging-label aging-warn">${age}د</span>`
      : age <= 90  ? `<span class="aging-label aging-late">${age}د</span>`
      :              `<span class="aging-label aging-danger">${age}د</span>`;
    return `<tr>
      <td class="td-mono">#${esc(p.contractId)}</td>
      <td class="td-main">${esc(p.owner)}</td>
      <td class="td-mono" style="color:var(--accent2)">${fmt(p.amount)}</td>
      <td style="font-size:12px">${esc(p.date) || '—'}</td>
      <td><span class="tag info">${esc(p.type)}</span></td>
      <td style="font-size:12px;font-family:var(--mono)">${esc(p.ref) || '—'}</td>
      <td>${ageLbl}</td>
      <td><button class="ghost" style="font-size:11px" onclick="editContract('${esc(p.contractId)}')">✏️ العقد</button></td>
    </tr>`;
  }).join('');

  // تعبئة فلتر العقود
  const pf = document.getElementById('payFilter');
  if (pf) {
    pf.innerHTML = '<option value="">كل العقود</option>' +
      contracts.map(c => `<option value="${esc(c.id)}">#${esc(c.id)} — ${esc(c.owner)}</option>`).join('');
  }
}

// ═══════════════════════════════════════════════
// DASHBOARD REFRESH
// ═══════════════════════════════════════════════
function refreshAll() {
  const total     = contracts.length;
  const totalVal  = contracts.reduce((s, c) => s + (parseFloat(c.value) || 0), 0);
  const totalPaid = contracts.reduce((s, c) => s + ((c.payments || []).reduce((a, p) => a + p.amount, 0)), 0);
  const remain    = totalVal - totalPaid;
  const pct       = totalVal > 0 ? Math.round(totalPaid / totalVal * 100) : 0;
  const today     = new Date();
  const late      = contracts.filter(c => c.status === 'نشط' && c.end && new Date(c.end) < today).length;
  const expiring  = contracts.filter(c => c.status === 'نشط' && c.end && daysUntil(c.end) <= 30 && daysUntil(c.end) >= 0).length;
  const doneMo    = contracts.filter(c => c.status === 'مكتمل' && c.end && new Date(c.end).getMonth() === today.getMonth()).length;

  document.getElementById('kpi-total').textContent     = total;
  document.getElementById('kpi-value').textContent     = fmtShort(totalVal);
  document.getElementById('kpi-collected').textContent = fmtShort(totalPaid);
  document.getElementById('kpi-pct').textContent       = pct;
  document.getElementById('kpi-remain').textContent    = fmtShort(remain);
  document.getElementById('kpi-late').textContent      = late;

  document.getElementById('td-visits').textContent    = visits.filter(v => v.date === today.toISOString().split('T')[0]).length;
  document.getElementById('td-payments').textContent  = contracts.reduce((s, c) => s + ((c.payments || []).filter(p => {
    const d = new Date(p.date); const now = new Date(); const week = new Date(); week.setDate(now.getDate() - 7);
    return d >= week && d <= now;
  }).length), 0);
  document.getElementById('td-expiring').textContent  = expiring;
  document.getElementById('td-done').textContent      = doneMo;

  const noVisit = contracts.filter(c => {
    if (c.status !== 'نشط') return false;
    const cv = visits.filter(v => v.contractId === c.id);
    if (!cv.length) return true;
    const lastVisitTime = Math.max(...cv.map(v => new Date(v.date).getTime()));
    if (!isFinite(lastVisitTime)) return true;
    const last = new Date(lastVisitTime);
    return Math.round((today - last) / 86400000) > 30;
  }).length;
  document.getElementById('td-novisit').textContent = noVisit;
  refreshSidebarCounts();

  // إحصاء الحالات
  const sc = { نشط:0, مكتمل:0, مجمّد:0, منتهي:0 };
  contracts.forEach(c => sc[c.status] = (sc[c.status] || 0) + 1);
  ['active','done','frozen','ended'].forEach((k, i) => {
    const statuses = ['نشط','مكتمل','مجمّد','منتهي'];
    const cnt      = sc[statuses[i]] || 0;
    document.getElementById('st-' + k).textContent        = cnt;
    document.getElementById('sp-' + k).style.width        = total > 0 ? Math.round(cnt / total * 100) + '%' : '0%';
  });

  // التنبيهات
  const alerts = [];
  if (late     > 0) alerts.push(`<div class="alert danger"><div>⚠️</div><div><strong>${late} عقد</strong> تجاوزت تاريخ الانتهاء</div></div>`);
  if (expiring > 0) alerts.push(`<div class="alert warn"><div>⏰</div><div><strong>${expiring} عقد</strong> تنتهي خلال 30 يوماً</div></div>`);
  if (noVisit  > 0) alerts.push(`<div class="alert warn"><div>🚧</div><div><strong>${noVisit} عقد</strong> لم تُزَر منذ أكثر من 30 يوماً</div></div>`);
  const licWarn = contracts.filter(c => c.licExpiry && daysUntil(c.licExpiry) <= 30 && daysUntil(c.licExpiry) >= 0).length;
  if (licWarn  > 0) alerts.push(`<div class="alert warn"><div>📄</div><div><strong>${licWarn} رخصة بناء</strong> تنتهي قريباً</div></div>`);
  document.getElementById('dashAlerts').innerHTML = alerts.join('');
  try { renderEngineerSelect(); } catch(e) { /* ignore */ }
  refreshSidebarCounts();

  // أحدث العقود
  const recent = [...contracts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
  const rtb    = document.getElementById('recentContracts');
  if (!recent.length) {
    rtb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">لا توجد عقود بعد</td></tr>';
  } else {
    rtb.innerHTML = recent.map(c => {
      const paid  = (c.payments || []).reduce((s, p) => s + p.amount, 0);
      const p2    = c.value > 0 ? Math.round(paid / c.value * 100) : 0;
      const stCls = { نشط:'active', مكتمل:'done', مجمّد:'frozen', منتهي:'ended' }[c.status] || 'info';
      return `
        <tr>
          <td class="td-main td-mono">#${esc(c.id)}</td>
          <td>${esc(c.owner)}</td>
          <td><span class="tag ${stCls}">${esc(c.status)}</span></td>
          <td>${esc(c.engName) || '—'}</td>
          <td class="td-mono">${fmtShort(paid)} / ${fmtShort(c.value)}</td>
          <td>${esc(c.end) || '—'}</td>
        </tr>`;
    }).join('');
  }
}

function refreshSidebarCounts() {
  const contractEl = document.getElementById('sc-contracts');
  if (contractEl) contractEl.textContent = contracts.length;
  const visitsEl = document.getElementById('sc-visits');
  if (visitsEl) visitsEl.textContent = visits.length;
  const invoicesEl = document.getElementById('sc-invoices');
  if (invoicesEl) invoicesEl.textContent = invoices.length;
  const filesEl = document.getElementById('sc-files');
  if (filesEl) filesEl.textContent = files.length;
}

// ═══════════════════════════════════════════════
// الرسم البياني الشهري (ديناميكي)
// ═══════════════════════════════════════════════
function updateMonthlyChart() {
  const monthlyData = new Array(12).fill(0);
  const curYear     = new Date().getFullYear();
  contracts.forEach(c => {
    (c.payments || []).forEach(p => {
      if (!p.date) return;
      const d = new Date(p.date);
      if (d.getFullYear() === curYear) monthlyData[d.getMonth()] += p.amount;
    });
  });
  const maxVal = Math.max(...monthlyData, 1);
  const months = ['ي','ف','م','أ','م','ي','ي','أ','س','أ','ن','د'];
  const curMonth = new Date().getMonth();

  const chart = document.getElementById('monthlyChart');
  if (!chart) return;
  chart.innerHTML = monthlyData.map((v, i) => {
    const h   = Math.round(v / maxVal * 100);
    const isCur = (i === curMonth);
    return `<div class="spark-bar ${isCur?'highlight':''}" style="height:${Math.max(h,3)}%" title="${months[i]}: ${fmt(v)} ر.ق"></div>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════
function genReport(type) {
  window.currentReportType = type;
  const el    = document.getElementById('reportOutput');
  el.style.display = 'block';
  const today = new Date();
  const label = { monthly:'الشهري', quarterly:'ربع السنوي', yearly:'السنوي', engineers:'أداء المهندسين', clients:'تحليل العملاء', aging:'عمر الديون' }[type];

  let html = `<div class="card"><div class="card-header"><div class="card-title">📊 التقرير ${label} — ${today.toLocaleDateString('ar-QA')}</div><div><button onclick="window.print()" style="font-size:12px">🖨️ طباعة</button></div></div>`;

  if (type === 'engineers') {
    const engs = {};
    contracts.forEach(c => {
      if (!c.engName) return;
      if (!engs[c.engName]) engs[c.engName] = { contracts:0, value:0, paid:0, visits:0 };
      engs[c.engName].contracts++;
      engs[c.engName].value += parseFloat(c.value) || 0;
      engs[c.engName].paid  += (c.payments || []).reduce((s, p) => s + p.amount, 0);
    });
    visits.forEach(v => {
      const c = contracts.find(x => x.id === v.contractId);
      if (c && c.engName && engs[c.engName]) engs[c.engName].visits++;
    });
    html += '<table style="width:100%"><thead><tr><th>المهندس</th><th>العقود</th><th>الزيارات</th><th>إجمالي القيمة</th><th>المحصّل</th><th>نسبة التحصيل</th></tr></thead><tbody>';
    Object.entries(engs).forEach(([name, d]) => {
      const p = d.value > 0 ? Math.round(d.paid / d.value * 100) : 0;
      html += `<tr><td class="td-main">${esc(name)}</td><td>${d.contracts}</td><td>${d.visits}</td><td class="td-mono">${fmt(d.value)}</td><td class="td-mono" style="color:var(--accent2)">${fmt(d.paid)}</td><td><div style="display:flex;align-items:center;gap:6px"><div class="progress-bar" style="width:80px"><div class="progress-fill ${p>=70?'g':'a'}" style="width:${p}%"></div></div><span style="font-size:12px;font-family:var(--mono)">${p}%</span></div></td></tr>`;
    });
    html += '</tbody></table>';
  } else if (type === 'clients') {
    html += '<table style="width:100%"><thead><tr><th>المالك</th><th>العقود</th><th>إجمالي القيمة</th><th>المحصّل</th><th>معدل الدفع</th></tr></thead><tbody>';
    const clients = {};
    contracts.forEach(c => {
      if (!clients[c.owner]) clients[c.owner] = { count:0, value:0, paid:0 };
      clients[c.owner].count++;
      clients[c.owner].value += parseFloat(c.value) || 0;
      clients[c.owner].paid  += (c.payments || []).reduce((s, p) => s + p.amount, 0);
    });
    Object.entries(clients).sort((a, b) => b[1].value - a[1].value).forEach(([name, d]) => {
      const p = d.value > 0 ? Math.round(d.paid / d.value * 100) : 0;
      html += `<tr><td class="td-main">${esc(name)}</td><td>${d.count}</td><td class="td-mono">${fmt(d.value)}</td><td class="td-mono" style="color:var(--accent2)">${fmt(d.paid)}</td><td><span style="font-family:var(--mono)">${p}%</span></td></tr>`;
    });
    html += '</tbody></table>';
  } else {
    const totalVal  = contracts.reduce((s, c) => s + (parseFloat(c.value) || 0), 0);
    const totalPaid = contracts.reduce((s, c) => s + ((c.payments || []).reduce((a, p) => a + p.amount, 0)), 0);
    html += `
      <div class="kpi-grid" style="margin-bottom:14px">
        <div class="kpi-card g"><div class="kpi-label">إجمالي العقود</div><div class="kpi-val">${contracts.length}</div></div>
        <div class="kpi-card b"><div class="kpi-label">إجمالي القيمة</div><div class="kpi-val">${fmtShort(totalVal)}</div><div class="kpi-sub">ر.ق</div></div>
        <div class="kpi-card a"><div class="kpi-label">المحصّل</div><div class="kpi-val">${fmtShort(totalPaid)}</div><div class="kpi-sub">ر.ق</div></div>
        <div class="kpi-card r"><div class="kpi-label">المتبقي</div><div class="kpi-val">${fmtShort(totalVal - totalPaid)}</div><div class="kpi-sub">ر.ق</div></div>
      </div>`;
  }
  html += '</div>';
  el.innerHTML = html;
  addAudit('export', `توليد التقرير ${label}`);
  showToast('✅ تم توليد التقرير');
}

function exportReportCsv() {
  const type = window.currentReportType || 'monthly';
  const rows = [];
  if (type === 'engineers') {
    rows.push(['المهندس','العقود','الزيارات','إجمالي القيمة','المحصّل','نسبة التحصيل']);
    const engs = {};
    contracts.forEach(c => {
      if (!c.engName) return;
      if (!engs[c.engName]) engs[c.engName] = { contracts:0, value:0, paid:0, visits:0 };
      engs[c.engName].contracts++;
      engs[c.engName].value += parseFloat(c.value) || 0;
      engs[c.engName].paid  += (c.payments || []).reduce((s, p) => s + p.amount, 0);
    });
    visits.forEach(v => {
      const c = contracts.find(x => x.id === v.contractId);
      if (c && c.engName && engs[c.engName]) engs[c.engName].visits++;
    });
    Object.entries(engs).forEach(([name, d]) => {
      const p = d.value > 0 ? Math.round(d.paid / d.value * 100) : 0;
      rows.push([name, d.contracts, d.visits, d.value, d.paid, `${p}%`]);
    });
  } else {
    rows.push(['رقم العقد','المالك','الحالة','النوع','قيمة العقد','المحصّل','المتبقي','تاريخ النهاية']);
    contracts.forEach(c => {
      const paid = (c.payments || []).reduce((s, p) => s + p.amount, 0);
      rows.push([c.id, c.owner, c.status, c.type, c.value, paid, (parseFloat(c.value) || 0) - paid, c.end || '']);
    });
  }
  const csv  = rows.map(r => r.map(v => `"${String(v != null ? v : '').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `report-${type}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  addAudit('export', `تصدير CSV للتقرير ${type}`);
  showToast('✅ تم تصدير التقرير CSV');
}

// ═══════════════════════════════════════════════
// تصدير سجل النشاط — مكتمل
// ═══════════════════════════════════════════════
function exportAudit() {
  if (!hasPermission('audit.export')) { showToast('⛔ لا تملك صلاحية تصدير السجل', 'warn'); return; }
  if (!auditLogs.length) { showToast('⚠️ السجل فارغ', 'warn'); return; }

  const rows = [['الوقت','المستخدم','النوع','التفاصيل']];
  auditLogs.forEach(l => {
    rows.push([new Date(l.time).toLocaleString('en-US'), l.user, l.type, l.msg]);
  });
  const csv  = rows.map(r => r.map(v => `"${String(v != null ? v : '').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  addAudit('export', 'تصدير سجل النشاط CSV');
  showToast('✅ تم تصدير سجل النشاط');
}

// ═══════════════════════════════════════════════
// طباعة التعهد — مكتمل
// ═══════════════════════════════════════════════
function printPledge() {
  const id    = editingId || document.getElementById('f-id').value.trim();
  const owner = document.getElementById('f-owner').value.trim();
  const req   = document.getElementById('tpl-req').value.trim();
  const area  = document.getElementById('tpl-area').value.trim();
  const plot  = document.getElementById('tpl-plot').value.trim();
  const comp  = document.getElementById('tpl-comp').value.trim();
  const lic   = document.getElementById('f-buildLic').value.trim();
  const engEl = document.getElementById('f-eng-select');
  const eng   = (engEl && engEl.value) ? engEl.value.trim() : (document.getElementById('f-engName') ? document.getElementById('f-engName').value.trim() : '');
  const engReg = document.getElementById('f-engReg').value.trim();

  const w = window.open('', '_blank', 'width=800,height=700');
  w.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8">
<title>تعهد إشراف — عقد #${id}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 40px; font-size: 14px; line-height: 1.8; color: #000; }
  h2   { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 24px; }
  .row { display: flex; gap: 30px; margin-bottom: 12px; }
  .lbl { font-weight: bold; min-width: 160px; }
  .val { border-bottom: 1px solid #555; flex: 1; }
  .sign { margin-top: 60px; display: flex; justify-content: space-between; }
  .sign div { text-align: center; }
  @media print { button { display: none; } }
</style></head>
<body>
<h2>المحيط للاستشارات الهندسية<br><small>تعهد إشراف هندسي</small></h2>
<div class="row"><span class="lbl">رقم طلب البناء:</span><span class="val">${req || '.............'}</span></div>
<div class="row"><span class="lbl">رقم رخصة البناء:</span><span class="val">${lic || '.............'}</span></div>
<div class="row"><span class="lbl">اسم المنطقة:</span><span class="val">${area || '.............'}</span></div>
<div class="row"><span class="lbl">رقم مخطط الملكية:</span><span class="val">${plot || '.............'}</span></div>
<div class="row"><span class="lbl">اسم مالك العقار:</span><span class="val">${owner || '.............'}</span></div>
<div class="row"><span class="lbl">مكونات المبنى:</span><span class="val">${comp || '.............'}</span></div>
<div class="row"><span class="lbl">المهندس المشرف:</span><span class="val">${eng || '.............'}</span></div>
<div class="row"><span class="lbl">رقم القيد المهني:</span><span class="val">${engReg || '.............'}</span></div>
<p style="margin-top:30px;text-align:justify">
  أتعهد أنا المهندس المذكور أعلاه بالإشراف الهندسي الكامل على تنفيذ المبنى وفق المخططات المعتمدة
  والاشتراطات البنائية المعمول بها في دولة قطر، والتحقق من مطابقة جميع مراحل البناء للمعايير الفنية المقررة.
</p>
<div class="sign">
  <div><div>توقيع المهندس</div><br>_______________</div>
  <div><div>ختم المكتب</div><br>_______________</div>
  <div><div>التاريخ</div><br>_______________</div>
</div>
<br><center><button onclick="window.print()">🖨️ طباعة</button></center>
</body></html>`);
  w.document.close();
  addAudit('export', `طباعة تعهد العقد #${id}`);
}

// ═══════════════════════════════════════════════
// حفظ الإعدادات — مكتمل
// ═══════════════════════════════════════════════
function saveSettings() {
  const nameAr  = document.getElementById('set-nameAr') ? document.getElementById('set-nameAr').value   : '';
  const nameEn  = document.getElementById('set-nameEn') ? document.getElementById('set-nameEn').value   : '';
  const licNo   = document.getElementById('set-licNo')  ? document.getElementById('set-licNo').value    : '';
  const phones  = document.getElementById('set-phones') ? document.getElementById('set-phones').value   : '';

  const settings = { nameAr, nameEn, licNo, phones };
  officeSettings = settings;
  saveData();
  showToast('✅ تم حفظ إعدادات المكتب');
}

function loadSettings() {
  const s = (officeSettings && Object.keys(officeSettings).length) ? officeSettings : {};
  if (!officeSettings || !Object.keys(officeSettings).length) officeSettings = s;
  if (document.getElementById('set-nameAr') && typeof s.nameAr !== 'undefined') document.getElementById('set-nameAr').value = s.nameAr;
  if (document.getElementById('set-nameEn') && typeof s.nameEn !== 'undefined') document.getElementById('set-nameEn').value = s.nameEn;
  if (document.getElementById('set-licNo') && typeof s.licNo !== 'undefined')  document.getElementById('set-licNo').value  = s.licNo;
  if (document.getElementById('set-phones') && typeof s.phones !== 'undefined') document.getElementById('set-phones').value = s.phones;
  // Apply UI preferences if present in cloud-backed officeSettings
  if (s.theme) document.documentElement.setAttribute('data-theme', s.theme);
  if (s.appLang) setLanguage(s.appLang);
  if (typeof s.cloudForceEnable !== 'undefined') {
    cloudForceEnable = !!s.cloudForceEnable;
    const cfEl = document.getElementById('cloudForce');
    if (cfEl) cfEl.checked = cloudForceEnable;
  }
  if (s.archiveFilters && typeof s.archiveFilters === 'object') {
    if (document.getElementById('archYear')) document.getElementById('archYear').value = s.archiveFilters.year || '';
    if (document.getElementById('archEngFilter')) document.getElementById('archEngFilter').value = s.archiveFilters.engineer || '';
    if (document.getElementById('archType')) document.getElementById('archType').value = s.archiveFilters.type || '';
    if (document.getElementById('archRegion')) document.getElementById('archRegion').value = s.archiveFilters.region || '';
  }
}

// ═══════════════════════════════════════════════
// CLOUD — Supabase
// ═══════════════════════════════════════════════
function setCloudStatus(text, colorVar = 'var(--text3)') {
  const el = document.getElementById('cloudStatus');
  if (!el) return;
  el.textContent  = text;
  el.style.color  = colorVar;
}

async function initCloud() {
  try {
    if (!window.supabase) {
      setCloudStatus('☁️ غير متصل');
      return;
    }
    if (!navigator.onLine) {
      setCloudStatus('☁️ غير متصل بالإنترنت', 'var(--amber2)');
      return;
    }
    // Probe Supabase URL in case a browser extension blocks it
    async function probeSupabase(timeout = 2000) {
      try {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), timeout);
        const probeUrl = `${supabaseConfig.url}/rest/v1/`;
        const res = await fetch(probeUrl, { method: 'HEAD', mode: 'cors', cache: 'no-store', signal: ctrl.signal });
        clearTimeout(id);
        return res.ok || res.status === 401 || res.status === 403;
      } catch (e) {
        return false;
      }
    }
    // إذا تم تمكين التجاوز يدوياً، تخطّي الفحص
    if (!cloudForceEnable) {
      const probeOk = await probeSupabase();
      if (!probeOk) {
        cloudReady = false;
        setCloudStatus('☁️ محظور محلياً (إضافات)', 'var(--amber2)');
        console.warn('Supabase domain appears blocked by client/extensions. Cloud disabled.');
        return;
      }
    }
    supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.key);
    cloudReady = true;
    setCloudStatus('☁️ جاري التوثيق...', 'var(--amber2)');
  } catch (err) {
    cloudReady = false;
    setCloudStatus('☁️ خطأ اتصال', 'var(--red2)');
  }
}

async function initCloudAuth() {
  if (!cloudReady || !supabaseClient) {
    console.error('Supabase not ready');
    setCloudStatus('☁️ غير متاح', 'var(--text3)');
    return;
  }
  try {
    const { data, error } = await supabaseClient.from('users').select('username').limit(1);
    if (error) throw error;
    cloudAuthReady = true;
    setCloudStatus('☁️ مصادق', 'var(--accent2)');
    syncCloudRolePasswords();
    if (pendingCloudSave) {
      pendingCloudSave = false;
      queueCloudSave();
    }
  } catch (err) {
    cloudAuthReady = false;
    console.error('Supabase auth error:', err);
    setCloudStatus('☁️ فشل التوثيق - تحقق من مفتاح Supabase', 'var(--amber2)');
    // الاستمرار بالعمل محلياً إذا فشلت المصادقة
  }
}

function formatSupabaseError(err) {
  if (!err) return '';
  const parts = [];
  if (err.message) parts.push(err.message);
  if (err.details) parts.push(err.details);
  if (err.hint)    parts.push(err.hint);
  if (err.code)    parts.push(`code=${err.code}`);
  return parts.join(' | ');
}

function getSupabaseMissingColumns(err) {
  if (!err || !err.message) return [];
  const missing = [];
  const regex = /Could not find the '([^']+)' column/g;
  let match;
  while ((match = regex.exec(err.message)) !== null) {
    missing.push(match[1]);
  }
  return missing;
}

async function fetchCloudUserByCredentials({ username = null, role = null, passwordHash }) {
  if (!supabaseClient || !cloudAuthReady || !passwordHash) return null;
  try {
    let query = supabaseClient.from('users').select('*');
    if (username) query = query.eq('username', username.toLowerCase());
    if (role)     query = query.eq('role', role);
    query = query.eq('password', passwordHash).limit(1);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch (err) {
    console.error('fetchCloudUserByCredentials error', formatSupabaseError(err), err);
    return null;
  }
}

async function upsertOrUpdateRow(table, match, row) {
  const { data: existing, error: selectError } = await supabaseClient.from(table).select('*').match(match).maybeSingle();
  if (selectError) throw selectError;

  if (existing) {
    const supportedKeys = new Set(Object.keys(existing));
    const cleaned = Object.keys(row).reduce((acc, key) => {
      if (supportedKeys.has(key)) acc[key] = row[key];
      return acc;
    }, {});
    if (Object.keys(cleaned).length === 0) {
      // No supported fields to update, nothing to do.
      return;
    }
    const result = await supabaseClient.from(table).update(cleaned).match(match);
    if (!result.error) return;
    const missing = getSupabaseMissingColumns(result.error);
    if (!missing.length) throw result.error;
    missing.forEach(col => delete cleaned[col]);
    if (Object.keys(cleaned).length === 0) throw result.error;
    console.warn(`Supabase schema missing columns for ${table}, retrying without: ${missing.join(', ')}`);
    return upsertOrUpdateRow(table, match, cleaned);
  }

  let cleaned = { ...row };
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const result = await supabaseClient.from(table).insert(cleaned);
    if (!result.error) return;
    const missing = getSupabaseMissingColumns(result.error);
    if (!missing.length) throw result.error;
    missing.forEach(col => delete cleaned[col]);
    if (Object.keys(cleaned).length === 0) throw result.error;
    console.warn(`Supabase schema missing columns for ${table}, retrying without: ${missing.join(', ')}`);
  }
  throw new Error(`upsertOrUpdateRow failed after multiple schema-cleanup attempts for table ${table}`);
}

async function upsertCloudRoleUser(role, passwordHash) {
  if (!supabaseClient || !cloudAuthReady) return;
  const defaults = DEFAULT_ROLE_PERMISSIONS;
  const names = { admin:'مدير النظام', engineer:'مهندس', accountant:'محاسب' };
  try {
    await upsertOrUpdateRow('users', { username: role }, {
      username: role,
      role,
      name: names[role],
      password: passwordHash,
      permissions: defaults[role] || []
    });
  } catch (err) {
    console.error('upsertCloudRoleUser error', formatSupabaseError(err), err);
  }
}

function syncCloudRolePasswords() {
  if (!cloudReady || !cloudAuthReady) return;
  upsertCloudRoleUser('admin',      passwords.admin);
  upsertCloudRoleUser('engineer',   passwords.engineer);
  upsertCloudRoleUser('accountant', passwords.accountant);
  loadCloudUsers();
}

async function loadCloudUsers() {
  if (!supabaseClient || !cloudAuthReady) return;
  try {
    const { data, error } = await supabaseClient.from('users').select('*').order('role');
    if (error) throw error;
    cloudUsers = data || [];
    renderUserAccounts();
  } catch (err) {
    console.error('loadCloudUsers error', err);
  }
}

function renderUserAccounts() {
  const container = document.getElementById('usersList');
  if (!container) return;
  if (!Array.isArray(cloudUsers) || !cloudUsers.length) {
    const noUsersText = currentLang === 'en' ? 'No users in cloud yet.' : 'لا يوجد مستخدمون في السحابة بعد.';
    container.innerHTML = `<div style="font-size:12px;color:var(--text3)">${esc(noUsersText)}</div>`;
    return;
  }
  const changeText = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].changePasswordButton) || 'تغيير كلمة المرور';
  const deleteText = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].deleteButton) || 'حذف';
  container.innerHTML = cloudUsers.map(user => {
    const roleLabel = currentLang === 'en'
      ? ROLE_LABELS_EN[user.role]
      : ROLE_LABELS[user.role];
    return `<div style="border-bottom:1px solid var(--border);padding:10px 0;display:grid;grid-template-columns:1fr auto;gap:10px">
      <div style="font-size:13px;font-weight:600">${esc(user.name || user.username)}</div>
      <div style="font-size:12px;color:var(--text3)">${esc(user.username)} • ${esc(roleLabel)}</div>
      <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:8px">
        <button class="ghost" onclick="changeCloudUserPassword('${esc(user.username)}')">${esc(changeText)}</button>
        <button class="ghost" onclick="deleteCloudUser('${esc(user.username)}')" style="color:var(--red2)">${esc(deleteText)}</button>
      </div>
    </div>`;
  }).join('');
}

async function createCloudUserAccount() {
  if (!hasPermission('settings.passwords')) {
    showToast('⛔ لا تملك صلاحية تعديل حسابات المستخدمين', 'warn');
    return;
  }
  if (!cloudReady || !cloudAuthReady) {
    showToast('⚠️ السحابة غير جاهزة. انتظر الاتصال.', 'warn');
    return;
  }
  const login   = document.getElementById('newUserLogin').value.trim().toLowerCase();
  const name    = document.getElementById('newUserName').value.trim();
  const role    = document.getElementById('newUserRole').value;
  const rawPass = document.getElementById('newUserPassword').value.trim();

  if (!login || !name || !rawPass) {
    showToast('⚠️ املأ اسم الحساب والاسم وكلمة المرور', 'warn');
    return;
  }
  if (rawPass.length < 6) {
    showToast('⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warn');
    return;
  }

  try {
    const hash = await sha256(rawPass);
    await upsertOrUpdateRow('users', { username: login }, {
      username: login,
      role,
      name,
      password: hash,
      permissions: DEFAULT_ROLE_PERMISSIONS[role] || []
    });
    showToast('✅ تم إضافة/تحديث المستخدم بنجاح');
    document.getElementById('newUserLogin').value = '';
    document.getElementById('newUserName').value  = '';
    document.getElementById('newUserPassword').value = '';
    loadCloudUsers();
  } catch (err) {
    console.error('createCloudUserAccount error', formatSupabaseError(err), err);
    showToast('❌ فشل إنشاء المستخدم', 'warn');
  }
}

async function changeCloudUserPassword(username) {
  if (!hasPermission('settings.passwords')) {
    showToast('⛔ لا تملك صلاحية تعديل كلمات المرور', 'warn');
    return;
  }
  const rawPass = prompt('أدخل كلمة المرور الجديدة للحساب:');
  if (!rawPass) return;
  if (rawPass.trim().length < 6) {
    showToast('⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warn');
    return;
  }
  try {
    const hash = await sha256(rawPass.trim());
    const { error } = await supabaseClient.from('users').update({ password: hash }).eq('username', username);
    if (error) throw error;
    showToast('✅ تم تحديث كلمة المرور');
    loadCloudUsers();
  } catch (err) {
    console.error('changeCloudUserPassword error', err);
    showToast('❌ فشل تحديث كلمة المرور', 'warn');
  }
}

async function deleteCloudUser(username) {
  if (!hasPermission('settings.passwords')) {
    showToast('⛔ لا تملك صلاحية حذف المستخدمين', 'warn');
    return;
  }
  if (!confirm(`هل أنت متأكد من حذف المستخدم ${username}؟`)) return;
  try {
    const { error } = await supabaseClient.from('users').delete().eq('username', username);
    if (error) throw error;
    showToast('✅ تم حذف المستخدم');
    loadCloudUsers();
  } catch (err) {
    console.error('deleteCloudUser error', err);
    showToast('❌ فشل حذف المستخدم', 'warn');
  }
}

function setCloudForceEnabled(enabled) {
  cloudForceEnable = !!enabled;
  if (!officeSettings || typeof officeSettings !== 'object') officeSettings = {};
  officeSettings.cloudForceEnable = cloudForceEnable ? 1 : 0;
  saveData();
  showToast(cloudForceEnable ? '☁️ التجاوز مفعل: السحابة ستُحاول الاتصال' : '☁️ التجاوز معطّل');
  setCloudStatus(cloudForceEnable ? '☁️ التجاوز مفعل' : '☁️ غير متصل');
}

function retryCloud() {
  initCloud().then(() => {
    if (cloudReady) initCloudAuth().then(pullCloudData);
  });
}

function syncCloudNow() {
  if (!cloudReady || !cloudAuthReady) {
    showToast('☁️ السحابة غير جاهزة. اضغط إعادة محاولة المزامنة أولاً.', 'warn');
    return;
  }
  showToast('☁️ جاري مزامنة البيانات الآن...', 'info');
  pushCloudData();
}

async function initializeCloudData(force = false) {
  console.log('initializeCloudData called, cloudReady:', cloudReady, 'cloudAuthReady:', cloudAuthReady);
  if (!cloudReady || !cloudAuthReady) {
    showToast('⚠️ السحابة غير جاهزة. انتظر المصادقة أو اضغط إعادة المحاولة.', 'warn');
    return;
  }
  try {
    console.log('Checking for existing data in table:', CLOUD_DOC_PATH.table, 'id:', CLOUD_DOC_PATH.id);
    const { data: existingData, error: selectError } = await supabaseClient.from(CLOUD_DOC_PATH.table).select('id').eq('id', CLOUD_DOC_PATH.id).single();
    if (selectError) {
      console.error('Select error:', selectError);
      if (selectError.code !== 'PGRST116') throw selectError;
    }
    if (existingData && !force) {
      showConfirm('تهيئة السحابة', 'المستند السحابي موجود بالفعل. هل تريد استبداله؟', () => initializeCloudData(true));
      return;
    }

    const fullPayload = {
      id: CLOUD_DOC_PATH.id,
      contracts: contracts.length ? contracts : [],
      visits: visits.length ? visits : [],
      auditLogs: auditLogs.length ? auditLogs : [],
      passwords: passwords,
      invoices: invoices.length ? invoices : [],
      files: files.length ? files : [],
      drawingVersions: drawingVersions.length ? drawingVersions : [],
      engineers: engineers.length ? engineers : [],
      officeSettings: officeSettings || {},
      updatedAt: new Date().toISOString()
    };
    console.log('Upserting payload:', fullPayload);
    await upsertOrUpdateRow(CLOUD_DOC_PATH.table, { id: CLOUD_DOC_PATH.id }, fullPayload);

    showToast('✅ تم تهيئة السحابة');
    await pullCloudData();
  } catch (err) {
    console.error('initializeCloudData error:', err);
    showToast('❌ تعذّر تهيئة السحابة: ' + (err.message || err), 'warn');
  }
}

async function pullCloudData() {


  if (!cloudReady || !supabaseClient || !cloudAuthReady) {
    cloudPullDone = true;
    return;
  }

  try {
    const { data, error } = await supabaseClient.from(CLOUD_DOC_PATH.table).select('*').eq('id', CLOUD_DOC_PATH.id).maybeSingle();
    if (error || !data) {
      cloudPullDone = true;
      setCloudStatus('☁️ جاهز للحفظ', 'var(--accent2)');
      return;
    }
    // دمج بيانات السحابة مع المحلي بدلاً من استبدالها بالكامل
    function mergeById(localArr, cloudArr) {
      if (!Array.isArray(localArr)) localArr = [];
      if (!Array.isArray(cloudArr)) return localArr;
      const map = new Map();
      localArr.forEach(item => { if (item && item.id) map.set(item.id, item); });
      cloudArr.forEach(item => { if (item && item.id) map.set(item.id, item); });
      return Array.from(map.values());
    }

    if (Array.isArray(data.contracts))       contracts  = mergeById(contracts, data.contracts);
    if (Array.isArray(data.visits))          visits     = mergeById(visits, data.visits);
    if (Array.isArray(data.auditLogs))       auditLogs  = mergeById(auditLogs, data.auditLogs);
    if (Array.isArray(data.invoices))        invoices   = mergeById(invoices, data.invoices);
    if (Array.isArray(data.files))           files      = mergeById(files, data.files);
    if (Array.isArray(data.drawingVersions)) drawingVersions = mergeById(drawingVersions, data.drawingVersions);
    if (Array.isArray(data.engineers))       engineers  = mergeById(engineers, data.engineers);
    if (data.passwords && typeof data.passwords === 'object') passwords = Object.assign({}, passwords || {}, data.passwords);
    if (data.officeSettings && typeof data.officeSettings === 'object') officeSettings = Object.assign({}, officeSettings || {}, data.officeSettings);

    if (officeSettings && Object.keys(officeSettings).length) loadSettings();
    refreshAll(); refreshPayments(); refreshVisitsPage(); refreshArchive(); renderAudit();
    buildNotifications();
    cloudPullDone = true;
    setCloudStatus('☁️ مزامنة مفعلة', 'var(--accent2)');
  } catch (err) {
    console.error('Supabase pull error:', err);
    setCloudStatus('☁️ فشل المزامنة السحابية', 'var(--amber2)');
    cloudPullDone = true;
  }
}

function queueCloudSave() {
  if (!cloudReady || !supabaseClient || !cloudAuthReady || !cloudPullDone) return;
  if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(pushCloudData, 800);
}

async function pushCloudData() {
  if (!cloudReady || !supabaseClient || !cloudAuthReady) return;
  try {
    // حفظ جميع البيانات في السحابة
    await upsertOrUpdateRow(CLOUD_DOC_PATH.table, { id: CLOUD_DOC_PATH.id }, {
      id: CLOUD_DOC_PATH.id,
      contracts, visits, auditLogs, passwords,
      invoices, files, drawingVersions,
      engineers, officeSettings,
      updatedAt: new Date().toISOString()
    });
    setCloudStatus('☁️ تم الحفظ', 'var(--accent2)');
    if (cloudSaveTimer) { clearTimeout(cloudSaveTimer); cloudSaveTimer = null; }
  } catch (err) {
    console.error('Push error:', err);
    const isAuthFailure = err && (err.status === 401 || err.status === 403 || (err.code && String(err.code).startsWith('40')));
    if (isAuthFailure) {
      cloudAuthReady = false;
      setCloudStatus('☁️ فشل التوثيق — تحقق من مفتاح Supabase', 'var(--red2)');
      return;
    }
    setCloudStatus('☁️ فشل الحفظ — سيتم إعادة المحاولة', 'var(--amber2)');
    if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(pushCloudData, 3000);
  }
}

// ═══════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════
function fmt(n) {
  return (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtShort(n) {
  n = parseFloat(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString('en-US');
}
function daysUntil(dateStr) {
  if (!dateStr) return 9999;
  return Math.round((new Date(dateStr) - new Date()) / 86400000);
}
function saveData(syncCloud = true) {
  if (syncCloud) {
    if (!cloudReady || !cloudAuthReady) {
      pendingCloudSave = true;
      console.warn('Cloud not ready — save queued until available.');
      setCloudStatus('☁️ جاري انتظار السحابة...', 'var(--amber2)');
      return;
    }
    pendingCloudSave = false;
    queueCloudSave();
  }
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showConfirm(title, msg, cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  confirmCallback = cb;
  document.getElementById('confirmOk').onclick = () => { closeConfirm(); cb(); };
  document.getElementById('confirmOverlay').classList.add('open');
}
function closeConfirm() { document.getElementById('confirmOverlay').classList.remove('open'); }

function exportData() {
  const payload = {
    meta: { app:'almuheet-contract-system', version:'2.0.0', exportedAt: new Date().toISOString() },
    contracts, visits, auditLogs, passwords, invoices, files, drawingVersions, engineers
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json;charset=utf-8' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `almuheet-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  addAudit('export', 'تصدير نسخة احتياطية كاملة');
  showToast('✅ تم تصدير النسخة الاحتياطية');
}

// ═══════════════════════════════════════════════
// INVOICE SYSTEM
// ═══════════════════════════════════════════════
function createInvoice(contractId) {
  const contract = contracts.find(c => c.id === contractId);
  if (!contract) { showToast('⚠️ العقد غير موجود', 'warn'); return; }
  
  const invoice = {
    id: 'INV-' + new Date().getFullYear() + '-' + String(invoices.length + 1).padStart(4, '0'),
    contractId,
    client: contract.owner,
    amount: contract.value - (contract.payments || []).reduce((s, p) => s + p.amount, 0),
    status: 'غير مدفوعة',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  
  invoices.push(invoice);
  saveData();
  addAudit('create', `إنشاء فاتورة ${invoice.id} للعقد #${contractId}`);
  showToast('✅ تم إنشاء الفاتورة');
  refreshInvoices();
}

function generateInvoicePDF(invoiceId) {
  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) { showToast('⚠️ الفاتورة غير موجودة', 'warn'); return; }
  
  const contract = contracts.find(c => c.id === invoice.contractId);
  
  // Create simple HTML for PDF
  const htmlContent = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${invoice.id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; }
    .info { margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .total { font-size: 20px; font-weight: bold; margin-top: 30px; text-align: center; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">المحيط للاستشارات الهندسية</div>
    <div>AL MUHEET ENGINEERING CONSULTING</div>
  </div>
  
  <div class="info">
    <div class="info-row"><span>رقم الفاتورة:</span><span>${invoice.id}</span></div>
    <div class="info-row"><span>التاريخ:</span><span>${new Date(invoice.createdAt).toLocaleDateString('ar-QA')}</span></div>
    <div class="info-row"><span>العميل:</span><span>${invoice.client}</span></div>
    <div class="info-row"><span>رقم العقد:</span><span>${invoice.contractId}</span></div>
  </div>
  
  <div class="total">
    المبلغ: ${fmt(invoice.amount)} ر.ق
  </div>
  
  <div class="footer">
    رخصة 164638 | 30503076 - 40296739
  </div>
</body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${invoice.id}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
  
  addAudit('export', `تصدير PDF للفاتورة ${invoice.id}`);
  showToast('✅ تم تصدير الفاتورة');
}

function markInvoiceAsPaid(invoiceId) {
  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) return;
  
  invoice.status = 'مدفوعة';
  invoice.paidAt = new Date().toISOString();
  
  // Add payment to contract
  const contract = contracts.find(c => c.id === invoice.contractId);
  if (contract) {
    if (!contract.payments) contract.payments = [];
    contract.payments.push({
      amount: invoice.amount,
      date: new Date().toISOString().split('T')[0],
      type: 'فاتورة',
      ref: invoice.id
    });
  }
  
  saveData();
  addAudit('edit', `تحديث حالة الفاتورة ${invoiceId} إلى مدفوعة`);
  showToast('✅ تم تحديث حالة الفاتورة');
  refreshInvoices();
  refreshAll();
}

function refreshInvoices() {
  const tb = document.getElementById('invoicesTable');
  if (!tb) return;

  if (!invoices.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:30px">لا توجد فواتير</td></tr>';
    return;
  }

  tb.innerHTML = invoices.map(inv => {
    const statusClass = inv.status === 'مدفوعة' ? 'success' : 'warn';
    return `<tr>
      <td class="td-mono">${inv.id}</td>
      <td>${esc(inv.client)}</td>
      <td class="td-mono">${fmt(inv.amount)} ر.ق</td>
      <td><span class="tag ${statusClass}">${inv.status}</span></td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="ghost" onclick="generateInvoicePDF('${inv.id}')" style="padding:4px 6px;font-size:11px">📄 PDF</button>
          ${inv.status !== 'مدفوعة' ? `<button class="ghost" onclick="markInvoiceAsPaid('${inv.id}')" style="padding:4px 6px;font-size:11px;color:var(--accent2)">✓ دفع</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function showInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  if (!modal) {
    showToast('⚠️ Modal غير موجود', 'warn');
    return;
  }
  
  // Populate contract dropdown
  const select = document.getElementById('inv-contract');
  select.innerHTML = '<option value="">اختر عقداً</option>' +
    contracts.filter(c => c.status === 'نشط').map(c => `<option value="${c.id}">${esc(c.id)} - ${esc(c.owner)}</option>`).join('');
  
  modal.classList.add('open');
}

function handleCreateInvoice() {
  const contractId = document.getElementById('inv-contract').value.trim();
  if (!contractId) {
    showToast('⚠️ اختر العقد', 'warn');
    return;
  }
  createInvoice(contractId);
  closeModal('invoiceModal');
}

// ═══════════════════════════════════════════════
// FILE MANAGEMENT SYSTEM
// ═══════════════════════════════════════════════
async function uploadFile(file, contractId = null, type = 'general') {
  if (!file) return null;

  // التحقق من جاهزية السحابة
  if (!cloudReady || !supabaseClient) {
    showToast('⚠️ السحابة غير جاهزة لرفع الملفات', 'warn');
    return null;
  }

  const fileId = 'FILE-' + Date.now();
  const fileName = `${fileId}_${file.name}`;
  const filePath = `uploads/${contractId || 'general'}/${fileName}`;

  showToast('⏳ جاري رفع الملف...', 'info');

  try {
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // الحصول على رابط التحميل العام
    const { data: publicUrlData } = supabaseClient
      .storage
      .from('files')
      .getPublicUrl(filePath);

    const downloadURL = publicUrlData.publicUrl;

    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      data: downloadURL, // استخدام رابط التخزين السحابي بدلاً من Base64
      contractId,
      fileType: type,
      uploadedAt: new Date().toISOString()
    };

    files.push(fileData);
    saveData();
    addAudit('create', `رفع الملف ${file.name}`);
    showToast('✅ تم رفع الملف بنجاح');
    refreshFiles();
    return fileData;
  } catch (error) {
    console.error('Upload error:', error);
    showToast('❌ فشل رفع الملف', 'warn');
    return null;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function refreshFiles() {
  const tb = document.getElementById('filesTable');
  if (!tb) return;

  if (!files.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:30px">لا توجد ملفات</td></tr>';
    return;
  }

  tb.innerHTML = files.map(f => {
    const typeIcon = f.fileType === 'drawing' ? '📐' : f.fileType === 'photo_before' ? '📷' : f.fileType === 'photo_after' ? '📸' : '📄';
    return `<tr>
      <td>${typeIcon} ${esc(f.name)}</td>
      <td>${esc(f.type || 'غير معروف')}</td>
      <td class="td-mono">${f.sizeFormatted}</td>
      <td class="td-mono">${new Date(f.uploadedAt).toLocaleDateString('ar-QA')}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="ghost" onclick="viewFile('${f.id}')" style="padding:4px 6px;font-size:11px">👁️ عرض</button>
          <button class="ghost" onclick="deleteFile('${f.id}')" style="padding:4px 6px;font-size:11px;color:var(--red2)">🗑️ حذف</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function viewFile(fileId) {
  const file = files.find(f => f.id === fileId);
  if (!file) return;

  if (file.data && (file.data.startsWith('http') || file.data.startsWith('data:'))) {
    window.open(file.data, '_blank');
  } else {
    showToast('⚠️ رابط الملف غير صالح', 'warn');
  }
}

function deleteFile(fileId) {
  if (!hasPermission('contracts.delete')) { showToast('⛔ الحذف متاح لمدير النظام فقط', 'warn'); return; }
  showConfirm('حذف الملف', 'هل أنت متأكد من حذف هذا الملف؟', () => {
    const index = files.findIndex(f => f.id === fileId);
    if (index > -1) {
      const file = files[index];
      files.splice(index, 1);
      saveData();
      addAudit('delete', `حذف الملف ${file.name}`);
      showToast('✅ تم حذف الملف');
      refreshFiles();
    }
  });
}

function showUploadModal() {
  const modal = document.getElementById('uploadModal');
  if (!modal) {
    showToast('⚠️ Modal غير موجود', 'warn');
    return;
  }
  
  // Populate contract dropdown
  const select = document.getElementById('upload-contract');
  select.innerHTML = '<option value="">بدون ربط بعقد</option>' +
    contracts.map(c => `<option value="${c.id}">${esc(c.id)} - ${esc(c.owner)}</option>`).join('');
  
  modal.classList.add('open');
}

function handleFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const contractId = ((document.getElementById('upload-contract') || {}).value) || null;
  const fileType = ((document.getElementById('upload-type') || {}).value) || 'general';

  uploadFile(file, contractId, fileType);
  closeModal('uploadModal');
  event.target.value = '';
}

// ═══════════════════════════════════════════════
// DRAWING VERSION TRACKING
// ═══════════════════════════════════════════════
function addDrawingVersion(contractId, version, fileId, status = 'قيد المراجعة') {
  const versionData = {
    id: 'VER-' + Date.now(),
    contractId,
    version,
    fileId,
    status,
    createdAt: new Date().toISOString()
  };

  drawingVersions.push(versionData);
  saveData();
  addAudit('create', `إضافة نسخة مخطط ${version} للعقد #${contractId}`);
  showToast('✅ تم إضافة النسخة');
}

function getDrawingVersions(contractId) {
  return drawingVersions.filter(v => v.contractId === contractId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function importData() {
  const fi = document.getElementById('importFileInput');
  fi.value = '';
  fi.click();
}

function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !Array.isArray(data.contracts) || !Array.isArray(data.visits) || !Array.isArray(data.auditLogs)) {
        throw new Error('invalid');
      }
      showConfirm('استيراد بيانات', 'سيتم استبدال البيانات الحالية بالبيانات المستوردة. هل تريد المتابعة؟', () => {
        contracts = data.contracts;
        visits    = data.visits;
        auditLogs = data.auditLogs;
        if (data.passwords && typeof data.passwords === 'object') passwords = data.passwords;
        saveData();
        refreshAll(); refreshPayments(); refreshVisitsPage(); refreshArchive(); renderAudit();
        buildNotifications();
        showToast('✅ تم استيراد البيانات بنجاح');
      });
    } catch (e) {
      showToast('⚠️ ملف غير صالح للاستيراد', 'warn');
    }
  };
  reader.readAsText(file);
}

function resetSystemData() {
  if (!hasPermission('settings.reset')) { showToast('⛔ التصفير متاح لمدير النظام فقط', 'warn'); return; }
  showConfirm('تصفير بيانات النظام', 'سيتم حذف العقود والزيارات والسجل. هل تريد المتابعة؟', () => {
    contracts = []; visits = []; auditLogs = [];
    STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    saveData();
    refreshAll(); refreshPayments(); refreshVisitsPage(); refreshArchive(); renderAudit();
    buildNotifications();
    showToast('🧹 تم تصفير البيانات');
  });
}

let toastTimer;
function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t    = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--bg4);border:1px solid var(--border2);color:var(--text1);padding:10px 20px;border-radius:var(--r2);font-size:13px;z-index:9999;transition:opacity .3s;pointer-events:none;min-width:200px;text-align:center';
  }
  t.textContent  = msg;
  t.style.opacity = '1';
  t.style.background = type === 'warn' ? 'rgba(240,163,10,.15)' : 'var(--bg4)';
  t.style.borderColor = type === 'warn' ? 'var(--amber2)' : 'var(--border2)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.opacity = '0', 3000);
}

function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  if (!officeSettings || typeof officeSettings !== 'object') officeSettings = {};
  officeSettings.theme = next;
  saveData();
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
setLanguage(currentLang);
document.getElementById('v-date').value = new Date().toISOString().split('T')[0];
// theme is loaded from cloud-backed officeSettings via loadSettings()
if (!document.documentElement.getAttribute('data-theme')) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

// debounce للأحداث المتكررة لتحسين الأداء
['click','keydown','mousemove','scroll'].forEach(evt => {
  document.addEventListener(evt, () => {
    if (!currentUser) return;
    if (sessionDebounce) clearTimeout(sessionDebounce);
    sessionDebounce = setTimeout(startSessionTimer, 300);
  }, { passive: true });
});

// فرض حالة مربع الاختيار الخاص بالتجاوز إن وُجد
const cfEl = document.getElementById('cloudForce');
if (cfEl) cfEl.checked = cloudForceEnable;

initCloud().then(() => {
  if (cloudReady) initCloudAuth().then(pullCloudData);
});

// إعادة محاولة تفعيل السحابة عند تبدّل حالة الشبكة
window.addEventListener('online', () => {
  setCloudStatus('☁️ إعادة المحاولة...', 'var(--amber2)');
  initCloud().then(() => {
    if (cloudReady) initCloudAuth().then(pullCloudData);
  });
});
window.addEventListener('offline', () => {
  setCloudStatus('☁️ غير متصل بالإنترنت', 'var(--amber2)');
});

// تحقق كلمات المرور الافتراضية: ترقية النص إلى hash إذا لزم
(async () => {
  let changed = false;
  for (const role of ['admin','engineer','accountant']) {
    if (!passwords[role] || passwords[role].length !== 64) {
      const raw = role === 'admin' ? (passwords[role] || ADMIN_MASTER_PASSWORD) : (passwords[role] || '1234');
      passwords[role] = await sha256(raw);
      changed = true;
    }
  }
})();
