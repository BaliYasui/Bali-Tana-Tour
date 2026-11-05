-- Jalankan di Supabase SQL Editor.
create table if not exists public.tour_prices (
  id text primary key,
  amount_idr bigint not null check (amount_idr >= 0),
  updated_at timestamptz not null default now()
);

insert into public.tour_prices (id, amount_idr)
values
  ('ubud-cultural-tour', 800000),
  ('beautiful-temple-hidden-hill', 1000000)
on conflict (id) do update
set amount_idr = excluded.amount_idr,
    updated_at = now();

alter table public.tour_prices enable row level security;

grant select on public.tour_prices to anon, authenticated;
grant update (amount_idr, updated_at) on public.tour_prices to authenticated;

drop policy if exists "Anyone can read tour prices" on public.tour_prices;
create policy "Anyone can read tour prices"
on public.tour_prices for select
to anon, authenticated
using (true);

drop policy if exists "Only designated admin can update prices" on public.tour_prices;
create policy "Only designated admin can update prices"
on public.tour_prices for update
to authenticated
using (auth.uid() = '6c5302d6-25f9-4649-baa5-6d3d9159cecd'::uuid)
with check (auth.uid() = '6c5302d6-25f9-4649-baa5-6d3d9159cecd'::uuid);
