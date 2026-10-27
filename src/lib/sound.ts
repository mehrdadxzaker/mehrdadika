/** Original synthesized UI soundscape. No third-party soundtrack or network requests. */
export type Cue = 'correct'|'wrong'|'flip'|'page'|'complete'|'streak'|'start'|'tap'|'key'|'twinkle'|'fly'|'ignite';
export const AMBIENCE = [{id:'stars',label:'آسمان آرام'},{id:'rain',label:'باران نرم'},{id:'sea',label:'موج‌های آرام'},{id:'forest',label:'نسیم درختان'},{id:'fire',label:'گرمای شومینه'},{id:'voyage',label:'سفر دور'},{id:'cafe',label:'همهمهٔ کافه'}] as const;
export type AmbienceId = typeof AMBIENCE[number]['id'];
let context: AudioContext | null = null;
let ambient: {source:AudioBufferSourceNode;gain:GainNode;filter:BiquadFilterNode;id:AmbienceId}|null = null;
let volume = .4, ducked = false;
function audio() { if (!context) { const Constructor = window.AudioContext; if (!Constructor) return null; context = new Constructor(); } if (context.state === 'suspended') void context.resume().catch(()=>{}); return context; }
export function primeCues() { /* The first actual sound opens the context after a user gesture. */ }
export function preloadFiles(_files:string[]) { /* Synthesized sound has no network assets. */ }
export async function cue(name:Cue) {
  const c=audio(); if (!c) return;
  const o=c.createOscillator(), g=c.createGain();
  const frequencies:Record<Cue,number>={correct:660,wrong:180,flip:440,page:380,complete:880,streak:740,start:520,tap:400,key:320,twinkle:1000,fly:480,ignite:820};
  o.type=name==='wrong'?'triangle':'sine'; o.frequency.setValueAtTime(frequencies[name],c.currentTime);
  o.frequency.exponentialRampToValueAtTime(frequencies[name]*1.25,c.currentTime+.12);
  g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(name==='key'?.015:.055,c.currentTime+.012);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.19);
  o.connect(g).connect(c.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(c.currentTime+.21);
}
export async function playFile(_file:string,gain=.6,delay=0) { if(gain>0 && delay>=0) await cue('twinkle'); }
export async function setAmbience(id:AmbienceId|null,nextVolume=volume) {
  volume=nextVolume;
  if(ambient && ambient.id===id){ambient.gain.gain.setTargetAtTime(volume*(ducked?.015:.04),context!.currentTime,.15);return;}
  if(ambient){ambient.source.stop();ambient.source.disconnect();ambient.gain.disconnect();ambient.filter.disconnect();ambient=null;}
  if(!id)return;const c=audio();if(!c)return;
  const buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate), data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<data.length;i++){last=(last+.04*(Math.random()*2-1))/1.04;data[i]=last*3;}
  const source=c.createBufferSource(),gain=c.createGain(),filter=c.createBiquadFilter();
  filter.type='lowpass';filter.frequency.value={stars:250,rain:1900,sea:500,forest:900,fire:450,voyage:200,cafe:1300}[id];source.buffer=buffer;source.loop=true;gain.gain.value=volume*.04;
  source.connect(filter).connect(gain).connect(c.destination);source.start();ambient={source,gain,filter,id};
}
export function duck(on:boolean){ducked=on;if(ambient&&context)ambient.gain.gain.setTargetAtTime(volume*(on?.015:.04),context.currentTime,.12);}
export const ambienceId=()=>ambient?.id??null;
if(typeof window!=='undefined')window.addEventListener('pagehide',()=>{if(ambient){ambient.source.stop();ambient=null;}if(context){void context.close();context=null;}});
