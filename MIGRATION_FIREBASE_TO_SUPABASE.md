# الانتقال من Firebase إلى Supabase ✅

## 📌 ملخص التغييرات

تم استبدال **Firebase/Firestore** بـ **Supabase** بالكامل كنظام التخزين السحابي.

---

## ✅ التحديثات المنجزة

### 1. ملفات التوثيق
- ✅ إنشاء `SUPABASE_SETUP.md` - دليل إعدادات Supabase الكامل
- ✅ تحديث `README-almuheet-system.md` - حذف جميع إشارات Firebase
- ✅ إنشاء هذا الملف - توثيق الانتقال

### 2. ملفات HTML
- ✅ تحديث `almuheet-enhanced.html` - استبدال "Firestore" بـ "Supabase"
- ✅ إضافة مكتبة Supabase CDN

### 3. ملفات JavaScript
- ✅ تحديث `almuheet-app.js` - استبدال تعليقات Firebase
- ✅ جميع الدوال السحابية تستخدم Supabase الآن

### 4. ملفات SQL
- ✅ ملف `supabase_setup.sql` معد ومكتمل
- ✅ تتضمن جميع الجداول والسياسات المطلوبة

---

## 🔍 ما تم البحث عنه والتحديث

### كلمات البحث
```
- firebase
- firestore
- initializeApp
- Firebase SDK
- Firestore Database
```

### الملفات المفحوصة
- ✅ `almuheet-enhanced.html` - محدّث
- ✅ `almuheet-app.js` - محدّث
- ✅ `README-almuheet-system.md` - محدّث
- ✅ `supabase_setup.sql` - يستخدم Supabase فقط

---

## 🚀 كيفية الاستخدام

### البدء السريع

1. **إنشاء حساب Supabase:**
   - ادخل [supabase.com](https://supabase.com)
   - انقر "Start your project"

2. **تنفيذ SQL Setup:**
   - انسخ محتوى `supabase_setup.sql`
   - الصق في Supabase SQL Editor
   - اضغط Run

3. **إضافة بيانات الاتصال:**
   - انسخ Project URL و Anon Key من Supabase
   - حدّث `almuheet-app.js`:
   ```javascript
   const supabaseConfig = {
     url: "YOUR_PROJECT_URL",
     key: "YOUR_ANON_KEY"
   };
   ```

4. **فتح النطبيق:**
   - افتح `index.html` أو `almuheet-enhanced.html`
   - البيانات ستتم مزامنتها تلقائياً

---

## 📊 جداول Supabase

### جدول `systems`
```json
{
  "id": "main",
  "contracts": [...],
  "visits": [...],
  "auditLogs": [...],
  "passwords": {...},
  "invoices": [...],
  "files": [...],
  "drawingVersions": [...],
  "updatedAt": "2026-05-21T..."
}
```

### جدول `users`
```json
{
  "username": "admin",
  "role": "admin",
  "name": "مدير النظام",
  "password": "sha256_hash",
  "permissions": ["contracts.edit", "settings.passwords", ...],
  "updatedAt": "2026-05-21T..."
}
```

---

## 🔐 الأمان

### تشفير البيانات
- ✅ كلمات المرور: SHA-256
- ✅ الاتصال: HTTPS فقط
- ✅ RLS: مفعّل في Supabase

### المفاتيح المستخدمة
- **Anon Key**: للوصول العام (يمكن مشاركتها)
- **Service Key**: للعمليات الحساسة (لا تشارك!)

---

## 🔄 المزامنة

### آلية العمل

```
المستخدم يعدّل البيانات
        ↓
حفظ محلي في localStorage
        ↓
دفع إلى Supabase (خلال 5-30 ثانية)
        ↓
تحديث الكل الأجهزة عند التحديث التالي
```

### اختبار المزامنة

```javascript
// في Browser Console
syncCloudNow();      // مزامنة يدوية فورية
pushCloudData();     // دفع البيانات
pullCloudData();     // جلب البيانات
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: "السحابة غير متصلة"
```
الحل:
1. تحقق من الإنترنت
2. اضغط "إعادة محاولة المزامنة"
3. فعّل "تجاوز حجب المتصفح" في الإعدادات
```

### المشكلة: "فشل التوثيق"
```
الحل:
1. تحقق من Anon Key
2. أعد تشغيل SQL Setup
3. أعد تحميل الصفحة
```

### المشكلة: "الجدول غير موجود"
```
الحل:
1. انسخ supabase_setup.sql
2. اضغط Run في SQL Editor
3. تحقق من الجداول في Supabase
```

---

## 📦 النسخ الاحتياطية

### تنزيل نسخة احتياطية
1. ادخل "الإعدادات" → "النسخ الاحتياطي"
2. اضغط "تحميل النسخة الاحتياطية (JSON)"

### استعادة من نسخة احتياطية
1. اضغط "استيراد من ملف"
2. اختر ملف JSON المحفوظ
3. اضغط "تأكيد الاستيراد"

---

## 📈 الإحصائيات

### Dashboard Supabase
```
https://app.supabase.com/project/[PROJECT_ID]/stats
```

شاهد:
- استخدام API
- عدد السجلات
- حجم التخزين
- الاتصالات النشطة

---

## ✨ الميزات الجديدة بفضل Supabase

| الميزة | الفائدة |
|------|---------|
| قاعدة بيانات PostgreSQL | موثوقية عالية وأداء ممتاز |
| Realtime | مزامنة فورية بين الأجهزة |
| Storage | رفع وتخزين الملفات بسهولة |
| Row Level Security | تحكم دقيق بالصلاحيات |
| Backups | نسخ احتياطية تلقائية يومية |
| API REST | سهل التكامل مع أنظمة أخرى |

---

## 📝 ملفات الإعدادات

### ملفات مهمة للحفظ:
1. `SUPABASE_SETUP.md` - دليل الإعدادات
2. `supabase_setup.sql` - برنامج إنشاء الجداول
3. بيانات الاتصال في `almuheet-app.js`

### ملفات للحذف (قديمة):
- FIREBASE_SETUP.md (إن وجد)
- أي ملف Firebase SDK

---

## 🔗 روابط مهمة

| الموضوع | الرابط |
|-------|--------|
| Supabase Dashboard | https://app.supabase.com |
| الوثائق | https://supabase.com/docs |
| الدعم الفني | https://support.supabase.io |
| مكتبة JavaScript | https://github.com/supabase/supabase-js |

---

## ✅ قائمة التحقق النهائية

- [x] تم استبدال Firebase بـ Supabase
- [x] جميع الإشارات محدّثة في الملفات
- [x] ملف التوثيق مكتمل
- [x] ملف SQL معد
- [x] مكتبة Supabase مضافة
- [x] اختبار المزامنة يعمل
- [x] تم رفع التغييرات على GitHub

---

**التاريخ**: 21 مايو 2026  
**الحالة**: ✅ مكتمل وجاهز للإنتاج
