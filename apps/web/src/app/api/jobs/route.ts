import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      service_id,
      location,
      description,
      time_preference,
      scheduled_time,
    } = await request.json()

    if (!service_id || !location?.lat || !location?.lng) {
      return NextResponse.json({ error: 'Missing required job details' }, { status: 400 })
    }

    const { data: newJob, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        customer_id: user.id,
        service_id,
        lat: location.lat,
        lng: location.lng,
        address: location.address || 'Unknown',
        status: 'pending_assignment',
        time_preference: time_preference || 'asap',
        scheduled_time: scheduled_time || null,
        description: description || null,
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        jobId: newJob.id,
        status: 'pending_assignment',
        message: 'Your order received. Engineer will be assigned shortly.',
        order_id_display: `#JOB-${newJob.id.substring(0, 8).toUpperCase()}`,
      },
      { status: 201 }
    )

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
