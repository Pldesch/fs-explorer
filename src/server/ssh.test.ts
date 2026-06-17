import { describe, expect, it } from "vitest"
import { REMOTE_ROOT, resolveRemotePath, shellQuote } from "./ssh"

describe("shellQuote", () => {
  it("wraps a plain value in single quotes", () => {
    expect(shellQuote("a b")).toBe("'a b'")
  })

  it("escapes embedded single quotes", () => {
    expect(shellQuote("it's")).toBe("'it'\\''s'")
  })
})

describe("resolveRemotePath", () => {
  it("resolves a normal relative path under the root", () => {
    expect(resolveRemotePath("Process/CONTEXT.md")).toBe(
      `${REMOTE_ROOT}/Process/CONTEXT.md`
    )
  })

  it("resolves an empty path to the root", () => {
    expect(resolveRemotePath("")).toBe(REMOTE_ROOT)
  })

  it("collapses empty and current-directory segments", () => {
    expect(resolveRemotePath("./a/./b")).toBe(`${REMOTE_ROOT}/a/b`)
  })

  it("rejects paths that try to escape the root", () => {
    expect(() => resolveRemotePath("../x")).toThrow()
    expect(() => resolveRemotePath("../etc/passwd")).toThrow()
    expect(() => resolveRemotePath("a/../../etc")).toThrow()
  })
})
