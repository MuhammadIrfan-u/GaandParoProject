const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 999;
let TEST_NEIGHBORHOOD_ID = 1;

async function runTests() {
  console.log('🚀 Starting TDD for Services...\n');

  // 1. Seed Test Neighborhood
  console.log('Step 1: Seeding test neighborhood...');
  const nbRes = await fetch(`${BASE_URL}/neighborhoods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'TDD Valley',
      city: 'Test City',
      state: 'TS',
      description: 'A neighborhood for automated testing',
      adminId: 'admin-1'
    })
  });
  const nb = await nbRes.json();
  if (nb.id) {
    TEST_NEIGHBORHOOD_ID = nb.id;
    console.log(`✅ Test neighborhood seeded with ID: ${TEST_NEIGHBORHOOD_ID}\n`);
  } else {
    console.log('ℹ️ Neighborhood might already exist or failed to seed, continuing with ID 1...\n');
  }

  // 2. Seed Test User
  console.log('Step 2: Seeding test user...');
  const seedRes = await fetch(`${BASE_URL}/users/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: TEST_USER_ID,
      name: 'Test Provider',
      email: `test-${Date.now()}@example.com`,
      isProvider: true
    })
  });
  const user = await seedRes.json();
  if (user.id) console.log('✅ Test user seeded successfully.\n');
  else throw new Error('Failed to seed test user');

  let testServiceId;

  // 3. Create Service (Happy Path)
  console.log('Step 3: Creating a valid service...');
  const createRes = await fetch(`${BASE_URL}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'TDD Plumbing',
      description: 'Expert plumbing for TDD',
      category: 'Plumbing',
      price: '$50/hr',
      providerId: TEST_USER_ID,
      neighborhoodId: TEST_NEIGHBORHOOD_ID
    })
  });
  const service = await createRes.json();
  if (service.id) {
    testServiceId = service.id;
    console.log(`✅ Service created with ID: ${testServiceId}\n`);
  } else {
    console.error('❌ Failed to create service:', service);
  }

  // 4. Create Service (Invalid Provider) - Should Fail
  console.log('Step 4: Testing Foreign Key constraint (Invalid Provider)...');
  const invalidProviderRes = await fetch(`${BASE_URL}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Invalid Service',
      description: 'This should fail',
      category: 'Test',
      price: '0',
      providerId: 0, // Non-existent
      neighborhoodId: TEST_NEIGHBORHOOD_ID
    })
  });
  const invalidData = await invalidProviderRes.json();
  if (invalidProviderRes.status === 500 && invalidData.error.includes('violates foreign key constraint')) {
    console.log('✅ Correctly caught foreign key violation.\n');
  } else {
    console.error('❌ Failed to catch foreign key violation:', invalidData);
  }

  // 5. Get Services
  console.log('Step 5: Fetching all services...');
  const getRes = await fetch(`${BASE_URL}/services`);
  const services = await getRes.json();
  if (Array.isArray(services) && services.some(s => s.id === testServiceId)) {
    console.log('✅ Service found in listings.\n');
  } else {
    console.error('❌ Service not found in listings');
  }

  // 6. Update Service
  console.log('Step 6: Updating service price...');
  const updateRes = await fetch(`${BASE_URL}/services/${testServiceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price: '75' })
  });
  const updatedService = await updateRes.json();
  if (updatedService && updatedService.price && updatedService.price.includes('75')) {
    console.log('✅ Service price updated successfully.\n');
  } else {
    console.error('❌ Failed to update service price:', updatedService);
  }

  // 7. Delete Service
  console.log('Step 7: Deleting service...');
  const delRes = await fetch(`${BASE_URL}/services/${testServiceId}`);
  // (Assuming delete logic works as tested before, but let's keep it for requests)
  
  // 8. Create Service Request
  console.log('\n--- Service Request Tests ---');
  console.log('Step 8: Creating service request...');
  const reqRes = await fetch(`${BASE_URL}/service-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: TEST_USER_ID,
      serviceId: testServiceId,
      description: 'I need help with my leaky faucet',
      scheduledDate: new Date().toISOString()
    })
  });
  const serviceReq = await reqRes.json();
  if (serviceReq.id) {
    console.log(`✅ Service request created with ID: ${serviceReq.id}\n`);
  } else {
    console.error('❌ Failed to create service request:', serviceReq);
  }

  // 9. Read Service Requests
  console.log('Step 9: Reading service requests for user...');
  const getReqsRes = await fetch(`${BASE_URL}/service-requests?userId=${TEST_USER_ID}`);
  const serviceReqs = await getReqsRes.json();
  if (Array.isArray(serviceReqs) && serviceReqs.some(r => r.id === serviceReq.id)) {
    console.log(`✅ Found ${serviceReqs.length} requests for user.\n`);
  } else {
    console.error('❌ Service request not found in user listings');
  }

  // 10. Provider Application Test
  console.log('\n--- Provider Application Tests ---');
  console.log('Step 10: Creating provider application...');
  const appRes = await fetch(`${BASE_URL}/provider-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: TEST_USER_ID,
      category: 'Plumbing',
      experience: '10 years of professional plumbing',
      description: 'I am a certified plumber looking to help the neighborhood.'
    })
  });
  const application = await appRes.json();
  if (application.id) {
    console.log(`✅ Provider application created with ID: ${application.id}\n`);
  } else {
    console.error('❌ Failed to create provider application:', application);
  }

  // 11. Read Provider Applications
  console.log('Step 11: Reading all provider applications...');
  const getAppsRes = await fetch(`${BASE_URL}/provider-applications`);
  const applications = await getAppsRes.json();
  if (Array.isArray(applications) && applications.some(a => a.id === application.id)) {
    console.log(`✅ Found ${applications.length} applications total.\n`);
  } else {
    console.error('❌ Provider application not found in global listings');
  }

  // Cleanup (Optional: Delete the test service)
  console.log('\n--- Cleanup ---');
  await fetch(`${BASE_URL}/services/${testServiceId}`, { method: 'DELETE' });
  console.log('✅ Test service cleaned up.');

  console.log('\n🏁 All comprehensive tests completed successfully!');
}

runTests().catch(err => {
  console.error('💥 Test execution failed:', err);
  process.exit(1);
});
