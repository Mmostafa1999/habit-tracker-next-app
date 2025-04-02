import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// This file is only loaded on the server side
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
};

// Initialize Firebase Admin SDK
const apps = getApps();
const firebaseAdmin = !apps.length
  ? initializeApp(firebaseAdminConfig)
  : apps[0];

const adminAuth = getAuth(firebaseAdmin);
const adminDb = getFirestore(firebaseAdmin);

export { adminAuth, adminDb, firebaseAdmin };
