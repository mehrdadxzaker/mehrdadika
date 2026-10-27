import { duck } from './sound';
let current: HTMLAudioElement | null = null;
let serial = 0;
let cancelPlayback: (() => void) | null = null;
export function stopAudio() {
  serial++;
  cancelPlayback?.(); cancelPlayback=null;
  if(current){current.pause();current.removeAttribute('src');current.load();current=null;}
  if('speechSynthesis' in window)window.speechSynthesis.cancel();
  duck(false);
}
/** Only finished, licensed recordings are bundled. Device speech remains a fallback. */
export async function play(url:string|null|undefined,text:string,accent:'uk'|'us'='uk',rate=1):Promise<'recorded'|'device'|'stopped'|'unsupported'> {
  stopAudio();const mine=++serial;duck(true);
  try {
    if(url){
      const audio=new Audio();current=audio;audio.playbackRate=rate;
      const result=await new Promise<'ended'|'failed'|'stopped'>(resolve=>{
        let settled=false;
        const finish=(value:'ended'|'failed'|'stopped')=>{if(settled)return;settled=true;clearTimeout(timer);audio.onended=null;audio.onerror=null;audio.onpause=null;if(cancelPlayback===cancel)cancelPlayback=null;resolve(value);};
        const cancel=()=>finish('stopped');
        const timer=setTimeout(()=>{audio.pause();finish('failed');},20000);
        cancelPlayback=cancel;audio.onended=()=>finish('ended');audio.onerror=()=>finish('failed');audio.onpause=()=>finish('stopped');audio.src=url;
        void audio.play().catch(()=>finish('failed'));
      });
      audio.pause();audio.removeAttribute('src');audio.load();if(current===audio)current=null;
      if(result==='ended')return 'recorded';
      if(result==='stopped'||mine!==serial)return 'stopped';
    }
    if(mine!==serial)return 'stopped';
    if(!('speechSynthesis' in window))return 'unsupported';
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang=accent==='uk'?'en-GB':'en-US';utterance.rate=Math.max(.5,Math.min(2,rate))*.95;
    const voices=window.speechSynthesis.getVoices().filter(v=>v.lang.replace('_','-')===utterance.lang);const voice=voices.find(v=>/natural|enhanced|google/i.test(v.name))??voices[0];if(voice)utterance.voice=voice;
    return await new Promise<'device'|'stopped'|'unsupported'>(resolve=>{
      let settled=false;
      const finish=(result:'device'|'stopped'|'unsupported')=>{if(settled)return;settled=true;clearTimeout(timer);utterance.onend=null;utterance.onerror=null;if(cancelPlayback===cancel)cancelPlayback=null;resolve(result);};
      const cancel=()=>finish('stopped');const timer=setTimeout(()=>{finish('unsupported');window.speechSynthesis.cancel();},60000);cancelPlayback=cancel;
      utterance.onend=()=>finish('device');utterance.onerror=()=>finish('unsupported');window.speechSynthesis.speak(utterance);
    });
  } finally {if(mine===serial)duck(false);}
}
if(typeof window!=='undefined')window.addEventListener('pagehide',stopAudio);
