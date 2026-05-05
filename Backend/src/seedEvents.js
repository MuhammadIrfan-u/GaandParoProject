// ── Seed Script for Events Module Testing ─────────────────────────────────────
// Run: node src/seedEvents.js
// Uses service role key to bypass RLS

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  console.log('🌱 Seeding Events module test data...\n');

  // ── 1. Upsert Demo Users ──────────────────────────────────────────────────
  console.log('👤 Creating demo users...');

  const usersToInsert = [
    {
      name: 'Alex Thompson',
      email: 'alex.thompson@email.com',
      phone: '555-0101',
      address: '123 Oak Valley Road',
      avatar: 'AT',
      verified: true,
      reputation: 150,
      bio: 'Community organizer and event enthusiast',
      is_admin: false,
      is_flagged: false,
      moderation_status: 'active',
      password_hash: '$2b$10$dummyhashfortestingpurposes1234567890abc', // not a real hash
    },
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '555-0102',
      address: '456 Maple Street',
      avatar: 'SC',
      verified: true,
      reputation: 200,
      bio: 'Neighborhood watch volunteer',
      is_admin: false,
      is_flagged: false,
      moderation_status: 'active',
      password_hash: '$2b$10$dummyhashfortestingpurposes1234567890abc',
    },
    {
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      phone: '555-0103',
      address: '789 Pine Avenue',
      avatar: 'MJ',
      verified: true,
      reputation: 75,
      bio: 'Local business owner and BBQ master',
      is_admin: false,
      is_flagged: false,
      moderation_status: 'active',
      password_hash: '$2b$10$dummyhashfortestingpurposes1234567890abc',
    },
    {
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      phone: '555-0104',
      address: '321 Birch Lane',
      avatar: 'ER',
      verified: false,
      reputation: 30,
      bio: 'New to the neighborhood!',
      is_admin: false,
      is_flagged: false,
      moderation_status: 'active',
      password_hash: '$2b$10$dummyhashfortestingpurposes1234567890abc',
    },
  ];

  const userIds = [];
  for (const user of usersToInsert) {
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (existing) {
      console.log(`  ✓ User "${user.name}" already exists (id: ${existing.id})`);
      userIds.push(existing.id);
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select('id')
        .single();
      if (error) {
        console.error(`  ✗ Failed to create user "${user.name}":`, error.message);
        continue;
      }
      console.log(`  ✓ Created user "${user.name}" (id: ${data.id})`);
      userIds.push(data.id);
    }
  }

  if (userIds.length < 2) {
    console.error('\n❌ Need at least 2 users. Aborting.');
    process.exit(1);
  }

  const [alexId, sarahId, mikeId, emilyId] = userIds;
  console.log(`\n  User IDs: Alex=${alexId}, Sarah=${sarahId}, Mike=${mikeId || 'N/A'}, Emily=${emilyId || 'N/A'}\n`);

  // ── 2. Create Neighborhood ────────────────────────────────────────────────
  console.log('🏘️  Creating neighborhood...');

  let neighborhoodId;
  const { data: existingNeighborhood } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('name', 'Oak Valley')
    .single();

  if (existingNeighborhood) {
    neighborhoodId = existingNeighborhood.id;
    console.log(`  ✓ Neighborhood "Oak Valley" already exists (id: ${neighborhoodId})`);
  } else {
    const { data, error } = await supabase
      .from('neighborhoods')
      .insert({
        name: 'Oak Valley',
        city: 'Springfield',
        state: 'IL',
        description: 'A friendly suburban neighborhood with great community events',
        population: 2500,
        primary_landmark: 'Oak Valley Park',
        admin_id: String(alexId),
        verified: true,
        member_count: 4,
      })
      .select('id')
      .single();

    if (error) {
      console.error('  ✗ Failed to create neighborhood:', error.message);
      process.exit(1);
    }
    neighborhoodId = data.id;
    console.log(`  ✓ Created neighborhood "Oak Valley" (id: ${neighborhoodId})`);
  }

  // ── 3. Add Neighborhood Members ───────────────────────────────────────────
  console.log('\n👥 Adding neighborhood members...');

  for (const userId of userIds) {
    const { data: existing } = await supabase
      .from('neighborhood_members')
      .select('id')
      .eq('user_id', String(userId))
      .eq('neighborhood_id', neighborhoodId)
      .single();

    if (existing) {
      console.log(`  ✓ User ${userId} already a member`);
    } else {
      const { error } = await supabase
        .from('neighborhood_members')
        .insert({
          user_id: String(userId), // VARCHAR column!
          neighborhood_id: neighborhoodId,
          status: 'approved',
        });
      if (error) {
        console.error(`  ✗ Failed to add member ${userId}:`, error.message);
      } else {
        console.log(`  ✓ Added user ${userId} to neighborhood`);
      }
    }
  }

  // ── 4. Create Sample Events ───────────────────────────────────────────────
  console.log('\n📅 Creating sample events...');

  // Helper to encode description with metadata
  const encodeDesc = (text, isPrivate = false, invitedUserIds = []) =>
    JSON.stringify({ text, isPrivate, invitedUserIds });

  // Get tomorrow and upcoming dates
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const in2Weeks = new Date();
  in2Weeks.setDate(in2Weeks.getDate() + 14);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const eventsToInsert = [
    {
      organizer_id: alexId,
      neighborhood_id: neighborhoodId,
      title: 'Community BBQ & Picnic',
      description: encodeDesc(
        'Join us for a fun community BBQ at Oak Valley Park! Bring your family, friends, and your favorite side dish. Grills and drinks will be provided. Kids activities available.',
        false,
        []
      ),
      date: formatDate(tomorrow),
      time: '14:00',
      location: 'Oak Valley Park - Pavilion Area',
      category: 'Community',
      max_attendees: 50,
      image: null,
    },
    {
      organizer_id: sarahId,
      neighborhood_id: neighborhoodId,
      title: 'Morning Yoga in the Park',
      description: encodeDesc(
        'Start your weekend with a refreshing yoga session. All levels welcome! Bring your own mat. Session led by certified instructor Sarah.',
        false,
        []
      ),
      date: formatDate(nextWeek),
      time: '07:30',
      location: 'Oak Valley Park - East Lawn',
      category: 'Sports',
      max_attendees: 20,
      image: null,
    },
    {
      organizer_id: alexId,
      neighborhood_id: neighborhoodId,
      title: 'Neighborhood Watch Meeting',
      description: encodeDesc(
        'Monthly neighborhood watch meeting to discuss safety updates, recent incidents, and improvement plans. All residents welcome.',
        false,
        []
      ),
      date: formatDate(in2Weeks),
      time: '19:00',
      location: 'Community Center - Room 101',
      category: 'Community',
      max_attendees: null,
      image: null,
    },
    {
      organizer_id: sarahId,
      neighborhood_id: neighborhoodId,
      title: 'Private Book Club Meeting',
      description: encodeDesc(
        'This month we are reading "The Midnight Library" by Matt Haig. Snacks and coffee provided. RSVP required.',
        true,
        [alexId, mikeId || alexId]
      ),
      date: formatDate(nextWeek),
      time: '18:30',
      location: "Sarah's House - 456 Maple Street",
      category: 'Social',
      max_attendees: 8,
      image: null,
    },
    {
      organizer_id: mikeId || alexId,
      neighborhood_id: neighborhoodId,
      title: 'Kids Soccer Tournament',
      description: encodeDesc(
        'Annual kids soccer tournament for ages 6-12. Teams of 5. Sign up your kids for a fun day of friendly competition!',
        false,
        []
      ),
      date: formatDate(nextMonth),
      time: '10:00',
      location: 'Oak Valley Sports Field',
      category: 'Family',
      max_attendees: 40,
      image: null,
    },
  ];

  // Clear existing test events (optional — prevents duplicates on re-run)
  const { data: existingEvents } = await supabase
    .from('events')
    .select('id')
    .eq('neighborhood_id', neighborhoodId);

  if (existingEvents && existingEvents.length > 0) {
    const eventIds = existingEvents.map((e) => e.id);
    // Delete attendees first (FK constraint)
    await supabase.from('event_attendees').delete().in('event_id', eventIds);
    // Delete events
    await supabase.from('events').delete().eq('neighborhood_id', neighborhoodId);
    console.log(`  🗑️  Cleared ${existingEvents.length} existing events`);
  }

  const createdEventIds = [];
  for (const event of eventsToInsert) {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select('id, title')
      .single();

    if (error) {
      console.error(`  ✗ Failed to create "${event.title}":`, error.message);
    } else {
      console.log(`  ✓ Created "${data.title}" (id: ${data.id})`);
      createdEventIds.push(data.id);
    }
  }

  // ── 5. Add Event Attendees ────────────────────────────────────────────────
  console.log('\n🎟️  Adding event attendees...');

  if (createdEventIds.length >= 5) {
    const attendeeRecords = [
      // BBQ - Alex (organizer), Sarah, Mike attend
      { event_id: createdEventIds[0], user_id: alexId },
      { event_id: createdEventIds[0], user_id: sarahId },
      ...(mikeId ? [{ event_id: createdEventIds[0], user_id: mikeId }] : []),

      // Yoga - Sarah (organizer), Alex attends
      { event_id: createdEventIds[1], user_id: sarahId },
      { event_id: createdEventIds[1], user_id: alexId },

      // Watch Meeting - Alex (organizer)
      { event_id: createdEventIds[2], user_id: alexId },

      // Book Club (private) - Sarah (organizer), Alex invited & attending
      { event_id: createdEventIds[3], user_id: sarahId },
      { event_id: createdEventIds[3], user_id: alexId },

      // Soccer - Mike (organizer)
      { event_id: createdEventIds[4], user_id: mikeId || alexId },
    ];

    for (const record of attendeeRecords) {
      const { error } = await supabase.from('event_attendees').insert(record);
      if (error) {
        console.error(`  ✗ Failed to add attendee ${record.user_id} to event ${record.event_id}:`, error.message);
      } else {
        console.log(`  ✓ User ${record.user_id} → Event ${record.event_id}`);
      }
    }
  }

  // ── 6. Print Summary ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('✅ SEED COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`\n  Demo User (use this ID): ${alexId}`);
  console.log(`  Neighborhood ID: ${neighborhoodId}`);
  console.log(`  Events created: ${createdEventIds.length}`);
  console.log(`\n  To use in frontend, the demo user config is:`);
  console.log(`  {`);
  console.log(`    id: ${alexId},`);
  console.log(`    name: "Alex Thompson",`);
  console.log(`    neighborhoodId: ${neighborhoodId}`);
  console.log(`  }`);
  console.log('');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
