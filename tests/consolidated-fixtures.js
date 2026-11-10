'use strict';
// Dados exclusivamente sintéticos; nenhuma matrícula/nome de escola real.
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function matrix(term=1,classCode='101',grade='0'){
 return [['ESCOLA: 999999 - ESCOLA SINTETICA'],[`TURMA: 3º EM REG 1 (2026) - ${classCode} - NOITE - ENDERECO FICTICIO`],['DATA E HORA DA EXTRAÇÃO: 02/09/2026 08:43'],[`DIVISÃO: ${term}º TRIMESTRE`],['ALUNO','LÍNGUA PORTUGUESA','','FÍSICA',''],['',`${term}º TRIMESTRE`,'FALTAS',`${term}º TRIMESTRE`,'FALTAS'],['ESTUDANTE FICTICIO A',grade,'0','','2'],['ESTUDANTE FICTICIO B','18','3','12','']];
}
const source=(suffix='a')=>({fileName:'qa-'+suffix+'.xlsx',sha256:suffix.repeat(64),sheet:'Turma'});
// ZIP stored válido, sem biblioteca externa, para exercitar o leitor XLSX real.
function zip(entries){
 const crc=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 const files=[],central=[];let offset=0;
 for(const [name,body] of Object.entries(entries)){const n=Buffer.from(name),b=Buffer.from(body),c=crc(b),h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt32LE(c,14);h.writeUInt32LE(b.length,18);h.writeUInt32LE(b.length,22);h.writeUInt16LE(n.length,26);files.push(h,n,b);
 const d=Buffer.alloc(46);d.writeUInt32LE(0x02014b50);d.writeUInt16LE(20,4);d.writeUInt16LE(20,6);d.writeUInt32LE(c,16);d.writeUInt32LE(b.length,20);d.writeUInt32LE(b.length,24);d.writeUInt16LE(n.length,28);d.writeUInt32LE(offset,42);central.push(d,n);offset+=30+n.length+b.length;}
 const dir=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(entries).length,8);end.writeUInt16LE(Object.keys(entries).length,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...files,dir,end]);
}
function xlsx(m){const col=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;};return zip({'[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>','xl/workbook.xml':'<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Turma" sheetId="1" r:id="rId1"/></sheets></workbook>','xl/_rels/workbook.xml.rels':'<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>','xl/worksheets/sheet1.xml':'<worksheet><sheetData>'+m.map((r,i)=>`<row r="${i+1}">`+r.map((v,j)=>`<c r="${col(j)}${i+1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`).join('')+'</row>').join('')+'</sheetData></worksheet>'});}
module.exports={matrix,source,xlsx};
