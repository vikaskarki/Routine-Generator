// React and Calendar imports
import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar"; // Calendar UI component
import "react-calendar/dist/Calendar.css"; // Default calendar styles

// Firebase Firestore imports
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// DayJS and plugins for date comparison
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter); // enables isSameOrAfter()
dayjs.extend(isSameOrBefore); // enables isSameOrBefore()

// Component CSS and utility function
import "./RoutineSetup.css";
import { generateExamRoutine } from "../utils/generateRoutine";


// Main RoutineSetup component
const RoutineSetup = ({ department, batch, onClose, onGenerate }) => {
    // UI state management
    const [startDate, setStartDate] = useState(null); // Exam start date
    const [endDate, setEndDate] = useState(null); // Exam end date
    const [selectedDate, setSelectedDate] = useState(null); // Date selected on calendar
    const [holidayReason, setHolidayReason] = useState(""); // Input for holiday reason
    const [holidays, setHolidays] = useState({}); // All holidays (object with date: reason)
    const [saving, setSaving] = useState(false); // Loading state for add/remove/save
    const [seasonYear, setSeasonYear] = useState(""); // Term name, e.g., Spring_2025

    const calendarRef = useRef(null); // Ref for the calendar container (optional)

    // Load saved routine details (start date, end date, holidays) if available
    useEffect(() => {
        const fetchRoutineDoc = async () => {
            if (!department || !batch || !seasonYear.trim()) return; // Validation check

            try {
                const docRef = doc(db, "Routine", department, batch, seasonYear.trim()); // Document path
                const snap = await getDoc(docRef); // Fetch data

                if (snap.exists()) {
                    const data = snap.data();
                    setStartDate(data.meta?.startDate || null);
                    setEndDate(data.meta?.endDate || null);
                    setHolidays(data.holidays || {}); // Set holidays if any
                }
            } catch (err) {
                console.error("Failed to fetch routine data:", err);
            }
        };

        fetchRoutineDoc(); // Trigger data fetch on component mount or change
    }, [department, batch, seasonYear]);

    // Validates that exam window is between 1 and 50 days
    const isValidDateRange = () => {
        if (!startDate || !endDate) return false;
        const diff = dayjs(endDate).diff(dayjs(startDate), "day");
        return diff >= 1 && diff <= 50;
    };

    // Checks if a date is within the selected exam window
    const isWithinWindow = (dateStr) => {
        if (!startDate || !endDate) return false;
        const date = dayjs(dateStr);
        return date.isSameOrAfter(dayjs(startDate)) && date.isSameOrBefore(dayjs(endDate));
    };

    // Highlights holidays on calendar
    const tileClassName = ({ date }) => {
        const formatted = dayjs(date).format("YYYY-MM-DD");
        return holidays[formatted] ? "holiday" : ""; // Return "holiday" class if date is a holiday
    };

    // Sets selected date from calendar
    const handleDateClick = (date) => {
        const formatted = dayjs(date).format("YYYY-MM-DD");
        setSelectedDate(formatted); // Update selected date
        setHolidayReason(""); // Reset input field
    };

    // Adds a holiday to Firestore and local state
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

        const updated = { ...holidays, [selectedDate]: holidayReason }; // Update state
        setSaving(true); // Start loading state

        try {
            const docRef = doc(db, "Routine", department, batch, seasonYear.trim());
            await setDoc(docRef, { holidays: updated }, { merge: true }); // Save holidays to Firestore

            setHolidays(updated); // Update local UI
            setSelectedDate(null); // Reset form
            setHolidayReason("");
        } catch (err) {
            console.error("Failed to save holiday:", err);
            alert("Error saving holiday.");
        } finally {
            setSaving(false); // Stop loading
        }
    };

    // Removes a holiday from Firestore and UI
    const removeHoliday = async () => {
        if (!selectedDate || !holidays[selectedDate]) return;
        if (!window.confirm("Are you sure you want to remove this holiday?")) return;

        const updated = { ...holidays };
        delete updated[selectedDate]; // Remove from object

        setSaving(true); // Start loading

        try {
            const docRef = doc(db, "Routine", department, batch, seasonYear.trim());
            await setDoc(docRef, { holidays: updated }, { merge: true }); // Update Firestore

            setHolidays(updated); // Update UI
            setSelectedDate(null);
            setHolidayReason("");
        } catch (err) {
            console.error("Failed to remove holiday:", err);
            alert("Error removing holiday.");
        } finally {
            setSaving(false);
        }
    };

    // Generates the exam routine and saves it to Firestore
    const handleGenerate = async () => {
        if (!startDate || !endDate || !seasonYear.trim()) {
            alert("Please select start date, end date, and season/year.");
            return;
        }

        if (!isValidDateRange()) {
            alert("Exam window must be between 1 to 50 days.");
            return;
        }

        setSaving(true);

        try {
            const formattedStart = dayjs(startDate).format("YYYY-MM-DD");
            const formattedEnd = dayjs(endDate).format("YYYY-MM-DD");

            console.log("📋 Routine generation params:", {
                department,
                batch,
                seasonYear,
                startDate: formattedStart,
                endDate: formattedEnd,
                holidays,
            });

            // Actually run the generator
            const routine = await generateExamRoutine(
                db,
                department,
                batch,
                seasonYear.trim(),
                formattedStart,
                formattedEnd,
                holidays
            );

            // Check if routine is empty
            if (!routine || routine.length === 0) {
                alert("No subjects found or assigned. Please check subject data in Firestore.");
                return;
            }

            console.log("📅 Routine generated:", routine);
            alert("Routine saved to Firestore successfully.");
            onGenerate();
        } catch (err) {
            console.error("Routine generation failed:", err);
            alert("❌ Failed to generate routine. See console for details.");
        } finally {
            setSaving(false);
        }
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
                            onChange={(e) => setStartDate(e.target.value)}
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
        </div>
    );
};

export default RoutineSetup; // Export component
