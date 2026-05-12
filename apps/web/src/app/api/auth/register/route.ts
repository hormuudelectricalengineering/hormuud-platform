import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { phone, email, password, full_name, role } = await request.json()

    const supabaseAdmin = await createAdminClient()

    if (password && email) {
      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || '',
          phone: phone || '',
          role: role || 'customer',
        },
      })

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 })
      }

      const { error: custError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          full_name: full_name || '',
          phone: phone || '',
          email: email,
          auth_method: 'email',
          email_verified: true,
        })

      if (custError) {
        return NextResponse.json({ error: custError.message }, { status: 400 })
      }

      const { data: signInData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      })

      if (linkError) {
        return NextResponse.json({ error: 'Account created but failed to generate session' }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Account created successfully',
        token: (signInData.properties as Record<string, string>)?.claim_token || '',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          full_name: full_name || '',
          phone: phone || '',
        }
      }, { status: 201 })
    }

    if (phone) {
      const { error: signInError } = await supabaseAdmin.auth.signInWithOtp({
        phone,
        options: {
          data: { role: role || 'customer' }
        }
      })

      if (signInError) {
        return NextResponse.json({ error: signInError.message }, { status: 400 })
      }

      return NextResponse.json({ message: 'OTP sent successfully' })
    }

    if (email) {
      const { error: signInError } = await supabaseAdmin.auth.signInWithOtp({
        email,
        options: {
          data: { role: role || 'customer' }
        }
      })

      if (signInError) {
        return NextResponse.json({ error: signInError.message }, { status: 400 })
      }

      return NextResponse.json({ message: 'OTP sent to email' })
    }

    return NextResponse.json({ error: 'Phone, email, or password required' }, { status: 400 })
  } catch (err: any) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}
