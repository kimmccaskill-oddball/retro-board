-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade not null,
  title text not null,
  color text not null default '#1D9E75',
  position integer not null default 0,
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade not null,
  column_id uuid references columns(id) on delete cascade not null,
  text text not null,
  votes integer not null default 0,
  created_at timestamptz default now()
);

-- Enable realtime for live updates
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table columns;

-- Allow public access (no auth required for participants)
alter table boards enable row level security;
alter table columns enable row level security;
alter table cards enable row level security;

create policy "Public read boards" on boards for select using (true);
create policy "Public insert boards" on boards for insert with check (true);

create policy "Public read columns" on columns for select using (true);
create policy "Public insert columns" on columns for insert with check (true);
create policy "Public update columns" on columns for update using (true);
create policy "Public delete columns" on columns for delete using (true);

create policy "Public read cards" on cards for select using (true);
create policy "Public insert cards" on cards for insert with check (true);
create policy "Public update cards" on cards for update using (true);
create policy "Public delete cards" on cards for delete using (true);
