'use strict';
// Empacota a mesma interface, sem dados reais ou dependência de clasp/Drive API.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
require('./build.js');
const html=fs.readFileSync(path.join(root,'dist/DED_em_Foco_MultiEscola_2026.html'),'utf8');
fs.writeFileSync(path.join(root,'apps-script/Index.html'),html.replace('<head>','<head><script>window.DED_INSTITUTIONAL_MODE=true;</script>'));
fs.copyFileSync(path.join(root,'src/js/22.js'),path.join(root,'apps-script/ConsolidatedCore.gs'));
console.log('Pacote Apps Script atualizado (Index e contrato compartilhado).');
