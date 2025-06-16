import React, { useEffect, useState } from "react";
import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import "./StudentPage.css";

function StudentPage() {
    const [batch, setBatch] = useState("");
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("");
    const [semester, setSemester] = useState("");
    const [regularSubjects, setRegularSubjects] = useState([]);

    const [backSemesters, setBackSemesters] = useState([]);
    const [selectedBackSemester, setSelectedBackSemester] = useState("");
    const [availableBackSubjects, setAvailableBackSubjects] = useState([]);
    const [selectedBackSubjects, setSelectedBackSubjects] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) navigate("/login");
    }, [navigate]);


    // ✅ Fetch Regular Subjects when batch, department, year, and semester change
    useEffect(() => {
        const fetchRegularSubjects = async () => {
            if (batch && department && year && semester) {
                try {
                    const q = query(
                        collection(db, 'subjects'),
                        where('batch', '==', batch),
                        where('department', '==', department),
                        where('year', '==', year),
                        where('semester', '==', semester)
                    );
                    const querySnapshot = await getDocs(q);

                    const fetchedSubjects = [
                        ...new Set(querySnapshot.docs.map(doc => doc.data().subjectName))
                    ];
                    setRegularSubjects(fetchedSubjects);

                } catch (error) {
                    console.error('Error fetching regular subjects:', error);
                }
            } else {
                setRegularSubjects([]);
            }
        };

        fetchRegularSubjects();
    }, [batch, department, year, semester]);


    // ✅ Fetch Backlog Semesters (grouped as "year - semester")
    useEffect(() => {
        const fetchBackSemesters = async () => {
            if (!batch || !department || !semester) return;

            const semesterOrder = [
                "1st Semester", "2nd Semester", "3rd Semester", "4th Semester",
                "5th Semester", "6th Semester", "7th Semester", "8th Semester"
            ];

            const currentSemesterIndex = semesterOrder.indexOf(semester);
            if (currentSemesterIndex === -1) return;

            const q = query(
                collection(db, "subjects"),
                where("batch", "==", batch),
                where("department", "==", department)
            );
            const snapshot = await getDocs(q);

            const semestersSet = new Set();
            snapshot.forEach(doc => {
                const docSemester = doc.data().semester;
                const docYear = doc.data().year;
                const semIndex = semesterOrder.indexOf(docSemester);
                if (semIndex !== -1 && semIndex < currentSemesterIndex) {
                    semestersSet.add(`${docYear} - ${docSemester}`);
                }
            });

            const sortedSemesters = Array.from(semestersSet).sort((a, b) => {
                const [, aSem] = a.split(" - ");
                const [, bSem] = b.split(" - ");
                return semesterOrder.indexOf(aSem) - semesterOrder.indexOf(bSem);
            });

            setBackSemesters(sortedSemesters);
        };

        fetchBackSemesters();
    }, [batch, department, semester]);


    // ✅ Fetch Back Subjects for Selected Backlog Semester
    const handleBackSemesterChange = async e => {
        const selected = e.target.value;
        setSelectedBackSemester(selected);
        if (!selected) return;

        const [yearPart, semPart] = selected.split(" - ");
        const q = query(
            collection(db, "subjects"),
            where("batch", "==", batch),
            where("department", "==", department),
            where("year", "==", yearPart),
            where("semester", "==", semPart)
        );
        const snapshot = await getDocs(q);
        const subjects = [
            ...new Set(snapshot.docs.map(doc => doc.data().subjectName))
        ];
        setAvailableBackSubjects(subjects);
    };

    // ✅ Add selected back subject
    const handleBackSubjectChange = (e) => {
        const subject = e.target.value;
        if (subject && !selectedBackSubjects.find(s => s.name === subject)) {
            setSelectedBackSubjects([...selectedBackSubjects, {
                name: subject,
                semester: selectedBackSemester
            }]);
        }
    };

    // ✅ Remove subject from back list
    const removeBackSubject = subject => {
        setSelectedBackSubjects(selectedBackSubjects.filter(s => s.name !== subject));
    };


    const logout = () => {
        auth.signOut();
        navigate("/login");
    };

    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
    const semestersByYear = {
        "1st Year": ["1st Semester", "2nd Semester"],
        "2nd Year": ["3rd Semester", "4th Semester"],
        "3rd Year": ["5th Semester", "6th Semester"],
        "4th Year": ["7th Semester", "8th Semester"]
    };


    return (
        <div className="student-container">
            <div className="header">
                <span className="welcome-text">Welcome, {auth.currentUser?.email}</span>
                <button className="logout-button" onClick={logout}>Logout</button>
            </div>
            <h2>Dashboard</h2>


            <div className="row-group">
                <div className="form-group half-width">
                    <label>Department</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)}>
                        <option value="">Select Department</option>
                        <option value="BE Computer">BE Computer</option>
                        <option value="BE Civil">BE Civil</option>
                        <option value="BE IT">BE IT</option>
                    </select>
                </div>
                <div className="form-group half-width">
                    <label>Batch</label>
                    <select value={batch} onChange={e => setBatch(e.target.value)}>
                        <option value="">Select Batch</option>
                        <option value="New">New</option>
                        <option value="Old">Old</option>
                    </select>
                </div>
            </div>


            <div className="form-group">
                <label>Current Year</label>
                <select value={year} onChange={e => {
                    setYear(e.target.value);
                    setSelectedBackSubjects([]);
                }}>
                    <option value="">Select Year</option>
                    {years.map(y => <option key={y}>{y}</option>)}
                </select>
            </div>

            {year && (
                <div className="form-group">
                    <label>Current Semester</label>
                    <select value={semester} onChange={e => {
                        setSemester(e.target.value);
                        setSelectedBackSubjects([]);
                    }}>
                        <option value="">Select Semester</option>
                        {semestersByYear[year].map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
            )}

            <div className="form-group">
                <label>Backlog Semester</label>
                <select value={selectedBackSemester} onChange={handleBackSemesterChange}>
                    <option value="">Select Semester</option>
                    {backSemesters.map(s => <option key={s}>{s}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label>Available Back Subjects</label>
                <select onChange={handleBackSubjectChange}>
                    <option value="">Select Back Subject</option>
                    {availableBackSubjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
            </div>

            <div className="routine-section-columns">
                <div className="subject-column">
                    <h3><span style={{ color: 'green' }}>🟢</span> Regular Subjects</h3>
                    <ul>
                        {regularSubjects.map((subject, index) => (
                            <li key={index}>{subject}</li>
                        ))}
                    </ul>
                </div>

                <div className="subject-column">
                    <h3><span style={{ color: 'red' }}>🔴</span> Back Subjects</h3>
                    <ul>
                        {selectedBackSubjects.map((subj, i) => (
                            <li className="back" key={i}>
                                {subj.name}
                                <button className="remove-btn" onClick={() => removeBackSubject(subj.name)}>&times;</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="generate-button-wrapper">
                <button className="generate-button">Display Routine</button>
            </div>


        </div>
    );
}

export default StudentPage;