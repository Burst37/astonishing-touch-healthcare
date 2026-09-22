"""Encode completed, reviewed cinematic jobs; keep paid originals outside git."""
import json, subprocess, urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

root = Path(__file__).resolve().parents[1]
scratch = Path('/workspace/scratch/f71be88b1601/cinematic-review')
scratch.mkdir(parents=True, exist_ok=True)
entries = json.loads((root/'docs/cinematic-final.json').read_text())

def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

def prepare(e):
    if e.get('status') != 'completed' or not e.get('result_url'):
        return
    slug = e['slug']
    source = scratch/(slug+'-original.mp4')
    target = root/'public/videos'/('cinematic-'+slug+'.mp4')
    sheet = scratch/(slug+'-review.jpg')
    if not source.exists():
        urllib.request.urlretrieve(e['result_url'], source)
    if not target.exists():
        args = ['ffmpeg','-y','-i',str(source)]
        vf = 'scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,setsar=1,fps=24'
        if slug == 'hero':
            # Finish on the actual first video frame, not a different source still.
            filt = vf + ",split=2[m][s];[s]trim=end_frame=1,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=12,trim=duration=12[still];[m][still]blend=all_expr='A*(1-min(1,max(0,(T-11.4)/0.55)))+B*min(1,max(0,(T-11.4)/0.55))'[v]"
            args += ['-filter_complex',filt,'-map','[v]']
        else:
            args += ['-vf',vf]
        args += ['-t',str(e['duration']),'-an','-c:v','libx264','-preset','medium','-crf','22','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart',str(target)]
        run(args)
    if not sheet.exists():
        run(['ffmpeg','-y','-i',str(target),'-vf','fps=2,scale=400:225,tile=4x6' if slug=='hero' else 'fps=2,scale=400:225,tile=4x4','-frames:v','1',str(sheet)])
    print(slug, 'ready', flush=True)

with ThreadPoolExecutor(max_workers=2) as pool:
    list(pool.map(prepare, entries))
