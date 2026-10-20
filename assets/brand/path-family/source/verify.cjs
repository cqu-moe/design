// Asset and static-catalog acceptance. No product code or production API involved.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const http=require('node:http');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..');
const palette=require('../palette.json');
const themeCss=fs.readFileSync(path.resolve(__dirname,'../../../../packages/theme/src/tokens.css'),'utf8');
function luminance(hex){
 const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function contrast(a,b){const [lo,hi]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (hi+.05)/(lo+.05)}
(async()=>{
 fs.mkdirSync(path.join(root,'qa'),{recursive:true});
 const report={viewports:[],downloads:[],renderedColors:[],contrast:{},warnings:[],scope:'Generated brand assets against shared theme, plus artwork catalog; no consumer deployment'};
 for(const [id,p] of Object.entries(palette)){
  const light=contrast(p.light.srgb,'#ffffff'),dark=contrast(p.dark.srgb,'#242424');
  assert(light>=3 && dark>=3); // Non-text brand symbols; catalog body text is neutral.
  report.contrast[id]={lightOnWhite:+light.toFixed(2),darkOnGraphite:+dark.toFixed(2)};
  for(const size of [16,32,48,128,192,512,1024]){
   const b=fs.readFileSync(path.join(root,id,`icon-${size}.png`));
   assert.equal(b.readUInt32BE(16),size);assert.equal(b.readUInt32BE(20),size);
  }
  const ico=fs.readFileSync(path.join(root,id,'favicon.ico'));
  assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
  [16,32,48].forEach((size,i)=>{
   const at=6+i*16;assert.equal(ico[at],size);assert.equal(ico[at+1],size);
   const offset=ico.readUInt32LE(at+12),length=ico.readUInt32LE(at+8);
   assert.deepEqual(ico.subarray(offset,offset+length),fs.readFileSync(path.join(root,id,`favicon-${size}.png`)));
  });
 }
 const server=http.createServer((req,res)=>{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  const types={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.md':'text/plain; charset=utf-8'};
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({deviceScaleFactor:1});
  page.on('pageerror',error=>report.warnings.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')report.warnings.push(msg.text())});
  await page.route(/^https?:/,route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.warnings.push(`Unexpected network request: ${route.request().url()}`);return route.abort()});
  await page.goto(origin);
  for(const scheme of ['light','dark']){
   await page.emulateMedia({colorScheme:scheme});
   await page.setContent(`<base href="${origin}/"><style>${themeCss}</style>`);
   const colors=await page.evaluate(async({ids,scheme})=>{
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    const css=getComputedStyle(document.documentElement);
    function color(token){
     canvas.width=canvas.height=1;
     ctx.fillStyle=css.getPropertyValue(token);ctx.fillRect(0,0,1,1);
     return [...ctx.getImageData(0,0,1,1).data].slice(0,3);
    }
    const ink=color('--brand-ink'),results=[];
    // Fixed PNG app icons use the light solid role on either toolbar theme.
    document.documentElement.dataset.theme='light';
    const solid=color('--brand-solid');
    delete document.documentElement.dataset.theme;
    for(const id of ids)for(const [file,expected] of [
     [scheme==='dark'?'logo-dark.svg':'logo.svg',ink],
     [scheme==='dark'?'logo-dark-512.png':'logo-512.png',ink],
     ['favicon.svg',ink],['icon-16.png',solid],['icon-128.png',solid],
    ]){
     const image=new Image();image.src=`${id}/${file}`;await image.decode();
     canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
     ctx.drawImage(image,0,0);
     const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
     let brandPixels=0,nonOpaquePixels=0;
     for(let i=0;i<pixels.length;i+=4){
      if(pixels[i+3]<255)nonOpaquePixels++;
      if(pixels[i+3]===255&&expected.every((channel,j)=>Math.abs(channel-pixels[i+j])<=1))brandPixels++;
     }
     results.push({id,file,brandPixels,nonOpaquePixels});
    }
    return results;
   },{ids:Object.keys(palette),scheme});
   for(const sample of colors){
    assert(sample.brandPixels>0,`${scheme} ${sample.id}/${sample.file} does not render shared blue`);
    assert(sample.nonOpaquePixels>0,`${sample.id}/${sample.file} lost alpha edges`);
   }
   report.renderedColors.push({scheme,samples:colors});
  }
  for(const scheme of ['light','dark'])for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:960});await page.emulateMedia({colorScheme:scheme,reducedMotion:'reduce'});
   await page.goto(origin);
   const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),targets:[...document.querySelectorAll('a')].every(a=>{const r=a.getBoundingClientRect();return r.width>=44&&r.height>=44})}));
   assert.deepEqual(result,{overflow:false,images:true,targets:true});
   report.viewports.push({width,scheme,...result});
   await page.screenshot({path:path.join(root,'qa',`catalog-${width}-${scheme}.png`),fullPage:true});
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('href'),'schedule/logo.svg');
  assert.equal(await page.locator(':focus').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  for(const id of Object.keys(palette))for(const file of ['logo.svg','logo-1024.png','favicon.ico']){
   // Chromium limits repeated automatic downloads in the same document.
   await page.reload();
   console.log(`Checking download: ${id}/${file}`);
   const event=page.waitForEvent('download');
   await page.locator(`a[href="${id}/${file}"]`).click();
   const download=await event;assert.equal(await download.failure(),null);assert.equal(download.suggestedFilename(),file);
   report.downloads.push(`${id}/${file}`);
  }
  assert.deepEqual(report.warnings,[]);
  fs.writeFileSync(path.join(root,'qa/report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
