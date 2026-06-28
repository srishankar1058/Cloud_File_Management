import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
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

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let firebaseApp: FirebaseApp | null = null;

export const getFirebaseAuth = () => {
  if (!isFirebaseConfigured) return null;
  firebaseApp ||= initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  void setPersistence(auth, browserLocalPersistence);
  return auth;
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const signInWithEmail = async (email: string, password: string) => {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured.');
  return signInWithEmailAndPassword(auth, email, password);
};

export const createAccountWithEmail = async (email: string, password: string) => {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured.');
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured.');
  return signInWithPopup(auth, new GoogleAuthProvider());
};

export const signOutCurrentUser = async () => {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
};
