const { contextBridge } = require("electron")

contextBridge.exposeInMainWorld("sshelf", {
  platform: process.platform,
})
