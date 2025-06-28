import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

/**
 * Generate and save exam routine for a fixed 50-day window.
 *
 * @param {object} db - Firestore instance
 * @param {string} department
 * @param {string} batch
 * @param {string} seasonYear - e.g., Spring_2025
 * @param {string} startDate - in YYYY-MM-DD format
 * @param {string} endDate - in YYYY-MM-DD format (not used for range calculation here)
 * @param {Object} holidays - { "YYYY-MM-DD": "reason", ... } (stored but not used for exclusion)
 */
export const generateExamRoutine = async (
    db,
    department,
    batch,
    seasonYear,
    startDate,
    endDate,
    holidays
) => {
    const semesterLabels = [
        "1st Semester", "2nd Semester",
        "3rd Semester", "4th Semester",
        "5th Semester", "6th Semester",
        "7th Semester", "8th Semester"
    ];

    const allSubjects = [];

    // Step 1: Fetch subjects for each semester
    for (const semester of semesterLabels) {
        const ref = collection(
            db,
            "departments", department,
            "batches", batch,
            "semesters", semester,
            "subjects"
        );
        const snapshot = await getDocs(ref);
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            allSubjects.push({
                subjectName: data.subjectName,
                semester,
                credit: data.credit || 3,
            });
        });
    }

    if (allSubjects.length > 50) {
        throw new Error(`Too many subjects (${allSubjects.length}) for 50-day window. Reduce subject count or allow multiple exams per day.`);
    }

    // NEW: exclude holidays from date pool
    const datePool = [];
    let current = dayjs(startDate);

    while (datePool.length < 50) {
        const formatted = current.format("YYYY-MM-DD");

        if (!holidays[formatted]) {
            datePool.push(formatted);
        }

        current = current.add(1, "day");

        // Prevent infinite loop (in case holidays block too many dates)
        if (current.diff(dayjs(startDate), "day") > 100) {
            throw new Error("Too many holidays or short window. Cannot generate 50 non-holiday exam days.");
        }
    }

    // Step 3: Shuffle subjects and assign them to the 50 days
    const subjects = [...allSubjects].sort(() => Math.random() - 0.5);

    const routine = [];

    for (let i = 0; i < datePool.length; i++) {
        const date = datePool[i];

        if (i < subjects.length) {
            routine.push({
                date,
                subjectName: subjects[i].subjectName,
                semester: subjects[i].semester
            });
        } else {
            routine.push({
                date,
                subjectName: "-",
                semester: "-"
            });
        }
    }

    // Step 4: Save routine to Firestore
    const routineDocRef = doc(db, "Routine", seasonYear, department, batch);
    await setDoc(routineDocRef, {
        meta: {
            startDate,
            endDate: datePool[datePool.length - 1],
            createdAt: new Date().toISOString(),
        },
        holidays,
        routine,
    });

    return routine;
};

