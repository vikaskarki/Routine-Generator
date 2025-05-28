import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

// Importing Firebase functions
import { signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail, GoogleAuthProvider, } from "firebase/auth";
import { auth, provider } from "./firebase";

function LoginPage() {
  // These will store what the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();


  // This function runs when we click the Google Sign-In button
  const handleGoogleSignIn = async () => {
    try {
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);

      if (!signInMethods.includes("google.com")) {
        alert("❌ Account not registered with Google. Please sign up first.");
        await auth.signOut(); // Important: logout the user
        return;
      }

      navigate("/HomePage"); // or your desired route
    } catch (error) {
      console.error("Google Sign-In Failed:", error.message);
      alert("❌ Google Sign-In Failed. Please try again.");
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
      if (error.code === "auth/user-not-found") {
        alert("❌ Account not registered. Please sign up first.");
      } else if (error.code === "auth/wrong-password") {
        alert("❌ Incorrect password.");
      } else if (error.code === "auth/invalid-email") {
        alert("❌ Invalid email format.");
      } else if (error.code === "auth/user-disabled") {
        alert("❌ Your account has been disabled.");
      } else {
        alert(`❌ Login failed: ${error.message}`);
      }
    }


  };

  // const handleSignup = async () => {
  //   try {
  //     await createUserWithEmailAndPassword(auth, email, password); // Create new account
  //     alert("✅ Account created successfully! You can now log in.");
  //   } catch (error) {
  //     console.error("Signup Error:", error);
  //     alert("❌ Signup failed. Email might already be in use.");
  //   }
  // };


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
        <input type="password" placeholder="Type your password"
          value={password} onChange={(e) => setPassword(e.target.value)}
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

        {/* 
        
        <p className="or-text">or sign in using</p>

        // Google login button 
        <button className="google-btn" onClick={handleGoogleSignIn}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            style={{ width: "20px", height: "20px" }}
          />
        </button>
         */}
      </div>
    </div>
  );
}

export default LoginPage;
