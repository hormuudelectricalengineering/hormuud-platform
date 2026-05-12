import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, full_name, role = 'customer' } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    let user = existingUsers?.users.find(u => u.email === email)

    if (!user) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name, role, provider: 'google' },
        password: crypto.randomUUID(),
      })

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create user: ' + createError.message },
          { status: 400 }
        )
      }

      user = newUser.user

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: email,
          full_name: full_name || email.split('@')[0],
          role,
          auth_method: 'google',
          phone: `+252-google-${Date.now()}`,
        })

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to create profile: ' + profileError.message },
          { status: 400 }
        )
      }
    }

    const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Failed to generate session' },
        { status: 500 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || full_name || '',
        role: profile?.role || 'customer',
        auth_method: 'google',
      },
      token: (signInData.properties as Record<string, string>)?.claim_token || '',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
