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
- مزامنة سحابية عبر Firebase Firestore (مع بقاء التخزين المحلي كنسخة احتياطية).

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

## التخزين السحابي (Firebase)
- تم ربط النظام بـ Firebase من خلال إعدادات المشروع داخل `almuheet-app.js`.
- تمت إضافة مصادقة Firebase Anonymous تلقائيًا قبل القراءة/الكتابة السحابية.
- تمت إضافة صلاحيات مبنية على مجموعة `users` في Firestore:
  - البحث عن المستخدم يتم عبر `role + password`.
  - الصلاحيات تُقرأ من الحقل `permissions`.
  - يتم تحديث حسابات الأدوار الأساسية تلقائيًا عند حفظ كلمات المرور من الإعدادات.
- التخزين السحابي يستخدم مستند واحد في Firestore:
  - Collection: `systems`
  - Document: `main`
- عند فتح النظام:
  - يتم سحب البيانات من السحابة إذا كانت متوفرة.
  - أي تعديل جديد يتم حفظه محليًا ثم رفعه تلقائيًا إلى Firestore.

### قواعد Firestore المقترحة (أكثر أمانًا)
استخدم قواعد تتطلب مستخدمًا مصادقًا:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /systems/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### بنية مستخدمي Firestore
- Collection: `users`
- Document IDs المقترحة: `admin`, `engineer`, `accountant`
- الحقول:
  - `role`: `admin | engineer | accountant`
  - `name`: اسم العرض
  - `password`: كلمة المرور الحالية
  - `permissions`: مصفوفة صلاحيات

## خطة الفصل (Refactor)
- **المرحلة 1 (مكتملة):** إنشاء نقطة دخول `index.html` + فصل واجهة منصة التشغيل (`style.css`, `app.js`).
- **المرحلة 2 (مكتملة):** فصل CSS/JS الداخليين من `almuheet-enhanced.html` إلى:
  - `almuheet-app.css`
  - `almuheet-app.js`
