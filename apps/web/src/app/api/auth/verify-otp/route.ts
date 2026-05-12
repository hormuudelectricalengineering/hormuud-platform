import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phone, email, otp, role } = await request.json()

    if ((!phone && !email) || !otp) {
      return NextResponse.json({ error: 'Phone/email and OTP are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    let verifyError;
    let authData;

    if (phone) {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      })
      verifyError = error;
      authData = data;
    } else {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })
      verifyError = error;
      authData = data;
    }

    if (verifyError || !authData?.user) {
      return NextResponse.json({ error: verifyError?.message || 'Verification failed' }, { status: 400 })
    }

    // Store/update metadata in profiles table after successful signup/login
    if (authData.user) {
      // Use admin client to bypass RLS for inserting new profiles if needed
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          phone: phone || null,
          role: role || 'customer',
        }, { onConflict: 'id' })
        
      if (profileError) {
        console.error('Error upserting profile:', profileError)
      }
      
      // Engineers are stored as profiles with role='engineer' — already upserted above
    }

    // Session is automatically set in cookies by createServerClient
    return NextResponse.json({ session: authData.session })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
