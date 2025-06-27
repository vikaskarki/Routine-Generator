import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

import "./RoutineSetup.css";
import { fetchAllSubjects } from "../utils/fetchSubjects";

const RoutineSetup = ({ department, batch, onClose, onGenerate }) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [holidayReason, setHolidayReason] = useState("");
    const [holidays, setHolidays] = useState({});
    const [saving, setSaving] = useState(false);
    const [seasonYear, setSeasonYear] = useState("");

    const calendarRef = useRef(null);

    useEffect(() => {
        const fetchRoutineDoc = async () => {
            if (!department || !batch || !seasonYear.trim()) return;
            try {
                const docRef = doc(db, "Routine", department, batch, seasonYear.trim());
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
        const diff = dayjs(endDate).diff(dayjs(startDate), "day");
        return diff >= 1 && diff <= 50;
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
            const docRef = doc(db, "Routine", department, batch, seasonYear.trim());

            await setDoc(
                docRef,
                { holidays: updated },
                { merge: true }
            );

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
            const docRef = doc(db, "Routine", department, batch, seasonYear.trim());

            await setDoc(
                docRef,
                { holidays: updated },
                { merge: true }
            );

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
            alert("Exam window must be between 1 to 50 days.");
            return;
        }

        setSaving(true);
        try {
            const formattedStart = dayjs(startDate).format("YYYY-MM-DD");
            const formattedEnd = dayjs(endDate).format("YYYY-MM-DD");

            const routineDocRef = doc(db, "Routine", department, batch, seasonYear.trim());

            const subjects = await fetchAllSubjects(department, batch);
            subjects.sort((a, b) => a.semester.localeCompare(b.semester));

            const routine = [];
            let current = dayjs(startDate);

            for (const subject of subjects) {
                while (
                    current.isSameOrBefore(endDate) &&
                    holidays[current.format("YYYY-MM-DD")]
                ) {
                    current = current.add(1, "day");
                }

                if (current.isAfter(endDate)) {
                    alert("Not enough available days to schedule all subjects.");
                    break;
                }

                routine.push({
                    subjectName: subject.subjectName,
                    semester: subject.semester,
                    date: current.format("YYYY-MM-DD"),
                });

                current = current.add(1, "day");
            }

            await setDoc(routineDocRef, {
                meta: {
                    startDate: formattedStart,
                    endDate: formattedEnd,
                    createdAt: new Date().toISOString()
                },
                holidays,
                routine
            });


            alert("Routine saved successfully.");
            onGenerate();
        } catch (err) {
            console.error("Error saving routine:", err);
            alert("Failed to save routine.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="routine-setup-overlay">
            <div className="routine-setup-card" ref={calendarRef}>
                <button className="modal-exit-btn" onClick={onClose}>✖</button>
                <h3>📅 Exam Routine Setup</h3>

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

                {startDate && endDate && isValidDateRange() && (
                    <p className="info">
                        Duration: {dayjs(endDate).diff(dayjs(startDate), "day") + 1} days
                    </p>
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

                    <div className="holiday-list-box">
                        <h5>🗓 Declared Holidays</h5>
                        <ul className="holiday-list">
                            {Object.entries(holidays)
                                .filter(([date]) => isWithinWindow(date))
                                .sort(([a], [b]) => dayjs(a).unix() - dayjs(b).unix())
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

                <div className="routine-buttons">
                    <button className="generate-btn" onClick={handleGenerate} disabled={saving}>
                        ✅ Display Routine
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoutineSetup;
