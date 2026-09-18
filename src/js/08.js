'use strict';
const pageMeta={consolidated:['Consolidado 1º + 2º Tri','Consolidado acumulado do ano letivo','Visão do período consolidado: soma de aulas registradas no 1º e 2º trimestres, fechamento e notas do ano.'],weekly:['3º trimestre','Acompanhamento semanal do 3º trimestre','Insira uma planilha atualizada e compare o que foi lançado desde a semana anterior.'],imports:['Dados','Atualizar as bases do painel','Atualize relatórios e gerencie backup/restauração das bases locais.'],grades:['Notas','Notas registradas por turma e componente','Consulte a pontuação do relatório sem confundi-la com quantidade de estudantes.'],overview:['Visão geral','Acompanhamento do DED','Veja o que estava previsto, o que foi registrado e o que precisa de conferência.'],teachers:['Professores','Previstas × registradas, por professor','Compare a mesma base de turmas e componentes. Abra um professor para conferir cada registro.'],classes:['Turmas','Cada turma, em detalhe','Acompanhe componentes, previsões, registros e fechamento sem misturar aulas com dias.'],compare:['Comparar turmas','Compare turmas do mesmo ano','Diferenças entre turmas são indícios para conferência, não uma meta de carga horária.'],pending:['Pendências','O que precisa de atenção','Separe pendências de fechamento, diferenças de aulas e apontamentos sobre notas.'],settings:['Configurações','Escola, calendário e referências','Configure a unidade, calendário, matrizes, referências curriculares e responsáveis locais.']};
const pageArea={overview:'overview',consolidated:'overview',teachers:'tracking',classes:'tracking',compare:'tracking',grades:'tracking',pending:'tracking',weekly:'weekly',imports:'data',settings:'settings'};
const areaNavigation={
 tracking:[['teachers','Professores'],['classes','Turmas'],['grades','Notas'],['pending','Pendências']],
 weekly:[['weekly-current','Semana atual'],['weekly-history','Histórico']],
 data:[['data-updates','Atualizar relatórios'],['data-backup','Backup e restauração']],
 settings:[['settings-school','Escola'],['settings-calendar','Calendário'],['settings-matrix','Matrizes e referências'],['settings-responsible','Responsáveis']]
};
function renderSectionNavigation(page){
 const host=document.getElementById('section-navigation');if(!host)return;
 const area=pageArea[page],items=areaNavigation[area]||[];
 if(!items.length){host.hidden=true;host.innerHTML='';return;}
 host.hidden=false;
 host.innerHTML=items.map(([target,label])=>{
  if(area==='tracking'){const on=page===target;return `<button type="button" data-action="nav" data-page="${target}" class="section-nav-button ${on?'active':''}" ${on?'aria-current="page"':''}>${esc(label)}</button>`;}
  return `<button type="button" data-action="section-jump" data-target="${target}" class="section-nav-button">${esc(label)}</button>`;
 }).join('');
}
function switchPage(page,scroll=true){
 if(!pageMeta[page])page='overview';
 if(page!=='weekly'){state.weeklySnapshotDate='';state.weeklyManageDate='';}
 if(page==='consolidated'){state.trimester='all';RAW=getActiveRaw();syncFilterOptions();}
 state.page=page;
 const area=pageArea[page]||'overview';
 document.querySelectorAll('[data-nav-area]').forEach(el=>{const on=el.dataset.navArea===area;el.classList.toggle('active',on);if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 document.getElementById('breadcrumb-page').textContent=pageMeta[page][0];
 document.getElementById('page-title').textContent=pageMeta[page][1];
 document.getElementById('page-description').textContent=pageMeta[page][2];
 document.getElementById('filter-panel').hidden=['compare','settings','weekly','imports'].includes(page);
 try{history.replaceState(null,'','#'+page);}catch(e){}
 render();renderSectionNavigation(page);
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function empty(message='Nenhum registro corresponde aos filtros selecionados.'){const noData=!getActiveRaw().length;return `<div class="empty">${icon(noData?'upload':'search')}<h3>${noData?'Base ainda não carregada':'Nenhum resultado neste recorte'}</h3><p>${esc(noData?'Configure a escola e importe o Relatório de Lançamentos do Professor em Atualizar planilhas.':message)}</p>${noData?btn('Atualizar planilhas','nav','data-page="imports"','btn-primary'):btn('Limpar filtros','clear','','btn-quiet')}</div>`;}
function notice(s,compact=false){let text='';if(s.comparable.length)text=`<strong>${s.comparable.length} de ${s.measured.length} registros com aulas entram na comparação.</strong> `;else text='<strong>Não há registros comparáveis neste recorte.</strong> ';if(s.missingLoad.length)text+=`${s.missingLoad.length} ${s.missingLoad.length===1?'aguarda':'aguardam'} carga de referência. `;if(s.missingActual.length)text+=`${s.missingActual.length} não discriminam aulas no extrato. `;if(s.estimated)text+='Previsões calculadas com matriz + calendário oficial são referência de conferência, não prova de aula não ministrada.';else if(s.entered)text+='As previsões deste recorte foram informadas pelo usuário.';const conflicts=s.rows.filter(teacherConflictUnresolved);if(conflicts.length)text+=` <strong>${conflicts.length} componente(s) têm mais de um professor no relatório e aguardam confirmação do responsável atual.</strong>`;return `<div class="notice ${s.missingLoad.length||conflicts.length?'warning':''} ${compact?'tight':''}">${icon('info')}<div class="text">${text}</div>${btn('Ver referências '+icon('arrow'),'nav','data-page="settings"','btn-quiet')}</div>`;}

window.exportConsolidatedCsv = function(){
 const cons = (DATA.consolidated || []).map(r=>({...r,professor:responsibleTeacher(r)}));
 if(!cons.length) return;
 const temporal=temporalExportContext();
 const headers = ['Contexto temporal','Natureza da visão','Origem temporal','Docente Atual','Turma','Código Turma','Componente','Turno','Aulas 1º Tri','Aulas 2º Tri','Total Acumulado','Status 1º Tri','Status 2º Tri','Notas 1º Tri','Notas 2º Tri','Situação no Ano'];
 const rows = cons.map(r => [
  `"${temporal.title}"`,
  `"${temporal.nature}"`,
  `"${temporal.detail}"`,
  `"${r.professor}"`,
  `"${r.turma}"`,
  `"${r.cod_turma}"`,
  `"${r.componente}"`,
  `"${r.turno}"`,
  r.t1_aulas,
  r.t2_aulas,
  r.total_acumulado,
  `"${r.t1_status}"`,
  `"${r.t2_status}"`,
  `"${r.t1_notas}"`,
  `"${r.t2_notas}"`,
  `"${r.situacao}"`
 ]);
 const csv = [headers.join(';')].concat(rows.map(e => e.join(';'))).join('\r\n');
 downloadFile('DED_Template_Consolidado_1Tri_2Tri.csv', csv, 'text/csv;charset=utf-8');
 toast('Relatório Consolidado (1º + 2º Tri) exportado com sucesso!');
};

function overview(){

 const triLabel = state.trimester === '1' ? '1º Trimestre (66 dias)' :
                  state.trimester === '3' ? (dataStore.weeklySnapshots.length?`3º Trimestre · atualização de ${formatDateBR(dataStore.weeklySnapshots.at(-1).date)}`:'3º Trimestre · aguardando primeira planilha') :
                  (state.trimester === 'all' || state.trimester === 'consolidated') ? 'Consolidado Acumulado (1º + 2º Trimestres)' :
                  '2º Trimestre (68 dias)';
 const trimesterBar = `<div class="toolbar" style="margin-bottom:16px;background:var(--paper);padding:10px 14px;border-radius:var(--radius);border:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
   <span style="font-weight:600;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;">Período Letivo:</span>
   <div class="segmented" role="group" aria-label="Selecionar Trimestre">
    <button type="button" data-action="trimester" data-trimester="3" class="${state.trimester==='3'?'active':''}">3º Trimestre</button>
    <button type="button" data-action="trimester" data-trimester="2" class="${state.trimester==='2'?'active':''}">2º Trimestre</button>
    <button type="button" data-action="trimester" data-trimester="1" class="${state.trimester==='1'?'active':''}">1º Trimestre</button>
    <button type="button" data-action="trimester" data-trimester="all" class="${(state.trimester==='all'||state.trimester==='consolidated')?'active':''}">Consolidado (1º + 2º Tri)</button>
   </div>
  </div>
  <div style="font-size:13px;color:var(--muted);">
   Exibindo: <strong style="color:var(--ink);">${triLabel}</strong>
  </div>
 </div>`;

const rows=baseRows(),s=stats(rows);if(!rows.length)return empty();const teachers=grouped(rows,'professor').filter(g=>g.s.comparable.length).sort((a,b)=>b.s.open.length-a.s.open.length||b.s.shortfall-a.s.shortfall).slice(0,6);const max=Math.max(1,...teachers.flatMap(g=>[g.s.expected,g.s.actual]));let chart=teachers.length?`<div class="legend"><span><i></i>Previstas</span><span><i class="actual"></i>Registradas</span><span><i class="short"></i>Abaixo da previs&atilde;o</span></div><div class="chart-rows">${teachers.map(g=>`<div class="bar-row"><button class="chart-name" data-action="teacher" data-teacher="${esc(g.name)}" title="Abrir ${esc(title(g.name))}">${esc(shortName(g.name))}<span>${g.s.comparable.length} registros compar&aacute;veis</span></button><div class="bar-pair"><div class="bar-track"><div class="bar-fill" style="width:${g.s.expected/max*100}%"></div></div><div class="bar-track"><div class="bar-fill actual ${g.s.open.length?'critical':g.s.actual<g.s.expected?'short':''}" style="width:${g.s.actual/max*100}%"></div></div></div><div class="bar-values">${moneyless(g.s.expected)}<br><strong>${moneyless(g.s.actual)}</strong></div></div>`).join('')}</div>`:empty('Informe a carga semanal ou a previs\u00e3o por registro para iniciar a compara\u00e7\u00e3o.');
 const urgent=s.open[0];let priority='';if(urgent){const ratio=urgent.plan.value>0&&urgent.actual!==null?urgent.actual/urgent.plan.value*100:null;priority=`<div class="priority-box"><div class="priority-label">${icon('flag')}Registro em aberto</div><h3>${esc(urgent.shortClass)}</h3><p>${esc(title(urgent.componente))}</p><p class="priority-person">${esc(title(urgent.professor))}</p><div class="priority-metrics"><div><strong>${moneyless(urgent.plan.value)}</strong><span>previstas ${urgent.plan.kind==='estimated'?'(estim.)':''}</span></div><div><strong style="color:var(--red)">${moneyless(urgent.actual)}</strong><span>registradas</span></div><div><strong>${percent(ratio)}</strong><span>da previs&atilde;o</span></div></div><div class="progress-line"><span style="width:${Math.min(100,ratio??0)}%"></span></div><p style="font-size:10px;color:var(--muted)">Campo de notas no extrato: ${esc(urgent.notas)}.</p></div><div class="next-step"><div class="step">${icon('check')}</div><div>Conferir o hor&aacute;rio e os lan&ccedil;amentos antes de definir a regulariza&ccedil;&atilde;o.${btn('Abrir registro '+icon('arrow'),'record',`data-id="${urgent.id}"`,'btn-quiet')}</div></div>`;}else{priority=`<div class="priority-box" style="background:var(--teal-soft);border-color:#cce7df"><div class="priority-label" style="color:var(--teal)">${icon('check')}Sem registros em aberto</div><h3>Fechamento conclu&iacute;do neste recorte</h3><p>Isso n&atilde;o comprova o cumprimento da carga hor&aacute;ria ou notas de todos os estudantes.</p></div><div class="school-stats"><div><strong>${s.below.length}</strong><span>registros abaixo da previs&atilde;o</span></div><div><strong>${s.missingLoad.length}</strong><span>aguardam refer&ecirc;ncia</span></div></div>`;}
 const stageMap=[['AI','Fundamental \u00b7 Anos iniciais'],['AF','Fundamental \u00b7 Anos finais'],['EM','Ensino m\u00e9dio']].map(([key,label])=>{const rs=rows.filter(r=>stage(r)===key);if(!rs.length)return '';const st=stats(rs);return `<tr><td><strong>${esc(label)}</strong><div class="record-info">${st.classes.length} turmas &middot; ${st.teachers.length} docentes neste recorte</div></td><td class="num"><strong>${moneyless(st.expected)}</strong></td><td class="num"><strong>${moneyless(st.actual)}</strong></td><td>${meter(st.ratio,!!st.open.length)}</td><td>${st.comparable.length}/${st.lessons.length}<div class="record-info">registros de componentes</div></td><td>${badge(st.open.length?st.open.length+' aberto(s)':'Todos fechados',st.open.length?'bad':'good')}</td></tr>`;}).join('');
 return trimesterBar+attentionCenter()+kpis(s)+notice(s)+gradeOverview(rows)+`<div class="panels"><section class="card"><div class="card-head"><div><h2>Onde conferir primeiro</h2><p class="sub">Previstas &times; registradas por docente, priorizando pend&ecirc;ncias.</p></div></div><div class="card-body">${chart}</div><div class="card-foot"><span>Somente registros com previs&atilde;o e quantidade de aulas.</span>${btn('Todos os professores '+icon('arrow'),'nav','data-page="teachers"','btn-quiet')}</div></section><section class="card"><div class="card-head"><div><h2>Prioridade de fechamento</h2><p class="sub">O pr&oacute;ximo registro para conferir.</p></div></div><div class="card-body">${priority}</div></section></div>
 <section class="card"><div class="card-head"><div><h2>Panorama por etapa</h2><p class="sub">${s.classes.length} turmas &middot; ${s.teachers.length} docentes &middot; ${s.rows.length} registros neste recorte.</p></div>${badge('Dados do arquivo','info')}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Etapa</th><th class="num">Previstas</th><th class="num">Registradas</th><th>Atingimento</th><th>Base compar&aacute;vel</th><th>Fechamento</th></tr></thead><tbody>${stageMap}</tbody></table></div><div class="card-foot"><span>Os docentes podem atuar em mais de uma etapa. Totais gerais contam cada pessoa uma vez.</span></div></section>`;
}
