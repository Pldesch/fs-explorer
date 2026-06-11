import { createServerFn } from "@tanstack/react-start"
import {
  SshError,
  clearRemoteCache,
  fetchTree,
  findEntry,
  getCurrentHost,
  listRemoteDir,
  listSshConfigHosts,
  persistSshHost,
  readRemoteFile,
  resolveRemotePath,
  runRemote,
  searchRemote,
  setSshHost,
  shellQuote,
  sortEntries,
} from "@/server/ssh"
import { fileKindOf } from "@/lib/file-kinds"
import type { RemoteEntry, SearchResult, SshConfigHost } from "@/server/ssh"

const MAX_TEXT_BYTES = 4 * 1024 * 1024

export interface DirectoryView {
  kind: "dir"
  path: string
  entries: Array<RemoteEntry>
  /** True when the server is unreachable and this is the last saved copy. */
  stale: boolean
}

export interface FileView {
  kind: "file"
  path: string
  size: number
  modifiedAt: number
  /** Present for markdown and text files small enough to render inline. */
  content: string | null
  stale: boolean
}

export type BrowseResult = DirectoryView | FileView

export interface TreeResult {
  entries: Array<RemoteEntry>
  stale: boolean
  host: string | null
}

export const getTree = createServerFn().handler(
  async (): Promise<TreeResult> => {
    const tree = await fetchTree()
    return {
      entries: sortEntries([...tree.value]),
      stale: tree.stale,
      host: getCurrentHost(),
    }
  },
)

export interface SshHostsResult {
  hosts: Array<SshConfigHost>
  current: string | null
}

export const getSshHosts = createServerFn().handler(
  async (): Promise<SshHostsResult> => ({
    hosts: listSshConfigHosts(),
    current: getCurrentHost(),
  }),
)

export const selectSshHost = createServerFn({ method: "POST" })
  .inputValidator((data: { host: string }) => data)
  .handler(async ({ data }) => {
    const known = listSshConfigHosts().some((h) => h.alias === data.host)
    if (!known) {
      throw new Error(`"${data.host}" is not in your ~/.ssh/config`)
    }
    // Probe before committing so a bad pick never strands the app.
    const previous = getCurrentHost()
    setSshHost(data.host)
    try {
      await runRemote("echo ok")
    } catch (error) {
      setSshHost(previous)
      const detail =
        error instanceof Error ? error.message : "connection failed"
      throw new Error(`Could not connect to "${data.host}" — ${detail}`)
    }
    persistSshHost(data.host)
    return { ok: true, host: data.host }
  })

export const browsePath = createServerFn()
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data }): Promise<BrowseResult> => {
    if (data.path === "") {
      const listing = await listRemoteDir("")
      return {
        kind: "dir",
        path: "",
        entries: listing.value,
        stale: listing.stale,
      }
    }

    const found = await findEntry(data.path)
    if (!found.value) {
      throw new SshError(`"${data.path}" was not found on the server`)
    }
    const entry = found.value

    if (entry.type === "dir") {
      const listing = await listRemoteDir(data.path)
      return {
        kind: "dir",
        path: data.path,
        entries: listing.value,
        stale: listing.stale || found.stale,
      }
    }

    const kind = fileKindOf(data.path)
    let content: string | null = null
    let stale = found.stale
    if (
      (kind === "markdown" || kind === "text") &&
      entry.size <= MAX_TEXT_BYTES
    ) {
      const file = await readRemoteFile(data.path)
      content = file.value.toString("utf-8")
      stale = stale || file.stale
    }
    return {
      kind: "file",
      path: data.path,
      size: entry.size,
      modifiedAt: entry.modifiedAt,
      content,
      stale,
    }
  })

export const deletePath = createServerFn({ method: "POST" })
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data }) => {
    if (!data.path) throw new Error("The root folder cannot be deleted")
    const found = await findEntry(data.path)
    if (!found.value) {
      throw new SshError(`"${data.path}" was not found on the server`)
    }
    const absolute = resolveRemotePath(data.path)
    const flags = found.value.type === "dir" ? "-rf" : "-f"
    await runRemote(`rm ${flags} ${shellQuote(absolute)}`)
    // Listings and contents are now wrong — refetch on next request.
    clearRemoteCache()
    return { ok: true }
  })

export const searchFiles = createServerFn()
  .inputValidator((data: { query: string }) => data)
  .handler(async ({ data }): Promise<Array<SearchResult>> => {
    return searchRemote(data.query)
  })
