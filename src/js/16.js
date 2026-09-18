'use strict';
// Backup/restauração de planilhas e snapshots; parâmetros locais ficam fora deste arquivo.
const DATA_BACKUP_VERSION=2;
let backupRestoreStage=null;

function backupDataStorePayload(){
 return {version:DATA_BACKUP_VERSION,datasetId:DATA.datasetId,school:schoolProfile(),exportedAt:new Date().toISOString(),dataStore:safeClone(dataStore),refs:safeClone(DATA.refs)};
}
function exportDataBackup(){
 downloadFile('DED_'+schoolFileStem()+'_backup_planilhas.json',JSON.stringify(backupDataStorePayload(),null,2),'application/json;charset=utf-8');
 setImportStatus('success','Backup criado','O arquivo contém as bases importadas e o histórico semanal deste navegador. Guarde-o em local seguro.');
}
function validBackupRow(r){return !!(r&&typeof r==='object'&&String(r.cod_turma||'').trim()&&String(r.componente||'').trim()&&String(r.professor||'').trim()&&String(r.turma||'').trim());}
function validateBackupRows(rows,label){
 if(rows===null)return null;
 if(!Array.isArray(rows))throw new Error(label+' precisa ser uma lista de registros ou nulo.');
 if(rows.length>25000)throw new Error(label+' excede o limite de 25.000 registros.');
 const bad=rows.findIndex(r=>!validBackupRow(r));if(bad>=0)throw new Error(label+' contém registro inválido na posição '+(bad+1)+'.');
 return rows;
}
function validateDataBackup(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('O arquivo não contém um objeto de backup válido.');
 if(raw.version!==DATA_BACKUP_VERSION)throw new Error('Versão de backup incompatível. Esperado: '+DATA_BACKUP_VERSION+'.');
 if(raw.datasetId!==DATA.datasetId)throw new Error('Este backup pertence a outro conjunto de dados.');
 if(!raw.dataStore||typeof raw.dataStore!=='object')throw new Error('O backup não contém a seção dataStore.');
 const store={t1:validateBackupRows(raw.dataStore.t1,'1º trimestre'),t2:validateBackupRows(raw.dataStore.t2,'2º trimestre'),weeklySnapshots:Array.isArray(raw.dataStore.weeklySnapshots)?raw.dataStore.weeklySnapshots:[]};
 if(store.weeklySnapshots.length>80)throw new Error('O backup contém snapshots semanais acima do limite esperado.');
 const seen=new Set();
 for(const [i,s] of store.weeklySnapshots.entries()){
  if(!s||typeof s!=='object'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(s.date||'')))throw new Error('Snapshot semanal '+(i+1)+' possui data inválida.');
  if(s.date<'2026-09-10'||s.date>'2026-12-18')throw new Error('Snapshot semanal '+(i+1)+' está fora do 3º trimestre de 2026.');
  if(seen.has(s.date))throw new Error('O backup contém mais de um snapshot na data '+formatDateBR(s.date)+'.');
  seen.add(s.date);validateBackupRows(s.rows,'Snapshot de '+formatDateBR(s.date));
 }
 if(!raw.refs||typeof raw.refs!=='object'||Array.isArray(raw.refs))throw new Error('O backup não contém as referências necessárias para reconstruir as bases.');
 const refs=safeClone(raw.refs);
 return {version:raw.version,datasetId:raw.datasetId,school:raw.school&&typeof raw.school==='object'?raw.school:{},exportedAt:raw.exportedAt||'',store,refs};
}
function backupRestoreSummary(c){
 return {t1:c.store.t1?.length||0,t2:c.store.t2?.length||0,snapshots:c.store.weeklySnapshots.length,total:(c.store.t1?.length||0)+(c.store.t2?.length||0)+c.store.weeklySnapshots.reduce((n,s)=>n+(s.rows?.length||0),0)};
}
function buildBackupRestorePreview(c){
 const s=backupRestoreSummary(c),d=document.getElementById('confirm-dialog');
 const dt=c.exportedAt?new Date(c.exportedAt):null,label=dt&&!Number.isNaN(dt.getTime())?dt.toLocaleString('pt-BR'):'data não informada';
 const other=String(c.school?.name||'').trim(),current=String(schoolProfile()?.name||'').trim();
 const schoolWarning=other&&current&&other!==current?'<div class="notice warning tight">'+icon('info')+'<div class="text"><strong>O backup identifica outra escola:</strong> '+esc(other)+'. A identificação atual não será substituída; somente as bases serão restauradas.</div></div>':'';
 d.innerHTML='<div class="dialog-head"><div><div class="eyebrow muted">PRÉVIA DA RESTAURAÇÃO</div><h2 id="confirm-title">Restaurar backup de dados</h2><p class="sub">Confira o conteúdo antes de substituir as bases deste navegador.</p></div>'+btn(icon('close'),'cancel-backup-restore','aria-label="Cancelar restauração"','icon-btn')+'</div><div class="dialog-body"><div class="import-preview-file"><strong>'+esc(c.fileName)+'</strong><span>Backup exportado em '+esc(label)+' · dataset '+esc(c.datasetId)+'</span></div><div class="import-preview-grid"><div><span>1º trimestre</span><strong>'+s.t1+'</strong></div><div><span>2º trimestre</span><strong>'+s.t2+'</strong></div><div><span>Snapshots T3</span><strong>'+s.snapshots+'</strong></div><div><span>Registros no backup</span><strong>'+s.total+'</strong></div></div>'+schoolWarning+'<div class="notice warning tight">'+icon('info')+'<div class="text"><strong>A restauração substituirá T1, T2 e o histórico semanal deste navegador.</strong> A versão atual será preservada para desfazer.</div></div><p class="setting-note">Parâmetros, calendário, cargas ajustadas, conferências de notas e identificação da escola não são substituídos.</p></div><div class="dialog-foot"><span class="muted" style="font-size:11px">Backup validado · aguardando confirmação</span><div class="inline-actions">'+btn('Cancelar','cancel-backup-restore')+btn('Confirmar restauração','confirm-backup-restore','','btn-primary')+'</div></div>';
 if(d.open)d.close();d.showModal();
}
function backupRecoveryHint(message){
 const m=normalize(message||'');
 if(m.includes('versao'))return 'Próximo passo: gere um novo backup pela versão atual do DED em Foco.';
 if(m.includes('outro conjunto')||m.includes('dataset'))return 'Próximo passo: use um backup exportado por esta mesma versão/template.';
 if(m.includes('json')||m.includes('datastore')||m.includes('objeto de backup'))return 'Próximo passo: selecione o JSON criado por “Baixar backup JSON”, sem editar seu conteúdo.';
 return 'Próximo passo: confira o arquivo de backup; nenhuma base foi alterada.';
}
async function stageDataBackupRestore(file){
 if(safeImportBusy){setImportStatus('working','Operação em andamento','Conclua ou cancele a operação atual antes de restaurar um backup.');return;}
 setDataOperationBusy(true);
 try{
  if(!file||file.size>50*1024*1024)throw new Error('Selecione um backup JSON de até 50 MB.');
  setImportStep(1,'Lendo arquivo',file.name);await nextImportPaint();
  const text=await file.text();
  setImportStep(2,'Validando estrutura','Conferindo JSON, versão e campos obrigatórios.');await nextImportPaint();
  let raw;try{raw=JSON.parse(text);}catch(e){throw new Error('O arquivo não contém JSON válido.');}
  const c=validateDataBackup(raw);
  setImportStep(3,'Conferindo conteúdo do backup','Validando dataset, trimestres e snapshots semanais.');await nextImportPaint();
  c.fileName=file.name;c.fileSize=file.size;c.readAt=Date.now();backupRestoreStage=c;
  setImportStep(4,'Preparando prévia','Nenhuma base foi substituída; revise o conteúdo antes de confirmar.');await nextImportPaint();
  buildBackupRestorePreview(c);
 }catch(err){
  backupRestoreStage=null;setDataOperationBusy(false);
  const message=err?.message||'Não foi possível validar o backup.';
  setImportStatus('error','Backup não restaurado',message+' '+backupRecoveryHint(message));
 }
}
function commitDataBackupRestore(c=backupRestoreStage){
 if(!c)return;
 validateDataBackup({version:c.version,datasetId:c.datasetId,school:c.school,exportedAt:c.exportedAt,dataStore:c.store,refs:c.refs});
 setImportStep(5,'Aplicando restauração','Preservando a base atual e gravando o backup validado.');
 const beforeStore=safeClone(dataStore),beforeRefs=safeClone(DATA.refs);
 let previousRestore=null;try{previousRestore=localStorage.getItem(SAFE_IMPORT_RESTORE_KEY);}catch(e){}
 createLocalRestorePoint('Antes de restaurar backup · '+c.fileName);
 hydrateDataStore(c.store,c.refs);
 if(!saveDataStore()){
  hydrateDataStore(beforeStore,beforeRefs);
  try{if(previousRestore===null)localStorage.removeItem(SAFE_IMPORT_RESTORE_KEY);else localStorage.setItem(SAFE_IMPORT_RESTORE_KEY,previousRestore);}catch(e){}
  throw new Error('O navegador não conseguiu salvar o backup restaurado. A base anterior foi mantida.');
 }
 if(dataStore.weeklySnapshots.length)state.trimester='3';else if(dataStore.t2)state.trimester='2';else if(dataStore.t1)state.trimester='1';
 RAW=getActiveRaw();syncFilterOptions();render();backupRestoreStage=null;setDataOperationBusy(false);
 const d=document.getElementById('confirm-dialog');if(d?.open)d.close();
 setImportStatus('success','Concluído','Etapa 6 de 6 · Backup restaurado com sucesso. A versão anterior ficou disponível para desfazer.',btn('Desfazer restauração','undo-last-import','','btn-small'));
}
function cancelBackupRestore(){
 backupRestoreStage=null;setDataOperationBusy(false);
 const d=document.getElementById('confirm-dialog');if(d?.open)d.close();
 setImportStatus('neutral','Restauração cancelada','Nenhum dado foi alterado.');
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 if(el.dataset.action==='restore-data-backup')document.getElementById('restore-data-backup-file')?.click();
 else if(el.dataset.action==='confirm-backup-restore'){try{commitDataBackupRestore();}catch(err){const message=err?.message||'Falha ao restaurar o backup.';setImportStatus('error','Backup não restaurado',message+' '+backupRecoveryHint(message));}}
 else if(el.dataset.action==='cancel-backup-restore')cancelBackupRestore();
});
document.addEventListener('change',async e=>{
 const el=e.target;if(el.id!=='restore-data-backup-file')return;
 const file=el.files?.[0];if(!file)return;
 try{await stageDataBackupRestore(file);}finally{el.value='';}
});
document.getElementById('confirm-dialog')?.addEventListener('close',()=>{if(backupRestoreStage){backupRestoreStage=null;setDataOperationBusy(false);}});
window.DED_BACKUP_RECOVERY=Object.freeze({backupDataStorePayload,validateDataBackup,stageDataBackupRestore,commitDataBackupRestore});
