'use strict';
/* Consolidados integram a navegação existente. A transferência GAS envia somente
 * o contrato normalizado após prévia; a versão local continua sem rede. */
const consolidatedCore=globalThis.DED_CONSOLIDATED;
const consolidatedCloud=typeof google!=='undefined'&&!!google.script?.run;
// No pacote institucional, parâmetros locais nunca alteram cargas normativas.
if(globalThis.DED_INSTITUTIONAL_MODE){
 weeklyFor=function(r){return Object.hasOwn(OFFICIAL_WEEKLY,r.refKey)?OFFICIAL_WEEKLY[r.refKey]:null;};
 const legacyPlanned=planned;
 planned=function(r){const saved=cfg.expected,weekly=cfg.weekly;cfg.expected={};cfg.weekly={};try{return legacyPlanned(r);}finally{cfg.expected=saved;cfg.weekly=weekly;}};
 requestWeeklyReferenceChange=function(){toast('Matriz oficial protegida. Uma exceção exige ato SEE/MG incorporado pelo mantenedor.');};
 setRegularMatrixForClass=function(){toast('Matriz oficial definida pelo ano/modalidade/turno; edição local indisponível.');};
 saveExpected=function(){toast('Previsão normativa protegida nesta instalação.');};
 regularMatrixBucket=function(r,p){return p.bucket;};
 reclassifyRowsForCurrentConfig();
}
const CONSOLIDATED_KEY=`${DATA.datasetId}:class-consolidated-v1`;
let consolidatedStore=consolidatedCore.empty(),consolidatedRemote={revision:0,items:[]},consolidatedStage=null,consolidatedSelected='',consolidatedMessage='',consolidatedBusy=false,consolidatedStudentPage=0;
function gasConsolidated(method,arg){return new Promise((resolve,reject)=>{google.script.run.withSuccessHandler(resolve).withFailureHandler(()=>reject(new Error('Operação recusada ou conexão indisponível. Atualize a base antes de tentar novamente.')))[method](arg);});}
if(!consolidatedCloud){try{const s=localStorage.getItem(CONSOLIDATED_KEY);if(s)consolidatedStore=consolidatedCore.validStore(JSON.parse(s));}catch(e){consolidatedMessage='Backup local de consolidados inválido ou indisponível; não foi sobrescrito.';}}
function consolidatedItems(){return consolidatedCloud?consolidatedRemote.items:Object.entries(consolidatedStore.active).map(([key,d])=>({key,...d,summary:consolidatedCore.summary(d),students:new Set(d.records.map(r=>r.studentKey)).size,records:d.records.length}));}
function consolidatedPersist(next){
 // Persistir antes de trocar a referência em memória: quota/erro não apaga a base atual.
 const clean=consolidatedCore.validStore(next);localStorage.setItem(CONSOLIDATED_KEY,JSON.stringify(clean));consolidatedStore=clean;
}
async function consolidatedRefresh(){if(consolidatedCloud){consolidatedRemote=await gasConsolidated('dedListConsolidated');consolidatedStore=consolidatedCore.empty();}render();}
function consolidatedCoverage(){const items=consolidatedItems(),terms=[1,2,3].map(t=>`T${t}: ${items.filter(d=>d.term===t).length} turma(s)`).join(' · ');return `<section class="card"><div class="card-head"><div><h2>Consolidados de turma</h2><p class="sub">${esc(terms)} · ${items.reduce((n,d)=>n+d.records,0)} registros estudante/componente. ${items.length?'Última extração: '+esc(items.map(x=>x.extractedAt).sort().at(-1)):''}</p></div>${btn('Notas e faltas por turma','nav','data-page="classReports"','btn-primary')}</div><div class="card-body"><p>${items.length?`${items.reduce((n,d)=>n+d.summary.reduce((m,c)=>m+c.missingGrades,0),0)} campo(s) de nota ausente(s). Confira a fonte e a situação com a EEB; não se presume motivo.`:'Nenhum consolidado importado.'} ${!items.some(d=>d.term===3)?'T3 indisponível: importe um relatório original desse período.':''}</p><p class="setting-note">Consolidados fornecem notas e faltas. Aulas registradas e percentuais de escrituração continuam exclusivos dos Relatórios de Lançamentos do Professor.</p></div></section>`;}
function consolidatedOfficial(d,component){
 // A/S vem exclusivamente das constantes normativas: nenhuma configuração local é aceita aqui.
 if(d.year!==2026)return {weekly:null,source:'Norma deste ano não incorporada.'};
 const p=classifySchoolProfile(d.class.name,d.class.shift),k=p.bucket+'|'+component;
 return {weekly:Object.hasOwn(OFFICIAL_WEEKLY,k)?OFFICIAL_WEEKLY[k]:null,source:p.bucket.startsWith('EM_REG_')&&!p.bucket.startsWith('EM_REG_D_')?'Resolução SEE 5.212/2025, Anexo XII; presencial.':'Referência oficial incorporada para ano/modalidade/coorte; componentes não localizados permanecem indisponíveis.'};
}
function classReportsPage(){
 const items=consolidatedItems().sort((a,b)=>a.class.name.localeCompare(b.class.name,'pt-BR',{numeric:true})||a.term-b.term);
 const d=consolidatedStore.active[consolidatedSelected],selected=items.find(x=>x.key===consolidatedSelected);
 const options=items.map(x=>`<option value="${esc(x.key)}" ${x.key===consolidatedSelected?'selected':''}>${esc(x.year+' · '+x.class.name+' · T'+x.term)}</option>`).join('');
 const preview=consolidatedStage?`<section class="card" aria-label="Prévia dos consolidados"><div class="card-head"><h2>Confira antes de confirmar</h2></div><div class="card-body"><ul>${consolidatedStage.items.map(x=>{const doc=consolidatedStage.documents.find(d=>consolidatedCore.key(d)===x.key);return `<li>${esc(doc.school.name)} · ${esc(doc.class.name)} · T${doc.term}: ${x.students} estudantes, ${x.records} registros · ${esc({new:'novo',replace:'substitui versão anterior',repeated:'arquivo repetido; não será duplicado'}[x.kind])}${x.older?' · ATENÇÃO: extração anterior à versão ativa':''}</li>`;}).join('')}</ul><p>As versões anteriores serão preservadas. Nenhuma alteração foi aplicada.</p>${btn('Cancelar','consolidated-cancel')}${btn('Confirmar importação','consolidated-confirm',consolidatedBusy?'disabled':'','btn-primary')}</div></section>`:'';
 let details='';
 if(selected){const prev=items.filter(x=>x.school.code===selected.school.code&&x.class.code===selected.class.code&&x.year===selected.year&&x.term<selected.term).sort((a,b)=>b.term-a.term)[0];
 details=`<section class="card"><div class="card-head"><div><h2>${esc(selected.class.name)} · T${selected.term}</h2><p>${esc(selected.school.name)} · ${esc(selected.extractedAt)} · ${selected.students} estudantes</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Componente</th><th>Média das notas preenchidas</th><th>Com nota / total</th><th>Faltas registradas / cobertura</th><th>A/S oficial presencial</th><th>Período anterior</th></tr></thead><tbody>${selected.summary.map(c=>{const official=consolidatedOfficial(selected,consolidatedCore.norm(c.component).replace(/:/g,'')),older=prev?.summary.find(p=>consolidatedCore.norm(p.component)===consolidatedCore.norm(c.component));return `<tr><td>${esc(c.component)}</td><td>${c.mean===null?'Indisponível':moneyless(c.mean)}<small>${c.missingGrades} nota(s) ausente(s)</small></td><td>${c.grades}/${c.total}</td><td>${c.knownAbsences?c.absences:'Indisponível'} · ${c.knownAbsences}/${c.total}</td><td>${official.weekly??'Não homologada'}<small>${esc(official.source)}</small></td><td>${older?'T'+prev.term+': média '+(older.mean===null?'indisponível':moneyless(older.mean))+' · '+older.missingGrades+' nota(s) ausente(s)':'Sem comparação disponível'}</td></tr>`;}).join('')}</tbody></table></div><div class="card-body"><p>Faltas são contagens do extrato; percentual de frequência indisponível sem denominador documentado. Médias de períodos diferentes não são somadas nem equiparadas a uma escala comum. Sem matrícula, não há vínculo individual entre períodos.</p></div></section>`;
 if(d){const students=new Map();for(const r of d.records){if(!students.has(r.studentKey))students.set(r.studentKey,{name:r.studentName,missing:[]});if(r.grade===null)students.get(r.studentKey).missing.push(r.component);}
 const needs=[...students.values()].filter(x=>x.missing.length);
 details+=`<section class="card"><div class="card-head"><h2>Conferência individual de notas ausentes</h2></div><div class="card-body"><p>${needs.length} estudante(s) com ao menos um campo ausente. Nenhum limiar novo de desempenho foi aplicado.</p><ul>${needs.slice(consolidatedStudentPage*100,(consolidatedStudentPage+1)*100).map(x=>`<li>${esc(x.name)}: ${esc(x.missing.join(', '))}</li>`).join('')}</ul>${needs.length>100?btn('Próxima página','consolidated-next'):''}</div></section>`;
 }else details+=btn('Carregar conferência individual','consolidated-detail');
 }
 return consolidatedCoverage()+`<section class="card"><div class="card-body"><label for="class-consolidated-files">Selecionar Consolidados XLSX (até 20 arquivos; 2 MB de dados normalizados por lote)</label><input id="class-consolidated-files" type="file" multiple accept=".xlsx" ${consolidatedBusy?'disabled':''}><p role="status" aria-live="polite">${esc(consolidatedMessage)}</p><div class="inline-actions">${btn('Atualizar leitura','consolidated-refresh')}${btn('Baixar backup privado','consolidated-backup')}${consolidatedCloud?'<label>Revisão a restaurar <input id="consolidated-revision" type="number" min="0" step="1"></label>'+btn('Restaurar revisão','consolidated-restore-cloud'):'<label>Restaurar backup privado <input id="consolidated-backup-file" type="file" accept=".json"></label>'}</div><label for="consolidated-select">Ano, turma e trimestre</label><select id="consolidated-select"><option value="">Selecione</option>${options}</select><p class="setting-note">${consolidatedCloud?'Armazenamento institucional restrito.':'Armazenamento neste navegador; nenhuma transmissão externa.'} Dados de estudantes ficam somente no ambiente autorizado.</p></div></section>`+preview+details;
}
async function consolidatedParse(file){
 if(file.size>10*1024*1024)throw new Error('XLSX maior que 10 MB.');
 // Conferência prévia do tamanho descompactado protege o leitor existente contra ZIPs desproporcionais.
 const buf=await file.arrayBuffer(),view=new DataView(buf);let end=-1;
 for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('Arquivo XLSX corrompido.');let pos=view.getUint32(end+16,true),size=0;const count=view.getUint16(end+10,true);if(count>500)throw new Error('XLSX excede o limite de entradas.');
 for(let i=0;i<count;i++){if(pos+46>buf.byteLength||view.getUint32(pos,true)!==0x02014b50)throw new Error('Estrutura ZIP inválida.');size+=view.getUint32(pos+24,true);pos+=46+view.getUint16(pos+28,true)+view.getUint16(pos+30,true)+view.getUint16(pos+32,true);}if(size>30*1024*1024)throw new Error('XLSX descompactado excede 30 MB.');
 const files=await unzipXlsx(file,30*1024*1024),shared=[];if(files['xl/sharedStrings.xml'])for(const si of xmlDoc(files['xl/sharedStrings.xml']).querySelectorAll('si'))shared.push([...si.querySelectorAll('t')].map(t=>t.textContent).join(''));
 const workbook=xmlDoc(files['xl/workbook.xml']),rels=xmlDoc(files['xl/_rels/workbook.xml.rels']);
 const targets=new Map([...rels.querySelectorAll('Relationship')].map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',buf))].map(x=>x.toString(16).padStart(2,'0')).join(''),docs=[];
 for(const sheet of workbook.querySelectorAll('sheet')){
  const target=targets.get(sheet.getAttribute('r:id'));if(!target)throw new Error('Relação de aba inválida.');const part=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');if(!files[part])throw new Error('Aba XLSX ausente.');
  const matrix=[];for(const row of xmlDoc(files[part]).querySelectorAll('sheetData > row')){const arr=[];for(const cell of row.querySelectorAll(':scope > c')){if(cell.querySelector('f'))throw new Error('Fórmulas no consolidado não são aceitas; use a exportação original do DED.');const v=cell.querySelector(':scope > v')?.textContent??'',t=cell.getAttribute('t');arr[columnIndex(cell.getAttribute('r'))]=t==='s'?(shared[Number(v)]??''):t==='inlineStr'?[...cell.querySelectorAll('t')].map(x=>x.textContent).join(''):v;}matrix.push(arr);}
  if(matrix.some(r=>r.some(v=>['ALUNO','ESTUDANTE'].includes(consolidatedCore.norm(v)))))docs.push(consolidatedCore.fromMatrix(matrix,{fileName:file.name,sha256:hash,sheet:sheet.getAttribute('name')}));
 }
 if(!docs.length)throw new Error('Nenhuma aba de Consolidado de Turma reconhecida.');return docs;
}
async function consolidatedSelect(files){
 consolidatedStage=null;if(!files.length||files.length>20)throw new Error('Selecione de 1 a 20 arquivos.');const documents=[];
 for(const f of files)documents.push(...await consolidatedParse(f));
 if(JSON.stringify(documents).length>2000000)throw new Error('Lote normalizado excede 2 MB; divida a seleção.');
 const school=String(Number(cfg.school.code||Object.values(consolidatedStore.active)[0]?.school.code||documents[0].school.code));
 if(documents.some(d=>d.school.code!==school))throw new Error('Escolas diferentes; use uma instalação por escola.');
 const p=consolidatedCloud?await gasConsolidated('dedPreviewConsolidated',documents):{revision:consolidatedStore.revision,items:consolidatedCore.preview(consolidatedStore,documents)};
 consolidatedStage={...p,documents};consolidatedMessage='Prévia pronta. Confira escola, turma, período e substituições.';
}
async function consolidatedConfirm(){
 const p=consolidatedStage;if(!p)throw new Error('Gere nova prévia.');
 if(consolidatedCloud){consolidatedRemote=await gasConsolidated('dedCommitConsolidated',{...p,confirmed:true});consolidatedStore=consolidatedCore.empty();}
 else consolidatedPersist(consolidatedCore.commit(consolidatedStore,p.documents,p.revision,true));
 consolidatedStage=null;consolidatedMessage='Importação concluída. Versões anteriores preservadas.';
}
// Integração pequena e explícita aos módulos existentes, sem criar aplicação paralela.
pageMeta.classReports=['Consolidados de turma','Notas e faltas dos Consolidados','Consulte dados individuais e agregados sem confundi-los com escrituração de aulas.'];pageArea.classReports='data';
// O recorte próprio da fonte (ano/turma/trimestre) evita reutilizar filtros de aulas.
const consolidatedOldSwitch=switchPage;
switchPage=function(page,scroll=true){consolidatedOldSwitch(page,scroll);if(page==='classReports')document.getElementById('filter-panel').hidden=true;};
const consolidatedOldOverview=overview,consolidatedOldImports=importsPage,consolidatedOldClasses=classesPage;
overview=function(){return consolidatedCoverage()+consolidatedOldOverview();};
importsPage=function(){return consolidatedCoverage()+consolidatedOldImports();};
classesPage=function(){return consolidatedCoverage()+consolidatedOldClasses();};
const consolidatedOldRender=render;
render=function(){consolidatedOldRender();if(globalThis.DED_INSTITUTIONAL_MODE){
 // Mostra controles normativos somente para leitura; a lógica já ignora overrides.
 for(const input of document.querySelectorAll('[data-reference],[data-regular-matrix]')){input.disabled=true;if(input.dataset.reference)input.value=OFFICIAL_WEEKLY[input.dataset.reference]??'';}
 if(state.page==='settings'){const host=document.getElementById('view'),note=document.createElement('p');note.className='notice neutral';note.textContent='Referências oficiais protegidas nesta instalação. Exceções dependem de ato SEE/MG incorporado pelo mantenedor.';host.prepend(note);}
}};
const consolidatedOldAttention=attentionCenter;
attentionCenter=function(){const missing=consolidatedItems().reduce((n,d)=>n+d.summary.reduce((m,c)=>m+c.missingGrades,0),0);return consolidatedOldAttention()+`<section class="card"><div class="card-body"><h3>Conferência dos Consolidados</h3><p>${missing} campo(s) de nota ausente(s). Revise a fonte e a situação dos estudantes com a EEB.</p>${btn('Conferir notas individuais','nav','data-page="classReports"')}</div></section>`;};
async function consolidatedRun(action){if(consolidatedBusy)return;consolidatedBusy=true;try{await action();}catch(e){consolidatedMessage=e.message;consolidatedStage=null;}finally{consolidatedBusy=false;render();}}
document.addEventListener('change',e=>{
 if(e.target.id==='class-consolidated-files'){const files=[...e.target.files];consolidatedRun(()=>consolidatedSelect(files));}
 if(e.target.id==='consolidated-select'){consolidatedSelected=e.target.value;consolidatedStudentPage=0;render();}
 if(e.target.id==='consolidated-backup-file'){const file=e.target.files[0];if(file)consolidatedRun(async()=>{if(file.size>10*1024*1024)throw new Error('Backup excede 10 MB.');const candidate=consolidatedCore.validStore(JSON.parse(await file.text())),school=cfg.school.code||Object.values(consolidatedStore.active)[0]?.school.code;if(school&&[...Object.values(candidate.active),...candidate.history].some(d=>d.school.code!==String(Number(school))))throw new Error('Escola incompatível.');consolidatedStage=null;pendingConsolidatedRestore=candidate;askConfirm('Restaurar Consolidados?','A base atual será preservada no histórico. Relatórios de aulas não serão alterados.','consolidated-restore-local','Restaurar');});}
});
let pendingConsolidatedRestore=null;
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;
 const actions={
  'consolidated-cancel':async()=>{consolidatedStage=null;consolidatedMessage='Importação cancelada; base preservada.';},
  'consolidated-confirm':consolidatedConfirm,
  'consolidated-refresh':consolidatedRefresh,
  'consolidated-detail':async()=>{const r=await gasConsolidated('dedGetConsolidated',consolidatedSelected);if(r.revision!==consolidatedRemote.revision)throw new Error('Base atualizada; recarregue a lista.');consolidatedStore.active[consolidatedSelected]=consolidatedCore.validate(r.document);},
  'consolidated-next':async()=>{consolidatedStudentPage++;const d=consolidatedStore.active[consolidatedSelected];if(consolidatedStudentPage*100>=new Set(d.records.map(r=>r.studentKey)).size)consolidatedStudentPage=0;},
  'consolidated-backup':async()=>{if(consolidatedCloud){for(const item of consolidatedItems()){const r=await gasConsolidated('dedGetConsolidated',item.key);if(r.revision!==consolidatedRemote.revision)throw new Error('A base mudou; refaça o backup.');consolidatedStore.active[item.key]=r.document;}}downloadFile('DED_consolidados_privado.json',JSON.stringify(consolidatedStore),'application/json');},
  'consolidated-restore-local':async()=>{if(!pendingConsolidatedRestore)return;const old=consolidatedStore,next=pendingConsolidatedRestore;next.history.push(...Object.values(old.active));next.revision=old.revision+1;next.audit.push({type:'restore',at:new Date().toISOString()});consolidatedPersist(next);pendingConsolidatedRestore=null;document.getElementById('confirm-dialog').close();consolidatedMessage='Backup restaurado; versão anterior preservada.';},
  'consolidated-restore-cloud':async()=>{const v=document.getElementById('consolidated-revision').value;if(!/^\d+$/.test(v))throw new Error('Informe a revisão inteira.');pendingConsolidatedRestore=Number(v);askConfirm('Restaurar revisão institucional?','A restauração criará nova revisão e manterá o histórico.','consolidated-restore-confirm','Restaurar');},
  'consolidated-restore-confirm':async()=>{consolidatedRemote=await gasConsolidated('dedRestoreConsolidated',{target:pendingConsolidatedRestore,revision:consolidatedRemote.revision,confirmed:true});consolidatedStore=consolidatedCore.empty();pendingConsolidatedRestore=null;document.getElementById('confirm-dialog').close();consolidatedMessage='Revisão restaurada.';}
 };if(actions[el.dataset.action])consolidatedRun(actions[el.dataset.action]);
});
window.DED_CONSOLIDATED_UI=Object.freeze({parse:consolidatedParse,getStore:()=>JSON.parse(JSON.stringify(consolidatedStore)),official:consolidatedOfficial});
if(consolidatedCloud)consolidatedRun(consolidatedRefresh);
