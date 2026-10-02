const fs=require('node:fs');
const path=require('node:path');
const norm=s=>String(s||'').toLowerCase().replace(/ł/g,'l').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function address(p){
 return norm(p.address_pdf).replace(/,\s*gdansk$/,'').replace(/^(?:aleja\s+|al[. ]|ul\.?|u\.)\s*/,'')
  .replace('lecha kaczynskiego','kaczynskiego').replace('jagielonska','jagiellonska').replace(/[^a-z0-9]/g,'');
}
const street=p=>address(p).split(/\d/)[0];
const distance=(a,b)=>Math.hypot((a.geo.lat-b.geo.lat)*111195,(a.geo.lon-b.geo.lon)*65000);
const cleanNote=s=>s.replace(/Te same współrzędne co ID \d+ przy innym adresie — do sprawdzenia\./g,'').replace(/Brak punktu operatora w promieniu ok\. 100 m \(najbliższy ok\. \d+ m\)\. Możliwa różnica adresu lub współrzędnych\./g,'').trim();
function mergeElectronics(data){
 const rows=[...data.operator,...data.city].sort((a,b)=>a.id-b.id);
 let groups=rows.map(r=>[r]);
 function merge(a,b,reviewed=false){
  const i=groups.findIndex(g=>g.some(p=>p.id===a.id)),j=groups.findIndex(g=>g.some(p=>p.id===b.id));
  if(i===j)return;
  if(!reviewed&&groups[i].some(x=>groups[j].some(y=>distance(x,y)>50)))return;
  groups[i].push(...groups[j]);groups.splice(j,1);
 }
 for(let i=0;i<rows.length;i++)for(let j=0;j<i;j++){
  const a=rows[i],b=rows[j];if(norm(a.city)!==norm(b.city))continue;
  const d=distance(a,b);
  if((address(a)===address(b)&&d<=50)||(street(a)===street(b)&&d<=5))merge(a,b);
 }
 // Reviewed exceptions for this saved 2026-10-02 snapshot. Keep original evidence in sources.
 const reviewed=[
  [21244,109298,'Cmentarz Łostowicki: nazwa obiektu i adres Cedrowa 40 mają identyczne współrzędne.'],
  [21243,109301,'Cmentarz Srebrzysko: nazwa obiektu i adres Srebrniki 12 mają identyczne współrzędne.'],
  [19930,107601,'Kartuska 459 / 459C: połączono warianty numeru przy przesunięciu ok. 22 m. Pobliskiej Fabrycznej nie scalono.'],
  [12387,21084,'Karpacka 2: sprzeczne współrzędne w dwóch wpisach operatora. Wybrano pozycję zgodną z mapą miejską; drugą pozycję zachowano w źródłach.']
 ];
 for(const [a,b]of reviewed){const x=rows.find(p=>p.id===a),y=rows.find(p=>p.id===b);if(x&&y)merge(x,y,true);}
 const points=groups.map(group=>{
  group.sort((a,b)=>a.id-b.id);
  const primary=group[0];
  const sources=group.map(p=>({record_id:p.id,id:p.ids[0],name:p.source_name,url:p.source,address:p.address_pdf,lat:p.geo.lat,lon:p.geo.lon,note:p.note}));
  const notes=[...new Set(group.map(p=>cleanNote(p.note)).filter(Boolean))];
  if(new Set(group.map(address)).size>1)notes.push('Źródła podają różne opisy adresu. Zachowano je poniżej; scalenie nie potwierdza liczby pojemników.');
  for(const [a,b,note]of reviewed)if(group.some(p=>p.id===a)&&group.some(p=>p.id===b))notes.push(note);
  return {...primary,ids:group.flatMap(p=>p.ids),sources,search_terms:group.map(p=>p.address_pdf).join(' '),source_name:[...new Set(group.map(p=>p.source_name))].join(' · '),note:notes.join(' '),geo:{...primary.geo}};
 }).sort((a,b)=>a.city.localeCompare(b.city,'pl')||a.address_pdf.localeCompare(b.address_pdf,'pl')||a.id-b.id);
 for(let i=0;i<points.length;i++)for(let j=0;j<i;j++){
  const a=points[i],b=points[j];if(a.city!==b.city)continue;
  if(distance(a,b)<5){
   a.note+=` Inny adres (${b.address_pdf}) ma te same lub niemal identyczne współrzędne. Nie scalono bez potwierdzenia.`;
   b.note+=` Inny adres (${a.address_pdf}) ma te same lub niemal identyczne współrzędne. Nie scalono bez potwierdzenia.`;
  }
 }
 const kartuska=points.find(p=>p.sources.some(s=>s.record_id===19930));
 const fabryczna=points.find(p=>p.sources.some(s=>s.record_id===19931));
 if(kartuska&&fabryczna){
  kartuska.note+=' W pobliżu pozostaje osobny wpis Fabryczna; nie potwierdzono, czy opisuje ten sam pojemnik.';
  fabryczna.note+=' W pobliżu pozostaje osobny wpis Kartuska 459C / 459; nie potwierdzono, czy opisuje ten sam pojemnik.';
 }
 return {points,metadata:{version:1,date:'2026-10-02',sourceRecords:rows.length,locations:points.length,mergedRecords:rows.length-points.length,reviewed:reviewed.filter(([a,b])=>rows.some(p=>p.id===a)&&rows.some(p=>p.id===b)).map(([a,b,reason])=>({ids:[a,b],reason}))}};
}
module.exports={mergeElectronics};
if(require.main===module){
 const root=path.resolve(__dirname,'..'),file=path.join(root,'elektroodpady_punkty.json');
 const raw=JSON.parse(fs.readFileSync(file));
 const {points,metadata}=mergeElectronics(raw);
 fs.writeFileSync(file,JSON.stringify({operator:raw.operator,city:raw.city,points,metadata},null,2)+'\n');
 const html=path.join(root,'index.html');
 const embedded=JSON.stringify({points,metadata}).replace(/</g,'\\u003c');
 fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace(/(<script id="electronics-data" type="application\/json">)[\s\S]*?(<\/script>)/,(_,start,end)=>start+embedded+end));
 console.log(JSON.stringify(metadata));
}
