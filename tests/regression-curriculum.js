'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const jsDir = path.join(root, 'src', 'js');
const indexPath = path.join(root, 'src', 'index.html');
const files = fs.readdirSync(jsDir).filter(f => /^\d{2}\.js$/.test(f)).sort();
assert.deepStrictEqual(files, Array.from({length:18},(_,i)=>`${String(i+1).padStart(2,'0')}.js`), 'A sequência modular JS deve permanecer 01..18.');
const js = files.map(f => fs.readFileSync(path.join(jsDir,f),'utf8')).join('\n');
new Function(js); // syntax-only compile; does not execute DOM code

const unsafe = [
  'EM_INT_2_AUT|AUTOMACAO INDUSTRIAL III',
  'EM_INT_2_AUT|AUTOMACAO INDUSTRIAL IV',
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
assert(js.includes('function extractShortClass'), 'Importador deve preservar hífens internos do nome da oferta técnica.');
assert(js.includes("parts.slice(0,-1).join(' - ')"), 'Remoção do endereço deve preservar segmentos internos separados por hífen.');
assert(js.includes('QUIMICA_PRODUCAO_INDUSTRIAL'), 'Curso técnico Química/Produção Industrial deve ser classificável.');
assert(js.includes('DESENVOLVIMENTO_SISTEMAS'), 'Curso técnico Desenvolvimento de Sistemas deve ser classificável.');
assert(js.includes('MATEMATICA APLICADA EM LINGUA ESTRANGEIRA'), 'Componentes bilíngues oficiais devem ser reconhecidos.');
assert(js.includes("source:isBilingualComponent(compNorm)?MATRIX_SOURCE_BILINGUAL"), 'Carga bilíngue ausente deve permanecer sem inferência automática.');

const html = fs.readFileSync(indexPath,'utf8');
const scripts = [...html.matchAll(/<script src="js\/(\d{2})\.js"><\/script>/g)].map(m=>m[1]);
assert.deepStrictEqual(scripts, Array.from({length:18},(_,i)=>String(i+1).padStart(2,'0')), 'index.html deve carregar os 18 módulos JS em ordem.');
const styles = [...html.matchAll(/<link href="css\/(\d{2})\.css" rel="stylesheet"\/>/g)].map(m=>m[1]);
assert.deepStrictEqual(styles, ['01','02','03','04','05','06','07'], 'index.html deve carregar os sete módulos CSS.');
assert(html.includes('id="matrix-filter"'), 'Filtro Oferta / matriz deve permanecer disponível no template.');
assert(html.includes('Desenvolvido por Christian Oliveira'),'Crédito de desenvolvimento deve permanecer no rodapé.');
const importSafety = fs.readFileSync(path.join(jsDir,'15.js'),'utf8');
const eventModule = fs.readFileSync(path.join(jsDir,'14.js'),'utf8');
for (const fn of ['stageImport','validateImportCandidate','buildImportPreview','commitImport','createLocalRestorePoint','undoLastImport']) assert(new RegExp('function\\s+'+fn+'\\s*\\(').test(importSafety), 'Fluxo seguro de importação ausente: '+fn);
assert(eventModule.includes("queueSafeImport(file,el.id==='replace-t1-file'?'1':'2')"),'T1/T2 devem passar pela prévia antes de substituir a base.');
assert(eventModule.includes("queueSafeImport(file,'weekly')"),'T3 semanal deve passar pela prévia antes de gravar snapshot.');
assert(!eventModule.includes('await replaceReport(file'),'Listener de arquivo não pode aplicar T1/T2 diretamente.');
assert(!eventModule.includes('await addWeeklyReport(file'),'Listener de arquivo não pode aplicar snapshot semanal diretamente.');
assert(importSafety.includes('SAFE_IMPORT_RESTORE_KEY'),'Substituições devem preservar um ponto local de restauração.');
assert(importSafety.includes('replacesExisting'),'Mesma data semanal deve ser identificada antes da confirmação.');
assert(importSafety.includes("setImportStatus('error','Planilha não aplicada'"),'Erro de parsing/validação deve permanecer visível sem aplicar a base.');
assert(importSafety.includes("cancelStagedImport"),'Prévia deve poder ser cancelada sem commit.');
const backupRecovery = fs.readFileSync(path.join(jsDir,'16.js'),'utf8');
for (const step of ['Lendo arquivo','Validando estrutura','Conferindo turmas e componentes','Preparando prévia','Aplicando atualização','Concluído']) assert(js.includes(step),'Etapa de processamento ausente: '+step);
assert(importSafety.includes('setDataOperationBusy(true)'),'Importação deve bloquear ação concorrente equivalente durante processamento.');
assert(importSafety.includes('Próximo passo:'),'Erro persistente deve orientar a próxima ação.');
assert(importSafety.includes("kind==='error'?'alert':'status'"),'Erro crítico deve usar semântica persistente de alerta.');
for (const fn of ['backupDataStorePayload','validateDataBackup','stageDataBackupRestore','commitDataBackupRestore']) assert(new RegExp('function\\s+'+fn+'\\s*\\(').test(backupRecovery),'Fluxo de restauração ausente: '+fn);
assert(backupRecovery.includes('DATA_BACKUP_VERSION=2'),'Backup deve possuir versão explícita.');
assert(backupRecovery.includes("raw.datasetId!==DATA.datasetId"),'Restauração deve validar dataset.');
assert(backupRecovery.includes("createLocalRestorePoint('Antes de restaurar backup"),'Restauração deve preservar a versão anterior.');
assert(html.includes('id="restore-data-backup-file"'),'Input local de restauração de backup deve existir.');


const matrixPath = path.join(root,'data','matrizes','emti_2026_anonimizada.json');
assert(fs.existsSync(matrixPath),'Matriz EMTI anonimizada deve permanecer versionada.');
const matrix = JSON.parse(fs.readFileSync(matrixPath,'utf8'));
assert.strictEqual(matrix.schema_version,2,'Schema da matriz semanal deve permanecer na versão 2.');
assert.strictEqual(Object.keys(matrix.classes).length,15,'Matriz EMTI deve conter 15 perfis de turma.');
assert(!JSON.stringify(matrix).match(/professor|docente/i),'JSON da matriz não pode armazenar nomes/campos de professor.');
for(const item of Object.values(matrix.classes)){assert(item.report_class&&item.components,'Cada turma deve mapear report_class e components.');}
assert.strictEqual(matrix.classes['2º TEC ER1'].school_weekly_total,33,'Parte escolar do 2º SENAI deve permanecer em 33 A/S.');
assert.strictEqual(matrix.classes['2º TEC ER1'].external_not_monitored.weekly_total,12,'Bloco técnico SENAI externo deve permanecer explicitamente fora do monitoramento.');
assert.strictEqual(matrix.classes['3INF1'].school_weekly_total,46,'3INF1 deve preservar soma por coluna de 46 A/S.');
assert.strictEqual(matrix.classes['3QUI1'].school_weekly_total,46,'3QUI1 deve preservar soma por coluna de 46 A/S.');
assert(js.includes('CLASS_MATRIX_BY_REPORT'),'Motor deve aceitar matriz semanal específica por turma.');
assert(js.includes('monitoringExcluded'),'Motor deve excluir componentes externos explicitamente marcados.');
assert(js.includes("s.intervalDays=prev?officialDaysBetween(prev.date,s.date):s.daysToDate"),'Primeiro snapshot do T3 deve ser avaliado desde o início do trimestre.');
assert(js.includes("previous=prev?numeric(before?.total):0"),'Primeira atualização semanal deve usar base zero.');
assert(js.includes("Math.ceil(expected*.8-1e-9)"),'Mínimo semanal deve ser 80% do previsto, arredondado para cima.');
assert(js.includes("below=assessed.filter(r=>!r.met80)"),'Regra de atenção deve ser aplicada por diário, sem compensação entre turmas.');
assert(js.includes("function weeklyTeacherPrintSheet"),'Impressão individual por professor deve permanecer disponível.');
assert(js.includes("function beginWeeklyPrint"),'Impressão em lote de professores selecionados deve permanecer disponível.');
const sourceMatch = html.match(/<script id="source-data" type="application\/json">([\s\S]*?)<\/script>/);
assert(sourceMatch, 'source-data ausente.');
const data = JSON.parse(sourceMatch[1]);
assert.strictEqual(data.raw.length,0,'Template público não pode conter linhas do 2º trimestre.');
assert.strictEqual(data.raw_t1.length,0,'Template público não pode conter linhas do 1º trimestre.');
assert.strictEqual(data.raw_t3.length,0,'Template público não pode conter linhas do 3º trimestre.');
assert.strictEqual(data.school,'','Template público não pode vir identificado com uma escola.');

const sensitive = [/H[IÍ]LTON ROCHA/i,/MARIA LUIZA MIRANDA BASTOS/i,/000353/,/CRISTIANO MACHADO/i,/ANA CECILIA SANTOS GOMES/i,/VAMBERTO/i];
const publicSource = html + '\n' + js + '\n' + fs.readdirSync(path.join(root,'src','css')).sort().map(f=>fs.readFileSync(path.join(root,'src','css',f),'utf8')).join('\n');
assert(publicSource.includes('body.weekly-printing .weekly-print-sheet'),'Impressão semanal deve isolar folhas individuais por professor.');
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
