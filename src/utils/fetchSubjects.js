import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Fetch all subjects for a given department and batch
 * across all 8 semesters
 */
export const fetchAllSubjects = async (department, batch) => {
    const semesters = [
        "1st Semester", "2nd Semester",
        "3rd Semester", "4th Semester",
        "5th Semester", "6th Semester",
        "7th Semester", "8th Semester"
    ];

    const allSubjects = [];

    for (const semester of semesters) {
        const subjectsRef = collection(
            db,
            "departments", department,
            "batches", batch,
            "semesters", semester,
            "subjects"
        );

        const snapshot = await getDocs(subjectsRef);

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            allSubjects.push({
                name: data.subjectName,
                credit: data.credit,
                semester
            });
        });
    }

    return allSubjects;
};
