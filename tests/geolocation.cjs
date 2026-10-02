const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const handler=html.slice(html.indexOf('function locateUser('),html.indexOf("$('menu').onclick="));
function setup(secure=true,available=true){
 const button={disabled:false},messages=[],requests=[];
 const ctx={isSecureContext:secure,navigator:{},$:()=>button,toast:m=>messages.push(m),userLocation:null,view:{},requestMap:()=>ctx.renders++,refreshList:()=>ctx.renders++ ,renders:0};
 if(available)ctx.navigator.geolocation={getCurrentPosition:(success,error,options)=>requests.push({success,error,options})};
 vm.createContext(ctx);vm.runInContext(handler,ctx);return{button,messages,requests,ctx};
}
let t=setup(false);t.button.onclick();assert.equal(t.requests.length,0,'HTTP must not request location');assert.match(t.messages.at(-1),/HTTPS/);
t=setup(true,false);t.button.onclick();assert.match(t.messages.at(-1),/przeglądarka/);
t=setup();t.button.onclick();assert.equal(t.button.disabled,true);assert.match(t.messages.at(-1),/Ustalam/);t.requests[0].success({coords:{latitude:54.4,longitude:18.6}});assert.equal(t.button.disabled,false);assert.equal(t.ctx.view.center.join(','),'54.4,18.6');assert.equal(t.ctx.renders,1);
for(const [code,match] of [[1,/zablokowany/],[2,/usługi lokalizacji/],[3,/Czas oczekiwania/]]){t=setup();t.button.onclick();t.requests[0].error({code});assert.equal(t.button.disabled,false);assert.match(t.messages.at(-1),match);}
console.log('PASS: insecure context, unavailable API, pending request, centering, and three location failures');
