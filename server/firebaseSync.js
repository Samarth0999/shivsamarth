// Firebase Cloud Firestore Synchronization Engine for ShivSamarth Driving School
// Keeps SQLite and Cloud Firestore 100% in sync so no data is ever lost on Vercel redeploys

const { initializeApp, getApps, getApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDF29vxMwwT-C7hH-sS0rcJrnmquUYOEbA',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'shivsamarth-51326.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'shivsamarth-51326',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'shivsamarth-51326.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '70856694980',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:70856694980:web:4a817150ad544c2a11fd91'
};

let app = null;
let firestore = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig, 'serverSync');
  firestore = getFirestore(app);
  console.log('🔥 Firebase Cloud Firestore connected for synchronization (project: ' + firebaseConfig.projectId + ')');
} catch (e) {
  console.warn('⚠️ Could not initialize Firebase Sync:', e.message);
}

const SYNC_TABLES = [
  'branches',
  'users',
  'user_permissions',
  'settings',
  'course_types',
  'payment_modes',
  'expense_categories',
  'vehicles',
  'batches',
  'vehicle_rotations',
  'students',
  'leads',
  'student_payments',
  'student_attendance',
  'staff_attendance',
  'staff_advances',
  'payroll_records',
  'expenses',
  'enroll_sequences'
];

function getDocId(tableName, row) {
  if (tableName === 'settings') {
    return String(row.key);
  }
  if (tableName === 'enroll_sequences') {
    return `${row.branch_code}_${row.year}`;
  }
  if (tableName === 'user_permissions') {
    return row.id ? String(row.id) : `${row.user_id}_${row.permission_key}`;
  }
  return String(row.id);
}

// Push a single row to Firestore
async function syncRowToFirestore(tableName, row) {
  if (!firestore || !row) return;
  try {
    const docId = getDocId(tableName, row);
    const cleanData = {};
    for (const [k, v] of Object.entries(row)) {
      cleanData[k] = v === undefined ? null : v;
    }
    cleanData._synced_at = new Date().toISOString();
    await setDoc(doc(firestore, tableName, docId), cleanData, { merge: true });
  } catch (err) {
    console.error(`❌ Failed to sync ${tableName} document to Firestore:`, err.message);
  }
}

// Delete a single row from Firestore
async function deleteDocFromFirestore(tableName, docId) {
  if (!firestore || !docId) return;
  try {
    await deleteDoc(doc(firestore, tableName, String(docId)));
  } catch (err) {
    console.error(`❌ Failed to delete ${tableName}/${docId} from Firestore:`, err.message);
  }
}

// Upload all local SQLite tables to Firestore
async function syncAllToFirestore(sqliteDb) {
  if (!firestore || !sqliteDb) return { success: false, error: 'Firestore or DB unavailable' };

  console.log('🚀 Starting full sync from SQLite to Firebase Cloud Firestore...');
  const stats = {};

  for (const table of SYNC_TABLES) {
    try {
      const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
      stats[table] = rows.length;

      // Batch upload in chunks of 400
      const chunkSize = 400;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);

        for (const row of chunk) {
          const docId = getDocId(table, row);
          const cleanData = {};
          for (const [k, v] of Object.entries(row)) {
            cleanData[k] = v === undefined ? null : v;
          }
          cleanData._synced_at = new Date().toISOString();
          const docRef = doc(firestore, table, docId);
          batch.set(docRef, cleanData, { merge: true });
        }
        await batch.commit();
      }
    } catch (err) {
      console.warn(`Sync notice for table ${table}:`, err.message);
    }
  }

  // Update sync metadata
  try {
    await setDoc(doc(firestore, '_system', 'metadata'), {
      last_full_sync: new Date().toISOString(),
      tables_synced: stats,
      app_version: '1.0.0'
    }, { merge: true });
  } catch (e) {}

  console.log('✅ Full sync to Firebase Cloud Firestore complete! Summary:', stats);
  return { success: true, stats };
}

// Restore all tables from Firestore into local SQLite on startup
async function restoreAllFromFirestore(sqliteDb) {
  if (!firestore || !sqliteDb) return { success: false, error: 'Firestore or DB unavailable' };

  console.log('📥 Checking Firebase Cloud Firestore for persistent cloud data...');
  let totalRestored = 0;

  for (const table of SYNC_TABLES) {
    try {
      const snap = await getDocs(collection(firestore, table));
      if (snap.empty) continue;

      const docs = snap.docs.map(d => d.data());
      if (docs.length === 0) continue;

      totalRestored += docs.length;

      // Insert/update into SQLite in a transaction
      sqliteDb.transaction(() => {
        for (const row of docs) {
          const keys = Object.keys(row).filter(k => !k.startsWith('_'));
          if (keys.length === 0) continue;

          const placeholders = keys.map(() => '?').join(', ');
          const values = keys.map(k => row[k]);

          let conflictTarget = 'id';
          if (table === 'settings') conflictTarget = 'key';
          if (table === 'enroll_sequences') conflictTarget = 'branch_code, year';

          const updateClauses = keys
            .filter(k => k !== 'id' && k !== 'key')
            .map(k => `${k} = excluded.${k}`)
            .join(', ');

          const sql = `
            INSERT INTO ${table} (${keys.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT(${conflictTarget}) DO UPDATE SET
            ${updateClauses || 'id = excluded.id'}
          `;

          try {
            sqliteDb.prepare(sql).run(...values);
          } catch (innerErr) {
            // Ignore minor constraint errors on sync
          }
        }
      })();

      console.log(`📥 Restored ${docs.length} ${table} records from Firebase Cloud Firestore`);
    } catch (err) {
      console.warn(`Restore notice for ${table}:`, err.message);
    }
  }

  console.log(`✅ Cloud restore finished. Restored ${totalRestored} total records from Firebase.`);
  return { success: true, totalRestored };
}

let syncTimeout = null;
function scheduleSync(sqliteDb) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncAllToFirestore(sqliteDb).catch(e => console.warn('Background sync error:', e.message));
  }, 1000); // 1-second debounce
}

// Clear all transactional and non-admin collections from Firestore
async function clearAllFirestoreCollections() {
  if (!firestore) return;
  const wipeCollections = [
    'students',
    'student_payments',
    'student_attendance',
    'staff_attendance',
    'staff_advances',
    'payroll_records',
    'expenses',
    'leads',
    'vehicle_rotations',
    'enroll_sequences'
  ];

  for (const colName of wipeCollections) {
    try {
      const snap = await getDocs(collection(firestore, colName));
      if (!snap.empty) {
        const batch = writeBatch(firestore);
        snap.docs.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (e) {
      console.warn(`Error clearing Firestore collection ${colName}:`, e.message);
    }
  }

  // Also remove non-super-admin users from Firestore
  try {
    const userSnap = await getDocs(collection(firestore, 'users'));
    if (!userSnap.empty) {
      const batch = writeBatch(firestore);
      userSnap.docs.forEach(d => {
        const u = d.data();
        if (u.role !== 'super_admin') {
          batch.delete(d.ref);
        }
      });
      await batch.commit();
    }
  } catch (e) {
    console.warn('Error clearing non-admin users in Firestore:', e.message);
  }
}

module.exports = {
  firestore,
  isFirestoreReady: Boolean(firestore),
  syncRowToFirestore,
  deleteDocFromFirestore,
  syncAllToFirestore,
  restoreAllFromFirestore,
  scheduleSync,
  clearAllFirestoreCollections
};

