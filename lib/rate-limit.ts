const buckets = new Map<string, { count: number; expires: number }>();
export async function allowRequest(request:Request,scope:string,limit:number):Promise<boolean>{
 const now=Date.now(), windowId=Math.floor(now/60000);
 const identity=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'shared';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(scope+':'+windowId+':'+identity));
 const key=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');
 const current=buckets.get(key); const next=!current||current.expires<now?{count:1,expires:now+120000}:{count:current.count+1,expires:current.expires};
 buckets.set(key,next); if(buckets.size>5000) for(const [k,v] of buckets) if(v.expires<now)buckets.delete(k);
 return next.count<=limit;
}
