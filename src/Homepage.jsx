// Importing React, Firebase auth, and CSS
import React from 'react';
import './HomePage.css';
import { auth } from './firebase'; // Firebase auth instance
import { useNavigate } from 'react-router-dom'; // Used to redirect user after logout
import TestFirestore from './TestFirestore';

const HomePage = () => {
  const navigate = useNavigate(); // Hook to navigate programmatically

  // Get the current logged-in user
  const currentUser = auth.currentUser;

  // Logout function
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Firebase sign out
      navigate('/login');   // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div>
      {/* Top header bar */}
      <header className="header">
        {/* App title */}
        <h1>Routine Generator</h1>

        {/* User info and logout button */}
        <div className="user-controls">
          <span className="username">
            {/* Display logged-in user's email or "User" as fallback */}
            Hi, {currentUser?.displayName || "User"}

          </span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <TestFirestore/>

      {/* Main content layout */}
      <div className="container">
        <div className="main-content">
          <h2>Welcome to Your Routine Generator</h2>

          {/* Semester dropdown */}
          <label htmlFor="semester">Select Semester:</label>
          <select id="semester">
            <option>1st</option>
            <option>2nd</option>
            <option>3rd</option>
            <option>4th</option>
            <option>5th</option>
            <option>6th</option>
            <option>7th</option>
            <option>8th</option>
          </select>

          {/* Department dropdown */}
          <label htmlFor="department">Select Department:</label>
          <select id="department">
            <option>Computer Engineering</option>
            <option>Civil Engineering</option>
            <option>IT Engineering</option>
          </select>

          {/* Periods per day input */}
          <label htmlFor="periods">Periods per day:</label>
          <input type="number" id="periods" min="1" max="10" placeholder="e.g. 6" />

          {/* Working days checkboxes */}
          <label>Working Days:</label>
          <div className="checkbox-group">
            <label><input type="checkbox" /> Monday</label>
            <label><input type="checkbox" /> Tuesday</label>
            <label><input type="checkbox" /> Wednesday</label>
            <label><input type="checkbox" /> Thursday</label>
            <label><input type="checkbox" /> Friday</label>
          </div>

          {/* Generate button */}
          <button className="generate-btn">Generate Routine</button>
        </div>

        {/* Sidebar navigation */}
        <div className="sidebar">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#">Add Teachers</a></li>
            <li><a href="#">Add Subjects</a></li>
            <li><a href="#">View Routines</a></li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer>
        &copy; 2025 Routine Generator. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
