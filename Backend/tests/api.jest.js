/**
 * Comprehensive API Test Suite
 * This file can be run with Jest: `npm test` (if Jest is installed)
 * Or with Node: `node tests/api.jest.js`
 */

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  id: '123' + (Math.floor(Math.random() * 1000)),
  name: 'Jest Tester',
  email: 'jest@test.com',
  neighborhoodId: 3
};

const state = {
  neighborhoodId: 3,
  serviceId: null,
  requestId: null,
  itemId: null,
  eventId: null,
  alertId: null,
  conversationId: null
};

async function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  await fn();
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function apiPost(path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (res.status >= 400) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const expect = (val) => ({
  toBe: (expected) => { if (val !== expected) throw new Error(`Expected ${expected} but got ${val}`); },
  toBeDefined: () => { if (val === undefined || val === null) throw new Error('Expected value to be defined'); },
  toBeInstanceOf: (cls) => { if (!(val instanceof cls)) throw new Error(`Expected instance of ${cls.name}`); },
  toContain: (sub) => { if (!val.includes(sub)) throw new Error(`Expected ${val} to contain ${sub}`); },
  toBeTruthy: () => { if (!val) throw new Error(`Expected ${val} to be truthy`); }
});

async function runAllTests() {
  console.log('🧪 Starting Comprehensive API Validation...\n');

  await describe('Authentication & Users', async () => {
    await test('should sync user with Supabase', async () => {
      const data = await apiPost('/users/upsert', TEST_USER);
      expect(data.name).toBe(TEST_USER.name);
      expect(data.id).toBeDefined();
    });
  });

  await describe('Services', async () => {
    await test('should create a new service', async () => {
      const data = await apiPost('/services', {
        title: 'Jest Plumbing',
        description: 'Tested by Jest',
        category: 'Plumbing',
        price: '50',
        providerId: TEST_USER.id,
        neighborhoodId: state.neighborhoodId
      });
      expect(data.id).toBeDefined();
      state.serviceId = data.id;
    });

    await test('should retrieve service list', async () => {
      const res = await fetch(`${BASE_URL}/services`);
      const data = await res.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length > 0).toBeTruthy();
    });
  });

  await describe('Service Requests', async () => {
    await test('should create a service request', async () => {
      const data = await apiPost('/service-requests', {
        userId: TEST_USER.id,
        serviceId: state.serviceId,
        description: 'Need help ASAP',
        scheduledDate: new Date().toISOString()
      });
      expect(data.id).toBeDefined();
      state.requestId = data.id;
    });
  });

  await describe('Marketplace', async () => {
    await test('should post a marketplace item', async () => {
      const data = await apiPost('/marketplace', {
        title: 'Jest Drill',
        description: 'Power drill',
        price: '20',
        condition: 'New',
        category: 'Tools',
        sellerId: TEST_USER.id
      });
      expect(data.id).toBeDefined();
      state.itemId = data.id;
    });
  });

  await describe('Events', async () => {
    await test('should create an event', async () => {
      const data = await apiPost('/events', {
        title: 'Jest Party',
        description: 'Testing events',
        date: '2026-12-25',
        time: '18:00',
        location: 'Jest Lab',
        category: 'Social',
        organizerId: TEST_USER.id,
        neighborhoodId: state.neighborhoodId
      });
      expect(data.id).toBeDefined();
      state.eventId = data.id;
    });
  });

  await describe('Messages & Conversations', async () => {
    await test('should get or create a conversation', async () => {
      const data = await apiPost('/conversations/get-or-create', { 
        participantId: 1 
      }, { 'x-user-id': TEST_USER.id });
      expect(data.id).toBeDefined();
      state.conversationId = data.id;
    });

    await test('should send a message', async () => {
      const data = await apiPost('/messages', {
        conversationId: state.conversationId,
        content: 'Hello from Jest!'
      }, { 'x-user-id': TEST_USER.id });
      expect(data.id).toBeDefined();
    });
  });

  console.log('\n🏁 Validation Complete!');
}

runAllTests().catch(console.error);
