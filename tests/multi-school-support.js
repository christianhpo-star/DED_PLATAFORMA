'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const src01 = fs.readFileSync(path.join(root, 'src', 'js', '01.js'), 'utf8');
const src02 = fs.readFileSync(path.join(root, 'src', 'js', '02.js'), 'utf8');

// Build test context with 01.js and 02.js
const mockData = {
  datasetId: 'ded-plataforma-template-2026',
  declaredDays: 68,
  refs: {},
  classMatrix: {},
  raw: [],
  raw_t1: [],
  calendar: []
};

const domDoc = {
  getElementById: id => {
    if (id === 'source-data') return { textContent: JSON.stringify(mockData) };
    if (id === 'embedded-data-store') return { textContent: '{"t1":null,"t2":null,"weeklySnapshots":[]}' };
    if (id === 'embedded-config') return { textContent: '{"version":7}' };
    return null;
  }
};

const ctx = {
  console,
  document: domDoc,
  localStorage: { getItem: () => null, setItem: () => {} },
  location: { pathname: '/test' },
  toast: () => {}
};

vm.createContext(ctx);
vm.runInContext(src01 + '; this.classifySchoolProfile = classifySchoolProfile; this.OFFICIAL_WEEKLY = OFFICIAL_WEEKLY;', ctx);
vm.runInContext(src02 + '; this.stage = stage; this.refLabels = refLabels; this.offerFilterLabel = offerFilterLabel; this.offerFilterOptions = offerFilterOptions; this.rowOfferTags = rowOfferTags;', ctx);

console.log('1. Testando classificação de turmas e perfis...');

// Ensino Fundamental Anos Finais (EE São Judas Tadeu / Geral)
const ef6 = ctx.classifySchoolProfile('6º EF AF REG 1 - R QUARENTA, 15', 'MANHÃ');
assert.strictEqual(ef6.year, '6', '6º ano deve ser extraído.');
assert.strictEqual(ef6.bucket, 'EF_AF', '6º EF deve mapear para bucket EF_AF.');
assert.strictEqual(ef6.offer, 'FUNDAMENTAL_REGULAR', 'Oferta deve ser FUNDAMENTAL_REGULAR.');
assert.strictEqual(ctx.stage(ef6), 'AF', 'Etapa deve ser AF.');

const ef9 = ctx.classifySchoolProfile('9º EF AF REG 1', 'TARDE');
assert.strictEqual(ef9.year, '9', '9º ano deve ser extraído.');
assert.strictEqual(ef9.bucket, 'EF_AF', '9º EF deve mapear para bucket EF_AF.');
assert.strictEqual(ctx.stage(ef9), 'AF', 'Etapa deve ser AF.');

// Ensino Fundamental Anos Iniciais (1º ao 5º ano)
const ef1 = ctx.classifySchoolProfile('1º ANO EF - TURMA A', 'MANHÃ');
assert.strictEqual(ef1.year, '1', '1º ano deve ser extraído.');
assert.strictEqual(ef1.bucket, 'EF_AI', '1º EF deve mapear para bucket EF_AI.');
assert.strictEqual(ef1.offer, 'FUNDAMENTAL_REGULAR', 'Oferta deve ser FUNDAMENTAL_REGULAR.');
assert.strictEqual(ctx.stage(ef1), 'AI', 'Etapa deve ser AI.');

const ef3 = ctx.classifySchoolProfile('3º ANO FUNDAMENTAL - TURMA 1', 'TARDE');
assert.strictEqual(ef3.year, '3', '3º ano deve ser extraído.');
assert.strictEqual(ef3.bucket, 'EF_AI', '3º EF deve mapear para bucket EF_AI.');
assert.strictEqual(ctx.stage(ef3), 'AI', 'Etapa deve ser AI.');

// Ensino Médio Regular Diurno (Manhã e Tarde)
const em1Diurno = ctx.classifySchoolProfile('1º EM REG 1 - R QUARENTA, 15', 'MANHÃ');
assert.strictEqual(em1Diurno.year, '1', '1º ano EM diurno deve ser extraído.');
assert.strictEqual(em1Diurno.bucket, 'EM_REG_D_1', '1º EM Matutino deve mapear para EM_REG_D_1.');
assert.strictEqual(em1Diurno.offer, 'REGULAR_DIURNO', 'Oferta deve ser REGULAR_DIURNO.');
assert.strictEqual(ctx.stage(em1Diurno), 'EM', 'Etapa deve ser EM.');

const em2Vesp = ctx.classifySchoolProfile('2º ANO EM REGULAR', 'VESPERTINO');
assert.strictEqual(em2Vesp.year, '2', '2º ano EM vespertino deve ser extraído.');
assert.strictEqual(em2Vesp.bucket, 'EM_REG_D_2', '2º EM Vespertino deve mapear para EM_REG_D_2.');
assert.strictEqual(em2Vesp.offer, 'REGULAR_DIURNO', 'Oferta deve ser REGULAR_DIURNO.');

const em3Diurno = ctx.classifySchoolProfile('3º EM REG 1', 'MANHÃ');
assert.strictEqual(em3Diurno.year, '3', '3º ano EM diurno deve ser extraído.');
assert.strictEqual(em3Diurno.bucket, 'EM_REG_D_3', '3º EM diurno deve mapear para EM_REG_D_3.');

// Ensino Médio Regular Noturno (Retrocompatibilidade Hilton Rocha e Donato Werneck)
const em1Noturno = ctx.classifySchoolProfile('1º ANO DO ENSINO MEDIO - REGULAR - NOITE - TURMA 1', 'NOITE');
assert.strictEqual(em1Noturno.year, '1', '1º ano EM noturno deve ser extraído.');
assert.strictEqual(em1Noturno.bucket, 'EM_REG_1', '1º EM Noturno deve mapear para EM_REG_1.');
assert.strictEqual(em1Noturno.offer, 'REGULAR_NOTURNO', 'Oferta deve ser REGULAR_NOTURNO.');
assert.strictEqual(ctx.stage(em1Noturno), 'EM', 'Etapa deve ser EM.');

// EMTI Técnico (Retrocompatibilidade coortes técnicas)
const emtiTec = ctx.classifySchoolProfile('1º SISTEMAS DE ENERGIA RENOVÁVEL EM INT 1', 'INTEGRAL');
assert.strictEqual(emtiTec.year, '1', '1º ano EMTI deve ser extraído.');
assert.strictEqual(emtiTec.bucket, 'EM_INT_1', '1º EMTI deve mapear para EM_INT_1.');
assert.strictEqual(emtiTec.offer, 'EMTI_TECNICO', 'Oferta deve ser EMTI_TECNICO.');
assert.strictEqual(emtiTec.courseKey, 'SISTEMAS_ENERGIA_RENOVAVEL', 'Curso técnico deve ser identificado.');

console.log('2. Testando soma de cargas semanais das matrizes oficiais SEE/MG 2026...');

// Soma da matriz EF Anos Iniciais (8 componentes base) = 25 A/S
const aiBaseComponents = ['LINGUA PORTUGUESA', 'MATEMATICA', 'CIENCIAS', 'HISTORIA', 'GEOGRAFIA', 'EDUCACAO FISICA', 'ARTE', 'ENSINO RELIGIOSO'];
const aiTotal = aiBaseComponents.reduce((sum, comp) => sum + (ctx.OFFICIAL_WEEKLY[`EF_AI|${comp}`] || 0), 0);
assert.strictEqual(aiTotal, 25, `Matriz Fundamental Anos Iniciais (base) deve somar exatamente 25 A/S (deu ${aiTotal}).`);

// Soma da matriz EF Anos Finais = 25 A/S
const efWeekly = Object.entries(ctx.OFFICIAL_WEEKLY).filter(([k]) => k.startsWith('EF_AF|'));
const efTotal = efWeekly.reduce((sum, [, v]) => sum + v, 0);
assert.strictEqual(efTotal, 25, `Matriz Fundamental Anos Finais deve somar exatamente 25 A/S (deu ${efTotal}).`);

// Soma da matriz EM Diurno 1º ano = 30 A/S
const emD1Weekly = Object.entries(ctx.OFFICIAL_WEEKLY).filter(([k]) => k.startsWith('EM_REG_D_1|'));
const emD1Total = emD1Weekly.reduce((sum, [, v]) => sum + v, 0);
assert.strictEqual(emD1Total, 30, `Matriz EM Diurno 1º ano deve somar exatamente 30 A/S (deu ${emD1Total}).`);

// Soma da matriz EM Diurno 2º ano = 30 A/S
const emD2Weekly = Object.entries(ctx.OFFICIAL_WEEKLY).filter(([k]) => k.startsWith('EM_REG_D_2|'));
const emD2Total = emD2Weekly.reduce((sum, [, v]) => sum + v, 0);
assert.strictEqual(emD2Total, 30, `Matriz EM Diurno 2º ano deve somar exatamente 30 A/S (deu ${emD2Total}).`);

// Soma da matriz EM Diurno 3º ano = 30 A/S
const emD3Weekly = Object.entries(ctx.OFFICIAL_WEEKLY).filter(([k]) => k.startsWith('EM_REG_D_3|'));
const emD3Total = emD3Weekly.reduce((sum, [, v]) => sum + v, 0);
assert.strictEqual(emD3Total, 30, `Matriz EM Diurno 3º ano deve somar exatamente 30 A/S (deu ${emD3Total}).`);

// Preservação do EM Noturno (21 A/S) e EMTI 1º ano (45 A/S)
const emReg1Total = Object.entries(ctx.OFFICIAL_WEEKLY).filter(([k]) => k.startsWith('EM_REG_1|')).reduce((s, [, v]) => s + v, 0);
assert.strictEqual(emReg1Total, 21, 'EM Regular Noturno 1º ano deve preservar 21 A/S.');
const emInt1Total = Object.entries(ctx.OFFICIAL_WEEKLY).filter(([k]) => k.startsWith('EM_INT_1|')).reduce((s, [, v]) => s + v, 0);
assert.strictEqual(emInt1Total, 45, 'EMTI 1º ano deve preservar 45 A/S.');

console.log('3. Testando rótulos de filtros e ofertas...');
assert.strictEqual(ctx.offerFilterLabel('FUNDAMENTAL_REGULAR'), 'Fundamental · regular');
assert.strictEqual(ctx.offerFilterLabel('REGULAR_DIURNO'), 'Regular · diurno');
assert.strictEqual(ctx.offerFilterLabel('REGULAR_NOTURNO'), 'Regular · noturno');
assert.strictEqual(ctx.offerFilterLabel('INTEGRAL'), 'Integral · todas');

const mockRows = [
  { offer: 'FUNDAMENTAL_REGULAR', bucket: 'EF_AF' },
  { offer: 'REGULAR_DIURNO', bucket: 'EM_REG_D_1' },
  { offer: 'REGULAR_NOTURNO', bucket: 'EM_REG_1' },
  { offer: 'EMTI', bucket: 'EM_INT_1' }
];
const filterOptions = ctx.offerFilterOptions(mockRows);
assert(filterOptions.some(([k]) => k === 'FUNDAMENTAL_REGULAR'), 'Filtro deve incluir Fundamental');
assert(filterOptions.some(([k]) => k === 'REGULAR_DIURNO'), 'Filtro deve incluir Regular Diurno');
assert(filterOptions.some(([k]) => k === 'REGULAR_NOTURNO'), 'Filtro deve incluir Regular Noturno');

console.log('OK: Suporte multi-escola validado com sucesso (Fundamental, Diurno, Noturno e Integral)!');
