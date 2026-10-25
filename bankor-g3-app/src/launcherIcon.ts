import {Platform} from 'react-native';
import type {Forecast} from './planner';
let previous: string|undefined;
/** Native launcher icon sync: only applied when the app's JS runs; never promises background automatic updates. */
export async function syncLauncherIcon(mood:Forecast['mood']):Promise<boolean>{
 const icon=mood==='party'?'celebrate':mood==='sad'?'sad':mood==='worried'?'worried':null;
 const key=icon??'primary';if(key===previous)return true;
 if(Platform.OS!=='android'&&Platform.OS!=='ios')return false;
 try{
  const mod=await import('expo-awesome-app-icon');
  if(!mod.supportsAlternateIcons())return false;
  const selected=mod.getAppIconState().selected;
  if(selected===icon){previous=key;return true;}
  // On Android, deferring prevents the icon alias being disabled while app is active.
  await mod.setAppIcon(icon,{deferUntilBackground:Platform.OS==='android'});
  previous=key;return true;
 }catch(error){console.warn('Native alternative app icons need a native development/release build',error);return false;}
}
