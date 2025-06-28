import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

/**
 * Generate and save exam routine using a greedy heuristic with constraints.
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
                semester,
                credit: data.credit || 3,
            });
        });
    }

    // Step 2: Create valid exam date pool (excluding holidays)
    const datePool = [];
    let current = dayjs(startDate);
    while (current.isSameOrBefore(endDate)) {
        const formatted = current.format("YYYY-MM-DD");
        if (!holidays[formatted]) {
            datePool.push(formatted);
        }
        current = current.add(1, "day");
    }

    if (datePool.length === 0) {
        throw new Error("No valid exam dates available (all are holidays?)");
    }

    // Step 3: Greedy scheduling with constraints
    const routine = [];
    const lastScheduledDatePerSemester = {}; // { semester: date }

    // Shuffle subjects to introduce randomness
    const subjects = [...allSubjects].sort(() => Math.random() - 0.5);

    let dateIndex = 0;

    for (const subject of subjects) {
        while (dateIndex < datePool.length) {
            const date = datePool[dateIndex];
            const lastDate = lastScheduledDatePerSemester[subject.semester];

            const diff = lastDate ? dayjs(date).diff(dayjs(lastDate), "day") : Infinity;
            if (diff >= 2) {
                routine.push({
                    date,
                    subjectName: subject.subjectName,
                    semester: subject.semester,
                });
                lastScheduledDatePerSemester[subject.semester] = date;
                dateIndex++; // Move to next date (one exam per day)
                break;
            } else {
                dateIndex++;
            }
        }

        if (dateIndex >= datePool.length) {
            throw new Error(`Unable to schedule all subjects. Not enough dates.`);
        }
    }

    routine.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    const routineDocRef = doc(db, "Routine", department, batch, seasonYear);
    await setDoc(routineDocRef, {
        meta: {
            startDate,
            endDate,
            createdAt: new Date().toISOString(),
        },
        holidays,
        routine,
    });

    return routine;
};