'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'src','js','17.js'),'utf8');
const events=fs.readFileSync(path.join(root,'src','js','13.js'),'utf8');
const grades=fs.readFileSync(path.join(root,'src','js','04.js'),'utf8');
const html=fs.readFileSync(path.join(root,'src','index.html'),'utf8');
const rows=[
 {id:'a',cod_turma:'1',shortClass:'1 REG 1',turma:'1 REG 1',professor:'A',componente:'MAT',unit:'aulas',status:'ABERTO',plan:{value:null},comparable:false,grade:{status:'none'},teacherConflict:true,dataConflict:false,duplicateSourceRows:1},
 {id:'b',cod_turma:'2',shortClass:'1 REG 2',turma:'1 REG 2',professor:'B',componente:'POR',unit:'aulas',status:'FECHADO',plan:{value:10},comparable:true,grade:{status:'partial'},teacherConflict:false,dataConflict:true,duplicateSourceRows:2},
 {id:'c',cod_turma:'3',shortClass:'1 REG 3',turma:'1 REG 3',professor:'C',componente:'HIS',unit:'aulas',status:'FECHADO',plan:{value:10},comparable:false,grade:{status:'unknown'},teacherConflict:false,dataConflict:false,duplicateSourceRows:1}
];
const weekly=[
 {cod_turma:'1',turma:'1 REG 1',professor:'A',componente:'MAT',minimum:4,delta:2,met80:false,stage:'EM'},
 {cod_turma:'2',turma:'1 REG 2',professor:'B',componente:'POR',minimum:null,delta:null,met80:false,stage:'EM'}
];
const ctx={
 console,
 state:{trimester:'3',stage:'',matrixGroup:'',classId:'',teacher:'',query:''},
 dataStore:{weeklySnapshots:[{date:'2026-09-18'}]},
 baseRows:()=>rows,
 normalize:v=>String(v??'').toLowerCase(),
 stage:r=>r.stage||'EM',
 rowMatchesOfferFilter:()=>true,
 weeklyComparison:()=>weekly,
 weeklyTeacherGroups:list=>{
  const names=[...new Set(list.map(r=>r.professor))];
  return names.map(name=>{const records=list.filter(r=>r.professor===name);return {name,records,below:records.filter(r=>r.minimum!==null&&r.delta!==null&&!r.met80),unassessed:records.filter(r=>r.minimum===null||r.delta===null)};});
 },
 teacherConflictUnresolved:r=>!!r.teacherConflict,
 logicalKey:r=>r.cod_turma+'|'+r.componente,
 esc:v=>String(v??''),
 btn:(label,action)=>'<button data-action="'+action+'">'+label+'</button>',
 icon:()=>'',badge:v=>'<span>'+v+'</span>',
 title:v=>v,
 window:{}
};
vm.createContext(ctx);vm.runInContext(code,ctx);
const a=ctx.attentionSnapshot();
assert.strictEqual(a.open.length,1,'Fechamento deve contar somente diários abertos.');
assert.strictEqual(a.gradeNone.length,1,'Sem notas deve permanecer categoria própria.');
assert.strictEqual(a.gradePartial.length,1,'Notas parciais devem permanecer categoria própria.');
assert.strictEqual(a.gradeUnknown.length,1,'Cobertura não verificada deve permanecer separada.');
assert.strictEqual(a.missingReference.length,1,'Referência ausente deve ser identificada.');
assert.strictEqual(a.notComparable.length,2,'Não comparáveis não devem ser convertidos em zero.');
assert.strictEqual(a.unresolvedTeacher.length,1,'Responsável a confirmar deve ser identificado.');
assert.strictEqual(a.dataConflict.length,1,'Conflito de dados deve ser identificado.');
assert.strictEqual(a.duplicates.length,1,'Duplicidade consolidada deve ser identificada.');
assert.strictEqual(a.weeklyBelowTeachers.length,1,'Regra semanal deve contar professor com ao menos um diário abaixo.');
assert.strictEqual(a.weeklyUnassessed.length,1,'Diário semanal sem base deve permanecer separado.');
const markup=ctx.attentionCenter();
assert(markup.includes('As categorias são independentes e não devem ser somadas entre si.'),'Central deve explicar que categorias não formam total.');
assert(!markup.includes('total de pendências'),'Central não deve apresentar agregado enganoso.');
for(const action of ['attention-weekly','attention-closure','attention-grades','attention-references','attention-integrity'])assert(events.includes("a==='"+action+"'"),'Ação contextual ausente: '+action);
assert(grades.includes("state.gradeMode==='attention'&&['none','partial','unknown'].includes"),'Filtro de notas em atenção deve reunir situações acionáveis sem alterar classificações.');
assert(!html.includes('id="nav-open"'),'Badge agregado ambíguo não deve voltar à navegação principal.');
console.log('OK: categorias, contagens e navegação da Central de Atenção verificadas.');
