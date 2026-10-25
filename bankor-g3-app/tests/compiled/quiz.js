"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyQuizProgress = void 0;
exports.shuffle = shuffle;
exports.drawExam = drawExam;
exports.drawPractice = drawPractice;
exports.gradeQuiz = gradeQuiz;
exports.recordAttempt = recordAttempt;
exports.drawLessonPractice = drawLessonPractice;
exports.awardLessonMastery = awardLessonMastery;
/** Offline quiz engine; full question bank and exam blueprint are bundled with the app. */
const planner_1 = require("./planner");
const review_1 = require("./review");
const emptyQuizProgress = () => ({ attempts: [], wrongIds: [], rewardedIds: [], milestoneCleared: [], lessonMastered: [], reviewCards: {} });
exports.emptyQuizProgress = emptyQuizProgress;
function shuffle(a, rnd = Math.random) { const result = [...a]; for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
} return result; }
function drawExam(all, blueprint, rnd = Math.random) {
    const picked = [];
    for (const group of ['m', 't']) {
        for (const [topic, num] of Object.entries(blueprint[group])) {
            const pool = all.filter(q => q.topic === topic && q.g === group && q.o.length >= 2 && q.a >= 0 && q.a < q.o.length);
            if (pool.length < num)
                throw new Error(`عدد أسئلة ${topic} غير كافٍ`);
            picked.push(...shuffle(pool, rnd).slice(0, num));
        }
    }
    return shuffle(picked, rnd);
}
function drawPractice(all, count, topic, wrongIds, rnd = Math.random) {
    const wrong = wrongIds ? new Set(wrongIds) : null;
    return shuffle(all.filter(q => (!topic || q.topic === topic) && (!wrong || wrong.has(q.id)) && q.a >= 0 && q.a < q.o.length), rnd).slice(0, count);
}
function gradeQuiz(questions, answers) {
    const correct = questions.filter(q => answers[q.id] === q.a).length;
    return { correct, total: questions.length, score: questions.length ? Math.round(correct * 100 / questions.length) : 0, wrongIds: questions.filter(q => answers[q.id] !== q.a).map(q => q.id) };
}
/** XP is awarded once per unique question, capped to prevent repeat farming. */
function recordAttempt(progress, questions, answers, mode, seconds, now = new Date(), sessionId) {
    if (sessionId) {
        const existing = progress.attempts.find(a => a.id === sessionId);
        if (existing)
            return { progress, xp: 0, attempt: existing };
    }
    const result = gradeQuiz(questions, answers), rewarded = new Set(progress.rewardedIds), wrong = new Set(progress.wrongIds);
    let xp = 0;
    for (const question of questions) {
        if (answers[question.id] === question.a) {
            wrong.delete(question.id);
            if (!rewarded.has(question.id)) {
                xp += 5;
                rewarded.add(question.id);
            }
        }
        else {
            wrong.add(question.id);
        }
    }
    const attempt = { id: sessionId || now.toISOString() + '-' + mode, mode, date: now.toISOString(), correct: result.correct, total: result.total, score: result.score, seconds };
    const answered = questions.filter(q => answers[q.id] !== undefined).map(q => ({ id: q.id, correct: answers[q.id] === q.a }));
    const reviewCards = (0, review_1.updateReviewCards)(progress.reviewCards || {}, answered, (0, planner_1.localDay)(now));
    return { progress: { ...progress, attempts: [attempt, ...progress.attempts].slice(0, 100), wrongIds: [...wrong], rewardedIds: [...rewarded], reviewCards }, xp, attempt };
}
/** Questions are linked to particular lesson IDs in the imported source. Never guess a link. */
function drawLessonPractice(all, linkedIds, count = 5, rnd = Math.random) {
    const ids = new Set(linkedIds);
    return shuffle(all.filter(q => ids.has(q.id) && q.a >= 0 && q.a < q.o.length), rnd).slice(0, count);
}
function awardLessonMastery(progress, lessonId, passed) {
    if (!passed || (progress.lessonMastered || []).includes(lessonId))
        return { progress, xp: 0 };
    return { progress: { ...progress, lessonMastered: [...(progress.lessonMastered || []), lessonId] }, xp: 20 };
}
