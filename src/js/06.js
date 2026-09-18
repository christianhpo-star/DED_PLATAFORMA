'use strict';
function stats(rows){
 const lessons=rows.filter(r=>r.unit==='aulas');const measured=lessons.filter(r=>r.actual!==null);const comparable=lessons.filter(r=>r.comparable);
 const predicted=sum(comparable,r=>r.plan.value),actual=sum(comparable,r=>r.actual);
 const below=comparable.filter(r=>r.balance<0),above=comparable.filter(r=>r.balance>0);
 return {rows,lessons,measured,comparable,below,above,expected:comparable.length?predicted:null,actual:comparable.length?actual:null,balance:comparable.length?actual-predicted:null,ratio:predicted>0?actual/predicted*100:null,missingLoad:measured.filter(r=>r.plan.value===null),missingActual:lessons.filter(r=>r.actual===null),days:rows.filter(r=>r.unit==='dias'),open:rows.filter(r=>r.status!=='FECHADO'),zeroNotes:rows.filter(r=>/^0[.,]0\s*\/\s*30$/.test(r.notas)),shortfall:sum(below,r=>-r.balance),excess:sum(above,r=>r.balance),estimated:comparable.filter(r=>r.plan.kind==='estimated').length,entered:comparable.filter(r=>r.plan.kind==='entered').length,teachers:unique(rows.map(r=>r.professor)),classes:unique(rows.map(r=>r.cod_turma))};
}
function baseRows(){const q=normalize(state.query.trim());return modelRows().filter(r=>(!state.stage||stage(r)===state.stage)&&rowMatchesOfferFilter(r,state.matrixGroup)&&(!state.classId||r.cod_turma===state.classId)&&(!state.teacher||r.professor===state.teacher)&&(!q||normalize(r.professor+' '+r.componente+' '+r.turma+' '+r.cod_turma).includes(q)));}
function grouped(rows,key){const map=new Map();for(const r of rows){const k=r[key];if(!map.has(k))map.set(k,[]);map.get(k).push(r);}return [...map.entries()].map(([name,rs])=>({name,records:rs,s:stats(rs)}));}
function groupsTeachers(){let gs=grouped(baseRows(),'professor');if(state.mode==='open')gs=gs.filter(g=>g.s.open.length);if(state.mode==='below')gs=gs.filter(g=>g.s.below.length);if(state.mode==='unmapped')gs=gs.filter(g=>g.s.missingLoad.length||g.s.missingActual.length);if(state.teacherGradeMode==='attention')gs=gs.filter(g=>g.records.some(r=>['none','partial'].includes(r.grade.status)));if(state.teacherGradeMode==='majority')gs=gs.filter(g=>g.records.some(r=>r.grade.status==='majority'));if(state.teacherGradeMode==='unknown')gs=gs.filter(g=>g.records.some(r=>r.grade.status==='unknown'));gs.sort((a,b)=>{if(state.sort==='name')return a.name.localeCompare(b.name,'pt-BR');if(state.sort==='ratio')return (a.s.ratio??Infinity)-(b.s.ratio??Infinity)||a.name.localeCompare(b.name,'pt-BR');if(state.sort==='gap')return b.s.shortfall-a.s.shortfall||a.name.localeCompare(b.name,'pt-BR');return (gradeStats(b.records).none+gradeStats(b.records).partial)-(gradeStats(a.records).none+gradeStats(a.records).partial)||b.s.open.length-a.s.open.length||b.s.shortfall-a.s.shortfall||a.name.localeCompare(b.name,'pt-BR');});return gs;}
function classSort(a,b){const aa=RAW.find(r=>r.cod_turma===a),bb=RAW.find(r=>r.cod_turma===b);return aa.shortClass.localeCompare(bb.shortClass,'pt-BR',{numeric:true});}
function options(items,selected,label){return `<option value="">${esc(label)}</option>`+items.map(([v,t])=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(t)}</option>`).join('');}
function syncFilterOptions(){
 const triSel=document.getElementById('trimester-filter');if(triSel)triSel.value=state.trimester;
 document.getElementById('stage-filter').value=state.stage;
 const curRaw=getActiveRaw(),curResolved=curRaw.map(r=>({...r,professor:responsibleTeacher(r)}));
 const stageAllowed=curResolved.filter(r=>!state.stage||stage(r)===state.stage),matrixItems=offerFilterOptions(stageAllowed),matrixSel=document.getElementById('matrix-filter');
 if(state.matrixGroup&&!matrixItems.some(([v])=>v===state.matrixGroup))state.matrixGroup='';
 if(matrixSel)matrixSel.innerHTML=options(matrixItems,state.matrixGroup,'Todas as ofertas / matrizes');
 const allowed=stageAllowed.filter(r=>rowMatchesOfferFilter(r,state.matrixGroup));
 const ids=unique(allowed.map(r=>r.cod_turma)).sort(classSort);
 if(state.classId&&!ids.includes(state.classId))state.classId='';
 document.getElementById('class-filter').innerHTML=options(ids.map(id=>[id,curResolved.find(r=>r.cod_turma===id).shortClass]),state.classId,'Todas as turmas');
 const names=unique(allowed.filter(r=>!state.classId||r.cod_turma===state.classId).map(r=>r.professor)).sort((a,b)=>a.localeCompare(b,'pt-BR'));
 if(state.teacher&&!names.includes(state.teacher))state.teacher='';
 document.getElementById('teacher-filter').innerHTML=options(names.map(n=>[n,title(n)]),state.teacher,'Todos os professores');
 document.getElementById('query-filter').value=state.query;
}

// Leitor XLSX local: extrai somente as células necessárias do relatório oficial, sem enviar arquivos para a internet.
async function unzipXlsx(file){
 const buffer=await file.arrayBuffer(),view=new DataView(buffer);let eocd=-1;
 for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--){if(view.getUint32(i,true)===0x06054b50){eocd=i;break;}}
 if(eocd<0)throw new Error('O arquivo não parece ser um XLSX válido.');
 const count=view.getUint16(eocd+10,true),central=view.getUint32(eocd+16,true),decoder=new TextDecoder(),files={};let p=central;
 for(let i=0;i<count;i++){
  if(view.getUint32(p,true)!==0x02014b50)throw new Error('Estrutura ZIP inválida.');
  const method=view.getUint16(p+10,true),size=view.getUint32(p+20,true),nameLen=view.getUint16(p+28,true),extraLen=view.getUint16(p+30,true),commentLen=view.getUint16(p+32,true),local=view.getUint32(p+42,true),name=decoder.decode(new Uint8Array(buffer,p+46,nameLen));
  const localName=view.getUint16(local+26,true),localExtra=view.getUint16(local+28,true),start=local+30+localName+localExtra,compressed=new Uint8Array(buffer,start,size);let raw;
  if(method===0)raw=compressed;else if(method===8){const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));raw=new Uint8Array(await new Response(stream).arrayBuffer());}else throw new Error('Compactação XLSX não suportada.');
  files[name]=raw;p+=46+nameLen+extraLen+commentLen;
 }
 return files;
}
function xmlDoc(bytes){const doc=new DOMParser().parseFromString(new TextDecoder('utf-8').decode(bytes),'application/xml');if(doc.querySelector('parsererror'))throw new Error('Não foi possível ler o XML interno da planilha.');return doc;}
function columnIndex(ref){let n=0;for(const c of (ref.match(/[A-Z]+/i)?.[0]||''))n=n*26+c.toUpperCase().charCodeAt(0)-64;return n-1;}
function collapseTeacherRows(records,prefix){const map=new Map();for(const r of records){const k=logicalKey(r);if(!map.has(k))map.set(k,[]);map.get(k).push(r);}const out=[];for(const grp of map.values()){const candidates=unique(grp.map(r=>r.professor)),rep={...grp[0]},fields=['total','notas','status','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],same=grp.every(r=>fields.every(f=>(r[f]??'-')===(grp[0][f]??'-')));rep.professorCandidates=candidates;rep.teacherConflict=candidates.length>1;rep.duplicateSourceRows=grp.length;rep.dataConflict=!same;if(candidates.length>1)rep.professor='RESPONSÁVEL A CONFIRMAR';if(!same){rep.total='-';rep.status='CONFERIR DUPLICIDADE';}out.push(rep);}out.sort((a,b)=>a.shortClass.localeCompare(b.shortClass,'pt-BR',{numeric:true})||a.componente.localeCompare(b.componente,'pt-BR'));out.forEach((r,i)=>r.id=`${prefix}${String(i).padStart(3,'0')}`);return out;}
async function parseTeacherReport(file,prefix){
 if(!file||file.size>20*1024*1024)throw new Error('Selecione um arquivo XLSX de até 20 MB.');
 const files=await unzipXlsx(file),shared=[];
 if(files['xl/sharedStrings.xml'])for(const si of xmlDoc(files['xl/sharedStrings.xml']).querySelectorAll('si'))shared.push([...si.querySelectorAll('t')].map(t=>t.textContent).join(''));
 const sheetName=Object.keys(files).find(n=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(n));if(!sheetName)throw new Error('Nenhuma aba de dados foi localizada.');
 const sheet=xmlDoc(files[sheetName]),matrix=[];
 for(const row of sheet.querySelectorAll('sheetData > row')){const arr=[];for(const c of row.querySelectorAll(':scope > c')){const idx=columnIndex(c.getAttribute('r')||''),type=c.getAttribute('t'),v=c.querySelector(':scope > v')?.textContent??'';arr[idx]=type==='s'?(shared[Number(v)]??''):type==='inlineStr'?[...c.querySelectorAll('t')].map(t=>t.textContent).join(''):v;}matrix.push(arr.map(v=>String(v??'').trim()));}
 const nh=s=>normalize(s).toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim(),headAt=matrix.findIndex(row=>row.some(v=>nh(v)==='NOME PROFESSOR')&&row.some(v=>nh(v)==='COMPONENTE'));
 if(headAt<0)throw new Error('Cabeçalho “NOME PROFESSOR / COMPONENTE” não encontrado. Use o Relatório de Lançamentos do Professor.');
 const headers=matrix[headAt].map(nh),col=name=>headers.indexOf(nh(name)),pick=(row,name)=>{const i=col(name);return i>=0?(row[i]||'-'):'-';};
 const monthCols={};headers.forEach((h,i)=>{const m=h.match(/^AULAS DADAS (FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$/);if(m)monthCols[m[1].toLowerCase()]=i;});
 const records=[],modalityIssues=[];
 for(const row of matrix.slice(headAt+1)){
  const professor=pick(row,'NOME PROFESSOR'),componente=pick(row,'COMPONENTE'),turma=pick(row,'TURMA'),cod=pick(row,'CODIGO TURMA');if([professor,componente,turma,cod].some(v=>!v||v==='-'))continue;
  const shortClass=extractShortClass(turma),classNorm=nh(shortClass),compNorm=nh(componente),turno=pick(row,'TURNO'),turnNorm=nh(turno),isInt=/(^| )INT( |$)/.test(classNorm),isReg=/(^| )REG( |$)/.test(classNorm);
  if(isInt===isReg)modalityIssues.push(`${shortClass}: informe REG ou INT no nome da turma.`);else if(isInt&&turnNorm!=='INTEGRAL')modalityIssues.push(`${shortClass}: turma INT precisa estar no turno INTEGRAL (veio “${turno}”).`);else if(isReg&&turnNorm!=='NOITE')modalityIssues.push(`${shortClass}: nesta configuração, turma REG precisa estar no turno NOITE (veio “${turno}”).`);
  const profile=classifySchoolProfile(shortClass),bucket=profile.bucket,unit=compNorm.startsWith('FREQUENCIA')?'dias':'aulas',refKey=`${bucket}|${compNorm}`;
  if(!Object.hasOwn(DATA.refs,refKey))DATA.refs[refKey]={bucket,component:componente,weekly:null,source:isBilingualComponent(compNorm)?MATRIX_SOURCE_BILINGUAL:'Componente não localizado na matriz oficial selecionada; carga semanal a definir pela escola.'};
  const record={professor,componente,turno,cod_turma:cod,turma,ano:'2026',divisao:pick(row,'DIVISAO'),total:pick(row,'TOTAL DE AULAS DADAS'),notas:pick(row,'NOTAS REGISTRADAS'),status:pick(row,'STATUS DA DIVISAO').toUpperCase(),id:`${prefix}${String(records.length).padStart(3,'0')}`,bucket,shortClass,courseKey:profile.courseKey,offer:profile.offer,unit,baseComponent:componente,refKey};
  for(const [m,i] of Object.entries(monthCols))record[m]=row[i]||'-';records.push(record);
 }
 if(!records.length)throw new Error('A planilha foi lida, mas nenhum lançamento válido foi encontrado.');
 if(modalityIssues.length)throw new Error('Modalidade e turno divergentes: '+[...new Set(modalityIssues)].slice(0,5).join(' | '));
 const collapsed=collapseTeacherRows(records,prefix);normalizeEmbeddedRows(collapsed);return collapsed;
}
