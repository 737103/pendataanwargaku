import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: "wargadata.firebaseapp.com",
    projectId: "wargadata",
    storageBucket: "wargadata.firebasestorage.app",
    messagingSenderId: "564451935017",
    appId: "1:564451935017:web:23f33f97670ea542c66d38"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
