import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';

// Firebase configuration - use environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:123456789:web:abcdef'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    return null;
  }
};

// Error message translations
const getErrorMessage = (code: string): string => {
  const messages: { [key: string]: string } = {
    'auth/email-already-in-use': 'อีเมลนี้ถูกใช้งานแล้ว',
    'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
    'auth/operation-not-allowed': 'การดำเนินการนี้ไม่ได้รับอนุญาต',
    'auth/weak-password': 'รหัสผ่านไม่ปลอดภัยเพียงพอ (ขั้นต่ำ 6 ตัวอักษร)',
    'auth/user-disabled': 'บัญชีผู้ใช้ถูกระงับ',
    'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้',
    'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
    'auth/too-many-requests': 'มีการเข้าสู่ระบบผิดพลาดหลายครั้ง กรุณาลองใหม่ภายหลัง',
    'auth/popup-closed-by-user': 'หน้าต่างเข้าสู่ระบบถูกปิด',
    'auth/cancelled-popup-request': 'การเข้าสู่ระบบถูกยกเลิก',
  };
  return messages[code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
};

export type { FirebaseUser };
