
import admin from 'firebase-admin';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// IMPORTANT: This file should only be imported in server-side code (e.g., Server Actions, API routes).

const createFirebaseAdminApp = (): App => {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
};

const adminApp = createFirebaseAdminApp();

const getAdminDb = () => getFirestore(adminApp);
const getAdminAuth = () => getAuth(adminApp);
const FieldValue = admin.firestore.FieldValue;

export { getAdminDb, getAdminAuth, FieldValue };
