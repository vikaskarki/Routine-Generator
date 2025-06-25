import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { db } from "../firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

import "./RoutineSetupModal.css";

const RoutineSetupModal = ({ department, batch, onClose, onGenerate }) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [holidayReason, setHolidayReason] = useState("");
    const [holidays, setHolidays] = useState({});
    const calendarRef = useRef(null);

    // ✅ Step 1: Fetch previously saved exam window for this department + batch
    useEffect(() => {
        const fetchExamWindow = async () => {
            const docRef = doc(db, "departments", department, "batches", batch, "examWindow");
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const { startDate, endDate } = snap.data();
                setStartDate(startDate);
                setEndDate(endDate);
            }
        };
        fetchExamWindow();
    }, [department, batch]);

    // Listen for live updates to the holidays collection
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "holidays"), (snapshot) => {
            const map = {};
            snapshot.forEach((docSnap) => {
                map[docSnap.id] = docSnap.data().reason || true;
            });
            setHolidays(map);
        });
        return () => unsubscribe();
    }, []);

    // Add CSS class to holiday dates in calendar
    const tileClassName = ({ date }) => {
        const formatted = dayjs(date).format("YYYY-MM-DD");
        return holidays[formatted] ? "holiday" : "";
    };

    // Handle calendar date click
    const handleDateClick = (date) => {
        const formatted = dayjs(date).format("YYYY-MM-DD");
        setSelectedDate(formatted);
        setHolidayReason("");
    };

    // Add a holiday to Firestore
    const addHoliday = async () => {
        if (!selectedDate || !holidayReason.trim()) {
            alert("Provide a holiday reason.");
            return;
        }
        await setDoc(doc(db, "holidays", selectedDate), {
            date: selectedDate,
            reason: holidayReason.trim(),
        });
        setSelectedDate(null);
        setHolidayReason("");
    };

    // Remove a holiday from Firestore
    const removeHoliday = async () => {
        if (!selectedDate) return;
        if (window.confirm("Are you sure you want to remove this holiday?")) {
            await deleteDoc(doc(db, "holidays", selectedDate));
            alert("Holiday removed.");
            setSelectedDate(null);
            setHolidayReason("");
        }
    };

    // Validate that the selected date range is within 1–50 days
    const isValidDateRange = () => {
        if (!startDate || !endDate) return false;
        const diff = dayjs(endDate).diff(dayjs(startDate), "day");
        return diff >= 1 && diff <= 50;
    };

    const isWithinWindow = (dateStr) => {
        if (!startDate || !endDate) return false; // don't show any if window not defined
        const date = dayjs(dateStr);
        return date.isSameOrAfter(dayjs(startDate)) && date.isSameOrBefore(dayjs(endDate));
    };



    // Save the exam window and trigger backend generation
    const handleGenerate = async () => {
        if (!isValidDateRange()) {
            alert("Exam window must be between 1 to 50 days.");
            return;
        }
        await setDoc(doc(db, "departments", department, "batches", batch, "examWindow"), {
            startDate: dayjs(startDate).format("YYYY-MM-DD"),
            endDate: dayjs(endDate).format("YYYY-MM-DD"),
        });
        onGenerate(); // triggers backend routine generation
    };

    return (
        <div className="routine-setup-overlay">
            <div className="routine-setup-card" ref={calendarRef}>
                <button className="modal-exit-btn" onClick={onClose}>✖</button>
                <h3>📅 Exam Routine Setup</h3>

                <div className="date-range-row">
                    <div>
                        <label>Exam Start Date:</label>
                        {/* ✅ show current value if exists */}
                        <input
                            type="date"
                            value={startDate || ""}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Exam End Date:</label>
                        <input
                            type="date"
                            value={endDate || ""}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Show warning if date range is invalid */}
                {startDate && endDate && !isValidDateRange() && (
                    <p className="error">Exam window must be within 1–50 days.</p>
                )}

                <div className="calendar-holiday-row">
                    <div className="holiday-calendar-box">
                        <Calendar
                            onClickDay={handleDateClick}
                            tileClassName={tileClassName}
                        />

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
                                    <button className="remove-btn" onClick={removeHoliday}>
                                        🗑 Remove Holiday
                                    </button>
                                ) : (
                                    <button className="add-btn" onClick={addHoliday}>
                                        ➕ Add Holiday
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="holiday-list-box">
                        <h5>🗓 Declared Holidays</h5>
                        <ul className="holiday-list">
                            {Object.entries(holidays)
                                .filter(([date]) => isWithinWindow(date)) // ✅ apply correct filtering
                                .sort()
                                .map(([date, reason]) => (
                                    <li key={date}>
                                        <span className="holiday-date">{date}</span>
                                        <span className="holiday-reason">{reason}</span>
                                    </li>
                                ))}

                            {/* Show message if none within window */}
                            {Object.entries(holidays).filter(([date]) => isWithinWindow(date)).length === 0 && (
                                <li className="no-holidays">No holidays declared..</li>
                            )}
                        </ul>
                    </div>


                </div>

                <div className="routine-buttons">
                    <button className="generate-btn" onClick={handleGenerate}>
                        ✅ Display Routine
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoutineSetupModal;
