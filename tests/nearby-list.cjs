const selectFraction=require('./select-fraction.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://tile.openstreetmap.org/**',r=>r.abort());
  await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success){window.resolveLocation=()=>success({coords:{latitude:54.4,longitude:18.6}})}}}));
  await page.goto(process.env.MAP_URL||'file://'+path.resolve(__dirname,'../index.html'));
  await page.evaluate(()=>window.resolveLocation());
  const rows=()=>page.locator('#results .result');
  const ids=()=>rows().evaluateAll(es=>es.map(e=>Number(e.dataset.id)));
  assert.equal(await rows().count(),50,'Initially render only the first 50 results');
  assert.equal(await page.locator('#visible-count').innerText(),'856','All matching markers stay on the map');
  const expected=await page.evaluate(()=>POINTS.map(p=>{
   if(p.geo.status==='unresolved')return{id:p.id,d:Infinity};
   const r=x=>x*Math.PI/180,a=Math.sin(r(p.geo.lat-54.4)/2)**2+Math.cos(r(54.4))*Math.cos(r(p.geo.lat))*Math.sin(r(p.geo.lon-18.6)/2)**2;
   return{id:p.id,d:2*6371000*Math.asin(Math.sqrt(a))};
  }).sort((a,b)=>a.d-b.d));
  const distances=new Map(expected.map(p=>[p.id,p.d]));
  const checkOrder=async()=>{const d=(await ids()).map(id=>distances.get(id));for(let i=1;i<d.length;i++)assert(d[i]>=d[i-1]-.001,'Distances increase down the list');};
  await checkOrder();
  assert.equal((await ids())[0],expected[0].id);
  await page.locator('#results').evaluate(e=>e.scrollTop=e.scrollHeight);
  await page.waitForFunction(()=>document.querySelectorAll('#results .result').length===100);
  assert.equal(new Set(await ids()).size,100);await checkOrder();
  const before=await page.locator('#results').evaluate(e=>e.scrollTop);
  await rows().nth(60).click();
  const selectedScroll=await page.locator('#results').evaluate(e=>e.scrollTop);
  await page.locator('#popup-close').click();
  assert.equal(await rows().count(),100,'Opening and closing does not reset loaded results');
  assert.equal(await page.locator('#results').evaluate(e=>e.scrollTop),selectedScroll,'Closing preserves list scroll');
  assert(before>0);
  await page.locator('#search').fill('Gdynia');
  assert.equal(await page.locator('#results').evaluate(e=>e.scrollTop),0,'Search resets pagination');
  assert(await rows().count()<=50);await checkOrder();
  await page.locator('#search').fill('');
  assert.equal(await rows().count(),50);
  await selectFraction(page,'electronics');
  assert.equal(await rows().count(),50);assert.equal(await page.locator('#visible-count').innerText(),'143');
  const nearest=await page.evaluate(()=>current[0].id);
  await page.locator('#map').press('ArrowLeft');
  assert.equal((await ids())[0],nearest,'Panning does not change the user-relative origin');
  await selectFraction(page,'textiles');
  while(await page.locator('#load-more').count()){
   const count=await rows().count();
   await page.locator('#results').evaluate(e=>e.scrollTop=e.scrollHeight);
   await page.waitForFunction(n=>document.querySelectorAll('#results .result').length>n,count);
  }
  assert.equal(await rows().count(),1090);assert.equal(new Set(await ids()).size,1090);await checkOrder();
  assert.equal(await rows().last().evaluate(e=>e.classList.contains('unresolved')),true,'Unknown locations go last');
  await page.evaluate(()=>{userLocation=null;view.center=[54.5,18.5];requestMap()});
  await page.waitForFunction(()=>document.querySelectorAll('#results .result').length===50);
  const mapNearest=await page.evaluate(()=>({id:current[0].id,center:[...view.center]}));
  await rows().first().click();await page.locator('#popup-close').click();
  assert.equal((await ids())[0],mapNearest.id,'Opening a point does not move the distance origin');
  await page.locator('#map').press('ArrowRight');
  await page.evaluate(()=>{view.center=[54.05,18.9];requestMap()});
  await page.waitForFunction(previous=>Number(document.querySelector('#results .result').dataset.id)!==previous,mapNearest.id);
  assert.equal(await rows().count(),50);
  assert.match(await page.locator('#list-order').textContent(),/środka mapy/);
  assert.deepEqual(errors,[]);
  console.log('PASS: nearest-first list, batches of 50, all map markers, search/fraction reset, stable scroll, unresolved last, map-center fallback');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
