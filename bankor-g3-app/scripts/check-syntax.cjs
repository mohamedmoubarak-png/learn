const path=require('node:path');
const fs=require('node:fs');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const files=['App.tsx','src/WelcomeFlow.tsx','src/notifications.ts','src/launcherIcon.ts'];
let count=0;
for(const f of files){
 const source=fs.readFileSync(path.join(__dirname,'..',f),'utf8');
 const result=ts.transpileModule(source,{fileName:f,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,isolatedModules:true},reportDiagnostics:true});
 const errs=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 if(errs.length){for(const e of errs)console.error(f,ts.flattenDiagnosticMessageText(e.messageText,' '));process.exitCode=1;}
 count++;
}
if(!process.exitCode)console.log(`PASS — TypeScript/TSX syntax parsed in ${count} UI/native source files (not a full typecheck)`);
