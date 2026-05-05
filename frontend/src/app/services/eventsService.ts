// ── Events Service Layer ──────────────────────────────────────────────────────
// Direct Supabase interactions for the Events module.
// No schema changes — private event metadata is encoded inside events.description as JSON.

import { supabase } from './supabaseClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupabaseEvent {
  id: number;
  organizer_id: number;
  neighborhood_id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  max_attendees: number | null;
  image: string | null;
  // Note: events table does NOT have created_at column
}

export interface EventMeta {
  text: string;
  isPrivate: boolean;
  invitedUserIds: number[];
}

export interface EventWithMeta extends SupabaseEvent {
  meta: EventMeta;
  attendeeCount: number;
  isAttending: boolean;
  organizerName: string;
  organizerAvatar: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  maxAttendees?: number;
  image?: string;
  isPrivate: boolean;
  invitedUserIds: number[];
  neighborhoodId: number;
}

export interface MemberInfo {
  id: number;
  name: string;
  avatar: string;
  email: string;
}

// ── Demo User (for testing without auth) ──────────────────────────────────────
// This gets populated by the seed script output. Update IDs if you re-seed.

const DEMO_USER = {
  id: 11,
  name: 'Alex Thompson',
  neighborhoodId: 4,
};

export function getDemoUser() {
  return DEMO_USER;
}

// ── Helper Functions ──────────────────────────────────────────────────────────

export function encodeEventDescription(
  text: string,
  isPrivate: boolean,
  invitedUserIds: number[]
): string {
  return JSON.stringify({
    text,
    isPrivate,
    invitedUserIds,
  });
}

export function decodeEventDescription(description: string): EventMeta {
  try {
    const parsed = JSON.parse(description);
    return {
      text: parsed.text || description,
      isPrivate: !!parsed.isPrivate,
      invitedUserIds: Array.isArray(parsed.invitedUserIds) ? parsed.invitedUserIds : [],
    };
  } catch {
    return {
      text: description || '',
      isPrivate: false,
      invitedUserIds: [],
    };
  }
}

// ── Get Events (filtered by visibility) ───────────────────────────────────────

export async function getEvents(
  neighborhoodId: number,
  currentUserId: number
): Promise<EventWithMeta[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('neighborhood_id', neighborhoodId)
    .order('date', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Filter private events based on visibility rules
  const visibleEvents = data.filter((event: SupabaseEvent) => {
    const meta = decodeEventDescription(event.description);
    if (!meta.isPrivate) return true;
    return (
      event.organizer_id === currentUserId ||
      meta.invitedUserIds.includes(currentUserId)
    );
  });

  // Enrich each event with meta + attendee count + organizer info
  const enriched: EventWithMeta[] = await Promise.all(
    visibleEvents.map(async (event: SupabaseEvent) => {
      const meta = decodeEventDescription(event.description);
      const [attendeeCount, isAttending, organizer] = await Promise.all([
        getAttendeeCount(event.id),
        isUserAttending(event.id, currentUserId),
        getOrganizerInfo(event.organizer_id),
      ]);

      return {
        ...event,
        meta,
        attendeeCount,
        isAttending,
        organizerName: organizer?.name || 'Unknown',
        organizerAvatar: organizer?.avatar || '?',
      };
    })
  );

  return enriched;
}

// ── Get All Events (no neighborhood filter, for users without one) ────────────

export async function getAllEvents(currentUserId: number): Promise<EventWithMeta[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const visibleEvents = data.filter((event: SupabaseEvent) => {
    const meta = decodeEventDescription(event.description);
    if (!meta.isPrivate) return true;
    return (
      event.organizer_id === currentUserId ||
      meta.invitedUserIds.includes(currentUserId)
    );
  });

  const enriched: EventWithMeta[] = await Promise.all(
    visibleEvents.map(async (event: SupabaseEvent) => {
      const meta = decodeEventDescription(event.description);
      const [attendeeCount, isAttending, organizer] = await Promise.all([
        getAttendeeCount(event.id),
        isUserAttending(event.id, currentUserId),
        getOrganizerInfo(event.organizer_id),
      ]);

      return {
        ...event,
        meta,
        attendeeCount,
        isAttending,
        organizerName: organizer?.name || 'Unknown',
        organizerAvatar: organizer?.avatar || '?',
      };
    })
  );

  return enriched;
}

// ── Get Single Event ──────────────────────────────────────────────────────────

export async function getEvent(
  eventId: number,
  currentUserId: number
): Promise<EventWithMeta | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !data) return null;

  const meta = decodeEventDescription(data.description);
  const [attendeeCount, isAttending, organizer] = await Promise.all([
    getAttendeeCount(data.id),
    isUserAttending(data.id, currentUserId),
    getOrganizerInfo(data.organizer_id),
  ]);

  return {
    ...data,
    meta,
    attendeeCount,
    isAttending,
    organizerName: organizer?.name || 'Unknown',
    organizerAvatar: organizer?.avatar || '?',
  };
}

// ── Create Event ──────────────────────────────────────────────────────────────

export async function createEvent(
  payload: CreateEventPayload,
  user: { id: number; name: string }
): Promise<SupabaseEvent> {
  const description = encodeEventDescription(
    payload.description,
    payload.isPrivate,
    payload.invitedUserIds
  );

  const { data, error } = await supabase
    .from('events')
    .insert({
      organizer_id: user.id,
      neighborhood_id: payload.neighborhoodId,
      title: payload.title,
      description,
      date: payload.date,
      time: payload.time,
      location: payload.location,
      category: payload.category,
      max_attendees: payload.maxAttendees || null,
      image: payload.image || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Create event error:', error);
    throw error;
  }

  // Auto-RSVP the organizer
  await supabase.from('event_attendees').insert({
    event_id: data.id,
    user_id: user.id,
  });

  // Send invitations if private event
  if (payload.isPrivate && payload.invitedUserIds.length > 0) {
    await sendInvitations(data, payload.invitedUserIds, user);
  }

  // Award reputation points for creating an event
  await incrementReputation(user.id, 20);

  return data;
}

// ── RSVP to Event ─────────────────────────────────────────────────────────────

export async function rsvpEvent(eventId: number, userId: number): Promise<void> {
  // Check if already attending (prevent duplicates)
  const already = await isUserAttending(eventId, userId);
  if (already) return;

  // Check capacity
  const event = await supabase
    .from('events')
    .select('max_attendees')
    .eq('id', eventId)
    .single();

  if (event.data?.max_attendees) {
    const currentCount = await getAttendeeCount(eventId);
    if (currentCount >= event.data.max_attendees) {
      throw new Error('Event is at full capacity');
    }
  }

  const { error } = await supabase
    .from('event_attendees')
    .insert({
      event_id: eventId,
      user_id: userId,
    });

  if (error) throw error;

  // Award reputation points for RSVP
  await incrementReputation(userId, 5);
}

// ── Cancel RSVP ───────────────────────────────────────────────────────────────

export async function cancelRsvp(eventId: number, userId: number): Promise<void> {
  const { error } = await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ── Get Attendee Count ────────────────────────────────────────────────────────

export async function getAttendeeCount(eventId: number): Promise<number> {
  const { count, error } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (error) return 0;
  return count || 0;
}

// ── Get Attendees List ────────────────────────────────────────────────────────

export async function getAttendees(eventId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from('event_attendees')
    .select('user_id')
    .eq('event_id', eventId);

  if (error || !data) return [];
  return data.map((row: { user_id: number }) => row.user_id);
}

// ── Check if User is Attending ────────────────────────────────────────────────

export async function isUserAttending(eventId: number, userId: number): Promise<boolean> {
  const { count } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  return (count || 0) > 0;
}

// ── Delete Event ──────────────────────────────────────────────────────────────

export async function deleteEvent(eventId: number, userId: number): Promise<void> {
  // Delete attendees first
  await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId);

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('organizer_id', userId);

  if (error) throw error;
}

// ── Send Invitations (via notifications table) ────────────────────────────────

export async function sendInvitations(
  event: SupabaseEvent,
  userIds: number[],
  sender: { id: number; name: string }
): Promise<void> {
  const notifications = userIds.map((uid) => ({
    user_id: uid,
    type: 'event_invite',
    title: 'Event Invitation',
    message: `${sender.name} invited you to "${event.title}"`,
    action_url: `/event/${event.id}`,
    item_id: event.id,
    item_type: 'event',
  }));

  await supabase.from('notifications').insert(notifications);
}

// ── Reputation System ─────────────────────────────────────────────────────────

export async function incrementReputation(userId: number, points: number): Promise<void> {
  try {
    const { data } = await supabase
      .from('users')
      .select('reputation')
      .eq('id', userId)
      .single();

    if (data) {
      await supabase
        .from('users')
        .update({ reputation: (data.reputation || 0) + points })
        .eq('id', userId);
    }
  } catch {
    // Silently fail — reputation is a bonus feature, not critical
    console.warn('Failed to update reputation for user', userId);
  }
}

// ── Get Organizer Info ────────────────────────────────────────────────────────

async function getOrganizerInfo(organizerId: number): Promise<{ name: string; avatar: string } | null> {
  const { data, error } = await supabase
    .from('users')
    .select('name, avatar')
    .eq('id', organizerId)
    .single();

  if (error || !data) return null;
  return data;
}

// ── Neighborhood Member Picker Data ───────────────────────────────────────────

export async function getNeighborhoodMembers(neighborhoodId: number): Promise<MemberInfo[]> {
  // Step 1: Get member user_ids (user_id is VARCHAR in DB!)
  const { data: members, error: membersError } = await supabase
    .from('neighborhood_members')
    .select('user_id')
    .eq('neighborhood_id', neighborhoodId);

  if (membersError || !members || members.length === 0) return [];

  // user_id is VARCHAR in DB, convert to integers for the users query
  const memberIds = members.map((m: { user_id: string }) => parseInt(m.user_id, 10)).filter((id) => !isNaN(id));

  if (memberIds.length === 0) return [];

  // Step 2: Get user details
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, avatar, email')
    .in('id', memberIds);

  if (usersError || !users) return [];

  return users as MemberInfo[];
}
