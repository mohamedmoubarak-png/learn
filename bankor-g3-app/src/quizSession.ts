/** Pure, versioned snapshot for resuming a quiz after Android process death. */
import type {Question,QuizMode} from './quiz';
export const EXAM_SECONDS=3600;
export type QuizSnapshot={v:1;mode:QuizMode;questionIds:string[];start:number;topic?:string;lessonId?:string;answers:Record<string,number>;index:number};
export function makeQuizSnapshot(session:{mode:QuizMode;questions:Question[];start:number;topic?:string;lessonId?:string},answers:Record<string,number>,index:number):QuizSnapshot{
 return {v:1,mode:session.mode,questionIds:session.questions.map(q=>q.id),start:session.start,topic:session.topic,lessonId:session.lessonId,answers:{...answers},index};
}
export function restoreQuizSnapshot(value:unknown,all:Question[]):{session:{mode:QuizMode;questions:Question[];start:number;topic?:string;lessonId?:string};answers:Record<string,number>;index:number}|null{
 if(!value||typeof value!=='object')return null;
 const s=value as Partial<QuizSnapshot>;
 const modes:QuizMode[]=['quick','topic','exam','review','challenge','lesson'];
 if(s.v!==1||!modes.includes(s.mode as QuizMode)||!Array.isArray(s.questionIds)||s.questionIds.length===0||s.questionIds.length>100||typeof s.start!=='number'||!Number.isFinite(s.start)||s.start<=0||s.start>Date.now()+60_000)return null;
 if(new Set(s.questionIds).size!==s.questionIds.length||s.questionIds.some(x=>typeof x!=='string'))return null;
 const lookup=new Map(all.map(q=>[q.id,q]));const questions=s.questionIds.map(id=>lookup.get(id));
 if(questions.some(q=>!q))return null;
 const restored=questions as Question[];const answers:Record<string,number>={};
 if(s.answers&&typeof s.answers==='object')for(const q of restored){const a=s.answers[q.id];if(Number.isInteger(a)&&a>=0&&a<q.o.length)answers[q.id]=a;}
 const index=typeof s.index==='number'&&Number.isInteger(s.index)?Math.max(0,Math.min(restored.length-1,s.index)):0;
 return {session:{mode:s.mode!,questions:restored,start:s.start,topic:typeof s.topic==='string'?s.topic:undefined,lessonId:typeof s.lessonId==='string'?s.lessonId:undefined},answers,index};
}
export function quizRemainingSeconds(start:number,now:number=Date.now()):number{return Math.max(0,EXAM_SECONDS-Math.floor((now-start)/1000));}
export function unansweredCount(questions:Question[],answers:Record<string,number>):number{return questions.filter(q=>answers[q.id]===undefined).length;}
