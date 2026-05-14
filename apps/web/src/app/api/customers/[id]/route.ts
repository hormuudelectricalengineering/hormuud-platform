import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params

    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, phone, email, address } = body

    const updateData: Record<string, any> = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(id, { email })
      if (emailError) throw emailError
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Update customer error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
