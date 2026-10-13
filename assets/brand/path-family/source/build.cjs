// Run from the repository: node assets/brand/path-family/source/build.cjs
// PNG export uses the repository's existing @playwright/test, without new dependencies.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const root = path.resolve(__dirname, '..');
const model = require('./marks.json');
const svg = (body, size = 64, label = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"${label ? ` role="img" aria-label="${label}"` : ''}>${body}</svg>\n`;
function rgb([L,C,H]) {
  const a=C*Math.cos(H*Math.PI/180), b=C*Math.sin(H*Math.PI/180);
  const l=(L+0.3963377774*a+0.2158037573*b)**3;
  const m=(L-0.1055613458*a-0.0638541728*b)**3;
  const s=(L-0.0894841775*a-1.291485548*b)**3;
  const channels=[4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.707614701*s];
  if(channels.some(v=>v<0 || v>1)) throw Error(`Out of sRGB gamut: ${[L,C,H]}`);
  return '#'+channels.map(v=>Math.round(255*(v<=0.0031308?12.92*v:1.055*v**(1/2.4)-0.055)).toString(16).padStart(2,'0')).join('');
}
const products=model.products.map(p=>({...p,hex:rgb(p.color),darkHex:rgb(p.darkColor)}));
const mark=(p, color)=>`<g fill="${color}" transform="${p.transform}">${p.paths.map(attrs=>`<path ${Object.entries(attrs).map(([k,v])=>`${k}="${v}"`).join(' ')}/>`).join('')}</g>`;
const app=(p)=>`<rect x="0" y="0" width="64" height="64" rx="14" fill="${p.hex}"/><g transform="translate(8 8) scale(.75)">${mark(p,'#fff')}</g>`;
const write=(file,value)=>fs.writeFileSync(path.join(root,file),value);
for(const p of products){
  fs.mkdirSync(path.join(root,p.id),{recursive:true});
  for(const [variant,color] of Object.entries({'logo':p.hex,'logo-dark':p.darkHex,'logo-black':'#000000','logo-white':'#ffffff','logo-current':'currentColor'}))
    write(`${p.id}/${variant}.svg`,svg(mark(p,color),64,`${p.name} 标识`));
  write(`${p.id}/app-icon.svg`,svg(app(p),64,`${p.name} 应用图标`));
  // The approved silhouette is retained; small-size acceptance is recorded separately.
  write(`${p.id}/favicon.svg`,svg(`<style>:root{color:${p.hex}}@media(prefers-color-scheme:dark){:root{color:${p.darkHex}}}</style>${mark(p,'currentColor')}`,32));
}
write('palette.json',JSON.stringify(Object.fromEntries(products.map(p=>[p.id,{light:{oklch:p.color,srgb:p.hex},dark:{oklch:p.darkColor,srgb:p.darkHex}}])),null,2)+'\n');

const ink='#242424',muted='#666666',line='#e5e5e5',paper='#fafaf9';
const text=(x,y,value,size=16,fill=ink,weight=400)=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}">${value}</text>`;
const placed=(p,x,y,size,color)=>`<g transform="translate(${x} ${y}) scale(${size/64})">${mark(p,color)}</g>`;
let board=`<rect width="1600" height="1120" fill="${paper}"/>`;
board+=text(80,70,'CQU MOE  /  VISUAL IDENTITY',15,muted,600);
board+=text(80,146,'通路',64,ink,600)+text(252,143,'Path',56,ink,500);
board+=text(80,193,'已确认概念稿 · SVG 矢量复刻',20,muted);
board+=text(1280,70,'01 — LOGO FAMILY',13,muted,500);
board+=`<path d="M80 230H1520" stroke="${line}"/>`;
products.forEach((p,i)=>{
 const x=80+i*500;
 board+=text(x,270,`0${i+1} / ${p.id.toUpperCase()}`,13,muted,500);
 board+=placed(p,x+113,310,208,p.hex);
 board+=text(x,571,p.name,34,ink,600)+text(x,605,p.caption,17,muted);
 board+=`<rect x="${x}" y="638" width="18" height="18" rx="4" fill="${p.hex}"/>`+text(x+30,652,p.hex.toUpperCase(),13,muted,500);
 board+=`<rect x="${x}" y="694" width="210" height="116" rx="12" fill="#fff" stroke="${line}"/>`;
 board+=placed(p,x+69,716,72,'#000');
 board+=`<rect x="${x+226}" y="694" width="210" height="116" rx="12" fill="#242424"/>`;
 board+=placed(p,x+295,716,72,'#fff');
 board+=text(x,849,'小尺寸 / 原始像素',13,muted);
 let sx=x;
 [16,24,32,48].forEach(n=>{board+=placed(p,sx,890-n/2,n,p.hex)+text(sx,940,String(n),12,muted);sx+=72;});
 board+=`<g transform="translate(${x+344} 864)">${app(p)}</g>`;
});
board+=`<path d="M80 985H1520" stroke="${line}"/>`;
board+=text(80,1029,'可编辑贝塞尔路径 · 原稿比例 · 透明背景 · 彩色与黑白版本',15,muted);
board+=text(80,1062,'网页：Schedule / Auth 黑白标识；QuickLogin 彩色标识与暖橙主题。',15,muted);
board+=text(1330,1062,'VECTOR EDITION / 01',12,muted,500);
write('overview.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1120" viewBox="0 0 1600 1120" role="img" aria-label="CQU Moe 通路 Logo 家族，Schedule、Auth、QuickLogin 三个标识与黑白及小尺寸展示"><g font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif">${board}</g></svg>`);

// A static artwork catalog; not a product UI or shared-component implementation.
// design-exception: fixed brand specimen dimensions and palette are content assets.
const tiles=products.map(p=>`<section aria-labelledby="${p.id}"><div class="specimen"><img src="${p.id}/logo.svg" alt="${p.name} 彩色标识" width="192" height="192"></div><h2 id="${p.id}">${p.name}</h2><p>${p.meaning}</p><div class="pair"><div><img src="${p.id}/logo-black.svg" alt="纯黑版" width="64" height="64"></div><div class="inverse"><img src="${p.id}/logo-white.svg" alt="纯白版" width="64" height="64"></div></div><div class="sizes">${[16,24,32,48].map(n=>`<figure><img src="${p.id}/logo.svg" alt="${n} 像素" width="${n}" height="${n}"><figcaption>${n}px</figcaption></figure>`).join('')}</div><div class="downloads"><a href="${p.id}/logo.svg" download>SVG</a><a href="${p.id}/logo-1024.png" download>PNG</a><a href="${p.id}/favicon.ico" download>ICO</a></div></section>`).join('');
write('index.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>通路 · CQU Moe Logo 家族</title><style>
:root{color-scheme:light dark;--background:oklch(.985 0 0);--surface:oklch(1 0 0);--foreground:oklch(.24 0 0);--muted-foreground:oklch(.46 0 0);--border:oklch(0 0 0 / .1);--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-6:1.5rem;--space-8:2rem;--space-12:3rem;--radius:.5rem;--text-sm:.875rem;--text-base:1rem;--text-title:1.75rem;--text-display:2.25rem}
@media(prefers-color-scheme:dark){:root{--background:oklch(.235 0 0);--surface:oklch(.265 0 0);--foreground:oklch(.93 0 0);--muted-foreground:oklch(.735 0 0);--border:oklch(.37 0 0)}}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--foreground);font:var(--text-base)/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;-webkit-font-smoothing:antialiased}main{max-width:75rem;margin:auto;padding:var(--space-12) var(--space-6)}header{padding-bottom:var(--space-8);border-bottom:1px solid var(--border)}.eyebrow{font-size:var(--text-sm);color:var(--muted-foreground);letter-spacing:.08em}h1{font-size:var(--text-display);letter-spacing:-.04em;line-height:1.2;margin:var(--space-4) 0}h2{font-size:var(--text-title);line-height:1.2;margin:var(--space-6) 0 var(--space-3)}p{color:var(--muted-foreground);max-width:65ch;margin:0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-8);padding:var(--space-8) 0}.specimen{display:grid;place-items:center;background:oklch(1 0 0);aspect-ratio:1.3;border-radius:var(--radius)}.pair{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-top:var(--space-6)}.pair>div{display:grid;place-items:center;padding:var(--space-4);background:oklch(1 0 0);border:1px solid var(--border);border-radius:var(--radius)}.pair>.inverse{background:oklch(.24 0 0)}.sizes{display:flex;justify-content:space-between;align-items:end;padding:var(--space-6) var(--space-4);background:oklch(1 0 0);color:oklch(.24 0 0);margin-top:var(--space-3);border-radius:var(--radius)}figure{margin:0;text-align:center}figcaption{font-size:var(--text-sm);margin-top:var(--space-2)}img{display:block;max-width:100%;object-fit:contain}figure img{margin:auto}.downloads{display:flex;gap:var(--space-3);margin-top:var(--space-4)}a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:var(--space-2) var(--space-3);border:1px solid var(--border);border-radius:var(--radius);color:var(--foreground);text-underline-offset:3px;touch-action:manipulation}a:focus-visible{outline:2px solid var(--foreground);outline-offset:4px}footer{padding-top:var(--space-8);border-top:1px solid var(--border)}footer p+p{margin-top:var(--space-3)}@media(max-width:50rem){.grid{grid-template-columns:1fr}.specimen{aspect-ratio:1.8}main{padding:var(--space-8) var(--space-4)}}
</style><main><header><div class="eyebrow">CQU MOE / VISUAL IDENTITY</div><h1>通路 · Path</h1><p>已确认概念稿 · SVG 矢量复刻</p></header><div class="grid">${tiles}</div><footer><p>可编辑贝塞尔路径 · 原稿比例 · 透明背景 · 彩色与黑白版本</p><p>网页：Schedule / Auth 黑白标识；QuickLogin 彩色标识与暖橙主题。<a href="README.md">使用规范</a></p></footer></main></html>`);
// end design-exception.

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1120},deviceScaleFactor:1});
  let rasterCount=0;
  await page.route('**/*',route=>route.abort());
  async function raster(source,file,width,height=width){
   await page.setViewportSize({width,height});
   await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${width}px;height:${height}px}</style>${source}`);
   await page.screenshot({path:path.join(root,file),omitBackground:true});
   rasterCount++;
  }
  for(const p of products){
   const [tw,th]=p.traceSize;
   const raw=`<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${th}" viewBox="0 0 ${tw} ${th}"><g fill="#000">${p.paths.map(attrs=>`<path ${Object.entries(attrs).map(([k,v])=>`${k}="${v}"`).join(' ')}/>`).join('')}</g></svg>`;
   await raster(raw,`source/reference/${p.id}-vector-check.png`,tw,th);
   for(const [variant,color] of Object.entries({'logo':p.hex,'logo-dark':p.darkHex,'logo-black':'#000','logo-white':'#fff'})){
    for(const size of [512,1024])await raster(svg(mark(p,color)),`${p.id}/${variant}-${size}.png`,size);
   }
   for(const size of [16,32,48,128,192,512,1024])await raster(svg(app(p)),`${p.id}/icon-${size}.png`,size);
   for(const size of [16,32,48])await raster(svg(mark(p,p.hex)),`${p.id}/favicon-${size}.png`,size);
   // PNG-compressed, three-resolution ICO; preserves the exact exported pixels.
   const frames=[16,32,48].map(size=>({size,data:fs.readFileSync(path.join(root,p.id,`favicon-${size}.png`))}));
   const header=Buffer.alloc(6+frames.length*16);
   header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
   let offset=header.length;
   frames.forEach(({size,data},i)=>{
    const at=6+i*16;header[at]=size;header[at+1]=size;
    header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);
    header.writeUInt32LE(data.length,at+8);header.writeUInt32LE(offset,at+12);
    offset+=data.length;
   });
   write(`${p.id}/favicon.ico`,Buffer.concat([header,...frames.map(f=>f.data)]));
  }
  await raster(fs.readFileSync(path.join(root,'overview.svg'),'utf8'),'overview.png',1600,1120);
  console.log(JSON.stringify({root,products:products.map(p=>({id:p.id,hex:p.hex,darkHex:p.darkHex})),rasterCount}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
