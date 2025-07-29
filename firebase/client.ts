
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAVeM2TIkD-jP_eQkH5ALxLmUdXGV5UwLE",
  authDomain: "prepbot-b5009.firebaseapp.com",
  projectId: "prepbot-b5009",
  storageBucket: "prepbot-b5009.firebasestorage.app",
  messagingSenderId: "1098406323845",
  appId: "1:1098406323845:web:3a9b3a4e9923b35484ebec",
  measurementId: "G-WBKP4MY98W"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) :  getApp();

export const auth = getAuth(app)
export const db = getFirestore(app)