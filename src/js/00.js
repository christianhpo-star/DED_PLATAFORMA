'use strict';
function meter(ratio,hasOpen=false){
 if(ratio===null||ratio===undefined||!Number.isFinite(ratio))return '<span class="muted">Sem percentual</span>';
 const pct=Math.max(0,ratio),width=Math.min(100,pct),tone=hasOpen||pct<80?'critical':pct<100?'low':'';
 return `<div class="completion"><strong>${percent(pct)}</strong><div class="meter ${tone}"><span style="width:${width}%"></span></div></div>`;
}
function kpis(s){
 const comparable=s.comparable.length,lessons=s.lessons.length;
 return `<div class="kpis"><article class="kpi primary"><div class="kpi-top"><span>Aulas registradas</span><span class="kpi-icon">${icon('book')}</span></div><div class="kpi-value number">${moneyless(s.actual)}</div><div class="kpi-bottom">Somente na base comparável</div></article><article class="kpi"><div class="kpi-top"><span>Aulas previstas</span><span class="kpi-icon">${icon('target')}</span></div><div class="kpi-value number">${moneyless(s.expected)}</div><div class="kpi-bottom">Referências documentadas/informadas</div></article><article class="kpi"><div class="kpi-top"><span>Diferença</span><span class="kpi-icon">${icon('compare')}</span></div><div class="kpi-value number ${s.balance<0?'delta-neg':s.balance>0?'delta-pos':''}">${delta(s.balance)}</div><div class="kpi-bottom">Registradas − previstas · alerta de conferência</div></article><article class="kpi"><div class="kpi-top"><span>Base comparável</span><span class="kpi-icon">${icon('chart')}</span></div><div class="kpi-value number">${comparable}/${lessons}</div><div class="kpi-bottom">${s.missingLoad.length} sem referência · ${s.open.length} em aberto</div></article></div>`;
}
function consolidatedPeriodPlan(r,period){
 if(!r)return {value:null,source:'Registro não localizado no período.'};
 const override=cfg.expected?.[r.id];
 if(override)return {value:override.value,source:override.source,kind:'entered'};
 const w=weeklyFor(r);if(w===null)return {value:null,source:'Sem carga semanal documentada.',kind:'unknown'};
 return {value:calendarExpected(w,period),source:(Object.hasOwn(cfg.weekly,r.refKey)?'Carga semanal ajustada pela escola. ':DATA.refs[r.refKey]?.source||'Referência semanal documentada. '),kind:'estimated'};
}
function consolidatedPage(){
 const t1ByKey=new Map((DATA.raw_t1||[]).map(r=>[logicalKey(r),r])),t2ByKey=new Map((DATA.raw||[]).map(r=>[logicalKey(r),r]));
 const q=normalize(state.query.trim());
 const sourceRows=(DATA.consolidated||[]).map(c=>{
  const key=`${c.cod_turma}|${normalize(c.baseComponent||c.componente).replace(/[^a-z0-9]+/g,' ').trim()}`,a=t1ByKey.get(key),b=t2ByKey.get(key),current=b||a||c;
  const p1=consolidatedPeriodPlan(a,'1'),p2=consolidatedPeriodPlan(b,'2'),completePeriods=!!a&&!!b;
  const expected=completePeriods&&p1.value!==null&&p2.value!==null?p1.value+p2.value:null,actual=Number(c.total_acumulado??0);
  const rr={...current,...c,professor:responsibleTeacher(current),unit:'aulas',actual,plan:{value:expected,kind:expected===null?'unknown':(p1.kind==='entered'||p2.kind==='entered'?'entered':'estimated'),weekly:weeklyFor(current),days:expected===null?null:trimesterDays('1')+trimesterDays('2'),source:completePeriods?`${p1.source} ${p2.source}`:'Registro não localizado nos dois trimestres; previsão acumulada não calculada.'},comparable:expected!==null,balance:expected===null?null:actual-expected,status:c.situacao==='REGULAR'?'FECHADO':'ABERTO'};
  return rr;
 }).filter(r=>(!state.stage||stage(r)===state.stage)&&(!state.classId||r.cod_turma===state.classId)&&(!state.teacher||r.professor===state.teacher)&&(!q||normalize(`${r.professor} ${r.componente} ${r.turma} ${r.cod_turma}`).includes(q)));
 if(!sourceRows.length)return empty('Não há registros consolidados neste recorte. Importe os relatórios do 1º e 2º trimestres para formar o acumulado.');
 const s=stats(sourceRows);
 return `<div class="notice neutral">${icon('info')}<div class="text"><strong>Consolidado 1º + 2º trimestre.</strong> Aulas registradas são somadas por turma + componente. A previsão acumulada só é calculada quando os dois períodos estão localizados e possuem referência documental ou previsão informada.</div></div>${kpis(s)}${notice(s)}<section class="card"><div class="card-head"><div><h2>Total acumulado por turma e componente</h2><p class="sub">O professor exibido é o responsável atual do 2º trimestre quando disponível.</p></div>${badge(`${sourceRows.length} diário(s) lógico(s)`,'info')}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>Professor(a) / turma / componente</th><th class="num">1º Tri</th><th class="num">2º Tri</th><th class="num">Total</th><th class="num">Previsto acumulado</th><th class="num">Diferença</th><th>Fechamento</th><th>Notas no relatório</th></tr></thead><tbody>${sourceRows.slice().sort((a,b)=>a.shortClass.localeCompare(b.shortClass,'pt-BR',{numeric:true})||a.componente.localeCompare(b.componente,'pt-BR')).map(r=>`<tr><td><div class="component"><strong>${esc(title(r.professor))}</strong><small>${esc(r.shortClass)} · ${esc(title(r.componente))}</small>${r.previousProfessor?`<small>Responsável no 1º tri: ${esc(title(r.previousProfessor))}</small>`:''}</div></td><td class="num"><strong>${moneyless(r.t1_aulas)}</strong></td><td class="num"><strong>${moneyless(r.t2_aulas)}</strong></td><td class="num"><strong>${moneyless(r.total_acumulado)}</strong></td><td class="num">${moneyless(r.plan.value)}<small>${r.plan.value===null?'Sem base completa':'1º + 2º tri'}</small></td><td class="num ${r.balance<0?'delta-neg':r.balance>0?'delta-pos':''}"><strong>${delta(r.balance)}</strong></td><td>${badge(r.situacao==='REGULAR'?'T1 e T2 fechados':'Conferir fechamento',r.situacao==='REGULAR'?'good':'warn')}<div class="record-info">T1: ${esc(r.t1_status)} · T2: ${esc(r.t2_status)}</div></td><td><div class="record-info">T1: ${esc(r.t1_notas)}<br>T2: ${esc(r.t2_notas)}</div></td></tr>`).join('')}</tbody></table></div><div class="card-foot"><span>Diferenças são alertas de conferência. Componentes sem referência acumulada ficam fora dos percentuais.</span><button type="button" class="btn btn-small" onclick="exportConsolidatedCsv()">${icon('download')} Exportar consolidado</button></div></section>`;
}
