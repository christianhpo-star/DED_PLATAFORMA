'use strict';
// Navegação e gestão longitudinal dos snapshots semanais.
let weeklySnapshotMutation=null;

function weeklySnapshotContext(date=state.weeklySnapshotDate){
 const snaps=dataStore.weeklySnapshots.slice().sort((a,b)=>a.date.localeCompare(b.date));
 if(!snaps.length)return {snaps,cur:null,prev:null,index:-1,isLatest:true};
 let index=date?snaps.findIndex(s=>s.date===date):snaps.length-1;if(index<0)index=snaps.length-1;
 return {snaps,cur:snaps[index],prev:snaps[index-1]||null,index,isLatest:index===snaps.length-1};
}
function scheduledSnapshots(items){
 const sorted=items.slice().sort((a,b)=>a.date.localeCompare(b.date));
 return sorted.map((s,i)=>{const prev=sorted[i-1];return {...s,daysToDate:officialDaysThrough(s.date),intervalDays:prev?officialDaysBetween(prev.date,s.date):officialDaysThrough(s.date),_previousDate:prev?.date||'2026-09-10'};});
}
function snapshotImpact(type,date,newDate=''){
 if(!dataStore.weeklySnapshots.some(s=>s.date===date))throw new Error('Snapshot não localizado.');
 if(type==='date'){
  if(!/^2026-[0-9]{2}-[0-9]{2}$/.test(newDate)||newDate<'2026-09-10'||newDate>'2026-12-18')throw new Error('A nova data deve estar entre 10/09 e 18/12/2026.');
  if(newDate!==date&&dataStore.weeklySnapshots.some(s=>s.date===newDate))throw new Error('Já existe um snapshot nesta data.');
 }
 const keyed=dataStore.weeklySnapshots.map((s,i)=>({...safeClone(s),_snapshotKey:String(i)}));
 const before=scheduledSnapshots(keyed),target=keyed.find(s=>s.date===date);
 let changed;
 if(type==='delete')changed=keyed.filter(s=>s._snapshotKey!==target._snapshotKey);
 else changed=keyed.map(s=>s._snapshotKey===target._snapshotKey?{...s,date:newDate}:s);
 const after=scheduledSnapshots(changed),beforeBy=new Map(before.map(s=>[s._snapshotKey,s]));
 const impacts=after.filter(s=>{const b=beforeBy.get(s._snapshotKey);return !b||b.date!==s.date||b.intervalDays!==s.intervalDays||b._previousDate!==s._previousDate;}).map(s=>{const b=beforeBy.get(s._snapshotKey);return {fileName:s.fileName,dateBefore:b?.date||'',dateAfter:s.date,intervalBefore:b?.intervalDays??null,intervalAfter:s.intervalDays,previousBefore:b?._previousDate||'',previousAfter:s._previousDate};});
 return {type,date,newDate,impacts,afterSnapshots:after.map(s=>{const x={...s};delete x._snapshotKey;delete x._previousDate;return x;})};
}
function impactTable(impact){
 if(!impact.impacts.length)return '<p class="muted">Nenhum intervalo subsequente muda.</p>';
 return '<div class="table-wrap"><table class="data-table"><thead><tr><th>Snapshot afetado</th><th>Intervalo anterior</th><th>Novo intervalo</th><th class="num">Dias antes</th><th class="num">Dias depois</th></tr></thead><tbody>'+impact.impacts.map(x=>'<tr><td><strong>'+esc(x.fileName||x.dateAfter)+'</strong><div class="record-info">'+esc(formatDateBR(x.dateBefore||x.dateAfter))+' → '+esc(formatDateBR(x.dateAfter))+'</div></td><td>'+esc(formatDateBR(x.previousBefore))+' → '+esc(formatDateBR(x.dateBefore))+'</td><td>'+esc(formatDateBR(x.previousAfter))+' → '+esc(formatDateBR(x.dateAfter))+'</td><td class="num">'+moneyless(x.intervalBefore)+'</td><td class="num"><strong>'+moneyless(x.intervalAfter)+'</strong></td></tr>').join('')+'</tbody></table></div>';
}
function openWeeklySnapshotManager(date){
 const s=dataStore.weeklySnapshots.find(x=>x.date===date);if(!s)return;
 state.weeklyManageDate=date;weeklySnapshotMutation=null;
 const d=document.getElementById('confirm-dialog');
 d.innerHTML='<div class="dialog-head"><div><div class="eyebrow muted">GERENCIAR SNAPSHOT</div><h2 id="confirm-title">'+esc(formatDateBR(date))+'</h2><p class="sub">'+esc(s.fileName||'Arquivo local')+' · '+s.rows.length+' registros</p></div>'+btn(icon('close'),'close-weekly-manager','aria-label="Fechar gerenciamento"','icon-btn')+'</div><div class="dialog-body"><div class="field"><label for="manage-weekly-date">Corrigir data de referência</label><input id="manage-weekly-date" type="date" min="2026-09-10" max="2026-12-18" value="'+esc(date)+'"></div><p class="setting-note">A alteração de data pode modificar o intervalo desta semana e das semanas seguintes. O impacto será mostrado antes de aplicar.</p><div class="inline-actions weekly-manage-actions">'+btn('Ver prévia da nova data','preview-weekly-date-change','','btn-primary')+btn(icon('upload')+' Substituir arquivo','replace-weekly-snapshot-file')+btn('Excluir snapshot','preview-delete-weekly-snapshot','','btn-danger')+'</div></div><div class="dialog-foot"><span class="muted" style="font-size:11px">Toda alteração cria ponto de restauração.</span>'+btn('Fechar','close-weekly-manager')+'</div>';
 if(d.open)d.close();d.showModal();
}
function showWeeklyMutationPreview(impact){
 weeklySnapshotMutation=impact;const d=document.getElementById('confirm-dialog');
 const titleText=impact.type==='delete'?'Excluir snapshot de '+formatDateBR(impact.date)+'?':'Alterar '+formatDateBR(impact.date)+' para '+formatDateBR(impact.newDate)+'?';
 const action=impact.type==='delete'?'Excluir snapshot':'Confirmar nova data';
 d.innerHTML='<div class="dialog-head"><div><div class="eyebrow muted">IMPACTO NO HISTÓRICO</div><h2 id="confirm-title">'+esc(titleText)+'</h2><p class="sub">Confira os intervalos que serão recalculados antes de aplicar.</p></div>'+btn(icon('close'),'cancel-weekly-mutation','aria-label="Cancelar alteração"','icon-btn')+'</div><div class="dialog-body">'+impactTable(impact)+'<div class="notice warning tight">'+icon('info')+'<div class="text"><strong>Os resultados semanais dessas versões serão reconstruídos com os novos intervalos.</strong> A versão atual será preservada para desfazer.</div></div></div><div class="dialog-foot"><span class="muted" style="font-size:11px">'+impact.impacts.length+' snapshot(s) com intervalo/data afetado(s)</span><div class="inline-actions">'+btn('Cancelar','cancel-weekly-mutation')+btn(action,'confirm-weekly-mutation','','btn-primary')+'</div></div>';
 if(d.open)d.close();d.showModal();
}
function applyWeeklySnapshotMutation(impact=weeklySnapshotMutation){
 if(!impact)return;
 const beforeStore=safeClone(dataStore),beforeRefs=safeClone(DATA.refs);let previousRestore=null;try{previousRestore=localStorage.getItem(SAFE_IMPORT_RESTORE_KEY);}catch(e){}
 createLocalRestorePoint(impact.type==='delete'?'Antes de excluir snapshot '+impact.date:'Antes de alterar data do snapshot '+impact.date);
 dataStore.weeklySnapshots=safeClone(impact.afterSnapshots);hydrateDataStore(dataStore,DATA.refs);
 if(!saveDataStore()){
  hydrateDataStore(beforeStore,beforeRefs);
  try{if(previousRestore===null)localStorage.removeItem(SAFE_IMPORT_RESTORE_KEY);else localStorage.setItem(SAFE_IMPORT_RESTORE_KEY,previousRestore);}catch(e){}
  throw new Error('A alteração não pôde ser salva. O histórico anterior foi restaurado.');
 }
 if(impact.type==='date'&&state.weeklySnapshotDate===impact.date)state.weeklySnapshotDate=impact.newDate;
 if(impact.type==='delete'&&state.weeklySnapshotDate===impact.date)state.weeklySnapshotDate='';
 weeklySnapshotMutation=null;state.weeklyManageDate='';syncFilterOptions();render();
 const d=document.getElementById('confirm-dialog');if(d?.open)d.close();
 setImportStatus('success','Histórico atualizado',impact.type==='delete'?'Snapshot excluído e intervalos subsequentes recalculados.':'Data corrigida e intervalos afetados recalculados.',btn('Desfazer última alteração','undo-last-import','','btn-small'));
}
function closeWeeklyManager(){weeklySnapshotMutation=null;state.weeklyManageDate='';const d=document.getElementById('confirm-dialog');if(d?.open)d.close();}
function scrollToWeeklyReport(){requestAnimationFrame(()=>document.getElementById('weekly-report-current')?.scrollIntoView({behavior:'smooth',block:'start'}));}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
 if(a==='view-weekly-snapshot'){state.weeklySnapshotDate=el.dataset.date||'';state.weeklySelected.clear();render();scrollToWeeklyReport();}
 else if(a==='weekly-latest'){state.weeklySnapshotDate='';state.weeklySelected.clear();render();scrollToWeeklyReport();}
 else if(a==='print-weekly-snapshot'){state.weeklySnapshotDate=el.dataset.date||'';state.weeklySelected.clear();render();beginWeeklyPrint('summary');}
 else if(a==='export-weekly-snapshot'){const before=state.weeklySnapshotDate;state.weeklySnapshotDate=el.dataset.date||'';exportWeeklyCSV();state.weeklySnapshotDate=before;}
 else if(a==='manage-weekly-snapshot')openWeeklySnapshotManager(el.dataset.date||'');
 else if(a==='close-weekly-manager')closeWeeklyManager();
 else if(a==='preview-weekly-date-change'){try{const next=document.getElementById('manage-weekly-date')?.value||'';showWeeklyMutationPreview(snapshotImpact('date',state.weeklyManageDate,next));}catch(err){setImportStatus('error','Data não alterada',err.message);}}
 else if(a==='preview-delete-weekly-snapshot'){try{showWeeklyMutationPreview(snapshotImpact('delete',state.weeklyManageDate));}catch(err){setImportStatus('error','Snapshot não excluído',err.message);}}
 else if(a==='cancel-weekly-mutation')closeWeeklyManager();
 else if(a==='confirm-weekly-mutation'){try{applyWeeklySnapshotMutation();}catch(err){setImportStatus('error','Histórico não alterado',err.message);}}
 else if(a==='replace-weekly-snapshot-file'){const d=document.getElementById('confirm-dialog');if(d?.open)d.close();document.getElementById('manage-weekly-file')?.click();}
});
document.addEventListener('change',async e=>{
 const el=e.target;if(el.id!=='manage-weekly-file')return;
 const file=el.files?.[0];if(!file)return;const date=state.weeklyManageDate;
 try{await queueSafeImport(file,'weekly',date);}finally{el.value='';}
});
window.DED_WEEKLY_HISTORY=Object.freeze({weeklySnapshotContext,snapshotImpact,scheduledSnapshots,applyWeeklySnapshotMutation});
