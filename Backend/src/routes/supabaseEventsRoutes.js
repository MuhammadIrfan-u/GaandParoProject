import express from 'express';
import { supabase } from '../supabaseClient.js';
import * as eventFraudService from '../services/eventFraud.service.js';
import { checkVerification } from '../middleware/checkVerification.js';
const router = express.Router();

// Helper to transform snake_case to camelCase
const transformEvent = (data) => {
  if (!data) return null;
  // When aliased as 'users', data.users will contain the organizer's name/avatar
  const organizerData = data.users || {};
  return {
    id: String(data.id),
    organizerId: String(data.organizer_id),
    neighborhoodId: data.neighborhood_id,
    title: data.title,
    description: data.description,
    date: data.date,
    time: data.time,
    location: data.location,
    category: data.category,
    maxAttendees: data.max_attendees,
    image: data.image,
    organizer: organizerData.name || 'Unknown Organizer',
    organizerAvatar: organizerData.avatar || '',
    attendees: data.event_attendees ? data.event_attendees.map(a => String(a.user_id)) : [],
  };
};

// Get all events for a neighborhood
router.get('/events', checkVerification, async (req, res) => {
  try {
    const neighborhoodId = req.query.neighborhoodId;
    let query = supabase
      .from('events')
      .select('*, users:events_organizer_id_fkey(name, avatar), event_attendees(user_id)')
      .eq('moderation_status', 'approved')
      .order('date', { ascending: true });

    if (neighborhoodId) {
      query = query.eq('neighborhood_id', neighborhoodId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const transformedData = (data || []).map(transformEvent);
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific event
router.get('/events/:id', checkVerification, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, users:events_organizer_id_fkey(name, avatar), event_attendees(user_id)')
      .eq('id', req.params.id)
      .eq('moderation_status', 'approved')
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Event not found' });

    res.json(transformEvent(data));
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/events', checkVerification, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      category,
      maxAttendees,
      image,
      organizerId,
      neighborhoodId
    } = req.body;

    if (!title || !date || !time || !location || !organizerId || !neighborhoodId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert event - Ensure IDs are integers
    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        title,
        description,
        date,
        time,
        location,
        category,
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        image,
        organizer_id: parseInt(organizerId),
        neighborhood_id: parseInt(neighborhoodId)
      }])
      .select()
      .single();

    if (error) throw error;

    // Background Fraud Check
    eventFraudService.check({
      id: event.id,
      title: event.title,
      description: event.description
    }).catch(err => console.error('Event fraud check error:', err));

    // Send notifications to all users in the neighborhood
    const { data: members, error: membersError } = await supabase
      .from('neighborhood_members')
      .select('user_id')
      .eq('neighborhood_id', neighborhoodId);

    if (!membersError && members) {
      const notifications = members
        .filter(member => member.user_id) // Ensure user_id exists
        .map(member => ({
          user_id: parseInt(member.user_id), // Cast to integer for notifications table
          type: 'event',
          title: 'New Event!',
          message: `A new event "${title}" has been created in your neighborhood.`,
          action_url: `/events/${event.id}`,
          item_id: event.id,
          item_type: 'event'
        }))
        .filter(n => !isNaN(n.user_id)); // Remove any NaN results

      if (notifications.length > 0) {
        // Batch insert notifications
        await supabase.from('notifications').insert(notifications);
      }
    }

    res.status(201).json(transformEvent(event));
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/events/:id', async (req, res) => {
  try {
    const { userId } = req.body; // Need userId to verify ownership
    const { title, description, date, time, location, category, maxAttendees, image } = req.body;

    // First check ownership
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !event) return res.status(404).json({ error: 'Event not found' });
    if (parseInt(event.organizer_id) !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized: Only the organizer can edit this event' });
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({
        title,
        description,
        date,
        time,
        location,
        category,
        max_attendees: maxAttendees,
        image
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(transformEvent(updatedEvent));
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const { userId } = req.query; // Pass userId as query param for delete

    // First check ownership
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !event) return res.status(404).json({ error: 'Event not found' });
    if (parseInt(event.organizer_id) !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized: Only the organizer can delete this event' });
    }

    // Delete attendees first (foreign key)
    await supabase.from('event_attendees').delete().eq('event_id', req.params.id);

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// RSVP to event
router.post('/events/:id/rsvp', async (req, res) => {
  try {
    const { userId } = req.body;
    const eventId = req.params.id;

    if (!userId) return res.status(400).json({ error: 'User ID required' });

    // Check if already RSVPed
    const { data: existing, error: checkError } = await supabase
      .from('event_attendees')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', parseInt(userId))
      .single();

    if (existing) {
      // If exists, remove it (Toggle RSVP)
      const { error: removeError } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', parseInt(userId));
      if (removeError) throw removeError;
      return res.json({ rsvp: false });
    } else {
      // Check max attendees
      const { data: event } = await supabase
        .from('events')
        .select('max_attendees, event_attendees(count)')
        .eq('id', eventId)
        .single();

      if (event && event.max_attendees && event.event_attendees[0].count >= event.max_attendees) {
        return res.status(400).json({ error: 'Event is full' });
      }

      // Add RSVP
      const { error: addError } = await supabase
        .from('event_attendees')
        .insert([{ event_id: eventId, user_id: parseInt(userId) }]);
      if (addError) throw addError;
      return res.json({ rsvp: true });
    }
  } catch (error) {
    console.error('Error handling RSVP:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
