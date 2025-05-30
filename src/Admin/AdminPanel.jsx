import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from '../firebase';
import { collection, addDoc } from "firebase/firestore";
import { getDocs, query, where } from "firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";

import './AdminPanel.css';

const AdminPanel = () => {
    const [year, setYear] = useState("");
    const [semester, setSemester] = useState("");
    const [department, setDepartment] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [credit, setCredit] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [allSubjects, setAllSubjects] = useState([]);
    const [editMode, setEditMode] = useState(null);
    const [editName, setEditName] = useState("");
    const [editCredit, setEditCredit] = useState("");

    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
            setAdminEmail(currentUser.email);
        }

        fetchSubjects();
    }, [department, year, semester]);


    const fetchSubjects = async () => {
        if (!department || !year || !semester) {
            setAllSubjects([]);
            return;
        }

        try {
            const q = query(
                collection(db, "subjects"),
                where("department", "==", department),
                where("year", "==", year),
                where("semester", "==", semester)
            );

            const querySnapshot = await getDocs(q);
            const fetched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllSubjects(fetched);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };



    const handleAddSubject = async () => {
        if (!subjectName || !credit || !department || !year || !semester) {
            alert("Please fill all fields before adding a subject.");
            return;
        }

        try {
            // Check if subject already exists
            const q = query(
                collection(db, "subjects"),
                where("subjectName", "==", subjectName),
                where("department", "==", department),
                where("year", "==", year),
                where("semester", "==", semester)
            );

            const existing = await getDocs(q);

            if (!existing.empty) {
                alert("Subject already exists for the selected department, year, and semester.");
                return;
            }

            // Add if not exists
            const newSubject = {
                subjectName,
                credit: Number(credit),
                department,
                year,
                semester,
            };

            await addDoc(collection(db, "subjects"), newSubject);

            setSubjectName("");
            setCredit("");
            alert("Subject added successfully.");
            fetchSubjects(); // refresh list
        } catch (error) {
            console.error("Error adding subject:", error);
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

    const handleEdit = (subj) => {
        setEditMode(subj.id);
        setEditName(subj.subjectName);
        setEditCredit(subj.credit);
    };

    const handleUpdate = async (id) => {
        try {
            const subjectRef = doc(db, "subjects", id);
            await updateDoc(subjectRef, {
                subjectName: editName,
                credit: Number(editCredit),
            });

            const updated = allSubjects.map((subj) =>
                subj.id === id ? { ...subj, subjectName: editName, credit: Number(editCredit) } : subj
            );
            setAllSubjects(updated);
            setEditMode(null);
            alert("Subject updated.");
        } catch (error) {
            console.error("Error updating subject:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "subjects", id));
            setAllSubjects(allSubjects.filter((subj) => subj.id !== id));
            alert("Subject deleted.");
        } catch (error) {
            console.error("Error deleting subject:", error);
        }
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
                    <option value="Civil">Civil</option>
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

            <h3>Subjects List</h3>
            <ul className="subject-list">
                {allSubjects.map((subj) => (
                    <li key={subj.id}>
                        {editMode === subj.id ? (
                            <>
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                                <input
                                    type="number"
                                    value={editCredit}
                                    onChange={(e) => setEditCredit(e.target.value)}
                                />
                                <button className="save-btn" onClick={() => handleUpdate(subj.id)}>✅ Save</button>
                                <button className="cancel-btn" onClick={() => setEditMode(null)}>❌ Cancel</button>
                            </>
                        ) : (
                            <>
                                {subj.subjectName} - {subj.credit} credit(s)
                                <button className="edit-btn" onClick={() => handleEdit(subj)}>✏️ Edit</button>
                                <button className="delete-btn" onClick={() => handleDelete(subj.id)}>🗑️ Delete</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>



        </div>
    );
};

export default AdminPanel;