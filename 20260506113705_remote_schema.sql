drop extension if exists "pg_net";

create sequence "public"."alerts_id_seq";

create sequence "public"."appeals_id_seq";

create sequence "public"."comments_id_seq";

create sequence "public"."conflict_cases_id_seq";

create sequence "public"."conversations_id_seq";

create sequence "public"."events_id_seq";

create sequence "public"."marketplace_items_id_seq";

create sequence "public"."messages_id_seq";

create sequence "public"."neighborhood_members_id_seq";

create sequence "public"."neighborhood_proposals_id_seq";

create sequence "public"."neighborhoods_id_seq";

create sequence "public"."notifications_id_seq";

create sequence "public"."posts_id_seq";

create sequence "public"."reports_id_seq";

create sequence "public"."reviews_id_seq";

create sequence "public"."service_requests_id_seq";

create sequence "public"."services_id_seq";

create sequence "public"."users_id_seq";

create sequence "public"."verification_requests_id_seq";


  create table "public"."alerts" (
    "id" integer not null default nextval('public.alerts_id_seq'::regclass),
    "author_id" integer,
    "type" character varying(30),
    "title" character varying(150),
    "description" text,
    "timestamp" timestamp without time zone default CURRENT_TIMESTAMP,
    "severity" character varying(20),
    "resolved" boolean default false,
    "is_flagged" boolean default false,
    "flag_reason" character varying(50),
    "moderation_status" character varying(20) default 'approved'::character varying
      );



  create table "public"."appeals" (
    "id" integer not null default nextval('public.appeals_id_seq'::regclass),
    "user_id" integer not null,
    "report_id" integer not null,
    "reason" text,
    "status" character varying(50) default 'pending'::character varying,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."comments" (
    "id" integer not null default nextval('public.comments_id_seq'::regclass),
    "author_id" integer,
    "post_id" integer,
    "content" text,
    "time" timestamp without time zone default CURRENT_TIMESTAMP,
    "is_flagged" boolean default false,
    "flag_reason" character varying(50),
    "moderation_status" character varying(20) default 'approved'::character varying
      );



  create table "public"."conflict_cases" (
    "id" integer not null default nextval('public.conflict_cases_id_seq'::regclass),
    "report_id" integer not null,
    "user_1" integer,
    "user_2" integer,
    "description" text,
    "status" character varying(50) default 'open'::character varying,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."conversation_participants" (
    "conversation_id" integer not null,
    "user_id" integer not null
      );



  create table "public"."conversations" (
    "id" integer not null default nextval('public.conversations_id_seq'::regclass),
    "last_message" text,
    "last_message_time" timestamp without time zone,
    "unread_count" integer default 0,
    "is_group" boolean default false,
    "group_name" character varying(100)
      );



  create table "public"."event_attendees" (
    "event_id" integer not null,
    "user_id" integer not null,
    "joined_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "public"."events" (
    "id" integer not null default nextval('public.events_id_seq'::regclass),
    "organizer_id" integer,
    "neighborhood_id" integer,
    "title" character varying(150),
    "description" text,
    "date" date,
    "time" time without time zone,
    "location" text,
    "category" character varying(50),
    "max_attendees" integer,
    "image" text,
    "is_flagged" boolean default false,
    "flag_reason" character varying(50),
    "moderation_status" character varying(20) default 'approved'::character varying
      );



  create table "public"."marketplace_items" (
    "id" integer not null default nextval('public.marketplace_items_id_seq'::regclass),
    "seller_id" integer,
    "title" character varying(200),
    "description" text,
    "price" numeric,
    "condition" character varying(20),
    "category" character varying(50),
    "image" text,
    "posted_date" timestamp without time zone default CURRENT_TIMESTAMP,
    "status" character varying(20) default 'available'::character varying,
    "is_flagged" boolean default false,
    "flag_reason" character varying(50),
    "moderation_status" character varying(20) default 'approved'::character varying
      );



  create table "public"."messages" (
    "id" integer not null default nextval('public.messages_id_seq'::regclass),
    "conversation_id" integer,
    "sender_id" integer,
    "content" text,
    "timestamp" timestamp without time zone default CURRENT_TIMESTAMP,
    "read" boolean default false,
    "is_flagged" boolean default false,
    "flag_reason" character varying(50),
    "moderation_status" character varying(20) default 'approved'::character varying,
    "image" text default ''::text,
    "is_edited" boolean default false,
    "deleted_for_everyone" boolean default false,
    "deleted_for" uuid[] default '{}'::uuid[]
      );



  create table "public"."neighborhood_members" (
    "id" integer not null default nextval('public.neighborhood_members_id_seq'::regclass),
    "user_id" character varying(255) not null,
    "neighborhood_id" integer not null,
    "joined_date" timestamp without time zone default CURRENT_TIMESTAMP,
    "status" text default 'pending'::text,
    "verified_at" timestamp with time zone,
    "user_location_city" text,
    "user_location_state" text
      );



  create table "public"."neighborhood_proposals" (
    "id" bigint not null default nextval('public.neighborhood_proposals_id_seq'::regclass),
    "proposer_id" character varying not null,
    "proposer_name" character varying not null,
    "name" character varying not null,
    "city" character varying not null,
    "state" character varying not null,
    "description" text not null,
    "primary_landmark" character varying not null,
    "status" character varying default 'pending'::character varying,
    "submitted_date" timestamp without time zone default CURRENT_TIMESTAMP,
    "reviewed_date" timestamp without time zone,
    "review_notes" text,
    "admin_id" character varying
      );



  create table "public"."neighborhood_settings" (
    "neighborhood_id" integer not null,
    "enable_marketplace" boolean default true,
    "enable_resource_exchange" boolean default true,
    "enable_public_alerts" boolean default true,
    "enable_events" boolean default true,
    "enable_services" boolean default true,
    "require_verification" boolean default false,
    "guidelines" text
      );



  create table "public"."neighborhoods" (
    "id" integer not null default nextval('public.neighborhoods_id_seq'::regclass),
    "name" character varying(100),
    "city" character varying(100),
    "state" character varying(100),
    "description" text,
    "population" integer,
    "primary_landmark" character varying(150),
    "admin_id" character varying,
    "verified" boolean default false,
    "created_date" timestamp without time zone default CURRENT_TIMESTAMP,
    "cover_photo" text,
    "logo" text,
    "guidelines" text,
    "member_count" integer default 0
      );



  create table "public"."notifications" (
    "id" integer not null default nextval('public.notifications_id_seq'::regclass),
    "user_id" integer,
    "type" character varying(50),
    "title" character varying(150),
    "message" text,
    "timestamp" timestamp without time zone default CURRENT_TIMESTAMP,
    "read" boolean default false,
    "action_url" text,
    "item_id" integer,
    "item_type" character varying(30)
      );



  create table "public"."post_likes" (
    "post_id" integer not null,
    "user_id" integer not null,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



create table public.posts (
  id serial not null,
  author_id character varying null,
  content text null,
  image text null,
  likes integer null default 0,
  category character varying(50) null,
  is_flagged boolean null default false,
  flag_reason character varying(50) null,
  moderation_status character varying(20) null default 'approved'::character varying,
  neighborhod_id integer null,
  constraint posts_pkey primary key (id),
  constraint posts_neighborhod_id_fkey foreign KEY (neighborhod_id) references neighborhoods (id)
) TABLESPACE pg_default;


  create table "public"."provider_applications" (
    "id" integer generated by default as identity not null,
    "user_id" integer not null,
    "category" text,
    "experience" text,
    "description" text
      );



  create table "public"."reports" (
    "id" integer not null default nextval('public.reports_id_seq'::regclass),
    "reporter_id" integer,
    "reported_item_id" integer,
    "reported_item_type" character varying(30),
    "reason" character varying(100),
    "description" text,
    "status" character varying(20) default 'pending'::character varying,
    "timestamp" timestamp without time zone default CURRENT_TIMESTAMP
      );



create table public.reviews (
  id serial not null,
  reviewer_id integer null,
  target_id integer null,
  target_type character varying(20) null,
  rating integer null,
  comment text null,
  timestamp timestamp without time zone null default CURRENT_TIMESTAMP,
  is_flagged boolean null default false,
  flag_reason character varying(50) null,
  moderation_status character varying(20) null default 'approved'::character varying,
  created_at timestamp without time zone null default now(),
  neighborhod_id integer null,
  constraint reviews_pkey primary key (id),
  constraint reviews_neighborhod_id_fkey foreign KEY (neighborhod_id) references neighborhoods (id),
  constraint reviews_reviewer_id_fkey foreign KEY (reviewer_id) references users (id),
  constraint reviews_rating_range check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;



CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL UNIQUE,

    push_notifications BOOLEAN DEFAULT TRUE,
    community_alerts BOOLEAN DEFAULT TRUE,
    profile_visibility BOOLEAN DEFAULT TRUE,
    show_phone_number BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

create unique INDEX IF not exists reviews_unique_reviewer_target on public.reviews using btree (reviewer_id, target_type, target_id) TABLESPACE pg_default;

create index IF not exists idx_reviews_target_created on public.reviews using btree (target_type, target_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_reviews_target_rating on public.reviews using btree (target_type, target_id, rating) TABLESPACE pg_default;


  create table "public"."service_requests" (
    "id" integer not null default nextval('public.service_requests_id_seq'::regclass),
    "user_id" integer,
    "service_id" integer,
    "status" character varying(20) default 'pending'::character varying,
    "request_date" timestamp without time zone default CURRENT_TIMESTAMP,
    "scheduled_date" timestamp without time zone,
    "description" text
      );



  create table "public"."services" (
    "id" integer not null default nextval('public.services_id_seq'::regclass),
    "provider_id" integer,
    "neighborhood_id" integer,
    "category" character varying(50),
    "title" character varying(150),
    "description" text,
    "rating" numeric default 0,
    "review_count" integer default 0,
    "price" numeric,
    "availability" boolean default true,
    "is_flagged" boolean default false,
    "flag_reason" character varying(50),
    "moderation_status" character varying(20) default 'approved'::character varying,
    "neighborhood_Id" integer
      );



  create table "public"."users" (
    "id" integer not null default nextval('public.users_id_seq'::regclass),
    "name" character varying(100) not null,
    "email" character varying(150) not null,
    "phone" character varying(30),
    "address" text,
    "avatar" text,
    "verified" boolean default false,
    "reputation" integer default 0,
    "joined_date" timestamp without time zone default CURRENT_TIMESTAMP,
    "bio" text,
    "is_admin" boolean default false,
    "is_flagged" boolean default false,
    "flag_reason" character varying(50),
    "moderation_status" character varying(20) default 'approved'::character varying,
    "isServiceProvider" boolean,
    "password_hash" text not null default ''::text,
    "reset_password_token" text,
    "reset_password_expires" timestamp with time zone,
    "isProvider" boolean default false
      );



  create table "public"."verification_requests" (
    "id" integer not null default nextval('public.verification_requests_id_seq'::regclass),
    "user_id" integer not null,
    "neighborhood_id" integer,
    "document_url" text not null,
    "storage_path" text,
    "ocr_text" text,
    "ocr_name" character varying,
    "ocr_address" text,
    "status" character varying default 'pending'::character varying,
    "review_notes" text,
    "reviewed_by" integer,
    "submitted_at" timestamp without time zone default now(),
    "reviewed_at" timestamp without time zone
      );


alter sequence "public"."alerts_id_seq" owned by "public"."alerts"."id";

alter sequence "public"."appeals_id_seq" owned by "public"."appeals"."id";

alter sequence "public"."comments_id_seq" owned by "public"."comments"."id";

alter sequence "public"."conflict_cases_id_seq" owned by "public"."conflict_cases"."id";

alter sequence "public"."conversations_id_seq" owned by "public"."conversations"."id";

alter sequence "public"."events_id_seq" owned by "public"."events"."id";

alter sequence "public"."marketplace_items_id_seq" owned by "public"."marketplace_items"."id";

alter sequence "public"."messages_id_seq" owned by "public"."messages"."id";

alter sequence "public"."neighborhood_members_id_seq" owned by "public"."neighborhood_members"."id";

alter sequence "public"."neighborhood_proposals_id_seq" owned by "public"."neighborhood_proposals"."id";

alter sequence "public"."neighborhoods_id_seq" owned by "public"."neighborhoods"."id";

alter sequence "public"."notifications_id_seq" owned by "public"."notifications"."id";

alter sequence "public"."posts_id_seq" owned by "public"."posts"."id";

alter sequence "public"."reports_id_seq" owned by "public"."reports"."id";

alter sequence "public"."reviews_id_seq" owned by "public"."reviews"."id";

alter sequence "public"."service_requests_id_seq" owned by "public"."service_requests"."id";

alter sequence "public"."services_id_seq" owned by "public"."services"."id";

alter sequence "public"."users_id_seq" owned by "public"."users"."id";

alter sequence "public"."verification_requests_id_seq" owned by "public"."verification_requests"."id";

CREATE UNIQUE INDEX alerts_pkey ON public.alerts USING btree (id);

CREATE UNIQUE INDEX appeals_pkey ON public.appeals USING btree (id);

CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);

CREATE UNIQUE INDEX conflict_cases_pkey ON public.conflict_cases USING btree (id);

CREATE UNIQUE INDEX conversation_participants_pkey ON public.conversation_participants USING btree (conversation_id, user_id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE UNIQUE INDEX event_attendees_pkey ON public.event_attendees USING btree (event_id, user_id);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE INDEX idx_reviews_target_created ON public.reviews USING btree (target_type, target_id, created_at DESC);

CREATE INDEX idx_reviews_target_rating ON public.reviews USING btree (target_type, target_id, rating);

CREATE INDEX idx_vr_status ON public.verification_requests USING btree (status);

CREATE INDEX idx_vr_user_id ON public.verification_requests USING btree (user_id);

CREATE UNIQUE INDEX marketplace_items_pkey ON public.marketplace_items USING btree (id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX neighborhood_members_neighborhood_id_idx ON public.neighborhood_members USING btree (neighborhood_id);

CREATE UNIQUE INDEX neighborhood_members_pkey ON public.neighborhood_members USING btree (id);

CREATE INDEX neighborhood_members_user_id_idx ON public.neighborhood_members USING btree (user_id);

CREATE UNIQUE INDEX neighborhood_members_user_neighborhood_unique ON public.neighborhood_members USING btree (user_id, neighborhood_id);

CREATE UNIQUE INDEX neighborhood_proposals_pkey ON public.neighborhood_proposals USING btree (id);

CREATE UNIQUE INDEX neighborhood_settings_pkey ON public.neighborhood_settings USING btree (neighborhood_id);

CREATE UNIQUE INDEX neighborhoods_pkey ON public.neighborhoods USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX post_likes_pkey ON public.post_likes USING btree (post_id, user_id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

CREATE UNIQUE INDEX provider_applications_pkey ON public.provider_applications USING btree (id);

CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX reviews_unique_reviewer_target ON public.reviews USING btree (reviewer_id, target_type, target_id);

CREATE UNIQUE INDEX service_requests_pkey ON public.service_requests USING btree (id);

CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX verification_requests_pkey ON public.verification_requests USING btree (id);

alter table "public"."alerts" add constraint "alerts_pkey" PRIMARY KEY using index "alerts_pkey";

alter table "public"."appeals" add constraint "appeals_pkey" PRIMARY KEY using index "appeals_pkey";

alter table "public"."comments" add constraint "comments_pkey" PRIMARY KEY using index "comments_pkey";

alter table "public"."conflict_cases" add constraint "conflict_cases_pkey" PRIMARY KEY using index "conflict_cases_pkey";

alter table "public"."conversation_participants" add constraint "conversation_participants_pkey" PRIMARY KEY using index "conversation_participants_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."event_attendees" add constraint "event_attendees_pkey" PRIMARY KEY using index "event_attendees_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."marketplace_items" add constraint "marketplace_items_pkey" PRIMARY KEY using index "marketplace_items_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."neighborhood_members" add constraint "neighborhood_members_pkey" PRIMARY KEY using index "neighborhood_members_pkey";

alter table "public"."neighborhood_proposals" add constraint "neighborhood_proposals_pkey" PRIMARY KEY using index "neighborhood_proposals_pkey";

alter table "public"."neighborhood_settings" add constraint "neighborhood_settings_pkey" PRIMARY KEY using index "neighborhood_settings_pkey";

alter table "public"."neighborhoods" add constraint "neighborhoods_pkey" PRIMARY KEY using index "neighborhoods_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."post_likes" add constraint "post_likes_pkey" PRIMARY KEY using index "post_likes_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."provider_applications" add constraint "provider_applications_pkey" PRIMARY KEY using index "provider_applications_pkey";

alter table "public"."reports" add constraint "reports_pkey" PRIMARY KEY using index "reports_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."service_requests" add constraint "service_requests_pkey" PRIMARY KEY using index "service_requests_pkey";

alter table "public"."services" add constraint "services_pkey" PRIMARY KEY using index "services_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."verification_requests" add constraint "verification_requests_pkey" PRIMARY KEY using index "verification_requests_pkey";

alter table "public"."alerts" add constraint "alerts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.users(id) not valid;

alter table "public"."alerts" validate constraint "alerts_author_id_fkey";

alter table "public"."comments" add constraint "comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.users(id) not valid;

alter table "public"."comments" validate constraint "comments_author_id_fkey";

alter table "public"."comments" add constraint "comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) not valid;

alter table "public"."comments" validate constraint "comments_post_id_fkey";

alter table "public"."conversation_participants" add constraint "conversation_participants_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_conversation_id_fkey";

alter table "public"."conversation_participants" add constraint "conversation_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."conversation_participants" validate constraint "conversation_participants_user_id_fkey";

alter table "public"."event_attendees" add constraint "event_attendees_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) not valid;

alter table "public"."event_attendees" validate constraint "event_attendees_event_id_fkey";

alter table "public"."event_attendees" add constraint "event_attendees_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."event_attendees" validate constraint "event_attendees_user_id_fkey";

alter table "public"."events" add constraint "events_neighborhood_id_fkey" FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) not valid;

alter table "public"."events" validate constraint "events_neighborhood_id_fkey";

alter table "public"."events" add constraint "events_organizer_id_fkey" FOREIGN KEY (organizer_id) REFERENCES public.users(id) not valid;

alter table "public"."events" validate constraint "events_organizer_id_fkey";

alter table "public"."marketplace_items" add constraint "marketplace_items_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES public.users(id) not valid;

alter table "public"."marketplace_items" validate constraint "marketplace_items_seller_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.users(id) not valid;

alter table "public"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."neighborhood_members" add constraint "neighborhood_members_neighborhood_id_fkey" FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) ON DELETE CASCADE not valid;

alter table "public"."neighborhood_members" validate constraint "neighborhood_members_neighborhood_id_fkey";

alter table "public"."neighborhood_members" add constraint "neighborhood_members_user_neighborhood_unique" UNIQUE using index "neighborhood_members_user_neighborhood_unique";

alter table "public"."neighborhood_settings" add constraint "neighborhood_settings_neighborhood_id_fkey" FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) not valid;

alter table "public"."neighborhood_settings" validate constraint "neighborhood_settings_neighborhood_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) not valid;

alter table "public"."post_likes" validate constraint "post_likes_post_id_fkey";

alter table "public"."post_likes" add constraint "post_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."post_likes" validate constraint "post_likes_user_id_fkey";

alter table "public"."provider_applications" add constraint "provider_applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."provider_applications" validate constraint "provider_applications_user_id_fkey";

alter table "public"."reports" add constraint "reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES public.users(id) not valid;

alter table "public"."reports" validate constraint "reports_reporter_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_range" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_range";

alter table "public"."reviews" add constraint "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES public.users(id) not valid;

alter table "public"."reviews" validate constraint "reviews_reviewer_id_fkey";

alter table "public"."service_requests" add constraint "service_requests_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public.services(id) not valid;

alter table "public"."service_requests" validate constraint "service_requests_service_id_fkey";

alter table "public"."service_requests" add constraint "service_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."service_requests" validate constraint "service_requests_user_id_fkey";

alter table "public"."services" add constraint "services_neighborhood_Id_fkey" FOREIGN KEY ("neighborhood_Id") REFERENCES public.neighborhoods(id) not valid;

alter table "public"."services" validate constraint "services_neighborhood_Id_fkey";

alter table "public"."services" add constraint "services_neighborhood_id_fkey" FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) not valid;

alter table "public"."services" validate constraint "services_neighborhood_id_fkey";

alter table "public"."services" add constraint "services_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES public.users(id) not valid;

alter table "public"."services" validate constraint "services_provider_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."verification_requests" add constraint "verification_requests_neighborhood_id_fkey" FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) not valid;

alter table "public"."verification_requests" validate constraint "verification_requests_neighborhood_id_fkey";

alter table "public"."verification_requests" add constraint "verification_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."verification_requests" validate constraint "verification_requests_status_check";

create or replace view "public"."user_trust" as  SELECT id AS user_id,
    reputation AS "reputationScore",
    verified AS "isVerified",
    '[]'::jsonb AS badges
   FROM public.users;


grant delete on table "public"."alerts" to "anon";

grant insert on table "public"."alerts" to "anon";

grant references on table "public"."alerts" to "anon";

grant select on table "public"."alerts" to "anon";

grant trigger on table "public"."alerts" to "anon";

grant truncate on table "public"."alerts" to "anon";

grant update on table "public"."alerts" to "anon";

grant delete on table "public"."alerts" to "authenticated";

grant insert on table "public"."alerts" to "authenticated";

grant references on table "public"."alerts" to "authenticated";

grant select on table "public"."alerts" to "authenticated";

grant trigger on table "public"."alerts" to "authenticated";

grant truncate on table "public"."alerts" to "authenticated";

grant update on table "public"."alerts" to "authenticated";

grant delete on table "public"."alerts" to "service_role";

grant insert on table "public"."alerts" to "service_role";

grant references on table "public"."alerts" to "service_role";

grant select on table "public"."alerts" to "service_role";

grant trigger on table "public"."alerts" to "service_role";

grant truncate on table "public"."alerts" to "service_role";

grant update on table "public"."alerts" to "service_role";

grant delete on table "public"."appeals" to "anon";

grant insert on table "public"."appeals" to "anon";

grant references on table "public"."appeals" to "anon";

grant select on table "public"."appeals" to "anon";

grant trigger on table "public"."appeals" to "anon";

grant truncate on table "public"."appeals" to "anon";

grant update on table "public"."appeals" to "anon";

grant delete on table "public"."appeals" to "authenticated";

grant insert on table "public"."appeals" to "authenticated";

grant references on table "public"."appeals" to "authenticated";

grant select on table "public"."appeals" to "authenticated";

grant trigger on table "public"."appeals" to "authenticated";

grant truncate on table "public"."appeals" to "authenticated";

grant update on table "public"."appeals" to "authenticated";

grant delete on table "public"."appeals" to "service_role";

grant insert on table "public"."appeals" to "service_role";

grant references on table "public"."appeals" to "service_role";

grant select on table "public"."appeals" to "service_role";

grant trigger on table "public"."appeals" to "service_role";

grant truncate on table "public"."appeals" to "service_role";

grant update on table "public"."appeals" to "service_role";

grant delete on table "public"."comments" to "anon";

grant insert on table "public"."comments" to "anon";

grant references on table "public"."comments" to "anon";

grant select on table "public"."comments" to "anon";

grant trigger on table "public"."comments" to "anon";

grant truncate on table "public"."comments" to "anon";

grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";

grant insert on table "public"."comments" to "authenticated";

grant references on table "public"."comments" to "authenticated";

grant select on table "public"."comments" to "authenticated";

grant trigger on table "public"."comments" to "authenticated";

grant truncate on table "public"."comments" to "authenticated";

grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";

grant insert on table "public"."comments" to "service_role";

grant references on table "public"."comments" to "service_role";

grant select on table "public"."comments" to "service_role";

grant trigger on table "public"."comments" to "service_role";

grant truncate on table "public"."comments" to "service_role";

grant update on table "public"."comments" to "service_role";

grant delete on table "public"."conflict_cases" to "anon";

grant insert on table "public"."conflict_cases" to "anon";

grant references on table "public"."conflict_cases" to "anon";

grant select on table "public"."conflict_cases" to "anon";

grant trigger on table "public"."conflict_cases" to "anon";

grant truncate on table "public"."conflict_cases" to "anon";

grant update on table "public"."conflict_cases" to "anon";

grant delete on table "public"."conflict_cases" to "authenticated";

grant insert on table "public"."conflict_cases" to "authenticated";

grant references on table "public"."conflict_cases" to "authenticated";

grant select on table "public"."conflict_cases" to "authenticated";

grant trigger on table "public"."conflict_cases" to "authenticated";

grant truncate on table "public"."conflict_cases" to "authenticated";

grant update on table "public"."conflict_cases" to "authenticated";

grant delete on table "public"."conflict_cases" to "service_role";

grant insert on table "public"."conflict_cases" to "service_role";

grant references on table "public"."conflict_cases" to "service_role";

grant select on table "public"."conflict_cases" to "service_role";

grant trigger on table "public"."conflict_cases" to "service_role";

grant truncate on table "public"."conflict_cases" to "service_role";

grant update on table "public"."conflict_cases" to "service_role";

grant delete on table "public"."conversation_participants" to "anon";

grant insert on table "public"."conversation_participants" to "anon";

grant references on table "public"."conversation_participants" to "anon";

grant select on table "public"."conversation_participants" to "anon";

grant trigger on table "public"."conversation_participants" to "anon";

grant truncate on table "public"."conversation_participants" to "anon";

grant update on table "public"."conversation_participants" to "anon";

grant delete on table "public"."conversation_participants" to "authenticated";

grant insert on table "public"."conversation_participants" to "authenticated";

grant references on table "public"."conversation_participants" to "authenticated";

grant select on table "public"."conversation_participants" to "authenticated";

grant trigger on table "public"."conversation_participants" to "authenticated";

grant truncate on table "public"."conversation_participants" to "authenticated";

grant update on table "public"."conversation_participants" to "authenticated";

grant delete on table "public"."conversation_participants" to "service_role";

grant insert on table "public"."conversation_participants" to "service_role";

grant references on table "public"."conversation_participants" to "service_role";

grant select on table "public"."conversation_participants" to "service_role";

grant trigger on table "public"."conversation_participants" to "service_role";

grant truncate on table "public"."conversation_participants" to "service_role";

grant update on table "public"."conversation_participants" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."event_attendees" to "anon";

grant insert on table "public"."event_attendees" to "anon";

grant references on table "public"."event_attendees" to "anon";

grant select on table "public"."event_attendees" to "anon";

grant trigger on table "public"."event_attendees" to "anon";

grant truncate on table "public"."event_attendees" to "anon";

grant update on table "public"."event_attendees" to "anon";

grant delete on table "public"."event_attendees" to "authenticated";

grant insert on table "public"."event_attendees" to "authenticated";

grant references on table "public"."event_attendees" to "authenticated";

grant select on table "public"."event_attendees" to "authenticated";

grant trigger on table "public"."event_attendees" to "authenticated";

grant truncate on table "public"."event_attendees" to "authenticated";

grant update on table "public"."event_attendees" to "authenticated";

grant delete on table "public"."event_attendees" to "service_role";

grant insert on table "public"."event_attendees" to "service_role";

grant references on table "public"."event_attendees" to "service_role";

grant select on table "public"."event_attendees" to "service_role";

grant trigger on table "public"."event_attendees" to "service_role";

grant truncate on table "public"."event_attendees" to "service_role";

grant update on table "public"."event_attendees" to "service_role";

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."marketplace_items" to "anon";

grant insert on table "public"."marketplace_items" to "anon";

grant references on table "public"."marketplace_items" to "anon";

grant select on table "public"."marketplace_items" to "anon";

grant trigger on table "public"."marketplace_items" to "anon";

grant truncate on table "public"."marketplace_items" to "anon";

grant update on table "public"."marketplace_items" to "anon";

grant delete on table "public"."marketplace_items" to "authenticated";

grant insert on table "public"."marketplace_items" to "authenticated";

grant references on table "public"."marketplace_items" to "authenticated";

grant select on table "public"."marketplace_items" to "authenticated";

grant trigger on table "public"."marketplace_items" to "authenticated";

grant truncate on table "public"."marketplace_items" to "authenticated";

grant update on table "public"."marketplace_items" to "authenticated";

grant delete on table "public"."marketplace_items" to "service_role";

grant insert on table "public"."marketplace_items" to "service_role";

grant references on table "public"."marketplace_items" to "service_role";

grant select on table "public"."marketplace_items" to "service_role";

grant trigger on table "public"."marketplace_items" to "service_role";

grant truncate on table "public"."marketplace_items" to "service_role";

grant update on table "public"."marketplace_items" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."neighborhood_members" to "anon";

grant insert on table "public"."neighborhood_members" to "anon";

grant references on table "public"."neighborhood_members" to "anon";

grant select on table "public"."neighborhood_members" to "anon";

grant trigger on table "public"."neighborhood_members" to "anon";

grant truncate on table "public"."neighborhood_members" to "anon";

grant update on table "public"."neighborhood_members" to "anon";

grant delete on table "public"."neighborhood_members" to "authenticated";

grant insert on table "public"."neighborhood_members" to "authenticated";

grant references on table "public"."neighborhood_members" to "authenticated";

grant select on table "public"."neighborhood_members" to "authenticated";

grant trigger on table "public"."neighborhood_members" to "authenticated";

grant truncate on table "public"."neighborhood_members" to "authenticated";

grant update on table "public"."neighborhood_members" to "authenticated";

grant delete on table "public"."neighborhood_members" to "service_role";

grant insert on table "public"."neighborhood_members" to "service_role";

grant references on table "public"."neighborhood_members" to "service_role";

grant select on table "public"."neighborhood_members" to "service_role";

grant trigger on table "public"."neighborhood_members" to "service_role";

grant truncate on table "public"."neighborhood_members" to "service_role";

grant update on table "public"."neighborhood_members" to "service_role";

grant delete on table "public"."neighborhood_proposals" to "anon";

grant insert on table "public"."neighborhood_proposals" to "anon";

grant references on table "public"."neighborhood_proposals" to "anon";

grant select on table "public"."neighborhood_proposals" to "anon";

grant trigger on table "public"."neighborhood_proposals" to "anon";

grant truncate on table "public"."neighborhood_proposals" to "anon";

grant update on table "public"."neighborhood_proposals" to "anon";

grant delete on table "public"."neighborhood_proposals" to "authenticated";

grant insert on table "public"."neighborhood_proposals" to "authenticated";

grant references on table "public"."neighborhood_proposals" to "authenticated";

grant select on table "public"."neighborhood_proposals" to "authenticated";

grant trigger on table "public"."neighborhood_proposals" to "authenticated";

grant truncate on table "public"."neighborhood_proposals" to "authenticated";

grant update on table "public"."neighborhood_proposals" to "authenticated";

grant delete on table "public"."neighborhood_proposals" to "service_role";

grant insert on table "public"."neighborhood_proposals" to "service_role";

grant references on table "public"."neighborhood_proposals" to "service_role";

grant select on table "public"."neighborhood_proposals" to "service_role";

grant trigger on table "public"."neighborhood_proposals" to "service_role";

grant truncate on table "public"."neighborhood_proposals" to "service_role";

grant update on table "public"."neighborhood_proposals" to "service_role";

grant delete on table "public"."neighborhood_settings" to "anon";

grant insert on table "public"."neighborhood_settings" to "anon";

grant references on table "public"."neighborhood_settings" to "anon";

grant select on table "public"."neighborhood_settings" to "anon";

grant trigger on table "public"."neighborhood_settings" to "anon";

grant truncate on table "public"."neighborhood_settings" to "anon";

grant update on table "public"."neighborhood_settings" to "anon";

grant delete on table "public"."neighborhood_settings" to "authenticated";

grant insert on table "public"."neighborhood_settings" to "authenticated";

grant references on table "public"."neighborhood_settings" to "authenticated";

grant select on table "public"."neighborhood_settings" to "authenticated";

grant trigger on table "public"."neighborhood_settings" to "authenticated";

grant truncate on table "public"."neighborhood_settings" to "authenticated";

grant update on table "public"."neighborhood_settings" to "authenticated";

grant delete on table "public"."neighborhood_settings" to "service_role";

grant insert on table "public"."neighborhood_settings" to "service_role";

grant references on table "public"."neighborhood_settings" to "service_role";

grant select on table "public"."neighborhood_settings" to "service_role";

grant trigger on table "public"."neighborhood_settings" to "service_role";

grant truncate on table "public"."neighborhood_settings" to "service_role";

grant update on table "public"."neighborhood_settings" to "service_role";

grant delete on table "public"."neighborhoods" to "anon";

grant insert on table "public"."neighborhoods" to "anon";

grant references on table "public"."neighborhoods" to "anon";

grant select on table "public"."neighborhoods" to "anon";

grant trigger on table "public"."neighborhoods" to "anon";

grant truncate on table "public"."neighborhoods" to "anon";

grant update on table "public"."neighborhoods" to "anon";

grant delete on table "public"."neighborhoods" to "authenticated";

grant insert on table "public"."neighborhoods" to "authenticated";

grant references on table "public"."neighborhoods" to "authenticated";

grant select on table "public"."neighborhoods" to "authenticated";

grant trigger on table "public"."neighborhoods" to "authenticated";

grant truncate on table "public"."neighborhoods" to "authenticated";

grant update on table "public"."neighborhoods" to "authenticated";

grant delete on table "public"."neighborhoods" to "service_role";

grant insert on table "public"."neighborhoods" to "service_role";

grant references on table "public"."neighborhoods" to "service_role";

grant select on table "public"."neighborhoods" to "service_role";

grant trigger on table "public"."neighborhoods" to "service_role";

grant truncate on table "public"."neighborhoods" to "service_role";

grant update on table "public"."neighborhoods" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."post_likes" to "anon";

grant insert on table "public"."post_likes" to "anon";

grant references on table "public"."post_likes" to "anon";

grant select on table "public"."post_likes" to "anon";

grant trigger on table "public"."post_likes" to "anon";

grant truncate on table "public"."post_likes" to "anon";

grant update on table "public"."post_likes" to "anon";

grant delete on table "public"."post_likes" to "authenticated";

grant insert on table "public"."post_likes" to "authenticated";

grant references on table "public"."post_likes" to "authenticated";

grant select on table "public"."post_likes" to "authenticated";

grant trigger on table "public"."post_likes" to "authenticated";

grant truncate on table "public"."post_likes" to "authenticated";

grant update on table "public"."post_likes" to "authenticated";

grant delete on table "public"."post_likes" to "service_role";

grant insert on table "public"."post_likes" to "service_role";

grant references on table "public"."post_likes" to "service_role";

grant select on table "public"."post_likes" to "service_role";

grant trigger on table "public"."post_likes" to "service_role";

grant truncate on table "public"."post_likes" to "service_role";

grant update on table "public"."post_likes" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."provider_applications" to "anon";

grant insert on table "public"."provider_applications" to "anon";

grant references on table "public"."provider_applications" to "anon";

grant select on table "public"."provider_applications" to "anon";

grant trigger on table "public"."provider_applications" to "anon";

grant truncate on table "public"."provider_applications" to "anon";

grant update on table "public"."provider_applications" to "anon";

grant delete on table "public"."provider_applications" to "authenticated";

grant insert on table "public"."provider_applications" to "authenticated";

grant references on table "public"."provider_applications" to "authenticated";

grant select on table "public"."provider_applications" to "authenticated";

grant trigger on table "public"."provider_applications" to "authenticated";

grant truncate on table "public"."provider_applications" to "authenticated";

grant update on table "public"."provider_applications" to "authenticated";

grant delete on table "public"."provider_applications" to "service_role";

grant insert on table "public"."provider_applications" to "service_role";

grant references on table "public"."provider_applications" to "service_role";

grant select on table "public"."provider_applications" to "service_role";

grant trigger on table "public"."provider_applications" to "service_role";

grant truncate on table "public"."provider_applications" to "service_role";

grant update on table "public"."provider_applications" to "service_role";

grant delete on table "public"."reports" to "anon";

grant insert on table "public"."reports" to "anon";

grant references on table "public"."reports" to "anon";

grant select on table "public"."reports" to "anon";

grant trigger on table "public"."reports" to "anon";

grant truncate on table "public"."reports" to "anon";

grant update on table "public"."reports" to "anon";

grant delete on table "public"."reports" to "authenticated";

grant insert on table "public"."reports" to "authenticated";

grant references on table "public"."reports" to "authenticated";

grant select on table "public"."reports" to "authenticated";

grant trigger on table "public"."reports" to "authenticated";

grant truncate on table "public"."reports" to "authenticated";

grant update on table "public"."reports" to "authenticated";

grant delete on table "public"."reports" to "service_role";

grant insert on table "public"."reports" to "service_role";

grant references on table "public"."reports" to "service_role";

grant select on table "public"."reports" to "service_role";

grant trigger on table "public"."reports" to "service_role";

grant truncate on table "public"."reports" to "service_role";

grant update on table "public"."reports" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."service_requests" to "anon";

grant insert on table "public"."service_requests" to "anon";

grant references on table "public"."service_requests" to "anon";

grant select on table "public"."service_requests" to "anon";

grant trigger on table "public"."service_requests" to "anon";

grant truncate on table "public"."service_requests" to "anon";

grant update on table "public"."service_requests" to "anon";

grant delete on table "public"."service_requests" to "authenticated";

grant insert on table "public"."service_requests" to "authenticated";

grant references on table "public"."service_requests" to "authenticated";

grant select on table "public"."service_requests" to "authenticated";

grant trigger on table "public"."service_requests" to "authenticated";

grant truncate on table "public"."service_requests" to "authenticated";

grant update on table "public"."service_requests" to "authenticated";

grant delete on table "public"."service_requests" to "service_role";

grant insert on table "public"."service_requests" to "service_role";

grant references on table "public"."service_requests" to "service_role";

grant select on table "public"."service_requests" to "service_role";

grant trigger on table "public"."service_requests" to "service_role";

grant truncate on table "public"."service_requests" to "service_role";

grant update on table "public"."service_requests" to "service_role";

grant delete on table "public"."services" to "anon";

grant insert on table "public"."services" to "anon";

grant references on table "public"."services" to "anon";

grant select on table "public"."services" to "anon";

grant trigger on table "public"."services" to "anon";

grant truncate on table "public"."services" to "anon";

grant update on table "public"."services" to "anon";

grant delete on table "public"."services" to "authenticated";

grant insert on table "public"."services" to "authenticated";

grant references on table "public"."services" to "authenticated";

grant select on table "public"."services" to "authenticated";

grant trigger on table "public"."services" to "authenticated";

grant truncate on table "public"."services" to "authenticated";

grant update on table "public"."services" to "authenticated";

grant delete on table "public"."services" to "service_role";

grant insert on table "public"."services" to "service_role";

grant references on table "public"."services" to "service_role";

grant select on table "public"."services" to "service_role";

grant trigger on table "public"."services" to "service_role";

grant truncate on table "public"."services" to "service_role";

grant update on table "public"."services" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."verification_requests" to "anon";

grant insert on table "public"."verification_requests" to "anon";

grant references on table "public"."verification_requests" to "anon";

grant select on table "public"."verification_requests" to "anon";

grant trigger on table "public"."verification_requests" to "anon";

grant truncate on table "public"."verification_requests" to "anon";

grant update on table "public"."verification_requests" to "anon";

grant delete on table "public"."verification_requests" to "authenticated";

grant insert on table "public"."verification_requests" to "authenticated";

grant references on table "public"."verification_requests" to "authenticated";

grant select on table "public"."verification_requests" to "authenticated";

grant trigger on table "public"."verification_requests" to "authenticated";

grant truncate on table "public"."verification_requests" to "authenticated";

grant update on table "public"."verification_requests" to "authenticated";

grant delete on table "public"."verification_requests" to "service_role";

grant insert on table "public"."verification_requests" to "service_role";

grant references on table "public"."verification_requests" to "service_role";

grant select on table "public"."verification_requests" to "service_role";

grant trigger on table "public"."verification_requests" to "service_role";

grant truncate on table "public"."verification_requests" to "service_role";

grant update on table "public"."verification_requests" to "service_role";


