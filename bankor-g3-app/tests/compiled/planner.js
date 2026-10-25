"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAY_MS = exports.freshState = void 0;
exports.localDay = localDay;
exports.parseDay = parseDay;
exports.daysInclusive = daysInclusive;
exports.blocksForDay = blocksForDay;
exports.capacity = capacity;
exports.effectiveCapacity = effectiveCapacity;
exports.readingEstimate = readingEstimate;
exports.remainingEstimate = remainingEstimate;
exports.forecast = forecast;
exports.finishLesson = finishLesson;
exports.grantRewards = grantRewards;
exports.streak = streak;
const schedule_1 = require("./schedule");
const freshState = () => ({ done: {}, reading: {}, dayRewards: {}, dailyGoals: {}, completedReward: false, xp: 0, hearts: 5 });
exports.freshState = freshState;
exports.DAY_MS = 86400000;
function localDay(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function parseDay(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if (!m)
    throw Error('صيغة التاريخ يجب أن تكون YYYY-MM-DD'); const d = new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0); if (localDay(d) !== s)
    throw Error('تاريخ غير صالح'); return d; }
function daysInclusive(a, b) { let from = parseDay(a), to = parseDay(b), out = []; for (let i = 0; from <= to && i < 366; i++) {
    out.push(localDay(from));
    from.setDate(from.getDate() + 1);
} return out; }
/** Explicit dates override recurring days off. Date-specific vacation schedules can be longer than normal. */
function blocksForDay(day, c) {
    if (Object.prototype.hasOwnProperty.call(c.dayOverrides || {}, day))
        return c.dayOverrides[day];
    const dow = parseDay(day).getDay();
    if (c.daysOff.includes(dow))
        return [];
    const weekend = dow === 5 || dow === 6;
    if (weekend && c.weekendBlocks)
        return c.weekendBlocks;
    if (!weekend && c.weekdayBlocks)
        return c.weekdayBlocks;
    return [{ start: weekend ? (c.weekendStart || '10:00') : (c.weekdayStart || '20:00'), minutes: Math.max(0, weekend ? c.weekendMinutes : c.weekdayMinutes) }];
}
function capacity(day, c) { return (0, schedule_1.blocksMinutes)(blocksForDay(day, c)); }
/** Don't count study windows which already passed today. */
function effectiveCapacity(day, c, now) {
    const today = localDay(now);
    if (day < today)
        return 0;
    if (day > today)
        return capacity(day, c);
    const minute = now.getHours() * 60 + now.getMinutes();
    return blocksForDay(day, c).reduce((sum, block) => {
        const start = (0, schedule_1.clockMinutes)(block.start), end = start + block.minutes;
        return sum + Math.max(0, end - Math.max(start, minute));
    }, 0);
}
function readingEstimate(l, c) { return Math.max(3, l.estimatedWords / Math.max(25, Math.min(220, c.wpm)) + 4); }
function remainingEstimate(l, s, c) {
    if (s.done[l.id])
        return 0;
    const r = s.reading[l.id];
    const total = readingEstimate(l, c);
    if (!r)
        return total;
    // Time and scrolling BOTH needed to count partially-read content. At least 3 minutes remain to confirm reading.
    const effort = Math.min(Math.max(0, r.maxScroll), Math.max(0, r.seconds) / (total * 60));
    return Math.max(3, total * (1 - Math.min(.92, effort)));
}
function forecast(lessons, s, c, now = new Date()) {
    const today = localDay(now), done = lessons.filter(l => !!s.done[l.id]).length;
    // Learn the user's reading speed from credible completed sessions; smooth with their initial setting.
    const sample = lessons.filter(l => s.done[l.id] && (s.done[l.id].seconds >= 120) && (s.reading[l.id]?.maxScroll || 0) >= .85);
    const words = sample.reduce((n, l) => n + l.estimatedWords, 0), seconds = sample.reduce((n, l) => n + s.done[l.id].seconds, 0);
    const learned = seconds ? Math.min(180, Math.max(30, words * 60 / seconds)) : c.wpm;
    const trust = Math.min(.75, sample.length / 8);
    const estimatedWpm = Math.round(c.wpm * (1 - trust) + learned * trust);
    const cc = { ...c, wpm: estimatedWpm };
    const outstanding = lessons.filter(l => !s.done[l.id]).map(l => ({ ...l, remaining: remainingEstimate(l, s, cc), total: readingEstimate(l, cc) }));
    const remainingMinutes = outstanding.reduce((v, l) => v + l.remaining, 0);
    const dates = daysInclusive(today, c.deadline);
    const days = dates.map(d => ({ date: d, capacity: effectiveCapacity(d, c, now), targetMinutes: 0, tasks: [] }));
    const capacityMinutes = days.reduce((n, d) => n + d.capacity, 0), active = days.filter(d => d.capacity > 0).length;
    const requiredDaily = active ? Math.ceil(remainingMinutes / active) : Math.ceil(remainingMinutes);
    const availableDaily = active ? Math.round(capacityMinutes / active) : 0;
    const shortfall = Math.max(0, Math.ceil(remainingMinutes - capacityMinutes));
    // Weighted distribution balances each day with the remaining capacity. Every unit can span multiple days.
    let left = outstanding.map(o => ({ ...o })), cursor = 0, need = remainingMinutes, cap = capacityMinutes;
    for (const day of days) {
        if (!day.capacity)
            continue;
        const share = cap > 0 ? Math.min(day.capacity, need * day.capacity / cap) : 0;
        let quota = Math.max(0, Math.min(day.capacity, share));
        day.targetMinutes = Math.ceil(quota);
        while (quota > 0.01 && cursor < left.length) {
            const task = left[cursor], slice = Math.min(quota, task.remaining);
            day.tasks.push({ id: task.id, title: task.title, topicTitle: task.topicTitle, minutes: Math.round(slice * 10) / 10, estimatedTotal: Math.round(task.total) });
            quota -= slice;
            task.remaining -= slice;
            need -= slice;
            if (task.remaining <= .01)
                cursor++;
        }
        cap -= day.capacity;
    }
    let expectedFinish = null;
    if (remainingMinutes === 0)
        expectedFinish = today;
    else {
        let rem = remainingMinutes, cur = parseDay(today);
        for (let i = 0; i < 366; i++) {
            const d = localDay(cur);
            rem -= effectiveCapacity(d, c, now);
            if (rem <= 0) {
                expectedFinish = d;
                break;
            }
            cur.setDate(cur.getDate() + 1);
        }
    }
    const expired = dates.length === 0, atRisk = shortfall > 1;
    const status = !outstanding.length ? 'complete' : expired ? 'expired' : atRisk ? 'at-risk' : 'on-track';
    // Mood considers today+the deadline, rather than shaming for any day missed.
    const todayGoal = days[0], todayDone = lessons.filter(l => localDay(new Date(s.done[l.id]?.at || '2000-01-01')) === today).length;
    const recentTimes = Object.values(s.done).map(v => +new Date(v.at)).filter(Number.isFinite);
    const firstGoal = Object.keys(s.dailyGoals).sort()[0];
    const fallback = firstGoal ? parseDay(firstGoal).getTime() : now.getTime();
    const last = recentTimes.length ? Math.max(...recentTimes) : fallback, daysAbsent = Math.max(0, Math.floor((now.getTime() - last) / exports.DAY_MS));
    const mood = status === 'complete' ? 'party' : status === 'expired' ? 'sad' : todayDone > 0 ? 'happy' : daysAbsent >= 3 ? 'sad' : daysAbsent >= 1 || status === 'at-risk' ? 'worried' : 'happy';
    return { days, remainingMinutes, capacityMinutes, finished: done, total: lessons.length, requiredDaily, availableDaily, shortfall, extraDaily: Math.max(0, requiredDaily - availableDaily), status, mood, progress: lessons.length ? done / lessons.length : 1, expectedFinish, estimatedWpm };
}
function finishLesson(s, id, now = new Date()) {
    if (s.done[id])
        return { state: s, xpGained: 0, fullReward: false };
    const next = { ...s, done: { ...s.done, [id]: { at: now.toISOString(), seconds: s.reading[id]?.seconds || 0 } }, xp: s.xp + 15 };
    return { state: next, xpGained: 15, fullReward: false };
}
/** Explicit reward grant: called only after completion (not when a day passes). */
function grantRewards(s, lessons, c, fc, now = new Date()) {
    const key = localDay(now), next = { ...s, dayRewards: { ...s.dayRewards } }, messages = [], all = lessons.length > 0 && lessons.every(l => !!s.done[l.id]);
    let xp = 0;
    const todays = lessons.filter(l => s.done[l.id] && localDay(new Date(s.done[l.id].at)) === key);
    const frozenGoal = s.dailyGoals[key] ?? fc.days[0]?.targetMinutes ?? 0;
    // Day goal is achieved only when recorded reading effort this day is meaningful.
    const mins = todays.reduce((a, l) => a + readingEstimate(l, c), 0);
    if (frozenGoal > 0 && mins >= frozenGoal && !next.dayRewards[key]) {
        next.dayRewards[key] = true;
        xp += 25;
        messages.push('مكافأة هدف النهارده +25 XP');
    }
    if (all && !next.completedReward) {
        next.completedReward = true;
        xp += 250;
        messages.push('بطولة بنكور! خلصت كل الماتريال +250 XP');
    }
    next.xp += xp;
    return { state: next, xpGained: xp, messages };
}
function streak(s, now = new Date()) {
    const days = new Set(Object.values(s.done).map(v => localDay(new Date(v.at))));
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    if (!days.has(localDay(d)))
        d.setDate(d.getDate() - 1);
    let n = 0;
    while (n < 366 && days.has(localDay(d))) {
        n++;
        d.setDate(d.getDate() - 1);
    }
    return n;
}
