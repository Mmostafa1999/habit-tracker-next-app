import { User } from "firebase/auth";
import { UserProfile } from "../authService";

/**
 * Maps a Firebase User to our UserProfile interface
 */
export function mapUserToProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

/**
 * Cleans up Firebase data from localStorage
 */
export function cleanFirebaseLocalStorage(): void {
  const keysToRemove = [
    "firebase:authUser:",
    "firebase:host:",
    "firebase:app:",
  ];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && keysToRemove.some(prefix => key.startsWith(prefix))) {
      localStorage.removeItem(key);
    }
  }
} 