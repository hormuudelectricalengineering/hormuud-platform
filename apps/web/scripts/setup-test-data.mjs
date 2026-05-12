import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function createUser(email, password, userData) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userData,
  });
  if (error) throw error;
  console.log(`  ✓ Created user: ${email}`);
  return data;
}

async function main() {
  console.log('=== Setting up test data ===\n');

  // Step 1: Create auth users
  console.log('Creating auth users...');

  const admin = await createUser('admin@hormuud.com', 'admin123456', {
    full_name: 'Admin User',
    role: 'admin',
  });

  const customers = [
    { email: 'ali@test.com', password: 'test123456', name: 'Ali Ahmed', phone: '+252610000001' },
    { email: 'fatima@test.com', password: 'test123456', name: 'Fatima Ibrahim', phone: '+252610000002' },
    { email: 'hassan@test.com', password: 'test123456', name: 'Hassan Ali', phone: '+252610000003' },
    { email: 'amina@test.com', password: 'test123456', name: 'Amina Mohamud', phone: '+252610000004' },
    { email: 'abdirahman@test.com', password: 'test123456', name: 'Abdirahman Yusuf', phone: '+252610000005' },
  ];

  const createdCustomers = [];
  for (const c of customers) {
    const user = await createUser(c.email, c.password, {
      full_name: c.name,
      role: 'customer',
    });
    createdCustomers.push({ id: user.user.id, ...c });
  }

  const engineers = [
    { email: 'ahmed@engineer.com', password: 'eng123456', name: 'Ahmed Mohamed', phone: '+252620000001', license: 'LIC-001' },
    { email: 'ibrahim@engineer.com', password: 'eng123456', name: 'Ibrahim Osman', phone: '+252620000002', license: 'LIC-002' },
    { email: 'mohamed@engineer.com', password: 'eng123456', name: 'Mohamed Abdi', phone: '+252620000003', license: 'LIC-003' },
  ];

  const createdEngineers = [];
  for (const e of engineers) {
    const user = await createUser(e.email, e.password, {
      full_name: e.name,
      role: 'engineer',
    });
    createdEngineers.push({ id: user.user.id, ...e });
  }

  // Step 2: Update profiles with proper data
  console.log('\nUpdating profiles...');

  for (const c of createdCustomers) {
    await supabase.from('profiles').upsert({
      id: c.id,
      full_name: c.name,
      phone: c.phone,
      role: 'customer',
      email: c.email,
      auth_method: 'email',
      email_verified: true,
    });
  }

  for (const e of createdEngineers) {
    await supabase.from('profiles').upsert({
      id: e.id,
      full_name: e.name,
      phone: e.phone,
      role: 'engineer',
      email: e.email,
      auth_method: 'email',
      email_verified: true,
    });
  }

  // Set admin profile
  await supabase.from('profiles').upsert({
    id: admin.user.id,
    full_name: 'Admin User',
    phone: '+252600000000',
    role: 'admin',
    email: 'admin@hormuud.com',
    auth_method: 'email',
    email_verified: true,
  });

  console.log('  ✓ Profiles updated');

  // Step 3: Create engineer records
  console.log('\nCreating engineer records...');

  const engineerIds = [];
  for (const e of createdEngineers) {
    const lat = 2.04 + Math.random() * 0.03;
    const lng = 45.31 + Math.random() * 0.04;
    const { data, error } = await supabase.from('engineers').insert({
      user_id: e.id,
      full_name: e.name,
      phone: e.phone,
      email: e.email,
      license_number: e.license,
      is_verified: true,
      is_online: true,
      license_verified: true,
      average_rating: 4.0 + Math.random(),
      current_lat: lat,
      current_lng: lng,
      must_change_password: true,
      bank_account_name: e.name,
      bank_account_number: '****' + Math.floor(1000 + Math.random() * 9000),
      specialties: ['Electrical', 'AC'],
    }).select().single();
    
    if (error) throw error;
    engineerIds.push(data.id);
    console.log(`  ✓ Created engineer: ${e.name} -> ID: ${data.id}`);
  }

  // Step 4: Create test jobs
  console.log('\nCreating test jobs...');

  const now = new Date();

  // 2 PENDING jobs
  for (let i = 0; i < 2; i++) {
    await supabase.from('jobs').insert({
      customer_id: createdCustomers[i].id,
      service_category: i === 0 ? 'Electrical Repair' : 'AC Installation',
      status: 'pending',
      address: i === 0 ? 'Bakara Market, Mogadishu' : 'Hodan District, Mogadishu',
      lat: 2.04 + i * 0.01,
      lng: 45.31 + i * 0.01,
      estimated_price: i === 0 ? 50.00 : 150.00,
      description: i === 0 ? 'Faulty wiring in shop' : 'Install new AC unit',
      time_preference: 'asap',
      created_at: new Date(now - (i + 1) * 3600000).toISOString(),
      updated_at: new Date(now - (i + 1) * 3600000).toISOString(),
    });
  }

  // 1 PENDING_ASSIGNMENT job
  await supabase.from('jobs').insert({
    customer_id: createdCustomers[2].id,
    service_category: 'Wiring Installation',
    status: 'pending_assignment',
    address: 'Waberi District, Mogadishu',
    lat: 2.0489,
    lng: 45.3322,
    estimated_price: 75.00,
    description: 'Need wiring for new office',
    time_preference: '3hr',
    created_at: new Date(now - 7200000).toISOString(),
    updated_at: new Date(now - 7200000).toISOString(),
  });

  // 1 ASSIGNED job
  await supabase.from('jobs').insert({
    customer_id: createdCustomers[3].id,
    engineer_id: engineerIds[0],
    service_category: 'Panel Upgrade',
    status: 'assigned',
    address: 'Hamar Jajab District, Mogadishu',
    lat: 2.0389,
    lng: 45.3082,
    estimated_price: 120.00,
    admin_set_price: 120.00,
    assigned_at: new Date(now - 3600000).toISOString(),
    description: 'Upgrade electrical panel',
    time_preference: 'asap',
    created_at: new Date(now - 14400000).toISOString(),
    updated_at: new Date(now - 3600000).toISOString(),
  });

  // 1 IN_PROGRESS job
  await supabase.from('jobs').insert({
    customer_id: createdCustomers[4].id,
    engineer_id: engineerIds[1],
    service_category: 'Generator Maintenance',
    status: 'in_progress',
    address: 'Khalifa District, Mogadishu',
    lat: 2.0569,
    lng: 45.3482,
    estimated_price: 80.00,
    admin_set_price: 75.00,
    assigned_at: new Date(now - 7200000).toISOString(),
    description: 'Annual generator servicing',
    time_preference: '1hr',
    created_at: new Date(now - 86400000).toISOString(),
    updated_at: new Date(now - 3600000).toISOString(),
  });

  // 1 COMPLETED job with payment
  await supabase.from('jobs').insert({
    customer_id: createdCustomers[0].id,
    engineer_id: engineerIds[2],
    service_category: 'AC Repair',
    status: 'completed',
    address: 'Yaqshid District, Mogadishu',
    lat: 2.0669,
    lng: 45.3582,
    estimated_price: 50.00,
    final_price: 50.00,
    admin_set_price: 50.00,
    assigned_at: new Date(now - 172800000).toISOString(),
    description: 'AC not cooling properly',
    time_preference: 'asap',
    completed_at: new Date(now - 86400000).toISOString(),
    created_at: new Date(now - 259200000).toISOString(),
    updated_at: new Date(now - 86400000).toISOString(),
  });

  // Payment for completed job
  const { data: completedJob } = await supabase.from('jobs')
    .select('id')
    .eq('service_category', 'AC Repair')
    .eq('status', 'completed')
    .single();

  if (completedJob) {
    await supabase.from('payments').insert({
      job_id: completedJob.id,
      amount: 50.00,
      method: 'ebirr',
      status: 'completed',
      created_at: new Date(now - 86400000).toISOString(),
    });
  }

  console.log('  ✓ Test jobs created');

  // Summary
  console.log('\n=== Setup Complete ===');
  console.log('\n--- Login Credentials ---');
  console.log('\nAdmin (API only - no login page yet):');
  console.log('  Email: admin@hormuud.com / admin123456');
  console.log('\nEngineers (engineer app):');
  for (const e of engineers) {
    console.log(`  ${e.name}: ${e.email} / eng123456`);
  }
  console.log('\nCustomers (customer app):');
  for (const c of customers) {
    console.log(`  ${c.name}: ${c.email} / test123456`);
  }

  // Verify counts
  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: engineerCount } = await supabase.from('engineers').select('*', { count: 'exact', head: true });
  const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
  const { count: paymentCount } = await supabase.from('payments').select('*', { count: 'exact', head: true });

  console.log(`\n--- Data Summary ---`);
  console.log(`  Profiles: ${profileCount}`);
  console.log(`  Engineers: ${engineerCount}`);
  console.log(`  Jobs: ${jobCount}`);
  console.log(`  Payments: ${paymentCount}`);
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
