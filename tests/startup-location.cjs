const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  for(const outcome of ['success',1,2,3,'unavailable']){
   const page=await browser.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://tile.openstreetmap.org/**',r=>r.abort());
   await page.addInitScript(outcome=>{
    window.locationRequests=0;
    Object.defineProperty(navigator,'geolocation',{value:outcome==='unavailable'?undefined:{getCurrentPosition(success,error){
     window.locationRequests++;
     window.finishLocation=()=>outcome==='success'?success({coords:{latitude:54.4,longitude:18.6}}):error({code:outcome});
    }}});
   },outcome);
   await page.goto(process.env.MAP_URL||'file://'+path.resolve(__dirname,'../index.html'));
   assert.equal(await page.evaluate(()=>window.locationRequests),outcome==='unavailable'?0:1,'Request location once at startup');
   assert.equal(await page.locator('.sidebar-footer #about').count(),1,'Sources link belongs in the footer');
   if(outcome!=='unavailable')await page.evaluate(()=>window.finishLocation());
   const state=await page.evaluate(()=>({center:view.center,zoom:view.zoom,userLocation,disabled:document.getElementById('locate').disabled}));
   assert.equal(state.disabled,false);
   if(outcome==='success'){
    assert.deepEqual(state.center,[54.4,18.6]);assert.equal(state.zoom,15);
   }else{
    assert.equal(state.userLocation,null);assert(state.zoom<12,'Failed location should show the whole region');
    assert.equal(await page.locator('#visible-count').innerText(),'856');
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('PASS: automatic location, centering and zoom, denied/unavailable/timeout fallbacks, footer sources');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
