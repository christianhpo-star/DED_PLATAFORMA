'use strict';
document.addEventListener('change',async e=>{
 const el=e.target;
 if(['stage-filter','class-filter','teacher-filter'].includes(el.id))state.gradePage=0;
 if(el.id==='trimester-filter'){state.trimester=el.value;RAW=getActiveRaw();syncFilterOptions();render();}
 else if(el.id==='stage-filter'){state.stage=el.value;state.classId='';state.teacher='';state.expanded.clear();syncFilterOptions();render();}
 else if(el.id==='class-filter'){state.classId=el.value;state.expanded.clear();syncFilterOptions();render();}
 else if(el.id==='teacher-filter'){state.teacher=el.value;state.expanded.clear();render();}
 else if(el.id==='grade-mode'){state.gradeMode=el.value;state.gradePage=0;render();}
 else if(el.id==='teacher-grade-mode'){state.teacherGradeMode=el.value;render();}
 else if(el.id==='sort-teachers'){state.sort=el.value;render();}
 else if(el.id==='compare-a'){state.comparisonA=el.value;render();}
 else if(el.id==='compare-b'){state.comparisonB=el.value;render();}
 else if(el.id==='reference-group'){state.referenceGroup=el.value;render();}
 else if(el.dataset.teacherOverride){const key=el.dataset.teacherOverride,raw=el.value;if(raw)cfg.teacherOverrides[key]=raw;else delete cfg.teacherOverrides[key];if(saveConfig())toast(raw?'Professor responsável definido para o consolidado.':'Responsável voltou a ficar pendente.');render();}
 else if(el.dataset.reference){const key=el.dataset.reference;const raw=el.value.trim();const val=raw===''?null:Number(raw);if(!el.reportValidity()||(val!==null&&(!integer(val)||val<0||val>45))){toast('Carga semanal inválida. Informe um inteiro entre 0 e 45, ou deixe vazio.');el.value=weeklyFor({refKey:key})??'';return;}if(val===DATA.refs[key].weekly)delete cfg.weekly[key];else cfg.weekly[key]=val;if(saveConfig())toast('Carga semanal aplicada. As previs\u00f5es espec\u00edficas por registro foram mantidas.');const y=window.scrollY;const sc=document.querySelector('.reference-scroll')?.scrollTop||0;render();window.scrollTo({top:y,behavior:'instant'});const wrap=document.querySelector('.reference-scroll');if(wrap)wrap.scrollTop=sc;}
 else if(el.id==='replace-t1-file'||el.id==='replace-t2-file'){const file=el.files?.[0];if(!file)return;try{await replaceReport(file,el.id==='replace-t1-file'?'1':'2');}catch(err){toast('Planilha não aplicada: '+err.message);}finally{el.value='';}}
 else if(el.id==='weekly-file'){const file=el.files?.[0];if(!file)return;try{await addWeeklyReport(file);}catch(err){toast('Atualização semanal não aplicada: '+err.message);}finally{el.value='';}}
 else if(el.id==='import-settings'){const file=el.files?.[0];if(!file)return;try{if(file.size>1000000)throw new Error('Arquivo maior que o limite de 1 MB.');pendingImport=validateConfig(JSON.parse(await file.text()));askConfirm('Aplicar os par\u00e2metros importados?','Os ajustes atuais ser\u00e3o substitu\u00eddos pelos par\u00e2metros deste arquivo. A base original de registros ser\u00e1 preservada.','apply-import','Aplicar par\u00e2metros');}catch(err){pendingImport=null;toast('Importa\u00e7\u00e3o recusada: '+err.message);}finally{el.value='';}}
});
document.addEventListener('input',e=>{const el=e.target;if(el.id==='query-filter'){state.query=el.value;state.gradePage=0;render();}if(el.id==='record-source'||el.id==='record-expected')el.setCustomValidity('');});
document.addEventListener('submit',e=>{if(e.target.id==='grade-form'){e.preventDefault();saveGradeRecord(document.getElementById('record-dialog').dataset.recordId);}if(e.target.id==='expected-form'){e.preventDefault();saveExpected(document.getElementById('record-dialog').dataset.recordId);}});
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const box=d.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)d.close();}});
window.addEventListener('beforeprint',()=>{if(state.page==='grades'){state.printAllGrades=true;render();}});
window.addEventListener('afterprint',()=>{if(state.printAllGrades){state.printAllGrades=false;render();}});
window.addEventListener('hashchange',()=>{const p=location.hash.slice(1);if(pageMeta[p]&&p!==state.page)switchPage(p);});
document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
updateSchoolUI();syncFilterOptions();switchPage(location.hash.slice(1)||'overview',false);if(loadWarning)toast(loadWarning);
// Read-only diagnostic API for reproducible checks; no external connections.
window.DED=Object.freeze({getData:()=>JSON.parse(JSON.stringify(DATA)),getConfig:()=>JSON.parse(JSON.stringify(cfg)),getRows:()=>modelRows(),getStats:()=>stats(modelRows()),getState:()=>({...state,expanded:[...state.expanded]}),validateConfig,classifyGrades,getGradeStats:()=>gradeStats(modelRows())});
