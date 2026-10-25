import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import {PlanConfig,Forecast,parseDay,blocksForDay} from './planner';
import {clockMinutes} from './schedule';
const channel='bankor-learning';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
/** Planned local notifications update when the app opens, finishes a lesson, or saves a schedule. */
export async function syncReminders(c:PlanConfig,fc:Forecast,reviewDates:string[]=[]){
 try{
  if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(channel,{name:'تنبيهات بنكور',importance:Notifications.AndroidImportance.DEFAULT});
  const permissions=await Notifications.getPermissionsAsync();
  if(!permissions.granted){const p=await Notifications.requestPermissionsAsync();if(!p.granted)return false;}
  const scheduled=await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter(n=>String(n.content.data?.kind||'')==='bankor-plan').map(n=>Notifications.cancelScheduledNotificationAsync(n.identifier)));
  const now=Date.now();
  let total=0;
  if(fc.status!=='complete'){
   // Limit future notifications to avoid OS limits (iOS caps pending local notifications).
   for(const d of fc.days.slice(0,14)){
    if(!d.targetMinutes)continue;
    const count=new Set(d.tasks.map(t=>t.id)).size;
    for(const [index,slot] of blocksForDay(d.date,c).entries()){
     if(total>=42)break;
     const date=parseDay(d.date),minutes=clockMinutes(slot.start);
     date.setHours(Math.floor(minutes/60),minutes%60,0,0);
     if(date.getTime()<now+60_000)continue;
     await Notifications.scheduleNotificationAsync({
      content:{title:index===0?'بنكور مستنيك نبدأ!':'بنكور جاهز للجلسة اللي جاية',body:index===0?`خطة النهارده: ${Math.ceil(d.targetMinutes)} دقيقة تقريبًا · ${count} دروس. يلا ننجز!`:`موعد مذاكرتك: ${slot.start} · ${slot.minutes} دقيقة، خطوة كمان ناحية هدفك 💙`,data:{kind:'bankor-plan',day:d.date,slot:index}},
      trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date,channelId:channel}
     });total++;
    }
   }
  }
  // Add one catch-up reminder per day when the forecast is short on study time.
  if(fc.status==='at-risk'){
   let added=0;
   for(const d of fc.days.slice(0,10)){
    if(added>=8||total>=50)break;
    const due=parseDay(d.date);due.setHours(c.reminderHour,c.reminderMinute,0,0);
    if(due.getTime()<now+60000)continue;
    await Notifications.scheduleNotificationAsync({
     content:{title:'بنكور عايز نرجع للخطة',body:`محتاجين وقت مذاكرة إضافي قبل موعد إنهاء المادة. عجز متوقع ${Math.ceil(fc.shortfall)} دقيقة — افتح الجدول وعدّل جلساتك.`,data:{kind:'bankor-plan',type:'catchup'}},
     trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:due,channelId:channel}
    });added++;total++;
   }
  }
  // Reminders for upcoming spaced-repetition cards. Schedule only known due dates.
  for(const day of reviewDates.slice(0,7)){
   if(total>=57)break;
   const due=parseDay(day);due.setHours(c.reminderHour,c.reminderMinute,0,0);
   if(due.getTime()<now+60_000)continue;
   await Notifications.scheduleNotificationAsync({
    content:{title:'بنكور جهزلك مراجعة ذكية 🧠',body:'فيه أسئلة مستحقة للمراجعة. 5 دقائق يوميًا تساعدك تثبّت المعلومات.',data:{kind:'bankor-plan',type:'spaced-review',day}},
    trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:due,channelId:channel}
   });total++;
  }
  // The exam date is separate from the desired study-completion date.
  if(c.examDate){
   const exam=parseDay(c.examDate),[hh,mm]=(c.examTime||'14:00').split(':').map(Number);
   exam.setHours(hh,mm,0,0);
   const evening=new Date(exam);evening.setDate(evening.getDate()-1);evening.setHours(19,0,0,0);
   if(total<58&&evening.getTime()>now+60000)await Notifications.scheduleNotificationAsync({content:{title:'بنكور بيفكّرك بالامتحان',body:'بكرة يوم الامتحان! جهّز المطلوب وخلّي الليلة للمراجعة الهادية والنوم الكويس.',data:{kind:'bankor-plan',type:'exam'}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:evening,channelId:channel}});
  }
  return true;
 }catch(e){console.warn('Could not schedule Bankor notifications',e);return false;}
}

/** Stop Bankor reminders without affecting notifications from other apps/features. */
export async function cancelBankorReminders():Promise<boolean>{
 try{const scheduled=await Notifications.getAllScheduledNotificationsAsync();await Promise.all(scheduled.filter(n=>n.content.data?.kind==='bankor-plan').map(n=>Notifications.cancelScheduledNotificationAsync(n.identifier)));return true;}catch(error){console.warn('Could not cancel Bankor reminders',error);return false;}
}
