"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReviewCards = updateReviewCards;
exports.dueReviewIds = dueReviewIds;
exports.reviewSummary = reviewSummary;
exports.nextReviewDates = nextReviewDates;
/** Offline spaced-review scheduler for attempted questions. No cloud account needed. */
const planner_1 = require("./planner");
const INTERVALS = [1, 3, 7, 14, 30, 60, 90];
function addDays(date, days) { const d = (0, planner_1.parseDay)(date); d.setDate(d.getDate() + days); return (0, planner_1.localDay)(d); }
/** Wrong answers are available for review immediately; correctly recalled ones space out. */
function updateReviewCards(cards, results, today) {
    const updated = { ...cards };
    for (const { id, correct } of results) {
        const old = updated[id], successes = correct ? (old?.successes || 0) + 1 : 0;
        const intervalDays = correct ? INTERVALS[Math.min(successes - 1, INTERVALS.length - 1)] : 0;
        updated[id] = { due: addDays(today, intervalDays), intervalDays, successes, lapses: (old?.lapses || 0) + (correct ? 0 : 1), lastReviewed: today };
    }
    return updated;
}
/** Includes legacy errors from v0.5, to keep existing review collections intact. */
function dueReviewIds(cards, legacyWrongIds, today, limit = 20) {
    const due = Object.keys(cards).filter(id => cards[id].due <= today)
        .sort((a, b) => cards[a].due.localeCompare(cards[b].due) || cards[b].lapses - cards[a].lapses);
    const result = [...due];
    for (const id of legacyWrongIds) {
        if (!cards[id] && !result.includes(id))
            result.push(id);
    }
    return result.slice(0, limit);
}
function reviewSummary(cards, legacyWrongIds, today) {
    const due = dueReviewIds(cards, legacyWrongIds, today, Number.MAX_SAFE_INTEGER).length;
    const seen = new Set([...Object.keys(cards), ...legacyWrongIds]);
    const upcoming = Object.values(cards).filter(c => c.due > today).length;
    return { due, upcoming, seen: seen.size };
}
/** Returns dates with a pending review; notifications can be reserved in advance. */
function nextReviewDates(cards, today, maxDays = 7) {
    const latest = addDays(today, maxDays);
    return [...new Set(Object.values(cards).map(c => c.due).filter(d => d >= today && d <= latest))].sort();
}
