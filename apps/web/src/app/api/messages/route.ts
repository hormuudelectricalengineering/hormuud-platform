import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobId, content } = await request.json()
    if (!jobId || !content) return NextResponse.json({ error: 'Missing jobId or content' }, { status: 400 })

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        job_id: jobId,
        sender_id: user.id,
        content
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
    const jobId = searchParams.get('jobId')

    if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 })

    // Use regular client so RLS enforces they can only see their own job's messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
