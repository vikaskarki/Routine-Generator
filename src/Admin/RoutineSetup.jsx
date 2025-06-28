// React and Calendar imports
import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Firebase Firestore imports
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// DayJS and plugins for date comparison
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);


import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// Component CSS and utility function
import "./RoutineSetup.css";
import { generateExamRoutine } from "../utils/generateRoutine";

const RoutineSetup = ({ department, batch, onClose }) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [holidayReason, setHolidayReason] = useState("");
    const [holidays, setHolidays] = useState({});
    const [saving, setSaving] = useState(false);
    const [seasonYear, setSeasonYear] = useState("");
    const [generatedRoutine, setGeneratedRoutine] = useState([]);

    const calendarRef = useRef(null);

    useEffect(() => {
        const fetchRoutineDoc = async () => {
            if (!department || !batch || !seasonYear.trim()) return;

            try {
                const docRef = doc(db, "Routine", seasonYear.trim(), department, batch,);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = snap.data();
                    setStartDate(data.meta?.startDate || null);
                    setEndDate(data.meta?.endDate || null);
                    setHolidays(data.holidays || {});
                }
            } catch (err) {
                console.error("Failed to fetch routine data:", err);
            }
        };

        fetchRoutineDoc();
    }, [department, batch, seasonYear]);

    const isValidDateRange = () => {
        if (!startDate || !endDate) return false;
        const diff = dayjs(endDate).diff(dayjs(startDate), "day") + 1; // inclusive
        return diff === 50;
    };



    const isWithinWindow = (dateStr) => {
        if (!startDate || !endDate) return false;
        const date = dayjs(dateStr);
        return date.isSameOrAfter(dayjs(startDate)) && date.isSameOrBefore(dayjs(endDate));
    };

    const tileClassName = ({ date }) => {
        const formatted = dayjs(date).format("YYYY-MM-DD");
        return holidays[formatted] ? "holiday" : "";
    };

    const handleDateClick = (date) => {
        const formatted = dayjs(date).format("YYYY-MM-DD");
        setSelectedDate(formatted);
        setHolidayReason("");
    };

    const addHoliday = async () => {
        if (!selectedDate || !holidayReason.trim()) {
            alert("Provide a holiday reason.");
            return;
        }

        if (!isWithinWindow(selectedDate)) {
            alert("Holiday must be within the exam window.");
            return;
        }

        if (holidays[selectedDate]) {
            alert("Holiday already exists. Remove it before adding a new reason.");
            return;
        }

        const updated = { ...holidays, [selectedDate]: holidayReason };
        setSaving(true);

        try {
            const docRef = doc(db, "Routine", seasonYear.trim(), department, batch,);
            await setDoc(docRef, { holidays: updated }, { merge: true });
            setHolidays(updated);
            setSelectedDate(null);
            setHolidayReason("");
        } catch (err) {
            console.error("Failed to save holiday:", err);
            alert("Error saving holiday.");
        } finally {
            setSaving(false);
        }
    };

    const removeHoliday = async () => {
        if (!selectedDate || !holidays[selectedDate]) return;
        if (!window.confirm("Are you sure you want to remove this holiday?")) return;

        const updated = { ...holidays };
        delete updated[selectedDate];

        setSaving(true);

        try {
            const docRef = doc(db, "Routine", seasonYear.trim(), department, batch,);
            await setDoc(docRef, { holidays: updated }, { merge: true });
            setHolidays(updated);
            setSelectedDate(null);
            setHolidayReason("");
        } catch (err) {
            console.error("Failed to remove holiday:", err);
            alert("Error removing holiday.");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!startDate || !endDate || !seasonYear.trim()) {
            alert("Please select start date, end date, and season/year.");
            return;
        }

        if (!isValidDateRange()) {
            alert("Exam window must be between 1 to 60 days.");
            return;
        }

        setSaving(true);

        try {
            const formattedStart = dayjs(startDate).format("YYYY-MM-DD");
            const formattedEnd = dayjs(endDate).format("YYYY-MM-DD");

            const routine = await generateExamRoutine(
                db,
                department,
                batch,
                seasonYear.trim(),
                formattedStart,
                formattedEnd,
                holidays
            );

            if (!routine || routine.length === 0) {
                alert("No subjects found or assigned. Please check Firestore data.");
                return;
            }

            setGeneratedRoutine(routine);
            alert("Routine generated successfully. See below 👇");
        } catch (err) {
            console.error("Routine generation failed:", err);
            alert("❌ Failed to generate routine. See console for details.");
        } finally {
            setSaving(false);
        }
    };

    const exportToPDF = () => {
        if (!generatedRoutine.length) {
            alert("No routine data to export.");
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Generated Exam Routine", 14, 20);

        const tableData = generatedRoutine.map(entry => [
            entry.date,
            entry.subjectName,
            entry.semester,
        ]);

        autoTable(doc, {
            startY: 30,
            head: [["Date", "Subject Name", "Semester"]],
            body: tableData,
            theme: "striped"
        });

        doc.save(`Exam_Routine_${seasonYear || "Unknown"}.pdf`);
    };




    return (
        <div className="routine-setup-overlay">
            <div className="routine-setup-card" ref={calendarRef}>
                {/* Close button */}
                <button className="modal-exit-btn" onClick={onClose}>✖</button>
                <h3>📅 Exam Routine Setup</h3>

                {/* Season & Year input */}
                <div className="season-year-row">
                    <label htmlFor="season-year">Season & Year:</label>
                    <input
                        id="season-year"
                        type="text"
                        placeholder="e.g., Spring_2025"
                        value={seasonYear}
                        onChange={(e) => setSeasonYear(e.target.value)}
                    />
                </div>

                {/* Start and End date inputs */}
                <div className="date-range-row">
                    <div>
                        <label htmlFor="start-date">Exam Start Date:</label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate || ""}
                            onChange={(e) => {
                                const start = e.target.value;
                                setStartDate(start);

                                if (start) {
                                    const autoEnd = dayjs(start).add(49, "day").format("YYYY-MM-DD"); // inclusive of start
                                    setEndDate(autoEnd);
                                }
                            }}
                        />

                    </div>
                    <div>
                        <label htmlFor="end-date">Exam End Date:</label>
                        <input
                            id="end-date"
                            type="date"
                            value={endDate || ""}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Display total days of exam window */}
                {startDate && endDate && isValidDateRange() && (
                    <p className="info">
                        Duration: {dayjs(endDate).diff(dayjs(startDate), "day") + 1} days
                    </p>
                )}

                {/* Calendar + Holiday input */}
                <div className="calendar-holiday-row">
                    {/* Calendar view */}
                    <div className="holiday-calendar-box">
                        <Calendar
                            onClickDay={handleDateClick}
                            tileClassName={tileClassName} // Highlight holiday cells
                        />

                        {/* Holiday reason input and actions */}
                        {selectedDate && (
                            <div className="holiday-declare-form">
                                <p>Selected: {selectedDate}</p>
                                <input
                                    type="text"
                                    placeholder="Reason for holiday (e.g., Holi)"
                                    value={holidayReason}
                                    onChange={(e) => setHolidayReason(e.target.value)}
                                />
                                {holidays[selectedDate] ? (
                                    <button className="remove-btn" onClick={removeHoliday} disabled={saving}>
                                        🗑 Remove Holiday
                                    </button>
                                ) : (
                                    <button className="add-btn" onClick={addHoliday} disabled={saving}>
                                        ➕ Add Holiday
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* List of holidays added */}
                    <div className="holiday-list-box">
                        <h5>🗓 Declared Holidays</h5>
                        <ul className="holiday-list">
                            {Object.entries(holidays)
                                .filter(([date]) => isWithinWindow(date))
                                .sort(([a], [b]) => dayjs(a).unix() - dayjs(b).unix()) // Sort by date
                                .map(([date, reason]) => (
                                    <li key={date}>
                                        <span className="holiday-date">{date}</span>
                                        <span className="holiday-reason">{reason}</span>
                                    </li>
                                ))}
                            {Object.entries(holidays).filter(([date]) => isWithinWindow(date)).length === 0 && (
                                <li className="no-holidays">No holidays declared..</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Generate routine button */}
                <div className="routine-buttons">
                    <button className="generate-btn" onClick={handleGenerate} disabled={saving}>
                        ✅ Display Routine
                    </button>
                </div>
            </div>
            {generatedRoutine.length > 0 && (
                <div className="routine-preview-container">
                    <h3>📋 Generated Routine</h3>

                    <div className="routine-table-wrapper">
                        <table className="routine-preview-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Subject Name</th>
                                    <th>Semester</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generatedRoutine.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.date}</td>
                                        <td>{entry.subjectName}</td>
                                        <td>{entry.semester}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="generated-routine-modal">
                        {/* CLOSE BUTTON AT TOP-RIGHT */}
                        <button className="routine-close-btn" onClick={onClose} title="Close">✖</button>

                        <h3>📄 Generated Routine</h3>

                        <table className="routine-table">
                            {/* table header and body here */}
                        </table>

                        <div className="routine-buttons-row">
                            <button onClick={exportToPDF} className="pdf-export-btn">
                                📥 Export as PDF
                            </button>
                        </div>
                    </div>


                </div>
            )}




        </div>

    );
};

export default RoutineSetup; // Export component
