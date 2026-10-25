"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXAM_SECONDS = void 0;
exports.makeQuizSnapshot = makeQuizSnapshot;
exports.restoreQuizSnapshot = restoreQuizSnapshot;
exports.quizRemainingSeconds = quizRemainingSeconds;
exports.unansweredCount = unansweredCount;
exports.EXAM_SECONDS = 3600;
function makeQuizSnapshot(session, answers, index) {
    return { v: 1, mode: session.mode, questionIds: session.questions.map(q => q.id), start: session.start, topic: session.topic, lessonId: session.lessonId, answers: { ...answers }, index };
}
function restoreQuizSnapshot(value, all) {
    if (!value || typeof value !== 'object')
        return null;
    const s = value;
    const modes = ['quick', 'topic', 'exam', 'review', 'challenge', 'lesson'];
    if (s.v !== 1 || !modes.includes(s.mode) || !Array.isArray(s.questionIds) || s.questionIds.length === 0 || s.questionIds.length > 100 || typeof s.start !== 'number' || !Number.isFinite(s.start) || s.start <= 0 || s.start > Date.now() + 60000)
        return null;
    if (new Set(s.questionIds).size !== s.questionIds.length || s.questionIds.some(x => typeof x !== 'string'))
        return null;
    const lookup = new Map(all.map(q => [q.id, q]));
    const questions = s.questionIds.map(id => lookup.get(id));
    if (questions.some(q => !q))
        return null;
    const restored = questions;
    const answers = {};
    if (s.answers && typeof s.answers === 'object')
        for (const q of restored) {
            const a = s.answers[q.id];
            if (Number.isInteger(a) && a >= 0 && a < q.o.length)
                answers[q.id] = a;
        }
    const index = typeof s.index === 'number' && Number.isInteger(s.index) ? Math.max(0, Math.min(restored.length - 1, s.index)) : 0;
    return { session: { mode: s.mode, questions: restored, start: s.start, topic: typeof s.topic === 'string' ? s.topic : undefined, lessonId: typeof s.lessonId === 'string' ? s.lessonId : undefined }, answers, index };
}
function quizRemainingSeconds(start, now = Date.now()) { return Math.max(0, exports.EXAM_SECONDS - Math.floor((now - start) / 1000)); }
function unansweredCount(questions, answers) { return questions.filter(q => answers[q.id] === undefined).length; }
