// firebaseConfig.js

import { initializeApp } from "firebase/app";

// Auth (with persistence for React Native)
import { getAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Realtime Database (for bus tracking)
import { getDatabase } from "firebase/database";

// Firestore (for Aadhaar / user verification)
import { getFirestore } from "firebase/firestore";

// 🔐 Your Firebase Config
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

// 🚀 Initialize App
const app = initializeApp(firebaseConfig);

// ✅ Auth (get existing auth or initialize with AsyncStorage persistence)
export const auth = getAuth(app) || initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ Realtime Database (bus tracking)
export const database = getDatabase(app);

// ✅ Firestore (Aadhaar / user data)
export const db = getFirestore(app);

// 📦 Export app
export default app;