import * as esbuild from 'esbuild';import fs from 'fs';
const r=await esbuild.build({entryPoints:['src/main.js'],bundle:true,minify:true,format:'iife',platform:'browser',loader:{'.png':'dataurl'},write:false,target:'es2020',logLevel:'warning'});
const js=r.outputFiles[0].text.replace(/<\/script>/g,'<\\/script>');
const css=fs.readFileSync('src/style.css','utf8');
let html=fs.readFileSync('src/template.html','utf8');
html=html.replace('/*CSS*/',()=>css).replace('/*JS*/',()=>js);
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/index.html',html);
console.log('size',(html.length/1024/1024).toFixed(2),'MB');
