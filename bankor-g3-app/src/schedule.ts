/** User-editable local-time study blocks. Never uses UTC for calendar scheduling. */
export type StudyBlock={start:string;minutes:number};
export const validClock=(s:string):boolean=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const clockMinutes=(s:string):number=>{if(!validClock(s))throw Error('الوقت لازم يكون HH:MM');const [h,m]=s.split(':').map(Number);return 60*h+m;};
export const blocksMinutes=(blocks:StudyBlock[]):number=>(blocks||[]).reduce((a,b)=>a+b.minutes,0);
/** Format accepted by the schedule editor: 09:00-11:00, 13:00-15:00 */
export function parseStudyRanges(input:string):StudyBlock[]{
 if(!input.trim())return [];
 const ranges=input.replace(/[،؛;]/g,',').split(',').map(x=>x.trim()).filter(Boolean);
 const items=ranges.map(range=>{
  const match=/^([0-2]\d:[0-5]\d)\s*[-–—]\s*([0-2]\d:[0-5]\d)$/.exec(range);
  if(!match||!validClock(match[1])||!validClock(match[2]))throw Error('اكتب الجلسات بالشكل 09:00-11:00, 13:00-15:00');
  const start=clockMinutes(match[1]),end=clockMinutes(match[2]);
  if(end<=start)throw Error('لازم وقت نهاية الجلسة يكون بعد بدايتها في نفس اليوم');
  return {start:match[1],minutes:end-start};
 }).sort((a,b)=>clockMinutes(a.start)-clockMinutes(b.start));
 if(items.some((v,i)=>i>0&&clockMinutes(items[i-1].start)+items[i-1].minutes>clockMinutes(v.start)))throw Error('فيه جلستين متداخلتين في نفس اليوم');
 if(blocksMinutes(items)>840)throw Error('الحد الأقصى 14 ساعة مذاكرة في اليوم');
 return items;
}
export function formatStudyRanges(blocks:StudyBlock[]):string{
 return blocks.map(v=>{const e=clockMinutes(v.start)+v.minutes;if(e>1440)throw Error('الجلسة بتعدي منتصف الليل');return `${v.start}-${String(Math.floor(e/60)).padStart(2,'0')}:${String(e%60).padStart(2,'0')}`;}).join(', ');
}
export const vacationBlocks=(hours:4|6|8):StudyBlock[]=>hours===4
 ?[{start:'09:00',minutes:120},{start:'17:00',minutes:120}]
 :hours===6?[{start:'09:00',minutes:120},{start:'13:00',minutes:120},{start:'18:00',minutes:120}]
 :[{start:'08:00',minutes:150},{start:'12:00',minutes:150},{start:'16:00',minutes:120},{start:'20:00',minutes:60}];
