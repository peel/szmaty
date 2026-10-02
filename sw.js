const CACHE_PREFIX='gdzie-wyrzucic-app-';
const CACHE=CACHE_PREFIX+'v1';
const SHELL=['./index.html','./manifest.webmanifest','./icons/icon.svg','./icons/icon-32.png','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
const urls=new Set(SHELL.map(path=>new URL(path,self.registration.scope).href));
const indexURL=new URL('./index.html',self.registration.scope).href;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(SHELL.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith(CACHE_PREFIX)&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const navigation=request.mode==='navigate'&&(url.pathname===new URL(self.registration.scope).pathname||url.pathname===new URL(indexURL).pathname);
 const canonical=url.origin+url.pathname;
 // Never cache third-party map tiles, routing responses, photographs, or unrelated files.
 if(!navigation&&!urls.has(canonical))return;
 const key=navigation?indexURL:canonical;
 const network=fetch(new Request(request,{cache:'no-cache'})).then(async response=>{
  if(!response.ok)throw new Error('Network response unavailable');
  const cache=await caches.open(CACHE);await cache.put(key,response.clone());return response;
 });
 event.waitUntil(network.catch(()=>{}));
 event.respondWith((async()=>{
  let timer;
  try{return await Promise.race([network,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Network timeout')),4000)})]);}
  catch{const cached=await caches.match(key,{cacheName:CACHE});return cached||Response.error();}
  finally{clearTimeout(timer);}
 })());
});
