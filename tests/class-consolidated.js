'use strict';
// Regressões de contrato, duplicação, preservação e ausência versus zero.
const assert=require('node:assert/strict'),C=require('../src/js/22'),{matrix,source}=require('./consolidated-fixtures');
const doc=(t=1,c='101',g='0',h='a')=>C.fromMatrix(matrix(t,c,g),source(h));
const a=doc();assert.equal(a.records.length,4);assert.equal(a.records[0].grade,0);assert.equal(a.records[1].grade,null);assert.equal(a.records[3].absences,null);
let store=C.empty();assert.throws(()=>C.commit(store,[a],0,false));assert.equal(store.revision,0);
store=C.commit(store,[a],0,true);assert.equal(store.revision,1);assert.equal(Object.keys(store.active).length,1);
assert.equal(C.commit(store,[a],1,true).revision,1);
assert.throws(()=>C.preview(store,[a,a]),/versões/);
assert.throws(()=>C.commit(store,[a],0,true),/mudou/);
const b=doc(1,'101','8','b');store=C.commit(store,[b],1,true);assert.equal(store.history.length,1);assert.equal(store.history[0].records[0].grade,0);
store=C.commit(store,[doc(2,'101','3','c'),doc(3,'101','4','d'),doc(1,'102','5','e')],2,true);assert.equal(Object.keys(store.active).length,4);
assert(C.validStore(JSON.parse(JSON.stringify(store))));assert.equal(C.summary(a)[0].mean,9);assert.equal(C.summary(a)[1].missingGrades,1);
const unknown=matrix();unknown[4][1]='COMPONENTE NÃO RECONHECIDO';assert.equal(C.fromMatrix(unknown,source()).records[0].component,'COMPONENTE NÃO RECONHECIDO');
// Cabeçalho real de duas linhas: concatena fragmentos, sem truncar componente técnico.
const wrapped=matrix();wrapped[4][1]='PROJETOS INTEGRADORES';wrapped.splice(5,0,['','E CORRESPONSABILIDADE SOCIAL','','','']);assert.equal(C.fromMatrix(wrapped,source()).records[0].component,'PROJETOS INTEGRADORES E CORRESPONSABILIDADE SOCIAL');
for(const mutate of [m=>m[0]=['sem escola'],m=>m[5][1]='2º TRIMESTRE',m=>m[6][1]='texto inválido',m=>m[6][2]='1.5']){const m=matrix();mutate(m);assert.throws(()=>C.fromMatrix(m,source()));}
const duplicate=JSON.parse(JSON.stringify(a));duplicate.records.push(duplicate.records[0]);assert.throws(()=>C.validate(duplicate),/duplicado/);
const missing=JSON.parse(JSON.stringify(a));delete missing.records[0].grade;assert.throws(()=>C.validate(missing));
assert.throws(()=>C.validStore({...store,schemaVersion:88}));assert.equal(Object.values(C.commit(C.empty(),[doc()],0,true).active).some(d=>d.term===3),false);
console.log('PASS: contrato, T1/T2/T3, ausências, duplicação, versões, concorrência, backup e componentes desconhecidos.');
