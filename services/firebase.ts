import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwT4WTmRLfLKiiO7dnIF7Nfii4niVP_HM",
  authDomain: "repair-wizard-65e13.firebaseapp.com",
  projectId: "repair-wizard-65e13",
  storageBucket: "repair-wizard-65e13.firebasestorage.app",
  messagingSenderId: "158752709879",
  appId: "1:158752709879:web:30f3aaa95b3a120d1187f2",
  measurementId: "G-0SFG0PWV6D"
};

// Singleton initialization pattern to prevent multiple app instances and registration errors
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize and export services with the shared app instance
export const auth = getAuth(app);
export const db = getFirestore(app);
