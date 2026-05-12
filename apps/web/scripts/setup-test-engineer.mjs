import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupEngineer() {
  const engineerId = 'e0000000-0000-0000-0000-000000000001'
  const userId = 'u0000000-0000-0000-0000-000000000001'

  console.log('Setting up test engineer...')

  // 1. Create Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      phone: '+252619000002',
      role: 'engineer',
      full_name: 'Test Engineer'
    })
  
  if (profileError) {
    console.error('Profile Error:', profileError)
    return
  }

  // 2. Create Engineer
  const { error: engineerError } = await supabase
    .from('engineers')
    .upsert({
      id: engineerId,
      user_id: userId,
      is_verified: true,
      is_online: true,
      current_lat: 2.0469,
      current_lng: 45.3182,
      average_rating: 4.8
    })

  if (engineerError) {
    console.error('Engineer Error:', engineerError)
    return
  }

  console.log('Test engineer setup complete.')
  console.log('Engineer ID:', engineerId)
}

setupEngineer()
