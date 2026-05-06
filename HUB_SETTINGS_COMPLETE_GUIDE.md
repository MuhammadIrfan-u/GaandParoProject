# Hub Settings Implementation - Complete Guide

## 1. Updated Neighborhoods Table Schema

Run this SQL in your Supabase dashboard to add the new columns:

```sql
ALTER TABLE public.neighborhoods
ADD COLUMN cover_photo text null,
ADD COLUMN logo text null,
ADD COLUMN guidelines text null;
```

### Complete Schema (for reference):
```sql
create table public.neighborhoods (
  id serial not null,
  name character varying(100) null,
  city character varying(100) null,
  state character varying(100) null,
  description text null,
  population integer null,
  primary_landmark character varying(150) null,
  admin_id character varying null,
  verified boolean null default false,
  created_date timestamp without time zone null default CURRENT_TIMESTAMP,
  cover_photo text null,
  logo text null,
  guidelines text null,
  constraint neighborhoods_pkey primary key (id)
) TABLESPACE pg_default;
```

## 2. Neighborhood Settings Table (Already Exists)

```sql
create table public.neighborhood_settings (
  neighborhood_id integer not null,
  enable_marketplace boolean null default true,
  enable_resource_exchange boolean null default true,
  enable_public_alerts boolean null default true,
  enable_events boolean null default true,
  enable_services boolean null default true,
  require_verification boolean null default false,
  guidelines text null,
  constraint neighborhood_settings_pkey primary key (neighborhood_id),
  constraint neighborhood_settings_neighborhood_id_fkey foreign key (neighborhood_id) references neighborhoods (id)
) TABLESPACE pg_default;
```

## 3. How It Works

### Image Upload Flow:
1. User uploads cover photo or logo in Hub Settings
2. Image is compressed (max 1200px, 70% quality JPEG)
3. Backend stores base64 image in `neighborhoods.cover_photo` or `neighborhoods.logo`
4. Entire neighborhood object is updated in the database
5. Frontend displays the updated image immediately

### Settings Save Flow:
1. User toggles feature switches (marketplace, resource exchange, alerts, events, services, verification)
2. User adds/edits community guidelines
3. All 6 feature settings are saved to `neighborhood_settings` table
4. Guidelines are saved to both:
   - `neighborhood_settings.guidelines` (feature-specific)
   - `neighborhoods.guidelines` (main record)

## 4. API Endpoints

### Upload Images
```
PUT /neighborhoods/:id/branding
Content-Type: application/json

{
  "coverPhoto": "data:image/jpeg;base64,...",
  "logo": "data:image/jpeg;base64,..."
}

Response: Complete neighborhood object with updated images
```

### Update Settings & Features
```
PUT /neighborhoods/:id/hub-settings
Content-Type: application/json

{
  "enable_marketplace": true,
  "enable_resource_exchange": true,
  "enable_public_alerts": true,
  "enable_events": true,
  "enable_services": true,
  "require_verification": false
}

Response: Updated neighborhood_settings record
```

### Update Guidelines
```
PUT /neighborhoods/:id/guidelines
Content-Type: application/json

{
  "guidelines": "Community guidelines text here..."
}

Response: Updated neighborhood_settings record
```

## 5. Frontend Features

### Hub Settings Screen Includes:
✅ **Branding Section**
- Cover Photo upload (compressed to 1200px)
- Logo upload (compressed to 1200px)
- Images displayed as base64 in database
- Change/update functionality

✅ **Features Section**
- Marketplace toggle
- Resource Exchange toggle
- Public Alerts toggle
- Events toggle
- Services Directory toggle
- Require Verification toggle

✅ **Community Guidelines Section**
- Textarea for guidelines
- Markdown support
- Character limit: unlimited

## 6. Data Storage

### In neighborhoods table:
- `cover_photo` - Base64 encoded image
- `logo` - Base64 encoded image
- `guidelines` - Text with guidelines

### In neighborhood_settings table:
- All 6 feature toggles
- `guidelines` - Duplicate for feature-specific reference

## 7. Automatic Display

When images are uploaded:
1. They're immediately visible in the neighborhood card
2. They're stored in neighborhoods table
3. They persist across all screens that display the neighborhood
4. They're automatically loaded when user navigates to different screens

## 8. Backend Payload Support

- Maximum payload size: 50MB
- Images are stored as base64 strings
- Automatic compression on frontend before sending
- No external storage needed (all in database)

## 9. Image Compression Details

Before uploading, images are:
- Resized to max 1200px width
- Converted to JPEG with 70% quality
- Encoded as base64
- Reduces file size by ~70-80%

## 10. Usage Flow

1. ✅ User navigates to Hub Settings
2. ✅ Uploads cover photo → immediately appears in preview
3. ✅ Uploads logo → immediately appears in preview
4. ✅ Toggles feature switches
5. ✅ Adds community guidelines
6. ✅ Clicks Save
7. ✅ All data persists to Supabase
8. ✅ Images appear in neighborhood cards across the app

---

## Migration Steps:

1. Run the ALTER TABLE SQL above in Supabase
2. Restart backend server
3. Images uploaded through Hub Settings will automatically save to neighborhoods table
4. All settings save to neighborhood_settings table
5. Everything displays in real-time on the frontend
