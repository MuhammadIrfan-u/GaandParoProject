import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const transformEvent = (data) => {
  if (!data) return null;
  return {
    id: String(data.id),
    organizerId: String(data.organizer_id),
    neighborhoodId: String(data.neighborhood_id),
    title: data.title,
    description: data.description,
    date: data.date,
    time: data.time,
    location: data.location,
    category: data.category,
    maxAttendees: data.max_attendees,
    image: data.image,
    isFlagged: data.is_flagged || false,
    flagReason: data.flag_reason,
    moderationStatus: data.moderation_status || 'active',
  };
};

// Get events
router.get('/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) throw error;
    res.json((data || []).map(transformEvent));
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/events', async (req, res) => {
  try {
    const event = req.body;
    const numericOrganizerId = parseInt(String(event.organizerId).replace(/\D/g, ''), 10) || 0;
    const numericNeighborhoodId = parseInt(String(event.neighborhoodId).replace(/\D/g, ''), 10) || 0;

    const { data, error } = await supabase
      .from('events')
      .insert([{
        organizer_id: numericOrganizerId,
        neighborhood_id: numericNeighborhoodId || 1,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        max_attendees: event.maxAttendees || null,
        image: event.image,
        moderation_status: 'active',
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(transformEvent(data));
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
