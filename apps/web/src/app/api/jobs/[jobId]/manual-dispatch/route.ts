import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{
    jobId: string
  }>
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { jobId } = await context.params

    const body = await request.json()
    const { engineerId } = body

    if (!engineerId) {
      return NextResponse.json(
        { error: "engineerId is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, status, customer_id, engineer_id")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    if (job.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot dispatch job with status: ${job.status}. Only pending jobs can be manually dispatched.` },
        { status: 400 }
      )
    }

    const { data: engineer, error: engineerError } = await supabase
      .from("profiles")
      .select("id, is_active")
      .eq("id", engineerId)
      .eq("role", "engineer")
      .single()

    if (engineerError || !engineer) {
      return NextResponse.json(
        { error: "Engineer not found" },
        { status: 404 }
      )
    }

    if (!engineer.is_active) {
      return NextResponse.json(
        { error: "Engineer is not active" },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        engineer_id: engineerId,
        status: "assigned",
        updated_at: new Date().toISOString()
      })
      .eq("id", jobId)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to assign engineer to job" },
        { status: 500 }
      )
    }

    const { data: jobWithCustomer } = await supabase
      .from("jobs")
      .select("customer:profiles!jobs_customer_id_fkey!inner(id, full_name, phone)")
      .eq("id", jobId)
      .single()

    const { data: engineerDetails } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", engineerId)
      .single()

    const sendResult = await supabase
      .channel("job-dispatch-notifications")
      .send({
        type: "broadcast",
        event: "job-assigned",
        payload: {
          jobId,
          engineerId,
          engineerName: engineerDetails?.full_name || "Engineer",
          timestamp: new Date().toISOString()
        }
      })

    if (sendResult !== "ok") {
      console.error("Broadcast error:", sendResult)
    }

    return NextResponse.json({
      success: true,
      jobId,
      engineerId,
      message: `Job ${jobId} successfully assigned to engineer ${engineerId}`
    })

  } catch (error) {
    console.error("Manual dispatch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
