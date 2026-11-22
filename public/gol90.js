/* A 12 PASOS DE LA GLORIA — juego audiovisual táctil. MQTT de Tacto original sin modificar. */
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp = (a,b,t)=>a+(b-a)*t;
const tacto = new Tacto();
const canvas=$('#field'),ctx=canvas.getContext('2d');
const ui={status:$('#status'),dot:$('#dot'),rtt:$('#latency'),goals:$('#goals'),tries:$('#tries'),phase:$('#phase'),power:$('#powerFill'),powerText:$('#powerText'),hint:$('#hint'),outcome:$('#outcome'),direction:$('#direction'),elevation:$('#elevation'),spin:$('#spin'),gameState:$('#gameState'),count:$('#touchCount'),pos:$('#pos'),tilt:$('#tilt'),last:$('#last'),phone:$('#phoneStatus')};
const game={x:.5,y:.5,n:0,gyro:0,down:false,started:0,power:0,goals:0,shots:0,flight:null,result:null,trail:[],keeperX:640,lastTouchAt:0,activeDevice:null,mouse:false};
const sound={ctx:null,master:null,samples:{},ready:false,pulseTime:0,chargeTime:0};
const clips=['ambiente','pulso','carga','roce','patada','red','gol','fallo'];
function audioInit(){
 if(!sound.ctx){
  sound.ctx=new (window.AudioContext||window.webkitAudioContext)();
  sound.master=sound.ctx.createGain();sound.master.gain.value=.36;
  const limiter=sound.ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=14;limiter.ratio.value=5;limiter.attack.value=.004;limiter.release.value=.25;
  sound.master.connect(limiter);limiter.connect(sound.ctx.destination);
 }
 sound.ctx.resume();sound.enabled=true;
 if(!sound.ready){sound.ready=true;clips.forEach(async n=>{try{const a=await fetch(`sonidos/${n}.wav`);if(!a.ok)throw Error(n);sound.samples[n]=await sound.ctx.decodeAudioData(await a.arrayBuffer());if(n==='ambiente'&&sound.enabled)startAmbience();}catch(e){console.warn('Audio no cargado:',n,e);}});}
 else startAmbience();
 $('#audio').textContent='DESACTIVAR SONIDO';$('#audio').classList.add('on');$('#audio').setAttribute('aria-pressed','true');
}
function audioOff(){if(!sound.ctx)return;sound.enabled=false;sound.ctx.suspend();$('#audio').textContent='ACTIVAR SONIDO';$('#audio').classList.remove('on');$('#audio').setAttribute('aria-pressed','false');}
function startAmbience(){if(!sound.ctx||sound.ambient||!sound.samples.ambiente)return;const src=sound.ctx.createBufferSource();src.buffer=sound.samples.ambiente;src.loop=true;const gain=sound.ctx.createGain();gain.gain.value=.018;src.connect(gain);gain.connect(sound.master);src.start();sound.ambient=src;}
function play(name,vol=1,rate=1,pan=0){const ac=sound.ctx,b=sound.samples[name];if(!sound.enabled||!ac||!b||ac.state!=='running')return;const src=ac.createBufferSource();src.buffer=b;src.playbackRate.value=rate;const g=ac.createGain();g.gain.value=Math.max(0,vol);const p=ac.createStereoPanner();p.pan.value=clamp(pan,-1,1);src.connect(g);g.connect(p);p.connect(sound.master);src.start();src.onended=()=>{src.disconnect();g.disconnect();p.disconnect();};}
$('#audio').setAttribute('aria-pressed','false');
$('#audio').onclick=()=>sound.enabled?audioOff():audioInit();
function setTouch(n,x,y,tilt){const now=performance.now();n=Math.max(0,n|0);x=clamp(x??game.x);y=clamp(y??game.y);game.gyro=clamp(tilt??game.gyro,-45,45);game.n=n;game.lastTouchAt=now;
 if(game.flight){game.x=x;game.y=y;game.down=n>0;return;}
 if(n>0){if(!game.down){game.down=true;game.started=now;game.power=0;ui.phase.textContent='CARGANDO POTENCIA';ui.hint.textContent='SUELTA PARA DISPARAR';play('roce',.045,1.0,x*2-1);}game.x=x;game.y=y;}
 else if(game.down){game.down=false;game.power=clamp((now-game.started)/1750,.1,1);shoot();}
}
function shoot(){
 const now=performance.now(),force=game.power,spin=game.gyro/45;
 const aimedX=640+(game.x-.5)*910+spin*115;
 const aimedY=285+(game.y-.5)*440-(force-.5)*45;
 // La potencia tiene un rango óptimo. Un remate débil se cae; uno excesivo se eleva.
 const weak=clamp((.33-force)/.33),over=clamp((force-.97)/.03);
 const tx=aimedX+(Math.sin(now*.017)*34)*weak+(Math.cos(now*.009)*28)*over;
 const ty=aimedY+weak*105-over*70;
 const inside=(tx>355&&tx<925&&ty>166&&ty<413);
 // El portero lee parcialmente la dirección del tiro: los remates centrales son defendibles.
 const goalie=clamp(640+(tx-640)*.30+Math.sin(now*.0011)*52,482,798);
 const saved=inside && Math.abs(tx-goalie)<100 && ty>235 && force<.985;
 const result=!inside?'FUERA':saved?'ATAJADA':'GOL';
 game.flight={start:now,fromX:640,fromY:595,toX:tx,toY:ty,spin,result,keeper:goalie,power:force};
 game.shots++;ui.tries.textContent=String(game.shots).padStart(2,'0');ui.phase.textContent='REMATE EN CURSO';ui.gameState.textContent='DISPARO';
 play('patada',.62+force*.12,lerp(.94,1.07,force),game.x*2-1);
}
function finish(f){if(game.flight!==f)return;if(f.result==='GOL'){game.goals++;ui.goals.textContent=String(game.goals).padStart(2,'0');play('red',.31,1,clamp((f.toX-640)/400,-1,1));play('gol',.35,1,0);}else if(f.result==='ATAJADA'){play('fallo',.33,.92,0);}else{play('fallo',.30,.85,0);}
 ui.outcome.textContent=f.result==='GOL'?'¡GOOOL!':f.result==='ATAJADA'?'¡ATAJADA!':'¡AFUERA!';ui.outcome.className='outcome show'+(f.result==='GOL'?'':' fail');ui.last.textContent=f.result;ui.phase.textContent=f.result;ui.gameState.textContent=f.result;game.result={at:performance.now(),name:f.result};}
function reset(){game.flight=null;game.result=null;game.down=false;game.power=0;ui.outcome.className='outcome';ui.phase.textContent='PREPARA TU REMATE';ui.gameState.textContent='LISTO';ui.hint.textContent='ARRASTRA · MANTÉN · SUELTA';}
function update(now){if(game.down&&!game.flight){game.power=clamp((now-game.started)/1750);if(now-sound.pulseTime>lerp(750,250,game.power)){play('pulso',.078+game.power*.065,lerp(.88,1.07,game.power));sound.pulseTime=now;}if(game.power>.45&&now-sound.chargeTime>950){play('carga',.028+game.power*.02,.92+game.power*.08);sound.chargeTime=now;}}
 if(game.flight&&now-game.flight.start>1150&&!game.result)finish(game.flight);
 if(game.result&&now-game.result.at>1950)reset();
 if(!game.down&&!game.flight)game.power=0;
 ui.power.style.width=Math.round(game.power*100)+'%';ui.powerText.textContent=Math.round(game.power*100)+'%';ui.direction.textContent=game.x<.40?'IZQUIERDA':game.x>.60?'DERECHA':'CENTRO';ui.elevation.textContent=game.y<.34?'ALTA':game.y>.66?'BAJA':'MEDIA';ui.spin.textContent=Math.round(game.gyro)+'°';ui.count.textContent=String(game.n);ui.pos.textContent=game.x.toFixed(2)+' / '+game.y.toFixed(2);ui.tilt.textContent=Math.round(game.gyro)+'°';}
function line(points,color,width=1,alpha=1){ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();}
function rect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);}
function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
function paint(now){const W=1280,H=720;ctx.clearRect(0,0,W,H);
 let sky=ctx.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#0b1a20');sky.addColorStop(.65,'#15332f');sky.addColorStop(1,'#28533f');rect(0,0,W,470,sky);
 // estadio: gradas iluminadas, recortadas en perspectiva
 for(let i=0;i<10;i++){rect(0,95+i*17,W,5,`rgba(4,13,18,${.19+i*.007})`);}
 for(let i=0;i<130;i++){const x=(i*173+17)%1280,y=112+(i*47)%192;circle(x,y,(i%4===0?2:1),i%7===0?'#b3c96a':'#49655a');}
 rect(0,318,W,9,'#9eb981');
 const field=ctx.createLinearGradient(0,326,0,H);field.addColorStop(0,'#265e43');field.addColorStop(1,'#0c3529');rect(0,327,W,H-327,field);
 // franjas
 for(let i=0;i<11;i++){const y=335+i*i*3.2;rect(0,y,W,(i+1)*3.4,i%2?'#ffffff08':'#0000000b');}
 line([[185,720],[433,427],[847,427],[1095,720]],'#cee4ba',3,.47);
 line([[0,595],[1280,595]],'#c5d8b7',3,.25);
 line([[300,720],[490,425],[790,425],[980,720]],'#c8ddba',2,.22);
 // postes, red y profundidad
 const netGrad=ctx.createLinearGradient(0,155,0,421);netGrad.addColorStop(0,'#324e42');netGrad.addColorStop(1,'#162d2a');rect(338,161,604,259,netGrad);
 for(let x=338;x<942;x+=19)line([[x,160],[x,421]],'#a4baad',1,.25);
 for(let y=163;y<421;y+=17)line([[338,y],[942,y]],'#a4baad',1,.23);
 line([[332,422],[332,151],[948,151],[948,422]],'#f0f3de',10);
 line([[334,422],[372,440],[910,440],[947,422]],'#d2e1d3',3,.65);
 // iluminación sobre arco
 const gl=ctx.createRadialGradient(640,263,10,640,263,570);gl.addColorStop(0,'#8cad8915');gl.addColorStop(1,'#8cad8900');rect(0,0,1280,720,gl);
 // portero estilizado
 const kx=game.flight?game.flight.keeper:640+Math.sin(now*.0009)*80;const ky=352;
 ctx.save();ctx.translate(kx,ky);const dive=game.flight?clamp((now-game.flight.start)/1050):0;ctx.rotate(game.flight?(game.flight.toX-kx)/1500*dive:Math.sin(now*.001)*.02);
 line([[-10,-26],[-25,4],[-44,26]],'#e8f6e7',9);line([[10,-26],[24,4],[42,24]],'#e8f6e7',9);line([[-10,9],[-15,46]],'#17282b',11);line([[10,9],[15,46]],'#17282b',11);rect(-22,-28,44,47,'#ef795a');circle(0,-43,17,'#e4b99b');ctx.restore();
 // pelota + trayectoria: la guía termina en coordenada objetivo
 const spin=game.gyro/45,aimX=640+(game.x-.5)*910+spin*115,aimY=285+(game.y-.5)*440-(game.power-.5)*45;
 if(game.down&&!game.flight){ctx.save();ctx.setLineDash([8,11]);line([[640,595],[lerp(640,aimX,.5)+spin*45,lerp(595,aimY,.5)-75],[aimX,aimY]],'#d9fc5a',3,.8);ctx.restore();circle(aimX,aimY,15,'#d9fc5a55');line([[aimX-19,aimY],[aimX+19,aimY]],'#d9fc5a',2);line([[aimX,aimY-19],[aimX,aimY+19]],'#d9fc5a',2);}
 let ballX=640,ballY=592,ballR=34;
 if(game.flight){const f=game.flight,t=clamp((now-f.start)/1050);ballX=lerp(f.fromX,f.toX,t)+Math.sin(t*Math.PI)*f.spin*42;ballY=lerp(f.fromY,f.toY,t)-Math.sin(t*Math.PI)*125;ballR=lerp(34,9,t);if(t<1){for(let j=1;j<=7;j++){const u=Math.max(0,t-j*.022);const bx=lerp(f.fromX,f.toX,u)+Math.sin(u*Math.PI)*f.spin*42;const by=lerp(f.fromY,f.toY,u)-Math.sin(u*Math.PI)*125;circle(bx,by,lerp(34,9,u)*.7,`rgba(217,252,90,${(.15-j*.017).toFixed(3)})`);}}}
 // sombra y pelota
 ctx.save();ctx.translate(ballX,ballY);circle(5,ballR*.85,ballR*1.1,'#03191575');circle(0,0,ballR,'#f4f1e5');ctx.save();ctx.rotate(now*.0012);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;circle(Math.cos(a)*ballR*.57,Math.sin(a)*ballR*.57,ballR*.18,'#293535');}circle(0,0,ballR*.31,'#293535');ctx.restore();ctx.restore();
 // jugador en primerísimo plano, silueta parcial sin robar la vista
 ctx.fillStyle='#07191b';ctx.beginPath();ctx.moveTo(480,720);ctx.lineTo(500,675);ctx.quadraticCurveTo(525,641,566,653);ctx.lineTo(582,720);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(698,720);ctx.lineTo(714,653);ctx.quadraticCurveTo(755,641,780,675);ctx.lineTo(800,720);ctx.closePath();ctx.fill();
 // ruido y viñeta
 const vignette=ctx.createRadialGradient(640,330,170,640,330,800);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#00000099');rect(0,0,W,H,vignette);
}
function frame(now){update(now);paint(now);requestAnimationFrame(frame);}requestAnimationFrame(frame);
// MQTT: priorizar el dispositivo real, ratón solo para pruebas locales.
tacto.on('estado',s=>{ui.status.textContent=s==='conectado'?'MQTT CONECTADO':s.toUpperCase();ui.dot.classList.toggle('ok',s==='conectado');});
tacto.on('dispositivo',()=>{const d=tacto.pick();ui.phone.textContent=d?.online?`${d.name} · conectado`:'Esperando teléfono';if(d&&!d.online&&game.down&&!game.mouse){setTouch(0,game.x,game.y,game.gyro);}});
tacto.on('datos',(dev,kind)=>{if(game.mouse)return;if(kind==='touch'){const ch=dev.ch;setTouch(ch['touch.n']||0,ch['touch.x'],ch['touch.y'],game.gyro);ui.phone.textContent=dev.name+' · conectado';}else if(kind==='motion'){const a=dev.ch['ang.g'];if(a!=null){game.gyro=clamp(a,-45,45);}}});
tacto.on('rtt',d=>{if(!d.rtt.length)return;const a=[...d.rtt].sort((x,y)=>x-y);ui.rtt.textContent=Math.round(a[Math.floor(a.length/2)])+' ms';});
// puntero alternativo para evaluar sin teléfono; no requiere MQTT.
const screen=$('#pitch');function pointer(e,n){const b=screen.getBoundingClientRect();setTouch(n,(e.clientX-b.left)/b.width,(e.clientY-b.top)/b.height,game.gyro);}
screen.addEventListener('pointerdown',e=>{if(game.flight)return;game.mouse=true;screen.setPointerCapture(e.pointerId);pointer(e,1);});
screen.addEventListener('pointermove',e=>{if(game.mouse&&game.down)pointer(e,1);});
function pointerEnd(e){if(!game.mouse)return;pointer(e,0);game.mouse=false;}
screen.addEventListener('pointerup',pointerEnd);screen.addEventListener('pointercancel',pointerEnd);
$('#full').onclick=()=>{if(!document.fullscreenElement)screen.requestFullscreen?.();else document.exitFullscreen?.();};
// Teléfono: misma página index.html y mismo broker que la experiencia.
async function makeUrl(){
 let base=window.TACTO_CONFIG?.phoneUrl||new URL('./',location.href).href;
 // En localhost, el QR debe usar la dirección LAN, no localhost del teléfono.
 if(!window.TACTO_CONFIG?.phoneUrl && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)){
  try{const r=await fetch('/info');if(r.ok){const info=await r.json();base=info.baseUrl+'/';}}
  catch(e){console.warn('No se pudo detectar la IP local:',e);}
 }
 const url=new URL(base,location.href);url.searchParams.set('sala',tacto.sala);
 url.searchParams.set('broker',tacto.broker||Tacto.PUBLIC_BROKER);
 $('#phoneLink').href=url.href;$('#room').textContent=tacto.sala;
 const img=$('#qr');img.alt='QR de la sala '+tacto.sala;
 img.src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(url.href);
 img.onerror=()=>{img.hidden=true;};
}
$('#newroom').onclick=()=>{if(game.down||game.flight)return;tacto.cambiarSala(Tacto.rand(9));makeUrl();ui.phone.textContent='Esperando teléfono';};
tacto.connect().then(makeUrl).catch(e=>{ui.status.textContent='ERROR MQTT';console.error(e);makeUrl();});
