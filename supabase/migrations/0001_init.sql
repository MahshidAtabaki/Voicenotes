-- ============================================================
-- Voice Capture — initial schema, RLS, storage, triggers
-- The AI invariant is honoured in the schema: original content
-- (original_text / transcript / source_text + char range) is stored
-- separately from generated fields (title / summary / tags).
-- ============================================================

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------- Capture sessions ----------
create table if not exists public.capture_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('voice', 'text')),
  title text not null default '',
  summary text not null default '',
  -- ORIGINALS — kept exactly, never rewritten
  original_text text,              -- text captures
  transcript text,                 -- voice captures (preserved verbatim)
  audio_path text,                 -- storage object path in voice-captures bucket
  duration_seconds integer,
  shared boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists capture_sessions_user_idx
  on public.capture_sessions (user_id, created_at desc);

-- ---------- Thought items (organised units) ----------
create table if not exists public.thought_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.capture_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  order_index integer not null default 0,
  type text not null check (type in ('thought', 'emotion', 'experience', 'question', 'mixed')),
  -- ORIGINAL words + exact range into the session's original input
  source_text text not null,
  start_character integer not null default 0,
  end_character integer not null default 0,
  -- GENERATED (editable) — stored separately from the original words
  title text not null default '',
  summary text not null default '',
  shared boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists thought_items_session_idx
  on public.thought_items (session_id, order_index);
create index if not exists thought_items_user_idx
  on public.thought_items (user_id);

-- ---------- Thought tags (emotions / topics) ----------
create table if not exists public.thought_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.thought_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('emotion', 'topic')),
  label text not null,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists thought_tags_item_idx on public.thought_tags (item_id);

-- ============================================================
-- Row Level Security — users may only touch their own rows
-- ============================================================
alter table public.profiles enable row level security;
alter table public.capture_sessions enable row level security;
alter table public.thought_items enable row level security;
alter table public.thought_tags enable row level security;

-- profiles
drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles self upsert" on public.profiles;
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- capture_sessions
drop policy if exists "sessions owner all" on public.capture_sessions;
create policy "sessions owner all" on public.capture_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- thought_items
drop policy if exists "items owner all" on public.thought_items;
create policy "items owner all" on public.thought_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- thought_tags
drop policy if exists "tags owner all" on public.thought_tags;
create policy "tags owner all" on public.thought_tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Private storage bucket for audio
-- ============================================================
insert into storage.buckets (id, name, public)
values ('voice-captures', 'voice-captures', false)
on conflict (id) do nothing;

-- Objects live under "<user_id>/..." — owner-only access.
drop policy if exists "audio owner read" on storage.objects;
create policy "audio owner read" on storage.objects
  for select using (
    bucket_id = 'voice-captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "audio owner insert" on storage.objects;
create policy "audio owner insert" on storage.objects
  for insert with check (
    bucket_id = 'voice-captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "audio owner update" on storage.objects;
create policy "audio owner update" on storage.objects
  for update using (
    bucket_id = 'voice-captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "audio owner delete" on storage.objects;
create policy "audio owner delete" on storage.objects
  for delete using (
    bucket_id = 'voice-captures'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Triggers
-- ============================================================
-- Create a profile row automatically on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh on capture_sessions.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists capture_sessions_set_updated_at on public.capture_sessions;
create trigger capture_sessions_set_updated_at
  before update on public.capture_sessions
  for each row execute function public.set_updated_at();
