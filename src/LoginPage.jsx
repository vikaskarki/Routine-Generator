import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // This file holds the styles

// Importing Firebase functions
import { auth, provider } from "./firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";



function LoginPage() {
  // These will store what the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();


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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Logged in user:", userCredential.user);
      // alert("✅ Logged in successfully!");
    } catch (error) {
      console.error("Login Error:", error.code, error.message);
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


  // This runs when user clicks the forget password button
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email); // ✅ correctly calling the function
      alert("📧 If this email is registered, a password reset link has been sent.");
    } catch (error) {
      console.error("Forgot Password Error:", error);
      alert(`❌ ${error.message}`);
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
        <button className="signup-btn" onClick={() => navigate("/signup")}>
          Sign Up
        </button>


        {/* Forgot Password */}
        <button className="forgot-password-btn" onClick={handleForgotPassword}>
          Forgot Password?
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
