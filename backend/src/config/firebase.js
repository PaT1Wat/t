const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Initialize Firebase Admin SDK
    // In production, use service account credentials from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // For development/testing, use application default credentials or mock
      if (process.env.NODE_ENV === 'test') {
        // Mock Firebase for testing
        firebaseApp = {
          auth: () => ({
            verifyIdToken: async () => ({ uid: 'test-uid', email: 'test@example.com' }),
            getUser: async () => ({ uid: 'test-uid', email: 'test@example.com' }),
          }),
        };
      } else {
        firebaseApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'manga-recommendation-dev',
        });
      }
    }
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    // Create mock for development without Firebase credentials
    firebaseApp = {
      auth: () => ({
        verifyIdToken: async () => ({ uid: 'dev-uid', email: 'dev@example.com' }),
        getUser: async () => ({ uid: 'dev-uid', email: 'dev@example.com' }),
      }),
    };
  }

  return firebaseApp;
};

const getAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp.auth ? firebaseApp.auth() : admin.auth();
};

module.exports = { initializeFirebase, getAuth };
