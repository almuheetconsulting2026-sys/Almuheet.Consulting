# نظام المحيط - إعدادات Supabase

## 📋 نظرة عامة

يستخدم نظام المحيط **Supabase** كقاعدة بيانات سحابية موثوقة لتخزين جميع البيانات.

## ✅ الإعدادات الحالية

### معلومات اتصال Supabase

```
URL: https://reaogvzxsvkeqrdkcqyz.supabase.co
Project: Almuheet Consulting
Region: (us-east-1)
```

### الجداول المستخدمة

#### 1. جدول `systems` - المستندات الرئيسية
```sql
- id: TEXT PRIMARY KEY (عادة: 'main')
- contracts: JSONB (قائمة العقود)
- visits: JSONB (سجل الزيارات)
- auditLogs: JSONB (سجل النشاط)
- passwords: JSONB (كلمات المرور المشفرة)
- invoices: JSONB (الفواتير)
- files: JSONB (معلومات الملفات)
- drawingVersions: JSONB (الرسومات)
- updatedAt: TIMESTAMP (وقت آخر تحديث)
```

#### 2. جدول `users` - حسابات المستخدمين
```sql
- id: UUID PRIMARY KEY
- username: TEXT UNIQUE (اسم الحساب: admin, engineer, accountant)
- role: TEXT (الدور: admin, engineer, accountant)
- name: TEXT (الاسم الكامل)
- password: TEXT (SHA-256 المشفرة)
- permissions: JSONB (قائمة الصلاحيات)
- updatedAt: TIMESTAMP
```

#### 3. Bucket `files` - تخزين الملفات
- للمستندات والصور والرسومات

---

## 🚀 خطوات الإعداد الأولى

### 1. إنشاء حساب Supabase
1. ادخل إلى [supabase.com](https://supabase.com)
2. انقر "Start your project"
3. استخدم بريد Gmail أو أي بريد آخر

### 2. إنشاء مشروع جديد
1. اختر "New Project"
2. أدخل البيانات:
   - **Project Name**: Almuheet Consulting
   - **Database Password**: اختر كلمة مرور قوية
   - **Region**: اختر الأقرب (مثل us-east-1)

### 3. تنفيذ SQL Setup
بعد إنشاء المشروع:
1. اذهب إلى "SQL Editor"
2. انقر "New Query"
3. انسخ محتوى ملف `supabase_setup.sql`
4. اضغط "Run"

### 4. الحصول على بيانات الاتصال
1. اذهب إلى "Settings" → "API"
2. انسخ **Project URL** و **Anon Key**
3. حدّث الـ config في `almuheet-app.js`:

```javascript
const supabaseConfig = {
  url: "YOUR_PROJECT_URL",
  key: "YOUR_ANON_KEY"
};
```

---

## 🔑 مفاتيح API

### Public Anon Key (للتطوير)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYW9ndnp4c3ZrZXFyZGtjcXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDAyNDgsImV4cCI6MjA5NDc3NjI0OH0.XYrL6Okp6-iecwmuQTB18R79tTh9QX5g21pPuH9hoyQ
```

⚠️ **تحذير**: لا تشارك هذا المفتاح علناً. انقله إلى متغيرات البيئة في الإنتاج.

---

## 🔐 الأمان

### Row Level Security (RLS)
- مفعّل للجداول `systems` و `users`
- في المرحلة الحالية (التطوير): السياسات تسمح بالوصول الكامل

### تشفير كلمات المرور
- جميع كلمات المرور مشفرة بـ **SHA-256**
- لا تُخزّن النصوص الأصلية أبداً

### Storage Rules
- الملفات محفوظة في bucket `files`
- السياسات تسمح برفع وتنزيل الملفات

---

## 🔄 مزامنة البيانات

### آلية العمل
1. **Pull (جلب البيانات)**:
   - عند فتح التطبيق، يتم سحب البيانات من Supabase
   - تُحفظ محلياً في `localStorage` كـ backup

2. **Push (دفع البيانات)**:
   - عند أي تغيير، يتم دفع البيانات إلى Supabase
   - يحدث كل 5-30 ثانية تلقائياً

3. **Conflict Resolution**:
   - البيانات السحابية لها الأولوية
   - النسخة المحلية تُحدّث تلقائياً

### اختبار المزامنة
```javascript
// في console المتصفح
syncCloudNow(); // مزامنة يدوية فورية
pushCloudData(); // دفع البيانات
pullCloudData(); // جلب البيانات
```

---

## 📦 تخزين الملفات

### الرفع
```javascript
// الملفات تُرفع تلقائياً عند إضافة عقد بملفات
// البيانات المرجعية تُحفظ في جدول systems
```

### التنزيل
```javascript
// الملفات متاحة من:
// https://reaogvzxsvkeqrdkcqyz.supabase.co/storage/v1/object/public/files/{filename}
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: "السحابة غير متصلة"
**الحل**:
1. تحقق من الإنترنت
2. تحقق من CORS في Supabase
3. جرّب "تجاوز الحجب" من الإعدادات

### المشكلة: "فشل التوثيق"
**الحل**:
1. تحقق من Anon Key
2. تحقق من RLS Policies
3. أعد تحميل الصفحة

### المشكلة: "خطأ في جدول"
**الحل**:
1. تحقق من ملف `supabase_setup.sql`
2. أعد تشغيل SQL Script
3. تحقق من أسماء الأعمدة

### المشكلة: "رفع ملف فاشل"
**الحل**:
1. تحقق من حجم الملف
2. تحقق من نوع الملف
3. تحقق من صلاحيات Storage

---

## 🔄 النسخ الاحتياطية

### تحميل نسخة احتياطية يدوية
```javascript
// من console
const backup = JSON.stringify({
  contracts, visits, auditLogs, passwords, 
  invoices, files, drawingVersions
});
console.save(backup, 'almuheet-backup.json');
```

### استعادة من نسخة احتياطية
```javascript
// قم بتحميل الملف ثم:
localStorage.setItem('contracts', JSON.stringify(importedData.contracts));
// كرر لكل مفتاح
```

---

## 📊 المراقبة

### Dashboard Supabase
1. ادخل إلى [app.supabase.com](https://app.supabase.com)
2. اختر المشروع
3. شاهد:
   - استخدام API
   - حجم قاعدة البيانات
   - Realtime Connections

### الإحصائيات
- عدد العقود النشطة
- إجمالي القيمة المحفوظة
- عدد الزيارات المسجلة

---

## 🛠️ دعم والصيانة

### التحديثات المنتظمة
- تحديثات Supabase تُطبق تلقائياً
- لا حاجة للقلق بشأن الصيانة

### دعم فني
- Supabase يوفر دعم 24/7
- الرابط: [support.supabase.io](https://support.supabase.io)

---

**آخر تحديث**: مايو 2026
**الحالة**: نشط وجاهز للإنتاج
