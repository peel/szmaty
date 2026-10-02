const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 assert(fs.existsSync(path.join(root,'manifest.webmanifest')),'Provide a web app manifest for installation');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.id,'./');
 for(const size of [192,512])assert(manifest.icons.some(i=>i.sizes===`${size}x${size}`&&i.purpose==='any'));
 assert(manifest.icons.some(i=>i.purpose==='maskable'));
 let revision='one';
 const server=http.createServer((req,res)=>{
  let name=new URL(req.url,'http://localhost').pathname;if(name==='/')name='/index.html';
  const file=path.join(root,name);if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404).end();return;}
  const types={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');
  const bytes=fs.readFileSync(file);res.end(name==='/index.html'?bytes.toString().replace('</head>',`<meta name="test-revision" content="${revision}"></head>`):bytes);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const local=`http://127.0.0.1:${server.address().port}`,url=process.env.MAP_URL||local;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'szmaty-pwa-test-'));let context;
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  context=await chromium.launchPersistentContext(profile,{headless:true,channel:'chrome'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route(/https:\/\/(tile\.openstreetmap\.org|routing\.openstreetmap\.de)\//,r=>r.abort());
  await context.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(_,failure){failure({code:1})}}}));
  await page.goto(url);await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>navigator.serviceWorker.controller);
  assert(await page.locator('#install-app').isVisible());
  const cdp=await context.newCDPSession(page);
  const appManifest=await cdp.send('Page.getAppManifest');assert.equal(appManifest.errors.length,0);assert(appManifest.data.includes('Gdzie wyrzucić'));
  const installability=await cdp.send('Page.getInstallabilityErrors');assert.deepEqual(installability.installabilityErrors,[],'Chrome reports an installable app');
  const cacheURLs=await page.evaluate(async()=>{const names=await caches.keys();return(await Promise.all(names.map(async n=>(await(await caches.open(n)).keys()).map(r=>r.url)))).flat()});
  assert(cacheURLs.some(u=>u.endsWith('/index.html')));assert(cacheURLs.every(u=>new URL(u).origin===locationOrigin(url)));
  await page.evaluate(()=>{window.installCalls=0;const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{window.installCalls++};e.userChoice=Promise.resolve({outcome:'dismissed'});dispatchEvent(e)});
  await page.locator('#install-app').click();assert.equal(await page.evaluate(()=>window.installCalls),1);
  await page.locator('#install-app').click();assert(await page.locator('#modal').isVisible());await page.locator('#modal-close').click();
  await page.evaluate(()=>dispatchEvent(new Event('appinstalled')));assert(await page.locator('#install-app').isHidden());
  if(!process.env.MAP_URL){
   revision='two';await page.reload();assert.equal(await page.locator('meta[name="test-revision"]').getAttribute('content'),'two','Online navigation retrieves the new app');
   await context.setOffline(true);await cdp.send('Network.overrideNetworkState',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await page.reload();
   assert.equal(await page.locator('meta[name="test-revision"]').getAttribute('content'),'two','Offline launch uses the last successful app version');
   await page.waitForFunction(()=>document.querySelector('#offline-notice')&&!document.querySelector('#offline-notice').hidden);
   assert(await page.locator('#offline-notice').isVisible());
   await page.locator('#search').fill('Warszawska');assert(await page.locator('#results [data-id]').count()>0,'Embedded points remain searchable offline');
   await context.setOffline(false);await cdp.send('Network.overrideNetworkState',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await page.waitForFunction(()=>document.querySelector('#offline-notice').hidden);
  }
  await page.setViewportSize({width:320,height:700});await page.locator('#menu').click();
  await page.waitForFunction(()=>Math.abs(document.querySelector('.sidebar').getBoundingClientRect().x)<1);
  if(process.env.SCREENSHOT)await page.screenshot({path:process.env.SCREENSHOT});
  assert(await page.locator('.sidebar').evaluate(e=>e.scrollWidth<=e.clientWidth));
  assert.deepEqual(errors,[]);await context.close();
  const standalone=await browser.newContext();await standalone.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));await standalone.route(/https:\/\/tile\.openstreetmap\.org\//,r=>r.abort());const installed=await standalone.newPage();await installed.goto(url);assert(await installed.locator('#install-app').isHidden(),'Hide installation in an installed app');await standalone.close();
  const ios=await browser.newContext({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  await ios.route(/https:\/\/tile\.openstreetmap\.org\//,r=>r.abort());
  const phone=await ios.newPage();await phone.goto(url);await phone.locator('#menu').click();await phone.locator('#install-app').click();assert.match(await phone.locator('#modal').innerText(),/Udostępnij[\s\S]*ekranu/);await ios.close();
  console.log('PASS: manifest, service worker, same-origin-only cache, install actions, iPhone help, mobile layout, updates and offline searchable points');
 }finally{await context?.close();await browser.close();await new Promise(r=>server.close(r));fs.rmSync(profile,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exit(1)});
function locationOrigin(url){return new URL(url).origin}
