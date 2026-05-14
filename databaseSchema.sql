-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Superadmin (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id integer,
  CONSTRAINT Superadmin_pkey PRIMARY KEY (id),
  CONSTRAINT Superadmin_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.alerts (
  id integer NOT NULL DEFAULT nextval('alerts_id_seq'::regclass),
  author_id integer,
  type character varying,
  title character varying,
  description text,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  severity character varying,
  resolved boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  neighborhood_id integer,
  CONSTRAINT alerts_pkey PRIMARY KEY (id),
  CONSTRAINT alerts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
  CONSTRAINT alerts_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.appeals (
  id integer NOT NULL DEFAULT nextval('appeals_id_seq'::regclass),
  user_id integer NOT NULL,
  report_id integer NOT NULL,
  reason text,
  status character varying DEFAULT 'pending'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT appeals_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  id integer NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  author_id integer,
  post_id integer,
  content text,
  time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.conflict_cases (
  id integer NOT NULL DEFAULT nextval('conflict_cases_id_seq'::regclass),
  report_id integer NOT NULL,
  user_1 integer,
  user_2 integer,
  description text,
  status character varying DEFAULT 'open'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT conflict_cases_pkey PRIMARY KEY (id)
);
CREATE TABLE public.conversation_participants (
  conversation_id integer NOT NULL,
  user_id integer NOT NULL,
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.conversations (
  id integer NOT NULL DEFAULT nextval('conversations_id_seq'::regclass),
  last_message text,
  last_message_time timestamp without time zone,
  unread_count integer DEFAULT 0,
  is_group boolean DEFAULT false,
  group_name character varying,
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event_attendees (
  event_id integer NOT NULL,
  user_id integer NOT NULL,
  joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT event_attendees_pkey PRIMARY KEY (event_id, user_id),
  CONSTRAINT event_attendees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.events (
  id integer NOT NULL DEFAULT nextval('events_id_seq'::regclass),
  organizer_id integer,
  neighborhood_id integer,
  title character varying,
  description text,
  date date,
  time time without time zone,
  location text,
  category character varying,
  max_attendees integer,
  image text,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id),
  CONSTRAINT events_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.marketplace_items (
  id integer NOT NULL DEFAULT nextval('marketplace_items_id_seq'::regclass),
  seller_id integer,
  title character varying,
  description text,
  price numeric,
  condition character varying,
  category character varying,
  image text,
  posted_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status character varying DEFAULT 'available'::character varying,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  neighborhood_id integer,
  CONSTRAINT marketplace_items_pkey PRIMARY KEY (id),
  CONSTRAINT marketplace_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id),
  CONSTRAINT marketplace_items_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.messages (
  id integer NOT NULL DEFAULT nextval('messages_id_seq'::regclass),
  conversation_id integer,
  sender_id integer,
  content text,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  read boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  image text DEFAULT ''::text,
  is_edited boolean DEFAULT false,
  deleted_for_everyone boolean DEFAULT false,
  deleted_for ARRAY DEFAULT '{}'::uuid[],
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);
CREATE TABLE public.neighborhood_members (
  id integer NOT NULL DEFAULT nextval('neighborhood_members_id_seq'::regclass),
  user_id character varying NOT NULL,
  neighborhood_id integer NOT NULL,
  joined_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status text DEFAULT 'pending'::text,
  verified_at timestamp with time zone,
  user_location_city text,
  user_location_state text,
  CONSTRAINT neighborhood_members_pkey PRIMARY KEY (id),
  CONSTRAINT neighborhood_members_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.neighborhood_proposals (
  id bigint NOT NULL DEFAULT nextval('neighborhood_proposals_id_seq'::regclass),
  proposer_id character varying NOT NULL,
  proposer_name character varying NOT NULL,
  name character varying NOT NULL,
  city character varying NOT NULL,
  state character varying NOT NULL,
  description text NOT NULL,
  primary_landmark character varying NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  submitted_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  reviewed_date timestamp without time zone,
  review_notes text,
  admin_id character varying,
  CONSTRAINT neighborhood_proposals_pkey PRIMARY KEY (id)
);
CREATE TABLE public.neighborhood_settings (
  neighborhood_id integer NOT NULL,
  enable_marketplace boolean DEFAULT true,
  enable_resource_exchange boolean DEFAULT true,
  enable_public_alerts boolean DEFAULT true,
  enable_events boolean DEFAULT true,
  enable_services boolean DEFAULT true,
  require_verification boolean DEFAULT false,
  guidelines text,
  CONSTRAINT neighborhood_settings_pkey PRIMARY KEY (neighborhood_id),
  CONSTRAINT neighborhood_settings_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.neighborhoods (
  id integer NOT NULL DEFAULT nextval('neighborhoods_id_seq'::regclass),
  name character varying,
  city character varying,
  state character varying,
  description text,
  population integer,
  primary_landmark character varying,
  verified boolean DEFAULT false,
  created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  cover_photo text,
  logo text,
  guidelines text,
  member_count integer DEFAULT 0,
  admin_id integer,
  CONSTRAINT neighborhoods_pkey PRIMARY KEY (id),
  CONSTRAINT neighborhoods_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id integer,
  type character varying,
  title character varying,
  message text,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  read boolean DEFAULT false,
  action_url text,
  item_id integer,
  item_type character varying,
  neighborhood_id integer,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT notifications_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.post_likes (
  post_id integer NOT NULL,
  user_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT post_likes_pkey PRIMARY KEY (post_id, user_id),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.posts (
  id integer NOT NULL DEFAULT nextval('posts_id_seq'::regclass),
  author_id character varying,
  content text,
  image text,
  likes integer DEFAULT 0,
  category character varying,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  neighborhod_id integer,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_neighborhod_id_fkey FOREIGN KEY (neighborhod_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.provider_applications (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer NOT NULL,
  category text,
  experience text,
  description text,
  neighborhood_id integer,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone,
  rejection_reason text,
  CONSTRAINT provider_applications_pkey PRIMARY KEY (id),
  CONSTRAINT provider_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT provider_applications_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.reports (
  id integer NOT NULL DEFAULT nextval('reports_id_seq'::regclass),
  reporter_id integer,
  reported_item_id integer,
  reported_item_type character varying,
  reason character varying,
  description text,
  status character varying DEFAULT 'pending'::character varying,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id)
);
CREATE TABLE public.reviews (
  id integer NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  reviewer_id integer,
  target_id integer,
  target_type character varying,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  neighborhod_id integer,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id),
  CONSTRAINT reviews_neighborhod_id_fkey FOREIGN KEY (neighborhod_id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.service_requests (
  id integer NOT NULL DEFAULT nextval('service_requests_id_seq'::regclass),
  user_id integer,
  service_id integer,
  status character varying DEFAULT 'pending'::character varying,
  request_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  scheduled_date timestamp without time zone,
  description text,
  CONSTRAINT service_requests_pkey PRIMARY KEY (id),
  CONSTRAINT service_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT service_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.services (
  id integer NOT NULL DEFAULT nextval('services_id_seq'::regclass),
  provider_id integer,
  neighborhood_id integer,
  category character varying,
  title character varying,
  description text,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  price numeric,
  availability boolean DEFAULT true,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  neighborhood_Id integer,
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.users(id),
  CONSTRAINT services_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id),
  CONSTRAINT services_neighborhood_Id_fkey FOREIGN KEY (neighborhood_Id) REFERENCES public.neighborhoods(id)
);
CREATE TABLE public.user_settings (
  id integer NOT NULL DEFAULT nextval('user_settings_id_seq'::regclass),
  user_id integer NOT NULL UNIQUE,
  push_notifications boolean DEFAULT true,
  community_alerts boolean DEFAULT true,
  profile_visibility boolean DEFAULT true,
  show_phone_number boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  address text,
  avatar text,
  verified boolean DEFAULT false,
  reputation integer DEFAULT 0,
  joined_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  bio text,
  is_admin boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  flag_reason character varying,
  moderation_status character varying DEFAULT 'approved'::character varying,
  isServiceProvider boolean,
  password_hash text NOT NULL DEFAULT ''::text,
  reset_password_token text,
  reset_password_expires timestamp with time zone,
  isProvider boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.verification_requests (
  id integer NOT NULL DEFAULT nextval('verification_requests_id_seq'::regclass),
  user_id integer NOT NULL,
  neighborhood_id integer,
  document_url text NOT NULL,
  storage_path text,
  ocr_text text,
  ocr_name character varying,
  ocr_address text,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  review_notes text,
  reviewed_by integer,
  submitted_at timestamp without time zone DEFAULT now(),
  reviewed_at timestamp without time zone,
  CONSTRAINT verification_requests_pkey PRIMARY KEY (id),
  CONSTRAINT verification_requests_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id)
);