import * as THREE from 'three';
import {WEAPONS,ITEMS,RARITY,AMMO,clamp,lerp,mulberry32} from './data.js';
import * as W from './world.js';
import {wstat,makeWeaponModel,mat} from './shared.js';
const NW=WEAPONS.length;
const WEAPON_W=WEAPONS.map((w,i)=>i===0?0:(w.t==='ar'?10:w.t==='smg'?8:w.t==='sg'?8:w.t==='sn'?4:w.t==='pi'?7:w.t==='ex'?3.5:w.t==='melee'?1.5:5));
function pick(rng,ws){let t=0;for(const w of ws)t+=w;let r=rng()*t;for(let i=0;i<ws.length;i++){r-=ws[i];if(r<=0)return i}return ws.length-1}
export function rollRarity(rng,boost=1,min=0){const ws=RARITY.map((r,i)=>i<min?0:r.w*(i>=2?boost:1));return pick(rng,ws)}
export function rollItem(rng,q=1,min=0){
 const k=rng();
 if(k<.22||min>0&&k<.8){const w=pick(rng,WEAPON_W);const r=rollRarity(rng,q,min);return{k:'w',w,r,mag:wstat(w,r).mag}}
 if(k<.42){const types=Object.keys(AMMO);const t=types[pick(rng,[10,8,6,3,1.5])];return{k:'a',t,n:AMMO[t].box}}
 const its=['bandage','minishield','medkit','bigshield','chug','grapple','pad','frag','boogie','banana'];const ws=[9,8,3.5,2.5,.7,2.2,2,2.8,1.4,1.6];const id=its[pick(rng,ws)];return{k:'i',id,n:ITEMS[id].give}}
export function rollWeapon(rng,q=1,min=0){const w=pick(rng,WEAPON_W);const r=rollRarity(rng,q,min);return{k:'w',w,r,mag:wstat(w,r).mag}}
export function itemName(it){if(it.k==='w')return RARITY[it.r].n+' '+WEAPONS[it.w].n;if(it.k==='i')return ITEMS[it.id].n+(it.n>1?' x'+it.n:'');return AMMO[it.t].n+' Ammo x'+it.n}
export function itemColor(it){if(it.k==='w')return RARITY[it.r].c;if(it.k==='i')return ITEMS[it.id].col;return AMMO[it.t].c}
// ---- item pickup visuals: bespoke models per weapon / item / ammo, each with its own idle animation (no light beams)
let LV_G=null;
function lvGeo(){return LV_G||(LV_G={
 bx:new THREE.BoxGeometry(1,1,1),cy:new THREE.CylinderGeometry(.5,.5,1,14),sp:new THREE.SphereGeometry(.5,12,9),
 co:new THREE.CylinderGeometry(0,.5,1,12),to:new THREE.TorusGeometry(.5,.12,6,18),oc:new THREE.SphereGeometry(.5,6,4),
 ring:new THREE.TorusGeometry(.5,.02,4,36),spark:new THREE.SphereGeometry(.05,6,5),disc:new THREE.CylinderGeometry(.5,.5,.01,20)})}
function glowMat(c,opacity){return new THREE.MeshBasicMaterial({color:c,transparent:true,opacity,depthWrite:false,fog:false,blending:THREE.AdditiveBlending})}
// part: geometry key, colour, position, scale, options {e:emissive, u:unique unlit mat, rx/ry/rz, an:[type,speed,amp,phase]}
function lvP(k,c,x,y,z,sx,sy,sz,o){
 const m=new THREE.Mesh(lvGeo()[k],o&&o.u?new THREE.MeshBasicMaterial({color:c,fog:false}):mat(c,o&&o.e));
 m.position.set(x,y,z);m.scale.set(sx,sy,sz);
 if(o){if(o.rx)m.rotation.x=o.rx;if(o.ry)m.rotation.y=o.ry;if(o.rz)m.rotation.z=o.rz;if(o.an)m.userData.an=o.an}
 return m}
function lvGrp(x,y,z,an,ry){const g=new THREE.Group();g.position.set(x,y,z);if(ry)g.rotation.y=ry;if(an)g.userData.an=an;return g}
const LPI=Math.PI,LH=LPI/2;
function lvWeapon(w,r){
 const d=WEAPONS[w],n=d.n,c=d.col,g=new THREE.Group(),DK='#1b1d22',MD='#2c3038',MT='#9aa2ad',WD='#7a5230',GD='#e8b830';
 const A=(...a)=>{const m=lvP(...a);g.add(m);return m};
 const BAR=(col,z0,z1,rad,y,x,o)=>A('cy',col,x||0,y,(z0+z1)/2,rad*2,Math.abs(z1-z0),rad*2,Object.assign({rx:LH},o));
 switch(n){
 case'Pickaxe':A('cy',WD,0,0,.05,.07,1.05,.07,{rx:LH});A('cy','#3a7ad0',0,0,.38,.09,.12,.09,{rx:LH});A('bx',MT,0,0,-.48,.72,.08,.11);A('co',MT,.42,0,-.48,.1,.24,.1,{rz:-LH});A('co',MT,-.42,0,-.48,.1,.24,.1,{rz:LH});A('bx','#cfd6dd',0,.05,-.48,.2,.05,.13);break;
 case'Tactical AR':A('bx',MD,0,0,0,.09,.12,.5);BAR(DK,-.25,-.72,.025,.02);A('bx',c,0,.01,-.42,.1,.1,.34);A('bx',DK,0,.09,-.05,.06,.04,.46);A('bx',DK,0,-.14,0,.06,.22,.08,{rx:.22});A('bx',DK,0,-.12,.2,.05,.14,.05,{rx:-.3});A('bx',c,0,-.02,.42,.08,.16,.3);A('bx','#ff3b3b',0,.14,-.1,.05,.06,.1,{e:'#ff3b3b',an:['pul',4,.2]});A('cy',MT,0,.02,-.74,.06,.08,.06,{rx:LH});break;
 case'Bulldog AR':A('bx',c,0,0,.12,.1,.15,.55);BAR(DK,-.16,-.6,.028,.03);A('bx',WD,0,-.01,-.34,.11,.09,.3);A('bx',DK,0,-.15,.28,.06,.22,.09,{rx:-.1});A('bx',DK,0,-.12,.0,.05,.14,.05,{rx:.3});A('bx',DK,0,.1,.12,.03,.05,.04);A('bx',DK,0,.09,-.5,.03,.05,.03);A('bx',WD,0,-.02,.5,.08,.16,.18);break;
 case'Scoped Scout':A('bx',MD,0,0,.05,.08,.11,.55);BAR(DK,-.2,-.9,.022,.01);A('bx',c,0,-.02,.55,.08,.15,.3);BAR('#222',-.38,.12,.055,.15);A('cy','#6ad0ff',0,.15,-.4,.08,.02,.08,{rx:LH,e:'#2a8fc0',an:['pul',3,.15]});A('cy',DK,0,.15,.13,.07,.03,.07,{rx:LH});A('bx',DK,.04,-.12,-.55,.015,.2,.015,{rz:-.3});A('bx',DK,-.04,-.12,-.55,.015,.2,.015,{rz:.3});A('bx',DK,0,-.12,.0,.05,.2,.07,{rx:.2});break;
 case'Compact SMG':A('bx',c,0,0,0,.1,.13,.42);BAR(DK,-.2,-.5,.03,.03);A('bx',DK,0,-.2,-.02,.055,.3,.08);A('bx',DK,0,-.1,.18,.05,.14,.06,{rx:-.3});A('bx',MT,0,.0,.3,.03,.1,.24);A('bx',MT,0,.07,.2,.03,.03,.2);A('bx','#ffcf3d',0,.09,-.1,.04,.03,.06,{e:'#a07a00'});break;
 case'Buzzsaw SMG':A('bx',c,0,0,0,.11,.14,.46);A('bx',DK,0,-.15,.05,.05,.22,.08);A('bx',MD,0,-.02,.3,.08,.14,.22);BAR(DK,-.22,-.45,.03,.03);{const s=lvGrp(.075,.0,-.38,['sx',9]);s.add(lvP('cy','#d8dde3',0,0,0,.34,.025,.34,{rz:LH}));s.add(lvP('cy','#7a2d78',0,0,0,.1,.04,.1,{rz:LH}));for(let i=0;i<8;i++){const a=i/8*LPI*2;s.add(lvP('bx','#d8dde3',0,Math.cos(a)*.18,Math.sin(a)*.18,.03,.07,.07,{rx:a}))}g.add(s)}break;
 case'Silent SMG':A('bx',c,0,0,0,.1,.13,.44);BAR('#15171b',-.2,-.78,.045,.03);A('bx',MD,0,-.2,.0,.05,.26,.08,{rx:.1});A('bx',MD,0,-.02,.32,.07,.12,.24);for(let i=0;i<4;i++)A('cy',MT,0,.03,-.3-i*.13,.095,.01,.095,{rx:LH});break;
 case'Pump Shotgun':BAR(c,-.8,.1,.04,.02);BAR('#3a3a3a',-.7,0,.03,-.04);A('bx',WD,0,-.04,-.3,.1,.09,.28,{an:['slide',3,.14]});A('bx',MD,0,0,.12,.09,.13,.3);A('bx',WD,0,-.04,.48,.09,.17,.36);A('bx',MT,0,.0,-.84,.025,.035,.025);break;
 case'Tac Shotgun':A('bx',c,0,0,0,.1,.13,.5);BAR(DK,-.25,-.78,.04,.02);BAR('#444',-.25,-.7,.03,-.05);A('bx',DK,0,.08,-.25,.05,.04,.56);A('bx','#d84a3a',.075,-.01,-.1,.035,.06,.18);A('bx','#d84a3a',-.075,-.01,-.1,.035,.06,.18);A('bx',MD,0,-.02,.38,.08,.15,.3);A('bx',DK,0,-.13,.06,.05,.14,.06,{rx:-.3});break;
 case'Double Barrel':BAR(MT,-.8,.1,.035,.03,.04);BAR(MT,-.8,.1,.035,.03,-.04);A('bx',MD,0,0,.08,.15,.12,.2);A('bx',WD,0,-.04,-.35,.16,.07,.26);A('bx',WD,0,-.04,.42,.09,.18,.42,{rx:-.08});A('bx',GD,0,0,.18,.17,.03,.04);A('bx',MT,0,.08,.12,.02,.07,.03,{rx:-.5});break;
 case'Bolt Sniper':A('bx',c,0,0,.1,.08,.11,.7);BAR(DK,-.35,-1.15,.022,.01);A('cy',DK,0,.01,-1.13,.06,.1,.06,{rx:LH});A('bx',c,0,-.03,.62,.08,.17,.36);BAR('#1d242a',-.45,.12,.065,.14);A('cy','#6ad0ff',0,.14,-.46,.1,.02,.1,{rx:LH,e:'#2a8fc0',an:['pul',2.5,.2]});A('cy',DK,0,.14,.13,.09,.03,.09,{rx:LH});A('bx',MT,.07,.03,.15,.03,.03,.1,{an:['wy',2.5,.3]});A('bx',DK,.05,-.14,-.7,.015,.24,.015,{rz:-.3});A('bx',DK,-.05,-.14,-.7,.015,.24,.015,{rz:.3});break;
 case'DMR':A('bx',MD,0,0,.05,.09,.12,.6);BAR(DK,-.25,-.85,.024,.02);A('bx',c,0,0,-.45,.1,.09,.4);A('bx',DK,0,-.17,.0,.06,.24,.09);A('bx',c,0,-.03,.5,.08,.17,.32);BAR('#26301f',-.3,.1,.045,.13);A('cy','#6aff8a',0,.13,-.32,.07,.02,.07,{rx:LH,e:'#20a040'});A('bx',MT,0,.0,-.86,.05,.05,.07);break;
 case'Pistol':A('bx',c,0,.03,-.1,.07,.1,.4);A('bx',DK,0,-.09,.06,.065,.2,.09,{rx:.3});A('bx',MD,0,-.03,-.06,.05,.04,.1);A('bx',MT,0,.09,.06,.03,.03,.04);A('bx',DK,0,-.015,-.18,.02,.01,.1);BAR(DK,-.3,-.4,.025,.04);break;
 case'Hand Cannon':A('bx',c,0,.03,-.2,.09,.12,.5);A('cy',MT,0,0,-.0,.17,.1,.17,{rx:LH,an:['sz',1.4]});A('bx',DK,0,-.11,.1,.08,.22,.11,{rx:.3});A('bx',MT,0,.1,-.46,.03,.04,.03);A('bx',MT,0,.09,.12,.04,.07,.06,{rx:-.4});BAR('#cfd6dd',-.3,-.52,.04,.04);break;
 case'Rocket Launcher':BAR(c,-.55,.55,.11,.02);A('cy',DK,0,.02,.6,.27,.08,.27,{rx:LH});A('cy',MD,0,.02,-.6,.3,.1,.3,{rx:LH});A('co','#ff4a3a',0,.02,-.7,.18,.2,.18,{rx:-LH,e:'#a01808',an:['pul',3,.1]});A('bx',DK,0,-.17,0,.06,.2,.09);A('bx',DK,0,-.14,-.3,.05,.14,.05);A('bx',MT,0,.16,-.2,.04,.1,.2);A('bx','#ffd23d',0,.02,.1,.23,.02,.12);break;
 case'Grenade Launcher':A('bx',c,0,0,.15,.1,.14,.5);BAR(DK,-.1,-.62,.07,.02);A('cy',MT,0,.0,.02,.24,.2,.24,{rx:LH,an:['sz',1.2]});for(let i=0;i<6;i++){const a=i/6*LPI*2;A('cy','#ffcf3d',Math.cos(a)*.1,Math.sin(a)*.1,-.09,.07,.02,.07,{rx:LH,e:'#8a6a00'})}A('bx',DK,0,-.14,.12,.06,.18,.08);A('bx',MD,0,-.02,.5,.08,.15,.26);A('bx',MT,0,.11,-.1,.03,.07,.03);break;
 case'Banana Blaster':A('bx','#ffe14a',0,-.04,.05,.12,.12,.34,{rx:-.3});A('bx','#ffe14a',0,.02,-.27,.12,.12,.34,{rx:.0});A('bx','#ffe14a',0,.1,-.56,.12,.12,.3,{rx:.5});A('bx','#5a3a10',0,.2,-.7,.09,.09,.1,{rx:.5});A('bx','#6a4a1a',0,-.15,.05,.06,.2,.09);A('sp','#ffffff',.06,.04,-.3,.05,.05,.05);A('sp','#222',.07,.04,-.3,.025,.025,.025);break;
 case'Rubber Chicken Cannon':{const b=lvGrp(0,0,-.2,['wz',2.6,.1]);g.add(b);b.add(lvP('sp','#fff08a',0,0,0,.4,.36,.52));b.add(lvP('sp','#fff08a',0,.17,-.3,.22,.22,.22));b.add(lvP('co','#ff9a2a',0,.16,-.46,.09,.14,.09,{rx:-LH}));b.add(lvP('bx','#e83a3a',0,.31,-.3,.04,.08,.12,{an:['wz',6,.2]}));b.add(lvP('bx','#ffe566',.21,.02,0,.04,.2,.28,{rz:.4,an:['wz',5,.3]}));b.add(lvP('bx','#ffe566',-.21,.02,0,.04,.2,.28,{rz:-.4,an:['wz',5,.3,LPI]}));b.add(lvP('sp','#222',.07,.2,-.38,.04,.04,.04));b.add(lvP('sp','#222',-.07,.2,-.38,.04,.04,.04));BAR('#555',.05,.5,.07,.0)}break;
 case'Confetti Cannon':A('co','#ff6bd6',0,0,-.4,.34,.7,.34,{rx:-LH});A('cy','#ffd23d',0,0,-.1,.2,.06,.2,{rx:LH});A('cy','#6bd6ff',0,0,-.25,.26,.06,.26,{rx:LH});A('bx',DK,0,-.14,.12,.06,.2,.08);BAR('#444',.0,.4,.06,.0);for(let i=0;i<7;i++){const a=i*.9;A('bx',['#ff4a8a','#ffd23d','#4aa8ff','#4aff8a'][i%4],Math.cos(a)*.22,.2+Math.sin(a*1.7)*.1,-.78+Math.sin(a)*.12,.05,.05,.01,{u:1,an:['rise',.8,.3,i*.7]})}break;
 case'Bouncy Ball Gun':A('bx','#3cd0ff',0,0,.05,.1,.13,.45);BAR('#222',-.18,-.6,.035,.02);A('bx','#1a7ab0',0,-.14,.1,.06,.2,.08);A('bx',MD,0,-.02,.36,.08,.14,.2);A('cy','#bfe8ff',0,.16,-.1,.22,.18,.22,{e:'#4a90c0'});A('sp','#ff4a8a',0,.2,-.1,.14,.14,.14,{e:'#a01850',an:['bnc',4,.07]});break;
 case'Frying Pan':A('cy','#2b2b2b',0,0,-.38,.46,.06,.46,{rx:LH});A('cy','#3a3a3a',0,.02,-.38,.38,.04,.38,{rx:LH});A('bx','#8a5a2a',0,0,.1,.07,.06,.5);A('sp','#fffdf0',0,.05,-.38,.2,.04,.2);A('sp','#ffc414',0,.07,-.38,.09,.06,.09,{e:'#a07000',an:['pul',3,.12]});A('bx',MT,0,0,-.04,.08,.04,.05);break;
 case'Disco Laser':A('bx','#ff3dff',0,0,.0,.11,.14,.46);BAR(DK,-.2,-.6,.035,.03);A('sp','#ff9dff',0,.0,-.64,.1,.1,.1,{u:1,an:['pul',5,.25]});A('bx',DK,0,-.14,.08,.06,.2,.08);A('bx',MD,0,0,.3,.08,.14,.2);{const b=lvGrp(0,.16,-.02,['sy',4]);b.add(lvP('oc','#dfe6ff',0,0,0,.2,.2,.2,{e:'#6070c0'}));for(let i=0;i<5;i++){const a=i*1.26;b.add(lvP('bx',['#ff4aff','#4affff','#ffff4a'][i%3],Math.cos(a)*.1,(i%2?.04:-.04),Math.sin(a)*.1,.04,.04,.04,{u:1,an:['hue',1.3,0,i*.2]}))}g.add(b)}break;
 case'Sticky Bomb Launcher':A('bx',c,0,0,.1,.12,.15,.5);BAR(DK,-.12,-.6,.085,.02);A('bx',MD,0,-.15,.1,.06,.2,.08);A('bx',MD,0,0,.5,.09,.15,.24);A('sp','#8aff3a',.06,-.06,-.5,.07,.12,.07,{e:'#3a9010',an:['bnc',2,.04]});A('sp','#8aff3a',-.05,.0,-.62,.06,.1,.06,{e:'#3a9010'});A('sp','#6bd62a',0,.11,-.2,.2,.2,.2,{e:'#2a7010',an:['pul',2.5,.06]});A('sp','#ff3a3a',0,.19,-.2,.04,.04,.04,{u:1,an:['pul',7,.5]});break;
 case'Potato Cannon':BAR('#b08a55',-.45,.3,.1,.02);A('cy','#d8d0c0',0,.02,.02,.21,.08,.21,{rx:LH});A('cy','#d8d0c0',0,.02,-.35,.21,.06,.21,{rx:LH});A('sp','#9a6a3a',0,.02,-.52,.2,.18,.24,{an:['wz',4,.1]});A('sp','#6a4a2a',.05,.06,-.62,.025,.025,.025);A('sp','#6a4a2a',-.04,0,-.63,.025,.025,.025);A('bx',DK,0,-.14,.2,.06,.2,.08);A('bx','#cfd6dd',0,.15,.1,.03,.04,.2);break;
 case'Fish Slapper':{const f=lvGrp(0,0,-.1,['wy',5,.12]);g.add(f);f.add(lvP('sp','#5ab0d0',0,0,0,.2,.26,.62));f.add(lvP('sp','#e8f4ff',0,-.06,.0,.17,.16,.5));f.add(lvP('bx','#3a80a0',0,.15,0,.03,.14,.3));{const t=lvGrp(0,0,.3,['wy',9,.5]);t.add(lvP('co','#3a80a0',0,0,.12,.04,.3,.3,{rx:LH}));f.add(t)}f.add(lvP('sp','#fff',.09,.05,-.2,.07,.07,.07));f.add(lvP('sp','#111',.11,.05,-.2,.035,.035,.035));f.add(lvP('sp','#fff',-.09,.05,-.2,.07,.07,.07));f.add(lvP('sp','#111',-.11,.05,-.2,.035,.035,.035))}break;
 case'Pirate Blunderbuss':BAR('#6a5a3a',-.55,.15,.04,.02);A('co','#b8892c',0,.02,-.62,.26,.34,.26,{rx:LH});A('cy',GD,0,.02,-.2,.1,.05,.1,{rx:LH});A('cy',GD,0,.02,.0,.1,.04,.1,{rx:LH});A('bx',MD,0,0,.2,.09,.13,.22);A('bx',WD,0,-.05,.55,.09,.18,.4,{rx:-.1});A('bx',MT,0,.1,.18,.03,.09,.05,{rx:-.5,an:['wx',3,.3]});A('bx',GD,0,-.04,.2,.1,.03,.12);break;
 default:return makeWeaponModel(w,r)}
 return g}
function lvItem(id,c){
 const g=new THREE.Group(),A=(...a)=>{const m=lvP(...a);g.add(m);return m};
 switch(id){
 case'bandage':{const b=lvGrp(0,0,0,['wx',2.4,.1]);g.add(b);b.add(lvP('cy','#f4f4f4',0,0,0,.36,.26,.36,{rx:LH}));b.add(lvP('cy','#ff5a5a',0,0,0,.37,.05,.37,{rx:LH}));b.add(lvP('cy','#bdbdbd',0,0,0,.14,.28,.14,{rx:LH}));const s=lvGrp(0,-.17,.1,['wx',3,.28]);s.add(lvP('bx','#fafafa',0,0,.18,.26,.012,.36));s.add(lvP('bx','#ff7a7a',0,.01,.3,.26,.01,.04));b.add(s)}break;
 case'medkit':{A('bx','#f2f2f2',0,-.06,0,.56,.28,.38);A('bx','#ff4d4d',0,-.06,.195,.57,.07,.01);A('to','#555',0,.12,.0,.22,.12,.22,{rx:LH});const l=lvGrp(0,.08,-.19,['open',1.8,.28]);l.add(lvP('bx','#f8f8f8',0,.03,.19,.58,.08,.4));l.add(lvP('bx','#ff3a3a',0,.075,.19,.34,.02,.1,{e:'#ff3a3a',an:['pul',3,.15]}));l.add(lvP('bx','#ff3a3a',0,.075,.19,.1,.02,.34,{e:'#ff3a3a',an:['pul',3,.15]}));g.add(l);A('bx','#ffffff',0,-.18,0,.5,.02,.34,{u:1})}break;
 case'minishield':A('cy','#46b6ff',0,-.06,0,.28,.3,.28,{e:'#1c6ab0'});A('cy','#8ad4ff',0,-.03,0,.2,.2,.2,{u:1,an:['bob',3,.015]});A('cy','#bfe6ff',0,.15,0,.11,.14,.11);A('cy','#a0743c',0,.25,0,.14,.06,.14);for(let i=0;i<3;i++)A('sp','#e8f8ff',(i-1)*.06,-.05,(i%2?.05:-.05),.05,.05,.05,{u:1,an:['rise',.6+i*.1,.3,i*.37]});break;
 case'bigshield':{const f=lvGrp(0,0,0,['wz',1.6,.1]);g.add(f);f.add(lvP('sp','#2d6bff',0,-.05,0,.46,.44,.46,{e:'#1d4bd0'}));f.add(lvP('sp','#7aa8ff',0,-.1,0,.34,.3,.34,{u:1}));f.add(lvP('cy','#bcd4ff',0,.2,0,.15,.18,.15));f.add(lvP('cy','#a0743c',0,.31,0,.17,.06,.17));const rg=lvGrp(0,-.03,0,['sy',2.6]);for(let i=0;i<4;i++){const a=i*LH;rg.add(lvP('bx','#7ad0ff',Math.cos(a)*.42,0,Math.sin(a)*.42,.07,.07,.07,{u:1}))}g.add(rg)}break;
 case'chug':{const j=lvGrp(0,0,0,['wz',2.2,.14]);g.add(j);j.add(lvP('cy','#ae5dff',0,-.03,0,.36,.38,.36,{e:'#6a2db0'}));j.add(lvP('sp','#ae5dff',0,.17,0,.34,.2,.34,{e:'#6a2db0'}));j.add(lvP('cy','#ffd23d',0,.3,0,.13,.08,.13,{an:['wy',4,.4]}));j.add(lvP('to','#8a45d6',.22,.07,0,.22,.22,.22));j.add(lvP('bx','#ffd23d',0,-.03,.185,.22,.14,.01));j.add(lvP('bx','#6a2db0',0,-.03,.195,.1,.08,.01))}break;
 case'grapple':{A('bx','#3a3a3a',0,-.15,0,.1,.3,.1);A('cy','#888',0,.03,0,.16,.06,.16);A('to','#d9b66a',.2,-.1,0,.36,.36,.36,{rx:LH,an:['wz',2,.12]});for(let i=0;i<3;i++){const p=lvGrp(0,.06,0,null,i*LPI*2/3);const q=lvGrp(0,0,0,['wz',2.6,.22,i]);q.add(lvP('co','#ffd23d',.1,.12,0,.08,.3,.08,{rz:-.45}));p.add(q);g.add(p)}}break;
 case'pad':A('cy','#1f2a24',0,-.14,0,.64,.08,.64);A('cy','#2dff8f',0,-.09,0,.54,.03,.54,{e:'#17a05a',an:['pul',3,.04]});for(let i=0;i<3;i++){const ch=lvGrp(0,-.1,0,['rise',.9,.5,i/3]);ch.add(lvP('bx','#7affb8',-.09,0,0,.2,.05,.05,{rz:.65,u:1}));ch.add(lvP('bx','#7affb8',.09,0,0,.2,.05,.05,{rz:-.65,u:1}));g.add(ch)}break;
 case'frag':{const w=lvGrp(0,0,0,['wz',2.4,.12]);g.add(w);w.add(lvP('sp','#6b8f3a',0,-.02,0,.36,.4,.36,{e:'#2a4012'}));w.add(lvP('cy','#3b5320',0,.0,0,.37,.03,.37));w.add(lvP('cy','#3b5320',0,-.1,0,.34,.03,.34));w.add(lvP('cy','#555',0,.2,0,.12,.1,.12));w.add(lvP('bx','#999',.09,.18,0,.04,.04,.26,{rx:0,rz:-.2,an:['wz',4,.12]}));w.add(lvP('to','#ffd23d',.12,.26,0,.17,.17,.17,{an:['wy',3,.6]}))}break;
 case'boogie':{A('cy','#777',0,.27,0,.03,.14,.03);const b=lvGrp(0,0,0,['sy',3]);g.add(b);b.add(lvP('oc','#ff55ff',0,0,0,.44,.44,.44,{e:'#a010a0'}));for(let i=0;i<12;i++){const a=i*2.4,y=(i%5-2)*.07,rr=Math.sqrt(Math.max(0,.0484-y*y));b.add(lvP('bx',['#ff4aff','#4affff','#ffff4a','#ffffff'][i%4],Math.cos(a)*(rr+.02),y,Math.sin(a)*(rr+.02),.07,.07,.07,{u:1,an:['hue',1.6,0,i*.13]}))}}break;
 case'banana':{A('bx','#ffd91f',0,.04,0,.1,.3,.1,{rz:.35});A('bx','#ffd91f',-.06,.22,0,.09,.2,.09,{rz:.8});A('bx','#5a3a10',-.16,.3,0,.07,.07,.07);for(let i=0;i<3;i++){const p=lvGrp(0,-.1,0,null,i*LPI*2/3);p.add(lvP('bx','#ffe14a',.14,0,0,.3,.04,.14,{rz:-.5,an:['wz',2.4,.18,i*1.3]}));g.add(p)}}break;
 default:A('bx',c,0,0,0,.3,.3,.3,{e:c})}
 return g}
function lvAmmo(t,c){
 const g=new THREE.Group(),A=(...a)=>{const m=lvP(...a);g.add(m);return m};
 const tray=(w)=>A('bx','#33363d',0,-.17,0,w,.05,.26);
 if(t==='light'){tray(.66);for(let i=0;i<3;i++){const x=(i-1)*.2;A('cy','#d9a93a',x,-.03,0,.12,.26,.12,{an:['bob',3,.03,i]});A('co','#c98a2a',x,.17,0,.12,.14,.12,{an:['bob',3,.03,i]})}}
 else if(t==='med'){tray(.66);for(let i=0;i<3;i++){const x=(i-1)*.2;A('cy','#cfd6dd',x,-.01,0,.14,.3,.14,{an:['bob',3,.03,i]});A('co','#e07a2a',x,.2,0,.14,.16,.14,{an:['bob',3,.03,i]})}}
 else if(t==='shells'){tray(.66);for(let i=0;i<3;i++){const x=(i-1)*.2;A('cy','#e04a4a',x,0,0,.16,.28,.16,{an:['bob',3,.03,i]});A('cy','#d9a93a',x,-.11,0,.17,.08,.17,{an:['bob',3,.03,i]})}}
 else if(t==='heavy'){tray(.62);for(let i=0;i<2;i++){const x=(i-.5)*.26;A('cy','#cfd6dd',x,0,0,.14,.38,.14,{an:['bob',2.6,.03,i]});A('co','#4ab8ff',x,.26,0,.14,.18,.14,{e:'#1a6aa0',an:['bob',2.6,.03,i]})}}
 else{const r=lvGrp(0,0,0,['wz',2.2,.16]);g.add(r);r.add(lvP('cy','#5a8a3a',0,-.02,0,.16,.5,.16,{e:'#2a5a10'}));r.add(lvP('co','#ff4a3a',0,.3,0,.16,.16,.16,{e:'#a01808'}));for(let i=0;i<3;i++){const a=i*LPI*2/3;r.add(lvP('bx','#cfd6dd',Math.cos(a)*.1,-.22,Math.sin(a)*.1,.02,.14,.12,{ry:-a}))}r.add(lvP('cy','#ffa63a',0,-.3,0,.1,.04,.1,{u:1,an:['pul',8,.3]}))}
 return g}
function lvChest(l){
 const g=new THREE.Group(),sup=!!l.supply,isChest=!!l.chest;
 const col=sup?'#d83030':isChest?'#b87818':'#4a6a3a',trim=sup?'#ffcf5a':isChest?'#ffd23d':'#6a8a4a';
 const A=(...a)=>{const m=lvP(...a);g.add(m);return m};
 if(isChest){A('bx',col,0,.3,0,1.1,.6,.72);A('bx',trim,.42,.3,0,.08,.62,.76);A('bx',trim,-.42,.3,0,.08,.62,.76);A('bx',trim,0,.02,0,1.14,.06,.76);A('bx',trim,0,.52,.38,.16,.18,.06,{e:'#aa7a00',an:['pul',2.6,.12]});
  const lid=lvGrp(0,.6,-.34,['open',1.4,.12]);lid.add(lvP('cy',col,0,0,.34,.72,1.1,.72,{rz:LH}));lid.add(lvP('bx',trim,.42,0,.34,.08,.74,.76));lid.add(lvP('bx',trim,-.42,0,.34,.08,.74,.76));g.add(lid);
  for(let i=0;i<5;i++)A('bx',sup?'#ffe08a':'#ffe97a',Math.cos(i*1.26)*.55,.7,Math.sin(i*1.26)*.35,.07,.07,.07,{u:1,an:['rise',.45+i*.05,.9,i*.21]})}
 else{A('bx',col,0,.26,0,1,.46,.64);A('bx','#33432a',0,.08,0,1.04,.08,.68);A('bx','#2a3a22',0,.36,.33,.5,.12,.01);
  const lid=lvGrp(0,.5,-.32,['open',1.5,.14]);lid.add(lvP('bx',trim,0,.03,.32,1.04,.08,.68));g.add(lid);
  for(let i=0;i<4;i++)A('cy','#d9a93a',(i-1.5)*.2,.58,0,.1,.12,.1,{an:['bob',3,.03,i]});
  for(let i=0;i<3;i++)A('bx','#b8f08a',Math.cos(i*2.1)*.5,.7,Math.sin(i*2.1)*.3,.06,.06,.06,{u:1,an:['rise',.5+i*.07,.7,i*.31]})}
 return g}
function lvCollect(root){const parts=[];root.traverse(o=>{if(o.userData&&o.userData.an){o.userData.b={x:o.position.x,y:o.position.y,z:o.position.z,rx:o.rotation.x,ry:o.rotation.y,rz:o.rotation.z,sx:o.scale.x,sy:o.scale.y,sz:o.scale.z};parts.push(o)}});return parts}
function lvAnimPart(m,t,dt){
 const a=m.userData.an,ty=a[0],sp=a[1]||1,am=a[2]===undefined?.2:a[2],ph=a[3]||0,b=m.userData.b,s=Math.sin(t*sp+ph);
 switch(ty){
 case'sx':m.rotation.x+=dt*sp;break;case'sy':m.rotation.y+=dt*sp;break;case'sz':m.rotation.z+=dt*sp;break;
 case'wx':m.rotation.x=b.rx+s*am;break;case'wy':m.rotation.y=b.ry+s*am;break;case'wz':m.rotation.z=b.rz+s*am;break;
 case'bob':m.position.y=b.y+s*am;break;
 case'bnc':m.position.y=b.y+Math.abs(s)*am;break;
 case'slide':m.position.z=b.z+(.5+.5*s)*am;break;
 case'pul':{const k=1+s*am;m.scale.set(b.sx*k,b.sy*k,b.sz*k);break}
 case'rise':{const k=((t*sp+ph)%1+1)%1,f=Math.sin(k*LPI);m.position.y=b.y+k*am;m.scale.set(b.sx*f,b.sy*f,b.sz*f);break}
 case'hue':m.material.color.setHSL(((t*sp+ph)%1+1)%1,.9,.6);break;
 case'open':m.rotation.x=b.rx-(.12+(.5+.5*s)*am);break;
 }}
export function makeItemLootVis(l){
 const it=l.item,c=itemColor(it),G=lvGeo();let m;
 if(it.k==='w'){m=lvWeapon(it.w,it.r);m.scale.setScalar(1.15);m.rotation.y=Math.PI/2;const bb=new THREE.Box3().setFromObject(m),ctr=bb.getCenter(new THREE.Vector3());m.position.sub(ctr)}
 else if(it.k==='i')m=lvItem(it.id,c);
 else m=lvAmmo(it.t,c);
 const g=new THREE.Group(),rar=it.k==='w'?it.r:0;
 const shadow=new THREE.Mesh(G.disc,new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.25,depthWrite:false,fog:false}));shadow.position.y=.03;shadow.scale.set(.8,1,.8);g.add(shadow);
 const ground=new THREE.Mesh(G.ring,glowMat(c,.5));ground.rotation.x=Math.PI/2;ground.position.y=.05;g.add(ground);
 const ripple=new THREE.Mesh(G.ring,glowMat(c,.4));ripple.rotation.x=Math.PI/2;ripple.position.y=.06;g.add(ripple);
 const float=new THREE.Group();g.add(float);
 const spinner=new THREE.Group();spinner.add(m);float.add(spinner);
 const hr=it.k==='w'?.8:.5;
 const halo=new THREE.Mesh(G.ring,glowMat(c,.8));halo.scale.setScalar(hr/.5);float.add(halo);
 let halo2=null,rise=null;
 if(rar>=3){halo2=new THREE.Mesh(G.ring,glowMat(c,.6));halo2.scale.setScalar(hr/.5*.9);halo2.rotation.x=Math.PI/2.4;float.add(halo2)}
 if(rar>=4){rise=new THREE.Mesh(G.ring,glowMat(c,.5));rise.rotation.x=Math.PI/2;g.add(rise)}
 const orbit=new THREE.Group();float.add(orbit);const sparkMat=new THREE.MeshBasicMaterial({color:c,fog:false});
 const ns=it.k==='w'?Math.min(7,3+rar):3;
 for(let k=0;k<ns;k++){const s=new THREE.Mesh(G.spark,sparkMat);const a=k/ns*Math.PI*2;s.position.set(Math.cos(a)*hr,Math.sin(k*1.7)*.12,Math.sin(a)*hr);orbit.add(s)}
 Object.assign(g.userData,{lootvis:1,an:1,float,spinner,halo,halo2,rise,orbit,ground,ripple,shadow,rar,parts:lvCollect(m),phase:l.id*2.399});
 return g}
export function makeChestVis(l){
 const g=new THREE.Group(),G=lvGeo(),col=l.supply?'#ff5a3d':l.chest?'#ffd23d':'#8aff6a';
 const inner=lvChest(l);const sc=l.supply?1.8:1;inner.scale.setScalar(sc);g.add(inner);
 const ground=new THREE.Mesh(G.ring,glowMat(col,.5));ground.rotation.x=Math.PI/2;ground.position.y=.05;ground.scale.setScalar(2.6*sc);g.add(ground);
 const ripple=new THREE.Mesh(G.ring,glowMat(col,.4));ripple.rotation.x=Math.PI/2;ripple.position.y=.06;g.add(ripple);
 Object.assign(g.userData,{lootvis:1,an:1,chest:true,popT:inner,sc,ground,ripple,rr:2.6*sc,parts:lvCollect(inner),phase:l.id*1.7});
 return g}
export function animLootMesh(g,dt,t,cam){
 const u=g.userData,ph=u.phase||0;
 if(u.born===undefined)u.born=t;
 const age=t-u.born;
 let ex=u.ex||0;
 if(cam){const dx=g.position.x-cam.x,dz=g.position.z-cam.z,nr=dx*dx+dz*dz<(u.chest?30:20)?1:0;ex+=(nr-ex)*Math.min(1,dt*6);u.ex=ex}
 const pk=Math.min(1,age/.45),pop=pk<1?1+2.7*Math.pow(pk-1,3)+1.7*Math.pow(pk-1,2):1;    // spawn pop (ease-out-back)
 const sc=u.sc||1;
 if(u.popT)u.popT.scale.setScalar(sc*pop*(1+ex*.05));
 if(u.float){
  const cyc=(t+ph*3)%6,hk=cyc<.8?cyc/.8:1,hop=cyc<.8?Math.sin(hk*Math.PI)*(.22+ex*.1):0;   // periodic attention hop + flip
  u.float.position.y=.95+Math.sin(t*2.2+ph)*.12+hop+ex*.08;
  u.float.scale.setScalar(pop*(1+ex*.12));
  u.spinner.rotation.y+=dt*(2.2+ex*2.4);
  u.spinner.rotation.x=cyc<.8?hk*hk*(3-2*hk)*Math.PI*2:0;
  u.spinner.rotation.z=Math.sin(t*1.3+ph)*.12;
  u.halo.rotation.y-=dt*(1.6+ex*2);u.halo.rotation.x=Math.sin(t*.9+ph)*.35;
  u.halo.material.opacity=.55+ex*.35+Math.sin(t*4+ph)*.1;
  if(u.halo2){u.halo2.rotation.y+=dt*2.2;u.halo2.rotation.z-=dt*1.3}
  u.orbit.rotation.y+=dt*(2.8+ex*3.2);u.orbit.rotation.z=Math.sin(t*1.1+ph)*.3;
  if(u.rar>=5){const hc=((t*.35+ph)%1+1)%1;u.halo.material.color.setHSL(hc,.9,.6);if(u.halo2)u.halo2.material.color.setHSL((hc+.5)%1,.9,.6)}
  if(u.rise){const k=((t*.7+ph)%1+1)%1;u.rise.position.y=.1+k*1.5;u.rise.scale.setScalar(1.3-k*.8);u.rise.material.opacity=.5*(1-k)}
  const hgt=Math.max(0,u.float.position.y-.95);
  u.shadow.scale.set(.8-hgt*.35,1,.8-hgt*.35);u.shadow.material.opacity=.25-hgt*.12;
 }
 const p=.5+.5*Math.sin(t*3+ph);
 const rr=u.rr||1;
 u.ground.scale.setScalar(u.chest?rr*(.9+p*.12):.8+p*.35+ex*.25);
 u.ground.material.opacity=.25+p*.4+ex*.2;
 const rk=((t*.6+ph)%1+1)%1;
 u.ripple.scale.setScalar((u.chest?rr:1)*(.5+rk*1.3));u.ripple.material.opacity=.45*(1-rk);
 for(const m of u.parts)lvAnimPart(m,t,dt);
}
export const lootMethods={
 genLoot(rng){let id=1;this.loot.clear();const seenB=new Set();
  for(const s of W.lootSpots){
   if(s.chest){this.addLootObj({id:id++,x:s.x,y:s.y,z:s.z,chest:1,q:s.q});continue}
   if(!s.inside&&rng()<.4)continue;
   const n=s.inside?(rng()<.5?2:1):1;
   for(let i=0;i<n;i++){
    // indoor floor loot: first item is a weapon a quarter of the time (guns are rarer than before)
    const it=s.inside&&i===0&&rng()<.25?rollWeapon(rng,s.q):rollItem(rng,s.q);
    const a=rng()*6.283,off=i?.9:0;let x=s.x+Math.cos(a)*off,z=s.z+Math.sin(a)*off,y=s.y;
    if(off&&W.blocked(x,y,z,.3,1,.05)){x=s.x;z=s.z}
    this.addLootObj({id:id++,x,y,z,item:it})}
   if(s.inside&&rng()<.15){this.addLootObj({id:id++,x:s.x+.5,y:s.y,z:s.z-.6,item:{k:'a',t:['light','med','shells'][Math.floor(rng()*3)],n:20}})}
  }
  // ammo boxes
  for(let i=0;i<40;i++){const a=rng()*6.283,r=Math.sqrt(rng())*W.ISL*.8;const x=Math.cos(a)*r,z=Math.sin(a)*r;const y=W.H(x,z);if(y<2.5||W.blocked(x,y+.1,z,.5,1,.05))continue;this.addLootObj({id:id++,x,y:y+.1,z,ammobox:1})}
 },
 addLootObj(l,fromEv){if(l.item&&l.item.k==='a'&&!l.chest){}this.loot.set(l.id,Object.assign(l,{mesh:null}))},
 removeLoot(id){const l=this.loot.get(id);if(!l)return;this.loot.delete(id);l.taken=true;if(l.mesh)this.popLoot(l);l.mesh=null},
 popLoot(l){ // a picked-up item pops up, shrinks away and bursts, instead of lingering on the ground
  const m=l.mesh;if(!m)return;(this.pops||(this.pops=[])).push({m,t0:this.t,y0:m.position.y});
  if(l.item&&this.fx)this.fx.burst(l.x,l.y+.9,l.z,12,3.4,itemColor(l.item),.5,0)},
 spawnLoot(item,x,z,y){ // host only
  const id=this.nextLootId++;const l={id,x,y:y===undefined?W.H(x,z)+.1:y,z,item};this.loot.set(id,Object.assign(l,{mesh:null}));
  this.outEvents.push({k:'lt+',l:{id,x:l.x,y:l.y,z:l.z,item}});return l},
 spawnChest(x,y,z,supply,id){const l={id:id||this.nextLootId++,x,y,z,chest:1,supply:supply?1:0,q:2};this.loot.set(l.id,Object.assign(l,{mesh:null}));this.outEvents.push({k:'lt+',l:{id:l.id,x,y,z,chest:1,supply:l.supply,q:2}});return l},
 openChest(l){ // host
  this.emit({k:'cho',id:l.id});const rng=Math.random;const items=[];
  if(l.supply){items.push(rollItem(rng,3,3));items.push(rollItem(rng,3,2));items.push({k:'i',id:'bigshield',n:2});items.push({k:'i',id:'medkit',n:2});items.push({k:'a',t:['med','light','heavy'][Math.floor(rng()*3)],n:60})}
  else{let w=rollItem(rng,1.6,1);while(w.k!=='w')w=rollItem(rng,1.6,1);items.push(w);items.push(rollItem(rng,1.4));items.push({k:'a',t:WEAPONS[w.w].ammo||'light',n:AMMO[WEAPONS[w.w].ammo||'light'].box});if(rng()<.6)items.push(rollItem(rng,1.2))}
  items.forEach((it,i)=>{let x=l.x,z=l.z;const a0=i/items.length*6.283+Math.random()*.5;
   for(let k=0;k<10;k++){const a=a0+k*.7,r=1.5+(k>>2)*.5;const px=l.x+Math.cos(a)*r,pz=l.z+Math.sin(a)*r;if(W.H(px,pz)<2&&l.y>2.5)continue;if(!W.blocked(px,l.y+.1,pz,.3,1,.05)&&Math.abs(W.groundAt(px,pz,l.y+.5,.3,.6)-l.y)<1.2){x=px;z=pz;break}}
   this.spawnLoot(it,x,z,W.groundAt(x,z,l.y+.5,.3,.6)+.1)});
  this.loot.delete(l.id)},
 openAmmoBox(l){this.emit({k:'cho',id:l.id});for(const t of ['light','med','shells','heavy'])if(Math.random()<.8||t==='light')this.spawnLoot({k:'a',t,n:Math.ceil(AMMO[t].box*.7)},l.x+(Math.random()-.5)*2.5,l.z+(Math.random()-.5)*2.5,l.y+.2);this.loot.delete(l.id)},
 // ---- picking up
 updateNearLoot(me){
  let best=null,bd=3.4;const fx=-Math.sin(me.yaw),fz=-Math.cos(me.yaw);
  for(const l of this.loot.values()){const dx=l.x-me.pos.x,dz=l.z-me.pos.z;if(dx*dx+dz*dz>bd*bd||Math.abs(l.y-me.pos.y)>3)continue;const d=Math.hypot(dx,dz);if(l.item&&l.item.k==='a')continue;
   const dot=d<.01?1:(dx*fx+dz*fz)/d;const score=d-dot*1.2;if(dot>-.2&&score<bd){bd=score;best=l}}
  this.near=best;this.hud.setPrompt(best?this.lootLabel(best):null,best)},
 lootLabel(l){if(l.chest)return l.supply?'Open Supply Drop':'Open Chest';if(l.ammobox)return 'Open Ammo Box';return itemName(l.item)},
 pickupLocal(me,l){
  if(this.role==='client'){if(l.mesh){l.mesh.visible=false;l.pend=this.t+1.6}this.net.toHost({t:'pick',id:l.id});this.audio.play('click');return} // client hides it instantly; comes back if the host says no
  this.hostPick(me,l)},
 hostPick(e,l){
  if(!this.loot.has(l.id)||!e.alive||e.drop)return;
  if(Math.hypot(l.x-e.pos.x,l.z-e.pos.z)>4.8||Math.abs(l.y-e.pos.y)>4)return;
  if(l.chest){this.openChest(l);return}
  if(l.ammobox){this.openAmmoBox(l);return}
  this.removeLoot(l.id);this.emit({k:'lt-',id:l.id});
  if(e.peer!==undefined&&!e.local)this.emit({k:'grant',g:l.item},e.id);else this.applyGrantLocal(e,l.item)},
 applyGrantLocal(e,it){
  if(it.k==='a'){const m=AMMO[it.t].max;const before=e.ammo[it.t];e.ammo[it.t]=Math.min(m,before+it.n);const left=it.n-(e.ammo[it.t]-before);if(left>0&&e.ammo[it.t]>=m&&e.local&&left===it.n)this.hud.toast(AMMO[it.t].n+' ammo full');else if(e.local)this.audio.play('pick');return}
  if(it.k==='i'){
   const d=ITEMS[it.id];let s=e.inv.find(x=>x&&x.k==='i'&&x.id===it.id);
   if(s){const add=Math.min(d.stack-s.n,it.n);s.n+=add;const left=it.n-add;if(left>0)this.dropItem(e,{k:'i',id:it.id,n:left})}
   else{let i=e.inv.findIndex((x,k)=>k>0&&!x);if(i<0){if(e.cur>0){this.dropSlot(e,e.cur);i=e.cur}else{this.dropItem(e,it);return}}e.inv[i]={k:'i',id:it.id,n:Math.min(it.n,d.stack)};if(it.n>d.stack)this.dropItem(e,{k:'i',id:it.id,n:it.n-d.stack})}
   if(e.local)this.audio.play('pick');return}
  if(it.k==='w'){
   const wd=wstat(it.w,it.r);
   let i=e.inv.findIndex((x,k)=>k>0&&!x);
   if(i<0){i=e.cur>0&&e.inv[e.cur]&&e.inv[e.cur].k==='w'?e.cur:(()=>{let b=-1;for(let k=1;k<6;k++)if(e.inv[k]&&e.inv[k].k==='w'){b=k;break}return b>0?b:1})();this.dropSlot(e,i)}
   e.inv[i]={k:'w',w:it.w,r:it.r,mag:it.mag===undefined?wd.mag:it.mag};
   if(!it.d&&wd.ammo){const A=AMMO[wd.ammo];e.ammo[wd.ammo]=Math.min(A.max,e.ammo[wd.ammo]+Math.round(wd.mag*1.6))}
   const cur=e.inv[e.cur];if(!cur||cur.w===0&&cur.k==='w'||cur.k==='i'||e.cur===i||true){this.swapTo(e,i)}
   if(e.local){this.audio.play('pick');if(it.r>=4)this.hud.toast(RARITY[it.r].n+' '+WEAPONS[it.w].n+'!',RARITY[it.r].c)}}
 },
 dropSlot(e,i){const s=e.inv[i];if(!s)return;e.inv[i]=null;if(s.k==='w'&&s.w===0){e.inv[i]=s;return}
  this.dropItem(e,s.k==='w'?{k:'w',w:s.w,r:s.r,mag:s.mag,d:1}:{k:'i',id:s.id,n:s.n});if(e.cur===i){e.cur=this.firstWeaponSlot(e);e.equipT=.3}},
 dropCurrent(e){if(e.cur>0&&e.inv[e.cur])this.dropSlot(e,e.cur)},
 dropItem(e,item){const x=e.pos.x-Math.sin(e.yaw)*1.8,z=e.pos.z-Math.cos(e.yaw)*1.8;const y=W.groundAt(x,z,e.pos.y+1,.3,2)+.1;
  if(this.role==='client'&&e.local)this.net.toHost({t:'drop',item,x,y,z});else this.spawnLoot(item,x,z,y)},
 // host: auto pickup ammo + proximity
 updateLootHost(dt){
  this.accum.loot+=dt;if(this.accum.loot<.2)return;this.accum.loot=0;
  for(const e of this.list){if(!e.alive||e.drop)continue;
   for(const l of this.loot.values()){if(!l.item||l.item.k!=='a')continue;const dx=l.x-e.pos.x,dz=l.z-e.pos.z;if(dx*dx+dz*dz>3.2||Math.abs(l.y-e.pos.y)>2.5)continue;
    const it=l.item;if(e.ammo[it.t]>=AMMO[it.t].max)continue;
    // bots/humans only want ammo they can use or always accept
    this.removeLoot(l.id);this.emit({k:'lt-',id:l.id});if(e.peer!==undefined&&!e.local)this.emit({k:'grant',g:it},e.id);else this.applyGrantLocal(e,it)}}},
 // ---- visuals
 makeLootMesh(l){
  const g=(l.chest||l.ammobox)?makeChestVis(l):makeItemLootVis(l);g.position.set(l.x,l.y,l.z);return g},
 updateLootVis(dt){
  this.accum.lv=(this.accum.lv||0)+dt;const cam=this.camera.position;
  if(this.accum.lv>.25){this.accum.lv=0;const R2=(this.settings.dist==='Far'?85:this.settings.dist==='Medium'?65:45)**2;
   for(const l of this.loot.values()){const dx=l.x-cam.x,dz=l.z-cam.z;const near=dx*dx+dz*dz<R2||(l.chest&&dx*dx+dz*dz<(l.supply?40000:3600));
    if(near&&!l.mesh){l.mesh=this.makeLootMesh(l);this.dynamic.add(l.mesh)}else if(!near&&l.mesh){this.dynamic.remove(l.mesh);l.mesh=null}}
   // safety sweep: remove any pickup visual that no longer belongs to a live item
   const live=new Set();for(const l of this.loot.values())if(l.mesh)live.add(l.mesh);if(this.pops)for(const p of this.pops)live.add(p.m);
   const ch=this.dynamic.children;for(let k=ch.length-1;k>=0;k--){const o=ch[k];if(o.userData&&o.userData.lootvis&&!live.has(o))this.dynamic.remove(o)}}
  for(const l of this.loot.values()){if(l.pend&&this.t>l.pend){l.pend=0;if(l.mesh)l.mesh.visible=true}if(l.mesh&&l.mesh.userData.an)animLootMesh(l.mesh,dt,this.t,cam)}
  if(this.pops)for(let i=this.pops.length-1;i>=0;i--){const p=this.pops[i],k=(this.t-p.t0)/.35;if(k>=1){this.dynamic.remove(p.m);this.pops.splice(i,1);continue}
   const u=p.m.userData;p.m.position.y=p.y0+k*1.2;p.m.scale.setScalar(Math.max(.01,(1+.35*Math.sin(k*Math.PI))*(1-k*k)));if(u.spinner)u.spinner.rotation.y+=dt*16;if(u.ground)u.ground.scale.setScalar(1+k*1.5)}
  // supply drop visuals (crate under a swaying parachute; no beam - it shows on the minimap)
  for(const s of this.supplies){const k=clamp((this.t-s.t0)/9,0,1);
   if(!s.mesh&&k<1){const g=new THREE.Group();const c=new THREE.Mesh(new THREE.BoxGeometry(2,1.4,2),mat('#ff3d3d'));g.add(c);const band=new THREE.Mesh(new THREE.BoxGeometry(2.06,.3,2.06),mat('#ffd23d'));band.position.y=.1;g.add(band);const p=new THREE.Mesh(new THREE.SphereGeometry(3.2,14,8,0,6.283,0,1.6),new THREE.MeshLambertMaterial({color:'#ffd23d',side:THREE.DoubleSide}));p.position.y=4.2;g.add(p);for(const[sx,sz]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,4.4,4),mat('#fff'));r.position.set(sx*1.4,2.2,sz*1.4);r.rotation.z=-sx*.35;r.rotation.x=sz*.35;g.add(r)}
    s.mesh=g;this.dynamic.add(g)}
   if(s.mesh){const gy=W.H(s.x,s.z);s.mesh.position.set(s.x+Math.sin(this.t)*.6,lerp(s.y0,gy+.7,k),s.z);s.mesh.rotation.z=Math.sin(this.t*1.7)*.1*(1-k*.9);s.mesh.rotation.x=Math.cos(this.t*1.3)*.07*(1-k*.9);if(k>=1){this.dynamic.remove(s.mesh);s.mesh=null;s.landed=true}}}
 },
};
