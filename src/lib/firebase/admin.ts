import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Check if environment variables are properly defined
const projectId = process.env.FIREBASE_PROJECT_ID || "";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : "";

// Verify all required environment variables are available
if (!projectId || !clientEmail || !privateKey) {
  console.warn(
    "Firebase Admin SDK environment variables are missing or empty. Some admin features may not work.",
  );
}

// This file is only loaded on the server side
const firebaseAdminConfig = {
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
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
