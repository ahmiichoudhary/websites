const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let expr="", calculated=false, memory=0, angle="DEG", sound=true;
let history=JSON.parse(localStorage.getItem("calcnova-pro-history")||"[]");

const expressionEl=$("#expression"), resultEl=$("#result"), historyEl=$("#history");

function clean(v){return v.replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-").replace(/\^/g,"**").replace(/(\d+(?:\.\d+)?)%/g,"($1/100)")}
function evaluate(v){
 let x=clean(v).replace(/\bpi\b/g,"Math.PI").replace(/\be\b/g,"Math.E");
 if(!/^[0-9+\-*/().\sA-Za-z]+$/.test(x)) throw Error();
 if(/Math\.(?!PI|E)/.test(x)) throw Error();
 return Function('"use strict";return ('+x+')')();
}
function fmt(n){
 if(!Number.isFinite(n)) return "Error";
 if(Math.abs(n)>=1e12 || (Math.abs(n)>0&&Math.abs(n)<1e-9)) return n.toExponential(8);
 return Number(n.toFixed(12)).toLocaleString("en-US",{maximumFractionDigits:12});
}
function preview(){try{return fmt(evaluate(expr))}catch{return expr?"…":"0"}}
function render(){expressionEl.textContent=expr||"0";resultEl.textContent=preview()}
function beep(){if(!sound)return;try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.frequency.value=430;g.gain.value=.025;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.035)}catch{}}
function add(v){
 beep();
 if(calculated&&/[0-9.]/.test(v))expr="";
 calculated=false;
 if(/[+\-*/]/.test(v)&&/[+\-*/]/.test(expr.slice(-1)))expr=expr.slice(0,-1);
 if(v==="."&&expr.split(/[+\-*/]/).pop().includes("."))return;
 if(v==="."&&!expr.split(/[+\-*/]/).pop())v="0.";
 expr+=v;render();
}
function calculate(){
 if(!expr)return;
 try{let raw=evaluate(expr),out=fmt(raw);if(out==="Error")throw Error();addHistory(expr,out);expr=String(raw);calculated=true;render();resultEl.textContent=out}
 catch{resultEl.textContent="Error"}
}
function addHistory(e,r){
 history.unshift({e,r});history=history.slice(0,50);localStorage.setItem("calcnova-pro-history",JSON.stringify(history));renderHistory();
}
function renderHistory(){
 if(!history.length){historyEl.innerHTML='<div class="empty">No calculations yet.</div>';return}
 historyEl.innerHTML=history.map((h,i)=>`<div class="history-item" data-i="${i}"><small>${esc(h.e)}</small><strong>= ${esc(h.r)}</strong></div>`).join("");
 $$(".history-item").forEach(x=>x.onclick=()=>{expr=history[+x.dataset.i].e;calculated=false;render()});
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$$("[data-value]").forEach(b=>b.onclick=()=>add(b.dataset.value));
$$("[data-calc]").forEach(b=>b.onclick=()=>{
 const a=b.dataset.calc,v=b.dataset.value;beep();
 if(a==="clear"){expr="";calculated=false;render()}
 else if(a==="backspace"){expr=expr.slice(0,-1);render()}
 else if(a==="equals")calculate();
 else if(a==="percent"){if(expr)expr+="%";render()}
 else if(a==="negate"){if(expr)expr=`-(${expr})`;render()}
 else if(a==="constant"){if(calculated)expr="";expr+=v;calculated=false;render()}
 else if(a==="square"){if(expr)expr=`(${expr})^2`;render()}
 else if(a==="cube"){if(expr)expr=`(${expr})^3`;render()}
 else if(a==="inverse"){if(expr)expr=`1/(${expr})`;render()}
 else if(a==="factorial"){
   try{let n=evaluate(expr);if(n<0||n>170||!Number.isInteger(n))throw Error();let f=1;for(let i=2;i<=n;i++)f*=i;expr=String(f);calculated=true;render()}catch{resultEl.textContent="Error"}
 }
 else if(a==="func")scientific(v);
 else if(a==="memory")memoryAction(v);
});
function scientific(fn){
 try{
  let n=evaluate(expr||"0"),rad=angle==="DEG"?n*Math.PI/180:n,out;
  if(fn==="sin")out=Math.sin(rad);if(fn==="cos")out=Math.cos(rad);if(fn==="tan")out=Math.tan(rad);
  if(fn==="asin")out=angle==="DEG"?Math.asin(n)*180/Math.PI:Math.asin(n);
  if(fn==="acos")out=angle==="DEG"?Math.acos(n)*180/Math.PI:Math.acos(n);
  if(fn==="atan")out=angle==="DEG"?Math.atan(n)*180/Math.PI:Math.atan(n);
  if(fn==="sqrt")out=Math.sqrt(n);if(fn==="cbrt")out=Math.cbrt(n);if(fn==="log")out=Math.log10(n);if(fn==="ln")out=Math.log(n);
  if(!Number.isFinite(out))throw Error();expr=String(out);calculated=true;render()
 }catch{resultEl.textContent="Error"}
}
function memoryAction(v){
 try{
  if(v==="MC")memory=0;
  if(v==="MR"){expr=String(memory);calculated=false}
  if(v==="M+")memory+=evaluate(expr||"0");
  if(v==="M-")memory-=evaluate(expr||"0");
  render()
 }catch{resultEl.textContent="Error"}
}
$("#angleBtn").onclick=()=>{angle=angle==="DEG"?"RAD":"DEG";$("#angleBtn").textContent=angle};
$("#scientificBtn").onclick=()=>$("#scientificPad").classList.toggle("hidden");
$("#clearBtn").onclick=()=>{expr="";render()};
$("#clearHistory").onclick=()=>{history=[];localStorage.removeItem("calcnova-pro-history");renderHistory()};
$("#soundBtn").onclick=()=>{sound=!sound;$("#soundBtn").textContent=sound?"🔊":"🔇"};
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("calcnova-pro-theme",document.body.classList.contains("dark")?"dark":"light")};

$$(".tab").forEach(t=>t.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".panel").forEach(x=>x.classList.remove("active-panel"));t.classList.add("active");$("#"+t.dataset.panel).classList.add("active-panel")});
document.addEventListener("keydown",e=>{
 if(/^[0-9.]$/.test(e.key))add(e.key);else if(["+","-","*","/"].includes(e.key))add(e.key);else if(e.key==="Enter"||e.key==="=")calculate();else if(e.key==="Backspace"){expr=expr.slice(0,-1);render()}else if(e.key==="Escape"){expr="";render()}
});

const units={
 length:{meter:1,kilometer:1000,centimeter:.01,millimeter:.001,mile:1609.344,yard:.9144,foot:.3048,inch:.0254},
 weight:{gram:1,kilogram:1000,milligram:.001,pound:453.59237,ounce:28.349523125,ton:1000000},
 area:{sqm:1,sqkm:1000000,sqcm:.0001,sqft:.09290304,sqyd:.83612736,acre:4046.8564224,hectare:10000},
 volume:{liter:1,milliliter:.001,cubic_meter:1000,gallon:3.785411784,quart:.946352946,pint:.473176473,cup:.2365882365},
 speed:{mps:1,kph:1/3.6,mph:.44704,knot:.514444444},
 time:{second:1,minute:60,hour:3600,day:86400,week:604800}
};
const names={meter:"Meter",kilometer:"Kilometer",centimeter:"Centimeter",millimeter:"Millimeter",mile:"Mile",yard:"Yard",foot:"Foot",inch:"Inch",gram:"Gram",kilogram:"Kilogram",milligram:"Milligram",pound:"Pound",ounce:"Ounce",ton:"Ton",sqm:"m²",sqkm:"km²",sqcm:"cm²",sqft:"ft²",sqyd:"yd²",acre:"Acre",hectare:"Hectare",liter:"Liter",milliliter:"Milliliter",cubic_meter:"m³",gallon:"Gallon",quart:"Quart",pint:"Pint",cup:"Cup",mps:"m/s",kph:"km/h",mph:"mph",knot:"Knot",second:"Second",minute:"Minute",hour:"Hour",day:"Day",week:"Week"};
function fillUnits(){
 let c=$("#unitCategory").value,f=$("#unitFrom"),t=$("#unitTo");
 if(c==="temperature"){f.innerHTML=t.innerHTML=["celsius","fahrenheit","kelvin"].map(x=>`<option value="${x}">${x[0].toUpperCase()+x.slice(1)}</option>`).join("")}
 else{let o=Object.keys(units[c]).map(x=>`<option value="${x}">${names[x]}</option>`).join("");f.innerHTML=o;t.innerHTML=o}
 convert();
}
function convert(){
 let c=$("#unitCategory").value,v=Number($("#unitValue").value)||0,a=$("#unitFrom").value,b=$("#unitTo").value,out;
 if(c==="temperature"){
  let cel=a==="celsius"?v:a==="fahrenheit"?(v-32)*5/9:v-273.15;
  out=b==="celsius"?cel:b==="fahrenheit"?cel*9/5+32:cel+273.15
 }else{out=v*units[c][a]/units[c][b]}
 $("#unitResult").textContent=Number(out.toFixed(10)).toLocaleString("en-US");
}
$("#unitCategory").onchange=fillUnits;$("#unitFrom").onchange=convert;$("#unitTo").onchange=convert;$("#unitValue").oninput=convert;

function updateProgrammer(){
 let n=Number($("#decInput").value)||0,i=Math.trunc(n);
 $("#hexOutput").textContent=(i>>>0).toString(16).toUpperCase();$("#binOutput").textContent=(i>>>0).toString(2);$("#octOutput").textContent=(i>>>0).toString(8);$("#decOutput").textContent=i.toLocaleString()
}
$("#decInput").oninput=updateProgrammer;

function finance(){
 let p=+$("#siPrincipal").value||0,r=+$("#siRate").value||0,t=+$("#siTime").value||0,interest=p*r*t/100;$("#siInterest").textContent=fmt(interest);$("#siTotal").textContent=fmt(p+interest);
 let P=+$("#loanAmount").value||0,annual=+$("#loanRate").value||0,m=+$("#loanMonths").value||0,rate=annual/100/12,emi=rate?P*rate*Math.pow(1+rate,m)/(Math.pow(1+rate,m)-1):P/m;$("#emiResult").textContent=fmt(emi);
 let pv=+$("#pctValue").value||0,po=+$("#pctOf").value||0;$("#pctResult").textContent=fmt(pv/100*po)
}
$$(".finance-grid input").forEach(x=>x.oninput=finance);

if(localStorage.getItem("calcnova-pro-theme")==="dark")document.body.classList.add("dark");
render();renderHistory();fillUnits();updateProgrammer();finance();
