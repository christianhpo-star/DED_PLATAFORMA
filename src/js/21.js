'use strict';
// Rastreabilidade dos ajustes locais que alteram o cálculo do previsto.
let pendingWeeklyAudit=null;
let pendingCalendarAudit=null;

function auditWhen(ts){
 const n=Number(ts);if(!n)return 'data não registrada';
 const d=new Date(n);return Number.isNaN(d.getTime())?'data não registrada':d.toLocaleString('pt-BR');
}
function appendAuditEvent(event){
 cfg.auditTrail=Array.isArray(cfg.auditTrail)?cfg.auditTrail:[];
 cfg.auditTrail.push({
  type:event.type,
  target:auditText(event.target,240),
  value:event.value??null,
  originalValue:event.originalValue??null,
  reason:auditText(event.reason),
  source:auditText(event.source,500),
  updatedAt:Number(event.updatedAt)||Date.now(),
  legacy:!!event.legacy
 });
 if(cfg.auditTrail.length>1500)cfg.auditTrail=cfg.auditTrail.slice(-1500);
}
function weeklyAuditMeta(key){return cfg.weeklyAudit?.[key]||null;}
function auditTypeLabel(type){
 return {calendar_add:'Data adicionada',calendar_remove:'Data excluída',calendar_restore:'Calendário restaurado',weekly_override:'Carga semanal ajustada',weekly_restore:'Carga semanal restaurada'}[type]||type;
}
function originalWeeklyLabel(value){return value===null||value===undefined?'sem referência documental':moneyless(value)+' A/S';}
function referenceOriginCell(key,ref,value){
 const custom=Object.hasOwn(cfg.weekly,key),meta=weeklyAuditMeta(key);
 if(!custom)return badge(value===null?'Sem referência documental':'Referência documental',value===null?'warn':'good')+'<div class="source-text">'+esc(ref.source||'Fonte documental não informada.')+'</div>';
 const original=meta?.originalWeekly??ref.weekly??null;
 const legacy=!!meta?.legacy;
 return badge('Ajuste local','info')+
  '<div class="source-text"><strong>Valor usado:</strong> '+esc(value===null?'sem referência local':moneyless(value)+' A/S')+
  ' · <strong>original:</strong> '+esc(originalWeeklyLabel(original))+'</div>'+
  '<details class="reference-audit-details"><summary>Ver rastreabilidade</summary><div><p><strong>Fonte informada:</strong> '+esc(meta?.source||'não registrada')+'</p><p><strong>Justificativa:</strong> '+esc(meta?.reason||'não registrada')+'</p><p><strong>Alterado em:</strong> '+esc(auditWhen(meta?.updatedAt))+'</p>'+
  (legacy?'<p>'+badge('Legado sem rastreabilidade completa','warn')+'</p>':'')+
  '<p class="audit-warning">Este ajuste é local e não transforma a fonte informada em referência oficial.</p>'+
  btn('Restaurar valor documental','restore-weekly-reference','data-reference-key="'+esc(key)+'"','btn-small btn-quiet')+'</div></details>';
}
function auditLatestForCalendar(type,date){
 const targetType=type==='add'?'calendar_add':'calendar_remove';
 return (cfg.auditTrail||[]).slice().reverse().find(e=>e.type===targetType&&e.target===date)||null;
}
function calendarAuditPanel(added,removed){
 const active=[
  ...removed.map(date=>({date,type:'remove',audit:auditLatestForCalendar('remove',date)})),
  ...added.map(date=>({date,type:'add',audit:auditLatestForCalendar('add',date)}))
 ].sort((a,b)=>a.date.localeCompare(b.date));
 if(!active.length)return '<div class="audit-empty">'+icon('check')+'<span>Nenhum ajuste local ativo no calendário.</span></div>';
 return '<div class="calendar-audit-list"><div class="audit-list-head"><strong>Ajustes locais ativos</strong><span>Alteram os dias usados no cálculo do previsto.</span></div>'+
  active.map(item=>{
   const a=item.audit;
   return '<article class="calendar-audit-item"><div><strong>'+esc(formatDateBR(item.date))+'</strong>'+badge(item.type==='add'?'Adicionada localmente':'Excluída localmente',item.type==='add'?'info':'warn')+'</div>'+
    '<p><strong>Motivo:</strong> '+esc(a?.reason||'não registrado')+'</p><p><strong>Fonte:</strong> '+esc(a?.source||'não registrada')+'</p><p><strong>Alteração:</strong> '+esc(auditWhen(a?.updatedAt))+(a?.legacy?' · legado':'')+'</p></article>';
  }).join('')+'</div>';
}
function auditTrailPanel(){
 const trail=(cfg.auditTrail||[]).slice().reverse();
 if(!trail.length)return '<section class="card audit-history-card"><div class="card-head"><div><h2>Histórico de ajustes que alteram cálculo</h2><p class="sub">Nenhum ajuste auditável foi registrado.</p></div>'+badge('Sem alterações','good')+'</div></section>';
 return '<section class="card audit-history-card"><div class="card-head"><div><h2>Histórico de ajustes que alteram cálculo</h2><p class="sub">Registro local de calendário e cargas semanais. Fontes informadas em ajustes locais não são promovidas a documentos oficiais.</p></div>'+badge(trail.length+' evento(s)','info')+'</div><details class="audit-history-details"><summary>Ver histórico</summary><div class="table-wrap"><table class="data-table"><thead><tr><th>Alteração</th><th>Alvo</th><th>Motivo</th><th>Fonte / referência</th><th>Quando</th></tr></thead><tbody>'+
  trail.slice(0,100).map(e=>'<tr><td>'+badge(auditTypeLabel(e.type),e.type.includes('restore')?'good':e.legacy?'warn':'info')+'</td><td>'+esc(e.target)+'</td><td>'+esc(e.reason)+'</td><td>'+esc(e.source)+(e.legacy?'<small>Registro legado; fonte original não comprovada.</small>':'')+'</td><td>'+esc(auditWhen(e.updatedAt))+'</td></tr>').join('')+
  '</tbody></table></div></details></section>';
}
function rerenderSettingsPreservingReferenceScroll(){
 const y=window.scrollY,sc=document.querySelector('.reference-scroll')?.scrollTop||0;
 render();window.scrollTo({top:y,behavior:'instant'});
 const wrap=document.querySelector('.reference-scroll');if(wrap)wrap.scrollTop=sc;
}
function closeAuditDialog(){
 pendingWeeklyAudit=null;pendingCalendarAudit=null;
 const d=document.getElementById('confirm-dialog');if(d?.open)d.close();
}
function requestWeeklyReferenceChange(key,value){
 const ref=DATA.refs[key];if(!ref)return;
 const current=weeklyFor({refKey:key}),original=ref.weekly??null;
 if(value===current){rerenderSettingsPreservingReferenceScroll();return;}
 if(Object.hasOwn(cfg.weekly,key)&&value===original){requestWeeklyReferenceRestore(key);return;}
 pendingWeeklyAudit={key,value,original,current};
 const d=document.getElementById('confirm-dialog');
 d.innerHTML='<form id="weekly-audit-form"><div class="dialog-head"><div><div class="eyebrow muted">AJUSTE LOCAL DE CARGA SEMANAL</div><h2 id="confirm-title">'+esc(title(ref.component))+'</h2><p class="sub">'+esc(refLabels[ref.bucket]||ref.bucket)+'</p></div>'+btn(icon('close'),'cancel-audit-dialog','aria-label="Cancelar"','icon-btn')+'</div><div class="dialog-body">'+
  '<div class="audit-value-compare"><div><span>Referência documental</span><strong>'+esc(originalWeeklyLabel(original))+'</strong></div><div><span>Novo valor local</span><strong>'+esc(value===null?'sem referência local':moneyless(value)+' A/S')+'</strong></div></div>'+
  '<div class="notice warning tight">'+icon('info')+'<div class="text"><strong>Este valor substituirá localmente a referência usada no cálculo.</strong> Ele não será tratado como fonte oficial e o valor documental original continuará recuperável.</div></div>'+
  '<div class="field"><label for="weekly-audit-reason">Justificativa do ajuste</label><textarea id="weekly-audit-reason" maxlength="1000" required placeholder="Ex.: horário homologado da turma difere da matriz incorporada."></textarea></div>'+
  '<div class="field"><label for="weekly-audit-source">Fonte / referência utilizada</label><input id="weekly-audit-source" maxlength="500" required placeholder="Ex.: horário homologado da turma, documento interno de 15/09/2026"></div>'+
  '</div><div class="dialog-foot"><span class="muted">Ajuste local · rastreabilidade obrigatória</span><div class="inline-actions">'+btn('Cancelar','cancel-audit-dialog')+'<button type="submit" class="btn btn-primary">Aplicar ajuste local</button></div></div></form>';
 if(d.open)d.close();d.showModal();
}
function applyWeeklyReferenceChange(){
 if(!pendingWeeklyAudit)return;
 const reason=auditText(document.getElementById('weekly-audit-reason')?.value),source=auditText(document.getElementById('weekly-audit-source')?.value,500);
 if(!reason||!source){toast('Informe a justificativa e a fonte do ajuste.');return;}
 const {key,value,original}=pendingWeeklyAudit,now=Date.now();
 cfg.weekly[key]=value;cfg.weeklyAudit=cfg.weeklyAudit||{};
 cfg.weeklyAudit[key]={originalWeekly:original,reason,source,updatedAt:now,legacy:false};
 appendAuditEvent({type:'weekly_override',target:key,value,originalValue:original,reason,source,updatedAt:now});
 closeAuditDialog();if(saveConfig())toast('Carga semanal ajustada localmente com rastreabilidade registrada.');rerenderSettingsPreservingReferenceScroll();
}
function requestWeeklyReferenceRestore(key){
 if(!Object.hasOwn(cfg.weekly,key))return;
 const ref=DATA.refs[key],meta=weeklyAuditMeta(key),d=document.getElementById('confirm-dialog');
 d.innerHTML='<div class="dialog-head"><div><div class="eyebrow muted">RESTAURAR REFERÊNCIA DOCUMENTAL</div><h2 id="confirm-title">'+esc(title(ref?.component||key))+'</h2></div>'+btn(icon('close'),'cancel-audit-dialog','aria-label="Cancelar"','icon-btn')+'</div><div class="dialog-body"><p>O valor local <strong>'+esc(cfg.weekly[key]===null?'sem referência':moneyless(cfg.weekly[key])+' A/S')+'</strong> será removido e o painel voltará a usar <strong>'+esc(originalWeeklyLabel(ref?.weekly??meta?.originalWeekly??null))+'</strong>.</p><p class="setting-note">A restauração também ficará registrada no histórico.</p></div><div class="dialog-foot"><span></span><div class="inline-actions">'+btn('Cancelar','cancel-audit-dialog')+btn('Restaurar original','confirm-weekly-restore','data-reference-key="'+esc(key)+'"','btn-primary')+'</div></div>';
 if(d.open)d.close();d.showModal();
}
function restoreWeeklyReference(key){
 if(!Object.hasOwn(cfg.weekly,key))return;
 const previous=cfg.weekly[key],original=DATA.refs[key]?.weekly??weeklyAuditMeta(key)?.originalWeekly??null,now=Date.now();
 delete cfg.weekly[key];if(cfg.weeklyAudit)delete cfg.weeklyAudit[key];
 appendAuditEvent({type:'weekly_restore',target:key,value:original,originalValue:previous,reason:'Restauração do valor documental original incorporado.',source:DATA.refs[key]?.source||'Referência documental incorporada no template.',updatedAt:now});
 closeAuditDialog();if(saveConfig())toast('Valor documental original restaurado.');rerenderSettingsPreservingReferenceScroll();
}
function calendarFormValues(type){
 const prefix=type==='remove'?'calendar-remove':'calendar-add';
 return {date:document.getElementById(prefix+'-date')?.value||'',reason:auditText(document.getElementById(prefix+'-reason')?.value),source:auditText(document.getElementById(prefix+'-source')?.value,500)};
}
function requestCalendarAdjustment(type){
 const v=calendarFormValues(type);
 if(!auditIsoDate(v.date)){toast('Informe uma data válida de 2026.');return;}
 if(!v.reason||!v.source){toast('Informe o motivo e a fonte do ajuste de calendário.');return;}
 const effective=effectiveSchoolDays();
 if(type==='remove'&&!effective.has(v.date)){toast('Essa data já não está no calendário efetivo.');return;}
 if(type==='add'&&effective.has(v.date)){toast('Essa data já está no calendário efetivo.');return;}
 pendingCalendarAudit={type,...v};
 const d=document.getElementById('confirm-dialog'),verb=type==='add'?'Adicionar':'Excluir';
 d.innerHTML='<div class="dialog-head"><div><div class="eyebrow muted">AJUSTE LOCAL DE CALENDÁRIO</div><h2 id="confirm-title">'+verb+' '+esc(formatDateBR(v.date))+'?</h2></div>'+btn(icon('close'),'cancel-audit-dialog','aria-label="Cancelar"','icon-btn')+'</div><div class="dialog-body"><div class="notice warning tight">'+icon('info')+'<div class="text"><strong>Este ajuste altera os dias usados no cálculo das aulas previstas.</strong> A fonte informada ficará registrada como justificativa local, não como calendário oficial.</div></div><p><strong>Motivo:</strong> '+esc(v.reason)+'</p><p><strong>Fonte:</strong> '+esc(v.source)+'</p></div><div class="dialog-foot"><span></span><div class="inline-actions">'+btn('Cancelar','cancel-audit-dialog')+btn(verb+' data','confirm-calendar-audit','','btn-primary')+'</div></div>';
 if(d.open)d.close();d.showModal();
}
function applyCalendarAdjustment(){
 if(!pendingCalendarAudit)return;
 const {type,date,reason,source}=pendingCalendarAudit,now=Date.now(),wasOfficial=OFFICIAL_SCHOOL_DAYS.has(date);
 if(type==='remove'){
  cfg.calendarRemoved=[...new Set([...(cfg.calendarRemoved||[]),date])].sort();
  cfg.calendarAdded=(cfg.calendarAdded||[]).filter(x=>x!==date);
 }else{
  cfg.calendarAdded=[...new Set([...(cfg.calendarAdded||[]),date])].sort();
  cfg.calendarRemoved=(cfg.calendarRemoved||[]).filter(x=>x!==date);
 }
 appendAuditEvent({type:type==='add'?'calendar_add':'calendar_remove',target:date,value:type==='add'?'letivo local':'excluído localmente',originalValue:wasOfficial?'letivo no modelo':'não letivo no modelo',reason,source,updatedAt:now});
 closeAuditDialog();recalcSnapshotCalendar();if(saveConfig())toast(type==='add'?'Data adicionada com rastreabilidade registrada.':'Data excluída com rastreabilidade registrada.');render();
}
function requestCalendarReset(){
 if(!(cfg.calendarAdded?.length||cfg.calendarRemoved?.length)){toast('Não há ajustes locais de calendário para restaurar.');return;}
 askConfirm('Restaurar calendário-base?','Todos os ajustes locais ativos serão removidos. Cada restauração será registrada no histórico; o calendário-base incorporado voltará a ser usado.','confirm-calendar-clear-audited','Restaurar calendário');
}
function restoreCalendarModel(){
 const now=Date.now(),source='Calendário Escolar SEE/MG 2026 incorporado no template.';
 for(const d of cfg.calendarAdded||[])appendAuditEvent({type:'calendar_restore',target:d,value:OFFICIAL_SCHOOL_DAYS.has(d)?'letivo no modelo':'não letivo no modelo',originalValue:'adicionado localmente',reason:'Restauração do calendário-base incorporado.',source,updatedAt:now});
 for(const d of cfg.calendarRemoved||[])appendAuditEvent({type:'calendar_restore',target:d,value:OFFICIAL_SCHOOL_DAYS.has(d)?'letivo no modelo':'não letivo no modelo',originalValue:'excluído localmente',reason:'Restauração do calendário-base incorporado.',source,updatedAt:now});
 cfg.calendarAdded=[];cfg.calendarRemoved=[];recalcSnapshotCalendar();if(saveConfig())toast('Calendário-base restaurado e alteração registrada.');render();
}
document.addEventListener('submit',e=>{
 if(e.target.id!=='weekly-audit-form')return;
 e.preventDefault();applyWeeklyReferenceChange();
});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
 if(a==='cancel-audit-dialog'){closeAuditDialog();if(state.page==='settings')rerenderSettingsPreservingReferenceScroll();}
 else if(a==='restore-weekly-reference')requestWeeklyReferenceRestore(el.dataset.referenceKey||'');
 else if(a==='confirm-weekly-restore')restoreWeeklyReference(el.dataset.referenceKey||'');
 else if(a==='confirm-calendar-audit')applyCalendarAdjustment();
 else if(a==='confirm-calendar-clear-audited'){document.getElementById('confirm-dialog')?.close();restoreCalendarModel();}
});
window.DED_REFERENCE_AUDIT=Object.freeze({appendAuditEvent,referenceOriginCell,calendarAuditPanel,auditTrailPanel,requestWeeklyReferenceChange,restoreWeeklyReference,requestCalendarAdjustment,restoreCalendarModel});
