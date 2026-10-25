import type {Lesson,StudyState} from './planner';
import type {Question,QuizProgress} from './quiz';
/** Pure Duolingo-inspired journey model. Never hides core material behind a checkpoint. */
export type JourneyStage={id:string;kind:'lesson'|'checkpoint';topic:string;title:string;subtitle:string;status:'done'|'active'|'upcoming'|'locked';lessonId?:string;index:number};
export type JourneyUnit={topic:string;title:string;done:number;total:number;cleared:boolean;hasChallenge:boolean;stages:JourneyStage[]};

export function buildJourney(lessons:Lesson[],questions:Question[],study:StudyState,quizzes:QuizProgress):JourneyUnit[]{
 const topics:string[]=[];for(const lesson of lessons){if(!topics.includes(lesson.topic))topics.push(lesson.topic)}
 let firstUnfinished=true;
 return topics.map(topic=>{
  const members=lessons.filter(l=>l.topic===topic);
  const done=members.filter(l=>Boolean(study.done[l.id])).length;
  const hasChallenge=questions.some(q=>q.topic===topic&&q.o.length>=2&&q.a>=0&&q.a<q.o.length);
  const cleared=(quizzes.milestoneCleared||[]).includes(topic);
  const stages:JourneyStage[]=members.map((lesson,index)=>{
   const completed=Boolean(study.done[lesson.id]);
   const active=!completed&&firstUnfinished;
   if(active)firstUnfinished=false;
   return {id:`lesson:${lesson.id}`,kind:'lesson',topic,title:lesson.title,subtitle:`الدرس ${index+1} من ${members.length}`,status:completed?'done':active?'active':'upcoming',lessonId:lesson.id,index};
  });
  if(hasChallenge){
   stages.push({id:`checkpoint:${topic}`,kind:'checkpoint',topic,title:'تحدي إتقان الوحدة',subtitle:'5 أسئلة · النجاح من 80%',status:cleared?'done':done===members.length?'active':'locked',index:members.length});
  }
  return {topic,title:members[0]?.topicTitle||topic,done,total:members.length,cleared,hasChallenge,stages};
 });
}

/** Splits headings and paragraphs into manageable steps; never changes educational words. */
export function splitLessonSteps(text:string,maxChars=1000):string[]{
 const paragraphs=text.replace(/\r\n/g,'\n').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
 const steps:string[]=[];let current='';
 for(const paragraph of paragraphs){
  // Keep paragraphs intact, even if unusually long, to avoid corrupting a formula or example.
  if(current&&current.length+paragraph.length+2>maxChars){steps.push(current);current='';}
  current=current?current+'\n\n'+paragraph:paragraph;
 }
 if(current)steps.push(current);
 return steps.length?steps:['لا يوجد نص للدرس.'];
}
export function challengePassed(correct:number,total:number):boolean{return total>0&&correct/total>=.8}

export function awardMilestone(progress:QuizProgress,topic:string,passed:boolean):{progress:QuizProgress;xp:number}{
 if(!passed||(progress.milestoneCleared||[]).includes(topic))return {progress,xp:0};
 return {progress:{...progress,milestoneCleared:[...(progress.milestoneCleared||[]),topic]},xp:40};
}
