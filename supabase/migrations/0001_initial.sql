-- PartyPost initial schema
-- Run via: supabase db push, or paste into Supabase SQL editor

-- ===== Tables =====

create table if not exists public.parties (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  host_user_id          uuid not null references auth.users(id) on delete cascade,
  birthday_child_name   text not null,
  birthday_age          integer,
  party_title           text not null,
  description           text,
  date                  date,
  start_time            time,
  end_time              time,
  timezone              text default 'America/New_York',
  location_name         text,
  location_address      text,
  map_url               text,
  rsvp_deadline         date,
  host_name             text,
  host_email            text,
  host_phone            text,
  gift_note             text,
  food_note             text,
  rain_plan             text,
  theme                 text default 'default',
  hero_image_url        text,
  profile_image_url     text,
  is_password_protected boolean not null default false,
  password_hash         text,
  is_published          boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists parties_host_user_id_idx on public.parties(host_user_id);
create index if not exists parties_slug_idx on public.parties(slug);

create table if not exists public.rsvps (
  id                  uuid primary key default gen_random_uuid(),
  party_id            uuid not null references public.parties(id) on delete cascade,
  edit_token          text unique not null,
  status              text not null check (status in ('yes','no','maybe')),
  parent_names        text not null,
  email               text not null,
  phone               text,
  child_names         text,
  kids_count          integer not null default 0 check (kids_count >= 0),
  adults_count        integer not null default 0 check (adults_count >= 0),
  total_count         integer generated always as (kids_count + adults_count) stored,
  allergy_notes       text,
  private_note        text,
  public_note         text,
  public_note_consent boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists rsvps_party_id_idx on public.rsvps(party_id);
create index if not exists rsvps_edit_token_idx on public.rsvps(edit_token);

create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  party_id      uuid not null references public.parties(id) on delete cascade,
  rsvp_id       uuid references public.rsvps(id) on delete set null,
  display_name  text not null,
  message       text not null,
  is_public     boolean not null default true,
  is_approved   boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists notes_party_id_idx on public.notes(party_id);

create table if not exists public.party_images (
  id          uuid primary key default gen_random_uuid(),
  party_id    uuid not null references public.parties(id) on delete cascade,
  uploaded_by text not null default 'admin' check (uploaded_by in ('admin','guest')),
  image_type  text not null default 'gallery' check (image_type in ('hero','profile','gallery')),
  image_url   text not null,
  caption     text,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists party_images_party_id_idx on public.party_images(party_id);

-- ===== updated_at trigger =====

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists parties_set_updated_at on public.parties;
create trigger parties_set_updated_at before update on public.parties
  for each row execute function public.set_updated_at();

drop trigger if exists rsvps_set_updated_at on public.rsvps;
create trigger rsvps_set_updated_at before update on public.rsvps
  for each row execute function public.set_updated_at();

-- ===== Row Level Security =====

alter table public.parties enable row level security;
alter table public.rsvps enable row level security;
alter table public.notes enable row level security;
alter table public.party_images enable row level security;

-- parties: published parties visible to anyone; admin sees + manages own
drop policy if exists parties_select_public on public.parties;
create policy parties_select_public on public.parties
  for select using (is_published = true);

drop policy if exists parties_select_owner on public.parties;
create policy parties_select_owner on public.parties
  for select to authenticated using (host_user_id = auth.uid());

drop policy if exists parties_insert_owner on public.parties;
create policy parties_insert_owner on public.parties
  for insert to authenticated with check (host_user_id = auth.uid());

drop policy if exists parties_update_owner on public.parties;
create policy parties_update_owner on public.parties
  for update to authenticated using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

drop policy if exists parties_delete_owner on public.parties;
create policy parties_delete_owner on public.parties
  for delete to authenticated using (host_user_id = auth.uid());

-- rsvps: admin reads/writes own party rsvps; guests POST via server route (service role)
-- Guest reads/edits go through Next.js API using service role + token check
drop policy if exists rsvps_select_owner on public.rsvps;
create policy rsvps_select_owner on public.rsvps
  for select to authenticated
  using (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

drop policy if exists rsvps_insert_published on public.rsvps;
create policy rsvps_insert_published on public.rsvps
  for insert to anon, authenticated
  with check (exists (select 1 from public.parties p where p.id = party_id and p.is_published = true));

drop policy if exists rsvps_update_owner on public.rsvps;
create policy rsvps_update_owner on public.rsvps
  for update to authenticated
  using (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

drop policy if exists rsvps_delete_owner on public.rsvps;
create policy rsvps_delete_owner on public.rsvps
  for delete to authenticated
  using (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

-- notes: public sees approved+public; admin sees all of own party's notes
drop policy if exists notes_select_public on public.notes;
create policy notes_select_public on public.notes
  for select using (
    is_approved = true
    and is_public = true
    and exists (select 1 from public.parties p where p.id = party_id and p.is_published = true)
  );

drop policy if exists notes_select_owner on public.notes;
create policy notes_select_owner on public.notes
  for select to authenticated
  using (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

drop policy if exists notes_insert_public on public.notes;
create policy notes_insert_public on public.notes
  for insert to anon, authenticated
  with check (exists (select 1 from public.parties p where p.id = party_id and p.is_published = true));

drop policy if exists notes_update_owner on public.notes;
create policy notes_update_owner on public.notes
  for update to authenticated
  using (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

drop policy if exists notes_delete_owner on public.notes;
create policy notes_delete_owner on public.notes
  for delete to authenticated
  using (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

-- party_images: public sees images for published parties; admin manages own
drop policy if exists party_images_select_public on public.party_images;
create policy party_images_select_public on public.party_images
  for select using (
    is_approved = true
    and exists (select 1 from public.parties p where p.id = party_id and p.is_published = true)
  );

drop policy if exists party_images_select_owner on public.party_images;
create policy party_images_select_owner on public.party_images
  for select to authenticated
  using (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

drop policy if exists party_images_insert_owner on public.party_images;
create policy party_images_insert_owner on public.party_images
  for insert to authenticated
  with check (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

drop policy if exists party_images_delete_owner on public.party_images;
create policy party_images_delete_owner on public.party_images
  for delete to authenticated
  using (exists (select 1 from public.parties p where p.id = party_id and p.host_user_id = auth.uid()));

-- ===== Storage bucket =====
-- Run this in Supabase SQL editor, or create the bucket manually in the dashboard.

insert into storage.buckets (id, name, public)
values ('party-images', 'party-images', true)
on conflict (id) do nothing;

-- Storage RLS: public read; authenticated owners can upload/delete to their party folders.
-- Path convention: <party_id>/<type>/<filename>

drop policy if exists storage_party_images_read on storage.objects;
create policy storage_party_images_read on storage.objects
  for select using (bucket_id = 'party-images');

drop policy if exists storage_party_images_insert on storage.objects;
create policy storage_party_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'party-images'
    and exists (
      select 1 from public.parties p
      where p.host_user_id = auth.uid()
        and (storage.foldername(name))[1] = p.id::text
    )
  );

drop policy if exists storage_party_images_delete on storage.objects;
create policy storage_party_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'party-images'
    and exists (
      select 1 from public.parties p
      where p.host_user_id = auth.uid()
        and (storage.foldername(name))[1] = p.id::text
    )
  );
