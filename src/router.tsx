import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    scrollRestoration: true,
    defaultPreload: "intent",
    // Loader results stay fresh briefly so revisiting a folder/file is instant.
    defaultStaleTime: 30_000,
    defaultPreloadStaleTime: 30_000,
    defaultGcTime: 5 * 60_000,
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
