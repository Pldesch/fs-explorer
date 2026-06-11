import * as React from "react"
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router"
import { CopyIcon, DownloadIcon, Trash2Icon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Spinner } from "@/components/ui/spinner"
import { deletePath } from "@/server/files"
import { refreshTree } from "@/lib/use-tree"
import { nameOf, parentOf, rawFileUrl } from "@/lib/file-kinds"

interface EntryRef {
  path: string
  type: "dir" | "file"
}

export function EntryContextMenu({
  entry,
  children,
}: {
  entry: EntryRef
  children: React.ReactNode
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const name = nameOf(entry.path)
  const isFolder = entry.type === "dir"

  async function confirmDelete() {
    if (deleting) return
    setDeleting(true)
    setError(null)
    try {
      await deletePath({ data: { path: entry.path } })
      setConfirmOpen(false)
      refreshTree()
      // If the deleted item (or something inside it) is open, step up.
      const current = decodeURIComponent(location.pathname).replace(/^\/+/, "")
      if (current === entry.path || current.startsWith(`${entry.path}/`)) {
        const parent = parentOf(entry.path)
        if (parent) {
          await navigate({ to: "/$", params: { _splat: parent } })
        } else {
          await navigate({ to: "/" })
        }
      }
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          {entry.type === "file" && (
            <ContextMenuItem asChild>
              <a href={rawFileUrl(entry.path, true)}>
                <DownloadIcon />
                Download
              </a>
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onSelect={() =>
              navigator.clipboard.writeText(`/home/ubuntu/${entry.path}`)
            }
          >
            <CopyIcon />
            Copy path
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onSelect={() => {
              setError(null)
              setConfirmOpen(true)
            }}
          >
            <Trash2Icon />
            Delete {isFolder ? "folder" : "file"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {isFolder ? "folder" : ""} “{name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              {isFolder ? (
                <>
                  the folder and <strong>everything inside it</strong>
                </>
              ) : (
                "this file"
              )}{" "}
              from the server. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p className="text-destructive font-mono text-xs break-all">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Spinner data-icon="inline-start" />}
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
