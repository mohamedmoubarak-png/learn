# بنكور | Bankor G3 Academy — Smart Planner MVP

An initial **React Native + Expo** prototype extracted from the user's original `Banker_G3_app.zip`. It includes 113 extracted reading lessons, their study material, the original question data, a smart finish-by-deadline study plan, local progress, mascot moods, notifications, and XP achievements. This is an **early prototype**, not the completed Duolingo-style platform, and has not yet been built into a tested APK.

## التحكم الكامل في الجدول

- **موعد الامتحان ووقته:** `examDate`, `examTime` — يحددهم المستخدم ولا يتغيروا تلقائيًا.
- **آخر يوم لإنهاء الماتريال:** `deadline` — مستقل عن الامتحان، وقبل الامتحان بيوم على الأقل في الواجهة الحالية.
- **الأيام العادية:** وقت بدء المذاكرة وإجمالي دقائقها لأيام العمل والجمعة/السبت، مع أيام راحة اختيارية.
- **إجازة الأسبوع الحالي:** إعداد سريع بـ4 أو 6 أو 8 ساعات في اليوم. الافتراضي لأسبوع 25–29 أكتوبر 2026 هو 6 ساعات على 3 جلسات: `09:00-11:00`, `13:00-15:00`, `18:00-20:00`.
- **يوم مخصوص:** جداول استثنائية قابلة للتحرير لكل تاريخ، مثل `09:00-11:30, 14:00-17:00, 20:00-21:00` أو يوم راحة.
- **إعادة الحساب:** يعيد توزيع الدروس المتبقية بحسب تقدّم القراءة والقدرة الفعلية لكل يوم، دون تغيير الموعد النهائي أو تعليم دروس غير مقروءة بأنها مكتملة.
- **الإنذارات:** عند عدم كفاية الوقت يظهر العجز والزيادة اليومية المطلوبة.
- **إشعارات الهاتف:** تُجدول محليًا عند بدء جلسات اليوم، وتُحدّث عند تشغيل التطبيق أو تغيير الخطة، وتحتاج إذن الإشعارات. لا يعني ذلك وجود متابعة خلفية مستقلة عند إغلاق التطبيق تمامًا.
- **الأيقونة المتغيرة:** تجربة أولية تتطلب Native Build ودعم الجهاز، وتتحدث عند تشغيل كود التطبيق، وليس بالضرورة أثناء إغلاقه.

## تشغيل المشروع

Requires Node.js (LTS), Expo-compatible Android development environment / Expo Go for compatible features, and optionally EAS for builds.

```bash
npm install
npm start
```

For a native Android development or production build, use Expo EAS Build once credentials are configured and native packages are validated. The alternative-icon plugin requires a native build and cannot be fully tested in Expo Go.

## اختبار محرك الخطة (لا يحتاج لتشغيل Android)

```bash
npm run test:planner
```

The script compiles the pure TypeScript schedule engine and runs deterministic tests for: completion XP deduplication, at-risk detection, backfilled progress, vacation 4/6/8 hour capacity, editable study blocks, overlapping time validation, separate exam and completion dates, and automatic replanning.

## حدود هذه النسخة

- Imported study content needs **subject-matter verification** against the bank's current official material; do not consider the generated lesson text authoritative.
- A complete native compile and UI test were **not performed** in this environment (project dependencies not installed).
- The interface provides free-text date/time entry with validation; a native date/time picker is a future UX improvement.
- AI-based spaced repetition, full assessment flows, polished native icon mood switching, and richer Duolingo-style animations remain for later phases.
- Times and dates are calculated in the mobile device's local timezone. Event reminders only schedule over a bounded upcoming window and refresh when the app runs; absolute background auto-replanning needs additional platform-appropriate infrastructure.
