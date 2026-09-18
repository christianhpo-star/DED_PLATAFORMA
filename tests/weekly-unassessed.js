'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'src','js','07.js'),'utf8');
const ctx={
 console,
 formatDateBR:v=>v,
 esc:v=>String(v??''),
 title:v=>String(v??''),
 badge:(text,type='')=>'<span class="'+type+'">'+text+'</span>',
 moneyless:v=>v===null||v===undefined?'—':String(v),
 percent:v=>v===null?'—':String(v)+'%',
 schoolName:()=>'Escola Teste',
 state:{weeklyPrintMode:'',weeklyPrintTeachers:new Set(),weeklySelected:new Set()},
 dataStore:{weeklySnapshots:[]},
 window:{},
 document:{},
 requestAnimationFrame:fn=>fn()
};
vm.createContext(ctx);vm.runInContext(code,ctx);

const rows=[
 {professor:'Professor X',shortClass:'1 A',componente:'MAT',delta:2,minimum:4,met80:false,missingToMinimum:2,expected:5,ratio:40,previous:10,current:12},
 {professor:'Professor X',shortClass:'1 B',componente:'FIS',delta:2,minimum:null,met80:false,missingToMinimum:null,expected:null,ratio:null,previous:4,current:6},
 {professor:'Professor X',shortClass:'1 C',componente:'POR',delta:5,minimum:4,met80:true,missingToMinimum:0,expected:5,ratio:100,previous:7,current:12}
];
const g=ctx.weeklyTeacherGroups(rows)[0];
assert.strictEqual(g.below.length,1,'Somente diário avaliável abaixo do mínimo entra em below.');
assert.strictEqual(g.unassessed.length,1,'Diário sem mínimo deve permanecer em sem base.');
assert.strictEqual(g.assessed.length,2,'Diário sem base não pode entrar na base avaliada.');
assert.strictEqual(g.compliant,false,'Professor com diário abaixo e sem base não pode ser marcado como regular.');

const markup=ctx.weeklyTeacherPrintSheet(g,{date:'2026-09-18',intervalDays:7},null);
assert(markup.includes('Abaixo do mínimo de 80% · 1'),'Impressão individual deve mostrar diário abaixo.');
assert(markup.includes('Sem base para avaliar · 1'),'Impressão individual deve mostrar também diário sem base.');
assert(markup.includes('não entram no percentual como zero'),'Impressão deve explicar que sem base não vira zero.');

assert(code.includes("const attention=groups.filter(g=>g.below.length),ok=groups.filter(g=>g.compliant),unassessed=groups.filter(g=>g.unassessed.length);"),'Resumo semanal deve incluir todos os professores com sem base, inclusive quem também está abaixo.');
assert(code.includes("weeklyUnassessedTable(g.unassessed)"),'Interface deve detalhar os diários sem base do professor em atenção.');
assert(code.includes("unassessedTeachers=groups.filter(g=>g.unassessed.length)"),'KPI de insuficiência de base deve contar professores mesmo quando também estão em atenção.');
assert(code.includes("selected=groups.filter(g=>state.weeklyPrintTeachers.has(g.name)&&(g.below.length||g.unassessed.length))"),'Impressão individual deve aceitar professor com diário sem base.');

console.log('OK: sobreposição entre abaixo do mínimo, sem base e dentro do mínimo verificada.');
