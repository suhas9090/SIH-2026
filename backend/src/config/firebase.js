const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    logger.info('Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('Firebase initialization error:', error.message);
    // In demo mode, allow startup without Firebase
    logger.warn('Running without Firebase authentication (DEMO MODE)');
    return null;
  }
};

const getFirebaseAdmin = () => admin;

module.exports = { initFirebase, getFirebaseAdmin };
