'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcHtmlPath = path.join(root, 'src', 'index.html');
let html = fs.readFileSync(srcHtmlPath, 'utf8');

// Replace CSS links with inline <style>
html = html.replace(/<link href="css\/(\d{2})\.css" rel="stylesheet"\/>/g, (match, num) => {
  const cssPath = path.join(root, 'src', 'css', `${num}.css`);
  const css = fs.readFileSync(cssPath, 'utf8');
  return `<style>\n/* css/${num}.css */\n${css}\n</style>`;
});

// Replace JS script tags with inline <script>
html = html.replace(/<script src="js\/(\d{2})\.js"><\/script>/g, (match, num) => {
  const jsPath = path.join(root, 'src', 'js', `${num}.js`);
  const js = fs.readFileSync(jsPath, 'utf8');
  return `<script>\n/* js/${num}.js */\n${js}\n</script>`;
});

const distDir = path.join(root, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

const distPath = path.join(distDir, 'DED_em_Foco_MultiEscola_2026.html');
fs.writeFileSync(distPath, html, 'utf8');
console.log(`Standalone HTML gerado com sucesso: ${distPath} (${fs.statSync(distPath).size} bytes)`);
