Firestore setup (development)

1) Open Firebase Console → Firestore Database → Rules.

2) For quick testing use the following rules (allow read/write for authenticated users):

service cloud.firestore {
  match /databases/{database}/documents {
    match /systems/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}

3) If you use anonymous auth (app calls `signInAnonymously()`), ensure Authentication → Sign-in method → Anonymous is enabled.

4) Deployment:
- After editing rules in the Console, click "Publish".

5) Security note:
- The above rules are permissive for development. For production, restrict writes to specific admin UIDs or implement role-based checks.

6) Manual bootstrap (optional):
- Use the app Settings → السحابة → ⚙️ تهيئة السحابة to create the initial `systems/main` document.
- Or use the Console: create collection `systems`, document id `main`, and paste a JSON payload with keys: `contracts`, `visits`, `auditLogs`, `passwords`, `invoices`, `files`, `drawingVersions`.

7) Troubleshooting:
- If the app reports `محظور محلياً (إضافات)`, disable browser extensions like AdBlock or enable the "تجاوز حجب المتصفّح (Force Cloud)" checkbox in Settings.
- Ensure network allows access to `firestore.googleapis.com` and other Google APIs.
