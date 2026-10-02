module.exports=async function mockRoads(page){
 const state={calls:[],failMatrix:false,failRoute:false,delay:0};
 await page.route('https://routing.openstreetmap.de/routed-car/**',async request=>{
  const url=new URL(request.request().url());state.calls.push(url);
  if(state.delay)await new Promise(r=>setTimeout(r,state.delay));
  const coords=url.pathname.split('/').pop().split(';').map(p=>p.split(',').map(Number));
  const waypoint=p=>({location:p,distance:5});
  const distance=(a,b)=>Math.round(Math.hypot((a[0]-b[0])*65000,(a[1]-b[1])*111000)*1.8);
  if(url.pathname.includes('/table/')){
   if(state.failMatrix)return request.fulfill({status:503,body:'Unavailable'});
   return request.fulfill({json:{code:'Ok',sources:coords.map(waypoint),destinations:coords.map(waypoint),distances:coords.map((a,i)=>coords.map((b,j)=>i===j?0:distance(a,b)+(i<j?100:200)))}});
  }
  if(state.failRoute)return request.fulfill({status:503,body:'Unavailable'});
  const geometry=[];for(let i=0;i<coords.length;i++){if(i)geometry.push([coords[i-1][0]+.002,coords[i][1]+.001]);geometry.push(coords[i]);}
  return request.fulfill({json:{code:'Ok',waypoints:coords.map(waypoint),routes:[{geometry:{type:'LineString',coordinates:geometry},legs:[{distance:distance(coords[0],coords[1])+100},{distance:distance(coords[1],coords[2])+200}]}]}});
 });
 return state;
};
