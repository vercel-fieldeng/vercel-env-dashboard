import { NextResponse } from "next/server"

import { requirePassportIdentity } from "@/lib/auth"
import { listEnvironmentVariables, VercelApiError } from "@/lib/vercel-api"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    await requirePassportIdentity()
    const { projectId } = await params
    const variables = await listEnvironmentVariables(projectId)

    return NextResponse.json(
      { variables },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    const status = error instanceof VercelApiError ? error.status : 401
    const message = error instanceof Error ? error.message : "Unable to load variables."
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "private, no-store" } },
    )
  }
}
