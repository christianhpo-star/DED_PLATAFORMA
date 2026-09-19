'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'src','index.html'),'utf8');
const code=fs.readFileSync(path.join(root,'src','js','20.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','css','10.css'),'utf8');

const primary=html.match(/<div class="filters primary-filters">([\s\S]*?)<\/div>\s*<div class="filter-controls-row">/)?.[1]||'';
const advanced=html.match(/<details class="advanced-filters"[^>]*>([\s\S]*?)<\/details>/)?.[1]||'';
assert(primary.includes('id="trimester-filter"'),'Período deve permanecer entre os filtros principais.');
assert(primary.includes('id="class-filter"'),'Turma deve permanecer entre os filtros principais.');
assert(primary.includes('id="teacher-filter"'),'Professor deve permanecer entre os filtros principais.');
assert(primary.includes('id="query-filter"'),'Busca deve permanecer entre os filtros principais.');
assert(!primary.includes('id="stage-filter"')&&!primary.includes('id="matrix-filter"'),'Etapa e matriz não podem competir no primeiro nível.');
assert(advanced.includes('id="stage-filter"')&&advanced.includes('id="matrix-filter"'),'Etapa e matriz devem ficar em Mais filtros.');
assert(html.includes('id="active-filters"'),'Filtros ativos devem possuir região explícita.');
assert(html.includes('id="advanced-filter-count"'),'Mais filtros deve indicar quantos filtros avançados estão ativos.');

const elements={
 'stage-filter':{selectedOptions:[{textContent:'Ensino médio'}]},
 'matrix-filter':{selectedOptions:[{textContent:'Matriz A'}],options:{length:3}},
 'class-filter':{selectedOptions:[{textContent:'1 A'}],options:{length:3}},
 'teacher-filter':{selectedOptions:[{textContent:'Professor Teste'}],options:{length:3}},
 'more-filters':{hidden:false,open:false},
 'advanced-filter-count':{hidden:true,textContent:''},
 'active-filters':{hidden:true,innerHTML:''},
 'class-filter-field':{hidden:false},'teacher-filter-field':{hidden:false},'query-filter-field':{hidden:false},
 'stage-filter-field':{hidden:false},'matrix-filter-field':{hidden:false}
};
let synced=0,rendered=0;
const ctx={
 console,
 state:{stage:'EM',matrixGroup:'M1',classId:'C1',teacher:'PROFESSOR TESTE',query:'biologia',gradePage:2,expanded:new Set(['x'])},
 document:{getElementById:id=>elements[id]||null,addEventListener:()=>{}},
 window:{},
 title:v=>v,
 esc:v=>String(v??''),
 getActiveRaw:()=>[{stage:'EM'},{stage:'AF'}],
 stage:r=>r.stage,
 unique:a=>[...new Set(a)],
 syncFilterOptions:()=>{synced++;},
 render:()=>{rendered++;}
};
vm.createContext(ctx);vm.runInContext(code,ctx);
const active=ctx.activeFilterDescriptors();
assert.strictEqual(active.length,5,'Todos os filtros não padrão devem ser representados individualmente.');
ctx.renderFilterUX();
assert.strictEqual(elements['more-filters'].open,true,'Filtros avançados ativos devem manter Mais filtros aberto.');
assert.strictEqual(elements['advanced-filter-count'].textContent,'2','Contador deve refletir etapa + matriz ativos.');
assert(elements['active-filters'].innerHTML.includes('data-filter="matrix"'),'Chip da matriz deve ser removível individualmente.');
ctx.removeSingleFilter('matrix');
assert.strictEqual(ctx.state.matrixGroup,'','Remover matriz não deve limpar automaticamente os demais filtros.');
assert.strictEqual(ctx.state.classId,'C1','Remoção individual deve preservar turma quando ainda válida.');
assert.strictEqual(synced,1);assert.strictEqual(rendered,1);

assert(css.includes('@media(max-width:800px)'),'Layout deve tratar largura de 768 px.');
assert(css.includes('@media(max-width:490px)')&&css.includes('@media(max-width:390px)'),'Layout deve tratar telas estreitas explicitamente.');
assert(css.includes('min-height:44px'),'Alvos de toque devem crescer em telas pequenas.');
assert(css.includes('button:focus-visible'),'Controles devem possuir foco visível reforçado.');
assert(css.includes('.weekly-history-table th:nth-child(2)'),'Tabela semanal deve priorizar colunas essenciais no mobile.');
assert(!css.includes('overflow-x:auto'),'Novo CSS de filtros não pode introduzir navegação horizontal escondida.');

console.log('OK: filtros progressivos, chips ativos, touch targets e prioridades mobile verificados.');
