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

    if (!engineer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: 'engineer',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('engineer_id', user.id)
      .in('status', ['assigned', 'in_progress'])
      .select()
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Unable to complete job. Ensure it is assigned to you.' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Job completed successfully', job })

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
