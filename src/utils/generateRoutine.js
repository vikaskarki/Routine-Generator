import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

/**
 * Generate and save exam routine using a greedy algorithm with constraints.
 *
 * @param {object} db - Firestore instance
 * @param {string} department
 * @param {string} batch
 * @param {string} seasonYear - e.g., Fall_2024
 * @param {string} startDate - in YYYY-MM-DD format
 * @param {string} endDate - in YYYY-MM-DD format
 * @param {Object} holidays - { "YYYY-MM-DD": "reason", ... }
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

    // Step 1: Fetch subjects from Firestore
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
                semester: semester,
            });
        });
    }

    // Step 2: Greedy scheduling with grouping
    const routine = [];
    const dateQueue = [];
    let current = dayjs(startDate);

    while (current.isSameOrBefore(endDate)) {
        const formatted = current.format("YYYY-MM-DD");
        if (!holidays[formatted]) {
            dateQueue.push(formatted); // valid exam date
        }
        current = current.add(1, "day");
    }

    if (dateQueue.length === 0) {
        throw new Error("No valid exam dates available (all are holidays?)");
    }

    const routineMap = {}; // { date: [ { subjectName, semester } ] }

    for (let i = 0; i < allSubjects.length; i++) {
        const dateIndex = i % dateQueue.length; // round-robin allocation
        const targetDate = dateQueue[dateIndex];

        if (!routineMap[targetDate]) {
            routineMap[targetDate] = [];
        }

        routineMap[targetDate].push(allSubjects[i]);
    }

    // Convert routineMap to flat array format
    for (const [date, subjects] of Object.entries(routineMap)) {
        subjects.forEach(subject => {
            routine.push({
                date,
                subjectName: subject.subjectName,
                semester: subject.semester,
            });
        });
    }

    // Step 3: Save to Firestore
    const routineDocRef = doc(db, "Routine", department, batch, seasonYear);

    await setDoc(routineDocRef, {
        meta: {
            startDate,
            endDate,
            createdAt: new Date().toISOString(),
        },
        holidays,
        routine
    });

    return routine;
};
