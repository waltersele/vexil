import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import vm from 'node:vm';
const root=resolve('public');let checks=0;const errors=[];
async function walk(dir){const out=[];for(const f of await readdir(dir,{withFileTypes:true})){if(f.isDirectory())out.push(...await walk(join(dir,f.name)));else if(f.name.endsWith('.html'))out.push(join(dir,f.name));}return out;}
for(const file of await walk(root)){
 // Archived visual example and legacy redirect stubs aren't generated commercial pages.
 if(file.includes('/ejemplo/')||file.includes('/interiores/')||file.includes('/lamina-solar/'))continue;
 const html=await readFile(file,'utf8');checks++;
 if((html.match(/<h1[\s>]/g)||[]).length!==1)errors.push(`${file}: expected one H1`);
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  if(match[0].includes('application/ld+json')){try{JSON.parse(match[1]);}catch(e){errors.push(`${file}: JSON-LD ${e.message}`);}}
  else try{new vm.Script(match[1]);}catch(e){errors.push(`${file}: script ${e.message}`);}
 }
 for(const [,attr,url] of html.matchAll(/\b(href|src)="([^"]+)"/g)){
  if(/^(https?:|tel:|mailto:|data:)/.test(url))continue;
  const [pathname,anchor]=url.split('#');let target=resolve(dirname(file),pathname||'index.html');
  if(pathname.endsWith('/'))target=join(target,'index.html');
  try{if((await stat(target)).isDirectory())target=join(target,'index.html');await stat(target);
   if(anchor&&target.endsWith('.html')){const t=await readFile(target,'utf8');if(!t.includes(`id="${anchor}"`))errors.push(`${file}: missing #${anchor} in ${target}`);}
  }catch{errors.push(`${file}: missing ${attr} ${url}`);}
 }
 for(const [,url] of html.matchAll(/<source[^>]*srcset="([^"]+)"/g)){try{await stat(resolve(dirname(file),url));}catch{errors.push(`${file}: missing WebP ${url}`);}}
 for(const match of html.matchAll(/<img\b[^>]*>/g)){if(!match[0].includes('alt='))errors.push(`${file}: image has no alt`);}
}
const home=await readFile(join(root,'index.html'),'utf8');
if(!home.includes('<h1>Rotulación e iluminación a medida para tu negocio</h1>'))errors.push('Home must have a descriptive H1');
if(home.includes('Creada con IA')||home.includes('creados con IA'))errors.push('Stale AI image caption');
// Exercise the built WhatsApp handler without making any network request.
const script=[...home.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
let submit;const status={textContent:''};const form={addEventListener:(type,fn)=>{if(type==='submit')submit=fn},querySelector:s=>s==='[role="status"]'?status:{}};
const fakeDocument={getElementById:()=>null,addEventListener:()=>{},querySelectorAll:s=>s==='form[data-vexil-form]'?[form]:[]};
const fakeWindow={location:{href:''}};
const entries=[['nombre','Prueba'],['localidad','El Campello'],['servicio','Necesito asesoramiento'],['mensaje','Un rótulo con letra ñ & color magenta'],['servicio_pagina','Inicio']];
vm.runInNewContext(script,{document:fakeDocument,window:fakeWindow,FormData:class{forEach(fn){entries.forEach(([k,v])=>fn(v,k))}},encodeURIComponent});
await submit({preventDefault(){}});const result=new URL(fakeWindow.location.href);
if(result.hostname!=='wa.me')errors.push('Wrong contact destination');
const message=result.searchParams.get('text');if(!message.includes('\nNombre: Prueba\nLocalidad: El Campello'))errors.push('WhatsApp should contain labelled fields on separate lines');
if(!message.includes('ñ & color'))errors.push('WhatsApp lost special characters');
if(message.includes('servicio_pagina'))errors.push('Internal field leaked into message');
if(!status.textContent.includes('pulsar enviar'))errors.push('WhatsApp instruction missing');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(`Verified ${checks} pages: internal links, anchors, images, JSON-LD, scripts and WhatsApp handler.`);
