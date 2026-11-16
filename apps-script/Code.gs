/* Servidor da MESMA interface DED. Snapshots imutáveis + manifesto final dão
 * atomicidade lógica: falha antes do manifesto deixa apenas blocos órfãos. */
function dedAuth_(){
 const p=PropertiesService.getScriptProperties(),email=Session.getActiveUser().getEmail().toLowerCase();
 const allowed=(p.getProperty('DED_ALLOWED_EMAILS')||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
 if(!email||!allowed.includes(email))throw new Error('Acesso não autorizado.');
 const code=p.getProperty('DED_SCHOOL_CODE'),id=p.getProperty('DED_SPREADSHEET_ID');
 if(!/^\d{1,12}$/.test(code||'')||!id)throw new Error('Configuração institucional pendente.');
 return {email,code,id};
}
function doGet(){dedAuth_();return HtmlService.createHtmlOutputFromFile('Index').setTitle('DED em foco');}
// Executar manualmente pelo editor após configurar propriedades; nunca exposta por google.script.run.
function setupStorage_(){
 const a=dedAuth_(),ss=SpreadsheetApp.openById(a.id);
 for(const [name,headers] of [['DED_Manifestos',['revisao','manifesto_json','data_iso','autor','operacao']],['DED_Blocos',['hash','parte','json']]]){
  let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);
  if(s.getLastRow()===0)s.getRange(1,1,1,headers.length).setValues([headers]);
  else if(JSON.stringify(s.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw new Error('Cabeçalho incompatível; armazenamento preservado.');
 }
}
function dedSheets_(a){const ss=SpreadsheetApp.openById(a.id),m=ss.getSheetByName('DED_Manifestos'),b=ss.getSheetByName('DED_Blocos');if(!m||!b)throw new Error('Execute setupStorage_ no editor.');return {m,b,code:a.code};}
function dedManifest_(s){const n=s.m.getLastRow();if(n<2)return {revision:0,active:{}};const r=s.m.getRange(n,1,1,2).getValues()[0],m=dedReadJson_(s,JSON.parse(r[1]));if(m.revision!==r[0]||!m.active)throw new Error('Manifesto inválido; contate o administrador.');if(Object.keys(m.active).some(k=>!k.startsWith(s.code+'|')))throw new Error('Planilha vinculada a outra escola.');return m;}
function dedHash_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(x=>('0'+((x+256)%256).toString(16)).slice(-2)).join('');}
function dedReadJson_(s,ptr){
 const rows=s.b.getRange(ptr.start,1,ptr.count,3).getValues();
 if(rows.some((r,i)=>r[0]!==ptr.hash||r[1]!==i))throw new Error('Blocos inconsistentes.');
 const json=rows.map(r=>r[2]).join('');if(dedHash_(json)!==ptr.hash)throw new Error('Integridade do snapshot inválida.');return JSON.parse(json);
}
function dedRead_(s,ptr){return DED_CONSOLIDATED.validate(dedReadJson_(s,ptr));}
// A grade do Sheets é ampliada somente quando necessária, sem recriar abas ou apagar histórico.
function dedGrow_(sheet,lastRow){const max=sheet.getMaxRows();if(lastRow>max)sheet.insertRowsAfter(max,lastRow-max);}
function dedWriteJson_(s,value){
 const json=JSON.stringify(value),hash=dedHash_(json),chunks=[];
 for(let pos=0;pos<json.length;){let end=Math.min(pos+30000,json.length);if(end<json.length&&/[\uD800-\uDBFF]/.test(json[end-1]))end--;chunks.push([hash,chunks.length,json.slice(pos,end)]);pos=end;}
 const start=s.b.getLastRow()+1;dedGrow_(s.b,start+chunks.length-1);s.b.getRange(start,1,chunks.length,3).setNumberFormat('@').setValues(chunks);
 const pointer={start,count:chunks.length,hash};
 // Readback antes de promover o manifesto confirma preservação dos blocos no Sheets.
 dedReadJson_(s,pointer);return pointer;
}
function dedWrite_(s,d){
 const pointer=dedWriteJson_(s,DED_CONSOLIDATED.validate(d));
 // Índice contém apenas metadados e agregados; nomes ficam nos blocos privados.
 return {...pointer,sourceHash:d.source.sha256,school:d.school,class:d.class,year:d.year,term:d.term,extractedAt:d.extractedAt,summary:DED_CONSOLIDATED.summary(d),students:new Set(d.records.map(r=>r.studentKey)).size,records:d.records.length};
}
function dedDocs_(a,docs){
 if(JSON.stringify(docs).length>2000000)throw new Error('Lote maior que 2 MB; divida a seleção.');
 if(!Array.isArray(docs)||!docs.length||docs.length>20)throw new Error('Lote fora do limite.');
 return docs.map(x=>{const d=DED_CONSOLIDATED.validate(x);if(d.school.code!==a.code)throw new Error('Escola incompatível com esta instalação.');return d;});
}
function dedPublicManifest_(m){return {revision:m.revision,items:Object.entries(m.active).map(([key,p])=>({key,school:p.school,class:p.class,year:p.year,term:p.term,extractedAt:p.extractedAt,students:p.students,records:p.records,summary:p.summary}))};}
function dedListConsolidated(){const a=dedAuth_(),s=dedSheets_(a);return dedPublicManifest_(dedManifest_(s));}
function dedGetConsolidated(key){const a=dedAuth_(),s=dedSheets_(a),m=dedManifest_(s);if(!m.active[key]||!key.startsWith(a.code+'|'))throw new Error('Turma/período não localizado.');return {revision:m.revision,document:dedRead_(s,m.active[key])};}
function dedPreviewConsolidated(input){
 const a=dedAuth_(),s=dedSheets_(a),m=dedManifest_(s),docs=dedDocs_(a,input),store=DED_CONSOLIDATED.empty();store.revision=m.revision;
 for(const d of docs){const k=DED_CONSOLIDATED.key(d);if(m.active[k])store.active[k]=dedRead_(s,m.active[k]);}
 return {revision:m.revision,items:DED_CONSOLIDATED.preview(store,docs).map(({document,...x})=>x),digest:dedHash_(JSON.stringify(docs))};
}
function dedCommitConsolidated(request){
 const a=dedAuth_(),docs=dedDocs_(a,request.documents);
 if(request.confirmed!==true||request.digest!==dedHash_(JSON.stringify(docs)))throw new Error('Prévia/confirmacão incompatível.');
 const lock=LockService.getScriptLock();if(!lock.tryLock(20000))throw new Error('Outra importação em curso; tente novamente.');
 try{
  const s=dedSheets_(a),old=dedManifest_(s);if(request.revision!==old.revision)throw new Error('A base mudou; refaça a prévia.');
  const active=JSON.parse(JSON.stringify(old.active)),keys=new Set();let changed=false;
  const store=DED_CONSOLIDATED.empty();for(const d of docs){const k=DED_CONSOLIDATED.key(d);if(active[k])store.active[k]=dedRead_(s,active[k]);}DED_CONSOLIDATED.preview(store,docs);
  for(const d of docs){const k=DED_CONSOLIDATED.key(d);if(keys.has(k))throw new Error('Versões conflitantes no lote.');keys.add(k);}
  for(const d of docs){const k=DED_CONSOLIDATED.key(d);if(active[k]?.sourceHash===d.source.sha256)continue;active[k]=dedWrite_(s,d);changed=true;}
  if(!changed)return dedPublicManifest_(old);
  const next={revision:old.revision+1,active};dedPublish_(s,next,a.email,'import');return dedPublicManifest_(next);
 }finally{lock.releaseLock();}
}
function dedPublish_(s,m,actor,operation){
 // Manifestos também usam blocos, evitando o limite de 50 mil caracteres/célula.
 if(Object.keys(m.active).length>200)throw new Error('Limite de 200 turmas/períodos por instalação.');
 const pointer=dedWriteJson_(s,m);SpreadsheetApp.flush();const row=s.m.getLastRow()+1;dedGrow_(s.m,row);s.m.getRange(row,1,1,5).setValues([[m.revision,JSON.stringify(pointer),new Date().toISOString(),actor,operation]]);SpreadsheetApp.flush();
}
// Restaura ponteiros de uma revisão imutável. A revisão atual permanece no histórico.
function dedRestoreConsolidated(request){
 const a=dedAuth_();if(request.confirmed!==true||!Number.isInteger(request.target)||request.target<0)throw new Error('Confirmação/revisão inválida.');
 const lock=LockService.getScriptLock();if(!lock.tryLock(20000))throw new Error('Operação concorrente.');
 try{const s=dedSheets_(a),old=dedManifest_(s);if(old.revision!==request.revision)throw new Error('A base mudou; atualize.');
  const rows=s.m.getLastRow()-1;if(request.target>rows)throw new Error('Revisão não localizada.');
  const target=request.target===0?{revision:0,active:{}}:dedReadJson_(s,JSON.parse(s.m.getRange(request.target+1,2).getValue()));
  if(target.revision!==request.target)throw new Error('Revisão inconsistente.');
  for(const [k,ptr] of Object.entries(target.active)){if(!k.startsWith(a.code+'|'))throw new Error('Escola incompatível.');dedRead_(s,ptr);}
  const next={revision:old.revision+1,active:target.active};dedPublish_(s,next,a.email,'restore:'+request.target);return dedPublicManifest_(next);
 }finally{lock.releaseLock();}
}
