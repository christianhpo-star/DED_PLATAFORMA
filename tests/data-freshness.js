'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const code=fs.readFileSync(path.join(__dirname,'..','src','js','18.js'),'utf8');
function context(){
 const ctx={
  console,
  state:{page:'weekly',trimester:'3'},
  dataStore:{t1:null,t2:null,weeklySnapshots:[],importMeta:{t1:null,t2:null}},
  DATA:{raw:[],raw_t1:[]},
  formatDateBR:v=>{const [y,m,d]=String(v).split('-');return d+'/'+m+'/'+y;},
  icon:()=>'',esc:v=>String(v??''),
  document:{getElementById:()=>null},
  initialTrimester:()=> '3',
  window:{}
 };
 vm.createContext(ctx);vm.runInContext(code,ctx);return ctx;
}
let ctx=context();
let c=ctx.dataFreshnessContext();
assert(c.title.includes('sem snapshot'),'Sem snapshot deve ser explicitado, sem fingir intervalo.');

ctx=context();
ctx.dataStore.weeklySnapshots=[{date:'2026-09-18',intervalDays:7,fileName:'primeiro.xlsx',importedAt:Date.UTC(2026,8,18,12)}];
c=ctx.dataFreshnessContext();
assert.strictEqual(c.title,'Semana 10/09/2026 → 18/09/2026 — novos lançamentos','Primeiro snapshot deve usar base zero em 10/09.');
assert(c.detail.includes('Primeira comparação com base zero'),'Primeiro snapshot deve explicar a base zero.');

ctx=context();
ctx.dataStore.weeklySnapshots=[
 {date:'2026-09-18',intervalDays:7,fileName:'a.xlsx',importedAt:Date.UTC(2026,8,18,12)},
 {date:'2026-09-25',intervalDays:5,fileName:'b.xlsx',importedAt:Date.UTC(2026,8,25,12)}
];
c=ctx.dataFreshnessContext();
assert.strictEqual(c.title,'Semana 18/09/2026 → 25/09/2026 — novos lançamentos','Snapshot subsequente deve mostrar o intervalo entre extrações.');
assert(c.detail.includes('Comparação entre duas extrações'),'Snapshot subsequente deve explicitar natureza comparativa.');

ctx.state.page='overview';ctx.state.trimester='3';
c=ctx.dataFreshnessContext();
assert.strictEqual(c.title,'3º trimestre — acumulado até 25/09/2026','Visão geral do T3 deve ser acumulada até o snapshot atual.');
assert.strictEqual(c.nature,'ACUMULADO','T3 fora da página semanal deve ser rotulado como acumulado.');

ctx=context();ctx.state.page='overview';ctx.state.trimester='2';
ctx.dataStore.t2=[{}];ctx.dataStore.importMeta.t2={fileName:'t2.xlsx',importedAt:Date.UTC(2026,8,9,12),fileModifiedAt:0};
c=ctx.dataFreshnessContext();
assert(c.title.startsWith('2º trimestre — leitura importada em'),'T1/T2 devem exibir a data da importação local quando disponível.');
assert(c.detail.includes('t2.xlsx'),'Contexto deve identificar o arquivo quando conhecido.');

const source03=fs.readFileSync(path.join(__dirname,'..','src','js','03.js'),'utf8');
assert(source03.includes("trimester:initialTrimester()"),'Estado inicial não pode permanecer fixo no 2º trimestre.');
const source15=fs.readFileSync(path.join(__dirname,'..','src','js','15.js'),'utf8');
assert(source15.includes('fileModifiedAt:Number(file.lastModified)||0'),'Importação deve preservar a data do arquivo quando fornecida pelo navegador.');
assert(source15.includes('dataStore.importMeta.t1')&&source15.includes('dataStore.importMeta.t2'),'T1/T2 devem registrar metadados de importação.');
const source13=fs.readFileSync(path.join(__dirname,'..','src','js','13.js'),'utf8');
assert(source13.includes("'Contexto temporal','Natureza da visão','Origem temporal'"),'CSV deve carregar o contexto temporal.');
assert(source13.includes("if(state.page==='weekly')return exportWeeklyCSV()"),'Exportação da página semanal deve usar diferenças entre extrações, não a base acumulada.');
assert(source13.includes("'Antes','Agora','Novos lançamentos','Previsto no intervalo'"),'CSV semanal deve declarar a natureza dos valores exportados.');
const source14=fs.readFileSync(path.join(__dirname,'..','src','js','14.js'),'utf8');
assert(source14.includes('RAW=getActiveRaw();updateSchoolUI()'),'Bootstrap deve alinhar a base ativa ao período inicial dinâmico.');
const html=fs.readFileSync(path.join(__dirname,'..','src','index.html'),'utf8');
assert(html.includes('id="data-context"'),'Contexto temporal deve ter região persistente na interface.');

console.log('OK: contexto temporal, atualidade, acumulado e intervalos semanais verificados.');
