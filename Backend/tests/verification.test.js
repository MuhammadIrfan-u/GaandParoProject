/**
 * verification.test.js
 *
 * Tests for: Testing Identity & Neighborhood Verification
 * Checklist:
 *   ✅ Verify identity flow
 *   ✅ Test verification approval/rejection
 *   ✅ Validate neighborhood linking
 *   ✅ Check edge cases
 */

// Set env vars BEFORE any imports so supabaseClient doesn't throw
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key';
process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.JWT_SECRET = 'SECRET_KEY';

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ─── JWT helpers ──────────────────────────────────────────────────────────────
const JWT_SECRET = 'SECRET_KEY';

function makeToken(payload = {}) {
  return jwt.sign(
    { userId: 1, id: 1, email: 'test@example.com', isAdmin: false, ...payload },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}
function makeAdminToken(payload = {}) {
  return makeToken({ isAdmin: true, ...payload });
}

// ─── Supabase mock ────────────────────────────────────────────────────────────
const mockStorage = {
  from: jest.fn().mockReturnThis(),
  upload: jest.fn().mockResolvedValue({ error: null }),
  createSignedUrl: jest.fn().mockResolvedValue({
    data: { signedUrl: 'https://storage.example.com/signed-url' },
  }),
};

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  storage: mockStorage,
};

// Mock @supabase/supabase-js createClient to return our mock
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  SupabaseClient: class SupabaseClient {},
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Tesseract to avoid heavy OCR in unit tests
jest.unstable_mockModule('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    recognize: jest.fn().mockResolvedValue({
      data: {
        text: 'Name: John Doe\nAddress: 123 Main St, Islamabad, Pakistan',
        words: [
          { text: 'John', confidence: 92 },
          { text: 'Doe', confidence: 90 },
          { text: 'Islamabad', confidence: 88 },
        ],
        lines: [],
        confidence: 90,
      },
    }),
    terminate: jest.fn().mockResolvedValue(undefined),
  }),
}));

const { default: app } = await import('../src/app.js');

// ─── Reset helpers ────────────────────────────────────────────────────────────
function resetMocks() {
  // mockReset wipes ALL queued mockResolvedValueOnce calls, preventing bleed between tests
  mockSupabaseClient.from.mockReset().mockReturnThis();
  mockSupabaseClient.select.mockReset().mockReturnThis();
  mockSupabaseClient.insert.mockReset().mockReturnThis();
  mockSupabaseClient.update.mockReset().mockReturnThis();
  mockSupabaseClient.delete.mockReset().mockReturnThis();
  mockSupabaseClient.upsert.mockReset().mockReturnThis();
  mockSupabaseClient.eq.mockReset().mockReturnThis();
  mockSupabaseClient.in.mockReset().mockReturnThis();
  mockSupabaseClient.order.mockReset().mockReturnThis();
  mockSupabaseClient.limit.mockReset().mockReturnThis();
  mockSupabaseClient.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
  mockSupabaseClient.single.mockReset().mockResolvedValue({ data: null, error: null });
  mockSupabaseClient.storage = mockStorage;
  mockStorage.from.mockReset().mockReturnThis();
  mockStorage.upload.mockReset().mockResolvedValue({ error: null });
  mockStorage.createSignedUrl.mockReset().mockResolvedValue({
    data: { signedUrl: 'https://storage.example.com/signed-url' },
  });
}

// Minimal 1x1 PNG buffer
const DUMMY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// ─────────────────────────────────────────────────────────────────────────────
//  1. IDENTITY FLOW
// ─────────────────────────────────────────────────────────────────────────────
describe('Identity Verification Flow', () => {
  beforeEach(resetMocks);

  it('rejects upload when not authenticated', async () => {
    const res = await request(app)
      .post('/api/verifications/upload')
      .attach('document', DUMMY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('rejects upload with an invalid token', async () => {
    const res = await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', 'Bearer not.a.valid.token')
      .attach('document', DUMMY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
  });

  it('rejects upload when no file is attached', async () => {
    const res = await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('code', 'NO_FILE');
  });

  it('accepts a valid document and returns structured result', async () => {
    const token = makeToken({ userId: 42, id: 42 });

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { name: 'John Doe' }, error: null })
      .mockResolvedValueOnce({ data: { city: 'Islamabad', state: 'ICT' }, error: null })
      .mockResolvedValueOnce({ data: { id: 101, status: 'approved', user_id: 42 }, error: null });

    mockSupabaseClient.upsert.mockResolvedValueOnce({ error: null });
    mockSupabaseClient.maybeSingle
      .mockResolvedValueOnce({ data: { id: 101 }, error: null })
      .mockResolvedValueOnce({ data: { id: 1 }, error: null });

    const res = await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('neighborhoodId', '1')
      .attach('document', DUMMY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(['approved', 'pending', 'rejected']).toContain(res.body.status);
    expect(res.body.signals).toMatchObject({
      ocrConfidence: expect.any(Number),
      nameMatch: expect.any(Number),
      addrMatch: expect.any(Number),
      finalScore: expect.any(Number),
    });
  });

  it('my-status returns "none" when no submission exists', async () => {
    const token = makeToken();
    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const res = await request(app)
      .get('/api/verifications/my-status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'none');
  });

  it('my-status returns current pending status', async () => {
    const token = makeToken();
    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: {
        status: 'pending',
        submitted_at: '2026-05-01T10:00:00Z',
        reviewed_at: null,
        review_notes: null,
        ocr_name: 'John Doe',
        ocr_address: '123 Main St',
        neighborhood_id: 1,
      },
      error: null,
    });

    const res = await request(app)
      .get('/api/verifications/my-status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(res.body.ocrName).toBe('John Doe');
    expect(res.body).toHaveProperty('submittedAt');
  });

  it('my-status requires authentication', async () => {
    const res = await request(app).get('/api/verifications/my-status');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. VERIFICATION APPROVAL / REJECTION
// ─────────────────────────────────────────────────────────────────────────────
describe('Verification Approval / Rejection', () => {
  beforeEach(resetMocks);

  it('denies review to non-admin users', async () => {
    const token = makeToken({ isAdmin: false });
    const res = await request(app)
      .put('/api/verifications/1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('code', 'FORBIDDEN');
  });

  it('rejects invalid status values', async () => {
    const token = makeAdminToken();
    const res = await request(app)
      .put('/api/verifications/1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'maybe' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/approved.*rejected|status/i);
  });

  it('returns 404 for non-existent verification', async () => {
    const token = makeAdminToken();
    mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    const res = await request(app)
      .put('/api/verifications/9999/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('code', 'NOT_FOUND');
  });

  it('admin can approve a pending verification', async () => {
    const token = makeAdminToken();

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { id: 5, user_id: 10, neighborhood_id: 2, status: 'pending' }, error: null })
      .mockResolvedValueOnce({ data: { id: 5, status: 'approved', reviewed_at: new Date().toISOString() }, error: null });

    mockSupabaseClient.upsert.mockResolvedValueOnce({ error: null });
    mockSupabaseClient.maybeSingle
      .mockResolvedValueOnce({ data: { id: 5 }, error: null })
      .mockResolvedValueOnce({ data: { id: 1 }, error: null });

    const res = await request(app)
      .put('/api/verifications/5/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved', reviewNotes: 'Document clear, identity confirmed.' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.verification).toHaveProperty('status', 'approved');
  });

  it('admin can reject a pending verification', async () => {
    const token = makeAdminToken();

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { id: 6, user_id: 11, neighborhood_id: 2, status: 'pending' }, error: null })
      .mockResolvedValueOnce({ data: { id: 6, status: 'rejected', reviewed_at: new Date().toISOString() }, error: null });

    const res = await request(app)
      .put('/api/verifications/6/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'rejected', reviewNotes: 'Document blurry — cannot read name.' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.verification).toHaveProperty('status', 'rejected');
  });

  it('GET /api/verifications/pending is admin-only', async () => {
    const token = makeToken({ isAdmin: false });
    const res = await request(app)
      .get('/api/verifications/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('admin fetches enriched pending list', async () => {
    const token = makeAdminToken();

    mockSupabaseClient.order.mockResolvedValueOnce({
      data: [{
        id: 1, user_id: 10, neighborhood_id: 2,
        document_url: 'https://example.com/doc.jpg',
        storage_path: '10/123.jpg',
        ocr_text: 'Name: Ali Hassan', ocr_name: 'Ali Hassan',
        ocr_address: '456 Park Rd, Rawalpindi',
        status: 'pending', submitted_at: '2026-05-01T10:00:00Z',
      }],
      error: null,
    });

    mockSupabaseClient.in
      .mockResolvedValueOnce({ data: [{ id: 10, name: 'Ali Hassan', email: 'ali@example.com' }], error: null })
      .mockResolvedValueOnce({ data: [{ id: 2, name: 'Bahria Town' }], error: null });

    mockStorage.createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: 'https://storage.example.com/signed-ali' },
    });

    const res = await request(app)
      .get('/api/verifications/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('userName', 'Ali Hassan');
    expect(res.body[0]).toHaveProperty('neighborhoodName', 'Bahria Town');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. NEIGHBORHOOD LINKING
// ─────────────────────────────────────────────────────────────────────────────
describe('Neighborhood Linking on Approval', () => {
  beforeEach(resetMocks);

  it('upserts user into neighborhood_members when auto-approved', async () => {
    const token = makeToken({ userId: 7, id: 7 });

    // Name "John Doe" matches OCR; city "Main" + state "St" both in OCR address → score ≥0.85 → auto-approved
    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { name: 'John Doe' }, error: null })
      .mockResolvedValueOnce({ data: { city: 'Islamabad', state: 'Pakistan' }, error: null })
      .mockResolvedValueOnce({ data: { id: 200, status: 'approved', user_id: 7 }, error: null });

    const upsertSpy = mockSupabaseClient.upsert.mockResolvedValueOnce({ error: null });

    mockSupabaseClient.maybeSingle
      .mockResolvedValueOnce({ data: { id: 200 }, error: null })
      .mockResolvedValueOnce({ data: { id: 5 }, error: null });

    await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('neighborhoodId', '3')
      .attach('document', DUMMY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(upsertSpy).toHaveBeenCalled();
    const args = upsertSpy.mock.calls[0][0];
    expect(args[0]).toMatchObject({ user_id: '7', neighborhood_id: 3, status: 'verified' });
  });

  it('does NOT upsert neighborhood_members when auto-rejected', async () => {
    const token = makeToken({ userId: 8, id: 8 });

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { name: 'Ghost User' }, error: null })
      .mockResolvedValueOnce({ data: { city: 'Karachi', state: 'Sindh' }, error: null })
      .mockResolvedValueOnce({ data: { id: 201, status: 'rejected', user_id: 8 }, error: null });

    const upsertSpy = mockSupabaseClient.upsert;

    await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('neighborhoodId', '3')
      .attach('document', DUMMY_PNG, { filename: 'id.png', contentType: 'image/png' });

    const neighborhoodCalls = upsertSpy.mock.calls.filter(
      (c) => Array.isArray(c[0]) && c[0][0]?.neighborhood_id !== undefined
    );
    expect(neighborhoodCalls.length).toBe(0);
  });

  it('links neighborhood when admin manually approves', async () => {
    const token = makeAdminToken();

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { id: 20, user_id: 50, neighborhood_id: 4, status: 'pending' }, error: null })
      .mockResolvedValueOnce({ data: { id: 20, status: 'approved' }, error: null });

    const upsertSpy = mockSupabaseClient.upsert.mockResolvedValueOnce({ error: null });

    mockSupabaseClient.maybeSingle
      .mockResolvedValueOnce({ data: { id: 20 }, error: null })
      .mockResolvedValueOnce({ data: { id: 4 }, error: null });

    await request(app)
      .put('/api/verifications/20/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });

    expect(upsertSpy).toHaveBeenCalled();
    const args = upsertSpy.mock.calls[0][0];
    expect(args[0]).toMatchObject({ user_id: '50', neighborhood_id: 4, status: 'verified' });
  });

  it('sets users.verified=true when both doc and location checks pass', async () => {
    const token = makeAdminToken();

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { id: 30, user_id: 60, neighborhood_id: 5, status: 'pending' }, error: null })
      .mockResolvedValueOnce({ data: { id: 30, status: 'approved' }, error: null });

    mockSupabaseClient.upsert.mockResolvedValueOnce({ error: null });

    mockSupabaseClient.maybeSingle
      .mockResolvedValueOnce({ data: { id: 30 }, error: null })
      .mockResolvedValueOnce({ data: { id: 5 }, error: null });

    const updateSpy = mockSupabaseClient.update.mockReturnThis();

    await request(app)
      .put('/api/verifications/30/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });

    expect(updateSpy).toHaveBeenCalledWith({ verified: true });
  });

  it('does not link neighborhood when record has no neighborhoodId', async () => {
    const token = makeAdminToken();

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { id: 40, user_id: 70, neighborhood_id: null, status: 'pending' }, error: null })
      .mockResolvedValueOnce({ data: { id: 40, status: 'approved' }, error: null });

    const upsertSpy = mockSupabaseClient.upsert;

    const res = await request(app)
      .put('/api/verifications/40/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    const neighborhoodCalls = upsertSpy.mock.calls.filter(
      (c) => Array.isArray(c[0]) && c[0][0]?.neighborhood_id !== undefined
    );
    expect(neighborhoodCalls.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────
describe('Edge Cases', () => {
  beforeEach(resetMocks);

  it('rejects non-image file uploads (e.g. PDF)', async () => {
    const token = makeToken();
    const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

    const res = await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('document', pdfBuffer, { filename: 'doc.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
  });

  it('upload succeeds without a neighborhoodId (optional field)', async () => {
    const token = makeToken({ userId: 20, id: 20 });

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { name: 'Solo User' }, error: null })
      .mockResolvedValueOnce({ data: { id: 300, status: 'pending', user_id: 20 }, error: null });

    const res = await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('document', DUMMY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
  });

  it('returns STORAGE_ERROR when Supabase storage upload fails', async () => {
    const token = makeToken({ userId: 21, id: 21 });

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { name: 'Test User' }, error: null })
      .mockResolvedValueOnce({ data: { city: 'Lahore', state: 'Punjab' }, error: null });

    mockStorage.upload.mockResolvedValueOnce({ error: { message: 'Storage quota exceeded' } });

    const res = await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('neighborhoodId', '1')
      .attach('document', DUMMY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('code', 'STORAGE_ERROR');
  });

  it('returns DB_ERROR when verification_request insert fails', async () => {
    const token = makeToken({ userId: 22, id: 22 });

    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: { name: 'Test User' }, error: null })
      .mockResolvedValueOnce({ data: { city: 'Islamabad', state: 'ICT' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'duplicate key' } });

    const res = await request(app)
      .post('/api/verifications/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('neighborhoodId', '1')
      .attach('document', DUMMY_PNG, { filename: 'id.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('code', 'DB_ERROR');
  });

  it('my-status returns 500 on DB error', async () => {
    const token = makeToken();
    // Override the entire chain to resolve with an error at maybeSingle
    mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'connection timeout' },
    });

    const res = await request(app)
      .get('/api/verifications/my-status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('code', 'DB_ERROR');
  });

  it('pending list returns 500 on DB error', async () => {
    const token = makeAdminToken();
    mockSupabaseClient.order.mockResolvedValueOnce({ data: null, error: { message: 'query failed' } });

    const res = await request(app)
      .get('/api/verifications/pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('code', 'DB_ERROR');
  });

  it('review endpoint requires authentication', async () => {
    const res = await request(app)
      .put('/api/verifications/1/review')
      .send({ status: 'approved' });

    expect(res.status).toBe(401);
  });
});
