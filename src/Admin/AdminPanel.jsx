import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './AdminPanel.css';


const AdminPanel = () => {
    const [year, setYear] = useState("");
    const [semester, setSemester] = useState("");
    const [department, setDepartment] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [subjectName, setSubjectName] = useState("");
    const [credit, setCredit] = useState("");
    const [adminEmail, setAdminEmail] = useState("");

    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setAdminEmail(user.email);
            } else {
                navigate("/login");
            }
        });

        return () => unsubscribe();
    }, [auth, navigate]);


    const handleAddSubject = () => {
        if (subjectName && credit) {
            setSubjects([...subjects, { name: subjectName, credit }]);
            setSubjectName("");
            setCredit("");
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const yearSemesterMap = {
        "1st Year": ["1st Semester", "2nd Semester"],
        "2nd Year": ["3rd Semester", "4th Semester"],
        "3rd Year": ["5th Semester", "6th Semester"],
        "4th Year": ["7th Semester", "8th Semester"],
    };


    return (
        <div className="admin-panel-container">
            <div className="admin-panel-header">
                <h2>🛠 Admin Panel</h2>
                <div className="admin-panel-user-info">
                    <span>Logged in as: <strong>{adminEmail}</strong></span>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="admin-panel-section">
                <label>Year:</label>
                <select value={year} onChange={(e) => {
                    setYear(e.target.value);
                    setSemester("");
                }}>
                    <option value="">Select Year</option>
                    {Object.keys(yearSemesterMap).map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                    ))}
                </select>
            </div>

            {year && (
                <div className="admin-panel-section">
                    <label>Semester:</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                        <option value="">Select Semester</option>
                        {yearSemesterMap[year].map((sem) => (
                            <option key={sem} value={sem}>{sem}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="admin-panel-section">
                <label>Department:</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">Select Department</option>
                    <option value="Computer">Computer</option>
                    <option value="IT">IT</option>
                </select>
            </div>

            <hr />

            <h3>Add Subject</h3>
            <div className="subject-form">
                <input
                    type="text"
                    placeholder="Subject Name"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Credit"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                />
                <button onClick={handleAddSubject}>Add Subject</button>
            </div>

            <ul className="subject-list">
                {subjects.map((subj, idx) => (
                    <li key={idx}>{subj.name} - {subj.credit} credit(s)</li>
                ))}
            </ul>
        </div>
    );
};

export default AdminPanel;