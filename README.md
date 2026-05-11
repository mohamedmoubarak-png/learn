# منصة تعلّم البرمجة التفاعلية

تطبيق عربي RTL لتعليم React بجلسات قصيرة، شرح خطوة بخطوة، XP خفيف، ودروس مفتوحة بدون أقفال. يعمل محلياً بدون مفاتيح خارجية عبر `localStorage` وmock API.

## التشغيل

```bash
npm install
npm run server
npm run dev
```

- الواجهة: `http://localhost:5173`
- الـ API: `http://localhost:4000/api/health`

## الملفات المهمة

- `src/pages/Onboarding.tsx`: خطوتا البداية فقط.
- `src/pages/Dashboard.tsx`: كتالوج React مفتوح، XP، Streak، والشارات.
- `src/pages/CodeChallenge.tsx`: شرح، خطوات تنفيذ، محرر خفيف، وزر إظهار الحل.
- `src/pages/BackendGuide.tsx`: خطوات Supabase/Firebase مع Lightbox.
- `src/data/modules.json`: دروس React المفتوحة والتحديات التعليمية.
- `schema.sql`: جداول Supabase وسياسات RLS.
- `server/routes`: REST API موثق بتعليقات Request/Response.

## البيئة

انسخ `.env.example` إلى `.env` عند ربط خدمات حقيقية. لا تضع مفاتيح سرية في ملفات الواجهة. استخدم `SUPABASE_SERVICE_ROLE_KEY` في الخادم فقط.

## Supabase

نفّذ `schema.sql` داخل SQL Editor. الجداول مفعّل عليها RLS، والسياسات تسمح للمستخدم بقراءة وتعديل بياناته فقط، بينما التحديات للقراءة لكل مستخدم مسجّل.

## Firebase

الربط الاختياري موجود في `src/lib/firebase.ts`. قواعد Firestore المقترحة:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /challenges/{challengeId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

## الصور

المسارات التالية تحتوي placeholders ويمكن استبدالها لاحقاً:

- `public/screenshots/supabase/`
- `public/screenshots/firebase/`
