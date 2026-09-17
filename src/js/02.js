'use strict';
rebuildConsolidated();
const CALENDAR_TRIMESTERS=DATA.calendarTrimesters||{'1':{start:'2026-02-04',end:'2026-05-20',days:66},'2':{start:'2026-05-21',end:'2026-09-09',days:68},'3':{start:'2026-09-10',end:'2026-12-18',days:66}};
const OFFICIAL_SCHOOL_DAYS=new Set(DATA.schoolDays||[]);
function effectiveSchoolDays(){const s=new Set(OFFICIAL_SCHOOL_DAYS);for(const d of cfg.calendarRemoved||[])s.delete(d);for(const d of cfg.calendarAdded||[])s.add(d);return s;}
function trimesterDays(t){const meta=CALENDAR_TRIMESTERS[t]||{};if(!meta.start||!meta.end)return meta.days||0;return [...effectiveSchoolDays()].filter(d=>d>=meta.start&&d<=meta.end).length;}
function getActiveDays(){if(state.trimester==='1')return trimesterDays('1');if(state.trimester==='all'||state.trimester==='consolidated')return trimesterDays('1')+trimesterDays('2');if(state.trimester==='3')return dataStore.weeklySnapshots.at(-1)?.daysToDate||trimesterDays('3');return trimesterDays('2');}
function calendarExpected(weekly,trimester=state.trimester){if(weekly===null||weekly===undefined)return null;if(trimester==='1')return Math.round(weekly*trimesterDays('1')/5);if(trimester==='2')return Math.round(weekly*trimesterDays('2')/5);if(trimester==='all'||trimester==='consolidated')return Math.round(weekly*trimesterDays('1')/5)+Math.round(weekly*trimesterDays('2')/5);const d=getActiveDays();return Math.round(weekly*d/5);}
function officialDaysThrough(date){if(!date)return 0;return [...effectiveSchoolDays()].filter(d=>d>='2026-09-10'&&d<='2026-12-18'&&d<=date).length;}
function officialDaysBetween(a,b){if(!a||!b||b<a)return 0;return [...effectiveSchoolDays()].filter(d=>d>='2026-09-10'&&d<='2026-12-18'&&d>a&&d<=b).length;}
function recalcSnapshotCalendar(){dataStore.weeklySnapshots.sort((a,b)=>a.date.localeCompare(b.date));for(let i=0;i<dataStore.weeklySnapshots.length;i++){const s=dataStore.weeklySnapshots[i],prev=dataStore.weeklySnapshots[i-1];s.daysToDate=officialDaysThrough(s.date);s.intervalDays=prev?officialDaysBetween(prev.date,s.date):0;}}
function getActiveRaw(){
 if(state.trimester==='1') return DATA.raw_t1 || DATA.raw;
 if(state.trimester==='all'||state.trimester==='consolidated') return DATA.raw_consolidated || DATA.raw;
 if(state.trimester==='3') return DATA.raw_t3 || [];
 return DATA.raw;
}
let RAW = DATA.raw;

const LEGACY_KEY = `ded-em-foco:${INSTANCE_SCOPE}:${DATA.datasetId}`;
const KEY = LEGACY_KEY + ':config-v5';
const nf = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:1});
const moneyless = n => n === null || n === undefined ? '\u2014' : nf.format(n);
const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const title = s => String(s).toLocaleLowerCase('pt-BR').replace(/(^|[\s:])\S/g,c=>c.toLocaleUpperCase('pt-BR')).replace(/\b(De|Da|Do|Dos|Das|E|Em)\b/g,s=>s.toLowerCase());
const integer = v => typeof v === 'number' && Number.isInteger(v);
const numeric = v => /^\d+$/.test(String(v).trim()) ? Number(v) : null;
const stage = r => (r.bucket==='EF_AI'||r.bucket==='EFTI_AI')?'AI':(r.bucket==='EF_AF'||r.bucket==='EFTI')?'AF':'EM';
const unique = a => [...new Set(a)];
const sum = (a, f) => a.reduce((t,x)=>t+f(x),0);
const shortName = s => {const p=title(s).split(' ');return p.filter((w,i)=>i===0 || !['de','da','do','dos','das','e'].includes(w)).slice(0,2).join(' ');};
const initials = s => s.split(' ').filter(p=>p.length>2).slice(0,2).map(p=>p[0]).join('');
const refLabels = {EM_REG_1:'1º EM · Regular noturno',EM_REG_2:'2º EM · Regular noturno',EM_REG_3:'3º EM · Regular noturno',EM_INT_1:'1º EM · Integral profissional',EM_INT_2_FAB:'2º EM · Integral · Fabricação Mecânica',EM_INT_2_SER:'2º EM · Integral · Sistemas de Energia Renovável',EM_INT_3_INFO:'3º EM · Integral · Informática',EM_INT_3_SEG:'3º EM · Integral · Segurança do Trabalho'};
const iconPaths = {
 layers:'<path d="m12 2 10 5-10 5-10-5Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',school:'<path d="m3 9 9-6 9 6v11H3Z"/><path d="M9 20v-7h6v7M7 10h.01M17 10h.01"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5"/>',
 compare:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
 flag:'<path d="M5 21V3m0 1c4-4 10 4 14 0v10c-4 4-10-4-14 0"/>',
 sliders:'<path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01"/>',
 print:'<path d="M6 9V3h12v6M6 18H3v-9h18v9h-3M6 15h12v6H6ZM17 12h.01"/>',
 download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 book:'<path d="M12 5v15M3 4c4-1 7 0 9 1 2-1 5-2 9-1v15c-4-1-7 0-9 1-2-1-5-2-9-1Z"/>',
 chart:'<path d="M3 3v18h18M7 16v-5m5 5V7m5 9V4"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 down:'<path d="m5 9 7 7 7-7"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 alert:'<path d="m12 3 10 18H2ZM12 9v4M12 17h.01"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 save:'<path d="M4 3h13l4 4v14H3V3ZM7 3v6h9V3M7 21v-8h10v8"/>',
 upload:'<path d="M12 16V3m-4 4 4-4 4 4M4 16v5h16v-5"/>',
 file:'<path d="M5 3h9l5 5v13H5ZM14 3v6h5M8 13h8M8 17h6"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.info}</svg>`;
const badge = (text,type='')=>`<span class="status ${type}"><span class="status-dot"></span>${esc(text)}</span>`;
const btn = (text, action, attrs='', kind='')=>`<button type="button" class="btn ${kind}" data-action="${action}" ${attrs}>${text}</button>`;
const percent = n => n===null?'\u2014':moneyless(n)+'%';
const delta = n => n===null?'\u2014':(n>0?'+':'')+moneyless(n);
const defaultConfig = () => ({version:6,datasetId:DATA.datasetId,days:DATA.declaredDays,school:{name:'',city:'',sre:'',code:'',responsible:''},weekly:{},expected:{},teacherOverrides:{},gradeOverrides:{},calendarAdded:[],calendarRemoved:[],updatedAt:0});
function validateConfig(obj) {
 if(!obj || ![2,3,4,5,6].includes(obj.version) || obj.datasetId!==DATA.datasetId) throw new Error('Configura\u00e7\u00e3o de outra base ou vers\u00e3o.');
 if(!integer(obj.days)||obj.days<1||obj.days>200)throw new Error('Dias de refer\u00eancia: use um inteiro entre 1 e 200.');
 const clean=defaultConfig();clean.days=obj.days;if(obj.school&&typeof obj.school==='object'&&!Array.isArray(obj.school)){for(const k of ['name','city','sre','code','responsible']){const v=String(obj.school[k]??'').trim();clean.school[k]=v.slice(0,k==='name'?180:120);}}
 if(!obj.weekly||typeof obj.weekly!=='object'||Array.isArray(obj.weekly)||!obj.expected||typeof obj.expected!=='object'||Array.isArray(obj.expected))throw new Error('Estrutura de configura\u00e7\u00e3o inv\u00e1lida.');
 for(const [key,val] of Object.entries(obj.weekly)){
   if(!Object.hasOwn(DATA.refs,key)||!(val===null||(integer(val)&&val>=0&&val<=45)))throw new Error('Carga semanal inv\u00e1lida.');
   clean.weekly[key]=val;
 }
 for(const [key,o] of Object.entries(obj.expected)){
   const record=RAW.find(r=>r.id===key);
   if(!record||record.unit!=='aulas'||!o||!integer(o.value)||o.value<0||o.value>5000||typeof o.source!=='string'||!o.source.trim()||o.source.length>500)throw new Error('Previs\u00e3o por registro inv\u00e1lida.');
   clean.expected[key]={value:o.value,source:o.source.trim()};
 }
 if(obj.teacherOverrides!==undefined){
  if(!obj.teacherOverrides||typeof obj.teacherOverrides!=='object'||Array.isArray(obj.teacherOverrides))throw new Error('Estrutura de responsáveis inválida.');
  for(const [key,name] of Object.entries(obj.teacherOverrides)){const r=[...(DATA.raw||[]),...(DATA.raw_t1||[])].find(x=>logicalKey(x)===key);if(!r||!Array.isArray(r.professorCandidates)||!r.professorCandidates.includes(name))throw new Error('Professor responsável inválido para '+key);clean.teacherOverrides[key]=name;}
 }
 if(obj.gradeOverrides!==undefined){
  if(!obj.gradeOverrides||typeof obj.gradeOverrides!=='object'||Array.isArray(obj.gradeOverrides))throw new Error('Estrutura de notas inv\u00e1lida.');
  for(const [id,g] of Object.entries(obj.gradeOverrides)){
   const r=RAW.find(r=>r.id===id);
   if(!r||r.unit==='dias'||!g||!integer(g.total)||g.total<1||g.total>9999||!integer(g.withNote)||g.withNote<0||g.withNote>g.total||typeof g.source!=='string'||!g.source.trim()||g.source.length>500||typeof g.reason!=='string'||g.reason.length>1000||typeof g.reasonConfirmed!=='boolean'||(g.reasonConfirmed&&!g.reason.trim())||(g.withNote===g.total&&(g.reason.trim()||g.reasonConfirmed)))throw new Error('Confer\u00eancia de notas inv\u00e1lida.');
   clean.gradeOverrides[id]={total:g.total,withNote:g.withNote,source:g.source.trim(),reason:g.reason.trim(),reasonConfirmed:g.reasonConfirmed,updatedAt:Number.isFinite(g.updatedAt)?g.updatedAt:0};
  }
 }
 if(obj.calendarAdded!==undefined||obj.calendarRemoved!==undefined){
  const iso=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T00:00:00'));
  for(const prop of ['calendarAdded','calendarRemoved']){
   const arr=obj[prop]??[];if(!Array.isArray(arr)||arr.length>100||arr.some(d=>!iso(d)||!d.startsWith('2026-')))throw new Error('Ajuste local de calendário inválido.');
   clean[prop]=[...new Set(arr)].sort();
  }
  clean.calendarAdded=clean.calendarAdded.filter(d=>!clean.calendarRemoved.includes(d));
 }
 clean.updatedAt=Number.isFinite(obj.updatedAt)&&obj.updatedAt>=0?obj.updatedAt:0;
 return clean;
}
