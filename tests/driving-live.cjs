// Live checks use only public bin coordinates from the checked-in dataset, never a user's location.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const publicStart=require('../elektroodpady_punkty.json').points.find(p=>p.id===21244); // Cedrowa 40
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(geo=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(f){f({coords:{latitude:geo.lat,longitude:geo.lon}})}}}),publicStart.geo);
  await page.goto(process.env.MAP_URL||'file://'+path.resolve(__dirname,'../index.html'));
  await page.locator('[data-fraction="electronics"]').click();
  await page.locator('.pair-result').first().waitFor({timeout:30000});
  await page.locator('.pair-result').first().click();
  await page.locator('#paths .pair-line').waitFor({timeout:30000});
  const recommendation=await page.evaluate(()=>({stops:selectedPair.stops.map(p=>p.address_pdf),metres:selectedPair.total,vertices:selectedPair.geometry.length}));
  assert(recommendation.vertices>3);
  await page.locator('#popup-close').click();
  const regression=await page.evaluate(async()=>{
   const textile=TEXTILES.find(p=>p.address_pdf==='Warszawska 55'&&p.city==='Gdańsk'),electronic=ELECTRONICS.points.find(p=>p.address_pdf==='Cedrowa 41');
   const start=ELECTRONICS.points.find(p=>p.id===21244);
   if(!textile||!electronic||!start)throw new Error('Missing public bin locations');
   const pair={key:'regression',origin:[start.geo.lat,start.geo.lon],stops:[electronic,textile]};
   const road=await RoadRouting.route(pair);
   const direct=distanceFrom([electronic.geo.lat,electronic.geo.lon],textile.geo);
   pairsCurrent.push(Object.assign(pair,road));openPair(pair.key);
   return{direct,road:road.gap,total:road.total,vertices:road.geometry.length};
  });
  assert(regression.road>regression.direct*1.5,'The arterial-road detour must be longer than the straight-line gap');
  assert(regression.vertices>10);
  await page.locator('#paths .pair-line').waitFor();
  if(process.env.SCREENSHOT)await page.screenshot({path:process.env.SCREENSHOT});
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>{const panel=document.querySelector('#popup').getBoundingClientRect(),pins=[...document.querySelectorAll('.pin.pair-stop')];return pins.length===2&&pins.every(pin=>pin.getBoundingClientRect().bottom<=panel.top)});
  const panel=await page.locator('#popup').boundingBox();
  for(const pin of await page.locator('.pin.pair-stop').all()){const box=await pin.boundingBox();assert(box.y+box.height<=panel.y,'Both real route stops remain visible above the mobile panel');}
  assert(await page.locator('#popup').evaluate(e=>e.scrollWidth<=e.clientWidth));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({publicStart:publicStart.address_pdf,recommendation,screenshotRegression:regression}));
  console.log('PASS: live car matrix, CORS, road geometry and the Cedrowa 41 – Warszawska 55 detour');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
