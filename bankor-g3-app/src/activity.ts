/** Offline daily-activity calculations. A meaningful quiz or a finished lesson counts.
 * The current day's streak stays visible until the next day; activity is not faked. */
import {StudyState,localDay} from './planner';
import type {QuizAttempt} from './quiz';
export type ActivitySummary={streak:number;activeToday:boolean;activityDays:string[];lessonsToday:number;questionsToday:number};
export function activitySummary(state:StudyState,attempts:QuizAttempt[],now=new Date()):ActivitySummary{
 const today=localDay(now);
 const lessonDates=Object.values(state.done).filter(x=>Number.isFinite(Date.parse(x.at))).map(x=>localDay(new Date(x.at)));
 // Skip zero-question sessions: only actual practice counts as study activity.
 const valid=attempts.filter(a=>a.total>0&&Number.isFinite(Date.parse(a.date)));
 const days=new Set([...lessonDates,...valid.map(a=>localDay(new Date(a.date)))]);
 const calendar=[...days].sort();
 const d=new Date(now);d.setHours(12,0,0,0);
 const activeToday=days.has(today);
 if(!activeToday)d.setDate(d.getDate()-1);
 let streak=0;
 while(streak<366&&days.has(localDay(d))){streak++;d.setDate(d.getDate()-1);}
 return {streak,activeToday,activityDays:calendar,lessonsToday:lessonDates.filter(x=>x===today).length,questionsToday:valid.filter(a=>localDay(new Date(a.date))===today).reduce((n,a)=>n+a.total,0)};
}
