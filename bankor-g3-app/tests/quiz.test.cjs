const assert=require('node:assert/strict');
const {drawExam,drawPractice,gradeQuiz,recordAttempt,emptyQuizProgress}=require('./compiled/quiz.js');
const all=require('../data/questions.json').questions;
const blueprint=require('../data/meta.json').blueprint;
const exam=drawExam(all,blueprint,()=>0.5);
assert.equal(exam.length,50);assert.equal(new Set(exam.map(q=>q.id)).size,50);
for(const [g,groups] of Object.entries(blueprint))for(const [topic,n] of Object.entries(groups))assert.equal(exam.filter(q=>q.g===g&&q.topic===topic).length,n);
const five=drawPractice(all,5,'risk',undefined,()=>0.2);assert.equal(five.length,5);assert.ok(five.every(q=>q.topic==='risk'));
const perfect=Object.fromEntries(five.map(q=>[q.id,q.a]));assert.equal(gradeQuiz(five,perfect).score,100);
let p=recordAttempt(emptyQuizProgress(),five,perfect,'quick',36,new Date('2026-10-25T11:00:00Z'));assert.equal(p.xp,25);
let p2=recordAttempt(p.progress,five,perfect,'quick',36,new Date('2026-10-25T11:01:00Z'));assert.equal(p2.xp,0);
let failed=recordAttempt(p2.progress,five,{},'quick',100,new Date('2026-10-25T11:02:00Z'));assert.equal(failed.progress.wrongIds.length,5);
console.log('PASS — full 50-question blueprint, unique draw, 100% grading, earned-only-once XP, review tracking');

// Idempotent finalization: a timer and a manual tap must not reward the same session twice.
{const {recordAttempt,emptyQuizProgress}=require('./compiled/quiz.js');
 const q=all.slice(0,1);const ans={[q[0].id]:q[0].a};
 const first=recordAttempt(emptyQuizProgress(),q,ans,'exam',5,new Date('2026-10-25T08:00:00Z'),'session-stable');
 const second=recordAttempt(first.progress,q,ans,'exam',6,new Date('2026-10-25T08:01:00Z'),'session-stable');
 assert.equal(second.xp,0);assert.equal(second.progress.attempts.length,1);assert.equal(second.attempt.id,'session-stable');
}
