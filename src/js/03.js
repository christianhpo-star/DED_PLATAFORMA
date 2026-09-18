'use strict';
let loadWarning='';let cfg=defaultConfig();
try{const embedded=JSON.parse(document.getElementById('embedded-config').textContent);if(embedded&&embedded.version)cfg=validateConfig(embedded);}catch(e){loadWarning='A configura\u00e7\u00e3o incorporada n\u00e3o p\u00f4de ser lida. Foram usadas as refer\u00eancias originais.';}
try{const local=localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY);if(local){const valid=validateConfig(JSON.parse(local));if(valid.updatedAt>cfg.updatedAt)cfg=valid;}}catch(e){loadWarning='O armazenamento local n\u00e3o est\u00e1 dispon\u00edvel ou cont\u00e9m dados inv\u00e1lidos. Use Salvar c\u00f3pia HTML para guardar ajustes.';}
const state={page:'overview',trimester:'2',stage:'',matrixGroup:'',classId:'',teacher:'',query:'',mode:'all',sort:'priority',selectedClass:'',comparisonA:'',comparisonB:'',referenceGroup:'all',gradeMode:'all',gradePage:0,printAllGrades:false,teacherGradeMode:'all',expanded:new Set(),weeklySelected:new Set(),weeklyPrintMode:'',weeklyPrintTeachers:new Set()};
function saveConfig(){cfg.updatedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(cfg));return true;}catch(e){toast('Ajuste aplicado nesta sess\u00e3o. Use Salvar c\u00f3pia HTML para preserv\u00e1-lo.');return false;}}
function schoolProfile(){return cfg.school||{name:'',city:'',sre:'',code:'',responsible:''};}
function schoolName(){return schoolProfile().name||'Escola não configurada';}
function schoolFileStem(){const s=(schoolProfile().code||schoolProfile().name||'escola').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60);return s||'escola';}
function updateSchoolUI(){const p=schoolProfile(),name=schoolName(),meta=[p.city,p.sre?`SRE ${p.sre}`:'',p.code?`Cód. ${p.code}`:''].filter(Boolean).join(' · ')||'Cadastre a escola em Calendário / Matriz';const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};set('school-sidebar-name',name);set('school-sidebar-meta',meta);set('school-heading',`${name.toLocaleUpperCase('pt-BR')} · ANO LETIVO 2026`);set('footer-school',`DED em foco · ${name}`);set('footer-responsible',p.responsible?`Responsável: ${p.responsible}`:'Responsável não informado');}
function responsibleTeacher(r){const candidates=Array.isArray(r.professorCandidates)&&r.professorCandidates.length?r.professorCandidates:[r.professor].filter(Boolean),chosen=cfg.teacherOverrides?.[logicalKey(r)];if(chosen&&candidates.includes(chosen))return chosen;if(candidates.length===1)return candidates[0];return 'RESPONSÁVEL A CONFIRMAR';}
function teacherConflictUnresolved(r){return !!r.teacherConflict&&!cfg.teacherOverrides?.[logicalKey(r)];}
function currentTeacherConflicts(){return (DATA.raw||[]).filter(r=>r.teacherConflict).map(r=>({...r,professor:responsibleTeacher(r)}));}
function weeklyFor(r){return Object.hasOwn(cfg.weekly,r.refKey)?cfg.weekly[r.refKey]:(DATA.refs[r.refKey]?.weekly??null);}
function planned(r){
 if(r.unit==='dias')return {value:null,kind:'days',weekly:null,days:null,source:'Registro de frequência em dias. Não convertido em aulas.'};
 const w=weeklyFor(r);if(Object.hasOwn(cfg.expected,r.id)){const o=cfg.expected[r.id];return {value:o.value,kind:'entered',weekly:w,days:null,source:o.source};}
 if(w===null)return {value:null,kind:'unknown',weekly:null,days:null,source:'Carga semanal não informada para este componente e modalidade.'};
 const curDays=getActiveDays(),value=calendarExpected(w);let detail=state.trimester==='all'||state.trimester==='consolidated'?`${w} A/S × ${trimesterDays('1')} DL ÷ 5 + ${w} A/S × ${trimesterDays('2')} DL ÷ 5, com arredondamento por trimestre.`:`${w} A/S × ${curDays} dias letivos ÷ 5, arredondado.`;
 return {value,kind:'estimated',weekly:w,days:curDays,source:(Object.hasOwn(cfg.weekly,r.refKey)?'Carga semanal ajustada pela escola. ':DATA.refs[r.refKey].source+' ')+'Calendário Escolar SEE/MG 2026: '+detail};
}
// Grade coverage is based on explicit class/component counts, never on the DED points field.
const gradeKinds = {
 complete: {label:'Lan\u00e7adas para todos',color:'good',help:'Todos os estudantes da base informada t\u00eam nota.'},
 majority: {label:'Lan\u00e7adas para a maioria',color:'good',help:'H\u00e1 evid\u00eancia de lan\u00e7amento na turma. Os casos sem nota precisam de acompanhamento individual, sem atribuir automaticamente falta de lan\u00e7amento ao docente.'},
 partial: {label:'Lan\u00e7amento parcial',color:'warn',help:'At\u00e9 metade da turma tem nota. Conferir o lan\u00e7amento e a situa\u00e7\u00e3o dos estudantes antes de concluir a causa.'},
 none: {label:'Sem notas registradas',color:'bad',help:'Nenhum estudante tem nota na base informada. Priorizar a confer\u00eancia do componente, sem concluir automaticamente a responsabilidade ou a causa.'},
 unknown: {label:'Cobertura n\u00e3o verificada',color:'',help:'N\u00e3o h\u00e1 contagem de notas por estudante suficiente para classificar este componente.'},
 na: {label:'N\u00e3o se aplica',color:'',help:'Registro de frequ\u00eancia em dias, sem avalia\u00e7\u00e3o de notas neste painel.'}
};
function classifyGrades(total,withNote){
 if(!integer(total)||total<1||!integer(withNote)||withNote<0||withNote>total)return 'unknown';
 return withNote===0?'none':withNote===total?'complete':withNote>total/2?'majority':'partial';
}
function gradeFor(r){
 const original=(state.trimester==='1')?(DATA.gradeEvidenceT1?.[r.id]||DATA.gradeEvidence?.[r.id]):(DATA.gradeEvidence?.[r.id]);
 const manual=cfg.gradeOverrides[r.id];
 const points=String(r.notas||'').trim().match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/);
 const pointEvidence=!manual&&!original&&points?{total:Number(points[2].replace(',','.')),withNote:Number(points[1].replace(',','.')),source:'Campo “Notas registradas” do Relatório de Lançamentos do Professor.'}:null;
 const evidence=manual||original||pointEvidence;
 const fallback=DATA.gradeClassTotals?.[r.cod_turma]??null;
 const applicable=r.unit!=='dias';
 const total=applicable?(evidence?.total??fallback):null;
 const withNote=applicable?(evidence?.withNote??null):null;
 const status=applicable?(pointEvidence?(withNote===0?'none':withNote>=total?'complete':'partial'):classifyGrades(total,withNote)):'na';
 const known=!['unknown','na'].includes(status);
 return {status,total,withNote:known?withNote:null,withoutNote:known?total-withNote:null,
 ratio:known?withNote/total*100:null,kind:manual?'entered':original?'source':pointEvidence?'points':'unknown',
 source:manual?.source||original?.source||pointEvidence?.source||'Sem contagem de notas por estudante no arquivo.',
 excerpt:original?.excerpt||'',mapping:original?.mapping||'',
 reason:manual?.reason||'',reasonConfirmed:manual?.reasonConfirmed===true,
 label:gradeKinds[status].label,color:gradeKinds[status].color,help:gradeKinds[status].help};
}
function gradeStats(rows){
 const eligible=rows.filter(r=>r.grade.status!=='na');
 const result={eligible:eligible.length,complete:0,majority:0,partial:0,none:0,unknown:0,known:0,entered:0,source:0};
 for(const r of eligible){result[r.grade.status]++;if(r.grade.status!=='unknown')result.known++;if(r.grade.kind==='entered')result.entered++;if(r.grade.kind==='source')result.source++;}
 return result;
}
