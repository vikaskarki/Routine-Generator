import dayjs from "dayjs";

export function generateRoutine(subjects, startDate, endDate, holidaysMap) {
    const routine = [];
    const holidaySet = new Set(Object.keys(holidaysMap));
    const examDays = [];

    let current = dayjs(startDate);
    const final = dayjs(endDate);

    while (current.isSameOrBefore(final)) {
        const dateStr = current.format("YYYY-MM-DD");
        if (!holidaySet.has(dateStr)) {
            examDays.push(dateStr);
        }
        current = current.add(1, "day");
    }

    // Greedy fill: 1 subject per day
    const shuffled = [...subjects].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length && i < examDays.length; i++) {
        routine.push({
            subject: shuffled[i].subjectName,
            credit: shuffled[i].credit,
            date: examDays[i],
        });
    }

    return routine;
}
