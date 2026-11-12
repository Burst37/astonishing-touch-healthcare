import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const ids={owner:'10000000-0000-4000-8000-000000000001',manager:'10000000-0000-4000-8000-000000000002',a:'10000000-0000-4000-8000-000000000003',b:'10000000-0000-4000-8000-000000000004',client:'20000000-0000-4000-8000-000000000001',other:'20000000-0000-4000-8000-000000000002'};
test('Real PostgreSQL: access isolation, clock idempotency, exceptions, corrections, private photos and schedule conflicts',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon,service_role;grant execute on function auth.uid() to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert on storage.objects to authenticated;`);
 await db.exec(await readFile(new URL('../supabase/migrations/20261112142601_team_attendance.sql',import.meta.url),'utf8'));
 for(const [key,id] of Object.entries(ids).filter(([k])=>['owner','manager','a','b'].includes(k))){await db.query('insert into auth.users values($1)',[id]);await db.query('insert into ath_staff(id,name,role)values($1,$2,$3)',[id,'Test '+key,['owner','manager'].includes(key)?key:'employee'])}
 const as=async(key)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids[key]]);await db.exec('set role authenticated')};
 const manage=async(action,data)=>(await db.query('select ath_manage($1,$2::jsonb) as result',[action,JSON.stringify(data)])).rows[0].result;
 await as('manager');for(const [id,name] of [[ids.client,'Assigned client'],[ids.other,'Unassigned client']])await manage('client',{id,name,address:'Fictional address',latitude:38.67,longitude:-90.44,radius_m:150,active:true,phone:'555-0100'});
 await manage('assignment',{employee_id:ids.a,client_id:ids.client,active:true});
 await manage('photo',{kind:'client',id:ids.client,path:`client/${ids.client}/test.webp`});
 await db.query('insert into storage.objects(bucket_id,name)values($1,$2),($1,$3)',['ath-profile-photos',`client/${ids.client}/test.webp`,`client/${ids.other}/other.webp`]);
 await as('a');assert.equal((await db.query('select * from ath_clients')).rows.length,1);assert.equal((await db.query('select * from ath_staff')).rows.length,1);assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await assert.rejects(()=>db.exec("update ath_staff set role='owner'"),/permission denied/);await assert.rejects(()=>manage('staff',{id:ids.b,name:'Bad actor',role:'owner',active:true}),/Manager access/);
 const req='30000000-0000-4000-8000-000000000001';
 const clock=async(action,request,lat=38.67,lng=-90.44,accuracy=15,sampled=new Date().toISOString())=>(await db.query('select * from ath_clock_visit($1,$2,$3,$4,$5,$6,$7)',[action,ids.client,request,lat,lng,accuracy,sampled])).rows[0];
 const v=await clock('clock_in',req);assert.equal(v.in_status,'within_range');assert.equal((await clock('clock_in',req)).id,v.id);await assert.rejects(()=>clock('clock_in',crypto.randomUUID()),/active visit/);
 await as('b');assert.equal((await db.query('select * from ath_visits')).rows.length,0);assert.equal((await db.query('select * from storage.objects')).rows.length,0);await assert.rejects(()=>clock('clock_out',crypto.randomUUID()),/No active visit/);await assert.rejects(()=>clock('clock_in',crypto.randomUUID()),/assignment/);
 await as('manager');await assert.rejects(()=>manage('review',{id:v.id,status:'approved',reason:'Checked by manager'}),/Close the visit/);await manage('assignment',{employee_id:ids.a,client_id:ids.client,active:false});
 await as('a');const ended=await clock('clock_out',crypto.randomUUID(),null,null,null,null);assert.equal(ended.out_status,'unavailable');assert.equal(ended.review_status,'needs_review');assert.ok(ended.clock_out>=ended.clock_in);
 await as('manager');await manage('review',{id:v.id,status:'approved',reason:'Location exception confirmed with office'});assert.equal((await db.query('select * from ath_visit_audit where visit_id=$1',[v.id])).rows.length,3);
 await manage('assignment',{employee_id:ids.a,client_id:ids.client,active:true});const shift={employee_id:ids.a,client_id:ids.client,starts_at:'2026-11-15T14:00:00Z',ends_at:'2026-11-15T18:00:00Z',status:'scheduled'};await manage('schedule',shift);await assert.rejects(()=>manage('schedule',{...shift,starts_at:'2026-11-15T17:00:00Z'}),/overlapping/);
 await as('a');const uncertain=await clock('clock_in',crypto.randomUUID(),38.67,-90.44,250);assert.equal(uncertain.in_status,'uncertain');await clock('clock_out',crypto.randomUUID());const stale=await clock('clock_in',crypto.randomUUID(),38.67,-90.44,15,'2020-01-01T00:00:00Z');assert.equal(stale.in_status,'uncertain');
 await as('owner');await manage('staff',{id:ids.a,name:'Test a',role:'employee',active:false});await assert.rejects(()=>manage('staff',{id:ids.owner,name:'Owner',role:'employee',active:false}),/own access/);
 await as('a');await assert.rejects(()=>clock('clock_out',crypto.randomUUID()),/Staff access/);assert.equal((await db.query('select * from ath_clients')).rows.length,0);
 await db.exec('reset role');assert.equal((await db.query('select count(*)::int as n from ath_visits')).rows[0].n,3);
 }finally{await db.close()}
});
