# نظام المحيط لإدارة العقود

نسخة ويب تعمل محليًا داخل المتصفح وتخزن البيانات في `localStorage`.

## المزايا
- إدارة العقود (إضافة، تعديل، حذف، نسخ).
- إدارة الدفعات والزيارات الميدانية.
- لوحة قيادة وتقارير وسجل نشاط.
- نسخ احتياطي JSON (تصدير/استيراد) من داخل الإعدادات.
- تصدير التقارير بصيغة CSV.
- قفل مؤقت عند تكرار محاولات تسجيل الدخول الخاطئة.
- انتهاء جلسة تلقائي عند عدم النشاط.
- مظهر فاتح/داكن.
- مزامنة سحابية عبر Supabase (مع بقاء التخزين المحلي كنسخة احتياطية).

## التشغيل
- `index.html`: منصة التشغيل الرئيسية (مناسبة لـ GitHub Pages).
- `almuheet-enhanced.html`: الهيكل الأساسي للنظام بعد الفصل.
- `almuheet-app.css`: تنسيقات النظام الأساسية (تم فصلها من الملف الرئيسي).
- `almuheet-app.js`: منطق النظام الكامل (تم فصله من الملف الرئيسي).
- `style.css` و`app.js`: تنسيق/منطق منصة التشغيل الخارجية في `index.html`.

## الرفع على GitHub
نفّذ الأوامر التالية داخل مجلد `Downloads`:

```bash
git init
git add almuheet-enhanced.html README-almuheet-system.md
git commit -m "Initial release: Almuheet contract management system"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

> استبدل `<USERNAME>` و `<REPO>` باسم حسابك واسم المستودع.

## GitHub Pages
بعد رفع الملفات:
1. ادخل إعدادات المستودع على GitHub.
2. من Pages اختر:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
3. احفظ الإعدادات.

سيكون الرابط غالبًا:
`https://<USERNAME>.github.io/<REPO>/`

## التخزين السحابي (Supabase)
- تم ربط النظام بـ Supabase من خلال إعدادات المشروع داخل `almuheet-app.js`.
- يستخدم Supabase anon key للمصادقة والوصول إلى قاعدة البيانات.
- تمت إضافة صلاحيات مبنية على جدول `users` في Supabase:
  - البحث عن المستخدم يتم عبر `username` أو `role` مع `password`.
  - الصلاحيات تُقرأ من الحقل `permissions`.
  - يمكن لمدير النظام إضافة حسابات جديدة وتغيير كلمات المرور من صفحة الإعدادات.
  - يتم تحديث حسابات الأدوار الأساسية تلقائيًا عند حفظ كلمات المرور من الإعدادات.
- التخزين السحابي يستخدم جدول واحد في Supabase:
  - Table: `systems`
  - Record ID: `main`
- عند فتح النظام:
  - يتم سحب البيانات من السحابة إذا كانت متوفرة.
  - أي تعديل جديد يتم حفظه محليًا ثم رفعه تلقائيًا إلى Supabase.

### سياسات RLS المقترحة (أكثر أمانًا)
استخدم سياسات Row Level Security تتطلب مصادقة:

```sql
-- Enable RLS
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated access" ON systems
FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access" ON users
FOR ALL USING (auth.role() = 'authenticated');
```

### بنية جدول المستخدمين في Supabase
- Table: `users`
- Primary Key: `username`
- الحقول:
  - `role`: `admin | engineer | accountant`
  - `name`: اسم العرض
  - `password`: كلمة المرور الحالية
  - `permissions`: مصفوفة صلاحيات (JSONB)
  - `updatedAt`: تاريخ التحديث

## خطة الفصل (Refactor)
- **المرحلة 1 (مكتملة):** إنشاء نقطة دخول `index.html` + فصل واجهة منصة التشغيل (`style.css`, `app.js`).
- **المرحلة 2 (مكتملة):** فصل CSS/JS الداخليين من `almuheet-enhanced.html` إلى:
  - `almuheet-app.css`
  - `almuheet-app.js`
