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
    const { engineerId } = await request.json()

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found: ' + jobError?.message },
        { status: 404 }
      )
    }

    if (job.status !== 'pending') {
      return NextResponse.json(
        { error: 'Job status is ' + job.status + ', not pending' },
        { status: 400 }
      )
    }

    const { data: engineer, error: engError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', engineerId)
      .eq('role', 'engineer')
      .single()

    if (engError || !engineer) {
      return NextResponse.json(
        { error: 'Engineer not found or not active' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'assigned',
        engineer_id: engineerId,
        assigned_at: new Date().toISOString(),
        assigned_by_admin_id: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    await supabase.from('engineer_assignments').insert({
      job_id: jobId,
      engineer_id: engineerId,
      assigned_by_admin_id: adminId,
    })

    return NextResponse.json(
      {
        jobId: jobId,
        status: 'assigned',
        engineerId: engineerId,
        engineer_name: engineer.full_name,
        assigned_at: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error assigning job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
