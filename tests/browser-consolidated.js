'use strict';
// Chromium sintético: testes pela interface de arquivo, confirmação, backup e recarga.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict'),{chromium}=require('playwright-core'),{matrix,xlsx}=require('./consolidated-fixtures');
const root=path.resolve(__dirname,'..');
(async()=>{
 const html=fs.readFileSync(path.join(root,'dist/DED_em_Foco_MultiEscola_2026.html'));
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const executablePath=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
 const browser=await chromium.launch({headless:true,executablePath}),context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
 const file=(t=1,c='101',g='0')=>({name:`qa-${c}-T${t}.xlsx`,mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:xlsx(matrix(t,c,g))});
 const count=()=>page.evaluate(()=>Object.keys(window.DED_CONSOLIDATED_UI.getStore().active).length);
 const select=async files=>{await page.locator('#class-consolidated-files').setInputFiles(files);try{await page.locator('[data-action="consolidated-confirm"]').waitFor({timeout:5000});}catch(e){throw new Error('Prévia: '+await page.locator('[role="status"]').textContent());}};
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/#classReports');await page.waitForSelector('#class-consolidated-files');
  await select(file());assert.equal(await count(),0);await page.locator('[data-action="consolidated-cancel"]').click();assert.equal(await count(),0);
  await select(file());await page.locator('[data-action="consolidated-confirm"]').click();await page.waitForFunction(()=>Object.keys(DED_CONSOLIDATED_UI.getStore().active).length===1);
  await select(file());await page.locator('[data-action="consolidated-confirm"]').click();assert.equal(await count(),1);
  await select(file(1,'101','7'));await page.locator('[data-action="consolidated-confirm"]').click();await page.waitForFunction(()=>DED_CONSOLIDATED_UI.getStore().history.length===1);
  await select([file(2),file(3),file(1,'102')]);await page.locator('[data-action="consolidated-confirm"]').click();await page.waitForFunction(()=>Object.keys(DED_CONSOLIDATED_UI.getStore().active).length===4);
  await page.locator('#consolidated-select').selectOption('999999|2026|101|1');assert((await page.locator('#view').innerText()).includes('1 nota(s) ausente(s)'));
  const raw=await page.evaluate(()=>window.DED.getData());assert.equal(raw.raw.length,0);assert.equal(raw.raw_t1.length,0);
  const before=await page.evaluate(()=>DED_CONSOLIDATED_UI.getStore());await page.reload();await page.waitForSelector('#class-consolidated-files');assert.deepEqual(await page.evaluate(()=>DED_CONSOLIDATED_UI.getStore()),before);
  const wait=page.waitForEvent('download');await page.locator('[data-action="consolidated-backup"]').click();const download=await wait;const p=await download.path();const bytes=fs.readFileSync(p);
  await page.locator('#consolidated-backup-file').setInputFiles({name:'qa-restore.json',mimeType:'application/json',buffer:bytes});await page.locator('[data-action="consolidated-restore-local"]').waitFor();await page.locator('[data-action="consolidated-restore-local"]').click();await page.waitForFunction(()=>DED_CONSOLIDATED_UI.getStore().revision===4);assert.equal(await count(),4);
  await page.locator('#class-consolidated-files').setInputFiles({name:'corrupt.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('not xlsx')});await page.waitForFunction(()=>document.querySelector('[role="status"]').textContent.includes('corrompido'));assert.equal(await count(),4);
  await page.setViewportSize({width:390,height:844});assert(await page.locator('#class-consolidated-files').isVisible());assert.equal(await page.locator('#filter-panel').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('PASS: navegador, cancelamento, uma/múltiplas turmas T1/T2/T3, repetição, substituição, persistência, backup/restauração, arquivo corrompido, 390px e separação de aulas.');
  // Pacote institucional: não aceita ajuste local de carga ou matriz.
  const {env,resetEmail}=require('./apps-script-consolidated');resetEmail();
  const institution=await browser.newContext();await institution.exposeFunction('__qaGas',(method,arg)=>JSON.parse(JSON.stringify(env[method](arg))));
  await institution.addInitScript(()=>{window.DED_INSTITUTIONAL_MODE=true;window.google={script:{get run(){let success,failure;const p=new Proxy({}, {get(t,k){if(k==='withSuccessHandler')return fn=>{success=fn;return p;};if(k==='withFailureHandler')return fn=>{failure=fn;return p;};return arg=>window.__qaGas(k,arg).then(success,failure);}});return p;}}};});
  const p2=await institution.newPage();const errs=[];p2.on('pageerror',e=>errs.push(e.message));await p2.goto('http://127.0.0.1:'+server.address().port+'/#classReports');await p2.waitForFunction(()=>window.DED_CONSOLIDATED_UI);
  const official=await p2.evaluate(()=>DED_CONSOLIDATED_UI.official({year:2026,class:{name:'3º EM REG 1',shift:'NOITE'}},'LINGUA PORTUGUESA'));assert.equal(official.weekly,4);
  const protectedPlan=await p2.evaluate(()=>{DATA.raw=[{id:'synthetic-only',cod_turma:'555',shortClass:'3º EM REG 1',turma:'3º EM REG 1',turno:'NOITE',componente:'LINGUA PORTUGUESA',professor:'DOCENTE FICTICIO',total:'10',notas:'0 / 30',status:'ABERTO'}];cfg.weekly['EM_REG_3|LINGUA PORTUGUESA']=99;cfg.expected['synthetic-only']={value:999,source:'Não oficial'};cfg.regularMatrixByClass['555']='EM_REG_D_3';reclassifyRowsForCurrentConfig();state.trimester='2';RAW=getActiveRaw();return modelRows()[0];});
  assert.equal(protectedPlan.bucket,'EM_REG_3');assert.equal(protectedPlan.plan.weekly,4);assert.notEqual(protectedPlan.plan.value,999);
  await p2.locator('#class-consolidated-files').setInputFiles(file(3,'104'));await p2.locator('[data-action="consolidated-confirm"]').waitFor();await p2.locator('[data-action="consolidated-confirm"]').click();await p2.waitForFunction(()=>document.querySelector('[role="status"]').textContent.includes('concluída'));
  assert.equal(env.dedListConsolidated().items.length,2);await p2.reload();await p2.waitForFunction(()=>document.querySelector('#consolidated-select')?.options.length===3);assert.deepEqual(errs,[]);await institution.close();
  console.log('PASS: ponte google.script.run integrada ao servidor emulado e reabertura institucional, sem conexões externas.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
