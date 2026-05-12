import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { id_token, email, full_name, phone } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full_name are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = await createAdminClient()

    const randomPassword = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name,
          phone: phone || '',
          role: 'customer',
        },
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: custError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        full_name: full_name,
        phone: phone || '',
        email: email,
        auth_method: 'google',
        email_verified: true,
        role: 'customer',
      })

    if (custError) {
      return NextResponse.json({ error: custError.message }, { status: 400 })
    }

    const { data: session, error: sessionError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: email,
        password: randomPassword,
      })

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 400 })
    }

    return NextResponse.json({
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        full_name: full_name,
        role: 'customer',
        auth_method: 'google',
      },
      token: session?.session?.access_token,
    })
  } catch (error) {
    console.error('Error in Google registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}