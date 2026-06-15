// Firebase configuration
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
// Note: getStorage is imported but Storage might not be enabled in this project.
// We use it lazily and fall back to data URLs in firebaseServices.ts.
import { getStorage } from 'firebase/storage';

// Set to true if you've enabled Firebase Storage in your project console.
// When false, image uploads will skip the Storage attempt and use data URLs directly.
export const FIREBASE_STORAGE_ENABLED = false;

const firebaseConfig = {
  apiKey: 'AIzaSyCvg9p8rG9o_ZY2xm9s_HxyVP3YG1Sei6w',
  authDomain: 'mobile-expert-3d12a.firebaseapp.com',
  databaseURL: 'https://mobile-expert-3d12a-default-rtdb.firebaseio.com',
  projectId: 'mobile-expert-3d12a',
  storageBucket: 'mobile-expert-3d12a.firebasestorage.app',
  messagingSenderId: '806385557119',
  appId: '1:806385557119:web:20c7204a748de423f0694a',
  measurementId: 'G-1Z29YD53RY',
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Analytics (only in browser, not in SSR)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export { analytics };
export default app;
