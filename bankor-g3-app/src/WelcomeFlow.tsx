import React, {useState} from 'react';
import {Dimensions, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

const navy='#102A5C',blue='#2763DE',ink='#203252',gray='#64748B',gold='#F4B942';
const face={
  happy:require('../assets/happy.png'),
  study:require('../assets/study.png'),
  party:require('../assets/party.png'),
};
const slides=[
  {
    kicker:'أهلًا بيك في أكاديمية بنكور',
    title:'المذاكرة بقت رحلة',
    detail:'أنا بنكور! هنقسم المادة لمراحل صغيرة، ونذاكر خطوة بخطوة، ونحتفل بكل إنجاز.',
    image:face.happy,
    accent:'#E9F2FF',
    pill:'113 درسًا · 895 سؤالًا',
  },
  {
    kicker:'خطتك الذكية',
    title:'موعدك.. على راحتك',
    detail:'أنت تختار يوم الامتحان، ومواعيد المذاكرة، وأيام الإجازة. وأنا أعيد توزيع الدروس تلقائيًا لما خطتك تتغير.',
    image:face.study,
    accent:'#E9F7F2',
    pill:'مواعيد مرنة · بدون إنترنت',
  },
  {
    kicker:'كل يوم إنجاز',
    title:'اتقدّم واكسب',
    detail:'اجمع نقاط XP، وحافظ على سلسلة الأيام، وحل تحديات سريعة. ولو اتأخرت هنظبط الخطة ونبدأ تاني.',
    image:face.party,
    accent:'#FFF4D8',
    pill:'XP · Streak · شارات',
  },
];
export default function WelcomeFlow({onFinish}:{onFinish:()=>void}){
  const [step,setStep]=useState(0);
  const current=slides[step];
  const goNext=()=>step===slides.length-1?onFinish():setStep(s=>s+1);
  const height=Dimensions.get('window').height;
  return <SafeAreaView style={styles.root}>
    <StatusBar barStyle="dark-content"/>
    <ScrollView contentContainerStyle={[styles.body,{minHeight:Math.max(620,height-45)}]} bounces={false}>
      <View style={styles.top}>
        <View style={styles.brandWrap}><View style={styles.brandIcon}><Text style={styles.brandIconText}>B</Text></View><View><Text style={styles.brand}>BANKOR <Text style={{color:gold}}>✦</Text></Text><Text style={styles.brandSub}>G3 ACADEMY</Text></View></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="تخطي المقدمة" onPress={onFinish}><Text style={styles.skip}>تخطي</Text></TouchableOpacity>
      </View>
      <View style={[styles.mascotBackdrop,{backgroundColor:current.accent}]}>
        <View style={styles.halo}/>
        <Text style={styles.sparkleA}>✦</Text><Text style={styles.sparkleB}>✦</Text>
        <Image accessibilityLabel="شخصية بنكور الرسمية" source={current.image} style={styles.mascot} resizeMode="contain"/>
      </View>
      <View style={styles.content}>
        <Text style={styles.kicker}>{current.kicker}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.detail}</Text>
        <View style={styles.pill}><Text style={styles.pillText}>{current.pill}</Text></View>
      </View>
      <View style={styles.foot}>
        <View style={styles.dots}>{slides.map((_,i)=><View key={i} style={[styles.dot,step===i&&styles.activeDot]}/>)}</View>
        <TouchableOpacity accessibilityRole="button" onPress={goNext} activeOpacity={.85} style={styles.cta}><Text style={styles.ctaText}>{step===2?'ظبط خطتي وابدأ':'يلا نكمل'}</Text><Text style={styles.arrow}>←</Text></TouchableOpacity>
        <Text style={styles.footerText}>تقدمك بيتحفظ على جهازك حتى لو مفيش إنترنت</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#F7F9FF'},body:{flexGrow:1,paddingHorizontal:24,paddingTop:14,paddingBottom:20,justifyContent:'space-between'},
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brandWrap:{flexDirection:'row',alignItems:'center',gap:10},brandIcon:{width:45,height:45,borderRadius:14,backgroundColor:navy,alignItems:'center',justifyContent:'center',borderBottomWidth:4,borderBottomColor:'#071938'},brandIconText:{color:gold,fontSize:27,fontWeight:'900'},brand:{fontWeight:'900',fontSize:18,color:navy,letterSpacing:1.2},brandSub:{fontWeight:'800',fontSize:10,color:gray,letterSpacing:2.4},skip:{color:gray,fontSize:14,fontWeight:'800',padding:10},
  mascotBackdrop:{height:Math.min(320,Math.max(238,Dimensions.get('window').height*.355)),borderRadius:38,justifyContent:'center',alignItems:'center',marginTop:24,overflow:'hidden',borderWidth:1,borderColor:'#E5EAF4'},halo:{position:'absolute',width:270,height:270,borderRadius:135,backgroundColor:'rgba(255,255,255,.58)'},sparkleA:{position:'absolute',fontSize:35,color:gold,top:24,right:33},sparkleB:{position:'absolute',fontSize:22,color:'#50BD7A',bottom:24,left:40},mascot:{width:'87%',height:'93%',borderRadius:30},
  content:{alignItems:'center',paddingTop:24,paddingHorizontal:5},kicker:{fontSize:15,color:blue,fontWeight:'900',textAlign:'center',marginBottom:8},title:{fontSize:31,fontWeight:'900',color:navy,textAlign:'center',lineHeight:44,marginBottom:10},description:{fontSize:17,color:ink,textAlign:'center',lineHeight:29,maxWidth:450},pill:{backgroundColor:'#E7EDF9',borderRadius:30,marginTop:18,paddingHorizontal:18,paddingVertical:10},pillText:{fontSize:13,fontWeight:'800',color:navy},
  foot:{gap:16,paddingTop:18},dots:{flexDirection:'row',justifyContent:'center',gap:9},dot:{height:9,width:9,backgroundColor:'#C6D0E2',borderRadius:8},activeDot:{width:34,backgroundColor:blue},cta:{height:59,backgroundColor:blue,borderRadius:18,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:13,borderBottomWidth:5,borderBottomColor:'#16449D'},ctaText:{color:'white',fontWeight:'900',fontSize:18},arrow:{color:'white',fontSize:24,fontWeight:'900'},footerText:{fontSize:12,color:gray,textAlign:'center'},
});
