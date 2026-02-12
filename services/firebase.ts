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

// Singleton initialization pattern to prevent "already exists" and "not registered" errors.
// By using exactly the same versions and bundling flags in the importmap, getAuth(app) will work correctly.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
