-- Add cover_photo and logo columns to neighborhoods table
ALTER TABLE public.neighborhoods
ADD COLUMN cover_photo text null,
ADD COLUMN logo text null,
ADD COLUMN guidelines text null;

-- Complete updated schema for reference:
-- create table public.neighborhoods (
--   id serial not null,
--   name character varying(100) null,
--   city character varying(100) null,
--   state character varying(100) null,
--   description text null,
--   population integer null,
--   primary_landmark character varying(150) null,
--   admin_id character varying null,
--   verified boolean null default false,
--   created_date timestamp without time zone null default CURRENT_TIMESTAMP,
--   cover_photo text null,
--   logo text null,
--   guidelines text null,
--   constraint neighborhoods_pkey primary key (id)
-- ) TABLESPACE pg_default;
