// Firebase Admin SDK initialization for ShivSamarth Driving School backend
const admin = require('firebase-admin');

let adminApp = null;
let adminAuth = null;
let adminDb = null;
let adminStorage = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // 1. JSON string of service account in environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('🔥 Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_KEY');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // 2. File path to service account JSON
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('🔥 Firebase Admin initialized via service account file');
  } else if (process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // 3. Default application credentials
    adminApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('🔥 Firebase Admin initialized via application default credentials');
  } else {
    console.info('ℹ️ Firebase Admin ready for credentials (FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID).');
  }

  if (adminApp) {
    adminAuth = admin.auth();
    adminDb = admin.firestore();
    adminStorage = admin.storage();
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization deferred:', error.message);
}

module.exports = {
  admin,
  adminApp,
  adminAuth,
  adminDb,
  adminStorage,
  isFirebaseAdminConfigured: Boolean(adminApp)
};

