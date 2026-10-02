const selectFraction=require('./select-fraction.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'panoramax_punkty.json')));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.deepEqual(JSON.parse(html.match(/<script id="panoramax-data" type="application\/json">([\s\S]*?)<\/script>/)[1]),data);
assert.equal(Object.keys(data.points).length,999);
const matches=Object.entries(data.points).filter(([,v])=>v);
assert(matches.length>0);
const textiles=JSON.parse(fs.readFileSync(path.join(root,'pomorskie_punkty.json'))).coordinates;
const electronics=JSON.parse(fs.readFileSync(path.join(root,'elektroodpady_punkty.json'))).points;
for(const [key,photo] of matches){
 const [fraction,id]=key.split(':');
 const geo=fraction==='textiles'?textiles[id]:electronics.find(p=>String(p.id)===id).geo;
 const rad=x=>x*Math.PI/180,[lon,lat]=photo.coordinates;
 const distance=6371000*2*Math.asin(Math.sqrt(Math.sin(rad(lat-geo.lat)/2)**2+Math.cos(rad(lat))*Math.cos(rad(geo.lat))*Math.sin(rad(lon-geo.lon)/2)**2));
 assert(distance<=100);assert(Math.abs(photo.distance-distance)<=.051);
 assert(photo.author&&photo.license&&photo.licenseUrl.startsWith('https://'));
 assert.match(photo.id,/^[a-f0-9-]{36}$/);assert.match(photo.sequence,/^[a-f0-9-]{36}$/);
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push(r.url()));
  await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{value:undefined}));
  await page.route('https://tile.openstreetmap.org/**',r=>r.abort());
  let mode='success';
  if(!process.env.PANORAMAX_LIVE)await page.route('**/sd.jpg',r=>mode==='error'?r.abort():mode==='pending'?undefined:r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e5ece8"/></svg>'}));
  await page.goto(process.env.MAP_URL||'file://'+path.join(root,'index.html'));
  assert(!requests.some(u=>/panoramax|jsdelivr/.test(u)),'No photo requests on startup');
  await page.evaluate(()=>openPoint(TEXTILES.find(p=>PANORAMAX.points['textiles:'+p.id]).id));
  assert.equal(await page.locator('#photo-view img').count(),0,'Opening a point does not load photos');
  await page.locator('#show-photo').click();
  await page.waitForFunction(()=>document.querySelector('#photo-view').dataset.state==='ready',null,{timeout:30000});
  assert.equal(await page.locator('#photo-view img').count(),1);
  assert(await page.locator('#photo-view img').evaluate(e=>e.naturalWidth>0));
  await page.locator('.photo-expand').click();
  assert(await page.locator('#modal .photo-large').isVisible());
  await page.locator('#modal-close').click();
  assert.match(await page.locator('.photo-caption').innerText(),/\d+ m od znacznika/);
  for(const width of [1280,390,320]){
   await page.setViewportSize({width,height:844});
   assert(await page.locator('#popup').evaluate(e=>e.scrollWidth<=e.clientWidth),'Photo panel must fit');
   await page.locator('#point-photo').scrollIntoViewIfNeeded();
   const close=await page.locator('#popup-close').boundingBox();
   const popup=await page.locator('#popup').boundingBox();
   assert(close.y>=popup.y&&close.y+close.height<=popup.y+popup.height,'Close stays accessible while viewing a photo');
  }
  await page.locator('#popup-close').click();
  assert.equal(await page.locator('#photo-view img').count(),0,'Closing destroys the viewer');
  await page.evaluate(()=>openPoint(TEXTILES.find(p=>p.geo.status==='address'&&!PANORAMAX.points['textiles:'+p.id]).id));
  assert.equal(await page.locator('#show-photo').count(),0);
  assert.equal(await page.getByRole('link',{name:'Street View okolicy'}).count(),1);
  if(!process.env.PANORAMAX_LIVE){
   mode='error';
   await page.evaluate(()=>openPoint(TEXTILES.filter(p=>PANORAMAX.points['textiles:'+p.id])[1].id));
   await page.locator('#show-photo').click();
   await page.waitForFunction(()=>document.querySelector('#photo-view').dataset.state==='error');
   assert(await page.locator('#photo-fallback').isVisible());
   assert(await page.locator('#show-photo').isEnabled());
   mode='success';await page.locator('#show-photo').click();
   await page.waitForFunction(()=>document.querySelector('#photo-view').dataset.state==='ready');
   assert.equal(await page.locator('#photo-view img').count(),1,'Retry replaces failed viewer');
   mode='pending';
   await page.evaluate(()=>openPoint(TEXTILES.filter(p=>PANORAMAX.points['textiles:'+p.id])[2].id));
   await page.locator('#show-photo').click();
   await selectFraction(page,'electronics');
   assert.equal(await page.locator('#photo-view img').count(),0,'Switching fractions cancels the viewer');
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${matches.length} local photo matches, distances, attribution, lazy embedded photos and enlargement, layouts, cleanup${process.env.PANORAMAX_LIVE?' (real Panoramax)':', failures and retry'}`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
