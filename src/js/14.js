'use strict';
function meter(ratio,hasOpen=false){
 if(ratio===null||ratio===undefined||!Number.isFinite(ratio))return '<span class="muted">Sem percentual</span>';
 const pct=Math.max(0,ratio),width=Math.min(100,pct),tone=hasOpen||pct<80?'critical':pct<100?'low':'';
 return `<div class="completion"><strong>${percent(pct)}</strong><div class="meter ${tone}"><span style="width:${width}%"></span></div></div>`;
}
function kpis(s){
 const comparable=s.comparable.length,lessons=s.lessons.length;
 return `<div class="kpis"><article class="kpi primary"><div class="kpi-top"><span>Aulas registradas</span><span class="kpi-icon">${icon('book')}</span></div><div class="kpi-value number">${moneyless(s.actual)}</div><div class="kpi-bottom">Somente na base comparável</div></article><article class="kpi"><div class="kpi-top"><span>Aulas previstas</span><span class="kpi-icon">${icon('target')}</span></div><div class="kpi-value number">${moneyless(s.expected)}</div><div class="kpi-bottom">Referências documentadas/informadas</div></article><article class="kpi"><div class="kpi-top"><span>Diferença</span><span class="kpi-icon">${icon('compare')}</span></div><div class="kpi-value number ${s.balance<0?'delta-neg':s.balance>0?'delta-pos':''}">${delta(s.balance)}</div><div class="kpi-bottom">Registradas − previstas · alerta de conferência</div></article><article class="kpi"><div class="kpi-top"><span>Base comparável</span><span class="kpi-icon">${icon('chart')}</span></div><div class="kpi-value number">${comparable}/${lessons}</div><div class="kpi-bottom">${s.missingLoad.length} sem referência · ${s.open.length} em aberto</div></article></div>`;
}
function consolidatedPeriodPlan(r,period){
 if(!r)return {value:null,source:'Registro não localizado no período.'};
 const override=cfg.expected?.[r.id];
 if(override)return {value:override.value,source:override.source,kind:'entered'};
 const w=weeklyFor(r);if(w===null)return {value:null,source:'Sem carga semanal documentada.',kind:'unknown'};
 return {value:calendarExpected(w,period),source:(Object.hasOwn(cfg.weekly,r.refKey)?'Carga semanal ajustada pela escola. ':DATA.refs[r.refKey]?.source||'Referência semanal documentada. '),kind:'estimated'};
}
function consolidatedPage(){
 const t1ByKey=new Map((DATA.raw_t1||[]).map(r=>[logicalKey(r),r])),t2ByKey=new Map((DATA.raw||[]).map(r=>[logicalKey(r),r]));
 const q=normalize(state.query.trim());
 const sourceRows=(DATA.consolidated||[]).map(c=>{
  const key=`${c.cod_turma}|${normalize(c.baseComponent||c.componente).replace(/[^a-z0-9]+/g,' ').trim()}`,a=t1ByKey.get(key),b=t2ByKey.get(key),current=b||a||c;
  const p1=consolidatedPeriodPlan(a,'1'),p2=consolidatedPeriodPlan(b,'2'),completePeriods=!!a&&!!b;
  const expected=completePeriods&&p1.value!==null&&p2.value!==null?p1.value+p2.value:null,actual=Number(c.total_acumulado??0);
  const rr={...current,...c,professor:responsibleTeacher(current),unit:'aulas',actual,plan:{value:expected,kind:expected===null?'unknown':(p1.kind==='entered'||p2.kind==='entered'?'entered':'estimated'),weekly:weeklyFor(current),days:expected===null?null:trimesterDays('1')+trimesterDays('2'),source:completePeriods?`${p1.source} ${p2.source}`:'Registro não localizado nos dois trimestres; previsão acumulada não calculada.'},comparable:expected!==null,balance:expected===null?null:actual-expected,status:c.situacao==='REGULAR'?'FECHADO':'ABERTO'};
  return rr;
 }).filter(r=>(!state.stage||stage(r)===state.stage)&&(!state.classId||r.cod_turma===state.classId)&&(!state.teacher||r.professor===state.teacher)&&(!q||normalize(`${r.professor} ${r.componente} ${r.turma} ${r.cod_turma}`).includes(q)));
 if(!sourceRows.length)return empty('Não há registros consolidados neste recorte. Importe os relatórios do 1º e 2º trimestres para formar o acumulado.');
 const s=stats(sourceRows);
 return `<div class="notice neutral">${icon('info')}<div class="text"><strong>Consolidado 1º + 2º trimestre.</strong> Aulas registradas são somadas por turma + componente. A previsão acumulada só é calculada quando os dois períodos estão localizados e possuem referência documental ou previsão informada.</div></div>${kpis(s)}${notice(s)}<section class="card"><div class="card-head"><div><h2>Total acumulado por turma e componente</h2><p class="sub">O professor exibido é o responsável atual do 2º trimestre quando disponível.</p></div>${badge(`${sourceRows.length} diário(s) lógico(s)`,'info')}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Professor(a) / turma / componente</th><th class="num">1º Tri</th><th class="num">2º Tri</th><th class="num">Total</th><th class="num">Previsto acumulado</th><th class="num">Diferença</th><th>Fechamento</th><th>Notas no relatório</th></tr></thead><tbody>${sourceRows.slice().sort((a,b)=>a.shortClass.localeCompare(b.shortClass,'pt-BR',{numeric:true})||a.componente.localeCompare(b.componente,'pt-BR')).map(r=>`<tr><td><div class="component"><strong>${esc(title(r.professor))}</strong><small>${esc(r.shortClass)} · ${esc(title(r.componente))}</small>${r.previousProfessor?`<small>Responsável no 1º tri: ${esc(title(r.previousProfessor))}</small>`:''}</div></td><td class="num"><strong>${moneyless(r.t1_aulas)}</strong></td><td class="num"><strong>${moneyless(r.t2_aulas)}</strong></td><td class="num"><strong>${moneyless(r.total_acumulado)}</strong></td><td class="num">${moneyless(r.plan.value)}<small>${r.plan.value===null?'Sem base completa':'1º + 2º tri'}</small></td><td class="num ${r.balance<0?'delta-neg':r.balance>0?'delta-pos':''}"><strong>${delta(r.balance)}</strong></td><td>${badge(r.situacao==='REGULAR'?'T1 e T2 fechados':'Conferir fechamento',r.situacao==='REGULAR'?'good':'warn')}<div class="record-info">T1: ${esc(r.t1_status)} · T2: ${esc(r.t2_status)}</div></td><td><div class="record-info">T1: ${esc(r.t1_notas)}<br>T2: ${esc(r.t2_notas)}</div></td></tr>`).join('')}</tbody></table></div><div class="card-foot"><span>Diferenças são alertas de conferência. Componentes sem referência acumulada ficam fora dos percentuais.</span><button type="button" class="btn btn-small" onclick="exportConsolidatedCsv()">${icon('download')} Exportar consolidado</button></div></section>`;
}
'use strict';
document.addEventListener('change',async e=>{
 const el=e.target;
 if(['stage-filter','matrix-filter','class-filter','teacher-filter'].includes(el.id))state.gradePage=0;
 if(el.id==='trimester-filter'){state.trimester=el.value;RAW=getActiveRaw();syncFilterOptions();render();}
 else if(el.id==='stage-filter'){state.stage=el.value;state.classId='';state.teacher='';state.expanded.clear();syncFilterOptions();render();}
 else if(el.id==='matrix-filter'){state.matrixGroup=el.value;state.classId='';state.teacher='';state.expanded.clear();syncFilterOptions();render();}
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
 else if(el.id==='replace-t1-file'||el.id==='replace-t2-file'){const file=el.files?.[0];if(!file)return;try{await queueSafeImport(file,el.id==='replace-t1-file'?'1':'2');}finally{el.value='';}}
 else if(el.id==='weekly-file'){const file=el.files?.[0];if(!file)return;try{await queueSafeImport(file,'weekly');}finally{el.value='';}}
 else if(el.matches('[data-weekly-teacher]')){const name=el.dataset.weeklyTeacher;if(el.checked)state.weeklySelected.add(name);else state.weeklySelected.delete(name);render();}
 else if(el.matches('[data-weekly-select-all]')){const names=weeklyTeacherGroups().filter(g=>g.below.length).map(g=>g.name);state.weeklySelected=el.checked?new Set(names):new Set();render();}
 else if(el.id==='import-settings'){const file=el.files?.[0];if(!file)return;try{if(file.size>1000000)throw new Error('Arquivo maior que o limite de 1 MB.');pendingImport=validateConfig(JSON.parse(await file.text()));askConfirm('Aplicar os par\u00e2metros importados?','Os ajustes atuais ser\u00e3o substitu\u00eddos pelos par\u00e2metros deste arquivo. A base original de registros ser\u00e1 preservada.','apply-import','Aplicar par\u00e2metros');}catch(err){pendingImport=null;toast('Importa\u00e7\u00e3o recusada: '+err.message);}finally{el.value='';}}
});
document.addEventListener('input',e=>{const el=e.target;if(el.id==='query-filter'){state.query=el.value;state.gradePage=0;render();}if(el.id==='record-source'||el.id==='record-expected')el.setCustomValidity('');});
document.addEventListener('submit',e=>{if(e.target.id==='grade-form'){e.preventDefault();saveGradeRecord(document.getElementById('record-dialog').dataset.recordId);}if(e.target.id==='expected-form'){e.preventDefault();saveExpected(document.getElementById('record-dialog').dataset.recordId);}});
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const box=d.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)d.close();}});
window.addEventListener('beforeprint',()=>{if(state.page==='grades'){state.printAllGrades=true;render();}});
window.addEventListener('afterprint',()=>{if(state.printAllGrades){state.printAllGrades=false;render();}if(document.body.classList.contains('weekly-printing')){document.body.classList.remove('weekly-printing');state.weeklyPrintMode='';state.weeklyPrintTeachers.clear();render();}});
window.addEventListener('hashchange',()=>{const p=location.hash.slice(1);if(pageMeta[p]&&p!==state.page)switchPage(p);});
function initializeDedApp(){
 document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
 updateSchoolUI();syncFilterOptions();switchPage(location.hash.slice(1)||'overview',false);if(loadWarning)toast(loadWarning);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeDedApp,{once:true});else initializeDedApp();
// Read-only diagnostic API for reproducible checks; no external connections.
window.DED=Object.freeze({getData:()=>JSON.parse(JSON.stringify(DATA)),getConfig:()=>JSON.parse(JSON.stringify(cfg)),getRows:()=>modelRows(),getStats:()=>stats(modelRows()),getState:()=>({...state,expanded:[...state.expanded]}),validateConfig,classifyGrades,getGradeStats:()=>gradeStats(modelRows())});
