import { IconKey } from "@vercel/geistcn-assets/icons/icon-key"
import {
  EmptyState,
  EmptyStateIcon,
} from "@vercel/geistcn/components/empty-state"

import { EnvironmentDashboard } from "@/components/environment-dashboard"
import { SiteHeader } from "@/components/site-header"
import { getPassportIdentity } from "@/lib/auth"
import {
  listProjects,
  VercelApiError,
  type VercelProject,
} from "@/lib/vercel-api"

export const dynamic = "force-dynamic"

export async function DashboardPage({
  initialProjectName,
}: {
  initialProjectName?: string
} = {}) {
  const identity = await getPassportIdentity()

  if (!identity) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--ds-background-200)] p-6">
        <div className="max-w-md rounded-lg border border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-100)] p-8 text-center">
          <h1 className="text-balance text-xl font-semibold text-[var(--ds-gray-1000)]">Access required</h1>
          <p className="mt-2 text-pretty text-sm text-[var(--ds-gray-900)]">
            This internal dashboard requires a verified Vercel Passport identity.
          </p>
        </div>
      </main>
    )
  }

  let projects: VercelProject[] = []
  let configurationError: string | null = null

  try {
    projects = await listProjects()
  } catch (error) {
    configurationError =
      error instanceof VercelApiError
        ? error.message
        : "Unable to connect to the Vercel API."
  }

  const displayName = identity.name || identity.email || "Team member"

  return (
    <div className="min-h-dvh bg-[var(--ds-background-200)] text-[var(--ds-gray-1000)]">
      <SiteHeader displayName={displayName} />
      <main className="geist-container mx-auto max-w-[1200px] px-4 py-10 sm:px-6 md:py-14">
        {configurationError ? (
          <EmptyState
            icon={<EmptyStateIcon icon={<IconKey size={20} />} />}
            title="Connect Vercel access"
            description={configurationError}
          />
        ) : (
          <EnvironmentDashboard
            initialProjectName={initialProjectName}
            projects={projects}
          />
        )}
      </main>
    </div>
  )
}

export default function Page() {
  return <DashboardPage />
}
