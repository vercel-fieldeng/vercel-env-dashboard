"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { IconEye } from "@vercel/geistcn-assets/icons/icon-eye"
import { IconEyeOff } from "@vercel/geistcn-assets/icons/icon-eye-off"
import { IconKey } from "@vercel/geistcn-assets/icons/icon-key"
import { IconLockClosed } from "@vercel/geistcn-assets/icons/icon-lock-closed"
import { Badge } from "@vercel/geistcn/components/badge"
import { Button } from "@vercel/geistcn/components/button"
import { EmptyState, EmptyStateIcon } from "@vercel/geistcn/components/empty-state"
import { SearchInput } from "@vercel/geistcn/components/search-input"
import { Select } from "@vercel/geistcn/components/select"
import { Spinner } from "@vercel/geistcn/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from "@vercel/geistcn/components/table"
import { Tabs } from "@vercel/geistcn/components/tabs"

import type {
  EnvironmentTarget,
  EnvironmentVariable,
  VercelProject,
} from "@/lib/vercel-api"

type EnvironmentFilter = "all" | EnvironmentTarget

type VariablesResponse = {
  variables: EnvironmentVariable[]
}

class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function fetcher(url: string): Promise<VariablesResponse> {
  const response = await fetch(url, { cache: "no-store" })
  const body = (await response.json()) as VariablesResponse & { error?: string }
  if (!response.ok) {
    throw new FetchError(body.error || "Unable to load environment variables.", response.status)
  }
  return body
}

const environmentTabs: Array<{ title: string; value: EnvironmentFilter }> = [
  { title: "All", value: "all" },
  { title: "Production", value: "production" },
  { title: "Preview", value: "preview" },
  { title: "Development", value: "development" },
]

const targetLabels: Record<EnvironmentTarget, string> = {
  production: "Production",
  preview: "Preview",
  development: "Development",
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return "—"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp))
}

export function EnvironmentDashboard({
  projects,
  initialProjectName,
}: {
  projects: VercelProject[]
  initialProjectName?: string
}) {
  const router = useRouter()
  const projectId =
    projects.find((project) => project.name === initialProjectName)?.id || ""
  const [environment, setEnvironment] = useState<EnvironmentFilter>("all")
  const [query, setQuery] = useState("")
  const [revealed, setRevealed] = useState<{ id: string; value: string } | null>(null)
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [revealError, setRevealError] = useState<string | null>(null)

  const endpoint = projectId
    ? `/api/projects/${encodeURIComponent(projectId)}/env`
    : null
  const { data, error, isLoading, mutate } = useSWR<VariablesResponse, FetchError>(
    endpoint,
    fetcher,
    { keepPreviousData: false, revalidateOnFocus: false },
  )

  const variables = data?.variables || []
  const filteredVariables = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return variables.filter((variable) => {
      const matchesEnvironment =
        environment === "all" || variable.target.includes(environment)
      const matchesQuery =
        !normalizedQuery || variable.key.toLowerCase().includes(normalizedQuery)
      return matchesEnvironment && matchesQuery
    })
  }, [environment, query, variables])

  const selectedProject = projects.find((project) => project.id === projectId)

  function changeProject(nextProjectId: string) {
    const nextProject = projects.find((project) => project.id === nextProjectId)

    setEnvironment("all")
    setQuery("")
    setRevealed(null)
    setRevealError(null)
    router.push(
      nextProject ? `/project/${encodeURIComponent(nextProject.name)}` : "/",
    )
  }

  async function toggleReveal(variable: EnvironmentVariable) {
    if (revealed?.id === variable.id) {
      setRevealed(null)
      return
    }

    setRevealed(null)
    setRevealError(null)
    setRevealingId(variable.id)

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(variable.id)}/reveal`,
        { method: "POST", cache: "no-store" },
      )
      const body = (await response.json()) as { value?: string; error?: string }
      if (!response.ok || typeof body.value !== "string") {
        throw new Error(body.error || "Unable to reveal this value.")
      }
      setRevealed({ id: variable.id, value: body.value })
    } catch (revealFailure) {
      setRevealError(
        revealFailure instanceof Error
          ? revealFailure.message
          : "Unable to reveal this value.",
      )
    } finally {
      setRevealingId(null)
    }
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<EmptyStateIcon icon={<IconKey size={20} />} />}
        title="No projects found"
        description="The configured token does not have access to any projects in this team."
      />
    )
  }

  if (!projectId) {
    return (
      <section aria-labelledby="projects-title" className="flex flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1
            id="projects-title"
            className="text-balance text-2xl font-semibold tracking-tight text-[var(--ds-gray-1000)]"
          >
            Projects
          </h1>
          <p className="text-pretty text-sm text-[var(--ds-gray-900)]">
            Select a project to inspect its assigned environment variables.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-100)]">
          <TableRoot>
            <Table aria-label="Vercel projects" className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3 pl-5">Project</TableHead>
                  <TableHead className="w-1/3">Framework</TableHead>
                  <TableHead className="w-1/3 pr-5">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody bordered interactive removeSpacing>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    aria-label={`View environment variables for ${project.name}`}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ds-blue-700)]"
                    onClick={() => changeProject(project.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        changeProject(project.id)
                      }
                    }}
                    tabIndex={0}
                  >
                    <TableCell className="pl-5 font-medium text-[var(--ds-gray-1000)]">
                      <span className="block truncate">{project.name}</span>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ds-gray-900)]">
                      <span className="block truncate">{project.framework || "Other"}</span>
                    </TableCell>
                    <TableCell className="pr-5 text-sm text-[var(--ds-gray-900)]">
                      {formatDate(project.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableRoot>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="environment-variables-title" className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex min-w-0 flex-col gap-1">
          <h1
            id="environment-variables-title"
            className="text-balance text-2xl font-semibold tracking-tight text-[var(--ds-gray-1000)]"
          >
            Environment Variables
          </h1>
          <p className="text-pretty text-sm text-[var(--ds-gray-900)]">
            Inspect configuration assigned to projects in your Vercel team.
          </p>
        </div>
        <Select
          aria-label="Select project"
          size="small"
          value={projectId}
          width={280}
          onChange={(event) => changeProject(event.currentTarget.value)}
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-100)]">
        <div className="flex flex-col gap-4 border-b border-[var(--ds-gray-alpha-400)] px-4 pt-4 md:px-5 md:pt-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-200)] text-[var(--ds-gray-1000)]"
              >
                <IconKey size={16} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium text-[var(--ds-gray-1000)]">
                  {selectedProject?.name}
                </h2>
                <p className="text-xs text-[var(--ds-gray-900)]">
                  {variables.length} {variables.length === 1 ? "variable" : "variables"}
                </p>
              </div>
            </div>
            <SearchInput
              aria-label="Filter variables by name"
              clearable
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Filter by name…"
              size="small"
              value={query}
              width={240}
            />
          </div>
          <Tabs
            aria-label="Filter by environment"
            border={false}
            selected={environment}
            setSelected={(nextEnvironment) => {
              setEnvironment(nextEnvironment)
              setRevealed(null)
            }}
            tabs={environmentTabs}
          />
        </div>

        {revealError ? (
          <div
            role="alert"
            className="border-b border-[var(--ds-red-300)] bg-[var(--ds-red-100)] px-5 py-3 text-sm text-[var(--ds-red-900)]"
          >
            {revealError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center" aria-label="Loading variables">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-5">
            <EmptyState
              border={false}
              secondary
              icon={<EmptyStateIcon icon={<IconLockClosed size={20} />} />}
              title={error.status === 503 ? "Configuration required" : "Variables unavailable"}
              description={error.message}
            >
              <Button size="small" onClick={() => mutate()} typeName="button">
                Try again
              </Button>
            </EmptyState>
          </div>
        ) : filteredVariables.length === 0 ? (
          <div className="p-5">
            <EmptyState
              border={false}
              secondary
              icon={<EmptyStateIcon icon={<IconKey size={20} />} />}
              title="No matching variables"
              description="Try another environment or clear the name filter."
            />
          </div>
        ) : (
          <TableRoot>
            <Table
              aria-label={`Environment variables for ${selectedProject?.name || "project"}`}
              className="table-fixed"
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4 pl-5">Key</TableHead>
                  <TableHead className="w-1/4">Value</TableHead>
                  <TableHead className="w-1/4">Environment</TableHead>
                  <TableHead className="w-1/4 pr-5">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody bordered interactive removeSpacing>
                {filteredVariables.map((variable) => {
                  const isVisible = revealed?.id === variable.id
                  const isSecret = !variable.revealable
                  return (
                    <TableRow key={variable.id}>
                      <TableCell className="pl-5 font-mono text-xs font-medium text-[var(--ds-gray-1000)]">
                        {variable.key}
                        {variable.gitBranch ? (
                          <span className="ml-2 text-[var(--ds-gray-800)]">({variable.gitBranch})</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-80 font-mono text-xs text-[var(--ds-gray-1000)]">
                        <div className="flex min-w-0 items-center gap-2">
                          {isSecret ? (
                            <span
                              className="inline-flex size-8 shrink-0 items-center justify-center text-[var(--ds-gray-700)]"
                              title="Secret values are encrypted and cannot be displayed"
                            >
                              <IconLockClosed size={16} />
                              <span className="sr-only">Secret value cannot be displayed</span>
                            </span>
                          ) : (
                            <button
                              aria-label={isVisible ? `Hide ${variable.key}` : `Show ${variable.key}`}
                              className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-transparent text-[var(--ds-gray-700)] transition-colors hover:text-[var(--ds-gray-1000)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-blue-700)] disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={revealingId !== null}
                              onClick={() => toggleReveal(variable)}
                              type="button"
                            >
                              {isVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                            </button>
                          )}
                          <span
                            className={
                              isVisible
                                ? "min-w-0 break-all whitespace-normal"
                                : "tracking-widest"
                            }
                          >
                            {isVisible ? revealed.value : "•••"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {variable.target.map((target) => (
                            <Badge key={target} contrast="low" size="sm" variant="gray">
                              {targetLabels[target]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="pr-5 text-xs text-[var(--ds-gray-900)]">
                        {formatDate(variable.updatedAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableRoot>
        )}
      </div>

      <div className="flex items-start gap-2 text-xs leading-5 text-[var(--ds-gray-900)]">
        <IconLockClosed className="mt-0.5 shrink-0" size={14} />
        <p className="text-pretty">
          Secret values are encrypted by Vercel and remain hidden. Revealing a configuration value automatically hides the previously visible value.
        </p>
      </div>
    </section>
  )
}
