'use strict';
function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),5000);}
function askConfirm(titleText,message,action,label){const d=document.getElementById('confirm-dialog');d.innerHTML=`<div class="dialog-head"><h2 id="confirm-title">${esc(titleText)}</h2>${btn(icon('close'),'cancel-confirm','aria-label="Cancelar"','icon-btn')}</div><div class="dialog-body"><p style="font-size:13px;line-height:1.8">${esc(message)}</p></div><div class="dialog-foot"><span></span><div class="inline-actions">${btn('Cancelar','cancel-confirm')}${btn(esc(label),action,'','btn-primary')}</div></div>`;d.showModal();}
function downloadFile(filename,content,type){const blob=new Blob([content],{type});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
function rowsForExport(){if(state.page==='grades')return gradeRowsForView();if(state.page==='teachers')return groupsTeachers().flatMap(g=>g.records);if(state.page==='classes')return baseRows().filter(r=>r.cod_turma===state.selectedClass);if(state.page==='compare'){const p=comparisonRows();return [...p.a,...p.b];}if(state.page==='pending')return baseRows().filter(r=>r.status!=='FECHADO'||['none','partial','majority'].includes(r.grade.status)||r.balance<0);if(state.page==='settings')return modelRows();return baseRows();}
function exportCSV(){
 const rows=rowsForExport();if(!rows.length){toast('N\u00e3o h\u00e1 registros para exportar nesta tela.');return;}
 // A exportação usa os meses do período ativo, preservando a nomenclatura dos dois relatórios oficiais.
 const exportMonths=state.trimester==='1'?[['fev','Fevereiro'],['mar','Março'],['abr','Abril'],['mai','Maio']]:(state.trimester==='all'||state.trimester==='consolidated'?[['fev','Fevereiro'],['mar','Março'],['abr','Abril'],['mai_t1','Maio · 1º Tri'],['mai_t2','Maio · 2º Tri'],['jun','Junho'],['jul','Julho'],['ago','Agosto'],['set','Setembro']]:[['mai','Maio'],['jun','Junho'],['jul','Julho'],['ago','Agosto'],['set','Setembro']]);
 const h=['Professor','Turma','Codigo da turma','Etapa','Componente','Unidade do registro','Quantidade registrada original','Aulas previstas','Aulas registradas','Comparavel','Diferenca (registradas - previstas)','Atingimento (%)','Tipo da previsao','Carga semanal','Dias de referencia','Origem da previsao',...exportMonths.map(([,label])=>label+' (original)'),'Campo notas (original)','Fechamento (original)','Situacao do lancamento de notas','Total de estudantes na base','Com nota','Sem nota','Cobertura de notas (%)','Tipo da contagem','Fonte da contagem','Motivo dos casos sem nota','Motivo confirmado pela escola'];
 const data=rows.map(r=>[r.professor,r.shortClass,r.cod_turma,refLabels[r.bucket],r.componente,r.unit,r.total,r.plan.value,r.unit==='aulas'?r.actual:null,r.comparable?'Sim':'Nao',r.balance,r.comparable&&r.plan.value>0?Math.round(r.actual/r.plan.value*1000)/10:null,r.plan.kind==='estimated'?'Estimada':r.plan.kind==='entered'?'Informada':r.plan.kind==='days'?'Frequencia em dias':'Nao informada',r.plan.weekly,r.plan.kind==='estimated'?r.plan.days:null,r.plan.source,...exportMonths.map(([key])=>r[key]),r.notas,r.status,r.grade.label,r.grade.total,r.grade.withNote,r.grade.withoutNote,r.grade.ratio===null?null:Math.round(r.grade.ratio*10)/10,gradeSourceLabel(r.grade),r.grade.source,gradeReason(r.grade),r.grade.withoutNote>0?(r.grade.reasonConfirmed?'Sim':'Nao'):'Nao se aplica']);
 const csvCell=v=>{if(v===null||v===undefined)return '""';let t=typeof v==='number'?String(v).replace('.',','):String(v);if(typeof v!=='number'&&/^[\s]*[=+@-]/.test(t)&&t!=='-')t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};
 const csv='\ufeff'+[h,...data].map(line=>line.map(csvCell).join(';')).join('\r\n');
 downloadFile('DED_'+schoolFileStem()+'_'+state.page+'_2026.csv',csv,'text/csv;charset=utf-8');toast(rows.length+' registros exportados com previstas, registradas e origem do c\u00e1lculo.');
}
function exportConfig(){downloadFile('DED_'+schoolFileStem()+'_parametros_2026.json',JSON.stringify(cfg,null,2),'application/json;charset=utf-8');toast('Par\u00e2metros exportados. Os registros do DED n\u00e3o foram alterados.');}
function saveHTML(){const clone=document.documentElement.cloneNode(true);clone.querySelector('#embedded-config').textContent=JSON.stringify(cfg).replace(/</g,'\\u003c');clone.querySelector('#embedded-data-store').textContent=JSON.stringify(dataStore).replace(/</g,'\\u003c');clone.querySelectorAll('dialog').forEach(d=>{d.removeAttribute('open');d.innerHTML='';});clone.querySelector('#toast').classList.remove('visible');downloadFile('DED_em_foco_'+schoolFileStem()+'_com_ajustes.html','<!DOCTYPE html>\n'+clone.outerHTML,'text/html;charset=utf-8');toast('C\u00f3pia HTML criada com parâmetros, planilhas substituídas e histórico semanal incorporados.');}
async function replaceReport(file,period){
 const rows=await parseTeacherReport(file,period==='1'?'t':'r');
 if(period==='1'){dataStore.t1=rows;DATA.raw_t1=rows;}else{dataStore.t2=rows;DATA.raw=rows;}
 rebuildConsolidated();saveDataStore();RAW=getActiveRaw();syncFilterOptions();render();toast(`${period}º trimestre atualizado com ${rows.length} registros.`);
}
async function addWeeklyReport(file){
 const date=document.getElementById('weekly-date')?.value;if(!date)throw new Error('Informe a data de referência da atualização.');if(date<'2026-09-10'||date>'2026-12-18')throw new Error('A data deve estar dentro do 3º trimestre: 10/09 a 18/12/2026.');
 const rows=await parseTeacherReport(file,'w'),snapshot={date,intervalDays:0,daysToDate:officialDaysThrough(date),fileName:file.name,importedAt:Date.now(),rows};
 const same=dataStore.weeklySnapshots.findIndex(s=>s.date===date);if(same>=0)dataStore.weeklySnapshots[same]=snapshot;else dataStore.weeklySnapshots.push(snapshot);recalcSnapshotCalendar();DATA.raw_t3=dataStore.weeklySnapshots.at(-1).rows;saveDataStore();state.trimester='3';state.weeklySelected.clear();RAW=getActiveRaw();syncFilterOptions();render();toast(dataStore.weeklySnapshots.length===1?`Primeira atualização avaliada desde 10/09/2026 com ${dataStore.weeklySnapshots[0].intervalDays} dia(s) letivo(s).`:`Atualização semanal incluída com ${rows.length} registros lógicos.`);
}
let pendingImport=null;
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
 if(a==='nav'){if(el.dataset.page==='teachers'){state.mode='all';state.teacherGradeMode='all';}switchPage(el.dataset.page);}
 else if(a==='section-jump'){const target=document.getElementById(el.dataset.target);if(target){target.setAttribute('tabindex','-1');target.scrollIntoView({behavior:'smooth',block:'start'});target.focus({preventScroll:true});}}
 else if(a==='compare-class'){state.comparisonA=state.selectedClass||state.classId||'';state.comparisonB='';switchPage('compare');}
 else if(a==='trimester'){state.trimester=el.dataset.trimester;RAW=getActiveRaw();if(document.getElementById('trimester-filter'))document.getElementById('trimester-filter').value=state.trimester;syncFilterOptions();if(state.trimester==='all')switchPage('consolidated');else if(state.page==='consolidated')switchPage('overview');else render();}
 else if(a==='clear'){state.stage='';state.matrixGroup='';state.classId='';state.teacher='';state.query='';state.mode='all';state.gradeMode='all';state.gradePage=0;state.teacherGradeMode='all';state.expanded.clear();syncFilterOptions();render();}
 else if(a==='print')window.print();
 else if(a==='print-all-teachers')printAllTeachers();
 else if(a==='weekly-print-summary')beginWeeklyPrint('summary');
 else if(a==='weekly-print-teacher')beginWeeklyPrint('teachers',[el.dataset.teacher]);
 else if(a==='weekly-print-selected')beginWeeklyPrint('teachers',[...state.weeklySelected]);
 else if(a==='weekly-clear-selection'){state.weeklySelected.clear();render();}
 else if(a==='weekly-select-all'){const names=weeklyTeacherGroups().filter(g=>g.below.length).map(g=>g.name);state.weeklySelected=new Set(names);render();}
 else if(a==='export')exportCSV();
 else if(a==='teacher'){state.teacher=el.dataset.teacher;state.mode='all';syncFilterOptions();state.expanded.add(state.teacher);switchPage('teachers');}
 else if(a==='expand'){const n=el.dataset.teacher;if(state.expanded.has(n))state.expanded.delete(n);else state.expanded.add(n);const y=window.scrollY;render();window.scrollTo({top:y,behavior:'instant'});const target=[...document.querySelectorAll('[data-action="expand"]')].find(x=>x.dataset.teacher===n);target?.focus({preventScroll:true});}
 else if(a==='mode'){state.mode=el.dataset.mode;render();}
 else if(a==='class'){state.selectedClass=el.dataset.class;render();}
 else if(a==='grade-page'){state.gradePage=Math.max(0,state.gradePage+Number(el.dataset.step));render();document.querySelector('.grades-table')?.scrollIntoView({block:'start'});}
 else if(a==='record')openRecord(el.dataset.id);
 else if(a==='grade-record')openGradeRecord(el.dataset.id);
 else if(a==='reset-grades'){const onlyGrades=document.getElementById('record-dialog').dataset.view==='grades';delete cfg.gradeOverrides[el.dataset.id];const saved=saveConfig();render();if(onlyGrades)openGradeRecord(el.dataset.id);else openRecord(el.dataset.id);document.getElementById('record-grades').scrollIntoView({block:'start'});if(saved)toast('Apontamento original de notas restaurado.');}
 else if(a==='close-dialog')document.getElementById('record-dialog').close();
 else if(a==='save-expected')saveExpected(el.dataset.id);
 else if(a==='clear-expected'){delete cfg.expected[el.dataset.id];if(saveConfig())toast('A linha voltou a usar a refer\u00eancia semanal, quando dispon\u00edvel.');document.getElementById('record-dialog').close();render();}
 else if(a==='save-school'){const name=document.getElementById('school-name')?.value.trim()||'';if(!name){toast('Informe o nome da escola.');document.getElementById('school-name')?.focus();return;}cfg.school={name,code:document.getElementById('school-code')?.value.trim()||'',city:document.getElementById('school-city')?.value.trim()||'',sre:document.getElementById('school-sre')?.value.trim()||'',responsible:document.getElementById('school-responsible')?.value.trim()||''};if(saveConfig())toast('Identificação da escola salva.');render();}
 else if(a==='calendar-remove'){const d=document.getElementById('calendar-remove-date')?.value||'';if(!d){toast('Selecione a data a excluir.');return;}cfg.calendarRemoved=[...new Set([...(cfg.calendarRemoved||[]),d])].sort();cfg.calendarAdded=(cfg.calendarAdded||[]).filter(x=>x!==d);recalcSnapshotCalendar();if(saveConfig())toast('Data excluída do calendário efetivo.');render();}
 else if(a==='calendar-add'){const d=document.getElementById('calendar-add-date')?.value||'';if(!d){toast('Selecione a data de recomposição.');return;}cfg.calendarAdded=[...new Set([...(cfg.calendarAdded||[]),d])].sort();cfg.calendarRemoved=(cfg.calendarRemoved||[]).filter(x=>x!==d);recalcSnapshotCalendar();if(saveConfig())toast('Data adicionada ao calendário efetivo.');render();}
 else if(a==='calendar-clear'){cfg.calendarAdded=[];cfg.calendarRemoved=[];recalcSnapshotCalendar();if(saveConfig())toast('Ajustes locais do calendário removidos.');render();}
 else if(a==='apply-days'){const input=document.getElementById('reference-days');if(!input.reportValidity())return;const v=Number(input.value);if(!integer(v)||v<1||v>200){toast('Use um n\u00famero inteiro de dias entre 1 e 200.');return;}cfg.days=v;if(saveConfig())toast('Dias aplicados. Todas as estimativas foram recalculadas.');render();}
 else if(a==='save-html')saveHTML();
 else if(a==='export-config')exportConfig();
 else if(a==='export-data-backup')exportDataBackup();
 else if(a==='import-config')document.getElementById('import-settings').click();
 else if(a==='reset-config')askConfirm('Restaurar refer\u00eancias originais?','Isso remove as previs\u00f5es espec\u00edficas e as cargas semanais ajustadas deste painel, e volta às referências curriculares incorporadas. Ajustes locais de calendário também serão removidos. Os registros originais do DED n\u00e3o ser\u00e3o alterados.','confirm-reset','Restaurar');
 else if(a==='confirm-reset'){cfg={...defaultConfig(),school:cfg.school,gradeOverrides:cfg.gradeOverrides,teacherOverrides:cfg.teacherOverrides};saveConfig();document.getElementById('confirm-dialog').close();render();toast('Refer\u00eancias originais restauradas.');}
 else if(a==='cancel-confirm'){pendingImport=null;document.getElementById('confirm-dialog').close();}
 else if(a==='apply-import'){if(!pendingImport)return;cfg=pendingImport;pendingImport=null;saveConfig();document.getElementById('confirm-dialog').close();render();toast('Par\u00e2metros importados e indicadores recalculados.');}
});
