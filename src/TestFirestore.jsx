// Import necessary React and Firebase modules
import React, { useEffect } from 'react';
import { db } from './firebase'; // Firestore instance from firebase.js
import { collection, addDoc } from 'firebase/firestore'; // Firestore functions
import { getAuth } from 'firebase/auth'; // To get the currently logged-in user

function TestFirestore() {
  useEffect(() => {
    console.log("🚀 TestFirestore component mounted");

    // Define an async function to add user data to Firestore
    const testFirestore = async () => {
      const auth = getAuth(); // Get the current Firebase Auth instance
      const user = auth.currentUser; // Get the currently authenticated user

      // Only proceed if a user is logged in
      if (user) {
        try {
          // Add the logged-in user's email and UID to the "testCollection" in Firestore
          await addDoc(collection(db, "testCollection"), {
            email: user.email,       // Store the user's email
            uid: user.uid,           // Store the user's unique Firebase UID
            loginTime: new Date()    // Record the login time
          });

          console.log("✅ User data saved to Firestore successfully!");
        } catch (error) {
          // Log any errors that occur during the Firestore write
          console.error("❌ Error saving user data to Firestore:", error);
        }
      } else {
        // If no user is logged in, show a warning
        console.warn("⚠️ No user is currently logged in. Cannot write to Firestore.");
      }
    };

    // Call the async function
    testFirestore();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  return (
    <div>
      <h2>Testing Firestore connection...</h2>
    </div>
  );
}

export default TestFirestore;
