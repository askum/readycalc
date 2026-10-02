import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
let count=0;
const check=(result,expected)=>{for(const part of expected)assert.ok(JSON.stringify(result).includes(part),`${part} missing in ${JSON.stringify(result)}`);count++;};
const calcSource=fs.readFileSync(new URL('../assets/calculators.js', import.meta.url),'utf8');
function calc(type,input,expected){let result;const context={num:n=>Number(input[n]),value:n=>String(input[n]),range:()=>true,invalidate:()=>{throw Error('invalid')},fmt:(n,u='')=>Number(n.toFixed(1)).toLocaleString('ko-KR')+u,won:n=>Math.round(n).toLocaleString('ko-KR')+'원',show:(...a)=>result=a,electricityPresets:{}};vm.runInNewContext(calcSource.slice(calcSource.indexOf('  const calculators = {'),calcSource.indexOf('\n  const restoreQuery'))+`\ncalculators[${JSON.stringify(type)}]();`,context);check(result,expected);}
calc('meat',{adults:4,children:0,meals:1,appetite:1},['1kg','2팩']);
calc('meat',{adults:3,children:3,meals:1,appetite:1.2},['1.4kg','3팩']);
calc('meat',{adults:3,children:2,meals:2,appetite:1.2},['2.5kg','5팩']);
for(const [distance,efficiency,price,toll,people,total,share] of [[400,12,1700,30000,4,'86,667원','21,667원'],[250,15.5,1650,10000,2,'36,613원','18,306원'],[650,9,1750,45000,5,'171,389원','34,278원']])calc('fuel',{distance,efficiency,price,toll,people},[total,share]);
for(const [power,hours,days,quantity,duty,rate,kwh,cost] of [[1000,8,30,1,60,200,'144kWh','28,800원'],[150,24,30,1,35,200,'37.8kWh','7,560원'],[45,8,30,3,100,200,'32.4kWh','6,480원']])calc('electricity',{power,hours,days,quantity,duty,rate},[kwh,cost]);
for(const [guests,hours,weather,liters,cans] of [[30,3,1,'22.5L','64캔'],[40,3,.9,'27L','77캔'],[20,5,1.25,'26.2L','74캔']])calc('drinks',{guests,hours,weather},[liters,cans]);
const finance=fs.readFileSync(new URL('../assets/finance-tools.js', import.meta.url),'utf8');
function fin(type,input,expected){let submit;const nodes={};const node=s=>nodes[s]??=( {textContent:'',innerHTML:'',focus(){},addEventListener(){}} );const form={dataset:{newTool:type},elements:Object.fromEntries(Object.entries(input).map(([k,v])=>[k,{value:String(v)}])),querySelectorAll:()=>[],querySelector:()=>null,addEventListener:(e,fn)=>{if(e==='submit')submit=fn;}};const document={querySelector:s=>s==='[data-new-tool]'?form:node(s)};vm.runInNewContext(finance,{document,matchMedia:()=>({matches:false})});submit({preventDefault(){}});check(nodes,expected);}
for(const [method,first,last,int] of [['equal-payment','1,066,185','1,066,185','794,226'],['equal-principal','1,120,000','1,010,000','780,000'],['bullet','120,000','12,120,000','1,440,000']])fin('loan-calculator',{principal:12000000,rate:12,years:1,method},[first,last,int]);
for(const [initial,monthly,rate,total] of [[1000000,100000,0,'2,200,000'],[1000000,0,12,'1,126,825'],[0,100000,12,'1,268,250']])fin('compound-interest',{initial,monthly,rate,years:1},[total]);
for(const [amount,rate,years,total] of [[1000000,2.5,10,'1,280,085'],[3000000,3,20,'5,418,334'],[1000000,-2,1,'980,000']])fin('inflation-calculator',{amount,rate,years},[total]);
for(const [investment,finalValue,cost,years,roi] of [[1000000,1100000,0,1,'10%'],[1000000,1210000,0,2,'21%'],[1000000,800000,0,1,'-20%']])fin('roi-calculator',{investment,finalValue,cost,years},[roi]);
const dev=fs.readFileSync(new URL('../assets/developer-suite.js', import.meta.url),'utf8');
async function developer(type,input,expected){let result;const context={value:n=>String(input[n]??'').trim(),required:n=>String(input[n]??'').trim(),parseJson:n=>JSON.parse(input[n]),show:(...a)=>result=a,fail:(n,e)=>{throw Error(e)},formatNumber:n=>Number(n).toLocaleString('ko-KR'),TextEncoder,TextDecoder,crypto:webcrypto,URL,atob,btoa};await vm.runInNewContext(dev.slice(dev.indexOf('  const diffJson'),dev.indexOf('\n  const updateConditionalFields'))+`\nhandlers[${JSON.stringify(type)}]();`,context);check(result,expected);}
await developer('css-minifier',{source:'p { color: red; }'},['5자 감소','p{color:red}']);
await developer('css-minifier',{source:'/* note */ p { margin: 0; }'},['p{margin:0}']);
await developer('base-converter',{source:'20000000000001',from:16,to:10},['9007199254740993']);
await developer('base-converter',{source:'Z',from:36,to:10},['35']);
await developer('base-converter',{source:'10',from:36,to:10},['36']);
for(const source of ['1704067200','1704067200000'])await developer('timestamp-converter',{source,mode:'timestamp'},['2024-01-01T00:00:00.000Z']);
await developer('timestamp-converter',{source:'0',mode:'timestamp'},['1970-01-01T00:00:00.000Z']);
for(const source of ['abc',' abc\n'])await developer('hash-generator',{source,algorithm:'SHA-256'},['ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad']);
await developer('unicode-inspector',{source:'가'},['U+AC00','EA B0 80']);
await developer('unicode-inspector',{source:'😀'},['U+1F600','F0 9F 98 80','0xD83D 0xDE00']);
await developer('subnet-calculator',{ip:'192.168.1.10',prefix:24},['192.168.1.0','192.168.1.255','254']);
console.log(`${count} content examples verified against actual calculation code.`);
