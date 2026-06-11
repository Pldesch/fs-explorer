import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  ErrorView,
  ExplorerView,
  PendingView,
  explorerLoader,
} from "@/components/explorer"
import type { PageData } from "@/components/explorer"

interface RootSearch {
  /** Legacy links used `?path=…` — redirect them to the real path. */
  path?: string
  q?: string
  setup?: boolean
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): RootSearch => ({
    path:
      typeof search.path === "string" && search.path ? search.path : undefined,
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    setup: search.setup === true || search.setup === "true" || undefined,
  }),
  loaderDeps: ({ search }) => ({
    path: search.path,
    q: search.q,
    setup: search.setup,
  }),
  loader: async ({ deps }): Promise<PageData> => {
    if (deps.path) {
      throw redirect({ to: "/$", params: { _splat: deps.path } })
    }
    return explorerLoader({ path: "", q: deps.q, setup: deps.setup })
  },
  pendingComponent: PendingView,
  errorComponent: ErrorView,
  component: RootPage,
})

function RootPage() {
  const data = Route.useLoaderData()
  const { q } = Route.useSearch()
  return <ExplorerView data={data} path="" q={q} />
}
