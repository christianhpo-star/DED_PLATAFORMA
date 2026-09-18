'use strict';
// Contexto temporal e atualidade dos dados: não infere datas que o arquivo não fornece.
function temporalDateTime(value){
 const n=Number(value);if(!n)return 'não registrada';
 const d=new Date(n);return Number.isNaN(d.getTime())?'não registrada':d.toLocaleString('pt-BR');
}
function temporalDate(value){
 const n=Number(value);if(!n)return '';
 const d=new Date(n);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('pt-BR');
}
function periodImportMeta(period){return dataStore.importMeta?.[period==='1'?'t1':'t2']||null;}
function periodHasRows(period){
 const rows=period==='1'?(dataStore.t1===null?(DATA.raw_t1||[]):dataStore.t1):(dataStore.t2===null?(DATA.raw||[]):dataStore.t2);
 return rows.length>0;
}
function importMetaDescription(period){
 const meta=periodImportMeta(period),label=period==='1'?'1º tri':'2º tri';
 if(!periodHasRows(period))return label+': sem base';
 if(!meta)return label+': base disponível · importação não registrada';
 return label+': importado em '+temporalDateTime(meta.importedAt)+(meta.fileName?' · '+meta.fileName:'');
}
function latestDataImportedAt(){
 const times=[periodImportMeta('1')?.importedAt||0,periodImportMeta('2')?.importedAt||0,...dataStore.weeklySnapshots.map(s=>Number(s.importedAt)||0)].filter(Boolean);
 return times.length?Math.max(...times):0;
}
function dataFreshnessContext(page=state.page,period=state.trimester){
 if(page==='weekly'){
  const {cur,prev}=weeklySnapshotContext();
  if(!cur)return {nature:'SEM SNAPSHOT',title:'3º trimestre — acompanhamento semanal sem snapshot',detail:'Adicione a primeira atualização para comparar novos lançamentos desde 10/09/2026.',short:'3º tri · sem snapshot'};
  const start=prev?.date||'2026-09-10',title='Semana '+formatDateBR(start)+' → '+formatDateBR(cur.date)+' — novos lançamentos';
  const detail=(prev?'Comparação entre duas extrações. ':'Primeira comparação com base zero em 10/09/2026. ')+(cur.intervalDays??0)+' dia(s) letivo(s) · importado em '+temporalDateTime(cur.importedAt)+(cur.fileName?' · '+cur.fileName:'')+(cur.fileModifiedAt?' · arquivo no dispositivo: '+temporalDate(cur.fileModifiedAt):'');
  return {nature:'NOVOS LANÇAMENTOS',title,detail,short:'Semana até '+formatDateBR(cur.date),referenceDate:cur.date,importedAt:cur.importedAt||0};
 }
 if(page==='imports'){
  const last=latestDataImportedAt();
  return {nature:'BASES LOCAIS',title:'Bases locais de 2026'+(last?' — última atualização '+temporalDateTime(last):' — sem atualização registrada'),detail:importMetaDescription('1')+' · '+importMetaDescription('2')+' · T3: '+(dataStore.weeklySnapshots.length?formatDateBR(dataStore.weeklySnapshots.at(-1).date):'sem snapshot'),short:last?'Atualizado '+temporalDate(last):'Sem atualização'};
 }
 if(page==='settings'){
  const last=latestDataImportedAt();
  return {nature:'CONFIGURAÇÃO LOCAL',title:'Parâmetros locais de 2026',detail:last?'Bases usadas no painel: última importação local em '+temporalDateTime(last)+'.':'Ainda não há momento de importação registrado nas bases locais.',short:'Configuração local'};
 }
 if(period==='3'){
  const cur=dataStore.weeklySnapshots.at(-1);
  if(!cur)return {nature:'ACUMULADO',title:'3º trimestre — sem leitura importada',detail:'Ainda não há snapshot do 3º trimestre para formar a leitura acumulada.',short:'3º tri · sem leitura'};
  return {nature:'ACUMULADO',title:'3º trimestre — acumulado até '+formatDateBR(cur.date),detail:'Última leitura local importada em '+temporalDateTime(cur.importedAt)+(cur.fileName?' · '+cur.fileName:'')+(cur.fileModifiedAt?' · arquivo no dispositivo: '+temporalDate(cur.fileModifiedAt):''),short:'Acumulado até '+formatDateBR(cur.date),referenceDate:cur.date,importedAt:cur.importedAt||0};
 }
 if(period==='all'||period==='consolidated'||page==='consolidated'){
  return {nature:'CONSOLIDADO',title:'1º + 2º trimestres — visão consolidada',detail:importMetaDescription('1')+' · '+importMetaDescription('2')+'. O consolidado combina as bases disponíveis; não cria uma nova leitura do DED.',short:'Consolidado 1º + 2º'};
 }
 const meta=periodImportMeta(period),ordinal=period==='1'?'1º':'2º';
 if(meta){
  return {nature:'LEITURA DO PERÍODO',title:ordinal+' trimestre — leitura importada em '+temporalDate(meta.importedAt),detail:(meta.fileName?'Arquivo: '+meta.fileName+'. ':'')+'Importação local: '+temporalDateTime(meta.importedAt)+(meta.fileModifiedAt?' · arquivo no dispositivo: '+temporalDate(meta.fileModifiedAt):''),short:ordinal+' tri · '+temporalDate(meta.importedAt),importedAt:meta.importedAt||0};
 }
 return {nature:'LEITURA DO PERÍODO',title:ordinal+' trimestre — '+(periodHasRows(period)?'base disponível':'sem base importada'),detail:periodHasRows(period)?'Esta base não possui metadado de importação registrado; não é possível afirmar quando o arquivo foi lido.':'Importe o Relatório de Lançamentos para registrar a atualidade desta base.',short:ordinal+' trimestre'};
}
function renderDataContext(){
 const c=dataFreshnessContext(),host=document.getElementById('data-context'),top=document.getElementById('top-period'),side=document.getElementById('sidebar-data-freshness');
 if(host)host.innerHTML='<div class="data-context-icon">'+icon('calendar')+'</div><div class="data-context-copy"><span>'+esc(c.nature)+'</span><strong>'+esc(c.title)+'</strong><small>'+esc(c.detail)+'</small></div>';
 if(top)top.innerHTML=icon('calendar')+esc(c.short);
 if(side)side.textContent=c.short+' · local';
}
function temporalExportContext(){const c=dataFreshnessContext();return {title:c.title,detail:c.detail,nature:c.nature};}
window.DED_TEMPORAL=Object.freeze({dataFreshnessContext,temporalExportContext,initialTrimester});
