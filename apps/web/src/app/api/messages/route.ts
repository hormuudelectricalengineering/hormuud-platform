import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { recipient_id, message_text, job_id } = await request.json()
    if (!recipient_id || !message_text) {
      return NextResponse.json({ error: 'Missing recipient_id or message_text' }, { status: 400 })
    }

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id,
        message_text,
        job_id: job_id || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message }, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const otherUserId = searchParams.get('otherUserId')

    if (otherUserId) {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error
      return NextResponse.json({ messages })
    }

    if (userId) {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ messages })
    }

    return NextResponse.json({ error: 'Provide userId or otherUserId' }, { status: 400 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
