'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const jsDir = path.join(root, 'src', 'js');
const indexPath = path.join(root, 'src', 'index.html');
const files = fs.readdirSync(jsDir).filter(f => /^\d{2}\.js$/.test(f)).sort();
assert.deepStrictEqual(files, Array.from({length:14},(_,i)=>`${String(i+1).padStart(2,'0')}.js`), 'A sequência modular JS deve permanecer 01..14.');
const js = files.map(f => fs.readFileSync(path.join(jsDir,f),'utf8')).join('\n');
new Function(js); // syntax-only compile; does not execute DOM code

const unsafe = [
  'EM_INT_2_FAB|FABRICACAO MECANICA III',
  'EM_INT_2_FAB|FABRICACAO MECANICA IV',
  'EM_INT_2_SER|SISTEMAS DE ENERGIA RENOVAVEL III',
  'EM_INT_2_SER|SISTEMAS DE ENERGIA RENOVAVEL IV'
];
for (const key of unsafe) assert(!js.includes(`"${key}":`), `Carga técnica inferida não pode voltar ao OFFICIAL_WEEKLY: ${key}`);
assert(js.includes("return {value:null,kind:'unknown'"), 'Componente sem carga semanal precisa permanecer sem previsão automática.');
assert(js.includes('comparable:rr.unit===\'aulas\'&&actual!==null&&plan.value!==null'), 'Sem previsão documentada, a linha não pode entrar na base comparável.');
for (const fn of ['meter','kpis','consolidatedPage']) assert(new RegExp(`function\\s+${fn}\\s*\\(`).test(js), `Função obrigatória ausente: ${fn}`);
assert(js.includes("turma + componente forma um único diário lógico"), 'Regra de consolidação por turma + componente deve permanecer documentada na interface.');
assert(js.includes("RESPONSÁVEL A CONFIRMAR"), 'Duplicidade simultânea de docentes deve permanecer pendente de confirmação.');

const html = fs.readFileSync(indexPath,'utf8');
const scripts = [...html.matchAll(/<script src="js\/(\d{2})\.js"><\/script>/g)].map(m=>m[1]);
assert.deepStrictEqual(scripts, Array.from({length:14},(_,i)=>String(i+1).padStart(2,'0')), 'index.html deve carregar os 14 módulos JS em ordem.');
const styles = [...html.matchAll(/<link href="css\/(\d{2})\.css" rel="stylesheet"\/>/g)].map(m=>m[1]);
assert.deepStrictEqual(styles, ['01','02','03','04'], 'index.html deve carregar os quatro módulos CSS.');
const sourceMatch = html.match(/<script id="source-data" type="application\/json">([\s\S]*?)<\/script>/);
assert(sourceMatch, 'source-data ausente.');
const data = JSON.parse(sourceMatch[1]);
assert.strictEqual(data.raw.length,0,'Template público não pode conter linhas do 2º trimestre.');
assert.strictEqual(data.raw_t1.length,0,'Template público não pode conter linhas do 1º trimestre.');
assert.strictEqual(data.raw_t3.length,0,'Template público não pode conter linhas do 3º trimestre.');
assert.strictEqual(data.school,'','Template público não pode vir identificado com uma escola.');

const sensitive = [/H[IÍ]LTON ROCHA/i,/000353/,/CRISTIANO MACHADO/i,/ANA CECILIA SANTOS GOMES/i,/VAMBERTO/i];
const publicSource = html + '\n' + js + '\n' + fs.readdirSync(path.join(root,'src','css')).sort().map(f=>fs.readFileSync(path.join(root,'src','css',f),'utf8')).join('\n');
for (const rx of sensitive) assert(!rx.test(publicSource), `Dado identificável encontrado no template: ${rx}`);

const base = new Set(data.schoolDays);
function count(set,start,end){return [...set].filter(d=>d>=start&&d<=end).length;}
assert.strictEqual(base.size,200,'Calendário-base estadual deve conter 200 datas letivas.');
assert.strictEqual(count(base,'2026-02-04','2026-05-20'),66,'T1 base deve ter 66 dias.');
assert.strictEqual(count(base,'2026-05-21','2026-09-09'),68,'T2 base deve ter 68 dias.');
assert.strictEqual(count(base,'2026-09-10','2026-12-18'),66,'T3 base deve ter 66 dias.');
const local = new Set(base); local.delete('2026-12-08');
assert.strictEqual(count(local,'2026-09-10','2026-12-18'),65,'Excluir feriado local deve reduzir o T3 em um dia.');
local.add('2026-12-12'); // data sintética apenas para testar o mecanismo; não é recomposição oficial.
assert.strictEqual(count(local,'2026-09-10','2026-12-18'),66,'Adicionar uma recomposição dentro do T3 deve restaurar a contagem.');

console.log('OK: regressões curriculares, privacidade, calendário e estrutura modular verificadas.');
