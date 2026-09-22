"""Prepare generated H3 clips for website delivery. Preserve originals in input directory."""
from pathlib import Path
import subprocess, sys, json
source=Path(sys.argv[1]);output=Path(sys.argv[2]);output.mkdir(parents=True,exist_ok=True)
# Close-up centers keep the existing action in frame. No generated replacements.
centers={'01':(.43,.66),'02':(.49,.72),'03':(.59,.56),'05':(.53,.72),'06':(.53,.73),'07':(.50,.45),'08':(.63,.64)}
for f in sorted(source.glob('*.mp4')):
 dest=output/f.name
 if dest.exists() and dest.stat().st_mtime>f.stat().st_mtime:continue
 if f.stem in centers:
  cx,cy=centers[f.stem];zoom=.66;x=min(max(cx-zoom/2,0),1-zoom);y=min(max(cy-zoom/2,0),1-zoom)
  vf=f"[0:v]split=3[a][b][c];[a]trim=start=0:end=2.6,setpts=PTS-STARTPTS,scale=1280:720,setsar=1[v0];[b]trim=start=2.6:end=5.2,setpts=PTS-STARTPTS,crop=trunc(iw*{zoom}/2)*2:trunc(ih*{zoom}/2)*2:iw*{x}:ih*{y},scale=1280:720,setsar=1[v1];[c]trim=start=5.2:end=8,setpts=PTS-STARTPTS,scale=1280:720,setsar=1[v2];[v0][v1][v2]concat=n=3:v=1:a=0[v]"
  args=['-filter_complex',vf,'-map','[v]']
 else:args=['-vf','scale='+('1600' if f.stem=='09' else '1280')+':-2']
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(f),*args,'-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',str(dest)],check=True)
 print(dest.name,dest.stat().st_size,flush=True)
