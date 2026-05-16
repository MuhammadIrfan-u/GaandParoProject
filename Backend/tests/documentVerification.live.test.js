import 'dotenv/config';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY';

const TEST_USER_ID = 9999;
let TEST_NEIGHBORHOOD_ID = 1;

async function run() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in the environment.');
    process.exit(1);
  }

  console.log('Document Verification Live Test — starting');

  // 1) Seed neighborhood (reuse services.test.js pattern)
  console.log('Seeding test neighborhood...');
  const nbRes = await fetch(`${BASE_URL}/neighborhoods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Use numeric adminId (test user) to avoid invalid integer errors
    body: JSON.stringify({ name: 'TDD Verification', city: 'Test City', state: 'TS', description: 'Neighborhood for verification tests', adminId: TEST_USER_ID })
  });
  const nb = await nbRes.json();
  if (nb?.id) {
    TEST_NEIGHBORHOOD_ID = nb.id;
    console.log(`Using neighborhood ID: ${TEST_NEIGHBORHOOD_ID}`);
  } else {
    console.log('Neighborhood seed returned no id — continuing with default id 1');
  }

  // 2) Upsert test user
  console.log('Seeding test user...');
  const seedRes = await fetch(`${BASE_URL}/users/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: TEST_USER_ID, name: 'TDD Verifier', email: `tdd-ver-${Date.now()}@example.com`, isProvider: false })
  });
  const user = await seedRes.json();
  if (!user?.id) {
    console.error('Failed to seed user:', user);
    process.exit(1);
  }
  console.log('User seeded:', user.id);

  // 3) Insert a pending verification_requests row using Supabase REST (service key required)
  console.log('Inserting verification request via Supabase REST...');
  const storagePath = `tests/test-doc-${Date.now()}.jpg`;
  const insertBody = [{
    user_id: TEST_USER_ID,
    neighborhood_id: TEST_NEIGHBORHOOD_ID,
    document_url: 'https://example.com/test-doc.jpg',
    storage_path: storagePath,
    ocr_text: 'TEST OCR TEXT',
    ocr_name: 'TDD Doc User',
    ocr_address: 'Test City',
    status: 'pending',
    submitted_at: new Date().toISOString()
  }];

  const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/verification_requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify(insertBody)
  });

  const supaData = await supaRes.json();
  if (!Array.isArray(supaData) || !supaData[0]?.id) {
    console.error('Failed to insert verification request:', supaData);
    process.exit(1);
  }
  const verificationId = supaData[0].id;
  console.log(`Inserted verification request id=${verificationId}`);

  // 4) Generate admin JWT
  const adminToken = jwt.sign({ id: 1, isAdmin: true }, JWT_SECRET, { expiresIn: '1h' });

  // 5) Call GET /api/verifications/pending
  console.log('Fetching pending verifications as admin...');
  const pendingRes = await fetch(`${BASE_URL}/api/verifications/pending`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const pendingList = await pendingRes.json();
  if (!Array.isArray(pendingList)) {
    console.error('Failed to fetch pending verifications:', pendingList);
    process.exit(1);
  }

  const found = pendingList.find((p) => p.id === verificationId || p.storage_path === storagePath || p.userId === TEST_USER_ID);
  if (found) console.log('✅ Pending verification found in admin list.');
  else {
    console.error('❌ Inserted verification not found in pending list.');
    console.error(pendingList.slice(0,5));
  }

  // 6) Approve the verification via PUT /api/verifications/:id/review
  console.log('Approving verification via admin review endpoint...');
  const reviewRes = await fetch(`${BASE_URL}/api/verifications/${verificationId}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'approved', reviewNotes: 'Approved by automated live test' })
  });

  const reviewData = await reviewRes.json();
  if (reviewRes.status === 200 && reviewData?.verification?.status === 'approved') {
    console.log('✅ Verification approved by admin endpoint.');
  } else {
    console.error('❌ Failed to approve verification:', reviewRes.status, reviewData);
    process.exit(1);
  }

  // 7) Confirm user's verified flag
  console.log('Checking users/:id for verified flag...');
  const userRes = await fetch(`${BASE_URL}/users/${TEST_USER_ID}`);
  const freshUser = await userRes.json();
  if (freshUser?.verified) {
    console.log('✅ User verified flag is true — acceptance criteria met.');
  } else {
    console.error('❌ User verified flag is NOT true. Current user row:', freshUser);
    process.exit(1);
  }

  console.log('\n🎉 Document verification live test completed successfully.');
}

run().catch((err) => {
  console.error('Live test failed:', err);
  process.exit(1);
});
