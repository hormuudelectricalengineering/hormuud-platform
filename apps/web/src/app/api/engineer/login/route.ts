import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .eq('role', 'engineer')
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Engineer profile not found' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      engineer: {
        id: profile.id,
        full_name: profile.full_name,
        email: authData.user.email,
        phone: profile.phone,
        specialties: profile.specialties,
        must_change_password: profile.must_change_password ?? false,
        role: profile.role,
      },
      session: authData.session,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
