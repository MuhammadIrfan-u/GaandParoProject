import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  single: jest.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
  then: jest.fn().mockImplementation((resolve) => resolve({ data: [], error: null })),
};

jest.unstable_mockModule('../src/supabaseClient.js', () => ({
  supabase: mockSupabase,
}));

// We need to import the app AFTER mocking
const { default: app } = await import('../src/app.js');

describe('API Routes Validation (Mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Users Route', () => {
    it('should call upsert on users table', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { id: 1, name: 'Test' }, error: null });
      
      const res = await request(app)
        .post('/users/upsert')
        .send({ id: 'user-1', name: 'Test' });
      
      if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
      expect(res.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });
  });

  describe('Services Route', () => {
    it('should validate missing provider ID', async () => {
      const res = await request(app)
        .post('/services')
        .send({ title: 'No Provider' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Valid provider ID required');
    });

    it('should call insert on services table', async () => {
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 1, title: 'Valid Service', users: { name: 'P', avatar: 'A' } }, 
        error: null 
      });
      
      const res = await request(app)
        .post('/services')
        .send({ 
          title: 'Valid Service', 
          providerId: '1', 
          neighborhoodId: '1',
          price: '50'
        });
      
      expect(res.status).toBe(201);
      expect(mockSupabase.from).toHaveBeenCalledWith('services');
    });
  });

  describe('Service Requests Route', () => {
    it('should validate missing fields', async () => {
      const res = await request(app)
        .post('/service-requests')
        .send({ userId: '1' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing or invalid required fields');
    });
  });

  describe('Messages Route', () => {
    it('should require x-user-id header for conversations', async () => {
      const res = await request(app).get('/conversations');
      expect(res.status).toBe(400);
    });

    it('should fetch conversations for valid user', async () => {
      // First call to participants
      mockSupabase.eq.mockResolvedValueOnce({ data: [{ conversation_id: 1 }], error: null });
      // Second call to conversations
      mockSupabase.in.mockReturnThis();
      mockSupabase.order.mockResolvedValueOnce({ data: [{ id: 1, last_message: 'Hi' }], error: null });

      const res = await request(app)
        .get('/conversations')
        .set('x-user-id', '1');
      
      expect(res.status).toBe(200);
    });
  });
});
