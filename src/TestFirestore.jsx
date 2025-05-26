// TestFirestore.jsx
import React, { useEffect } from 'react';
import { db } from './firebase'; // Firestore instance from firebase.js
import { collection, addDoc } from 'firebase/firestore'; // Firestore functions

function TestFirestore() {
  useEffect(() => {
     console.log("🚀 TestFirestore mounted");

    const testFirestore = async () => {
      try {
        await addDoc(collection(db, "testCollection"), {
          test: "Hello Firestore!",
          timestamp: new Date()
        });
        console.log("✅ Data added to Firestore successfully!");
      } catch (error) {
        console.error("❌ Error adding document to Firestore: ", error);
      }
    };

    testFirestore();
  }, []);

  return (
    <div>
      <h2>Testing Firestore connection...</h2>
    </div>
  );
}

export default TestFirestore;
