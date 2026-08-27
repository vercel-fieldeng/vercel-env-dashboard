import { NextResponse } from "next/server"

import { requirePassportIdentity } from "@/lib/auth"
import { revealEnvironmentVariable, VercelApiError } from "@/lib/vercel-api"

export const dynamic = "force-dynamic"

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ projectId: string; variableId: string }> },
) {
  try {
    await requirePassportIdentity()
    const { projectId, variableId } = await params
    const result = await revealEnvironmentVariable(projectId, variableId)

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    const status = error instanceof VercelApiError ? error.status : 401
    const message = error instanceof Error ? error.message : "Unable to reveal value."
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "private, no-store" } },
    )
  }
}
