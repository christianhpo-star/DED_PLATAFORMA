'use strict';
// QA de navegador com dados sintéticos: nenhuma informação escolar é versionada.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');

const htmlPath=path.join(__dirname,'..','dist','DED_em_Foco_MultiEscola_2026.html');
const original=fs.readFileSync(htmlPath,'utf8');
function syntheticRow(cod_turma,shortClass,turno,suffix){
 return {
  id:'qa'+suffix, professor:'DOCENTE FICTICIO', componente:'LINGUA PORTUGUESA',
  cod_turma, turma:shortClass,shortClass,turno,ano:'2026',
  divisao:'2',total:'18',notas:'10',status:'ABERTO',
  fev:'-',mar:'-',abr:'-',mai:'-',jun:'-',jul:'-',ago:'-',set:'-',out:'-',nov:'-',dez:'-'
 };
}
function inject(scriptId,modify){
 const rx=new RegExp('(<script id="'+scriptId+'" type="application/json">)([\\s\\S]*?)(</script>)');
 const match=original.match(rx);
 assert(match,'Script JSON não encontrado: '+scriptId);
 return [rx,match,JSON.stringify(modify(JSON.parse(match[2]))).replace(/</g,'\\u003c')];
}
const regDay=syntheticRow('1001','1º EM REG 1','MANHÃ','001');
const regNight=syntheticRow('1002','1º EM REG 2','NOITE','002');
const fundamental=syntheticRow('2001','7º EF AF REG 1','TARDE','003');
const sourceInject=inject('source-data',data=>{
 data.raw=[regDay,regNight,fundamental];
 data.raw_t1=[];
 data.raw_t3=[];
 return data;
});
const weeklyInject=inject('embedded-data-store',store=>{
 store.t1=null;store.t2=null;
 store.weeklySnapshots=[
  {date:'2026-09-18',intervalDays:0,daysToDate:0,fileName:'qa-semana-1.xlsx',importedAt:1,rows:[{...regDay,id:'w001'}]},
  {date:'2026-09-25',intervalDays:0,daysToDate:0,fileName:'qa-semana-2.xlsx',importedAt:2,rows:[{...regDay,id:'w002'}]}
 ];
 return store;
});
const html=original.replace(sourceInject[0],()=>sourceInject[1][1]+sourceInject[2]+sourceInject[1][3])
 .replace(weeklyInject[0],()=>weeklyInject[1][1]+weeklyInject[2]+weeklyInject[1][3]);

async function main(){
 const candidates=[process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
  '/usr/bin/chromium','/usr/bin/chromium-browser','/opt/google/chrome/chrome'].filter(Boolean);
 const executablePath=candidates.find(p=>fs.existsSync(p));
 assert(executablePath,'Chromium/Chrome não disponível no executor de QA.');
 const server=http.createServer((req,res)=>{
  if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end(html);
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 let browser,page;
 try{
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  page=await browser.newPage({viewport:{width:1366,height:850}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const url='http://127.0.0.1:'+server.address().port+'/';
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(window.DED));
  await page.locator('#navigation [data-page="settings"]').click();
  const morning=page.locator('select[data-regular-matrix="1001"]');
  const night=page.locator('select[data-regular-matrix="1002"]');
  await morning.waitFor();
  assert.equal(await morning.inputValue(),'EM_REG_D_1','REG manhã deve iniciar com matriz diurna.');
  assert.equal(await night.inputValue(),'EM_REG_1','REG noite deve iniciar com matriz noturna.');
  assert.equal(await page.locator('select[data-regular-matrix="2001"]').count(),0,'Fundamental não pode receber seletor EM.');
  console.log('PASS: classificação REG diurna/noturna, seletor de turma e exclusão do Fundamental.');

  await morning.selectOption('EM_REG_1');
  assert(await page.locator('#confirm-dialog').evaluate(d=>d.open),'Mudança de matriz deve abrir confirmação.');
  assert.equal(await page.evaluate(()=>window.DED.getConfig().regularMatrixByClass['1001']),undefined,
   'Alteração não pode ser persistida antes da confirmação.');
  await page.locator('#confirm-dialog [data-action="cancel-audit-dialog"]').last().click();
  assert.equal(await page.locator('select[data-regular-matrix="1001"]').inputValue(),'EM_REG_D_1',
   'Cancelar deve restaurar visualmente a opção original.');
  assert.equal(await page.evaluate(()=>window.DED.getConfig().regularMatrixByClass['1001']),undefined);
  await page.locator('select[data-regular-matrix="1001"]').selectOption('EM_REG_1');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.getElementById('confirm-dialog').open && document.querySelector('select[data-regular-matrix="1001"]')?.value==='EM_REG_D_1');
  assert.equal(await page.locator('select[data-regular-matrix="1001"]').inputValue(),'EM_REG_D_1',
   'Tecla Escape deve restaurar seleção original.');
  console.log('PASS: não mutação antes da confirmação, cancelamento e tecla Escape.');

  await page.locator('select[data-regular-matrix="1001"]').selectOption('EM_REG_1');
  await page.locator('#regular-matrix-reason').fill('Homologação com turma fictícia');
  await page.locator('#regular-matrix-source').fill('Referência sintética de QA');
  await page.locator('#regular-matrix-audit-form button[type="submit"]').click();
  const applied=await page.evaluate(()=>{
   const cfg=window.DED.getConfig();
   return {selected:cfg.regularMatrixByClass['1001'],
    audit:cfg.auditTrail.filter(e=>e.type==='regular_matrix_override'&&e.target==='1001'),
    current:window.DED.getData().raw.find(r=>String(r.cod_turma)==='1001')?.bucket};
  });
  assert.equal(applied.selected,'EM_REG_1');
  assert.equal(applied.current,'EM_REG_1');
  assert.equal(applied.audit.length,1);
  assert.equal(applied.audit[0].source,'Referência sintética de QA');
  assert.equal(applied.audit[0].reason,'Homologação com turma fictícia');
  console.log('PASS: confirmação, recálculo local e histórico com fonte e justificativa.');

  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(window.DED));
  const persisted=await page.evaluate(()=>({
   cfg:window.DED.getConfig().regularMatrixByClass['1001'],
   historical:dataStore.weeklySnapshots.map(s=>s.rows.find(r=>String(r.cod_turma)==='1001')?.bucket)
  }));
  assert.equal(persisted.cfg,'EM_REG_1');
  assert.deepEqual(persisted.historical,['EM_REG_1','EM_REG_1'],
   'Todas as semanas históricas devem respeitar a matriz ao recarregar.');
  console.log('PASS: persistência após recarregar e coerência de duas semanas históricas.');

  await page.evaluate(()=>resetCalculationReferencesAudited());
  const reset=await page.evaluate(()=>({
   cfg:window.DED.getConfig().regularMatrixByClass['1001'],
   current:window.DED.getData().raw.find(r=>String(r.cod_turma)==='1001')?.bucket,
   historical:dataStore.weeklySnapshots.map(s=>s.rows.find(r=>String(r.cod_turma)==='1001')?.bucket),
   trail:window.DED.getConfig().auditTrail.filter(e=>e.type==='regular_matrix_restore'&&e.target==='1001')
  }));
  assert.equal(reset.cfg,undefined);
  assert.equal(reset.current,'EM_REG_D_1');
  assert.deepEqual(reset.historical,['EM_REG_D_1','EM_REG_D_1']);
  assert.equal(reset.trail.length,1);
  console.log('PASS: restauração auditada, matriz original e histórico de semanas.');

  await page.setViewportSize({width:390,height:844});
  await page.locator('select[data-regular-matrix="1001"]').scrollIntoViewIfNeeded();
  assert(await page.locator('select[data-regular-matrix="1001"]').isVisible(),
   'Seletor deve permanecer acessível no mobile.');
  assert.equal(errors.length,0,'Erros JavaScript durante QA: '+errors.join('; '));
  console.log('PASS: seletor acessível em 390px e nenhum erro JavaScript.');
 }catch(err){
  if(page){fs.mkdirSync(path.join(__dirname,'..','qa-artifacts'),{recursive:true});
   await page.screenshot({path:path.join(__dirname,'..','qa-artifacts','reg-matrix-failure.png'),fullPage:false}).catch(()=>{});}
  throw err;
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
main().catch(e=>{console.error('FAIL: '+(e.stack||String(e)));process.exitCode=1;});
