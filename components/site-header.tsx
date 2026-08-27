"use client"

import { IconUser } from "@vercel/geistcn-assets/icons/icon-user"
import { LogoIconVercelSvg } from "@vercel/geistcn-assets/logos"
import { Badge } from "@vercel/geistcn/components/badge"

export function SiteHeader({ displayName }: { displayName: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--ds-gray-alpha-400)] bg-[var(--ds-background-100)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <a
          className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ds-blue-700)]"
          href="/"
          aria-label="Environment Inspector — view all projects"
        >
          <LogoIconVercelSvg className="shrink-0 text-[var(--ds-gray-1000)]" size={20} />
          <span className="hidden h-5 w-px bg-[var(--ds-gray-alpha-400)] sm:block" aria-hidden="true" />
          <span className="truncate text-sm font-medium tracking-tight text-[var(--ds-gray-1000)]">
            Environment Inspector
          </span>
        </a>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-48 truncate text-xs text-[var(--ds-gray-900)] md:block">
            {displayName}
          </span>
          <Badge
            aria-label={`Signed in as ${displayName}`}
            className="size-7 px-0"
            contrast="low"
            icon={<IconUser data-slot="icon" />}
            numerical
            size="md"
            variant="gray"
          />
        </div>
      </div>
    </header>
  )
}
