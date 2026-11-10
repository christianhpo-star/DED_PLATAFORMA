/* Contrato compartilhado navegador/GAS: consolidados sustentam notas e faltas,
 * nunca aulas dadas. Identidade sem matrícula fica restrita à versão do relatório. */
(function(root){
 'use strict';
 const VERSION=1,MAX_RECORDS=20000,MAX_BATCH=20;
 const text=v=>String(v??'').trim(),norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');
 const fail=m=>{throw new Error(m);};
 function number(v){const s=text(v);if(!s||['-','—','–','N/A'].includes(s))return null;const n=Number(s.replace(',','.'));if(!Number.isFinite(n)||n<0)fail('Valor de nota/faltas inválido.');return n;}
 function date(s){const m=s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);if(!m)fail('Data e hora de extração ausentes.');const iso=`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00-03:00`;if(!Number.isFinite(Date.parse(iso))||Number(m[4])>23||Number(m[5])>59||new Date(Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1]))).toISOString().slice(0,10)!==`${m[3]}-${m[2]}-${m[1]}`)fail('Data de extração inválida.');return iso;}
 const key=d=>[d.school.code,d.year,d.class.code,d.term].join('|');
 // Metadados são lidos do conteúdo, nunca do nome (que pode conter ano incorreto).
 function fromMatrix(matrix,source){
  const meta=matrix.slice(0,20).map(r=>r.map(text).join(' ')).join('\n');
  const school=meta.match(/ESCOLA:\s*(\d+)\s*-\s*([^\n]+)/i),cl=meta.match(/TURMA:\s*(.+?)\s*\((20\d{2})\)\s*-\s*(\d+)\s*-\s*([^-\n]+)/i),period=norm(meta).match(/DIVISAO:\s*([123])[^\n]*TRIMESTRE/);
  if(!school||!cl||!period)fail('Metadados de escola, turma, ano ou trimestre ausentes/incompatíveis.');
  const head=matrix.findIndex(r=>r.some(v=>['ALUNO','ESTUDANTE'].includes(norm(v))));if(head<0||!matrix[head+1])fail('Cabeçalho ALUNO e subcabeçalhos não encontrados.');
  // Exportações reais quebram títulos longos em duas linhas antes de NOTA/FALTAS.
  const measureAt=matrix.findIndex((r,i)=>i>head&&i<=head+5&&r.some(v=>norm(v)==='FALTAS'));
  if(measureAt<0)fail('Linha de medidas NOTA/FALTAS não reconhecida.');
  const header=Array.from({length:Math.max(...matrix.slice(head,measureAt).map(r=>r.length))},(_,col)=>matrix.slice(head,measureAt).map(r=>text(r[col])).filter(Boolean).join(' ')),sub=matrix[measureAt],columns=[],studentColumn=header.findIndex(v=>['ALUNO','ESTUDANTE'].includes(norm(v)));
  const idColumn=header.findIndex(v=>['MATRICULA','CODIGO ALUNO','ID ALUNO'].includes(norm(v)));
  let component='';
  for(let col=0;col<Math.max(header.length,sub.length);col++){
   if(col===studentColumn||col===idColumn)continue;
   if(text(header[col]))component=text(header[col]);
   const h=norm(sub[col]);if(!component||!h)continue;
   let kind=null;
   if(/^FALTAS(?:\s.*)?$/.test(h))kind='absences';
   else if(new RegExp('^'+period[1]+'[^0-9]*TRIMESTRE$').test(h)||h==='NOTA')kind='grade';
   else if(/TRIMESTRE|NOTA|FALTAS/.test(h))fail('Subcabeçalho de período incompatível.');
   else fail('Coluna não reconhecida no consolidado.');
   if(kind){const componentKey=norm(component).replace(/:/g,'');if(columns.some(c=>c.componentKey===componentKey&&c.kind===kind))fail('Componente/medida duplicado no cabeçalho.');columns.push({col,component,componentKey,kind});}
  }
  if(!columns.length)fail('Nenhum componente de nota/faltas reconhecido.');
  const records=[],students=new Set(),namesWithoutId=new Set();
  for(let ri=measureAt+1;ri<matrix.length;ri++){
   const row=matrix[ri],name=text(row[studentColumn]);if(!name){if(row.some(v=>text(v)))fail('Linha com dados sem identificação do estudante.');continue;}
   if(/^(TOTAL|LEGENDA|OBSERVA[CÇ][AÃ]O)\b/i.test(name))fail('Rodapé não suportado: confira o formato antes de importar.');
   const sourceId=idColumn>=0?text(row[idColumn]):'';
   if(!sourceId){const n=norm(name);if(namesWithoutId.has(n))fail('Nomes repetidos sem matrícula: confira homônimos/duplicidade na fonte.');namesWithoutId.add(n);}
   // Sem ID institucional não unimos homônimos nem nomes parecidos entre períodos.
   const sid=sourceId?'id:'+sourceId:'row:'+(ri+1);
   if(students.has(sid))fail('Identificador de estudante duplicado.');students.add(sid);
   const map=new Map();
   for(const c of columns){if(!map.has(c.componentKey))map.set(c.componentKey,{studentKey:sid,studentName:name,studentId:sourceId||null,identityScope:sourceId?'institution':'report',sourceRow:ri+1,component:c.component,componentKey:c.componentKey,grade:null,absences:null});map.get(c.componentKey)[c.kind]=number(row[c.col]);}
   records.push(...map.values());
  }
  const d={schemaVersion:VERSION,sourceType:'DED_CLASS_CONSOLIDATED',school:{code:String(Number(school[1])),name:school[2].trim()},class:{code:cl[3],name:cl[1].trim(),shift:cl[4].trim()},year:Number(cl[2]),term:Number(period[1]),extractedAt:date(meta),source:{fileName:text(source.fileName),sha256:text(source.sha256),sheet:text(source.sheet)},records};
  return validate(d);
 }
 function validate(d){
  if(!d||d.schemaVersion!==VERSION||d.sourceType!=='DED_CLASS_CONSOLIDATED')fail('Contrato de consolidado incompatível.');
  if(!/^\d{1,12}$/.test(d.school?.code||'')||!text(d.school.name)||!/^\d{1,16}$/.test(d.class?.code||'')||!text(d.class.name)||!text(d.class.shift))fail('Escola/turma inválida.');
  if(!Number.isInteger(d.year)||d.year<2020||d.year>2100||![1,2,3].includes(d.term))fail('Ano/trimestre inválido.');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00-03:00$/.test(d.extractedAt)||!Number.isFinite(Date.parse(d.extractedAt)))fail('Extração inválida.');
  if(!/^[a-f0-9]{64}$/.test(d.source?.sha256||'')||!text(d.source.fileName)||text(d.source.fileName).length>240||text(d.source.sheet).length>120)fail('Origem/hash inválido.');
  if(!Array.isArray(d.records)||!d.records.length||d.records.length>MAX_RECORDS)fail('Quantidade de registros fora do limite.');
  const ids=new Set(),identities=new Map(),reportNames=new Map(),clean=d.records.map(r=>{
   if(!text(r.studentKey)||!text(r.studentName)||text(r.studentName).length>240||!Number.isInteger(r.sourceRow)||r.sourceRow<1||!text(r.component)||text(r.component).length>240||r.componentKey!==norm(r.component).replace(/:/g,''))fail('Registro de estudante/componente inválido.');
   if(!['institution','report'].includes(r.identityScope)||r.studentKey!==(r.studentId?'id:'+r.studentId:'row:'+r.sourceRow)||r.identityScope!==(r.studentId?'institution':'report'))fail('Identidade incompatível.');
   if(text(r.studentKey).length>150||(r.studentId!==null&&(typeof r.studentId!=='string'||!r.studentId||r.studentId.length>100)))fail('Identificador inválido.');
   if(identities.has(r.studentKey)&&identities.get(r.studentKey)!==r.studentName)fail('Identidade com nomes conflitantes.');identities.set(r.studentKey,r.studentName);
   if(!r.studentId){const name=norm(r.studentName);if(reportNames.has(name)&&reportNames.get(name)!==r.studentKey)fail('Homônimos/duplicidade sem matrícula.');reportNames.set(name,r.studentKey);}
   for(const k of ['grade','absences'])if(r[k]!==null&&(typeof r[k]!=='number'||!Number.isFinite(r[k])||r[k]<0||(k==='absences'&&!Number.isInteger(r[k]))))fail('Medida inválida (ausente deve ser null).');
   const id=r.studentKey+'|'+r.componentKey;if(ids.has(id))fail('Estudante/componente duplicado.');ids.add(id);
   return {studentKey:r.studentKey,studentId:r.studentId||null,studentName:r.studentName,identityScope:r.identityScope,sourceRow:r.sourceRow,component:r.component,componentKey:r.componentKey,grade:r.grade,absences:r.absences};
  });
  return {schemaVersion:VERSION,sourceType:d.sourceType,school:{code:d.school.code,name:text(d.school.name)},class:{code:d.class.code,name:text(d.class.name),shift:text(d.class.shift)},year:d.year,term:d.term,extractedAt:d.extractedAt,source:{fileName:text(d.source.fileName),sha256:d.source.sha256,sheet:text(d.source.sheet)},records:clean};
 }
 function empty(){return {schemaVersion:VERSION,revision:0,active:{},history:[],audit:[]};}
 function validStore(s){if(!s||s.schemaVersion!==VERSION||!Number.isInteger(s.revision)||s.revision<0||!s.active||Array.isArray(s.active)||!Array.isArray(s.history)||!Array.isArray(s.audit))fail('Backup de consolidados inválido.');const schools=new Set();for(const [k,d] of Object.entries(s.active)){if(key(validate(d))!==k)fail('Chave de backup incompatível.');schools.add(d.school.code);}for(const d of s.history){validate(d);schools.add(d.school.code);}if(schools.size>1)fail('Backup mistura escolas.');return JSON.parse(JSON.stringify(s));}
 function preview(store,docs){validStore(store);if(!Array.isArray(docs)||!docs.length||docs.length>MAX_BATCH)fail('Selecione de 1 a 20 arquivos.');const seen=new Set();return docs.map(input=>{const d=validate(input),k=key(d);if(seen.has(k))fail('Múltiplas versões da mesma turma/período no lote; selecione uma.');seen.add(k);const old=store.active[k];if(old?.source.sha256===d.source.sha256&&JSON.stringify(old.records)!==JSON.stringify(d.records))fail('Hash repetido com conteúdo incompatível.');return {key:k,kind:old?(old.source.sha256===d.source.sha256?'repeated':'replace'):'new',older:!!old&&Date.parse(d.extractedAt)<Date.parse(old.extractedAt),records:d.records.length,students:new Set(d.records.map(r=>r.studentKey)).size,document:d};});}
 function commit(store,docs,revision,confirmed){if(!confirmed)fail('Confirmação obrigatória.');if(store.revision!==revision)fail('A base mudou; gere nova prévia.');const p=preview(store,docs),next=validStore(store);for(const x of p){if(x.kind==='repeated')continue;if(next.active[x.key])next.history.push(next.active[x.key]);next.active[x.key]=x.document;next.audit.push({type:x.kind,key:x.key,hash:x.document.source.sha256,at:new Date().toISOString()});}if(p.some(x=>x.kind!=='repeated'))next.revision++;return next;}
 function summary(d){const map=new Map();for(const r of d.records){if(!map.has(r.componentKey))map.set(r.componentKey,{component:r.component,total:0,grades:0,gradeSum:0,missingGrades:0,absences:0,knownAbsences:0});const s=map.get(r.componentKey);s.total++;if(r.grade===null)s.missingGrades++;else{s.grades++;s.gradeSum+=r.grade;}if(r.absences!==null){s.absences+=r.absences;s.knownAbsences++;}}return [...map.values()].map(s=>({...s,mean:s.grades?s.gradeSum/s.grades:null}));}
 const api={VERSION,MAX_RECORDS,MAX_BATCH,norm,number,key,fromMatrix,validate,empty,validStore,preview,commit,summary};root.DED_CONSOLIDATED=Object.freeze(api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
