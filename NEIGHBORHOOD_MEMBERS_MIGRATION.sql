-- Migration: Add neighborhood_members table to track user-neighborhood relationships
-- This allows users to join neighborhoods with one-to-one relationship (can only join one neighborhood at a time)

-- 1. Create neighborhood_members table
CREATE TABLE IF NOT EXISTS public.neighborhood_members (
  id serial not null,
  user_id uuid not null,
  neighborhood_id integer not null,
  joined_date timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint neighborhood_members_pkey primary key (id),
  constraint neighborhood_members_user_neighborhood_unique unique (user_id, neighborhood_id),
  constraint neighborhood_members_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint neighborhood_members_neighborhood_id_fkey foreign key (neighborhood_id) references neighborhoods(id) on delete cascade
) TABLESPACE pg_default;

-- 2. Add index for faster lookups
CREATE INDEX IF NOT EXISTS neighborhood_members_user_id_idx on public.neighborhood_members (user_id);
CREATE INDEX IF NOT EXISTS neighborhood_members_neighborhood_id_idx on public.neighborhood_members (neighborhood_id);

-- 3. Add neighborhoods_id column if not exists (for easy lookup of user's neighborhood)
ALTER TABLE public.neighborhoods
ADD COLUMN member_count integer null default 0;

-- 4. Grant appropriate permissions
GRANT ALL ON TABLE public.neighborhood_members TO authenticated;
GRANT ALL ON TABLE public.neighborhoods TO authenticated;
