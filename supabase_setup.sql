-- إضافة الأعمدة المفقودة لجدول systems
ALTER TABLE systems
ADD COLUMN IF NOT EXISTS contracts JSONB,
ADD COLUMN IF NOT EXISTS visits JSONB,
ADD COLUMN IF NOT EXISTS auditLogs JSONB,
ADD COLUMN IF NOT EXISTS passwords JSONB,
ADD COLUMN IF NOT EXISTS invoices JSONB,
ADD COLUMN IF NOT EXISTS files JSONB,
ADD COLUMN IF NOT EXISTS drawingVersions JSONB,
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- إضافة الأعمدة المفقودة لجدول users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB,
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- تفعيل Row Level Security
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إذا وجدت
DROP POLICY IF EXISTS "Allow all access on systems" ON systems;
DROP POLICY IF EXISTS "Allow all access on users" ON users;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- إنشاء سياسات RLS للوصول المسموح (للتطوير)
CREATE POLICY "Allow all access on systems" ON systems
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access on users" ON users
FOR ALL USING (true) WITH CHECK (true);

-- سياسات نظام التخزين (Storage) لرفع الملفات
-- السماح للجميع برؤية الملفات
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

-- السماح برفع الملفات (للتبسيط في مرحلة التطوير)
CREATE POLICY "Public Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'files');

-- السماح بحذف الملفات
CREATE POLICY "Public Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'files');
