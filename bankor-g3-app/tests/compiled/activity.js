"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activitySummary = activitySummary;
/** Offline daily-activity calculations. A meaningful quiz or a finished lesson counts.
 * The current day's streak stays visible until the next day; activity is not faked. */
const planner_1 = require("./planner");
function activitySummary(state, attempts, now = new Date()) {
    const today = (0, planner_1.localDay)(now);
    const lessonDates = Object.values(state.done).filter(x => Number.isFinite(Date.parse(x.at))).map(x => (0, planner_1.localDay)(new Date(x.at)));
    // Skip zero-question sessions: only actual practice counts as study activity.
    const valid = attempts.filter(a => a.total > 0 && Number.isFinite(Date.parse(a.date)));
    const days = new Set([...lessonDates, ...valid.map(a => (0, planner_1.localDay)(new Date(a.date)))]);
    const calendar = [...days].sort();
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    const activeToday = days.has(today);
    if (!activeToday)
        d.setDate(d.getDate() - 1);
    let streak = 0;
    while (streak < 366 && days.has((0, planner_1.localDay)(d))) {
        streak++;
        d.setDate(d.getDate() - 1);
    }
    return { streak, activeToday, activityDays: calendar, lessonsToday: lessonDates.filter(x => x === today).length, questionsToday: valid.filter(a => (0, planner_1.localDay)(new Date(a.date)) === today).reduce((n, a) => n + a.total, 0) };
}
