'use strict';
// Fluxo transacional de importação: selecionar -> validar -> prévia -> confirmar -> aplicar -> desfazer.
const SAFE_IMPORT_RESTORE_KEY=`${DATA_STORE_KEY}:last-import-restore-v1`;
let safeImportStage=null;
let safeImportBusy=false;
function safeClone(value){return JSON.parse(JSON.stringify(value));}
const SAFE_IMPORT_EMBEDDED_BASE={t1:dataStore.t1===null?safeClone(DATA.raw_t1||[]):null,t2:dataStore.t2===null?safeClone(DATA.raw||[]):null};
function importStatusHost(){
 let host=document.getElementById('import-status');
 if(!host){host=document.createElement('div');host.id='import-status';host.className='import-status-host';host.setAttribute('aria-live','polite');document.getElementById('view')?.before(host);}
 return host;
}
function setImportStatus(kind,titleText,detail='',actionHtml=''){
 const host=importStatusHost();if(!host)return;
 const dismiss=kind==='error'?btn('Fechar aviso','dismiss-import-status','','btn-small btn-quiet'):'';
 const actions=actionHtml||dismiss?`<div class="import-status-actions">${actionHtml}${dismiss}</div>`:'';
 host.innerHTML=`<div class="import-status ${esc(kind)}" role="${kind==='error'?'alert':'status'}"><div><strong>${esc(titleText)}</strong>${detail?`<span>${esc(detail)}</span>`:''}</div>${actions}</div>`;
}
function clearImportStatus(){const host=document.getElementById('import-status');if(host)host.innerHTML='';}
function setDataOperationBusy(busy){
 safeImportBusy=!!busy;
 document.querySelectorAll('#replace-t1-file,#replace-t2-file,#weekly-file,#restore-data-backup-file').forEach(el=>{el.disabled=!!busy;el.setAttribute('aria-busy',busy?'true':'false');});
 document.querySelectorAll('[data-action="restore-data-backup"]').forEach(el=>{el.disabled=!!busy;});
}
function setImportStep(step,titleText,detail=''){setImportStatus('working',titleText,`Etapa ${step} de 6 · ${detail}`);}
function nextImportPaint(){return new Promise(resolve=>requestAnimationFrame(()=>resolve()));}
function importRecoveryHint(message){
 const m=normalize(message||'');
 if(m.includes('cabecalho')||m.includes('relatorio de lancamentos'))return 'Próximo passo: selecione o Relatório de Lançamentos do Professor em formato XLSX, sem alterar os cabeçalhos.';
 if(m.includes('modalidade')||m.includes('turno'))return 'Próximo passo: confira no arquivo se REG está no turno NOITE e INT no turno INTEGRAL.';
 if(m.includes('xlsx valido')||m.includes('estrutura zip')||m.includes('xml interno'))return 'Próximo passo: gere novamente o XLSX no sistema de origem e tente com o arquivo sem edição intermediária.';
 if(m.includes('guardar')||m.includes('salv')||m.includes('armazen'))return 'Próximo passo: libere espaço do navegador ou exporte uma cópia/backup antes de tentar novamente.';
 return 'Próximo passo: confira o arquivo e os dados indicados na mensagem; a base atual não foi alterada.';
}
function candidateHasWeekly(r,refs){
 if(Object.hasOwn(cfg.weekly||{},r.refKey))return cfg.weekly[r.refKey]!==null;
 const v=refs?.[r.refKey]?.weekly;return v!==null&&v!==undefined;
}
function importSummary(rows,refs){
 const lessons=rows.filter(r=>r.unit==='aulas'&&!r.monitoringExcluded);
 const missingReference=lessons.filter(r=>!candidateHasWeekly(r,refs));
 return {
  records:rows.length,
  teachers:unique(rows.map(r=>r.professor)),
  classes:unique(rows.map(r=>r.cod_turma)),
  missingReferences:unique(missingReference.map(r=>`${r.shortClass} · ${r.componente}`)),
  teacherConflicts:rows.filter(r=>r.teacherConflict),
  dataConflicts:rows.filter(r=>r.dataConflict),
  duplicates:rows.filter(r=>(r.duplicateSourceRows||1)>1)
 };
}
function validateImportCandidate(candidate){
 if(!candidate?.fileName||!Array.isArray(candidate.rows)||!candidate.rows.length)throw new Error('A planilha não produziu registros válidos para a prévia.');
 if(!['1','2','weekly'].includes(candidate.target))throw new Error('Destino de importação inválido.');
 if(candidate.target==='weekly'){
  if(!candidate.date)throw new Error('Informe a data de referência da atualização.');
  if(candidate.date<'2026-09-10'||candidate.date>'2026-12-18')throw new Error('A data deve estar dentro do 3º trimestre: 10/09 a 18/12/2026.');
 }
 return candidate;
}
function importTargetLabel(candidate){
 if(candidate.target==='1')return '1º trimestre';
 if(candidate.target==='2')return '2º trimestre';
 return `3º trimestre · ${formatDateBR(candidate.date)}`;
}
function buildImportPreview(candidate){
 const s=candidate.summary,replace=candidate.target!=='weekly'||candidate.replacesExisting;
 const warnings=[];
 if(s.missingReferences.length)warnings.push(`${s.missingReferences.length} componente(s) sem referência semanal suficiente.`);
 if(s.teacherConflicts.length)warnings.push(`${s.teacherConflicts.length} diário(s) com professor responsável a confirmar.`);
 if(s.dataConflicts.length)warnings.push(`${s.dataConflicts.length} duplicidade(s) com dados divergentes.`);
 if(s.duplicates.length)warnings.push(`${s.duplicates.length} diário(s) resultaram da consolidação de linhas duplicadas.`);
 const warningHtml=warnings.length?`<div class="import-preview-warnings"><strong>Avisos para conferência</strong><ul>${warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></div>`:`<div class="import-preview-ok">${icon('check')} Nenhum aviso estrutural adicional foi encontrado.</div>`;
 const d=document.getElementById('confirm-dialog');
 d.innerHTML=`<div class="dialog-head"><div><div class="eyebrow muted">PRÉVIA DA IMPORTAÇÃO</div><h2 id="confirm-title">${esc(importTargetLabel(candidate))}</h2><p class="sub">Revise antes de alterar a base local.</p></div>${btn(icon('close'),'cancel-staged-import','aria-label="Cancelar importação"','icon-btn')}</div><div class="dialog-body"><div class="import-preview-file"><strong>${esc(candidate.fileName)}</strong><span>Lido em ${esc(new Date(candidate.readAt).toLocaleString('pt-BR'))}</span></div><div class="import-preview-grid"><div><span>Registros lógicos</span><strong>${s.records}</strong></div><div><span>Professores</span><strong>${s.teachers.length}</strong></div><div><span>Turmas</span><strong>${s.classes.length}</strong></div><div><span>Sem referência</span><strong>${s.missingReferences.length}</strong></div></div>${warningHtml}<div class="notice ${replace?'warning':'neutral'} tight">${icon('info')}<div class="text"><strong>${replace?'Esta confirmação substitui dados já existentes.':'Esta confirmação adiciona uma nova atualização semanal.'}</strong> ${candidate.target==='weekly'&&candidate.replacesExisting?'Já existe um snapshot nesta data; a versão anterior será preservada para desfazer.':'Antes de aplicar, o painel cria um ponto local de restauração da versão atual.'}</div></div><p class="setting-note">Cancelar fecha esta prévia sem modificar os dados persistidos. Nenhum dado é enviado para a internet.</p></div><div class="dialog-foot"><span class="muted" style="font-size:11px">Validação concluída · aguardando confirmação</span><div class="inline-actions">${btn('Cancelar','cancel-staged-import')}${btn(replace?'Confirmar substituição':'Confirmar atualização','confirm-staged-import','','btn-primary')}</div></div>`;
 if(d.open)d.close();d.showModal();
 return candidate;
}
async function stageImport(file,target,date=''){
 setImportStep(1,'Lendo arquivo',file.name);await nextImportPaint();
 const refsBefore=safeClone(DATA.refs);let rows,candidateRefs;
 try{
  setImportStep(2,'Validando estrutura','Conferindo formato, cabeçalhos, modalidade e turno.');
  rows=await parseTeacherReport(file,target==='1'?'t':target==='2'?'r':'w');
  candidateRefs=safeClone(DATA.refs);
 }finally{DATA.refs=refsBefore;}
 setImportStep(3,'Conferindo turmas e componentes','Identificando registros lógicos, referências e conflitos.');await nextImportPaint();
 const candidate={target,date,fileName:file.name,fileSize:file.size,readAt:Date.now(),rows,refs:candidateRefs,replacesExisting:target==='weekly'?dataStore.weeklySnapshots.some(s=>s.date===date):true};
 candidate.summary=importSummary(rows,candidateRefs);validateImportCandidate(candidate);safeImportStage=candidate;
 setImportStep(4,'Preparando prévia','Nenhum dado foi aplicado; revise o resumo antes de confirmar.');await nextImportPaint();
 return buildImportPreview(candidate);
}
async function queueSafeImport(file,target){
 if(safeImportBusy){setImportStatus('working','Operação em andamento','Conclua ou cancele a operação atual antes de selecionar outro arquivo.');return;}
 setDataOperationBusy(true);
 try{
  const date=target==='weekly'?document.getElementById('weekly-date')?.value||'':'';
  await stageImport(file,target,date);
 }catch(err){
  safeImportStage=null;setDataOperationBusy(false);
  const message=err?.message||'Não foi possível validar o arquivo.';
  setImportStatus('error','Planilha não aplicada',message+' '+importRecoveryHint(message));
 }
}
function createLocalRestorePoint(reason){
 const point={version:1,createdAt:Date.now(),reason,dataStore:safeClone(dataStore),refs:safeClone(DATA.refs)};
 try{localStorage.setItem(SAFE_IMPORT_RESTORE_KEY,JSON.stringify(point));return point;}catch(e){throw new Error('Não foi possível criar o ponto de restauração local. A base atual foi preservada.');}
}
function readLocalRestorePoint(){try{const p=JSON.parse(localStorage.getItem(SAFE_IMPORT_RESTORE_KEY)||'null');return p&&p.version===1&&p.dataStore?p:null;}catch(e){return null;}}
function hydrateDataStore(store,refs){
 dataStore={t1:Array.isArray(store?.t1)?store.t1:null,t2:Array.isArray(store?.t2)?store.t2:null,weeklySnapshots:Array.isArray(store?.weeklySnapshots)?store.weeklySnapshots:[]};
 if(refs&&typeof refs==='object')DATA.refs=safeClone(refs);
 DATA.raw_t1=dataStore.t1===null?safeClone(SAFE_IMPORT_EMBEDDED_BASE.t1||[]):dataStore.t1;DATA.raw=dataStore.t2===null?safeClone(SAFE_IMPORT_EMBEDDED_BASE.t2||[]):dataStore.t2;recalcSnapshotCalendar();DATA.raw_t3=dataStore.weeklySnapshots.length?dataStore.weeklySnapshots.at(-1).rows:[];
 normalizeEmbeddedRows(DATA.raw_t1);normalizeEmbeddedRows(DATA.raw);normalizeEmbeddedRows(DATA.raw_t3);rebuildConsolidated();RAW=getActiveRaw();
}
function commitImport(candidate=safeImportStage){
 if(!candidate)return;
 validateImportCandidate(candidate);
 setImportStep(5,'Aplicando atualização','Criando ponto de restauração e gravando a base somente após sua confirmação.');
 const beforeStore=safeClone(dataStore),beforeRefs=safeClone(DATA.refs);
 createLocalRestorePoint(`Antes de ${importTargetLabel(candidate)} · ${candidate.fileName}`);
 DATA.refs=safeClone(candidate.refs);
 if(candidate.target==='1')dataStore.t1=safeClone(candidate.rows);
 else if(candidate.target==='2')dataStore.t2=safeClone(candidate.rows);
 else{
  const snapshot={date:candidate.date,intervalDays:0,daysToDate:officialDaysThrough(candidate.date),fileName:candidate.fileName,importedAt:Date.now(),rows:safeClone(candidate.rows)};
  const same=dataStore.weeklySnapshots.findIndex(s=>s.date===candidate.date);if(same>=0)dataStore.weeklySnapshots[same]=snapshot;else dataStore.weeklySnapshots.push(snapshot);
 }
 hydrateDataStore(dataStore,DATA.refs);
 if(!saveDataStore()){
  hydrateDataStore(beforeStore,beforeRefs);
  try{localStorage.removeItem(SAFE_IMPORT_RESTORE_KEY);}catch(e){}
  throw new Error('A atualização não pôde ser salva neste navegador. A base anterior foi restaurada.');
 }
 if(candidate.target==='weekly'){state.trimester='3';state.weeklySelected.clear();}
 syncFilterOptions();render();
 const label=importTargetLabel(candidate),detail=candidate.target==='weekly'?(candidate.replacesExisting?'Snapshot da mesma data substituído com segurança.':'Nova atualização semanal armazenada.'):`Base do ${label} substituída com ${candidate.rows.length} registros lógicos.`;
 setImportStatus('success','Concluído',`Etapa 6 de 6 · ${detail} Ponto de restauração disponível.` ,btn('Desfazer última substituição','undo-last-import','','btn-small'));
 safeImportStage=null;setDataOperationBusy(false);const d=document.getElementById('confirm-dialog');if(d?.open)d.close();
}
function undoLastImport(){
 const point=readLocalRestorePoint();if(!point){setImportStatus('error','Não há substituição para desfazer','O ponto de restauração local não está mais disponível.');return;}
 const currentStore=safeClone(dataStore),currentRefs=safeClone(DATA.refs);
 hydrateDataStore(point.dataStore,point.refs);
 if(!saveDataStore()){
  hydrateDataStore(currentStore,currentRefs);
  setImportStatus('error','Não foi possível desfazer','O navegador recusou a gravação. A versão atual foi mantida.');return;
 }
 try{localStorage.removeItem(SAFE_IMPORT_RESTORE_KEY);}catch(e){}
 syncFilterOptions();render();setImportStatus('success','Substituição desfeita','A versão anterior da base foi restaurada.');
}
function cancelStagedImport(){safeImportStage=null;setDataOperationBusy(false);const d=document.getElementById('confirm-dialog');if(d?.open)d.close();setImportStatus('neutral','Importação cancelada','Nenhum dado da base foi alterado.');}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 if(el.dataset.action==='confirm-staged-import'){try{commitImport();}catch(err){const message=err?.message||'Falha ao salvar a atualização.';setImportStatus('error','Atualização não aplicada',message+' '+importRecoveryHint(message));}}
 else if(el.dataset.action==='cancel-staged-import')cancelStagedImport();
 else if(el.dataset.action==='undo-last-import')undoLastImport();
 else if(el.dataset.action==='dismiss-import-status')clearImportStatus();
});
document.getElementById('confirm-dialog')?.addEventListener('close',()=>{if(safeImportStage){safeImportStage=null;setDataOperationBusy(false);}});
const existingRestore=readLocalRestorePoint();if(existingRestore)setImportStatus('neutral','Ponto de restauração disponível','A última substituição de planilha ainda pode ser desfeita.',btn('Desfazer última substituição','undo-last-import','','btn-small'));
window.DED_IMPORT_SAFETY=Object.freeze({stageImport,validateImportCandidate,buildImportPreview,commitImport,createLocalRestorePoint,undoLastImport});
