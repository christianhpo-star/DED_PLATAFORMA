'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const code=fs.readFileSync(path.join(__dirname,'..','src','js','16.js'),'utf8');
const storage=new Map();
const statuses=[];
let restoreCreated=0;
const clone=v=>JSON.parse(JSON.stringify(v));
const ctx={
 console,
 DATA:{datasetId:'ded-plataforma-template-2026',refs:{BASE:{weekly:1}}},
 dataStore:{t1:null,t2:null,weeklySnapshots:[]},
 state:{trimester:'2'},
 schoolProfile:()=>({name:'Escola Teste'}),
 schoolFileStem:()=>'teste',
 safeClone:clone,
 downloadFile:()=>{},
 setImportStatus:(...args)=>statuses.push(args),
 setImportStep:()=>{},
 setDataOperationBusy:()=>{},
 nextImportPaint:()=>Promise.resolve(),
 safeImportBusy:false,
 normalize:v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),
 formatDateBR:v=>v,
 btn:()=>'<button></button>',
 icon:()=>'',esc:v=>String(v??''),
 SAFE_IMPORT_RESTORE_KEY:'restore',
 localStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
 createLocalRestorePoint:()=>{restoreCreated++;storage.set('restore','new-point');},
 hydrateDataStore:(store,refs)=>{ctx.dataStore=clone(store);ctx.DATA.refs=clone(refs);},
 saveDataStore:()=>true,
 getActiveRaw:()=>[],
 syncFilterOptions:()=>{},
 render:()=>{},
 document:{addEventListener:()=>{},getElementById:()=>null},
 window:{}
};
vm.createContext(ctx);
vm.runInContext(code,ctx);
const row={cod_turma:'1',componente:'MATEMATICA',professor:'PROFESSOR TESTE',turma:'1 REG 1',unit:'aulas',total:'10'};
const valid={version:2,datasetId:'ded-plataforma-template-2026',school:{name:'Escola Teste'},exportedAt:'2026-09-18T12:00:00.000Z',dataStore:{t1:[row],t2:null,weeklySnapshots:[]},refs:{BASE:{weekly:1}}};
const checked=ctx.validateDataBackup(clone(valid));
assert.strictEqual(checked.store.t1.length,1,'Backup válido deve preservar T1.');
assert.strictEqual(checked.datasetId,valid.datasetId,'Dataset validado deve ser preservado.');
assert.throws(()=>ctx.validateDataBackup({...clone(valid),version:1}),/Versão de backup incompatível/,'Versão incompatível deve ser rejeitada.');
assert.throws(()=>ctx.validateDataBackup({...clone(valid),datasetId:'outro'}),/outro conjunto de dados/,'Dataset diferente deve ser rejeitado.');
const noRefs=clone(valid);delete noRefs.refs;
assert.throws(()=>ctx.validateDataBackup(noRefs),/referências necessárias/,'Backup sem referências deve ser rejeitado.');
const badRow=clone(valid);badRow.dataStore.t1=[{cod_turma:'1'}];
assert.throws(()=>ctx.validateDataBackup(badRow),/registro inválido/,'Registro estruturalmente inválido deve ser rejeitado.');
const duplicate=clone(valid);duplicate.dataStore.t1=null;duplicate.dataStore.weeklySnapshots=[{date:'2026-09-18',rows:[row]},{date:'2026-09-18',rows:[row]}];
assert.throws(()=>ctx.validateDataBackup(duplicate),/mais de um snapshot/,'Datas semanais duplicadas devem ser rejeitadas.');
ctx.dataStore={t1:null,t2:[row],weeklySnapshots:[]};
const payload=ctx.backupDataStorePayload();
assert.strictEqual(payload.version,2,'Exportação deve usar schema v2.');
assert.strictEqual(payload.datasetId,ctx.DATA.datasetId,'Exportação deve registrar dataset.');
assert(payload.refs.BASE,'Exportação deve incluir referências necessárias à reconstrução.');
ctx.dataStore={t1:null,t2:null,weeklySnapshots:[]};ctx.DATA.refs={BASE:{weekly:1}};restoreCreated=0;statuses.length=0;
const candidate=ctx.validateDataBackup(clone(valid));candidate.fileName='backup.json';
ctx.commitDataBackupRestore(candidate);
assert.strictEqual(restoreCreated,1,'Restauração deve criar ponto de restauração antes do commit.');
assert.strictEqual(ctx.dataStore.t1.length,1,'Restauração confirmada deve aplicar a base validada.');
assert(statuses.some(s=>s[1]==='Concluído'),'Restauração concluída deve deixar feedback persistente.');
ctx.dataStore={t1:null,t2:[row],weeklySnapshots:[]};ctx.DATA.refs={BASE:{weekly:1}};storage.set('restore','old-point');
const original=clone(ctx.dataStore);ctx.saveDataStore=()=>false;
assert.throws(()=>ctx.commitDataBackupRestore(Object.assign(ctx.validateDataBackup(clone(valid)),{fileName:'backup.json'})),/base anterior foi mantida/,'Falha de persistência deve abortar restauração.');
assert.deepStrictEqual(ctx.dataStore,original,'Falha de persistência deve restaurar a base em memória.');
assert.strictEqual(storage.get('restore'),'old-point','Falha deve preservar ponto de restauração anterior.');
console.log('OK: validação, restauração, rollback e versionamento de backup verificados.');
