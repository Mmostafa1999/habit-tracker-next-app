import { ServiceResult, BaseService } from "../common/types";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthService extends BaseService {
  // Authentication methods
  signInWithEmail(email: string, password: string): Promise<ServiceResult<UserProfile>>;
  signUpWithEmail(email: string, password: string, displayName?: string): Promise<ServiceResult<UserProfile>>;
  signInWithGoogle(): Promise<ServiceResult<UserProfile>>;
  signOut(): Promise<ServiceResult<void>>;
  resetPassword(email: string): Promise<ServiceResult<void>>;
  
  // User profile methods
  getCurrentUser(): Promise<ServiceResult<UserProfile | null>>;
  updateUserProfile(data: Partial<UserProfile>): Promise<ServiceResult<UserProfile>>;
  
  // Token and verification methods
  verifyToken(): Promise<ServiceResult<boolean>>;
  getToken(): Promise<ServiceResult<string | null>>;
  
  // Auth state
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void;
  
  // User data initialization
  initializeUserData(user: UserProfile): Promise<ServiceResult<void>>;
} 