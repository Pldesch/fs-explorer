const { app, dialog } = require("electron")

// Wires up background auto-updates against the GitHub Releases feed configured
// in package.json `build.publish`. electron-updater pulls the latest.yml
// manifest, downloads the installer in the background, and we prompt the user
// to restart once it's staged.
//
// Guard rails:
//  - Dev runs are skipped — there's nothing published to update against.
//  - macOS is skipped for now: Squirrel.Mac refuses unsigned updates, and we
//    don't yet sign/notarize, so Mac users update manually. Revisit once an
//    Apple Developer cert is in place.
function initAutoUpdates(mainWindow) {
  if (!app.isPackaged) return
  if (process.platform !== "win32") return

  let autoUpdater
  try {
    ;({ autoUpdater } = require("electron-updater"))
  } catch {
    // Dependency not bundled — nothing to do.
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on("error", (error) => {
    // Never surface update failures to the user as a crash — just log them.
    // A missing release or offline machine should be a no-op, not a popup.
    console.error(
      "Auto-update error:",
      error == null ? "unknown" : (error.stack || error).toString()
    )
  })

  autoUpdater.on("update-downloaded", async (info) => {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update ready",
      message: `Codex Explorer ${info.version} is ready to install.`,
      detail:
        "The update has been downloaded. Restart now to apply it, or it will " +
        "install the next time you quit.",
    })
    if (response === 0) {
      // Defer so the dialog fully closes before the app tears down.
      setImmediate(() => autoUpdater.quitAndInstall())
    }
  })

  autoUpdater.checkForUpdates().catch((error) => {
    console.error("Auto-update check failed:", error)
  })
}

module.exports = { initAutoUpdates }
