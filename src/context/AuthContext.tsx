import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection } from '../firebase';
import { TeacherProfile, TeacherSettings } from '../types';

interface AuthContextType {
  currentUser: User | null;
  teacherProfile: TeacherProfile | null;
  settings: TeacherSettings | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateSettings: (newSettings: Partial<TeacherSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [settings, setSettings] = useState<TeacherSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Test connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Sync or create Teacher Profile
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          let profile: TeacherProfile;
          if (userSnap.exists()) {
            profile = userSnap.data() as TeacherProfile;
          } else {
            profile = {
              uid: user.uid,
              email: user.email || 'rehanali55555@gmail.com',
              displayName: user.displayName || 'Rehan Sir',
              tuitionName: 'Rehan Sir Classes',
              phone: '+91 98765 43210',
              address: 'Near City Market, Main Road, India',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userRef, profile);
          }
          setTeacherProfile(profile);

          // Sync or create Teacher Settings
          const settingsRef = doc(db, 'settings', user.uid);
          const settingsSnap = await getDoc(settingsRef);

          let initialSettings: TeacherSettings;
          if (settingsSnap.exists()) {
            initialSettings = settingsSnap.data() as TeacherSettings;
          } else {
            initialSettings = {
              teacherUid: user.uid,
              teacherName: user.displayName || 'Rehan Sir',
              tuitionName: 'Rehan Sir Classes',
              teacherPhone: '+91 98765 43210',
              tuitionAddress: 'Near City Market, Main Road, India',
              currency: 'INR',
              timezone: 'Asia/Kolkata',
              dailyReminderEnabled: true,
              whatsappReminderEnabled: true,
              smsReminderEnabled: false,
              updatedAt: new Date().toISOString(),
            };
            await setDoc(settingsRef, initialSettings);
          }
          setSettings(initialSettings);
        } catch (err) {
          console.error("Error initializing teacher profile/settings:", err);
        }
      } else {
        setTeacherProfile(null);
        setSettings(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const updateSettings = async (newSettings: Partial<TeacherSettings>) => {
    if (!currentUser || !settings) return;
    const path = `settings/${currentUser.uid}`;
    try {
      const updated: TeacherSettings = {
        ...settings,
        ...newSettings,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'settings', currentUser.uid), updated);
      setSettings(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        teacherProfile,
        settings,
        loading,
        signInWithGoogle,
        signOutUser,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
