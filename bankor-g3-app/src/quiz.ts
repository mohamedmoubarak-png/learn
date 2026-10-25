/** Offline quiz engine; full question bank and exam blueprint are bundled with the app. */
import {localDay} from './planner';
import {ReviewCards,updateReviewCards} from './review';
export type Question={id:string;topic:string;g:'m'|'t';q:string;o:string[];a:number;why?:string;ow?:(string|null)[];clue?:string;imp?:boolean;sub?:string};
export type QuizMode='quick'|'topic'|'exam'|'review'|'challenge'|'lesson';
export type QuizAttempt={id:string;mode:QuizMode;date:string;correct:number;total:number;score:number;seconds:number};
export type QuizProgress={attempts:QuizAttempt[];wrongIds:string[];rewardedIds:string[];milestoneCleared?:string[];lessonMastered?:string[];reviewCards?:ReviewCards};
export const emptyQuizProgress=():QuizProgress=>({attempts:[],wrongIds:[],rewardedIds:[],milestoneCleared:[],lessonMastered:[],reviewCards:{}});
export function shuffle<T>(a:T[],rnd:()=>number=Math.random):T[]{const result=[...a];for(let i=result.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function drawExam(all:Question[],blueprint:Record<'m'|'t',Record<string,number>>,rnd:()=>number=Math.random):Question[]{
 const picked:Question[]=[];
 for(const group of ['m','t'] as const){for(const [topic,num] of Object.entries(blueprint[group])){
  const pool=all.filter(q=>q.topic===topic&&q.g===group&&q.o.length>=2&&q.a>=0&&q.a<q.o.length);
  if(pool.length<num)throw new Error(`عدد أسئلة ${topic} غير كافٍ`);
  picked.push(...shuffle(pool,rnd).slice(0,num));
 }}
 return shuffle(picked,rnd);
}
export function drawPractice(all:Question[],count:number,topic?:string,wrongIds?:string[],rnd:()=>number=Math.random):Question[]{
 const wrong=wrongIds?new Set(wrongIds):null;
 return shuffle(all.filter(q=>(!topic||q.topic===topic)&&(!wrong||wrong.has(q.id))&&q.a>=0&&q.a<q.o.length),rnd).slice(0,count);
}
export function gradeQuiz(questions:Question[],answers:Record<string,number>):{correct:number;total:number;score:number;wrongIds:string[]}{
 const correct=questions.filter(q=>answers[q.id]===q.a).length;
 return {correct,total:questions.length,score:questions.length?Math.round(correct*100/questions.length):0,wrongIds:questions.filter(q=>answers[q.id]!==q.a).map(q=>q.id)};
}
/** XP is awarded once per unique question, capped to prevent repeat farming. */
export function recordAttempt(progress:QuizProgress,questions:Question[],answers:Record<string,number>,mode:QuizMode,seconds:number,now=new Date(),sessionId?:string):{progress:QuizProgress;xp:number;attempt:QuizAttempt}{
 if(sessionId){const existing=progress.attempts.find(a=>a.id===sessionId);if(existing)return {progress,xp:0,attempt:existing};}
 const result=gradeQuiz(questions,answers), rewarded=new Set(progress.rewardedIds),wrong=new Set(progress.wrongIds);
 let xp=0;
 for(const question of questions){if(answers[question.id]===question.a){wrong.delete(question.id);if(!rewarded.has(question.id)){xp+=5;rewarded.add(question.id);}}
  else{wrong.add(question.id);}}
 const attempt:QuizAttempt={id:sessionId||now.toISOString()+'-'+mode,mode,date:now.toISOString(),correct:result.correct,total:result.total,score:result.score,seconds};
 const answered=questions.filter(q=>answers[q.id]!==undefined).map(q=>({id:q.id,correct:answers[q.id]===q.a}));
 const reviewCards=updateReviewCards(progress.reviewCards||{},answered,localDay(now));
 return {progress:{...progress,attempts:[attempt,...progress.attempts].slice(0,100),wrongIds:[...wrong],rewardedIds:[...rewarded],reviewCards},xp,attempt};
}

/** Questions are linked to particular lesson IDs in the imported source. Never guess a link. */
export function drawLessonPractice(all:Question[],linkedIds:string[],count=5,rnd:()=>number=Math.random):Question[]{
 const ids=new Set(linkedIds);return shuffle(all.filter(q=>ids.has(q.id)&&q.a>=0&&q.a<q.o.length),rnd).slice(0,count);
}
export function awardLessonMastery(progress:QuizProgress,lessonId:string,passed:boolean):{progress:QuizProgress;xp:number}{
 if(!passed||(progress.lessonMastered||[]).includes(lessonId))return {progress,xp:0};
 return {progress:{...progress,lessonMastered:[...(progress.lessonMastered||[]),lessonId]},xp:20};
}
