import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request, context: any) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()
    const { jobId } = await context.params;

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: engineer } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .eq('role', 'engineer')
      .single()

    if (!engineer) {
       return NextResponse.json({ error: 'Only engineers can accept jobs' }, { status: 403 })
    }

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update({
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('status', 'pending')
      .select()
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job already taken or no longer available' }, { status: 409 })
    }

    return NextResponse.json({ message: 'Job accepted successfully', job })

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
