#!/usr/bin/env python3
"""Optional pinned CC-BY asset fetcher. Four pooled clients; never used by builds/tests."""
from pathlib import Path
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
import concurrent.futures, hashlib, http.client, json, random, threading, time
ROOT=Path(__file__).resolve().parents[1]
REVISION='e7b44629230a470e6b664826ced4af2c367b44c2'
WORDS='library journey explore curious discover remember understand compare explain improve habit question answer routine friend family garden language travel learn bake boil roast chop stir ingredient recipe flavour slice peel mixture steam heart blood symptom patient doctor nurse treatment infection disease recover medicine pressure force friction current circuit energy engine structure measure material mechanism beam load'.split()
TARGETS=[(f'public/atlas/{kind}/{word}.{ext}',f'public/atlas/{kind}/{word}.{ext}') for word in WORDS for kind,ext in [('img','webp'),('audio/uk','mp3'),('audio/us','mp3')]]
STOP=threading.Event()
def retry_after(value):
    if not value:return 1.0
    try:return max(0,float(value))
    except ValueError:return max(0,(parsedate_to_datetime(value)-datetime.now(timezone.utc)).total_seconds())
def worker(batch):
    conn=None;output=[]
    try:
        for source,destination in batch:
            if STOP.is_set():raise RuntimeError('Asset job cancelled after another worker failed')
            target=ROOT/destination;target.parent.mkdir(parents=True,exist_ok=True)
            if not target.exists():
                for attempt in range(4):
                    if STOP.is_set():raise RuntimeError('Asset job cancelled')
                    delay=.5*2**attempt
                    try:
                        if conn is None:conn=http.client.HTTPSConnection('raw.githubusercontent.com',timeout=25)
                        conn.request('GET',f'/designfuchen/word-atlas/{REVISION}/{source}',headers={'User-Agent':'Mehrdadika-source-assets/0.1','Connection':'keep-alive'})
                        response=conn.getresponse();data=response.read(2_000_001)
                        if response.status==429:
                            delay=retry_after(response.getheader('Retry-After'))
                            if delay>30:raise ValueError('Retry-After exceeds this bounded job; try later')
                            raise OSError('Rate limited')
                        if response.status>=500:raise OSError(f'Upstream unavailable: {response.status}')
                        if response.status!=200:raise ValueError(f'HTTP {response.status}: {source}')
                        if not data or len(data)>2_000_000:raise ValueError('Unexpected asset size')
                        target.write_bytes(data);break
                    except OSError as error:
                        if conn:conn.close()
                        conn=None
                        if getattr(error,'errno',None) in (49,99):raise RuntimeError('Address exhaustion: all downloads stopped') from error
                        if attempt==3:raise
                        if STOP.wait(delay+random.random()*.25):raise RuntimeError('Asset job cancelled')
            output.append({'file':destination.removeprefix('public/'),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'license':'CC-BY-4.0','credit':'Word Atlas contributors','source':f'https://github.com/designfuchen/word-atlas/blob/{REVISION}/{source}'})
    except BaseException:
        STOP.set();raise
    finally:
        if conn:conn.close()
    return output
if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(worker,[TARGETS[i::4] for i in range(4)]))
    assets=[asset for batch in results for asset in batch]
    (ROOT/'content').mkdir(exist_ok=True)
    (ROOT/'content/upstream-assets.json').write_text(json.dumps({'revision':REVISION,'assets':assets},ensure_ascii=False,indent=2)+'\n')
    print(f'Fetched/verified {len(assets)} assets with four reusable connections.')
