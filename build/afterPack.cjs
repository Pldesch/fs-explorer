const { execFileSync } = require("node:child_process")
const path = require("node:path")

// We don't have an Apple Developer certificate yet, so electron-builder ships
// the macOS app without a usable signature. On Apple Silicon an unsigned (or
// broken-signature) app triggers "the app is damaged and can't be opened" and
// macOS refuses to launch it at all.
//
// An *ad-hoc* signature ("-") costs nothing and needs no account. It doesn't
// make the app notarized — users still do a one-time right-click → Open the
// first time — but it removes the "damaged" wall so the app actually runs.
// electron-builder's own signing step is skipped (no cert / auto-discovery
// disabled), so signing here in afterPack sticks and nothing overrides it.
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return

  const appName = `${context.packager.appInfo.productFilename}.app`
  const appPath = path.join(context.appOutDir, appName)

  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], {
    stdio: "inherit",
  })
}
