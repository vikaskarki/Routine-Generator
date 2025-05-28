// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Import getAuth to work with Firebase Auth
import { getFirestore } from "firebase/firestore";


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCI2El0upq0vd4Pf6QrLSwEAlcXnyRFRTg",
  authDomain: "routinegeneratorv2.firebaseapp.com",
  projectId: "routinegeneratorv2",
  storageBucket: "routinegeneratorv2.firebasestorage.app",
  messagingSenderId: "348084523734",
  appId: "1:348084523734:web:232d8ba97b0ddbf8d9af77",
  measurementId: "G-Z2792161V8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider(); // Create the Google provider
const db = getFirestore(app);

// Export them to use in other files  

export { auth, provider, db };