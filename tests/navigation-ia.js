'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'src','index.html'),'utf8');
const ia=fs.readFileSync(path.join(root,'src','js','08.js'),'utf8');
const classes=fs.readFileSync(path.join(root,'src','js','10.js'),'utf8');
const events=fs.readFileSync(path.join(root,'src','js','13.js'),'utf8');
const weekly=fs.readFileSync(path.join(root,'src','js','07.js'),'utf8');
const settings=fs.readFileSync(path.join(root,'src','js','11.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src','css','03.css'),'utf8');

const nav=html.match(/<nav id="navigation">([\s\S]*?)<\/nav>/);
assert(nav,'Navegação principal deve existir.');
const primary=[...nav[1].matchAll(/data-nav-area="([^"]+)"/g)].map(m=>m[1]);
assert.deepStrictEqual(primary,['overview','tracking','weekly','data','settings'],'Navegação principal deve conter exatamente as cinco áreas orientadas a tarefa.');
assert(!nav[1].includes('data-page="compare"'),'Comparar turmas não pode permanecer como destino principal.');
assert(!nav[1].includes('data-page="consolidated"'),'Consolidado não pode permanecer como destino principal.');
assert(html.includes('id="section-navigation"'),'Navegação contextual da área deve existir.');

for(const pair of ["consolidated:'overview'","compare:'tracking'","teachers:'tracking'","classes:'tracking'","weekly:'weekly'","imports:'data'","settings:'settings'"])assert(ia.includes(pair),'Mapeamento de área ausente: '+pair);
assert(ia.includes("compare:['Comparar turmas'"),'Hash legado #compare deve continuar reconhecido.');
assert(ia.includes("consolidated:['Consolidado 1º + 2º Tri'"),'Hash legado #consolidated deve continuar reconhecido.');
assert(ia.includes("el.setAttribute('aria-current','page')"),'Estado atual deve permanecer exposto por aria-current.');
assert(classes.includes("'compare-class'"),'Comparação de turmas deve existir como ação contextual em Turmas.');
assert(events.includes("a==='compare-class'"),'Ação contextual de comparação deve abrir a rota preservada.');
assert(events.includes("state.trimester==='all')switchPage('consolidated')"),'Consolidado deve ser acessado como visão do seletor de período.');
assert(events.includes("a==='section-jump'"),'Subáreas devem permitir navegação contextual por tarefa.');

for(const id of ['weekly-current','weekly-history','data-updates','data-backup'])assert(weekly.includes('id="'+id+'"'),'Âncora de tarefa ausente: '+id);
for(const id of ['settings-school','settings-calendar','settings-matrix','settings-responsible'])assert(settings.includes('id="'+id+'"'),'Âncora de configuração ausente: '+id);

assert(css.includes('.sidebar nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))'),'Mobile deve mostrar as cinco áreas sem barra horizontal.');
assert(!css.includes('.sidebar nav{display:flex;gap:5px;overflow-x:auto'),'Menu mobile antigo com rolagem horizontal não pode retornar.');
assert(css.includes('@media(max-width:490px){.sidebar nav{grid-template-columns:repeat(2,minmax(0,1fr))'),'Tela estreita deve reorganizar áreas em grade legível.');

console.log('OK: arquitetura de navegação por tarefa, compatibilidade de rotas e mobile verificadas.');
