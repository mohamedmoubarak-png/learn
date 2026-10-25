import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Alert,AppState,Image,Modal,Platform,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StatusBar} from 'expo-status-bar';
import {Lesson,PlanConfig,StudyState,localDay,parseDay,daysInclusive,freshState,forecast,readingEstimate,finishLesson,grantRewards,streak,blocksForDay} from './src/planner';
import {parseStudyRanges,formatStudyRanges,vacationBlocks,validClock} from './src/schedule';
import {Question,QuizMode,QuizProgress,QuizAttempt,emptyQuizProgress,drawExam,drawPractice,drawLessonPractice,awardLessonMastery,gradeQuiz,recordAttempt} from './src/quiz';
import {syncReminders,cancelBankorReminders} from './src/notifications';
import {makeQuizSnapshot,restoreQuizSnapshot,quizRemainingSeconds,unansweredCount} from './src/quizSession';
import {syncLauncherIcon} from './src/launcherIcon';
import {activitySummary} from './src/activity';
import WelcomeFlow from './src/WelcomeFlow';
import {buildJourney,splitLessonSteps,challengePassed,awardMilestone,JourneyStage} from './src/journey';
import {dueReviewIds,reviewSummary,nextReviewDates} from './src/review';
import rawLessons from './data/lessons.json';
import rawQuestions from './data/questions.json';
import rawMeta from './data/meta.json';

const LESSONS=rawLessons as Lesson[];
const QUESTIONS=(rawQuestions as {questions:Question[]}).questions;
const META=rawMeta as {blueprint:Record<'m'|'t',Record<string,number>>;topics:Record<string,{name:string;g:string}>};
const C={navy:'#102A5C',blue:'#2763DE',pale:'#EAF1FF',gold:'#F4B942',green:'#20A578',ink:'#1C2E4D',muted:'#718098',bg:'#F5F8FC',border:'#DDE7F4',white:'#FFFFFF',red:'#C94A52'};
const ASSETS={party:require('./assets/party.png'),happy:require('./assets/happy.png'),worried:require('./assets/worried.png'),sad:require('./assets/sad.png'),study:require('./assets/study.png'),encourage:require('./assets/encourage.png')};
type Page='home'|'library'|'plan'|'rewards'|'read'|'practice'|'quiz'|'result';
type Session={mode:QuizMode;questions:Question[];start:number;topic?:string;lessonId?:string};
const daysOfWeek=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const fmt=(d:string)=>{const [y,m,day]=d.split('-');return `${day}/${m}/${y}`};
const minText=(n:number)=>`${Math.ceil(n)} دقيقة`;
const unique=<T,>(xs:T[]):T[]=>Array.from(new Set(xs));
function inDays(offset:number){const d=new Date();d.setDate(d.getDate()+offset);return localDay(d)}
function defaultConfig():PlanConfig{
 const sourceDate='2026-10-30';const exam=sourceDate>=localDay(new Date())?sourceDate:inDays(14);
 const end=parseDay(exam);end.setDate(end.getDate()-1);
 return {examDate:exam,examTime:'14:00',deadline:localDay(end),weekdayMinutes:120,weekendMinutes:240,
 weekdayBlocks:[{start:'19:00',minutes:120}],weekendBlocks:[{start:'09:00',minutes:120},{start:'18:00',minutes:120}],
 daysOff:[],dayOverrides:{},reminderHour:19,reminderMinute:0,wpm:75};
}
const DEFAULT=defaultConfig();
function Bar({value,color=C.green}:{value:number;color?:string}){return <View style={styles.track}><View style={[styles.fill,{width:`${Math.min(100,Math.max(0,value*100))}%`,backgroundColor:color}]}/></View>}
function Btn({text,onPress,secondary=false,disabled=false}:{text:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}){return <TouchableOpacity activeOpacity={.82} onPress={onPress} disabled={disabled} style={[styles.button,secondary&&styles.buttonSecondary,disabled&&{opacity:.45}]}><Text style={[styles.buttonText,secondary&&{color:C.navy}]}>{text}</Text></TouchableOpacity>}
function Field({label,value,onChange,placeholder,keyboardType='default'}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;keyboardType?:'default'|'number-pad'}){return <View style={{gap:5,marginBottom:7}}><Text style={styles.fieldTitle}>{label}</Text><TextInput style={styles.field} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#A5B1C0" keyboardType={keyboardType} textAlign="right" autoCorrect={false}/></View>}
function Mascot({mood,size=106}:{mood:keyof typeof ASSETS;size?:number}){return <Image style={{width:size,height:size,borderRadius:Math.round(size*.19)}} resizeMode="cover" source={ASSETS[mood]}/>}
function Card({children,style}:{children:React.ReactNode;style?:object}){return <View style={[styles.card,style]}>{children}</View>}
function LessonRow({lesson,complete,onPress}:{lesson:Lesson;complete:boolean;onPress:()=>void}){return <TouchableOpacity onPress={onPress} style={styles.lessonRow}><View style={[styles.lessonCircle,complete&&{backgroundColor:'#DCF7EA'}]}><Text style={{fontSize:22}}>{complete?'✓':'📖'}</Text></View><View style={{flex:1}}><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.caption}>{lesson.topicTitle}{complete?' · خلصته':''}</Text></View><Text style={{fontSize:23,color:C.blue}}>‹</Text></TouchableOpacity>}
function buildDefaultForm(c:PlanConfig){return {examDate:c.examDate||'',examTime:c.examTime||'14:00',deadline:c.deadline,
 weekday:formatStudyRanges(c.weekdayBlocks||[{start:c.weekdayStart||'19:00',minutes:c.weekdayMinutes}]),
 weekend:formatStudyRanges(c.weekendBlocks||[{start:c.weekendStart||'10:00',minutes:c.weekendMinutes}]),
 wpm:String(c.wpm),reminder:String(c.reminderHour).padStart(2,'0')+':'+String(c.reminderMinute).padStart(2,'0')};}
export default function App(){
 const [ready,setReady]=useState(false),[page,setPage]=useState<Page>('home'),[now,setNow]=useState(Date.now());
 const [showWelcome,setShowWelcome]=useState(false);
 const [cfg,setCfg]=useState<PlanConfig>(DEFAULT),[state,setState]=useState<StudyState>(freshState()),[quizProgress,setQuizProgress]=useState<QuizProgress>(emptyQuizProgress());
 const [notificationsOn,setNotificationsOn]=useState(false),[selectedLesson,setSelectedLesson]=useState<string|null>(null),[expandedTopic,setExpandedTopic]=useState<string|null>(null);
 const [draft,setDraft]=useState<PlanConfig>(DEFAULT),[form,setForm]=useState(buildDefaultForm(DEFAULT));
 const [customDay,setCustomDay]=useState(inDays(0)),[customBlocks,setCustomBlocks]=useState('09:00-11:00, 13:00-15:00, 19:00-21:00');
 const [practiceTopic,setPracticeTopic]=useState<string>('all');
 const [selectedJourneyTopic,setSelectedJourneyTopic]=useState<string|null>(null),[guidedReading,setGuidedReading]=useState(true),[readingStep,setReadingStep]=useState(0);
 const [challengeBonus,setChallengeBonus]=useState(0);
 const [celebration,setCelebration]=useState<{title:string;message:string;xp:number;lessonId?:string;topic?:string}|null>(null);
 const [session,setSession]=useState<Session|null>(null),[answers,setAnswers]=useState<Record<string,number>>({}),[qIndex,setQIndex]=useState(0),[result,setResult]=useState<QuizAttempt|null>(null),[review,setReview]=useState<Question[]>([]);
 const forecastNow=useMemo(()=>forecast(LESSONS,state,cfg,new Date(now)),[cfg,state,now]);
 const journey=useMemo(()=>buildJourney(LESSONS,QUESTIONS,state,quizProgress),[state.done,quizProgress.milestoneCleared]);
 const currentUnit=journey.find(u=>u.topic===selectedJourneyTopic)||journey.find(u=>u.done<u.total)||journey[journey.length-1];
 const today=localDay(new Date(now)),daily=forecastNow.days.find(d=>d.date===today);
 const activity=useMemo(()=>activitySummary(state,quizProgress.attempts,new Date(now)),[state.done,quizProgress.attempts,today]);
 const reviewStats=useMemo(()=>reviewSummary(quizProgress.reviewCards||{},quizProgress.wrongIds||[],today),[quizProgress,today]);
 const reviewDates=useMemo(()=>nextReviewDates(quizProgress.reviewCards||{},today),[quizProgress,today]);
 const lesson=selectedLesson?LESSONS.find(l=>l.id===selectedLesson):undefined;
 const reading=lesson?state.reading[lesson.id]||{seconds:0,maxScroll:0}:null;
 const finalizedQuiz=useRef<number|null>(null);
 const cache=useRef({state,cfg,quizProgress,session,answers,qIndex,page});cache.current={state,cfg,quizProgress,session,answers,qIndex,page};
 const topTopics=unique(QUESTIONS.map(q=>q.topic));
 const expandedLessons=expandedTopic?LESSONS.filter(l=>l.topic===expandedTopic):[];
 const quizSecs=session?.mode==='exam'?quizRemainingSeconds(session.start,now):0;
 useEffect(()=>{(async()=>{try{const [s,c,q,n,onboarded,activeQuiz]=await Promise.all([
  AsyncStorage.getItem('bankor:study'),AsyncStorage.getItem('bankor:config'),AsyncStorage.getItem('bankor:quiz'),AsyncStorage.getItem('bankor:notifications'),AsyncStorage.getItem('bankor:onboarded'),AsyncStorage.getItem('bankor:activeQuiz')]);
  if(s){const v=JSON.parse(s);setState({...freshState(),...v,dailyGoals:v.dailyGoals||{}})}
  if(c){const v={...DEFAULT,...JSON.parse(c)} as PlanConfig;setCfg(v);setDraft(v);setForm(buildDefaultForm(v));}
  if(q){const v=JSON.parse(q);setQuizProgress({...emptyQuizProgress(),...v})}
  setNotificationsOn(n==='yes');
  if(activeQuiz){try{const resumed=restoreQuizSnapshot(JSON.parse(activeQuiz),QUESTIONS);if(resumed){setSession(resumed.session);setAnswers(resumed.answers);setQIndex(resumed.index);setPage('quiz');}else await AsyncStorage.removeItem('bankor:activeQuiz')}catch{await AsyncStorage.removeItem('bankor:activeQuiz')}}
  // Existing installations that already configured a plan go directly to their saved progress.
  setShowWelcome(onboarded!=='yes' && !c && !s);
 }catch(e){console.warn('Could not restore Bankor data',e)}finally{setReady(true)}})()},[]);
 useEffect(()=>{if(!ready||showWelcome)return;const h=setTimeout(()=>AsyncStorage.setItem('bankor:study',JSON.stringify(state)).catch(console.warn),250);return()=>clearTimeout(h)},[ready,state,showWelcome]);
 useEffect(()=>{if(!ready||showWelcome)return;AsyncStorage.setItem('bankor:config',JSON.stringify(cfg)).catch(console.warn)},[ready,cfg,showWelcome]);
 useEffect(()=>{if(!ready||showWelcome)return;AsyncStorage.setItem('bankor:quiz',JSON.stringify(quizProgress)).catch(console.warn)},[ready,quizProgress,showWelcome]);
 useEffect(()=>{if(!ready||showWelcome||page!=='quiz'||!session)return;const snapshot=makeQuizSnapshot(session,answers,qIndex);const h=setTimeout(()=>AsyncStorage.setItem('bankor:activeQuiz',JSON.stringify(snapshot)).catch(console.warn),150);return()=>clearTimeout(h)},[ready,showWelcome,page,session,answers,qIndex]);
 useEffect(()=>{const h=setInterval(()=>setNow(Date.now()),session?.mode==='exam'?1000:60_000);const event=AppState.addEventListener('change',s=>{if(s==='active')setNow(Date.now());if(s==='inactive'||s==='background'){
  const snapshot=cache.current;const values:[string,string][]=[['bankor:study',JSON.stringify(snapshot.state)],['bankor:config',JSON.stringify(snapshot.cfg)],['bankor:quiz',JSON.stringify(snapshot.quizProgress)]];
  if(snapshot.page==='quiz'&&snapshot.session)values.push(['bankor:activeQuiz',JSON.stringify(makeQuizSnapshot(snapshot.session,snapshot.answers,snapshot.qIndex))]);
  AsyncStorage.multiSet(values).catch(console.warn);
 }});return()=>{clearInterval(h);event.remove()}},[session?.mode]);
 useEffect(()=>{if(!ready)return;if(state.heartDay===today)return;setState(s=>({...s,hearts:5,heartDay:today}));},[ready,today,state.heartDay]);
 useEffect(()=>{if(!ready||!daily||forecastNow.status==='complete'||state.dailyGoals[today]!==undefined)return;setState(s=>({...s,dailyGoals:{...s.dailyGoals,[today]:daily.targetMinutes}}))},[ready,today,daily?.targetMinutes,forecastNow.status,state.dailyGoals]);
 useEffect(()=>{if(ready)syncLauncherIcon(forecastNow.mood).catch(console.warn)},[ready,forecastNow.mood]);
 useEffect(()=>{if(!ready||!notificationsOn)return;const h=setTimeout(()=>syncReminders(cfg,forecastNow,reviewDates),1400);return()=>clearTimeout(h)},[ready,notificationsOn,cfg,forecastNow.remainingMinutes,forecastNow.finished,today,reviewDates.join(',')]);
 useEffect(()=>{if(!ready||page!=='read'||!selectedLesson)return;let active=AppState.currentState==='active';const s=AppState.addEventListener('change',x=>active=x==='active');const i=setInterval(()=>{if(!active)return;setState(prev=>{if(prev.done[selectedLesson])return prev;const r=prev.reading[selectedLesson]||{seconds:0,maxScroll:0};return {...prev,reading:{...prev.reading,[selectedLesson]:{...r,seconds:r.seconds+5}}}})},5000);return()=>{clearInterval(i);s.remove()}},[ready,page,selectedLesson]);
 useEffect(()=>{if(page==='quiz'&&session?.mode==='exam'&&quizSecs<=0){finishQuiz()}},[page,session?.mode,quizSecs]);
 function openPlan(){setDraft({...cfg,dayOverrides:{...cfg.dayOverrides},daysOff:[...cfg.daysOff]});setForm(buildDefaultForm(cfg));setPage('plan')}
 function savePlan(){try{
  parseDay(form.examDate);parseDay(form.deadline);
  if(form.deadline>form.examDate)throw Error('موعد إنهاء المادة لازم يكون قبل الامتحان أو في نفس اليوم');
  if(!validClock(form.examTime)||!validClock(form.reminder))throw Error('مواعيد الامتحان والإشعارات لازم تكون HH:MM');
  const weekdayBlocks=parseStudyRanges(form.weekday),weekendBlocks=parseStudyRanges(form.weekend);
  const wpm=Number(form.wpm);if(!Number.isFinite(wpm)||wpm<25||wpm>220)throw Error('سرعة القراءة لازم تكون من 25 لـ220 كلمة/دقيقة');
  const [reminderHour,reminderMinute]=form.reminder.split(':').map(Number);
  setCfg({...draft,examDate:form.examDate,examTime:form.examTime,deadline:form.deadline,weekdayBlocks,weekendBlocks,
   weekdayMinutes:weekdayBlocks.reduce((n,b)=>n+b.minutes,0),weekendMinutes:weekendBlocks.reduce((n,b)=>n+b.minutes,0),wpm,reminderHour,reminderMinute});
  setPage('home');setNow(Date.now());Alert.alert('تم حفظ الخطة','بنكور أعاد حساب رحلة المذاكرة حسب مواعيدك الجديدة.');
 }catch(e){Alert.alert('راجع البيانات',e instanceof Error?e.message:'تأكد من التاريخ ومواعيد الجلسات')}}
 function customSchedule(){try{parseDay(customDay);const b=parseStudyRanges(customBlocks);setDraft(c=>({...c,dayOverrides:{...(c.dayOverrides||{}),[customDay]:b}}));Alert.alert('اتسجل التعديل','اضغط «احفظ الخطة» لتفعيل مواعيد اليوم ده.')}catch(e){Alert.alert('راجع الجدول',e instanceof Error?e.message:'مواعيد غير صحيحة')}}
 function vacationPreset(hours:4|6|8){const overrides={...draft.dayOverrides};for(let i=0;i<7;i++)overrides[inDays(i)]=vacationBlocks(hours);setDraft(c=>({...c,dayOverrides:overrides}));Alert.alert('أسبوع إجازة','اتضاف جدول الإجازة للأيام السبعة الجاية. احفظ الخطة لتفعيله.');}
 function changeDay(d:string){setCustomDay(d);setCustomBlocks(formatStudyRanges(blocksForDay(d,draft)))}
 function openLesson(id:string){setReadingStep(0);setGuidedReading(true);setSelectedLesson(id);setPage('read')}
 function advanceReading(count:number){if(!lesson)return;setReadingStep(x=>Math.min(count-1,x+1));
  setState(s=>{const r=s.reading[lesson.id]||{seconds:0,maxScroll:0};const reached=Math.min(1,(readingStep+1)/count);return reached<=r.maxScroll?s:{...s,reading:{...s.reading,[lesson.id]:{...r,maxScroll:reached}}}})}
 function openJourneyStage(stage:JourneyStage){if(stage.kind==='lesson'&&stage.lessonId){openLesson(stage.lessonId);return}
  if(stage.kind==='checkpoint'){if(stage.status==='locked')Alert.alert('لسه شوية!','خلص دروس الوحدة الأول علشان تفتح تحدي إتقانها. تقدر تدخل المكتبة في أي وقت.');else startQuiz('challenge',stage.topic)}}
 function completeLesson(){if(!lesson)return;const current={...state,dailyGoals:{...state.dailyGoals,[today]:state.dailyGoals[today]??daily?.targetMinutes??0}};
  const {state:next,xpGained}=finishLesson(current,lesson.id);const f=forecast(LESSONS,next,cfg);
  const reward=grantRewards(next,LESSONS,cfg,f);
  setState(reward.state);setSelectedLesson(null);setPage('home');setNow(Date.now());
  setCelebration({title:reward.state.completedReward&&reward.xpGained>=250?'بطل الماتريال!':'برافو يا بطل!',message:reward.messages.join(' • ')||'كل درس يقرّبك من هدفك. بنكور فخور بيك!',xp:xpGained+reward.xpGained,lessonId:lesson.questions?.length?lesson.id:undefined,topic:lesson.topic});
 }
 function startQuiz(mode:QuizMode,topic?:string,lessonId?:string){let list:Question[]=[];
  try{list=mode==='lesson'?drawLessonPractice(QUESTIONS,LESSONS.find(l=>l.id===lessonId)?.questions||[]):mode==='exam'?drawExam(QUESTIONS,META.blueprint):mode==='review'?drawPractice(QUESTIONS,20,undefined,dueReviewIds(quizProgress.reviewCards||{},quizProgress.wrongIds||[],localDay(new Date()))):drawPractice(QUESTIONS,mode==='challenge'?5:mode==='quick'?10:20,topic)}catch(e){Alert.alert('تعذر فتح الامتحان',String(e));return}
  if(!list.length){Alert.alert('مفيش أسئلة متاحة',mode==='lesson'?'الدرس ده مش مرتبط بأسئلة مباشرة في بنك الأسئلة، لكن تقدر تراجع الموضوع بالكامل.':'لسه مفيش مراجعات مستحقة حاليًا. حل تدريب جديد أو ارجع وقت موعد المراجعة.');return}
  finalizedQuiz.current=null;setSession({mode,questions:list,start:Date.now(),topic,lessonId});setAnswers({});setQIndex(0);setChallengeBonus(0);setPage('quiz');setNow(Date.now());
 }
 function finishQuiz(){if(!session||finalizedQuiz.current===session.start)return;finalizedQuiz.current=session.start;const previous=session;
  AsyncStorage.removeItem('bankor:activeQuiz').catch(console.warn);
  const recorded=recordAttempt(quizProgress,session.questions,answers,session.mode,Math.floor((Date.now()-session.start)/1000),new Date(),`bankor-quiz-${session.start}`);
  const wrong=new Set(recorded.progress.wrongIds);
  const passed=challengePassed(recorded.attempt.correct,recorded.attempt.total);
  const milestone=previous.mode==='challenge'&&previous.topic?awardMilestone(recorded.progress,previous.topic,passed):{progress:recorded.progress,xp:0};
  const mastery=previous.mode==='lesson'&&previous.lessonId?awardLessonMastery(milestone.progress,previous.lessonId,passed):{progress:milestone.progress,xp:0};
  setQuizProgress(mastery.progress);setChallengeBonus(milestone.xp+mastery.xp);
  setState(s=>({...s,xp:s.xp+recorded.xp+milestone.xp+mastery.xp}));
  setResult(recorded.attempt);setReview(previous.questions.filter(q=>wrong.has(q.id)));
  setSession(null);setPage('result');
 }
 async function finishWelcome(){
  try{await AsyncStorage.setItem('bankor:onboarded','yes')}catch(e){console.warn('Failed to store onboarding state',e)}
  setShowWelcome(false);openPlan();
 }
 async function enableNotifications(){const value=await syncReminders(cfg,forecastNow,reviewDates);if(value){setNotificationsOn(true);await AsyncStorage.setItem('bankor:notifications','yes');Alert.alert('تم التفعيل','بنكور هيذكرك وقت جلسات المذاكرة اللي اخترتها.')}else Alert.alert('التنبيهات','اسمح بالإشعارات من إعدادات جهازك وأعد المحاولة')}
 async function disableNotifications(){await cancelBankorReminders();setNotificationsOn(false);await AsyncStorage.setItem('bankor:notifications','no');Alert.alert('تم إيقاف التذكيرات','بنكور مش هيبعت تذكيرات جديدة إلا لما تفعّلها تاني.')}
 function submitQuiz(){if(!session)return;const missing=unansweredCount(session.questions,answers);if(session.mode==='exam'&&missing>0&&quizSecs>0){Alert.alert('فيه أسئلة متسابّة',`لسه ${missing} سؤال من غير إجابة. تحب ترجع تكمل ولا تسلّم الاختبار؟`,[{text:'أكمل حل',style:'cancel'},{text:'تسليم وتصحيح',onPress:finishQuiz}]);return;}finishQuiz();}
 const header=<View style={styles.header}><Text style={styles.brand}>BANKOR <Text style={{color:C.gold}}>✦</Text></Text><Text style={styles.headerRight}>أكاديمية المصرفي G3</Text></View>;
 const tabs: {key:Page;icon:string;label:string}[]=[{key:'home',icon:'⌂',label:'مساري'},{key:'library',icon:'▤',label:'المكتبة'},{key:'practice',icon:'✎',label:'اختبرني'},{key:'plan',icon:'▦',label:'خطتي'},{key:'rewards',icon:'★',label:'إنجازاتي'}];
 if(!ready)return <SafeAreaView style={styles.root}><Text style={styles.loading}>بنكور بيرتب أوراق المذاكرة...</Text></SafeAreaView>;
 if(showWelcome)return <WelcomeFlow onFinish={finishWelcome}/>;
 if(page==='read'&&lesson){const est=readingEstimate(lesson,cfg),percent=reading?Math.min(reading.maxScroll,reading.seconds/(est*60)):0;
 const steps=splitLessonSteps(lesson.reading,900),step=Math.min(steps.length-1,readingStep);
 return <SafeAreaView style={styles.root}><StatusBar style="light"/>{header}<TouchableOpacity style={styles.backRow} onPress={()=>{setSelectedLesson(null);setPage('home')}}><Text style={styles.backText}>رجوع للمسار  ‹</Text></TouchableOpacity>
  <ScrollView key={guidedReading?'step-'+step:'full'} style={{flex:1}} scrollEventThrottle={400} contentContainerStyle={{padding:15,paddingBottom:40}}
   onScroll={e=>{if(guidedReading)return;const {contentOffset,contentSize,layoutMeasurement}=e.nativeEvent;const height=contentSize.height-layoutMeasurement.height;const fraction=height>0?Math.min(1,Math.max(0,contentOffset.y/height)):1;
    if(!lesson||fraction<=(reading?.maxScroll||0)+.03&&fraction<.97)return;
    setState(s=>{const r=s.reading[lesson.id]||{seconds:0,maxScroll:0};if(fraction<=r.maxScroll)return s;return {...s,reading:{...s.reading,[lesson.id]:{...r,maxScroll:fraction}}}})}}>
   <Card style={{alignItems:'center'}}><Mascot mood="study" size={104}/><Text style={styles.title}>{lesson.title}</Text><Text style={styles.caption}>{lesson.topicTitle} · {minText(est)} متوقعة</Text><Bar value={percent}/><Text style={styles.caption}>تقدم القراءة {Math.round(percent*100)}% · الوقت الفعلي {Math.floor((reading?.seconds||0)/60)} دقيقة</Text></Card>
   <View style={{flexDirection:'row',gap:8,marginBottom:13}}><TouchableOpacity style={[styles.readerToggle,guidedReading&&styles.readerSelected]} onPress={()=>setGuidedReading(true)}><Text style={[styles.readerToggleText,guidedReading&&{color:'white'}]}>✦ خطوات بنكور</Text></TouchableOpacity><TouchableOpacity style={[styles.readerToggle,!guidedReading&&styles.readerSelected]} onPress={()=>setGuidedReading(false)}><Text style={[styles.readerToggleText,!guidedReading&&{color:'white'}]}>📖 المادة كاملة</Text></TouchableOpacity></View>
   {guidedReading?<>
    <Card><View style={styles.inline}><Text style={styles.heading}>خطوة {step+1} من {steps.length}</Text><Text style={styles.blueStrong}>{Math.round((step+1)/steps.length*100)}%</Text></View><Bar value={(step+1)/steps.length} color={C.gold}/><Text style={styles.material} selectable>{steps[step]}</Text></Card>
    <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Btn secondary text="السابقة" disabled={step===0} onPress={()=>setReadingStep(x=>Math.max(0,x-1))}/></View><View style={{flex:2}}>{step<steps.length-1?<Btn text="فهمت · الخطوة التالية ←" onPress={()=>advanceReading(steps.length)}/>:<Btn text="راجعت آخر خطوة ✓" onPress={()=>setState(s=>{const r=s.reading[lesson.id]||{seconds:0,maxScroll:0};return {...s,reading:{...s.reading,[lesson.id]:{...r,maxScroll:1}}}})}/>}</View></View>
   </>:<Card><Text style={styles.material} selectable>{lesson.reading}</Text></Card>}
   <Card><Text style={styles.title}>خلصت قراءة الدرس؟</Text><Text style={styles.body}>اقرأ جميع الأجزاء وقضِ وقتًا فعليًا في المذاكرة؛ بنكور مش بيحسب مجرد فتح الصفحة إنجازًا.</Text>
    <Btn text={state.done[lesson.id]?'تم إنجاز الدرس ✓':'أنهيت الدرس · +15 XP'} disabled={!!state.done[lesson.id]||percent<.87||(reading?.seconds||0)<30} onPress={completeLesson}/>
    <Btn secondary text="قرأت الدرس سابقًا خارج التطبيق" disabled={!!state.done[lesson.id]} onPress={()=>Alert.alert('تأكيد','هل بالفعل قرأت الدرس كاملًا؟',[{text:'إلغاء',style:'cancel'},{text:'نعم، سجل الإتمام',onPress:completeLesson}])}/>
    {lesson.questions?.length>0&&<Btn text={quizProgress.lessonMastered?.includes(lesson.id)?'تحدي الدرس ✓':'تحدي الدرس · حتى 5 أسئلة'} secondary onPress={()=>startQuiz('lesson',lesson.topic,lesson.id)}/>}<Btn secondary text="تدريب على نفس الموضوع" onPress={()=>startQuiz('topic',lesson.topic)}/>
   </Card>
  </ScrollView></SafeAreaView>;
 }
 if(page==='quiz'&&session){const q=session.questions[qIndex],chosen=answers[q.id],locked=chosen!==undefined,exam=session.mode==='exam';return <SafeAreaView style={styles.root}><StatusBar style="light"/>{header}
  <ScrollView contentContainerStyle={{padding:16,paddingBottom:42}}>
   <View style={styles.quizTop}><TouchableOpacity onPress={()=>Alert.alert('إغلاق الاختبار','تقدم الاختبار الجاري لن يُحفظ قبل التصحيح.',[{text:'إلغاء',style:'cancel'},{text:'خروج',style:'destructive',onPress:()=>{AsyncStorage.removeItem('bankor:activeQuiz').catch(console.warn);setPage('practice');setSession(null)}}])}><Text style={styles.backText}>✕ خروج</Text></TouchableOpacity>
    <Text style={styles.heading}>سؤال {qIndex+1} من {session.questions.length}</Text>{exam&&<Text style={styles.timer}>{Math.floor(quizSecs/60)}:{String(quizSecs%60).padStart(2,'0')}</Text>}
   </View><Bar value={(qIndex+1)/session.questions.length} color={C.gold}/>
   {exam&&<View style={{gap:7,marginVertical:8}}><Text style={styles.caption}>جاوبت على {session.questions.length-unansweredCount(session.questions,answers)} من {session.questions.length} · المتبقي {unansweredCount(session.questions,answers)}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingVertical:4}}>{session.questions.map((item,i)=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`انتقل للسؤال ${i+1}`} onPress={()=>setQIndex(i)} style={[styles.questionJump,{backgroundColor:qIndex===i?C.blue:answers[item.id]!==undefined?'#D9F6E7':C.pale}]}><Text style={{fontWeight:'900',color:qIndex===i?'white':C.navy}}>{i+1}</Text></TouchableOpacity>)}</ScrollView></View>}
   <Card><View style={{alignItems:'center'}}><Mascot mood={locked&&!exam?(chosen===q.a?'party':'encourage'):'study'} size={105}/></View><Text style={styles.question}>{q.q}</Text>
    {q.o.map((option,i)=>{const revealed=locked&&!exam;const background=revealed&&i===q.a?'#E1F8EC':revealed&&chosen===i&&i!==q.a?'#FFE9E9':chosen===i?'#EBF2FF':'white';return <TouchableOpacity key={i} disabled={locked&&!exam} onPress={()=>{setAnswers(a=>({...a,[q.id]:i}));if(!exam&&i!==q.a)setState(s=>({...s,hearts:Math.max(0,(s.hearts??5)-1)}));}} style={[styles.answer,{backgroundColor:background,borderColor:chosen===i?C.blue:C.border}]}><Text style={styles.answerText}>{option}</Text><View style={styles.answerBadge}><Text style={styles.answerLetter}>{['أ','ب','ج','د','هـ','و'][i]||String(i+1)}</Text></View></TouchableOpacity>})}
    {locked&&!exam&&<View style={[styles.explain,{backgroundColor:chosen===q.a?'#EBF9F3':'#FFF2ED'}]}><Text style={styles.heading}>{chosen===q.a?'إجابة ممتازة!':'لسه بنتعلم، تعال نفهم السبب'}</Text><Text style={styles.body}>{q.why||'راجع شرح المادة العلمية الخاصة بالموضوع.'}</Text>{chosen!==q.a&&q.ow?.[chosen]&&<Text style={styles.caption}>سبب استبعاد اختيارك: {q.ow[chosen]}</Text>}</View>}
    <Btn text={qIndex===session.questions.length-1?'إنهاء وتصحيح الاختبار':'السؤال التالي ←'} disabled={!exam&&!locked} onPress={()=>{if(qIndex===session.questions.length-1)submitQuiz();else setQIndex(i=>i+1)}}/>
    {exam&&<><Btn secondary text="السؤال السابق" disabled={qIndex===0} onPress={()=>setQIndex(i=>i-1)}/><Btn secondary text="تسليم الامتحان الآن" onPress={submitQuiz}/></>}
   </Card>
   {exam&&<Text style={styles.caption}>في المحاكاة الإجابات مش بتظهر إلا بعد التسليم، وتقدر تسيب سؤال وترجعله.</Text>}
  </ScrollView></SafeAreaView>}
 if(page==='result'&&result){return <SafeAreaView style={styles.root}><StatusBar style="light"/>{header}<ScrollView contentContainerStyle={{padding:16,paddingBottom:45}}>
   <Card style={{alignItems:'center',gap:12}}><Mascot mood={result.score>=70?'party':'encourage'} size={165}/><Text style={styles.title}>{result.mode==='challenge'||result.mode==='lesson'?(result.score>=80?'🏆 أتقنت التحدي!':'راجع الشرح وجرب تاني'):result.score>=70?'بنكور فخور بيك!':'كل تجربة بتخليك أقوى'}</Text><Text style={styles.bigNumber}>{result.score}%</Text><Text style={styles.body}>صح {result.correct} من {result.total} سؤال</Text><Bar value={result.score/100}/><Text style={styles.caption}>{result.mode==='challenge'||result.mode==='lesson'?'تحدي الإتقان: اجتياز من 80%':result.mode==='exam'?'نتيجة المحاكاة (اجتياز افتراضي ≥70%)':'نتيجة التدريب'}</Text>{challengeBonus>0&&<Text style={styles.blueStrong}>✨ مكافأة إتقان جديدة +{challengeBonus} XP</Text>}</Card>
   {review.length>0&&<Card><Text style={styles.heading}>راجع الأسئلة دي</Text>{review.slice(0,25).map(q=><View key={q.id} style={styles.reviewItem}><Text style={styles.lessonTitle}>{q.q}</Text><Text style={styles.caption}>الصحيح: {q.o[q.a]}</Text><Text style={styles.body}>{q.why||''}</Text></View>)}</Card>}
   <Btn text="اختبار جديد" onPress={()=>{setPage('practice');setResult(null)}}/><Btn secondary text="ارجع لمساري" onPress={()=>{setPage('home');setResult(null)}}/>
  </ScrollView></SafeAreaView>}
 return <SafeAreaView style={styles.root}><StatusBar style="light"/>{header}
  <Modal visible={!!celebration} transparent animationType="fade" onRequestClose={()=>setCelebration(null)}>
   <View style={styles.celebrateBackdrop}>
    <View style={styles.celebrateCard}>
     <Text style={styles.celebrateConfetti}>✦ ⭐ ✨ ⭐ ✦</Text>
     <Mascot mood="party" size={177}/>
     <Text style={styles.celebrateTitle}>{celebration?.title}</Text>
     <Text style={styles.celebrateXp}>+{celebration?.xp||0} XP</Text>
     <Text style={styles.celebrateMessage}>{celebration?.message}</Text>
     <View style={{width:'100%',gap:7}}>
      {celebration?.lessonId&&<Btn text="✦ اختبر فهمك" onPress={()=>{const id=celebration.lessonId!,topic=celebration.topic;setCelebration(null);startQuiz('lesson',topic,id)}}/>}
      <Btn secondary text="كمّل رحلتك" onPress={()=>setCelebration(null)}/>
     </View>
    </View>
   </View>
  </Modal>
 <ScrollView contentContainerStyle={{padding:16,paddingBottom:118}} style={{flex:1}}>
 {page==='home'&&<>
  <Card style={styles.hero}><View style={{flex:1,gap:7}}><Text style={styles.heroKicker}>رحلتك مع بنكور</Text><Text style={styles.heroTitle}>{forecastNow.status==='complete'?'خلصت المادة! 🏆':forecastNow.status==='expired'?'لسه نقدر نكمّل':forecastNow.status==='at-risk'?'عايزين نرفع الوتيرة!':'جاهز لمغامرة جديدة؟'}</Text><Text style={styles.heroText}>{forecastNow.status==='complete'?'برافو! دلوقتي دور المراجعة والاختبارات.':forecastNow.status==='at-risk'?'أنا أعدت توزيع الباقي، لكن الوقت الحالي مش كفاية. افتح خطتك ونزود الساعات.':'كل درس تخلصه النهارده هيقربك لهدفك.'}</Text></View><Mascot mood={forecastNow.mood} size={122}/></Card>
  <View style={styles.kpiRow}>{[{icon:'🔥',value:String(activity.streak),label:'أيام'}, {icon:'⭐',value:String(state.xp),label:'XP'}, {icon:'💙',value:String(state.hearts??5),label:'قلوب'}, {icon:'📚',value:`${forecastNow.finished}/${forecastNow.total}`,label:'دروس'}].map(item=><View style={styles.kpi} key={item.label}><Text style={styles.kpiIcon}>{item.icon}</Text><Text style={styles.kpiValue}>{item.value}</Text><Text style={styles.caption}>{item.label}</Text></View>)}</View>
  <Card><View style={styles.inline}><Text style={styles.heading}>رحلة الماتريال</Text><Text style={styles.blueStrong}>{Math.round(forecastNow.progress*100)}%</Text></View><Bar value={forecastNow.progress}/><Text style={styles.caption}>متبقي {minText(forecastNow.remainingMinutes)} · المستهدف {fmt(cfg.deadline)}</Text><Text style={styles.caption}>موعد الامتحان {fmt(cfg.examDate||cfg.deadline)} الساعة {cfg.examTime||'14:00'}</Text>{forecastNow.expectedFinish&&<Text style={styles.body}>الانتهاء المتوقع حسب جدولك: <Text style={{fontWeight:'900'}}>{fmt(forecastNow.expectedFinish)}</Text></Text>}</Card>
  {(()=>{const nextId=(daily?.tasks.find(t=>!state.done[t.id])?.id)||LESSONS.find(l=>!state.done[l.id])?.id;const next=LESSONS.find(l=>l.id===nextId);return next?<Card style={{backgroundColor:'#EDF5FF',borderColor:'#CFE0FC'}}><View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1,gap:5}}><Text style={styles.heroKicker}>✦ مهمتك الجاية</Text><Text style={styles.heading}>{next.title}</Text><Text style={styles.caption}>{next.topicTitle} · {minText(readingEstimate(next,cfg))}</Text></View><Mascot mood="study" size={76}/></View><Btn text="ابدأ الدرس التالي ←" onPress={()=>openLesson(next.id)}/></Card>:null})()}
  {!activity.activeToday&&<Card style={{backgroundColor:'#E9F7FE',borderColor:'#BFDBF3'}}><Text style={styles.heading}>🔥 حافظ على سلسلة بنكور</Text><Text style={styles.body}>درس واحد أو تدريب بأسئلة النهارده يحافظ على استمرارك. لو مشغول، حتى جلسة قصيرة هتفيدك.</Text><Btn text="ابدأ 10 أسئلة سريعة" onPress={()=>startQuiz('quick')}/></Card>}
  {reviewStats.due>0&&<Card style={{backgroundColor:'#FFF8E8',borderColor:'#F9D999'}}><View style={styles.inline}><Text style={styles.heading}>🧠 مراجعات بنكور المستحقة</Text><Text style={styles.blueStrong}>{reviewStats.due} سؤال</Text></View><Text style={styles.body}>حل المراجعات دلوقتي علشان تثبت المعلومات قبل الامتحان.</Text><Btn text="ابدأ مراجعتي الذكية" onPress={()=>startQuiz('review')}/></Card>}
  {forecastNow.status==='at-risk'&&<Card style={{backgroundColor:'#FFF4E9',borderColor:'#FFD3A5'}}><Text style={styles.warn}>الخطة محتاجة وقت زيادة</Text><Text style={styles.body}>العجز التقديري {minText(forecastNow.shortfall)}. محتاج في المتوسط {minText(forecastNow.requiredDaily)} لكل يوم مذاكرة نشط، مقابل {minText(forecastNow.availableDaily)} متاح.</Text><Btn secondary text="زوّد جلسات الإجازة أو عدّل موعدك" onPress={openPlan}/></Card>}
  <View style={styles.inline}><Text style={styles.heading}>🗺️ رحلة التعلم</Text><TouchableOpacity onPress={openPlan}><Text style={styles.blueStrong}>عدّل الجدول</Text></TouchableOpacity></View>
  {daily&&<Text style={styles.caption}>هدف اليوم: {minText(state.dailyGoals[today]??daily.targetMinutes)} · الخطة بتتحدث مع كل درس</Text>}
  {currentUnit&&<Card style={{backgroundColor:'#F3F7FF'}}>
   <View style={styles.inline}><View style={{flex:1,gap:3}}><Text style={styles.heading}>{currentUnit.title}</Text><Text style={styles.caption}>الوحدة {journey.indexOf(currentUnit)+1} من {journey.length} · {currentUnit.done}/{currentUnit.total} درس</Text></View><Text style={styles.blueStrong}>{Math.round(currentUnit.done/currentUnit.total*100)}%</Text></View>
   <Bar value={currentUnit.done/currentUnit.total}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingVertical:9}}>{journey.map((u,i)=><TouchableOpacity key={u.topic} onPress={()=>setSelectedJourneyTopic(u.topic)} style={[styles.unitChip,u.topic===currentUnit.topic&&styles.unitChipActive]}><Text style={[styles.unitChipText,u.topic===currentUnit.topic&&{color:'white'}]}>{u.done===u.total?'✓ ':''}{i+1}. {u.title}</Text></TouchableOpacity>)}</ScrollView>
   <View style={styles.path}>{currentUnit.stages.map((node,i)=><View key={node.id} style={{alignItems:'center',width:'100%'}}>
    {i>0&&<View style={{width:5,height:23,borderRadius:3,backgroundColor:node.status==='done'?C.green:'#C9D8EF'}}/>}
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${node.title} ${node.status==='done'?'مكتمل':node.status==='locked'?'مغلق':'متاح'}`} onPress={()=>openJourneyStage(node)} style={[styles.pathUnit,{alignSelf:i%3===0?'flex-end':i%3===1?'center':'flex-start',opacity:node.status==='locked'?.64:1}]}>
     <View style={[styles.pathNode,{backgroundColor:node.status==='done'?C.green:node.status==='active'?C.blue:'#C7D3E8',borderBottomColor:node.status==='done'?'#138460':node.status==='active'?'#153D9F':'#9AABCA',transform:[{scale:node.status==='active'?1.09:1}]}]}><Text style={{fontSize:27,color:'white'}}>{node.status==='done'?'✓':node.kind==='checkpoint'?'🏆':node.status==='active'?'★':node.status==='locked'?'🔒':'📘'}</Text></View>
     <Text style={styles.pathLabel} numberOfLines={2}>{node.title}</Text><Text style={styles.caption}>{node.subtitle}</Text>
    </TouchableOpacity>
   </View>)}</View>
   {currentUnit.hasChallenge&&currentUnit.done===currentUnit.total&&!currentUnit.cleared&&<Text style={styles.body}>✦ خلصت الدروس! افتح تحدي إتقان الوحدة واكسب 40 XP.</Text>}
   <Text style={styles.caption}>تقدر تفتح أي درس من المكتبة حتى لو لسه مجاش دوره؛ القفل يخص تحدي الإتقان فقط.</Text>
  </Card>}
  <Card><Text style={styles.heading}>🎯 مهامك اليومية</Text>
   {(()=>{const day=localDay(new Date(now));const done=LESSONS.filter(l=>state.done[l.id]&&localDay(new Date(state.done[l.id].at))===day).length;
    const attempted=quizProgress.attempts.filter(a=>localDay(new Date(a.date))===day).reduce((sum,a)=>sum+a.total,0);
    return <><Text style={styles.body}>{done>=1?'✅':'○'} خلّص درس واحد ({Math.min(1,done)}/1)</Text><Text style={styles.body}>{attempted>=10?'✅':'○'} حل 10 أسئلة ({Math.min(10,attempted)}/10)</Text><Text style={styles.body}>{(state.dayRewards[day]||false)?'✅':'○'} حقق هدف المذاكرة اليومي</Text></>})()}
  </Card>
  <Btn text="تدريب سريع · 10 أسئلة" onPress={()=>startQuiz('quick')}/>
 </>}
 {page==='library'&&<><Text style={styles.screenTitle}>📚 المكتبة العلمية</Text><Text style={styles.body}>كل الدروس محفوظة داخل التطبيق. افتح كل موضوع للمذاكرة ومتابعة تقدمك.</Text>
  {unique(LESSONS.map(l=>l.topic)).map(topic=>{const ls=LESSONS.filter(l=>l.topic===topic),count=ls.filter(l=>state.done[l.id]).length;return <Card key={topic}><TouchableOpacity style={styles.inline} onPress={()=>setExpandedTopic(t=>t===topic?null:topic)}><View style={{flex:1,gap:3}}><Text style={styles.heading}>{ls[0].topicTitle}</Text><Text style={styles.caption}>{count} من {ls.length} درس مكتمل</Text></View><Text style={{fontSize:25,color:C.blue}}>{expandedTopic===topic?'−':'+'}</Text></TouchableOpacity><Bar value={count/ls.length}/>{expandedTopic===topic&&ls.map(l=><LessonRow key={l.id} lesson={l} complete={!!state.done[l.id]} onPress={()=>openLesson(l.id)}/>)}</Card>})}</>}
 {page==='practice'&&<><Text style={styles.screenTitle}>✎ اتحدى نفسك</Text><Card style={styles.hero}><View style={{flex:1}}><Text style={styles.heroTitle}>متخليش بنكور يكسبك!</Text><Text style={styles.heroText}>كل سؤال صح جديد = 5 XP. الأسئلة الغلط هترجعلك في المراجعة الذكية.</Text></View><Mascot mood="encourage" size={118}/></Card>
  <Card><Text style={styles.heading}>⚡ تدريب سريع</Text><Text style={styles.body}>10 أسئلة متنوعة مع شرح الإجابة فورًا.</Text><Btn text="ابدأ التدريب" onPress={()=>startQuiz('quick')}/></Card>
  <Card><Text style={styles.heading}>🎯 محاكاة امتحان G3</Text><Text style={styles.body}>50 سؤالًا في 60 دقيقة · 35 فني + 15 إلزامي، حسب توزيع المحاكاة المستورد من الملف.</Text><Btn text="ابدأ المحاكاة (60 دقيقة)" onPress={()=>startQuiz('exam')}/></Card>
  <Card><Text style={styles.heading}>🔁 مراجعتي الذكية</Text><Text style={styles.body}>مستحق اليوم: {reviewStats.due} سؤال · مواعيد لاحقة: {reviewStats.upcoming} سؤال. الإجابات الصحيحة بتتراجع بعد 1 ثم 3 ثم 7 أيام مع الاستمرار.</Text><Btn text={reviewStats.due?'ابدأ مراجعة اليوم':'المراجعة مكتملة لليوم ✓'} secondary disabled={!reviewStats.due} onPress={()=>startQuiz('review')}/></Card>
  <Card><Text style={styles.heading}>📌 تدريب حسب الموضوع</Text><View style={{flexDirection:'row',gap:7,flexWrap:'wrap',justifyContent:'flex-end'}}><TouchableOpacity onPress={()=>setPracticeTopic('all')} style={[styles.topicChip,practiceTopic==='all'&&styles.chipActive]}><Text style={[styles.chipText,practiceTopic==='all'&&{color:'white'}]}>كل الموضوعات</Text></TouchableOpacity>{topTopics.map(topic=><TouchableOpacity key={topic} onPress={()=>setPracticeTopic(topic)} style={[styles.topicChip,practiceTopic===topic&&styles.chipActive]}><Text style={[styles.chipText,practiceTopic===topic&&{color:'white'}]}>{META.topics?.[topic]?.name||topic}</Text></TouchableOpacity>)}</View><Btn text={`ابدأ اختبار ${practiceTopic==='all'?'شامل':META.topics?.[practiceTopic]?.name||practiceTopic}`} onPress={()=>startQuiz('topic',practiceTopic==='all'?undefined:practiceTopic)}/></Card>
  <Card><Text style={styles.heading}>نتائج الاختبارات الأخيرة</Text>{quizProgress.attempts.length?quizProgress.attempts.slice(0,8).map(a=><View key={a.id} style={styles.historyRow}><Text style={styles.body}>{a.mode==='exam'?'محاكاة شاملة':a.mode==='quick'?'سريع':a.mode==='review'?'مراجعة':a.mode==='challenge'?'تحدي وحدة':a.mode==='lesson'?'تحدي درس':'موضوع محدد'} · {new Date(a.date).toLocaleDateString('ar-EG')}</Text><Text style={styles.blueStrong}>{a.score}%</Text></View>):<Text style={styles.caption}>لسه مفيش اختبارات مسجلة.</Text>}</Card>
 </>}
 {page==='plan'&&<><Text style={styles.screenTitle}>📅 المخطط الذكي</Text><Card style={styles.hero}><View style={{flex:1}}><Text style={styles.heroTitle}>خطتك بإيدك</Text><Text style={styles.heroText}>اختار يوم الامتحان ومواعيد الجلسات، وبنكور يعيد توزيع الباقي تلقائيًا مع تقدمك أو تأخرك.</Text></View><Mascot mood="study" size={117}/></Card>
  <Card><Text style={styles.heading}>1 · هدفك الأساسي</Text>
   <Field label="تاريخ الامتحان (YYYY-MM-DD)" value={form.examDate} onChange={examDate=>setForm(v=>({...v,examDate}))} placeholder="2026-10-30"/>
   <Field label="ساعة الامتحان (HH:MM)" value={form.examTime} onChange={examTime=>setForm(v=>({...v,examTime}))} placeholder="14:00"/>
   <Field label="عايز تخلص المادة إمتى؟ (YYYY-MM-DD)" value={form.deadline} onChange={deadline=>setForm(v=>({...v,deadline}))} placeholder="2026-10-29"/>
   <Text style={styles.caption}>تاريخ إنهاء المادة مستقل عن تاريخ الامتحان، علشان تسيب أيام للمراجعة.</Text>
  </Card>
  <Card><Text style={styles.heading}>2 · جلساتك العادية</Text><Text style={styles.caption}>اكتب جلسات البداية والنهاية وافصل بينها بفاصلة. لو مفيش وقت يومها سيبها فاضية.</Text>
   <Field label="من الأحد إلى الخميس" value={form.weekday} onChange={weekday=>setForm(v=>({...v,weekday}))} placeholder="19:00-21:00"/>
   <Field label="الجمعة والسبت" value={form.weekend} onChange={weekend=>setForm(v=>({...v,weekend}))} placeholder="09:00-11:00, 18:00-20:00"/>
   <Text style={styles.heading}>أيام راحة أسبوعية</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-end',gap:6}}>{daysOfWeek.map((name,i)=><TouchableOpacity key={i} onPress={()=>setDraft(c=>({...c,daysOff:c.daysOff.includes(i)?c.daysOff.filter(x=>x!==i):[...c.daysOff,i]}))} style={[styles.topicChip,draft.daysOff.includes(i)&&{backgroundColor:'#FBE6E6'}]}><Text style={styles.chipText}>{name}{draft.daysOff.includes(i)?' ✕':''}</Text></TouchableOpacity>)}</View>
  </Card>
  <Card><Text style={styles.heading}>3 · إجازة مكثفة</Text><Text style={styles.body}>لو أنت إجازة الأسبوع ده، اختر قالبًا يضيف ساعات لكل يوم من السبعة الجايين. تقدر تعدل أي يوم منفصلًا بعد كده.</Text><View style={{flexDirection:'row',gap:6}}>{([4,6,8] as const).map(h=><TouchableOpacity key={h} onPress={()=>vacationPreset(h)} style={[styles.smallPreset,{flex:1}]}><Text style={styles.presetText}>{h} ساعات/يوم</Text></TouchableOpacity>)}</View>
   <Text style={styles.caption}>الاستثناءات اليومية بتغلب جداول العمل والراحة، وتتحفظ فقط بعد ضغط «حفظ الخطة».</Text>
  </Card>
  <Card><Text style={styles.heading}>4 · خصص أي يوم</Text><Field label="تاريخ اليوم (YYYY-MM-DD)" value={customDay} onChange={changeDay}/><Field label="جلسات اليوم" value={customBlocks} onChange={setCustomBlocks} placeholder="09:00-11:00, 13:00-15:00"/>
   <Btn text="أضف / عدّل جلسات اليوم" secondary onPress={customSchedule}/><Btn text="امسح استثناء اليوم" secondary onPress={()=>setDraft(c=>{const dayOverrides={...c.dayOverrides};delete dayOverrides[customDay];return {...c,dayOverrides}})}/>
   <Text style={styles.caption}>أيام الإجازة المخصصة: {Object.keys(draft.dayOverrides||{}).length} يوم</Text>
  </Card>
  <Card><Text style={styles.heading}>5 · تخصيص بنكور</Text><Field label="سرعة القراءة المبدئية (كلمة/دقيقة)" keyboardType="number-pad" value={form.wpm} onChange={wpm=>setForm(v=>({...v,wpm}))}/><Field label="ساعة تذكير إضافي (HH:MM)" value={form.reminder} onChange={reminder=>setForm(v=>({...v,reminder}))}/><Text style={styles.caption}>بنكور بيتعلم سرعة قراءتك تدريجيًا ويعيد الحساب يوميًا أو بعد كل درس.</Text><Btn text="احفظ الخطة وأعد الحساب" onPress={savePlan}/><Btn secondary text={notificationsOn?'تحديث مواعيد التنبيهات':'تفعيل إشعارات المذاكرة'} onPress={enableNotifications}/>{notificationsOn&&<Btn secondary text="إيقاف إشعارات بنكور" onPress={disableNotifications}/>}<Text style={styles.caption}>تنبيهات بنكور محلية وتتحّدث لما تفتح التطبيق أو تغيّر خطتك. تغيير أيقونة الهاتف وهو مغلق تمامًا مش مضمون على كل الأجهزة.</Text></Card>
  <Text style={styles.heading}>الأيام القادمة من الخطة الحالية</Text>{forecastNow.days.slice(0,14).map(d=><Card key={d.date}><View style={styles.inline}><Text style={styles.heading}>{daysOfWeek[parseDay(d.date).getDay()]} · {fmt(d.date)}</Text><Text style={styles.blueStrong}>{Math.ceil(d.targetMinutes)} د</Text></View><Bar value={d.capacity?d.targetMinutes/d.capacity:0}/><Text style={styles.caption}>المتاح: {minText(d.capacity)} · {unique(d.tasks.map(x=>x.id)).length} دروس · {formatStudyRanges(blocksForDay(d.date,cfg))||'راحة'}</Text></Card>)}
 </>}
 {page==='rewards'&&<><Text style={styles.screenTitle}>🏆 إنجازات بنكور</Text><Card style={{alignItems:'center'}}><Mascot mood={forecastNow.status==='complete'?'party':'happy'} size={165}/><Text style={styles.bigNumber}>{state.xp} XP</Text><Text style={styles.heading}>مستواك {Math.floor(state.xp/200)+1}</Text><Bar value={(state.xp%200)/200} color={C.gold}/><Text style={styles.caption}>باقي {200-(state.xp%200)} XP للمستوى التالي</Text></Card>
  <View style={styles.kpiRow}><View style={styles.kpi}><Text style={styles.kpiIcon}>🔥</Text><Text style={styles.kpiValue}>{streak(state)}</Text><Text style={styles.caption}>Streak</Text></View><View style={styles.kpi}><Text style={styles.kpiIcon}>📚</Text><Text style={styles.kpiValue}>{forecastNow.finished}</Text><Text style={styles.caption}>درس</Text></View><View style={styles.kpi}><Text style={styles.kpiIcon}>🎯</Text><Text style={styles.kpiValue}>{quizProgress.attempts.length}</Text><Text style={styles.caption}>اختبار</Text></View></View>
  <Card><Text style={styles.heading}>شاراتك</Text>{[{name:'أول خطوة',emoji:'👣',got:forecastNow.finished>=1,desc:'خلص أول درس'}, {name:'نجم المذاكرة',emoji:'⭐',got:forecastNow.finished>=10,desc:'أنهي 10 دروس'}, {name:'قارئ محترف',emoji:'📖',got:forecastNow.finished>=50,desc:'أنهي 50 درس'}, {name:'بطل الماتريال',emoji:'🏅',got:forecastNow.status==='complete',desc:'أنهي كل الدروس'}, {name:'المتحدي',emoji:'⚡',got:quizProgress.attempts.length>=5,desc:'حل 5 اختبارات'}, {name:'مستمر',emoji:'🔥',got:activity.streak>=3,desc:'3 أيام متتالية'}].map(x=><View key={x.name} style={[styles.badgeRow,{opacity:x.got?1:.43}]}><Text style={{fontSize:30}}>{x.emoji}</Text><View style={{flex:1}}><Text style={styles.lessonTitle}>{x.name}</Text><Text style={styles.caption}>{x.desc}</Text></View><Text style={{color:C.green,fontWeight:'900'}}>{x.got?'مكتسبة':'مقفولة'}</Text></View>)}</Card>
  <Card><Text style={styles.heading}>🧠 حالة المراجعة المتباعدة</Text><Text style={styles.body}>مستحقة اليوم: {reviewStats.due} · مجدولة للأيام القادمة: {reviewStats.upcoming} · أسئلة اتدربت عليها: {reviewStats.seen}</Text><Btn secondary text="مراجعة المستحق الآن" disabled={!reviewStats.due} onPress={()=>startQuiz('review')}/></Card>
  <Card><Text style={styles.heading}>المكافآت</Text><Text style={styles.body}>📘 +15 XP عند إنهاء درس لأول مرة</Text><Text style={styles.body}>✅ +5 XP لكل سؤال صحيح جديد</Text><Text style={styles.body}>🎯 +25 XP عند تحقيق هدف اليوم</Text><Text style={styles.body}>🏆 +250 XP عند إكمال المادة كلها</Text><Text style={styles.caption}>بنكور مش بيكرر مكافأة الدرس أو نفس السؤال.</Text></Card>
 </>}
 </ScrollView><View style={styles.bottomTabs}>{tabs.map(t=><TouchableOpacity key={t.key} onPress={()=>t.key==='plan'?openPlan():setPage(t.key)} style={[styles.tab,page===t.key&&styles.tabSelected]}><Text style={[styles.tabIcon,page===t.key&&{color:C.blue}]}>{t.icon}</Text><Text style={[styles.tabLabel,page===t.key&&{color:C.blue}]}>{t.label}</Text></TouchableOpacity>)}</View>
 </SafeAreaView>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:C.bg},loading:{textAlign:'center',paddingTop:100,fontSize:20,fontWeight:'800',color:C.navy},header:{minHeight:60,backgroundColor:C.navy,flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20},brand:{color:'white',fontSize:20,fontWeight:'900',letterSpacing:1},headerRight:{color:'#D8E6FF',fontWeight:'700',fontSize:12},card:{backgroundColor:C.white,borderRadius:19,borderWidth:1,borderColor:C.border,padding:16,marginBottom:13,gap:8},hero:{backgroundColor:C.navy,flexDirection:'row',borderColor:C.navy,alignItems:'center',padding:14},heroKicker:{color:'#8DB9FF',fontSize:13,fontWeight:'800'},heroTitle:{color:C.gold,fontSize:20,fontWeight:'900',textAlign:'right'},heroText:{color:'#EDF3FF',fontSize:13,lineHeight:22,textAlign:'right'},title:{color:C.navy,fontWeight:'900',fontSize:19,textAlign:'center',lineHeight:27},heading:{color:C.navy,fontWeight:'900',fontSize:16,textAlign:'right'},screenTitle:{fontSize:24,fontWeight:'900',color:C.navy,textAlign:'right',marginBottom:9},body:{fontSize:14,color:C.ink,lineHeight:24,textAlign:'right'},caption:{fontSize:12,color:C.muted,textAlign:'right',lineHeight:19},blueStrong:{color:C.blue,fontWeight:'900',fontSize:14},warn:{color:'#AA4B2A',fontWeight:'900',textAlign:'right',fontSize:15},track:{height:10,width:'100%',backgroundColor:'#E6ECF6',borderRadius:50,overflow:'hidden',marginVertical:5},fill:{height:'100%',borderRadius:50},button:{minHeight:49,paddingHorizontal:16,paddingVertical:11,borderRadius:15,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginTop:5},buttonText:{fontSize:15,fontWeight:'900',color:'white',textAlign:'center'},buttonSecondary:{backgroundColor:C.pale,borderWidth:1,borderColor:'#C9D9FA'},kpiRow:{flexDirection:'row',gap:8,marginBottom:13},kpi:{flex:1,backgroundColor:C.white,borderRadius:15,padding:12,alignItems:'center',borderWidth:1,borderColor:C.border,gap:2},kpiIcon:{fontSize:22},kpiValue:{color:C.navy,fontSize:20,fontWeight:'900'},inline:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10},lessonRow:{flexDirection:'row',alignItems:'center',borderTopWidth:1,borderTopColor:C.border,paddingVertical:11,gap:11},lessonCircle:{height:44,width:44,borderRadius:22,backgroundColor:C.pale,justifyContent:'center',alignItems:'center'},lessonTitle:{fontSize:14,color:C.ink,fontWeight:'800',textAlign:'right',lineHeight:22},path:{paddingVertical:12,paddingHorizontal:34,alignItems:'center',gap:15,marginBottom:11},pathUnit:{alignItems:'center',gap:5,maxWidth:155},pathNode:{width:84,height:76,borderRadius:25,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',borderBottomWidth:7,borderBottomColor:'#143E9F'},questionJump:{width:35,height:35,borderRadius:12,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#C9D9FA'},pathLabel:{color:C.navy,fontSize:12,textAlign:'center',fontWeight:'800'},bottomTabs:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'white',borderTopWidth:1,borderTopColor:C.border,flexDirection:'row',paddingBottom:Platform.OS==='ios'?22:7,paddingTop:7},tab:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:6,borderRadius:14,marginHorizontal:2},tabSelected:{backgroundColor:'#EAF2FF'},tabIcon:{fontSize:25,color:C.muted,fontWeight:'900'},tabLabel:{fontSize:10,color:C.muted,fontWeight:'800'},fieldTitle:{fontSize:13,color:C.navy,fontWeight:'800',textAlign:'right'},field:{minHeight:45,borderRadius:11,borderWidth:1,borderColor:C.border,backgroundColor:'#FCFDFF',paddingHorizontal:12,color:C.ink,fontSize:14},topicChip:{paddingHorizontal:10,paddingVertical:9,backgroundColor:C.pale,borderWidth:1,borderColor:'#CFE0FF',borderRadius:13},chipText:{fontSize:12,fontWeight:'800',color:C.navy,textAlign:'center'},chipActive:{backgroundColor:C.blue},smallPreset:{backgroundColor:C.pale,borderRadius:12,paddingVertical:14,alignItems:'center',borderWidth:1,borderColor:'#CFE0FF'},presetText:{fontSize:13,color:C.navy,fontWeight:'900'},backRow:{padding:13,backgroundColor:C.pale},backText:{color:C.navy,fontWeight:'900',fontSize:13},material:{fontSize:16,lineHeight:30,textAlign:'right',color:C.ink},quizTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:9,marginBottom:8},timer:{color:C.red,fontSize:18,fontWeight:'900'},question:{color:C.navy,fontWeight:'900',fontSize:20,lineHeight:32,textAlign:'right',marginBottom:10},answer:{borderWidth:1.5,borderColor:C.border,borderRadius:15,minHeight:63,padding:12,flexDirection:'row',alignItems:'center',gap:9,marginVertical:3},answerText:{flex:1,fontSize:14,color:C.ink,lineHeight:22,textAlign:'right',fontWeight:'600'},answerBadge:{height:31,width:31,borderRadius:10,backgroundColor:C.pale,alignItems:'center',justifyContent:'center'},answerLetter:{color:C.navy,fontWeight:'900'},explain:{borderRadius:12,padding:12,gap:8,marginTop:7},bigNumber:{fontSize:44,fontWeight:'900',color:C.navy},reviewItem:{borderTopWidth:1,borderColor:C.border,paddingTop:13,gap:5},historyRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderTopWidth:1,borderColor:C.border,paddingVertical:10},badgeRow:{flexDirection:'row',alignItems:'center',gap:11,borderBottomWidth:1,borderColor:C.border,paddingVertical:10},unitChip:{backgroundColor:'#E8F0FF',paddingHorizontal:11,paddingVertical:11,borderRadius:15,borderWidth:1,borderColor:'#C9D9F5',maxWidth:170},unitChipActive:{backgroundColor:C.blue},unitChipText:{color:C.navy,fontSize:12,fontWeight:'800',textAlign:'center'},readerToggle:{flex:1,paddingVertical:12,borderRadius:14,borderWidth:1,borderColor:'#BFCFEC',backgroundColor:C.white,alignItems:'center'},readerSelected:{backgroundColor:C.blue,borderColor:C.blue},readerToggleText:{fontSize:13,fontWeight:'800',color:C.navy},celebrateBackdrop:{flex:1,backgroundColor:'rgba(5,16,45,.76)',alignItems:'center',justifyContent:'center',padding:24},celebrateCard:{backgroundColor:'white',width:'100%',maxWidth:370,borderRadius:28,padding:25,alignItems:'center',gap:12,borderWidth:3,borderColor:C.gold},celebrateConfetti:{fontSize:24,color:C.gold},celebrateTitle:{fontSize:27,color:C.navy,fontWeight:'900',textAlign:'center'},celebrateXp:{fontSize:30,color:'#D99100',fontWeight:'900'},celebrateMessage:{fontSize:15,color:C.ink,textAlign:'center',lineHeight:24}});
