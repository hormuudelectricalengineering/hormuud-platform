import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    jobId: string
  }>
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { jobId } = await context.params

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const adminId = '00000000-0000-0000-0000-000000000001'

    const { newEngineerId, reason } = await request.json()

    const { data: job } = await supabase
      .from('jobs')
      .select('engineer_id, status')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const oldEngineerId = job.engineer_id

    await supabase
      .from('jobs')
      .update({
        engineer_id: newEngineerId,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    await supabase.from('engineer_assignments').insert({
      job_id: jobId,
      engineer_id: newEngineerId,
      assigned_by_admin_id: adminId,
      reassigned_from_engineer_id: oldEngineerId,
      reassignment_reason: reason,
    })

    return NextResponse.json({
      jobId: jobId,
      previous_engineer: oldEngineerId,
      new_engineer: newEngineerId,
      reassigned_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error reassigning job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
