import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Firebase auth to track user login status
import { auth } from './firebase';

// Import your components
import LoginPage from './LoginPage';
import TestFirestore from './TestFirestore';
import HomePage from './Homepage';

function App() {
  // `user` will hold the currently logged-in user
  const [user, setUser] = useState(null);

  // When the app loads, check if a user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser); // Set user if logged in
    });

    return () => unsubscribe(); // Clean up listener when App unmounts
  }, []);

  return (
    <Router>
      <Routes>
        {/* If user is logged in, go to homepage; else redirect to login */}
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />

        {/* If user is NOT logged in, show login; else redirect to homepage */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />

        {/* Optional route: show Firestore test if needed */}
        <Route path="/test" element={<TestFirestore />} />
      </Routes>
    </Router>
  );
}

export default App;
