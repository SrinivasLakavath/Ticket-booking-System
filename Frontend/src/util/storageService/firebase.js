import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_REACT_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_REACT_APP_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'messagingSenderId',
  'appId',
];

const missing = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missing.length > 0) {
  console.warn(
    `[CineSeat] Firebase Auth config incomplete. Missing: ${missing.join(', ')}. ` +
      'Copy Frontend/.env.example to Frontend/.env and fill Firebase values.'
  );
}

let app = null;
try {
  app = initializeApp(firebaseConfig);
} catch (err) {
  console.error('[CineSeat] Firebase failed to initialize:', err);
}

/** Firebase Authentication (Spark / free plan) */
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Storage is optional and currently needs Blaze on new Firebase projects.
 * Only initialize when a bucket is configured; uploads may still fail without Blaze.
 */
export const storage =
  app && firebaseConfig.storageBucket ? getStorage(app) : null;

/** Analytics (free; browser-only) */
export let analytics = null;
if (typeof window !== 'undefined' && app) {
  isSupported()
    .then((ok) => {
      if (ok && firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      /* analytics unavailable */
    });
}

export default app;
