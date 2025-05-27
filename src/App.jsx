import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Firebase auth to track user login status
import { auth } from './firebase';

// Import your components
import LoginPage from './LoginPage';
import TestFirestore from './TestFirestore';
import HomePage from './Homepage';
import SignupPage from "./SignupPage";


function App() {
  // `user` will hold the currently logged-in user
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // loading state


  // When the app loads, check if a user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log("Auth state changed: ", currentUser);
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loading screen while checking auth
  }

  return (
    <Router>
      <Routes>
        {/* If user is logged in, go to homepage; else redirect to login */}
        <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />

        {/* If user is NOT logged in, show login; else redirect to homepage */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />

        {/* Optional route: show Firestore test if needed */}
        <Route path="/test" element={<TestFirestore />} />

        {/* If user is NOT registered, show signup; else redirect to homepage */}
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;
