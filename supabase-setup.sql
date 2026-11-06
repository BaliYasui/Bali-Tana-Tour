-- Jalankan di Supabase SQL Editor.
create table if not exists public.tour_prices (
  id text primary key,
  amount_idr bigint not null check (amount_idr >= 0),
  updated_at timestamptz not null default now()
);

insert into public.tour_prices (id, amount_idr)
values
  ('ubud-cultural-tour', 800000),
  ('beautiful-temple-hidden-hill', 1000000),
  ('east-bali-tour', 1000000),
  ('mount-batur-volcano', 850000)
on conflict (id) do nothing;

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

-- Izin publik membaca URL foto dan hanya admin yang boleh menggantinya.
alter table public.site_images enable row level security;
grant select on public.site_images to anon, authenticated;
grant update (image_url) on public.site_images to authenticated;

drop policy if exists "Anyone can read site images" on public.site_images;
create policy "Anyone can read site images"
on public.site_images for select
to anon, authenticated
using (true);

drop policy if exists "Only designated admin can update site images" on public.site_images;
create policy "Only designated admin can update site images"
on public.site_images for update
to authenticated
using (auth.uid() = '6c5302d6-25f9-4649-baa5-6d3d9159cecd'::uuid)
with check (auth.uid() = '6c5302d6-25f9-4649-baa5-6d3d9159cecd'::uuid);

-- Bucket publik agar foto dapat ditampilkan di website; hanya admin yang dapat mengunggah.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 10485760, array['image/*']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view site image uploads" on storage.objects;
create policy "Public can view site image uploads"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-images');

drop policy if exists "Only designated admin can upload site images" on storage.objects;
create policy "Only designated admin can upload site images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-images'
  and auth.uid() = '6c5302d6-25f9-4649-baa5-6d3d9159cecd'::uuid
);
