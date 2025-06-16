import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from '../firebase';
import { getDocs, query, where, addDoc, doc, deleteDoc, collection } from "firebase/firestore";

import './AdminPanel.css';
import HolidayCalendar from './HolidayCalendar';

const AdminPanel = () => {
    const [department, setDepartment] = useState("");
    const [batch, setBatch] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [allSubjects, setAllSubjects] = useState([]);
    const [xmlFile, setXmlFile] = useState(null);
    const [showHolidayCalendar, setShowHolidayCalendar] = useState(false);
    const [showRoutineOptions, setShowRoutineOptions] = useState(false);

    const navigate = useNavigate();
    const auth = getAuth();

    // On component mount: get current user and fetch subjects
    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setAdminEmail(currentUser.email);
        }
        fetchSubjects();
    }, [department, batch]);



    const fetchSubjects = async () => {
        if (!department || !batch) {
            setAllSubjects([]);
            return;
        }

        try {
            const q = query(
                collection(db, "subjects"),
                where("department", "==", department),
                where("batch", "==", batch)
            );
            const snapshot = await getDocs(q);
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllSubjects(fetched);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    // Handle logout of current admin
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
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

    const handleXMLUpload = async (file) => {
        if (!department || !batch) {
            alert("Please select both Department and Batch before uploading.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
            const tables = Array.from(xmlDoc.getElementsByTagName("table:table"));

            const semesterLabels = [
                "1st Semester", "2nd Semester",
                "3rd Semester", "4th Semester",
                "5th Semester", "6th Semester",
                "7th Semester", "8th Semester"
            ];

            try {
                for (let semIndex = 0; semIndex < tables.length; semIndex++) {
                    const table = tables[semIndex];
                    const semester1 = semesterLabels[semIndex * 2];
                    const semester2 = semesterLabels[semIndex * 2 + 1];

                    const rows = table.getElementsByTagName("table:table-row");

                    for (let i = 2; i < rows.length; i++) {
                        const cells = rows[i].getElementsByTagName("table:table-cell");

                        const name1 = cells[1]?.textContent.trim();
                        const credit1 = cells[2]?.textContent.trim();
                        const name2 = cells[5]?.textContent.trim();
                        const credit2 = cells[6]?.textContent.trim();

                        // ✅ Subject 1
                        if (name1 && credit1) {
                            const query1 = query(
                                collection(db, "subjects"),
                                where("subjectName", "==", name1),
                                where("department", "==", department),
                                where("batch", "==", batch),
                                where("semester", "==", semester1)
                            );
                            const exists1 = await getDocs(query1);
                            if (exists1.empty) {
                                await addDoc(collection(db, "subjects"), {
                                    subjectName: name1,
                                    credit: Number(credit1),
                                    department,
                                    batch,
                                    semester: semester1,
                                    year: getYearFromSemester(semester1),
                                });
                            }
                        }

                        // ✅ Subject 2
                        if (name2 && credit2) {
                            const query2 = query(
                                collection(db, "subjects"),
                                where("subjectName", "==", name2),
                                where("department", "==", department),
                                where("batch", "==", batch),
                                where("semester", "==", semester2)
                            );
                            const exists2 = await getDocs(query2);
                            if (exists2.empty) {
                                await addDoc(collection(db, "subjects"), {
                                    subjectName: name2,
                                    credit: Number(credit2),
                                    department,
                                    batch,
                                    semester: semester2,
                                    year: getYearFromSemester(semester2),
                                });
                            }
                        }
                    }
                }
                alert(`Subjects uploaded to: ${department} (${batch} Batch)`);
                setXmlFile(null);
                fetchSubjects();
            } catch (err) {
                console.error("Error importing XML:", err);
                alert("Error importing subjects.");
            }
        };
        reader.readAsText(file);
    };

    const getYearFromSemester = (semester) => {
        if (semester.includes("1st") || semester.includes("2nd")) return "1st Year";
        if (semester.includes("3rd") || semester.includes("4th")) return "2nd Year";
        if (semester.includes("5th") || semester.includes("6th")) return "3rd Year";
        if (semester.includes("7th") || semester.includes("8th")) return "4th Year";
        return "";
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

            <div className="admin-panel-content">
                <div className="admin-form-section">
                    <h3>Enter Subjects list to Database:- </h3>
                    <hr></hr>
                    <label>Department:</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                        <option value="">Select Department</option>
                        <option value="BE Computer">BE Computer</option>
                        <option value="BE IT">BE IT</option>
                        <option value="BE Civil">BE Civil</option>
                    </select>

                    <label>Batch:</label>
                    <select value={batch} onChange={(e) => setBatch(e.target.value)}>
                        <option value="">Select Batch</option>
                        <option value="New">New</option>
                        <option value="Old">Old</option>
                    </select>
                </div>

                <hr />
                <h3>Import Subjects via XML</h3>
                <div className="subject-form">
                    <input
                        type="file"
                        accept=".xml"
                        onChange={(e) => setXmlFile(e.target.files[0])}
                    />
                    {xmlFile && (
                        <button onClick={() => handleXMLUpload(xmlFile)}>Proceed</button>
                    )}
                </div>

            </div>

            <div className="subject-list-section">
                {department && batch && (
                    <>
                        <h3>Subjects List</h3>
                        <div className="semester-grid">
                            {[
                                ["1st Semester", "2nd Semester"],
                                ["3rd Semester", "4th Semester"],
                                ["5th Semester", "6th Semester"],
                                ["7th Semester", "8th Semester"],
                            ].map(([leftSem, rightSem], index) => {
                                const leftSubjects = allSubjects.filter(s => s.semester === leftSem);
                                const rightSubjects = allSubjects.filter(s => s.semester === rightSem);

                                return (
                                    <div className="semester-row" key={index}>
                                        <div className="semester-column">
                                            <h4>{leftSem}</h4>
                                            <ul className="subject-list">
                                                {leftSubjects.map((subj) => (
                                                    <li key={subj.id}>
                                                        <span>{subj.subjectName} - {subj.credit} credit(s)</span>
                                                        <button className="delete-btn" onClick={() => handleDelete(subj.id)}>🗑️</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="semester-column">
                                            <h4>{rightSem}</h4>
                                            <ul className="subject-list">
                                                {rightSubjects.map((subj) => (
                                                    <li key={subj.id}>
                                                        <span>{subj.subjectName} - {subj.credit} credit(s)</span>
                                                        <button className="delete-btn" onClick={() => handleDelete(subj.id)}>🗑️</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}


            </div>

            <div className="generate-btn-container">
                <button className="generate-btn" onClick={() => setShowRoutineOptions(true)}>
                    Generate Routine
                </button>
            </div>

            {showRoutineOptions && (
                <div className="routine-popup-overlay">
                    <div className="routine-popup-card">
                        <button className="routine-close-btn" onClick={() => setShowRoutineOptions(false)}>❌</button>
                        <button onClick={() => setShowHolidayCalendar(true)}>Declare Holiday</button>
                        <button onClick={() => navigate('/routine')}>Show Routine</button>
                    </div>
                </div>
            )}

            {showHolidayCalendar && (
                <div className="holiday-overlay" onClick={() => setShowHolidayCalendar(false)}>
                    <div className="holiday-content" onClick={e => e.stopPropagation()}>
                        <button className="holiday-close-btn" onClick={() => setShowHolidayCalendar(false)}>✖</button>
                        <HolidayCalendar />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;