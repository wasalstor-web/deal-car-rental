BookCars — مسار الترجمة (i18n)
==============================

نطاق الأوامر i18n:export / i18n:apply-ar / i18n:bootstrap-ar / i18n:fetch-ar:
  → frontend/src/lang و admin/src/lang فقط (تطبيق الموبايل mobile/lang منفصل ويُحدَّث يدوياً).

التحقق من تطابق ترتيب المفاتيح بين كتل en و ar في تلك المجلدات:
  npm run i18n:verify

تطبيق الموبايل (mobile/lang):
  npm run i18n:verify-mobile   ← تطابق مفاتيح en.ts و ar.ts
  npm run i18n:export-mobile     ← اختياري: locales/mobile-en.json للمراجعة/الترجمة

1) تصدير النصوص الإنجليزية من الكود:
   npm run i18n:export
   → يُنشئ locales/bookcars-en.json (مفاتيح بالشكل: مسار/الملف.ts::KEY)

2) إنشاء ملف العربية (مرة واحدة، أو --force لإعادة النسخ):
   npm run i18n:bootstrap-ar
   → ينسخ bookcars-en.json إلى bookcars-ar.json

3) تعبئة الترجمة العربية في bookcars-ar.json:
   - يدوياً، أو عبر DeepL / Crowdin / Lokalise …
   - أو آلياً: npm run i18n:fetch-ar
     (يستخدم Google Translate غير الرسمي؛ متغيرات اختيارية: GT_DELAY_MS، GT_MAX_CHUNK)

4) حقن العربية في src/lang/*.ts:
   npm run i18n:apply-ar

ملاحظات:
- بعد إضافة مفاتيح جديدة في كتلة `en`، أعد تشغيل export ثم طابق المفاتيح في ar.json ثم apply-ar.
- القوالب التي تحتوي ${...} تُنسخ كما هي من الإنجليزية ما دامت الترجمة في JSON مطابقة للنص الإنجليزي (لتفادي كسر TypeScript).

English summary: export EN → translate bookcars-ar.json → apply-ar to sync TS `ar:` blocks.
