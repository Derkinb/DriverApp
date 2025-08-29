-- minimal schema for Supabase
create table if not exists trucks ( id text primary key, reg text not null, trailer_id text );
create table if not exists users_public ( id text primary key, email text not null, name text not null, role text not null check (role in ('admin','driver')) );
create table if not exists assignments ( driver_id text references users_public(id) on delete cascade, truck_id text references trucks(id) on delete set null, primary key (driver_id) );
create table if not exists defects ( id uuid primary key default gen_random_uuid(), driver_id text not null references users_public(id) on delete cascade, truck_id text references trucks(id) on delete set null, time timestamptz not null default now(), area text not null, description text, truck_stopped boolean not null default false, status text not null check (status in ('Zgłoszono','W trakcie','Naprawione')) default 'Zgłoszono', archived boolean not null default false );
create table if not exists tasks ( id uuid primary key default gen_random_uuid(), driver_id text not null references users_public(id) on delete cascade, title text not null, address text, description text, created_at timestamptz not null default now(), done boolean not null default false );
alter table assignments enable row level security; alter table defects enable row level security; alter table tasks enable row level security; alter table trucks enable row level security; alter table users_public enable row level security;
create policy "read_all_admin" on assignments for select using (true);
create policy "read_all_admin_def" on defects for select using (true);
create policy "read_all_admin_tasks" on tasks for select using (true);
create policy "read_trucks" on trucks for select using (true);
create policy "read_users" on users_public for select using (true);
create policy "insert_assignments" on assignments for insert with check (true);
create policy "upsert_assignments" on assignments for update using (true);
create policy "insert_defects" on defects for insert with check (true);
create policy "update_defects" on defects for update using (true);
create policy "insert_tasks" on tasks for insert with check (true);
create policy "update_tasks" on tasks for update using (true);
