"""Download completed, reviewed generation jobs and prepare silent website media."""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAMES = ['respite-care', 'companionship', 'personal-care', 'hygiene-assistance',
         'meal-preparation', 'housekeeping', 'laundry', 'medication-reminders', 'errands', 'hero']
manifest = json.loads((ROOT / 'docs/service-video-replacement.json').read_text())
work = Path(sys.argv[1])
work.mkdir(parents=True, exist_ok=True)
for job in manifest['jobs']:
    if job.get('status') != 'completed' or not job.get('result_url'):
        continue
    name = NAMES[job['index']]
    target = ROOT / 'public/videos' / ('service-' + name + '.mp4')
    if target.exists() and (work / (name + '-review.jpg')).exists():
        continue
    original = work / (name + '-original.mp4')
    if not original.exists():
        urllib.request.urlretrieve(job['result_url'], original)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(original),
        '-map', '0:v:0', '-an', '-t', '12' if name == 'hero' else '8', '-vf', 'scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,setsar=1',
        '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '24',
        '-movflags', '+faststart', str(target)], check=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(target),
        '-vf', 'fps=1,scale=400:225,tile=4x3', '-frames:v', '1', str(work / (name + '-review.jpg'))], check=True)
    print(name, target.stat().st_size)
