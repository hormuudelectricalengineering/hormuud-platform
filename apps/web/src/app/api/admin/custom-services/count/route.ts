import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { count } = await supabase
      .from('custom_service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return NextResponse.json({ pending_count: count || 0 })
  } catch {
    return NextResponse.json({ pending_count: 0 })
  }
}
