"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildJourney = buildJourney;
exports.splitLessonSteps = splitLessonSteps;
exports.challengePassed = challengePassed;
exports.awardMilestone = awardMilestone;
function buildJourney(lessons, questions, study, quizzes) {
    const topics = [];
    for (const lesson of lessons) {
        if (!topics.includes(lesson.topic))
            topics.push(lesson.topic);
    }
    let firstUnfinished = true;
    return topics.map(topic => {
        const members = lessons.filter(l => l.topic === topic);
        const done = members.filter(l => Boolean(study.done[l.id])).length;
        const hasChallenge = questions.some(q => q.topic === topic && q.o.length >= 2 && q.a >= 0 && q.a < q.o.length);
        const cleared = (quizzes.milestoneCleared || []).includes(topic);
        const stages = members.map((lesson, index) => {
            const completed = Boolean(study.done[lesson.id]);
            const active = !completed && firstUnfinished;
            if (active)
                firstUnfinished = false;
            return { id: `lesson:${lesson.id}`, kind: 'lesson', topic, title: lesson.title, subtitle: `الدرس ${index + 1} من ${members.length}`, status: completed ? 'done' : active ? 'active' : 'upcoming', lessonId: lesson.id, index };
        });
        if (hasChallenge) {
            stages.push({ id: `checkpoint:${topic}`, kind: 'checkpoint', topic, title: 'تحدي إتقان الوحدة', subtitle: '5 أسئلة · النجاح من 80%', status: cleared ? 'done' : done === members.length ? 'active' : 'locked', index: members.length });
        }
        return { topic, title: members[0]?.topicTitle || topic, done, total: members.length, cleared, hasChallenge, stages };
    });
}
/** Splits headings and paragraphs into manageable steps; never changes educational words. */
function splitLessonSteps(text, maxChars = 1000) {
    const paragraphs = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const steps = [];
    let current = '';
    for (const paragraph of paragraphs) {
        // Keep paragraphs intact, even if unusually long, to avoid corrupting a formula or example.
        if (current && current.length + paragraph.length + 2 > maxChars) {
            steps.push(current);
            current = '';
        }
        current = current ? current + '\n\n' + paragraph : paragraph;
    }
    if (current)
        steps.push(current);
    return steps.length ? steps : ['لا يوجد نص للدرس.'];
}
function challengePassed(correct, total) { return total > 0 && correct / total >= .8; }
function awardMilestone(progress, topic, passed) {
    if (!passed || (progress.milestoneCleared || []).includes(topic))
        return { progress, xp: 0 };
    return { progress: { ...progress, milestoneCleared: [...(progress.milestoneCleared || []), topic] }, xp: 40 };
}
