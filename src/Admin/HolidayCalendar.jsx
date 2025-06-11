import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { db } from "../firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import dayjs from 'dayjs';

import "./HolidayCalendar.css";

const HolidayCalendar = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [holidays, setHolidays] = useState({});

    const calendarRef = useRef(null);


    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'holidays'), (snapshot) => {
            const holidayMap = {};
            snapshot.forEach((doc) => {
                holidayMap[doc.id] = true;
            });
            setHolidays(holidayMap);
        });

        return () => unsubscribe();
    }, []);

    // Handle calendar date click
    const handleDateClick = (date) => {
        const formatted = dayjs(date).format('YYYY-MM-DD');
        setSelectedDate(formatted);
    };

    // Add selected date as holiday to database
    const addHoliday = async () => {
        if (!selectedDate) return;
        const docRef = doc(db, 'holidays', selectedDate);
        await setDoc(docRef, { date: selectedDate });
    };

    // remove selected date as holiday to database
    const removeHoliday = async () => {
        if (!selectedDate) return;
        const docRef = doc(db, 'holidays', selectedDate);
        await deleteDoc(docRef);
    };

    const tileClassName = ({ date }) => {
        const formatted = dayjs(date).format('YYYY-MM-DD');
        if (holidays[formatted]) {
            return 'holiday';
        }
        return '';
    };

    // Handle outside click to close the action buttons
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setSelectedDate(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="holiday-calendar-container" ref={calendarRef}>
            <Calendar
                onClickDay={handleDateClick}
                tileClassName={tileClassName}
            />

            {selectedDate && (
                <div className="holiday-action">
                    <p className="mb-2">Selected: {selectedDate}</p>

                    {holidays[selectedDate] ? (
                        <button
                            onClick={removeHoliday}
                            className="remove-btn"
                        >
                            🗑 Remove Holiday
                        </button>
                    ) : (
                        <button
                            onClick={addHoliday}
                            className="add-btn"
                        >
                            ➕ Add Holiday
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default HolidayCalendar;
