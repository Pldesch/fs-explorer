import { createFileRoute } from "@tanstack/react-router"
import {
  ErrorView,
  ExplorerView,
  PendingView,
  explorerLoader,
} from "@/components/explorer"
import type { PageData } from "@/components/explorer"

export const Route = createFileRoute("/$")({
  loader: async ({ params }): Promise<PageData> => {
    return explorerLoader({ path: params._splat ?? "" })
  },
  pendingComponent: PendingView,
  errorComponent: ErrorView,
  component: PathPage,
})

function PathPage() {
  const data = Route.useLoaderData()
  const { _splat = "" } = Route.useParams()
  return <ExplorerView data={data} path={_splat} />
}
