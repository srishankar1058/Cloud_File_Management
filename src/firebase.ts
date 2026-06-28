/**
 * Firebase initialization.
 *
 * Reads config from Vite env vars (must be prefixed with VITE_ so the
 * client bundle can see them). Add these to your .env file:
 *
 *   VITE_FIREBASE_API_KEY=
 *   VITE_FIREBASE_AUTH_DOMAIN=
 *   VITE_FIREBASE_PROJECT_ID=
 *   VITE_FIREBASE_STORAGE_BUCKET=
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=
 *   VITE_FIREBASE_APP_ID=
 *
 * In the Firebase console: Authentication -> Sign-in method -> enable
 * "Email/Password". That's the only provider this app uses.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
};
export type { User };

/**
 * Signs the current user out of Firebase.
 * After this resolves, onAuthStateChanged fires with `null`, the app's
 * auth-gate shows the login screen again, and any other email/password
 * can sign in or sign up right away — Firebase does not lock the app to
 * a single account.
 */
export function logout() {
  return signOut(auth);
}
