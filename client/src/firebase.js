// Firebase configuration and initialization for ShivSamarth Driving School
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

// Read Firebase credentials from Vite environment variables (.env / client/.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Check if credentials are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
);

let app = null;
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    console.log('🔥 Firebase initialized successfully for project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
  }
} else {
  console.info(
    'ℹ️ Firebase is ready to connect. Add your VITE_FIREBASE_* credentials in client/.env or Vercel Environment Variables.'
  );
}

// -------------------------------------------------------------
// Authentication Helpers
// -------------------------------------------------------------
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not configured. Please supply your Firebase credentials.');
  }
  return signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please supply your Firebase credentials.');
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export const logOutFirebase = async () => {
  if (!auth) return;
  return firebaseSignOut(auth);
};

// -------------------------------------------------------------
// Firestore Database Helpers (Cloud Persistence)
// -------------------------------------------------------------
export const getFirestoreCollection = (collectionName) => {
  if (!db) return null;
  return collection(db, collectionName);
};

export const saveToFirestore = async (collectionName, docId, data) => {
  if (!db) {
    console.warn('Firestore is not configured. Data saved locally only.');
    return null;
  }
  const docRef = doc(db, collectionName, String(docId));
  await setDoc(docRef, { ...data, updated_at: serverTimestamp() }, { merge: true });
  return docRef;
};

export const getFromFirestore = async (collectionName, docId) => {
  if (!db) return null;
  const docRef = doc(db, collectionName, String(docId));
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

export const getAllFromFirestore = async (collectionName) => {
  if (!db) return [];
  const colRef = collection(db, collectionName);
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// -------------------------------------------------------------
// Firebase Cloud Storage Helpers (Photos, Documents, Licenses)
// -------------------------------------------------------------
export const uploadFileToStorage = async (filePath, file) => {
  if (!storage) {
    throw new Error('Firebase Storage is not configured.');
  }
  const storageRef = ref(storage, filePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
};

export {
  app,
  auth,
  db,
  storage,
  googleProvider,
  firebaseConfig,
  // Direct firestore exports
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  // Direct auth exports
  onAuthStateChanged
};
export default app;

