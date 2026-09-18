'use strict';
// Central de Atenção: categorias independentes, sem somar conceitos sobrepostos.
function attentionFilterRows(rows){
 const q=normalize(state.query.trim());
 return rows.filter(r=>(!state.stage||stage(r)===state.stage)&&rowMatchesOfferFilter(r,state.matrixGroup)&&(!state.classId||r.cod_turma===state.classId)&&(!state.teacher||r.professor===state.teacher)&&(!q||normalize((r.professor||'')+' '+(r.componente||'')+' '+(r.turma||'')+' '+(r.cod_turma||'')).includes(q)));
}
function attentionSnapshot(){
 const rows=baseRows(),lessons=rows.filter(r=>r.unit==='aulas');
 const open=rows.filter(r=>r.status!=='FECHADO');
 const gradeNone=rows.filter(r=>r.grade.status==='none'),gradePartial=rows.filter(r=>r.grade.status==='partial'),gradeUnknown=rows.filter(r=>r.grade.status==='unknown');
 const missingReference=lessons.filter(r=>r.plan.value===null),notComparable=lessons.filter(r=>!r.comparable);
 const unresolvedTeacher=rows.filter(teacherConflictUnresolved),dataConflict=rows.filter(r=>r.dataConflict),duplicates=rows.filter(r=>(r.duplicateSourceRows||1)>1);
 let weeklyRows=[],weeklyGroups=[],weeklyBelowTeachers=[],weeklyUnassessed=[];
 if(state.trimester==='3'&&dataStore.weeklySnapshots.length){
  weeklyRows=attentionFilterRows(weeklyComparison());
  weeklyGroups=weeklyTeacherGroups(weeklyRows);
  weeklyBelowTeachers=weeklyGroups.filter(g=>g.below.length);
  weeklyUnassessed=weeklyRows.filter(r=>r.delta===null||r.minimum===null);
 }
 return {rows,open,gradeNone,gradePartial,gradeUnknown,missingReference,notComparable,unresolvedTeacher,dataConflict,duplicates,weeklyRows,weeklyGroups,weeklyBelowTeachers,weeklyUnassessed,weeklyAvailable:state.trimester==='3'&&dataStore.weeklySnapshots.length>0};
}
function attentionPeriodLabel(){
 if(state.trimester==='1')return '1º trimestre';
 if(state.trimester==='2')return '2º trimestre';
 if(state.trimester==='3')return dataStore.weeklySnapshots.length?'3º trimestre · atualização semanal':'3º trimestre · sem atualização semanal';
 return 'Consolidado 1º + 2º trimestres';
}
function attentionCard(titleText,value,detail,action,label,tone=''){
 return '<article class="attention-card '+esc(tone)+'"><div class="attention-card-main"><span class="attention-label">'+esc(titleText)+'</span><strong class="attention-value">'+esc(value)+'</strong><p>'+detail+'</p></div>'+btn(esc(label)+icon('arrow'),action,'','btn-quiet attention-action')+'</article>';
}
function attentionCenter(){
 const a=attentionSnapshot(),weeklyValue=a.weeklyAvailable?String(a.weeklyBelowTeachers.length):'—';
 const weeklyDetail=a.weeklyAvailable?a.weeklyBelowTeachers.length+' professor(es) com ao menos um diário abaixo do mínimo · '+a.weeklyUnassessed.length+' diário(s) sem base suficiente.':'Disponível quando o 3º trimestre possui uma atualização semanal selecionada.';
 const gradeCritical=a.gradeNone.length+a.gradePartial.length,noteAttention=gradeCritical+a.gradeUnknown.length,referenceAttention=a.notComparable.length;
 const integrityUnique=new Set([...a.unresolvedTeacher,...a.dataConflict,...a.duplicates].map(logicalKey)).size;
 const actionable=a.open.length||noteAttention||a.gradeUnknown.length||a.missingReference.length||a.notComparable.length||integrityUnique||(a.weeklyAvailable&&(a.weeklyBelowTeachers.length||a.weeklyUnassessed.length));
 const context=attentionPeriodLabel()+' · respeita os filtros globais ativos';
 const cards=[
  attentionCard('Acompanhamento semanal',weeklyValue,weeklyDetail,'attention-weekly','Abrir 3º trimestre',a.weeklyAvailable&&a.weeklyBelowTeachers.length?'critical':''),
  attentionCard('Fechamento',String(a.open.length),a.open.length+' diário(s) continuam em aberto. Fechamento não é inferido a partir de notas ou quantidade de aulas.','attention-closure','Conferir diários',a.open.length?'critical':''),
  attentionCard('Notas',String(noteAttention),a.gradeNone.length+' sem notas · '+a.gradePartial.length+' parcial · '+a.gradeUnknown.length+' com cobertura não verificada.','attention-grades','Conferir notas',gradeCritical?'critical':a.gradeUnknown.length?'warning':''),
  attentionCard('Referências',String(referenceAttention),a.missingReference.length+' componente(s) sem previsão documental/informada · '+a.notComparable.length+' diário(s) não comparáveis neste recorte.','attention-references','Ver base incompleta',referenceAttention?'warning':''),
  attentionCard('Integridade dos dados',String(integrityUnique),a.unresolvedTeacher.length+' responsável(is) a confirmar · '+a.dataConflict.length+' conflito(s) de dados · '+a.duplicates.length+' diário(s) consolidados de linhas duplicadas.','attention-integrity','Conferir integridade',integrityUnique?'warning':'')
 ].join('');
 const emptyNote=!actionable?'<div class="attention-empty">'+icon('check')+'<div><strong>Nenhum item dessas categorias foi identificado neste recorte.</strong><span>Isso não substitui a conferência pedagógica nem comprova cumprimento de carga horária.</span></div></div>':'';
 return '<section class="attention-center" aria-labelledby="attention-title"><div class="attention-head"><div><div class="eyebrow">CENTRAL DE ATENÇÃO</div><h2 id="attention-title">Onde preciso atuar agora?</h2><p>'+esc(context)+'. As categorias são independentes e não devem ser somadas entre si.</p></div>'+badge('Fila de trabalho','info')+'</div><div class="attention-grid">'+cards+'</div>'+emptyNote+'<div class="attention-method">'+icon('info')+' Diferenças entre previsto e registrado são sinais para conferência; não comprovam, isoladamente, aula não ministrada ou responsabilidade docente.</div></section>';
}
function attentionIntegrityRows(){
 const a=attentionSnapshot(),map=new Map();
 for(const r of [...a.unresolvedTeacher,...a.dataConflict,...a.duplicates])map.set(logicalKey(r),r);
 return [...map.values()];
}
function attentionIntegritySection(){
 const rows=attentionIntegrityRows();
 const issueText=r=>{
  const parts=[];
  if(teacherConflictUnresolved(r))parts.push('responsável atual a confirmar');
  if(r.dataConflict)parts.push('duplicidade com dados divergentes');
  if((r.duplicateSourceRows||1)>1&&!r.dataConflict)parts.push('linhas duplicadas consolidadas');
  return parts.join(' · ')||'conferência de integridade';
 };
 const body=rows.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Turma / componente</th><th>Professor</th><th>Motivo da conferência</th><th>Ação</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><div class="component"><strong>'+esc(r.shortClass)+'</strong><small>'+esc(title(r.componente))+'</small></div></td><td>'+esc(title(r.professor))+'</td><td>'+badge(issueText(r),'warn')+'</td><td>'+btn(teacherConflictUnresolved(r)?'Definir responsável':'Ver registro',teacherConflictUnresolved(r)?'nav':'record',teacherConflictUnresolved(r)?'data-page="settings"':'data-id="'+esc(r.id)+'"','btn-small')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="card-body"><p class="muted">Nenhuma inconsistência estrutural dessas categorias foi identificada neste recorte.</p></div>';
 return '<section class="card" id="pending-integrity"><div class="card-head"><div><h2>Integridade dos dados</h2><p class="sub">Responsáveis a confirmar, conflitos de duplicidade e linhas consolidadas são exibidos separadamente dos alertas pedagógicos.</p></div>'+badge(rows.length+' item(ns)',rows.length?'warn':'good')+'</div>'+body+'</section>';
}
window.DED_ATTENTION=Object.freeze({attentionSnapshot,attentionCenter,attentionIntegrityRows,attentionIntegritySection});
