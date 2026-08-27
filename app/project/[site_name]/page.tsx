import { DashboardPage } from "@/app/page"

export const dynamic = "force-dynamic"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ site_name: string }>
}) {
  const { site_name } = await params

  return <DashboardPage initialProjectName={site_name} />
}
