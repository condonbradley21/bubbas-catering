-- Separate demo tables: existing production orders are never modified.
create table public.demo_menu (
 id text primary key, name text not null, unit text not null,
 price_cents integer not null check(price_cents > 0 and price_cents <= 100000),
 aliases jsonb not null default '[]', active boolean not null default true
);
create table public.demo_events (
 id uuid primary key default gen_random_uuid(), title text not null,
 starts_at timestamptz not null, ends_at timestamptz not null,
 venue text not null, address text not null, confirmed boolean not null default false,
 check(ends_at > starts_at)
);
create table public.demo_order_requests (
 id uuid primary key default gen_random_uuid(), request_key uuid not null unique,
 payload_hash text not null, customer_name text not null,
 preferred_date date, notes text not null default '',
 estimate jsonb not null, status text not null default 'demo_requested' check(status='demo_requested'),
 created_at timestamptz not null default now()
);
create index demo_order_requests_created_idx on public.demo_order_requests(created_at desc);
create table public.demo_assistant_limits (
 bucket text primary key, hits integer not null, expires_at timestamptz not null
);
alter table public.demo_menu enable row level security;
alter table public.demo_events enable row level security;
alter table public.demo_order_requests enable row level security;
alter table public.demo_assistant_limits enable row level security;
revoke all on public.demo_menu,public.demo_events,public.demo_order_requests,public.demo_assistant_limits from anon,authenticated;
-- Only the backend service can access these records. No customer-list endpoint.
grant all on public.demo_menu,public.demo_events,public.demo_order_requests,public.demo_assistant_limits to service_role;
create or replace function public.consume_demo_limit(p_bucket text,p_limit integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare current_hits integer;
begin
 delete from public.demo_assistant_limits where expires_at < now();
 insert into public.demo_assistant_limits(bucket,hits,expires_at)
 values(p_bucket,1,now()+interval '1 hour')
 on conflict(bucket) do update set hits=public.demo_assistant_limits.hits+1
 returning hits into current_hits;
 return current_hits <= p_limit;
end; $$;
revoke all on function public.consume_demo_limit(text,integer) from public,anon,authenticated;
grant execute on function public.consume_demo_limit(text,integer) to service_role;
insert into public.demo_menu(id,name,unit,price_cents,aliases) values
('brisket-sandwich','Brisket sandwich','sandwich',1400,'["brisket sandwich","brisket sandwiches"]'),
('pulled-pork-sandwich','Pulled pork sandwich','sandwich',1000,'["pulled pork sandwich","pulled pork sandwiches","pork sandwiches"]'),
('chicken-sandwich','Sweet Cajun chicken sandwich','sandwich',1100,'["chicken sandwich","chicken sandwiches"]'),
('half-rack-ribs','Half rack of ribs','half rack',1800,'["half rack of ribs","half racks of ribs","half racks","half rack"]'),
('full-rack-ribs','Full rack of ribs','full rack',3000,'["full rack of ribs","full racks of ribs","full racks","full rack"]'),
('mac-cheese','Mac & cheese','individual side',450,'["mac and cheese","mac & cheese","mac cheese"]'),
('coleslaw','Coleslaw','individual side',350,'["coleslaw","slaw"]'),
('bbq-beans','BBQ beans','individual side',400,'["bbq beans","baked beans","beans"]');
-- No invented public events are inserted.
