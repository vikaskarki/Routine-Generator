import React, { useState } from "react";
import "./LoginPage.css"; // This file holds the styles

// Importing Firebase functions
import { auth, provider } from "./firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

function LoginPage() {
  // These will store what the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // This function runs when we click the Google Sign-In button
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider); // Sign in using Google popup
      alert("✅ Signed in with Google!");
    } catch (error) {
      console.error("Google Sign-In Error:", error); // Log errors in console
      alert("❌ Google Sign-In Failed.");
    }
  };

  // This runs when user clicks the Login button
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password); // Login using email and password
      // alert("✅ Logged in successfully!");
    } catch (error) {
      console.error("Login Error:", error);
      alert("❌ Invalid email or password.");
    }
  };

  // This runs when user clicks the Sign Up button
  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password); // Create new account
      alert("✅ Account created successfully! You can now log in.");
    } catch (error) {
      console.error("Signup Error:", error);
      alert("❌ Signup failed. Email might already be in use.");
    }
  };

  return (
    // This covers the full screen
    <div className="login-page">
      {/* This is the card in the center */}
      <div className="login-card">
        <h2 className="title">Welcome</h2>

        {/* Email input */}
        <label>Email</label>
        <input
          type="email"
          placeholder="Type your email"
          value={email} // connects input to state
          onChange={(e) => setEmail(e.target.value)} // updates email state
        />

        {/* Password input */}
        <label>Password</label>
        <input
          type="password"
          placeholder="Type your password"
          value={password} // connects input to state
          onChange={(e) => setPassword(e.target.value)} // updates password state
        />

        {/* Login button */}
        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

        {/* Sign Up button */}
        <button className="signup-btn" onClick={handleSignup}>
          Sign Up
        </button>

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
