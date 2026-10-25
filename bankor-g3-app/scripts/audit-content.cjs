const fs=require('node:fs');
const lessons=require('../data/lessons.json');
const questions=require('../data/questions.json').questions;
const meta=require('../data/meta.json');
const assert=require('node:assert/strict');
function unique(items){return new Set(items).size===items.length;}
assert.ok(unique(lessons.map(x=>x.id)),'Duplicate lesson IDs');
assert.ok(unique(questions.map(x=>x.id)),'Duplicate question IDs');
assert.ok(lessons.every(l=>l.id&&l.topic&&l.title&&l.reading&&l.reading.trim()),'Invalid/empty lesson');
assert.ok(questions.every(q=>q.id&&q.q&&q.q.trim()&&Array.isArray(q.o)&&q.o.length>=2&&Number.isInteger(q.a)&&q.a>=0&&q.a<q.o.length),'Invalid question/answer');
const byId=new Set(questions.map(q=>q.id));
const badLinks=lessons.flatMap(l=>(l.questions||[]).filter(id=>!byId.has(id)).map(id=>`${l.id}: ${id}`));
assert.equal(badLinks.length,0,`Broken question links: ${badLinks.join('; ')}`);
for(const [group,topics] of Object.entries(meta.blueprint))for(const [topic,n] of Object.entries(topics)){
 const count=questions.filter(q=>q.g===group&&q.topic===topic).length;
 assert.ok(count>=n,`Exam requires ${n} questions for ${group}/${topic}, only ${count}`);
}
const qsTopics=[...new Set(questions.map(q=>q.topic))];
const lsTopics=new Set(lessons.map(l=>l.topic));
const orphanTopics=qsTopics.filter(t=>!lsTopics.has(t));
const diagnostic={version:'0.8.0',lessons:lessons.length,questions:questions.length,lessonTopics:lsTopics.size,questionTopics:qsTopics.length,questionsMissingLinkedLesson:questions.filter(q=>!lessons.some(l=>(l.questions||[]).includes(q.id))).length,topicsWithoutReadingLessons:orphanTopics};
console.log('PASS — content audit',JSON.stringify(diagnostic));
if(orphanTopics.length)console.log('NOTE — topics without lessons:',orphanTopics.join(', '));
