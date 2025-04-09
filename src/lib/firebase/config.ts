import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  inMemoryPersistence,
  multiFactor,
  onAuthStateChanged,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import {
  addDoc,
  CACHE_SIZE_UNLIMITED,
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  DocumentSnapshot,
  enableIndexedDbPersistence,
  getDoc,
  getDocs,
  initializeFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

// Client-side Firebase configuration
// We only expose the necessary config values for client-side SDK initialization
// This is a common pattern and these values are safe to expose in client-side code
// The actual security relies on Firebase Auth rules and server-side verification
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log whether env vars are properly loaded without exposing sensitive info
console.log("Firebase config loaded:", {
  apiKeyPresent: !!firebaseConfig.apiKey,
  authDomainPresent: !!firebaseConfig.authDomain,
  projectIdPresent: !!firebaseConfig.projectId,
  configComplete:
    !!firebaseConfig.apiKey &&
    !!firebaseConfig.authDomain &&
    !!firebaseConfig.projectId &&
    !!firebaseConfig.appId,
  // Log the auth domain for debugging in production (masked)
  authDomainHint: firebaseConfig.authDomain
    ? `${firebaseConfig.authDomain.substring(0, 4)}...${firebaseConfig.authDomain.substring(firebaseConfig.authDomain.length - 8)}`
    : "missing",
  environment: process.env.NODE_ENV,
});

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
  // Ensure we set the origin for production auth redirects
  origin: typeof window !== "undefined" ? window.location.origin : undefined,
});

// Initialize Firestore with optimized settings
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

// Enable offline persistence for Firestore
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch(err => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn("Firestore persistence unavailable: multiple tabs open");
    } else if (err.code === "unimplemented") {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn("Firestore persistence unavailable in this browser");
    }
  });
}

// Set persistence to inMemory instead of localStorage to prevent security risks
// Our custom cookie-based authentication will handle persistence instead
if (typeof window !== "undefined") {
  setPersistence(auth, inMemoryPersistence).catch(error => {
    console.error("Error setting auth persistence:", error);
  });
}

// Function to initialize MFA for the user
const initMultiFactor = (authInstance: typeof auth) => {
  if (typeof window !== "undefined") {
    try {
      return {
        // Helper for MFA enrollment
        enrollPhoneNumber: async (
          user: User,
          phoneNumber: string,
          appVerifier: RecaptchaVerifier,
        ) => {
          const multiFactorSession = await multiFactor(user).getSession();
          const phoneInfoOptions = {
            phoneNumber,
            session: multiFactorSession,
          };
          const phoneAuthProvider = new PhoneAuthProvider(authInstance);
          const verificationId = await phoneAuthProvider.verifyPhoneNumber(
            phoneInfoOptions,
            appVerifier,
          );
          return verificationId;
        },
        // Complete enrollment with verification code
        completeEnrollment: async (
          user: User,
          verificationId: string,
          verificationCode: string,
        ) => {
          const cred = PhoneAuthProvider.credential(
            verificationId,
            verificationCode,
          );
          const multiFactorAssertion =
            PhoneMultiFactorGenerator.assertion(cred);
          await multiFactor(user).enroll(multiFactorAssertion, "Phone Number");
        },
      };
    } catch (error) {
      console.error("Error initializing multi-factor auth:", error);
      return null;
    }
  }
  return null;
};

const mfa = initMultiFactor(auth);

export {
  addDoc,
  app,
  auth,
  browserPopupRedirectResolver,
  collection,
  createUserWithEmailAndPassword,
  db,
  deleteDoc,
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  getRedirectResult,
  GoogleAuthProvider,
  googleProvider,
  limit,
  mfa,
  onAuthStateChanged,
  onSnapshot,
  orderBy,
  query,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  serverTimestamp,
  setDoc,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  Timestamp,
  updateDoc,
  updateProfile,
  where,
  writeBatch,
};

// Export User type from firebase/auth
export type { User };
