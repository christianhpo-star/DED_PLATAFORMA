'use strict';

const DATA = JSON.parse(document.getElementById('source-data').textContent);
DATA.calendar=Array.isArray(DATA.calendar)?DATA.calendar:[];
DATA.refs=DATA.refs&&typeof DATA.refs==='object'?DATA.refs:{};
DATA.classMatrix=DATA.classMatrix&&typeof DATA.classMatrix==='object'?DATA.classMatrix:{};
const CLASS_MATRIX_BY_REPORT=new Map();
for(const [label,entry] of Object.entries(DATA.classMatrix.classes||DATA.classMatrix||{})){
 const reportClass=normalizeMatrixKey(entry?.report_class||label),components=Object.fromEntries(Object.entries(entry?.components||{}).map(([k,v])=>[normalizeMatrixKey(k),v])),excludedComponents=(entry?.external_not_monitored?.components||entry?.excludedComponents||[]).map(normalizeMatrixKey);
 CLASS_MATRIX_BY_REPORT.set(reportClass,{...entry,components,excludedComponents});
}
// Referências incorporadas somente quando documentalmente válidas. REG e INT são tratados separadamente.
const MATRIX_SOURCE_REG='Resolução SEE nº 5.212/2025 · Anexo XII · Ensino Médio Noturno 2026 (21 A/S presenciais registráveis no DED; atividades complementares permanecem separadas).';
const MATRIX_SOURCE_INT1='Resolução SEE nº 5.212/2025 · EMTI Profissional 2026 · 1º ano (45 A/S).';
const MATRIX_SOURCE_INT_CONT='Turma EMTI Profissional em continuidade: carga por componente depende da matriz/grade aplicável à coorte ou do horário homologado. Sem fonte documental, a referência permanece não informada.';
const MATRIX_SOURCE_BILINGUAL='Minas Bilíngue 2026: componente bilíngue identificado na oferta. A carga semanal só é aplicada quando a matriz ou o horário oficial da oferta documenta esse valor.';
const BILINGUAL_COMPONENTS=Object.freeze(new Set(['ESTUDOS INTERCULTURAIS','LINGUA ESTRANGEIRA','ARTE APLICADA EM LINGUA ESTRANGEIRA','MATEMATICA APLICADA EM LINGUA ESTRANGEIRA','CIENCIAS APLICADA EM LINGUA ESTRANGEIRA','CIENCIA APLICADA EM LINGUA ESTRANGEIRA','GEOGRAFIA APLICADA EM LINGUA ESTRANGEIRA']));
const COURSE_LABELS=Object.freeze({AUTOMACAO_INDUSTRIAL:'Automação Industrial',DESENVOLVIMENTO_SISTEMAS:'Desenvolvimento de Sistemas',FABRICACAO_MECANICA:'Fabricação Mecânica',QUIMICA_PRODUCAO_INDUSTRIAL:'Química · Produção Industrial',SISTEMAS_ENERGIA_RENOVAVEL:'Sistemas de Energia Renovável',INFORMATICA:'Informática',SEGURANCA_TRABALHO:'Segurança do Trabalho'});
function normalizeMatrixKey(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();}
function extractShortClass(turma){const raw=String(turma??'').trim(),parts=raw.split(/\s+-\s+/);if(parts.length<2)return raw;const tail=normalizeMatrixKey(parts.at(-1)),looksAddress=/^(RUA|AVENIDA|AV|PRACA|RODOVIA|ESTRADA|TRAVESSA|ALAMEDA|FAZENDA|DISTRITO|BR|MG)\b/.test(tail)||/\bCEP\b/.test(tail);return looksAddress?parts.slice(0,-1).join(' - ').trim():raw;}
function technicalCourseKey(shortClass){const c=normalizeMatrixKey(shortClass);if(c.includes('AUTOMACAO INDUSTRIAL'))return 'AUTOMACAO_INDUSTRIAL';if(c.includes('DESENV DE SISTEMAS')||c.includes('DESENVOLVIMENTO DE SISTEMAS'))return 'DESENVOLVIMENTO_SISTEMAS';if(c.includes('FABRICACAO MECANICA'))return 'FABRICACAO_MECANICA';if(c.includes('QUIMICA PRODUCAO INDUSTRIAL')||(c.includes('QUIMICA')&&c.includes('PRODUCAO INDUSTRIAL')))return 'QUIMICA_PRODUCAO_INDUSTRIAL';if(c.includes('SISTEMAS DE ENERGIA RENOVAVEL'))return 'SISTEMAS_ENERGIA_RENOVAVEL';if(c.includes('INFORMATICA'))return 'INFORMATICA';if(c.includes('SEGURANCA DO TRABALHO'))return 'SEGURANCA_TRABALHO';return '';}
function isBilingualComponent(component){return BILINGUAL_COMPONENTS.has(normalizeMatrixKey(component));}
function classifySchoolProfile(shortClass){const c=normalizeMatrixKey(shortClass),m=c.match(/^([123])\b/),year=m?.[1]||'',isReg=/(^| )REG( |$)/.test(c),isInt=/(^| )INT( |$)/.test(c),courseKey=technicalCourseKey(c),suffix={AUTOMACAO_INDUSTRIAL:'AUT',DESENVOLVIMENTO_SISTEMAS:'DS',FABRICACAO_MECANICA:'FAB',QUIMICA_PRODUCAO_INDUSTRIAL:'QUI',SISTEMAS_ENERGIA_RENOVAVEL:'SER',INFORMATICA:'INFO',SEGURANCA_TRABALHO:'SEG'}[courseKey]||'';let bucket='UNKNOWN';if(isReg&&year)bucket=`EM_REG_${year}`;else if(isInt&&year==='1')bucket='EM_INT_1';else if(isInt&&year&&suffix)bucket=`EM_INT_${year}_${suffix}`;else if(isInt&&year)bucket=`EM_INT_${year}`;return {year,isReg,isInt,courseKey,bucket,offer:isReg?'REGULAR_NOTURNO':isInt?(courseKey?'EMTI_TECNICO':'EMTI'):'UNKNOWN'};}
const OFFICIAL_WEEKLY=Object.freeze({"EM_REG_1|LINGUA PORTUGUESA":4,"EM_REG_1|EDUCACAO FISICA":1,"EM_REG_1|ARTE":1,"EM_REG_1|LINGUA INGLESA":1,"EM_REG_1|MATEMATICA":4,"EM_REG_1|FISICA":1,"EM_REG_1|QUIMICA":1,"EM_REG_1|BIOLOGIA":1,"EM_REG_1|GEOGRAFIA":1,"EM_REG_1|HISTORIA":1,"EM_REG_1|SOCIOLOGIA":1,"EM_REG_1|FILOSOFIA":1,"EM_REG_1|EDUCACAO DIGITAL":1,"EM_REG_2|LINGUA PORTUGUESA":4,"EM_REG_2|EDUCACAO FISICA":1,"EM_REG_2|ARTE":1,"EM_REG_2|LINGUA INGLESA":1,"EM_REG_2|MATEMATICA":4,"EM_REG_2|FISICA":1,"EM_REG_2|QUIMICA":1,"EM_REG_2|BIOLOGIA":1,"EM_REG_2|GEOGRAFIA":1,"EM_REG_2|HISTORIA":1,"EM_REG_2|SOCIOLOGIA":1,"EM_REG_2|FILOSOFIA":1,"EM_REG_2|EDUCACAO DIGITAL":1,"EM_REG_3|LINGUA PORTUGUESA":4,"EM_REG_3|EDUCACAO FISICA":1,"EM_REG_3|ARTE":1,"EM_REG_3|LINGUA INGLESA":1,"EM_REG_3|MATEMATICA":4,"EM_REG_3|FISICA":1,"EM_REG_3|QUIMICA":1,"EM_REG_3|BIOLOGIA":1,"EM_REG_3|GEOGRAFIA":1,"EM_REG_3|HISTORIA":1,"EM_REG_3|SOCIOLOGIA":1,"EM_REG_3|FILOSOFIA":1,"EM_REG_3|EDUCACAO DIGITAL":1,"EM_REG_1|LEITURA E PROTAGONISMO":1,"EM_REG_1|CONEXOES MATEMATICAS":1,"EM_REG_2|PROJETO INTEGRADOR INOVACAO E SABERES EM SUSTENTABILIDADE":1,"EM_REG_2|PROJETO INTEGRADOR PRODUCAO CULTURAL E COMUNICACAO":1,"EM_REG_3|PROJETO INTEGRADOR INTERVENCAO CIDADA":1,"EM_REG_3|PROJETO INTEGRADOR SOLUCOES MATEMATICAS":1,"EM_INT_1|LINGUA PORTUGUESA":5,"EM_INT_1|EDUCACAO FISICA":2,"EM_INT_1|ARTE":2,"EM_INT_1|LINGUA INGLESA":2,"EM_INT_1|MATEMATICA":5,"EM_INT_1|FISICA":2,"EM_INT_1|QUIMICA":2,"EM_INT_1|BIOLOGIA":2,"EM_INT_1|GEOGRAFIA":2,"EM_INT_1|HISTORIA":2,"EM_INT_1|SOCIOLOGIA":1,"EM_INT_1|FILOSOFIA":1,"EM_INT_1|PROJETO DE VIDA":2,"EM_INT_1|ESTUDOS ORIENTADOS":3,"EM_INT_1|PRATICAS EXPERIMENTAIS":1,"EM_INT_1|NIVELAMENTO LINGUA PORTUGUESA":2,"EM_INT_1|NIVELAMENTO MATEMATICA":2,"EM_INT_1|PROJETOS INTEGRADORES E DE CORRESPONSABILIDADE SOCIAL PICS":2,"EM_INT_1|CULTURA DIGITAL E FUNDAMENTOS DE IA":2,"EM_INT_1|FERRAMENTAS PARA O MUNDO DO TRABALHO":3});
function classifySchoolBucket(shortClass){return classifySchoolProfile(shortClass).bucket;}
function normalizeEmbeddedRows(rows){
 const list=rows||[],bilingualClasses=new Set(list.filter(r=>isBilingualComponent(r.componente)).map(r=>String(r.cod_turma||r.shortClass||r.turma||'')));
 for(const r of list){
  const shortClass=r.shortClass||extractShortClass(r.turma),profile=classifySchoolProfile(shortClass),component=normalizeMatrixKey(r.componente),classKey=normalizeMatrixKey(shortClass),matrix=CLASS_MATRIX_BY_REPORT.get(classKey)||null,baseRefKey=`${profile.bucket}|${component}`,classWeekly=matrix?.components?.[component];
  r.shortClass=shortClass;r.bucket=profile.bucket;r.courseKey=profile.courseKey;r.offer=profile.offer;r.bilingual=bilingualClasses.has(String(r.cod_turma||shortClass||r.turma||''));r.unit=component.startsWith('FREQUENCIA')?'dias':'aulas';r.baseComponent=r.componente;r.monitoringExcluded=!!matrix?.excludedComponents?.includes(component);
  if(classWeekly!==undefined&&classWeekly!==null){
   r.refKey=`CLASS:${classKey}|${component}`;
   DATA.refs[r.refKey]={bucket:profile.bucket,component:r.componente,weekly:Number(classWeekly),source:matrix.source||'Matriz escolar por turma/componente.'};
  }else r.refKey=baseRefKey;
  r.professorCandidates=Array.isArray(r.professorCandidates)&&r.professorCandidates.length?r.professorCandidates:[r.professor];r.teacherConflict=r.professorCandidates.length>1;
 }
}
normalizeEmbeddedRows(DATA.raw);normalizeEmbeddedRows(DATA.raw_t1);
for(const [key,weekly] of Object.entries(OFFICIAL_WEEKLY)){const [bucket,...parts]=key.split('|'),componentKey=parts.join('|');const sample=[...(DATA.raw||[]),...(DATA.raw_t1||[])].find(r=>r.refKey===key);const source=bucket.startsWith('EM_REG_')?MATRIX_SOURCE_REG:bucket==='EM_INT_1'?MATRIX_SOURCE_INT1:MATRIX_SOURCE_INT_CONT;DATA.refs[key]={...(DATA.refs[key]||{}),bucket,component:sample?.componente||componentKey,weekly,source};}
// As planilhas importadas ficam somente neste navegador. A base incorporada ao HTML permanece como cópia de segurança.
const INSTANCE_SCOPE=(location.pathname||DATA.datasetId||'template').replace(/[^a-z0-9_-]+/gi,'_');
const DATA_STORE_KEY=`ded-em-foco:${DATA.datasetId}:${INSTANCE_SCOPE}:planilhas-v1`;
let dataStore={t1:null,t2:null,weeklySnapshots:[]};
try{const embeddedStore=JSON.parse(document.getElementById('embedded-data-store').textContent);if(embeddedStore&&typeof embeddedStore==='object')dataStore={t1:Array.isArray(embeddedStore.t1)?embeddedStore.t1:null,t2:Array.isArray(embeddedStore.t2)?embeddedStore.t2:null,weeklySnapshots:Array.isArray(embeddedStore.weeklySnapshots)?embeddedStore.weeklySnapshots:[]};}catch(e){}
try{const saved=JSON.parse(localStorage.getItem(DATA_STORE_KEY)||'null');if(saved&&typeof saved==='object'){dataStore={t1:Array.isArray(saved.t1)?saved.t1:null,t2:Array.isArray(saved.t2)?saved.t2:null,weeklySnapshots:Array.isArray(saved.weeklySnapshots)?saved.weeklySnapshots:[]};}}catch(e){}
if(dataStore.t1)DATA.raw_t1=dataStore.t1;
if(dataStore.t2)DATA.raw=dataStore.t2;
if(dataStore.weeklySnapshots.length)DATA.raw_t3=dataStore.weeklySnapshots[dataStore.weeklySnapshots.length-1].rows;
normalizeEmbeddedRows(DATA.raw_t1);normalizeEmbeddedRows(DATA.raw);normalizeEmbeddedRows(DATA.raw_t3);
function saveDataStore(){try{localStorage.setItem(DATA_STORE_KEY,JSON.stringify(dataStore));return true;}catch(e){toast('Não foi possível guardar as planilhas neste navegador. Exporte um backup dos dados.');return false;}}
function logicalKey(r){return `${r.cod_turma}|${normalize(r.baseComponent||r.componente).replace(/[^a-z0-9]+/g,' ').trim()}`;}
function rebuildConsolidated(){
 const key=r=>`${r.cod_turma}|${String(r.baseComponent||r.componente).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim()}`;
 const t1=new Map((DATA.raw_t1||[]).map(r=>[key(r),r])),t2=new Map((DATA.raw||[]).map(r=>[key(r),r]));
 const keys=[...new Set([...t1.keys(),...t2.keys()])];DATA.consolidated=[];DATA.raw_consolidated=[];
 for(const [i,k] of keys.entries()){
  const a=t1.get(k),b=t2.get(k),r=b||a,n1=/^\d+$/.test(String(a?.total||''))?Number(a.total):null,n2=/^\d+$/.test(String(b?.total||''))?Number(b.total):null;
  const total=n1===null&&n2===null?'-':String((n1||0)+(n2||0)),status1=a?.status||'NÃO LOCALIZADO',status2=b?.status||'NÃO LOCALIZADO';
  const current=b||a,candidates=current?.professorCandidates||[current?.professor].filter(Boolean),teacherConflict=!!current?.teacherConflict,prev=a?.professorCandidates?.length===1?a.professorCandidates[0]:a?.professor;
  const common={...r,professor:current?.professor||'',professorCandidates:candidates,teacherConflict,dataConflict:!!current?.dataConflict,previousProfessor:prev&&prev!==(current?.professor||'')?prev:''};
  DATA.raw_consolidated.push({...common,id:`c${String(i).padStart(3,'0')}`,total,divisao:'1º + 2º TRIMESTRES',status:status2,notas:b?.notas||a?.notas||'-',fev:a?.fev||'-',mar:a?.mar||'-',abr:a?.abr||'-',mai_t1:a?.mai||'-',mai_t2:b?.mai||'-',jun:b?.jun||'-',jul:b?.jul||'-',ago:b?.ago||'-',set:b?.set||'-'});
  DATA.consolidated.push({...common,t1_aulas:n1||0,t2_aulas:n2||0,total_acumulado:(n1||0)+(n2||0),t1_status:status1,t2_status:status2,t1_notas:a?.notas||'-',t2_notas:b?.notas||'-',situacao:status1==='FECHADO'&&status2==='FECHADO'?'REGULAR':'PENDENTE'});
 }
}
