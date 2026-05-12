import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(
        `
        id,
        service_category,
        address,
        lat,
        lng,
        description,
        created_at,
        profiles(full_name, email, phone)
      `
      )
      .eq('status', 'pending_assignment')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const now = new Date()
    const formattedJobs = (jobs || []).map((job: any) => {
      const waitTime = Math.floor(
        (now.getTime() - new Date(job.created_at).getTime()) / 60000
      )

      const profiles = job.profiles as { full_name?: string; email?: string; phone?: string } | null

      return {
        id: job.id,
        order_id: `#JOB-${job.id.substring(0, 8).toUpperCase()}`,
        customer_name: profiles?.full_name || '',
        customer_email: profiles?.email || '',
        customer_phone: profiles?.phone || '',
        service_category: job.service_category,
        location: job.address,
        latitude: job.lat,
        longitude: job.lng,
        description: job.description,
        created_at: job.created_at,
        wait_time_minutes: waitTime,
      }
    })

    const avgWaitTime =
      formattedJobs.length > 0
        ? Math.round(
            formattedJobs.reduce((sum, j) => sum + j.wait_time_minutes, 0) /
              formattedJobs.length
          )
        : 0

    return NextResponse.json({
      total_pending: formattedJobs.length,
      avg_wait_time_minutes: avgWaitTime,
      jobs: formattedJobs,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}