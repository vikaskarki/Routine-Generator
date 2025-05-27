import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Used for redirecting user
import { createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebase"; // Firebase Auth instance
import "./SignupPage.css"; // Import styles

function SignupPage() {
    // State variables to store input values
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate(); // For redirecting user after signup

    // Function to handle user signup
    const handleSignup = async () => {
        if (!name || !email || !password) {
            alert("⚠️ Please fill in all fields.");
            return;
        }

        // email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("❌ Please enter a valid email address.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // ✅ Update the user's display name in Firebase
            await updateProfile(userCredential.user, {
                displayName: name,
            });

            // ✅ Send email verification
            await sendEmailVerification(userCredential.user);

            // ✅ Sign out to go to login
            await signOut(auth);


            alert("✅ Account created! Please log in.");
            navigate("/login");


        } catch (error) {
            console.error("Signup Error:", error);
            alert(`❌ Signup failed: ${error.message}`);
        }
    };

    //signup form
    return (
        <div className="login-page">
            <div className="login-card">
                <h2 className="title">Create Account</h2>

                {/*Input Field */}
                <label>Name</label>
                <input type="text" placeholder="Enter your name"
                    value={name} onChange={(e) => setName(e.target.value)} // Update name state
                />

                <label>Email</label>
                <input type="email" placeholder="Enter your email"
                    value={email} onChange={(e) => setEmail(e.target.value)} // Update email state
                />

                <label>Password</label>
                <input type="password" placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)} // Update password state
                />


                <button className="signup-btn" onClick={handleSignup}>
                    Sign Up
                </button>

                <p className="or-text">Already have an account?</p>
                <button className="login-btn" onClick={() => navigate("/login")}>
                    Go to Login
                </button>
            </div>
        </div>
    );
}

export default SignupPage;
