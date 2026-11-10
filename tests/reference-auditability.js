'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');
const root=path.resolve(__dirname,'..');
const readLF=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const src02=readLF(path.join(root,'src','js','02.js'));
const src03=readLF(path.join(root,'src','js','03.js'));
const src11=readLF(path.join(root,'src','js','11.js'));
const src13=readLF(path.join(root,'src','js','13.js'));
const src14=readLF(path.join(root,'src','js','14.js'));
const src21=readLF(path.join(root,'src','js','21.js'));
const src07=readLF(path.join(root,'src','js','07.js'));
const src01=readLF(path.join(root,'src','js','01.js'));
const src14=readLF(path.join(root,'src','js','14.js'));
const html=readLF(path.join(root,'src','index.html'));

const start=src02.indexOf('const defaultConfig = () =>');
const end=src02.indexOf('\n}',src02.indexOf('function validateConfig(obj)'));
const close=src02.indexOf(' return clean;\n}',start);
assert(start>=0&&close>=0,'Bloco de validação de configuração deve existir.');
const configCode=src02.slice(start,close+' return clean;\n}'.length);
const ctx={
 DATA:{datasetId:'ded-plataforma-template-2026',declaredDays:68,refs:{REF:{weekly:4}},raw:[],raw_t1:[]},
 RAW:[],
 integer:Number.isInteger,
 logicalKey:r=>r.id||''
};
vm.createContext(ctx);vm.runInContext(configCode,ctx);

const audited={
 version:7,datasetId:'ded-plataforma-template-2026',days:68,
 school:{},weekly:{REF:5},
 weeklyAudit:{REF:{originalWeekly:4,reason:'Horário homologado da turma.',source:'Horário homologado de 15/09/2026',updatedAt:10}},
 expected:{},teacherOverrides:{},gradeOverrides:{},
 calendarAdded:['2026-12-12'],calendarRemoved:[],
 auditTrail:[
  {type:'weekly_override',target:'REF',value:5,originalValue:4,reason:'Horário homologado da turma.',source:'Horário homologado de 15/09/2026',updatedAt:10},
  {type:'calendar_add',target:'2026-12-12',value:'letivo local',originalValue:'não letivo no modelo',reason:'Reposição aprovada.',source:'Calendário homologado da escola',updatedAt:11}
 ],updatedAt:11
};
const valid=ctx.validateConfig(JSON.parse(JSON.stringify(audited)));
assert.strictEqual(valid.version,8,'Configuração auditável deve migrar para o schema v8.');
assert.strictEqual(valid.weeklyAudit.REF.originalWeekly,4,'Valor documental original deve permanecer recuperável.');
assert.strictEqual(valid.weeklyAudit.REF.source,'Horário homologado de 15/09/2026','Fonte local informada deve ser preservada.');
assert(valid.auditTrail.some(e=>e.type==='calendar_add'&&e.target==='2026-12-12'),'Ajuste ativo de calendário deve ter trilha correspondente.');

const noWeeklyAudit=JSON.parse(JSON.stringify(audited));delete noWeeklyAudit.weeklyAudit.REF;
assert.throws(()=>ctx.validateConfig(noWeeklyAudit),/sem justificativa\/fonte auditável/,'Schema v7 deve rejeitar A/S local sem rastreabilidade.');

const noCalendarAudit=JSON.parse(JSON.stringify(audited));noCalendarAudit.auditTrail=noCalendarAudit.auditTrail.filter(e=>e.type!=='calendar_add');
assert.throws(()=>ctx.validateConfig(noCalendarAudit),/Data adicionada sem rastreabilidade/,'Schema v7 deve rejeitar calendário local sem trilha.');

const legacy={version:6,datasetId:'ded-plataforma-template-2026',days:68,school:{},weekly:{REF:6},expected:{},teacherOverrides:{},gradeOverrides:{},calendarAdded:[],calendarRemoved:['2026-12-08'],updatedAt:99};
const migrated=ctx.validateConfig(legacy);
assert.strictEqual(migrated.version,8,'Configuração legada deve migrar para v8.');
assert.strictEqual(migrated.weeklyAudit.REF.originalWeekly,4,'Migração deve capturar o valor documental original.');
assert.strictEqual(migrated.weeklyAudit.REF.legacy,true,'Ajuste antigo deve ser marcado como legado.');
assert(migrated.weeklyAudit.REF.source.includes('fonte não registrada'),'Migração não pode inventar fonte oficial.');
assert(migrated.auditTrail.some(e=>e.type==='calendar_remove'&&e.target==='2026-12-08'&&e.legacy),'Calendário legado deve ganhar trilha explicitamente incompleta.');

const selected=ctx.validateConfig({...audited,regularMatrixByClass:{TURMA1:'EM_REG_D_1'}});
assert.strictEqual(selected.regularMatrixByClass.TURMA1,'EM_REG_D_1','Seleção de matriz REG deve persistir no schema v8.');
assert(selected.auditTrail.some(e=>e.type==='regular_matrix_override'&&e.target==='TURMA1'&&e.legacy),'Escolha sem auditoria anterior deve ser sinalizada como legado.');
const invalidMatrix={...audited,regularMatrixByClass:{TURMA1:'EM_INT_1'}};
assert.throws(()=>ctx.validateConfig(invalidMatrix),/Matriz regular por turma inválida/,'Seleção de matriz de outra modalidade deve ser rejeitada.');
assert(src03.includes('Ajuste local, não fonte oficial.'),'Cálculo deve distinguir origem local de referência documental.');
assert(src11.includes('calendar-remove-reason')&&src11.includes('calendar-remove-source'),'Exclusão de data deve solicitar motivo e fonte.');
assert(src11.includes('calendar-add-reason')&&src11.includes('calendar-add-source'),'Reposição deve solicitar motivo e fonte.');
assert(src11.includes('referenceOriginCell(key,r,value)'),'Tabela de A/S deve mostrar origem auditável.');
assert(src11.includes('auditTrailPanel()'),'Configurações devem expor histórico de alterações.');
assert(src14.includes('requestWeeklyReferenceChange(key,val)'),'A/S não pode ser gravada diretamente pelo input.');
assert(!src14.includes("if(val===DATA.refs[key].weekly)delete cfg.weekly[key]"),'Fluxo antigo sem justificativa não pode retornar.');
assert(src13.includes("requestCalendarAdjustment('remove')")&&src13.includes("requestCalendarAdjustment('add')"),'Calendário deve passar pelo fluxo auditável.');
assert(src13.includes('requestCalendarReset()'),'Restauração do calendário deve ser auditada.');
assert(src13.includes('resetCalculationReferencesAudited()'),'Restauração global deve preservar histórico.');
assert(src21.includes("delete cfg.weekly[key];if(cfg.weeklyAudit)delete cfg.weeklyAudit[key]"),'Restauração de A/S deve remover override atual e recuperar documento.');
assert(src21.includes("type:'weekly_restore'"),'Restauração de A/S deve gerar evento de auditoria.');
assert(src21.includes("type:'calendar_restore'"),'Restauração de calendário deve gerar evento de auditoria.');
assert(src21.includes('Este ajuste é local e não transforma a fonte informada em referência oficial.'),'Interface deve impedir confusão entre fonte local e oficial.');
assert(!src21.includes('DATA.refs[key].source='),'Ajuste local não pode sobrescrever a fonte documental incorporada.');
assert(src13.includes('Parâmetros e rastreabilidade exportados.'),'Exportação de parâmetros deve declarar inclusão da rastreabilidade.');
assert(html.includes('"version":8')&&html.includes('"weeklyAudit":{}')&&html.includes('"auditTrail":[]'),'Template público deve nascer no schema auditável v8.');

console.log('OK: rastreabilidade de calendário, A/S, migração legada e restauração documental verificadas.');
