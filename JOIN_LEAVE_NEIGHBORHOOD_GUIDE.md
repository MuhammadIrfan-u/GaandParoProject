# Join/Leave Neighborhood Feature - Implementation Guide

## Overview

Users can now join neighborhoods (one at a time). If they want to join another neighborhood, they must leave their current one first.

## Database Schema Changes

Run this SQL in your Supabase dashboard:

```sql
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

-- 2. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS neighborhood_members_user_id_idx on public.neighborhood_members (user_id);
CREATE INDEX IF NOT EXISTS neighborhood_members_neighborhood_id_idx on public.neighborhood_members (neighborhood_id);

-- 3. Add member count to neighborhoods table
ALTER TABLE public.neighborhoods
ADD COLUMN member_count integer null default 0;
```

## Backend API Endpoints

### Join Neighborhood
```
POST /neighborhoods/:id/join
Content-Type: application/json

{
  "userId": "user-id-here"
}

Response:
{
  "message": "Successfully joined neighborhood",
  "membershipId": 123,
  "neighborhoodId": 1
}

Error (if user already in another neighborhood):
{
  "error": "User is already a member of another neighborhood. Please leave that neighborhood first.",
  "currentNeighborhoodId": 1
}
```

### Leave Neighborhood
```
POST /neighborhoods/:id/leave
Content-Type: application/json

{
  "userId": "user-id-here"
}

Response:
{
  "message": "Successfully left neighborhood"
}
```

### Get User's Current Neighborhood
```
GET /users/:userId/neighborhood

Response:
{
  "neighborhood": {
    "id": 1,
    "name": "Oak Valley",
    ...complete neighborhood object
  }
}

If user not in any neighborhood:
{
  "neighborhood": null
}
```

## Frontend Service Methods

### Join a neighborhood
```typescript
await neighborhoodsService.joinNeighborhood(neighborhoodId: number)
```

### Leave current neighborhood
```typescript
await neighborhoodsService.leaveNeighborhood(neighborhoodId: number)
```

### Get user's current neighborhood
```typescript
const neighborhood = await neighborhoodsService.getUserNeighborhood(userId?: string)
```

## UI Changes

### Browse Neighborhoods Screen
- **Not in any neighborhood**: Shows green "Join Neighborhood" button
- **In another neighborhood**: Shows orange "Switch Neighborhood" button
- **In this neighborhood**: Shows blue "View My Neighborhood" button + "Leave Neighborhood" option

### Neighborhood Detail Screen
- Same three-state button system as Browse Neighborhoods
- Users can view full details before joining

### Neighborhood Discovery Screen
- Cards display neighborhood logo (if uploaded)
- Each card has Join/Switch/View button
- Clean list view grouped by city

## User Flow

### First-time joining:
1. User browses neighborhoods
2. Clicks "Join Neighborhood"
3. Successfully joins (stored in `neighborhood_members` table)
4. Can now access neighborhood features
5. User's `neighborhoodId` is tracked

### Switching neighborhoods:
1. User is already in a neighborhood
2. Clicks "Switch Neighborhood" on a different one
3. Sees error: "Please leave current neighborhood first"
4. User clicks "Leave Neighborhood" button
5. Successfully leaves (removed from `neighborhood_members` table)
6. Can now join a different neighborhood

## Data Structure

### User Type Update
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  verified: boolean;
  reputation: number;
  joinedDate: string;
  bio?: string;
  isAdmin?: boolean;
  neighborhoodId?: number;  // NEW: tracks user's current neighborhood
}
```

### Neighborhood Members Table
```
id: serial primary key
user_id: varchar (foreign key to auth.users)
neighborhood_id: integer (foreign key to neighborhoods)
joined_date: timestamp
unique constraint: (user_id, neighborhood_id)
```

### Neighborhoods Table (Updated)
```
...existing columns...
member_count: integer (tracks total members)
```

## Error Handling

### User already in another neighborhood
```typescript
try {
  await neighborhoodsService.joinNeighborhood(2);
} catch (error) {
  // "User is already a member of another neighborhood. Please leave that neighborhood first."
  // currentNeighborhoodId: 1
}
```

## State Management

Each screen tracks:
- `userNeighborhood`: The neighborhood user currently belongs to (null if none)
- `joiningNeighborhoodId`: Which neighborhood is currently being joined/left (for loading state)

## Implementation Complete

All files have been updated:
✅ Backend routes - join/leave endpoints added
✅ Frontend service - joinNeighborhood, leaveNeighborhood, getUserNeighborhood methods
✅ User type - added neighborhoodId field
✅ Browse Neighborhoods - join/leave buttons
✅ Neighborhood Detail - join/leave buttons
✅ Neighborhood Discovery - join/leave buttons with logo display

## Next Steps

1. Run the SQL migration in your Supabase dashboard
2. Restart the backend server
3. Test joining/leaving neighborhoods in the frontend
4. Verify data in Supabase `neighborhood_members` table

## Testing Checklist

- [ ] Can join a neighborhood when not in any
- [ ] Cannot join a second neighborhood without leaving first
- [ ] Can leave a neighborhood
- [ ] After leaving, can join a different neighborhood
- [ ] User's neighborhood ID updates correctly
- [ ] Member count updates in neighborhoods table
- [ ] Error messages display properly
- [ ] Loading states work during join/leave operations
