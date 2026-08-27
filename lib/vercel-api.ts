import "server-only"

const API_BASE_URL = "https://api.vercel.com"

export type VercelProject = {
  id: string
  name: string
  framework: string | null
  updatedAt: number | null
}

export type EnvironmentTarget = "production" | "preview" | "development"

export type EnvironmentVariable = {
  id: string
  key: string
  type: "encrypted" | "plain" | "secret" | "sensitive" | "system"
  visibility?: "config" | "secret"
  target: EnvironmentTarget[]
  gitBranch?: string
  updatedAt: number | null
  revealable: boolean
}

type ApiErrorBody = { error?: { message?: string }; message?: string }

export class VercelApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

function getConfig() {
  const token = process.env.VERCEL_API_TOKEN || process.env.VERCEL_PAT
  const teamId = process.env.VERCEL_TEAM_ID

  if (!token || !teamId) {
    throw new VercelApiError(
      "Add VERCEL_API_TOKEN and VERCEL_TEAM_ID to the project environment.",
      503,
    )
  }

  return { token, teamId }
}

async function vercelFetch<T>(path: string): Promise<T> {
  const { token, teamId } = getConfig()
  const url = new URL(path, API_BASE_URL)
  url.searchParams.set("teamId", teamId)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    let message = `Vercel API request failed (${response.status}).`
    try {
      const body = (await response.json()) as ApiErrorBody
      message = body.error?.message || body.message || message
    } catch {
      // Keep the status-only message when Vercel does not return JSON.
    }
    throw new VercelApiError(message, response.status)
  }

  return response.json() as Promise<T>
}

export async function listProjects(): Promise<VercelProject[]> {
  const projects: VercelProject[] = []
  let from: string | null = null

  do {
    const suffix = new URLSearchParams({ limit: "100" })
    if (from) suffix.set("from", from)

    type ProjectResult = {
      id: string
      name: string
      framework?: string | null
      updatedAt?: number
    }
    const result = await vercelFetch<
      | ProjectResult[]
      | {
          projects?: ProjectResult[]
          pagination?: { next?: string | number | null }
        }
    >(`/v10/projects?${suffix}`)
    const pageProjects = Array.isArray(result) ? result : result.projects || []

    for (const project of pageProjects) {
      projects.push({
        id: project.id,
        name: project.name,
        framework: project.framework || null,
        updatedAt: project.updatedAt || null,
      })
    }

    from = Array.isArray(result)
      ? null
      : result.pagination?.next?.toString() || null
  } while (from)

  return projects.sort((a, b) => a.name.localeCompare(b.name))
}

function normalizeTargets(
  target: EnvironmentTarget | EnvironmentTarget[] | undefined,
): EnvironmentTarget[] {
  if (!target) return []
  return Array.isArray(target) ? target : [target]
}

function isRevealable(variable: {
  type: EnvironmentVariable["type"]
  visibility?: EnvironmentVariable["visibility"]
}) {
  if (variable.visibility === "secret") return false
  return variable.type !== "secret" && variable.type !== "sensitive"
}

export async function listEnvironmentVariables(
  projectId: string,
): Promise<EnvironmentVariable[]> {
  const result = await vercelFetch<{
    envs?: Array<{
      id?: string
      key: string
      type: EnvironmentVariable["type"]
      visibility?: EnvironmentVariable["visibility"]
      target?: EnvironmentTarget | EnvironmentTarget[]
      gitBranch?: string
      updatedAt?: number
    }>
  }>(`/v10/projects/${encodeURIComponent(projectId)}/env`)

  return (result.envs || [])
    .filter((variable) => Boolean(variable.id))
    .map((variable) => ({
      id: variable.id as string,
      key: variable.key,
      type: variable.type,
      visibility: variable.visibility,
      target: normalizeTargets(variable.target),
      gitBranch: variable.gitBranch,
      updatedAt: variable.updatedAt || null,
      revealable: isRevealable(variable),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

export async function revealEnvironmentVariable(
  projectId: string,
  variableId: string,
): Promise<{ value: string }> {
  const variables = await listEnvironmentVariables(projectId)
  const metadata = variables.find((variable) => variable.id === variableId)

  if (!metadata?.revealable) {
    throw new VercelApiError("Secret values cannot be revealed.", 403)
  }

  const variable = await vercelFetch<{ value?: string }>(
    `/v1/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(variableId)}`,
  )

  if (typeof variable.value !== "string") {
    throw new VercelApiError("This environment variable has no readable value.", 422)
  }

  return { value: variable.value }
}
