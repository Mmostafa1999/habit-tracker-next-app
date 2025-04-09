import { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { setAuthCookies } from "./authCookies";
import { mapUserToProfile } from "./userProfileUtils";
import { initializeUserData } from "./userDataInitialization";

/**
 * Processes a successful Google sign-in
 */
export async function processGoogleSignIn(user: User): Promise<void> {
  // Check if user exists in Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));

  // If user doesn't exist, create a new user record
  if (!userDoc.exists()) {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    // Initialize user data (achievements, etc.)
    const profile = mapUserToProfile(user);
    await initializeUserData(profile);
  } else {
    // Update last login time
    await setDoc(
      doc(db, "users", user.uid),
      { lastLogin: serverTimestamp() },
      { merge: true },
    );
  }

  // Get the Firebase ID token
  const idToken = await user.getIdToken();

  // Save token in a secure HTTP-only cookie via API call
  await setAuthCookies(idToken);
} 