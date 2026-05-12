import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()

    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()

    const { data: job } = await supabase
      .from('jobs')
      .select('id, customer_id')
      .eq('id', jobId)
      .single()

    if (!job || job.customer_id !== user.id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        customer_reassign_reason: reason,
      })
      .eq('id', jobId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      jobId,
      status: 'reassignment_requested',
      reason: reason,
      requested_at: new Date().toISOString(),
      admin_notified: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}