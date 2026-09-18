'use strict';
// UX de filtros: revelar complexidade sob demanda e tornar filtros ativos explícitos.
function selectedOptionText(id){
 const el=document.getElementById(id),opt=el?.selectedOptions?.[0];
 return opt?opt.textContent.trim():'';
}
function activeFilterDescriptors(){
 const out=[];
 if(state.stage)out.push({key:'stage',label:'Etapa: '+(selectedOptionText('stage-filter')||state.stage)});
 if(state.matrixGroup)out.push({key:'matrix',label:'Oferta: '+(selectedOptionText('matrix-filter')||state.matrixGroup)});
 if(state.classId)out.push({key:'class',label:'Turma: '+(selectedOptionText('class-filter')||state.classId)});
 if(state.teacher)out.push({key:'teacher',label:'Professor: '+title(state.teacher)});
 if(state.query.trim())out.push({key:'query',label:'Busca: '+state.query.trim()});
 return out;
}
function filterFieldUseful(){
 const raw=getActiveRaw(),stageCount=unique(raw.map(stage).filter(Boolean)).length;
 const classOptions=document.getElementById('class-filter')?.options?.length||0;
 const teacherOptions=document.getElementById('teacher-filter')?.options?.length||0;
 const matrixOptions=document.getElementById('matrix-filter')?.options?.length||0;
 return {
  stage:stageCount>1||!!state.stage,
  matrix:matrixOptions>2||!!state.matrixGroup,
  class:classOptions>2||!!state.classId,
  teacher:teacherOptions>2||!!state.teacher,
  query:raw.length>0||!!state.query.trim()
 };
}
function setFieldVisibility(id,visible){const el=document.getElementById(id);if(el)el.hidden=!visible;}
function renderFilterUX(){
 const host=document.getElementById('active-filters');if(!host)return;
 const active=activeFilterDescriptors(),useful=filterFieldUseful();
 setFieldVisibility('class-filter-field',useful.class);
 setFieldVisibility('teacher-filter-field',useful.teacher);
 setFieldVisibility('query-filter-field',useful.query);
 setFieldVisibility('stage-filter-field',useful.stage);
 setFieldVisibility('matrix-filter-field',useful.matrix);
 const advanced=document.getElementById('more-filters'),advancedCount=document.getElementById('advanced-filter-count');
 const count=(state.stage?1:0)+(state.matrixGroup?1:0),advancedUseful=useful.stage||useful.matrix||count>0;
 if(advanced){advanced.hidden=!advancedUseful;if(count)advanced.open=true;}
 if(advancedCount){advancedCount.hidden=!count;advancedCount.textContent=String(count);}
 host.hidden=!active.length;
 host.innerHTML=active.length?'<span class="active-filter-label">Filtros ativos:</span>'+active.map(f=>'<button type="button" class="active-filter-chip" data-action="remove-filter" data-filter="'+esc(f.key)+'" aria-label="Remover '+esc(f.label)+'"><span>'+esc(f.label)+'</span><span aria-hidden="true">×</span></button>').join(''):'';
}
function removeSingleFilter(key){
 if(key==='stage')state.stage='';
 else if(key==='matrix')state.matrixGroup='';
 else if(key==='class')state.classId='';
 else if(key==='teacher')state.teacher='';
 else if(key==='query')state.query='';
 state.gradePage=0;state.expanded.clear();syncFilterOptions();render();
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action="remove-filter"]');if(!el)return;
 removeSingleFilter(el.dataset.filter||'');
});
window.DED_FILTER_UX=Object.freeze({activeFilterDescriptors,filterFieldUseful,renderFilterUX,removeSingleFilter});
