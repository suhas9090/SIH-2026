// Firebase Client Configuration
// Production-style setup with Auth, Firestore, Storage, and App Check support
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDsqsvn8QbCmxVDQL0xihEBcm7Y-Xy3__s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "compylgem-sih-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "compylgem-sih-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "compylgem-sih-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "548628508289",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:548628508289:web:def602fcfb2dceb421e780"
};

// Initialize Core App safely (handles Fast Refresh / Hot Reloading in Vite)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional App Check Initialization
if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  }).catch(err => console.warn('App Check initialization skipped:', err.message));
}

export default app;
