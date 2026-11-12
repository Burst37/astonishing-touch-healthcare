-- Operational attendance only. No clinical records, payroll rates or billing claims.
create schema if not exists ath_private;
revoke all on schema ath_private from public;
grant usage on schema ath_private to authenticated;
create table public.ath_staff(id uuid primary key references auth.users(id),name text not null check(length(name) between 2 and 100),role text not null check(role in ('owner','manager','employee')),active boolean not null default true);
create table public.ath_clients(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 100),address text not null check(length(address) between 3 and 240),latitude double precision not null check(latitude between -90 and 90),longitude double precision not null check(longitude between -180 and 180),radius_m integer not null default 150 check(radius_m between 50 and 1000),active boolean not null default true);
alter table public.ath_staff add column phone text not null default '' check(length(phone)<=32),add column address text not null default '' check(length(address)<=240),add column photo_path text,add column sms_opt_in boolean not null default false;
alter table public.ath_clients add column phone text not null default '' check(length(phone)<=32),add column photo_path text;
create table public.ath_assignments(employee_id uuid references public.ath_staff(id),client_id uuid references public.ath_clients(id),active boolean not null default true,primary key(employee_id,client_id));
create table public.ath_visits(
 id uuid primary key default gen_random_uuid(),employee_id uuid not null references public.ath_staff(id),client_id uuid not null references public.ath_clients(id),
 clock_in timestamptz not null default clock_timestamp(),clock_out timestamptz check(clock_out>=clock_in),
 expected_lat double precision not null,expected_lng double precision not null,expected_radius integer not null,
 in_lat double precision,in_lng double precision,in_accuracy double precision,in_status text not null check(in_status in ('within_range','outside_range','uncertain','unavailable')),
 out_lat double precision,out_lng double precision,out_accuracy double precision,out_status text check(out_status in ('within_range','outside_range','uncertain','unavailable')),
 review_status text not null default 'pending' check(review_status in ('pending','approved','needs_review')),review_reason text
);
create unique index ath_one_open_visit on public.ath_visits(employee_id) where clock_out is null;
create index ath_visits_time on public.ath_visits(clock_in desc);
create index ath_assignments_client on public.ath_assignments(client_id);
create table public.ath_visit_audit(id uuid primary key default gen_random_uuid(),visit_id uuid references public.ath_visits(id),actor_id uuid not null references public.ath_staff(id),action text not null,reason text,before_state jsonb,after_state jsonb,request_id uuid unique,created_at timestamptz not null default clock_timestamp());
create table public.ath_schedule(id uuid primary key default gen_random_uuid(),employee_id uuid not null references public.ath_staff(id),client_id uuid not null references public.ath_clients(id),starts_at timestamptz not null,ends_at timestamptz not null check(ends_at>starts_at),status text not null default 'scheduled' check(status in ('scheduled','cancelled')));
create index ath_schedule_start on public.ath_schedule(starts_at);
create table public.ath_sms_outbox(id uuid primary key default gen_random_uuid(),employee_id uuid not null references public.ath_staff(id),work_day date not null,body text not null check(length(body)<=1500),status text not null default 'pending' check(status in ('pending','sending','accepted','delivered','failed','uncertain')),provider_id text,error_code text,claimed_at timestamptz,created_at timestamptz not null default clock_timestamp(),unique(employee_id,work_day));

create function ath_private.is_manager() returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from public.ath_staff where id=auth.uid() and active and role in ('owner','manager'))$$;
create function ath_private.is_owner() returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from public.ath_staff where id=auth.uid() and active and role='owner')$$;
revoke all on function ath_private.is_manager(),ath_private.is_owner() from public;
grant execute on function ath_private.is_manager(),ath_private.is_owner() to authenticated;
alter table public.ath_staff enable row level security;
alter table public.ath_clients enable row level security;
alter table public.ath_assignments enable row level security;
alter table public.ath_visits enable row level security;
alter table public.ath_visit_audit enable row level security;
alter table public.ath_schedule enable row level security;
alter table public.ath_sms_outbox enable row level security;
revoke all on public.ath_schedule,public.ath_sms_outbox from anon,authenticated;
grant select on public.ath_schedule,public.ath_sms_outbox to authenticated;
grant all on public.ath_staff,public.ath_clients,public.ath_assignments,public.ath_visits,public.ath_visit_audit,public.ath_schedule,public.ath_sms_outbox to service_role;
revoke all on public.ath_staff,public.ath_clients,public.ath_assignments,public.ath_visits,public.ath_visit_audit from anon,authenticated;
grant select on public.ath_staff,public.ath_clients,public.ath_assignments,public.ath_visits,public.ath_visit_audit to authenticated;
create policy staff_read on public.ath_staff for select to authenticated using(id=(select auth.uid()) or (select ath_private.is_manager()));
create policy assignment_read on public.ath_assignments for select to authenticated using((select ath_private.is_manager()) or (employee_id=(select auth.uid()) and exists(select 1 from public.ath_staff where id=(select auth.uid()) and active)));
create policy client_read on public.ath_clients for select to authenticated using((select ath_private.is_manager()) or (active and exists(select 1 from public.ath_assignments where client_id=ath_clients.id and employee_id=(select auth.uid()) and active)));
create policy visit_read on public.ath_visits for select to authenticated using((select ath_private.is_manager()) or (employee_id=(select auth.uid()) and exists(select 1 from public.ath_staff where id=(select auth.uid()) and active)));
create policy audit_read on public.ath_visit_audit for select to authenticated using((select ath_private.is_manager()));
create policy schedule_read on public.ath_schedule for select to authenticated using((select ath_private.is_manager()) or (employee_id=(select auth.uid()) and exists(select 1 from public.ath_staff where id=(select auth.uid()) and active)));
create policy sms_read on public.ath_sms_outbox for select to authenticated using((select ath_private.is_manager()));

create function ath_private.location_status(a double precision,b double precision,r integer,x double precision,y double precision,accuracy double precision,sampled timestamptz) returns text language plpgsql stable set search_path='' as $$
declare distance double precision;h double precision;
begin
 if x is null or y is null or accuracy is null then return 'unavailable'; end if;
 if x not between -90 and 90 or y not between -180 and 180 or accuracy not between 0 and 50000 then raise exception 'Invalid location reading';end if;
 if sampled is null or abs(extract(epoch from (clock_timestamp()-sampled)))>120 or accuracy>100 then return 'uncertain';end if;
 h=power(sin(radians(x-a)/2),2)+cos(radians(a))*cos(radians(x))*power(sin(radians(y-b)/2),2);
 distance=6371000*2*asin(sqrt(least(1,greatest(0,h))));
 if distance+accuracy<=r then return 'within_range';end if;
 if distance-accuracy>r then return 'outside_range';end if;
 return 'uncertain';
end $$;
revoke all on function ath_private.location_status(double precision,double precision,integer,double precision,double precision,double precision,timestamptz) from public;

create function ath_private.clock_visit(p_action text,p_client uuid,p_request uuid,p_lat double precision,p_lng double precision,p_accuracy double precision,p_sampled timestamptz) returns public.ath_visits language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid();v public.ath_visits;c public.ath_clients;prior public.ath_visit_audit;before_row jsonb;status text;
begin
 if actor is null or not exists(select 1 from public.ath_staff where id=actor and active) then raise exception 'Staff access required';end if;
 if p_action not in ('clock_in','clock_out') or p_request is null then raise exception 'Invalid clock action';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 select * into prior from public.ath_visit_audit where request_id=p_request;
 if found then
  if prior.actor_id<>actor or prior.action<>p_action then raise exception 'Request conflict';end if;
  select * into v from public.ath_visits where id=prior.visit_id;
  if v.client_id<>p_client then raise exception 'Request conflict';end if;return v;
 end if;
 if p_action='clock_in' then
  if exists(select 1 from public.ath_visits where employee_id=actor and clock_out is null) then raise exception 'Clock out of your active visit first';end if;
  select * into c from public.ath_clients where id=p_client and active;
  if not found or not exists(select 1 from public.ath_assignments where employee_id=actor and client_id=p_client and active) then raise exception 'Active client assignment required';end if;
  status=ath_private.location_status(c.latitude,c.longitude,c.radius_m,p_lat,p_lng,p_accuracy,p_sampled);
  insert into public.ath_visits(employee_id,client_id,expected_lat,expected_lng,expected_radius,in_lat,in_lng,in_accuracy,in_status,review_status)
  values(actor,c.id,c.latitude,c.longitude,c.radius_m,p_lat,p_lng,p_accuracy,status,case when status='within_range' then 'pending' else 'needs_review' end) returning * into v;
 else
  select * into v from public.ath_visits where employee_id=actor and client_id=p_client and clock_out is null for update;
  if not found then raise exception 'No active visit for this client';end if;
  before_row=to_jsonb(v);
  status=ath_private.location_status(v.expected_lat,v.expected_lng,v.expected_radius,p_lat,p_lng,p_accuracy,p_sampled);
  update public.ath_visits set clock_out=clock_timestamp(),out_lat=p_lat,out_lng=p_lng,out_accuracy=p_accuracy,out_status=status,review_status=case when status='within_range' and in_status='within_range' then 'pending' else 'needs_review' end where id=v.id returning * into v;
 end if;
 insert into public.ath_visit_audit(visit_id,actor_id,action,before_state,after_state,request_id)values(v.id,actor,p_action,before_row,to_jsonb(v),p_request);
 return v;
end $$;
revoke all on function ath_private.clock_visit(text,uuid,uuid,double precision,double precision,double precision,timestamptz) from public;
grant execute on function ath_private.clock_visit(text,uuid,uuid,double precision,double precision,double precision,timestamptz) to authenticated;
create function public.ath_clock_visit(p_action text,p_client uuid,p_request uuid,p_lat double precision default null,p_lng double precision default null,p_accuracy double precision default null,p_sampled timestamptz default null) returns public.ath_visits language sql security invoker set search_path='' as $$select ath_private.clock_visit(p_action,p_client,p_request,p_lat,p_lng,p_accuracy,p_sampled)$$;
revoke all on function public.ath_clock_visit(text,uuid,uuid,double precision,double precision,double precision,timestamptz) from public,anon;
grant execute on function public.ath_clock_visit(text,uuid,uuid,double precision,double precision,double precision,timestamptz) to authenticated;

create function ath_private.manage(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid();v public.ath_visits;old jsonb;result jsonb;reason text=trim(p_data->>'reason');
begin
 if not ath_private.is_manager() then raise exception 'Manager access required';end if;
 if p_action='client' then
  insert into public.ath_clients(id,name,address,latitude,longitude,radius_m,active,phone)values(coalesce((p_data->>'id')::uuid,gen_random_uuid()),p_data->>'name',p_data->>'address',(p_data->>'latitude')::double precision,(p_data->>'longitude')::double precision,coalesce((p_data->>'radius_m')::integer,150),coalesce((p_data->>'active')::boolean,true),coalesce(p_data->>'phone',''))
  on conflict(id)do update set name=excluded.name,address=excluded.address,latitude=excluded.latitude,longitude=excluded.longitude,radius_m=excluded.radius_m,active=excluded.active,phone=excluded.phone returning to_jsonb(ath_clients.*) into result;
 elsif p_action='staff_contact' then
  update public.ath_staff set name=p_data->>'name',phone=coalesce(p_data->>'phone',''),address=coalesce(p_data->>'address',''),sms_opt_in=coalesce((p_data->>'sms_opt_in')::boolean,false) where id=(p_data->>'id')::uuid returning to_jsonb(ath_staff.*) into result;
  if not found then raise exception 'Staff profile not found';end if;
 elsif p_action='register_employee' then
  insert into public.ath_staff(id,name,role)values((p_data->>'id')::uuid,p_data->>'name','employee') returning to_jsonb(ath_staff.*) into result;
 elsif p_action='photo' then
  if length(p_data->>'path')>240 or position('..' in p_data->>'path')>0 then raise exception 'Invalid photo path';end if;
  if p_data->>'kind'='staff' and (p_data->>'path') like 'staff/'||(p_data->>'id')||'/%' then
   update public.ath_staff set photo_path=p_data->>'path' where id=(p_data->>'id')::uuid returning to_jsonb(ath_staff.*) into result;
  elsif p_data->>'kind'='client' and (p_data->>'path') like 'client/'||(p_data->>'id')||'/%' then
   update public.ath_clients set photo_path=p_data->>'path' where id=(p_data->>'id')::uuid returning to_jsonb(ath_clients.*) into result;
  else raise exception 'Invalid photo subject';end if;
 elsif p_action='assignment' then
  insert into public.ath_assignments(employee_id,client_id,active)values((p_data->>'employee_id')::uuid,(p_data->>'client_id')::uuid,(p_data->>'active')::boolean)on conflict(employee_id,client_id)do update set active=excluded.active returning to_jsonb(ath_assignments.*) into result;
 elsif p_action='staff' then
  if not ath_private.is_owner() then raise exception 'Owner access required';end if;
  if (p_data->>'id')::uuid=actor then raise exception 'An owner cannot change their own access';end if;
  insert into public.ath_staff(id,name,role,active)values((p_data->>'id')::uuid,p_data->>'name',p_data->>'role',(p_data->>'active')::boolean)on conflict(id)do update set name=excluded.name,role=excluded.role,active=excluded.active returning to_jsonb(ath_staff.*) into result;
 elsif p_action='schedule' then
  perform pg_advisory_xact_lock(hashtextextended(p_data->>'employee_id',0));
  if not exists(select 1 from public.ath_staff where id=(p_data->>'employee_id')::uuid and active) or not exists(select 1 from public.ath_clients where id=(p_data->>'client_id')::uuid and active) or not exists(select 1 from public.ath_assignments where employee_id=(p_data->>'employee_id')::uuid and client_id=(p_data->>'client_id')::uuid and active) then raise exception 'Active staff and assignment required';end if;
  if p_data->>'status'='scheduled' and exists(select 1 from public.ath_schedule where employee_id=(p_data->>'employee_id')::uuid and status='scheduled' and id<>coalesce((p_data->>'id')::uuid,'00000000-0000-0000-0000-000000000000') and tstzrange(starts_at,ends_at,'[)')&&tstzrange((p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,'[)')) then raise exception 'This employee has an overlapping visit';end if;
  insert into public.ath_schedule(id,employee_id,client_id,starts_at,ends_at,status)values(coalesce((p_data->>'id')::uuid,gen_random_uuid()),(p_data->>'employee_id')::uuid,(p_data->>'client_id')::uuid,(p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,p_data->>'status')on conflict(id)do update set employee_id=excluded.employee_id,client_id=excluded.client_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,status=excluded.status returning to_jsonb(ath_schedule.*) into result;
 elsif p_action in ('review','adjust') then
  if reason is null or length(reason)<10 or length(reason)>500 then raise exception 'A review reason of 10 to 500 characters is required';end if;
  select * into v from public.ath_visits where id=(p_data->>'id')::uuid for update;
  if not found then raise exception 'Visit not found';end if;old=to_jsonb(v);
  if p_action='review' then
   if v.clock_out is null then raise exception 'Close the visit before approval';end if;
   if p_data->>'status' not in ('approved','needs_review') then raise exception 'Invalid review status';end if;
   update public.ath_visits set review_status=p_data->>'status',review_reason=reason where id=v.id returning * into v;
  else
   update public.ath_visits set clock_in=(p_data->>'clock_in')::timestamptz,clock_out=(p_data->>'clock_out')::timestamptz,review_status='needs_review',review_reason=reason where id=v.id returning * into v;
  end if;
  result=to_jsonb(v);
 else raise exception 'Invalid management action';end if;
 insert into public.ath_visit_audit(visit_id,actor_id,action,reason,before_state,after_state)values(case when p_action in ('review','adjust') then v.id else null end,actor,p_action,reason,old,result);
 return result;
end $$;
revoke all on function ath_private.manage(text,jsonb) from public;
grant execute on function ath_private.manage(text,jsonb) to authenticated;
create function public.ath_manage(p_action text,p_data jsonb)returns jsonb language sql security invoker set search_path='' as $$select ath_private.manage(p_action,p_data)$$;
revoke all on function public.ath_manage(text,jsonb) from public,anon;
grant execute on function public.ath_manage(text,jsonb) to authenticated;

create function public.ath_claim_sms()returns setof public.ath_sms_outbox language sql security invoker set search_path='' as $$
 update public.ath_sms_outbox set status='sending',claimed_at=clock_timestamp() where id in(select id from public.ath_sms_outbox where status='pending' order by created_at for update skip locked limit 1) returning *
$$;
revoke all on function public.ath_claim_sms() from public,anon,authenticated;
grant execute on function public.ath_claim_sms() to service_role;

-- Photos are private. Storage paths are profile IDs, never names or addresses.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('ath-profile-photos','ath-profile-photos',false,5242880,array['image/jpeg','image/png','image/webp'])on conflict(id)do nothing;
create policy ath_photo_read on storage.objects for select to authenticated using(bucket_id='ath-profile-photos' and ((select ath_private.is_manager()) or exists(select 1 from public.ath_staff where id=(select auth.uid()) and active and photo_path=storage.objects.name) or exists(select 1 from public.ath_clients where photo_path=storage.objects.name)));
create policy ath_photo_insert on storage.objects for insert to authenticated with check(bucket_id='ath-profile-photos' and (select ath_private.is_manager()));
