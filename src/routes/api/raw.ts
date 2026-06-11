import { createFileRoute } from "@tanstack/react-router"
import { findEntry, readRemoteFile } from "@/server/ssh"
import { mimeTypeOf, nameOf } from "@/lib/file-kinds"

export const Route = createFileRoute("/api/raw")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const path = url.searchParams.get("path")
        if (!path) {
          return new Response("Missing path", { status: 400 })
        }
        try {
          const found = await findEntry(path)
          if (!found.value || found.value.type !== "file") {
            return new Response("Not a file", { status: 404 })
          }
          // Cheap revalidation: same size + mtime → browser keeps its copy.
          const etag = `"${found.value.size}-${found.value.modifiedAt}"`
          const headers: Record<string, string> = {
            ETag: etag,
            "Cache-Control": "private, max-age=60",
          }
          if (request.headers.get("if-none-match") === etag) {
            return new Response(null, { status: 304, headers })
          }
          const file = await readRemoteFile(path)
          const fileName = nameOf(path)
          const disposition =
            url.searchParams.get("download") === "1" ? "attachment" : "inline"
          return new Response(new Uint8Array(file.value), {
            headers: {
              ...headers,
              "Content-Type": mimeTypeOf(fileName),
              "Content-Length": String(file.value.byteLength),
              "Content-Disposition": `${disposition}; filename="${encodeURIComponent(fileName)}"`,
            },
          })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to read file"
          return new Response(message, { status: 502 })
        }
      },
    },
  },
})
