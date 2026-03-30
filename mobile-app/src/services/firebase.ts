import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCsq-AZBjTvfs7dZiGFyAE-kEYUWX_-kqo",
  authDomain: "women-bus-safety.firebaseapp.com",
  databaseURL: "https://women-bus-safety-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "women-bus-safety",
  storageBucket: "women-bus-safety.firebasestorage.app",
  messagingSenderId: "1081292537985",
  appId: "1:1081292537985:web:b234393ce9f9eea221cd80",
  measurementId: "G-QSVCPEH38R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDB = getDatabase(app);

export default app;
