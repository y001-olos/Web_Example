create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null,
  movie_title text not null,
  poster_path text,
  rating integer not null check (rating between 1 and 5),
  content text not null check (char_length(content) between 1 and 3000),
  ai_assisted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, movie_id)
);
alter table public.reviews enable row level security;
create policy "read own reviews" on public.reviews for select using (auth.uid() = user_id);
create policy "insert own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "update own reviews" on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own reviews" on public.reviews for delete using (auth.uid() = user_id);
