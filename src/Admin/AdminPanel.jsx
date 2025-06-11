import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from '../firebase';
import { getDocs, query, where, addDoc, doc, updateDoc, deleteDoc, collection } from "firebase/firestore";

import './AdminPanel.css';
import HolidayCalendar from './HolidayCalendar';

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
    const [batch, setBatch] = useState("");
    const [showHolidayCalendar, setShowHolidayCalendar] = useState(false);
    const [showRoutineOptions, setShowRoutineOptions] = useState(false);

    const navigate = useNavigate();
    const auth = getAuth();

    // On component mount: get current user and fetch subjects
    useEffect(() => {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser) {
            setAdminEmail(currentUser.email);
        }

        fetchSubjects();
    }, [department, year, semester, batch]);



    const fetchSubjects = async () => {
        if (!department || !year || !semester || !batch) {
            setAllSubjects([]);
            return;
        }

        try {
            const q = query(
                collection(db, "subjects"),
                where("department", "==", department),
                where("year", "==", year),
                where("semester", "==", semester),
                where("batch", "==", batch)
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


    // Handle subject addition 
    const handleAddSubject = async () => {
        if (!subjectName.trim() || !credit || !department || !year || !semester || !batch) {
            alert("Please fill all fields before adding a subject.");
            return;
        }

        if (Number(credit) <= 0) {
            alert("Credit must be a positive number.");
            return;
        }

        try {
            // Check if subject already exists
            const q = query(
                collection(db, "subjects"),
                where("subjectName", "==", subjectName),
                where("department", "==", department),
                where("year", "==", year),
                where("semester", "==", semester),
                where("batch", "==", batch)
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
                batch,
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

    // Handle logout of current admin
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    // Mapping year to its corresponding semesters
    const yearSemesterMap = {
        "1st Year": ["1st Semester", "2nd Semester"],
        "2nd Year": ["3rd Semester", "4th Semester"],
        "3rd Year": ["5th Semester", "6th Semester"],
        "4th Year": ["7th Semester", "8th Semester"],
    };

    //for editing the subjects 
    const handleEdit = (subj) => {
        setEditMode(subj.id);
        setEditName(subj.subjectName);
        setEditCredit(subj.credit);
    };

    // firestore ma rw admin panel ma subject update hunxa
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

    // Delete subject from Firestore and remove from UI
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
        // --------------------- Admin Panel ---------------------

        <div className="admin-panel-container">
            <div className="admin-panel-header">
                <h2>🛠 Admin Panel</h2>
                <div className="admin-panel-user-info">
                    <span>Logged in as: <strong>{adminEmail}</strong></span>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            {/* Year Selection */}
            <div className="admin-panel-content">
                <div className="admin-form-section">
                    <label>Department:</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                        <option value="">Select Department</option>
                        <option value="Computer">Computer</option>
                        <option value="Civil">Civil</option>
                        <option value="IT">IT</option>
                    </select>

                    <label>Batch:</label>
                    <select value={batch} onChange={(e) => setBatch(e.target.value)}>
                        <option value="">Select Batch</option>
                        <option value="New">New </option>
                        <option value="Old">Old </option>
                    </select>

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

                {/* yo block lae if year select gareko xa vani semester select garnu milxa */}
                {year && (
                    <div className="admin-panel-content">
                        <label>Semester:</label>
                        <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                            <option value="">Select Semester</option>
                            {yearSemesterMap[year].map((sem) => (
                                <option key={sem} value={sem}>{sem}</option>
                            ))}
                        </select>
                    </div>
                )}

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
            </div>

            <div className="subject-list-section">
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
                                    <div className="subject-buttons">
                                        <button className="save-btn" onClick={() => handleUpdate(subj.id)}>✅ Save</button>
                                        <button className="cancel-btn" onClick={() => setEditMode(null)}>❌ Cancel</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span>{subj.subjectName} - {subj.credit} credit(s)</span>
                                    <div className="subject-buttons">
                                        <button className="edit-btn" onClick={() => handleEdit(subj)}>✏️ Edit</button>
                                        <button className="delete-btn" onClick={() => handleDelete(subj.id)}>🗑️ Delete</button>
                                    </div>
                                </>

                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="generate-btn-container">
                <button className="generate-btn" onClick={() => setShowRoutineOptions(true)}>
                    Generate Routine
                </button>
            </div>


            {showRoutineOptions && (
                <div className="routine-popup-overlay">
                    <div className="routine-popup-card">
                        <button className="routine-close-btn" onClick={() => setShowRoutineOptions(false)} > ❌ </button>
                        <button onClick={() => setShowHolidayCalendar(true)}>Declare Holiday</button>
                        <button onClick={() => navigate('/routine')}>Show Routine</button>                    </div>
                </div>
            )}

            {showHolidayCalendar && (
                <div className="holiday-overlay" onClick={() => setShowHolidayCalendar(false)}>
                    <div className="holiday-content" onClick={e => e.stopPropagation()}>
                        <button className="holiday-close-btn" onClick={() => setShowHolidayCalendar(false)} >✖</button>
                        <HolidayCalendar />
                    </div>
                </div>
            )}


        </div >
    );
};

export default AdminPanel;