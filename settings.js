extensionConfig = {}

extensionConfig.serverHost = "http://m.omegadev.xyz"
extensionConfig.serverPort = ""

extensionConfig.debugServerHost = "http://127.0.0.1"
extensionConfig.debugServerPort = ":6011"
extensionConfig.debug = true
extensionConfig.fakeServerConnection = true
extensionConfig.serverAdress = extensionConfig.debug ? `${extensionConfig.debugServerHost}${extensionConfig.debugServerPort}` : `${extensionConfig.serverHost}${extensionConfig.serverPort}`

extensionConfig.scanners = [
    {
        platform: "ytmusic",
        name: "Youtube Music",
        host: "music.youtube.com",
        color: "#d9431a"
    },
    {
        platform: "none",
        name: "None",
        host: "",
        color: "#18191a"
    }
]

extensionConfig.tabLessScanners = ["spotifyAPI"] //TabIds

function logger(...args) {
    if (extensionConfig.debug) {
        console.log(...args)
    }
}

chrome.storage.local.set({"extensionConfig": extensionConfig})

