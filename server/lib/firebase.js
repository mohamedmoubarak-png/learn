export const firebaseProjectId = process.env.FIREBASE_PROJECT_ID ?? null

// Security Rules المرتبطة: هذا بديل إعداد فقط حتى لا نضيف Admin SDK قبل وجود مشروع فعلي.
export const hasFirebaseServerConfig = Boolean(firebaseProjectId)
