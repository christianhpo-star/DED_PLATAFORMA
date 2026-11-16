'use strict';
// Regressao PDF com dados sinteticos: nenhuma informacao escolar real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright-core');

function pdfPages(pdf) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ded-print-'));
  const file=path.join(dir,'qa.pdf');
  try {
    fs.writeFileSync(file,pdf);
    const info=execFileSync('pdfinfo',[file],{encoding:'utf8'});
    const count=Number(info.match(/^Pages:\s*(\d+)/m)?.[1]);
    assert(count>=1&&count<=30,'Contagem PDF invalida');
    return Array.from({length:count},(_,i)=>execFileSync('pdftotext',['-f',String(i+1),'-l',String(i+1),'-layout',file,'-'],{encoding:'utf8'}).replace(/\f/g,'').trim());
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
}

async function main(){
  const root=path.resolve(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'dist/DED_em_Foco_MultiEscola_2026.html'),'utf8');
  const executablePath=[process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(fs.existsSync);
  assert(executablePath,'Chromium nao localizado');
  const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:1366,height:850}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.waitForFunction(()=>typeof weeklyPrintArea==='function'&&!!window.DED);
    await page.evaluate(()=>{
      const row=i=>({shortClass:'QA TURMA '+String(i+1).padStart(2,'0'),componente:'LINGUA PORTUGUESA',expected:5,minimum:4,delta:2,ratio:40,missingToMinimum:2});
      const teacher=(name,n)=>({name,below:Array.from({length:n},(_,i)=>row(i)),assessed:Array.from({length:n},(_,i)=>row(i)),unassessed:[],compliant:false});
      const groups=[teacher('DOCENTE QA ALFA',3),teacher('DOCENTE QA BETA',12)];
      state.weeklyPrintMode='teachers';state.weeklyPrintTeachers=new Set(groups.map(g=>g.name));
      document.getElementById('view').innerHTML=weeklyPrintArea(groups,{date:'2026-10-02',intervalDays:5},null);
      document.body.classList.add('weekly-printing');
    });
    await page.emulateMedia({media:'print'});
    const weekly=pdfPages(await page.pdf({preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false}));
    assert(weekly.length>=2,'Duas folhas docentes devem ser impressas separadamente');
    // title() normaliza capitalizacao dos nomes exibidos no relatorio.
    const names=weekly.map(x=>x.toLocaleLowerCase('pt-BR').replace(/\s+/g,' '));
    const a=names.findIndex(x=>x.includes('docente qa alfa')),
          b=names.findIndex(x=>x.includes('docente qa beta'));
    assert(a>=0&&b>a,'Cada professor deve iniciar em folha posterior, sem sobreposicao');
    for(const [i,text] of weekly.entries()){
      assert(text.split('\n').filter(x=>x.trim()).length>=5,'Pagina semanal quase vazia: '+(i+1));
      assert(!/^\s*(?:Ci[eê]ncia do|EEB|Desenvolvido)/i.test(text),'Pagina semanal com apenas assinaturas/rodape: '+(i+1));
    }
    console.log('PASS: PDF semanal com '+weekly.length+' pagina(s), separacao de docentes e nenhuma pagina quase vazia.');

    await page.evaluate(()=>{
      document.body.classList.remove('weekly-printing');
      state.weeklyPrintMode='';
      document.getElementById('view').innerHTML='<section style="height:148mm;border:1px solid #ddd;box-sizing:border-box"><h2>CONTEUDO QA IMPRESSAO</h2><p>Painel sintetico de teste de paginacao; nenhuma informacao escolar.</p></section>';
    });
    const common=pdfPages(await page.pdf({preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false}));
    assert(common[0].includes('CONTEUDO QA IMPRESSAO'),'Conteudo de teste nao saiu na primeira pagina');
    assert(common.join(' ').includes('Desenvolvido por Christian Oliveira'),'Credito institucional nao deve desaparecer');
    for(const [i,text] of common.entries()){
      const lines=text.split('\n').map(s=>s.trim()).filter(Boolean);
      assert(lines.length>=5,'Pagina '+(i+1)+' com apenas rodape ou vazio ('+lines.length+' linha(s))');
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: PDF da visao normal com '+common.length+' pagina(s), credito preservado e sem folha de rodape isolada.');
  } finally {await browser?.close();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
