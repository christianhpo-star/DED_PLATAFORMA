'use strict';
/* Emulação dos serviços GAS testa autorização e ponto de commit sem acessar
 * contas ou planilhas institucionais. Falhas não promovem blocos órfãos. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),C=require('../src/js/22'),{matrix,source}=require('./consolidated-fixtures');
let email='qa@example.invalid',failWrite=false;
const tabs=new Map();
class Sheet{constructor(name){this.name=name;this.rows=[];}getLastRow(){return this.rows.length;}getMaxRows(){return 100000;}insertRowsAfter(){}getRange(row,col=1,n=1,m=1){const s=this;return {getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>s.rows[row+i-1]?.[col+j-1]??'')),getValue:()=>s.rows[row-1]?.[col-1]??'',setNumberFormat(){return this;},setValues(values){if(failWrite&&s.name==='DED_Manifestos'&&row>1)throw Error('simulated failure');values.forEach((r,i)=>{s.rows[row+i-1]||=[];r.forEach((v,j)=>s.rows[row+i-1][col+j-1]=v);});return this;}};}}
const props={DED_ALLOWED_EMAILS:email,DED_SCHOOL_CODE:'999999',DED_SPREADSHEET_ID:'private-test'};
const env={console,DED_CONSOLIDATED:C,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},Session:{getActiveUser:()=>({getEmail:()=>email})},SpreadsheetApp:{openById:()=>({getSheetByName:n=>tabs.get(n),insertSheet:n=>{const s=new Sheet(n);tabs.set(n,s);return s;}}),flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},Utilities:{DigestAlgorithm:{SHA_256:'SHA256'},Charset:{UTF_8:'utf8'},computeDigest:(alg,s)=>[...crypto.createHash('sha256').update(s).digest()]},HtmlService:{createHtmlOutputFromFile:()=>({setTitle(){return this;}})}};
vm.createContext(env);vm.runInContext(fs.readFileSync(require.resolve('../apps-script/Code.gs'),'utf8'),env);
env.setupStorage_();assert.equal(env.dedListConsolidated().revision,0);
const doc=C.fromMatrix(matrix(),source()),p=env.dedPreviewConsolidated([doc]);
const req={documents:[doc],digest:p.digest,revision:p.revision,confirmed:true};
assert.equal(env.dedCommitConsolidated(req).revision,1);assert.equal(env.dedListConsolidated().items.length,1);
const key=C.key(doc);assert.equal(env.dedGetConsolidated(key).document.records.length,4);
assert.throws(()=>env.dedCommitConsolidated(req),/mudou/);
const repeat=env.dedPreviewConsolidated([doc]);assert.equal(env.dedCommitConsolidated({...req,...repeat,documents:[doc]}).revision,1);
const other=C.fromMatrix(matrix(2),source('b')),preview=env.dedPreviewConsolidated([other]);
failWrite=true;assert.throws(()=>env.dedCommitConsolidated({...req,...preview,documents:[other]}),/simulated/);failWrite=false;assert.equal(env.dedListConsolidated().revision,1);assert.equal(env.dedListConsolidated().items.length,1);
assert.equal(env.dedCommitConsolidated({...req,...preview,documents:[other]}).revision,2);
assert.equal(env.dedRestoreConsolidated({target:1,revision:2,confirmed:true}).items.length,1);
assert.equal(env.dedListConsolidated().revision,3);assert.throws(()=>env.dedRestoreConsolidated({target:1,revision:2,confirmed:true}),/mudou/);
// Documento em múltiplos blocos valida readback/hash e supera o tamanho de uma célula.
const large=JSON.parse(JSON.stringify(doc));large.source.sha256='f'.repeat(64);large.records=[];
for(let i=0;i<600;i++)for(const r of doc.records.slice(0,2))large.records.push({...r,studentKey:'row:'+(i+7),sourceRow:i+7,studentName:'ESTUDANTE SINTETICO '+i});
const lp=env.dedPreviewConsolidated([large]);env.dedCommitConsolidated({...req,...lp,documents:[large]});assert.equal(env.dedGetConsolidated(key).document.records.length,1200);
const blocks=tabs.get('DED_Blocos'),last=blocks.rows.at(-1),saved=last[2];last[2]='corrupted';assert.throws(()=>env.dedListConsolidated(),/Integridade/);last[2]=saved;
const foreign=JSON.parse(JSON.stringify(doc));foreign.school.code='123';assert.throws(()=>env.dedPreviewConsolidated([foreign]),/Escola/);
email='';for(const f of [()=>env.doGet(),()=>env.dedListConsolidated(),()=>env.dedGetConsolidated(key),()=>env.dedPreviewConsolidated([doc]),()=>env.dedCommitConsolidated(req),()=>env.dedRestoreConsolidated({})])assert.throws(f,/autorizado/);
email='intruder@example.invalid';assert.throws(()=>env.dedListConsolidated(),/autorizado/);
console.log('PASS: GAS ACL, escola, lote, leitura indexada, repetição, concorrência, falha antes de commit e restauração.');
// Reutilizado pelo teste da ponte real google.script.run em Chromium, sem nuvem.
module.exports={env,resetEmail:()=>{email='qa@example.invalid';}};
