'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'src','js','19.js'),'utf8');
const weekly=fs.readFileSync(path.join(root,'src','js','07.js'),'utf8');
const imports=fs.readFileSync(path.join(root,'src','js','15.js'),'utf8');
const temporal=fs.readFileSync(path.join(root,'src','js','18.js'),'utf8');
const html=fs.readFileSync(path.join(root,'src','index.html'),'utf8');
const clone=v=>JSON.parse(JSON.stringify(v));
const through={'2026-09-10':0,'2026-09-18':7,'2026-09-23':10,'2026-09-25':12,'2026-10-02':17};
const snaps=[
 {date:'2026-09-18',intervalDays:7,daysToDate:7,fileName:'a.xlsx',rows:[]},
 {date:'2026-09-25',intervalDays:5,daysToDate:12,fileName:'b.xlsx',rows:[]},
 {date:'2026-10-02',intervalDays:5,daysToDate:17,fileName:'c.xlsx',rows:[]}
];
const ctx={
 console,
 state:{weeklySnapshotDate:'',weeklyManageDate:'',weeklySelected:new Set()},
 dataStore:{weeklySnapshots:clone(snaps)},
 safeClone:clone,
 officialDaysThrough:d=>through[d]??0,
 officialDaysBetween:(a,b)=>(through[b]??0)-(through[a]??0),
 formatDateBR:v=>v,
 esc:v=>String(v??''),
 moneyless:v=>String(v??''),
 icon:()=>'',btn:()=>'<button></button>',
 localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
 SAFE_IMPORT_RESTORE_KEY:'restore',
 DATA:{refs:{}},
 createLocalRestorePoint:()=>{},
 hydrateDataStore:()=>{},
 saveDataStore:()=>true,
 syncFilterOptions:()=>{},
 render:()=>{},
 setImportStatus:()=>{},
 queueSafeImport:()=>{},
 beginWeeklyPrint:()=>{},
 exportWeeklyCSV:()=>{},
 document:{addEventListener:()=>{},getElementById:()=>null},
 requestAnimationFrame:fn=>fn(),
 window:{}
};
vm.createContext(ctx);vm.runInContext(code,ctx);

ctx.state.weeklySnapshotDate='2026-09-25';
let selected=ctx.weeklySnapshotContext();
assert.strictEqual(selected.cur.date,'2026-09-25','Snapshot histórico selecionado deve ser aberto.');
assert.strictEqual(selected.prev.date,'2026-09-18','Relatório histórico deve usar o snapshot imediatamente anterior.');
assert.strictEqual(selected.isLatest,false,'Snapshot intermediário não pode ser tratado como semana atual.');

ctx.state.weeklySnapshotDate='2026-09-18';
selected=ctx.weeklySnapshotContext();
assert.strictEqual(selected.prev,null,'Primeiro snapshot não possui extração anterior.');
assert.strictEqual(selected.index,0,'Primeiro snapshot deve permanecer primeiro na sequência.');

let impact=ctx.snapshotImpact('date','2026-09-25','2026-09-23');
assert.strictEqual(impact.impacts.length,2,'Corrigir snapshot intermediário deve recalcular ele e a semana subsequente.');
const changed=impact.afterSnapshots.find(s=>s.date==='2026-09-23');
const next=impact.afterSnapshots.find(s=>s.date==='2026-10-02');
assert.strictEqual(changed.intervalDays,3,'Nova data intermediária deve recalcular seu intervalo desde 18/09.');
assert.strictEqual(next.intervalDays,7,'Semana subsequente deve ser recalculada desde a nova data intermediária.');

impact=ctx.snapshotImpact('delete','2026-09-25');
assert.strictEqual(impact.afterSnapshots.length,2,'Exclusão deve remover somente o snapshot escolhido.');
assert.strictEqual(impact.afterSnapshots.find(s=>s.date==='2026-10-02').intervalDays,10,'Excluir snapshot intermediário deve recalcular o intervalo seguinte desde 18/09.');
assert.throws(()=>ctx.snapshotImpact('date','2026-09-25','2026-10-02'),/Já existe um snapshot/,'Data duplicada deve ser rejeitada.');

for(const action of ['view-weekly-snapshot','print-weekly-snapshot','export-weekly-snapshot','manage-weekly-snapshot'])assert(weekly.includes(action),'Histórico deve expor ação: '+action);
assert(weekly.includes('weeklySnapshotContext()'),'Comparação semanal deve respeitar snapshot selecionado.');
assert(imports.includes("async function queueSafeImport(file,target,dateOverride='')"),'Substituição histórica deve aceitar data explícita.');
assert(imports.includes('state.weeklySnapshotDate=candidate.date'),'Substituir snapshot deve manter a semana substituída selecionada.');
assert(code.includes("queueSafeImport(file,'weekly',date)"),'Substituição de arquivo deve reutilizar o fluxo seguro de importação.');
assert(code.includes('createLocalRestorePoint'),'Gestão destrutiva deve criar ponto de restauração.');
assert(code.includes('impactTable(impact)'),'Alteração destrutiva deve mostrar impacto antes da confirmação.');
assert(temporal.includes('const {cur,prev}=weeklySnapshotContext()'),'Contexto temporal deve acompanhar o snapshot histórico.');
assert(html.includes('id="manage-weekly-file"'),'Input oculto de substituição de snapshot deve existir.');
assert(html.includes('js/19.js'),'Módulo de histórico semanal deve ser carregado.');

console.log('OK: navegação histórica, impacto de intervalos e gestão segura de snapshots verificados.');
