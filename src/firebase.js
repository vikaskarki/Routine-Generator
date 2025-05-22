// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Import getAuth to work with Firebase Auth
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUvHQ32tJHmoSQYs4uW0-y5GkO3io3E1I",
  authDomain: "routine-generator-9da44.firebaseapp.com",
  projectId: "routine-generator-9da44",
  storageBucket: "routine-generator-9da44.firebasestorage.app",
  messagingSenderId: "184731543872",
  appId: "1:184731543872:web:35c83cdba288baccb6f2a5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export auth
const auth = getAuth(app);

// Create the Google provider
const provider = new GoogleAuthProvider();

// Export them to use in other files
export { auth, provider };