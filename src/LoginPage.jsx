import React from "react";
import "./LoginPage.css"; // This file holds the styles

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase"; // Make sure provider is exported

function LoginPage() {
  // This runs when we click the Google Sign-In button
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider); // Popup Google sign in
      alert("Signed in with Google!");
    } catch (error) {
      console.error("Google Sign-In Error:", error); // Show error
    }
  };

  return (
    // This covers the whole screen
    <div className="login-page">
      {/* This is the white card in the center */}
      <div className="login-card">
        <h2 className="title">Welcome</h2>

        {/* Email input box */}
        <label>Email</label>
        <input type="email" placeholder="Type your email" />

        {/* Password input box */}
        <label>Password</label>
        <input type="password" placeholder="Type your password" />

        {/* Login button (does nothing for now) */}
        <button className="login-btn">Login</button>

        {/* Divider */}
        <p className="or-text">or sign in using</p>

        {/* Google login button */}
        <button className="google-btn" onClick={handleGoogleSignIn}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            style={{ width: "20px", height: "20px" }}
          />
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
