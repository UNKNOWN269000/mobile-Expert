import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';
import { saveUserProfileToRTDB, UserProfileDoc } from './firebaseServices';
import { isAdminEmail } from './adminConfig';

export type UserProfile = UserProfileDoc;

export interface SignUpData {
  name: string;
  mobile: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (fields: { displayName?: string; mobile?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Create or update a user profile in Realtime Database. */
async function saveUserProfile(
  firebaseUser: User,
  provider: 'email' | 'google',
  displayName?: string,
  mobile?: string
): Promise<UserProfile> {
  return saveUserProfileToRTDB(firebaseUser.uid, {
    email: firebaseUser.email || '',
    displayName:
      displayName ||
      firebaseUser.displayName ||
      (firebaseUser.email?.split('@')[0] ?? 'User'),
    mobile,
    photoURL: firebaseUser.photoURL || '',
    provider,
    role: isAdminEmail(firebaseUser.email) ? 'admin' : 'user',
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // Detect provider: Google users have providerData with 'google.com'
          const isGoogle = u.providerData.some((p) => p.providerId === 'google.com');
          const provider: 'email' | 'google' = isGoogle ? 'google' : 'email';
          const p = await saveUserProfile(u, provider);
          setProfile(p);
        } catch (err) {
          console.error('Failed to save user profile:', err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // profile will be saved by the onAuthStateChanged listener
  };

  const signUp = async (data: SignUpData) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    if (cred.user) {
      // Set the display name on the Firebase auth profile too
      try {
        await firebaseUpdateProfile(cred.user, { displayName: data.name });
      } catch (err) {
        console.warn('Could not set displayName on auth profile:', err);
      }
      try {
        await saveUserProfile(cred.user, 'email', data.name, data.mobile);
      } catch (err) {
        console.error('Failed to save new user profile:', err);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const { getUserProfile } = await import('./firebaseServices');
    const p = await getUserProfile(user.uid);
    setProfile(p);
  };

  /** Update editable profile fields. Writes to both Firebase Auth and RTDB. */
  const updateProfile = async (fields: { displayName?: string; mobile?: string }) => {
    if (!user) throw new Error('Not signed in');
    const { updateUserProfile } = await import('./firebaseServices');
    const updates: { displayName?: string; mobile?: string } = {};
    if (fields.displayName !== undefined) updates.displayName = fields.displayName;
    if (fields.mobile !== undefined) updates.mobile = fields.mobile;
    await updateUserProfile(user.uid, updates);
    // Also update the Firebase auth displayName so other parts of the app
    // (header avatar, etc.) see the new name immediately.
    if (fields.displayName !== undefined) {
      try {
        await firebaseUpdateProfile(user, { displayName: fields.displayName });
      } catch {
        // non-fatal
      }
    }
    // Re-fetch the profile so the UI updates
    await refreshProfile();
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        signIn,
        signUp,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
