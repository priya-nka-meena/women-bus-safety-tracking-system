import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

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

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export default app;