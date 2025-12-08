import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Firebase configuration - replace with your config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abc123"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const loginWithEmail = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const logout = async () => {
  return await signOut(auth);
};

export const getIdToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
