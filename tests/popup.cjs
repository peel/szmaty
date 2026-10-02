const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const read=id=>JSON.parse(html.match(new RegExp('<script id="'+id+'" type="application/json">([\\s\\S]*?)</script>'))[1]);
const coordinates=read('saved-data').coordinates;
const textiles=read('source-data').map(p=>({...p,geo:coordinates[p.id]}));
const electronics=read('electronics-data').points;
const context=vm.createContext({PANORAMAX:read('panoramax-data'),esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))});
vm.runInContext(html.match(/const statusLabels=.+;/)[0],context);
vm.runInContext(html.slice(html.indexOf('function locationDescription('),html.indexOf('function openPoint(')),context);
for(const p of [...textiles,...electronics]){
 const popup=context.popupHTML(p);
 assert.doesNotMatch(popup,/PDF|Strona PDF|wg PDF|opis źródłowy|powtórzenia|Obiekt OSM|Wpisy źródłowe/i,`Point ${p.id} describes the location`);
 assert(popup.includes(context.esc(p.address_pdf==='Brak adresu w PDF'?'Adres nieznany':p.address_pdf)));
 const links=[...popup.matchAll(/href="([^"]+)"/g)].map(m=>new URL(m[1].replace(/&amp;/g,'&')));
 const street=links.find(u=>u.searchParams.get('map_action')==='pano');
 const directions=links.find(u=>u.pathname==='/maps/dir/');
 if(p.geo.status==='unresolved')assert(!street&&!directions,'Unknown positions do not get fabricated coordinates');
 else{
  const photo=read('panoramax-data').points[(p.source?'electronics:':'textiles:')+p.id];
  assert(street,`Street View or fallback for point ${p.id}`);
  assert.equal(street.searchParams.get('viewpoint'),`${p.geo.lat},${p.geo.lon}`);
  assert.equal(street.searchParams.get('api'),'1');
  if(photo){assert(popup.includes('id="show-photo"'));assert(popup.includes('m od znacznika'));}
  else assert(!popup.includes('id="show-photo"'));
  assert(popup.includes('Zdjęcia mogą być nieaktualne'));
  if(p.geo.area_only)assert(!directions,'Whole streets must not get a precise route destination');
  else assert.equal(directions.searchParams.get('destination'),`${p.geo.lat},${p.geo.lon}`);
 }
}
const noted=electronics.find(p=>p.sources.some(s=>s.note==='obok altany śmietnikowej'));
assert.match(context.popupHTML(noted),/obok altany śmietnikowej/);
assert.match(context.popupHTML(textiles[0]),/Jutrzenka/);
assert.doesNotMatch(context.popupHTML(textiles[0]),/Borzytuchom<\/p>/,'Use the actual place named in the address');
const conflict=electronics.find(p=>p.note.includes('sprzeczne współrzędne'));
assert.match(context.popupHTML(conflict),/wymaga potwierdzenia/);
console.log('PASS: all 1233 popups describe locations without PDF references; coordinate-correct Street View/routes, unknown/street-only safeguards, placement notes and conflicts');
