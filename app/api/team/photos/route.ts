import sharp from 'sharp';
import {teamSession,teamResponse} from '@/lib/team-server';
import {allowRequest} from '@/lib/rate-limit';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return teamResponse({error:'Invalid origin.'},403);
 const session=await teamSession();if(!session)return teamResponse({error:'Sign-in required.'},401);
 if(session.staff.role==='employee')return teamResponse({error:'Manager access required.'},403,session.session);
 if(!await allowRequest(request,'profile-photo',10))return teamResponse({error:'Please wait before uploading another photo.'},429,session.session);
 if(Number(request.headers.get('content-length')||0)>6*1024*1024)return teamResponse({error:'Choose a photo smaller than 5 MB.'},413,session.session);
 try{
  const form=await request.formData(),file=form.get('photo'),kind=form.get('kind'),id=String(form.get('id')||'');
  if(!(file instanceof File)||file.size>5*1024*1024||file.size===0||!['image/jpeg','image/png','image/webp'].includes(file.type)||!['staff','client'].includes(String(kind))||!/^[-a-f0-9]{36}$/.test(id))return teamResponse({error:'Use a JPEG, PNG or WebP photo under 5 MB.'},400,session.session);
  const {data:subject}=await session.db.from(kind==='staff'?'ath_staff':'ath_clients').select('id').eq('id',id).single();if(!subject)return teamResponse({error:'Profile not found.'},404,session.session);
  // Decode pixels and re-encode: no SVG, EXIF GPS, embedded metadata or original filename.
  const image=await sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:25000000}).rotate().resize(1024,1024,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
  const path=`${kind}/${id}/${crypto.randomUUID()}.webp`;
  const upload=await session.db.storage.from('ath-profile-photos').upload(path,image,{contentType:'image/webp',upsert:false});if(upload.error)throw Error('Upload unavailable');
  const save=await session.db.rpc('ath_manage',{p_action:'photo',p_data:{kind,id,path}});if(save.error)throw Error('Profile unavailable');
  return teamResponse({saved:true},200,session.session);
 }catch{return teamResponse({error:'The photo could not be saved. Try another image or contact the office.'},400,session.session)}
}
