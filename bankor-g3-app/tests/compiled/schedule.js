"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vacationBlocks = exports.blocksMinutes = exports.clockMinutes = exports.validClock = void 0;
exports.parseStudyRanges = parseStudyRanges;
exports.formatStudyRanges = formatStudyRanges;
const validClock = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
exports.validClock = validClock;
const clockMinutes = (s) => { if (!(0, exports.validClock)(s))
    throw Error('الوقت لازم يكون HH:MM'); const [h, m] = s.split(':').map(Number); return 60 * h + m; };
exports.clockMinutes = clockMinutes;
const blocksMinutes = (blocks) => (blocks || []).reduce((a, b) => a + b.minutes, 0);
exports.blocksMinutes = blocksMinutes;
/** Format accepted by the schedule editor: 09:00-11:00, 13:00-15:00 */
function parseStudyRanges(input) {
    if (!input.trim())
        return [];
    const ranges = input.replace(/[،؛;]/g, ',').split(',').map(x => x.trim()).filter(Boolean);
    const items = ranges.map(range => {
        const match = /^([0-2]\d:[0-5]\d)\s*[-–—]\s*([0-2]\d:[0-5]\d)$/.exec(range);
        if (!match || !(0, exports.validClock)(match[1]) || !(0, exports.validClock)(match[2]))
            throw Error('اكتب الجلسات بالشكل 09:00-11:00, 13:00-15:00');
        const start = (0, exports.clockMinutes)(match[1]), end = (0, exports.clockMinutes)(match[2]);
        if (end <= start)
            throw Error('لازم وقت نهاية الجلسة يكون بعد بدايتها في نفس اليوم');
        return { start: match[1], minutes: end - start };
    }).sort((a, b) => (0, exports.clockMinutes)(a.start) - (0, exports.clockMinutes)(b.start));
    if (items.some((v, i) => i > 0 && (0, exports.clockMinutes)(items[i - 1].start) + items[i - 1].minutes > (0, exports.clockMinutes)(v.start)))
        throw Error('فيه جلستين متداخلتين في نفس اليوم');
    if ((0, exports.blocksMinutes)(items) > 840)
        throw Error('الحد الأقصى 14 ساعة مذاكرة في اليوم');
    return items;
}
function formatStudyRanges(blocks) {
    return blocks.map(v => { const e = (0, exports.clockMinutes)(v.start) + v.minutes; if (e > 1440)
        throw Error('الجلسة بتعدي منتصف الليل'); return `${v.start}-${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`; }).join(', ');
}
const vacationBlocks = (hours) => hours === 4
    ? [{ start: '09:00', minutes: 120 }, { start: '17:00', minutes: 120 }]
    : hours === 6 ? [{ start: '09:00', minutes: 120 }, { start: '13:00', minutes: 120 }, { start: '18:00', minutes: 120 }]
        : [{ start: '08:00', minutes: 150 }, { start: '12:00', minutes: 150 }, { start: '16:00', minutes: 120 }, { start: '20:00', minutes: 60 }];
exports.vacationBlocks = vacationBlocks;
