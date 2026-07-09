-- Run this SQL in your Supabase SQL Editor to create the viral_videos table

create table viral_videos (
  id uuid default gen_random_uuid() primary key,
  youtube_url text not null,
  title text,
  views integer default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table viral_videos enable row level security;

-- Allow all operations (public access)
create policy "Allow all operations" on viral_videos
  for all
  using (true)
  with check (true);

-- Create index for search
create index viral_videos_title_idx on viral_videos using gin (to_tsvector('english', coalesce(title, '')));
create index viral_videos_views_idx on viral_videos (views desc);
create index viral_videos_created_at_idx on viral_videos (created_at desc);
