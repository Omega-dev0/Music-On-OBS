extensionConfig = {}

extensionConfig.serverHost = "https://music.omegadev.xyz"
extensionConfig.serverPort = ""

extensionConfig.debugServerHost = "http://127.0.0.1"
extensionConfig.debugServerPort = ":6015"
extensionConfig.debug = false
extensionConfig.fakeServerConnection = false
extensionConfig.serverAdress = extensionConfig.debug ? `${extensionConfig.debugServerHost}${extensionConfig.debugServerPort}` : `${extensionConfig.serverHost}${extensionConfig.serverPort}`

extensionConfig.scanners = [
    {
        platform: "ytmusic",
        name: "Youtube Music",
        host: "music.youtube.com",
        color: "#d9431a"
    },
    {
        platform: "youtube",
        name: "Youtube",
        host: "youtube.com",
        color: "#d9431a"
    },
    {
        platform: "spotifyAPI",
        name: "Spotify API",
        host: "",
        color: "#1DB954"
    },
    {
        platform: "epidemic",
        name: "Epidemic Sound",
        host: "www.epidemicsound.com",
        color: "#302c2c"
    },
    {
        platform: "none",
        name: "None",
        host: "",
        color: "#18191a"
    },
    {
        platform: "spotify",
        name: "Spotify",
        host: "open.spotify.com",
        color: "#1DB954"
    },
    {
        platform: "soundcloud",
        name: "Soundcloud",
        host: "soundcloud.com",
        color: "#ffbb00"
    },
    {
        platform: "pretzel",
        name: "Pretzel",
        host: "play.pretzel.rocks",
        color: "#00b8b8"
    },
    {
        platform: "deezer",
        name: "Deezer",
        host: "deezer.com",
        color: "#4e5252"
    },
    {
        platform: "nightbot",
        name: "Nightbot songs",
        host: "nightbot.tv",
        color: "#2e5c5c",
        notice: "Thumbnail unavailable for soundcloud tracks",
        disabled: true
    }
]

extensionConfig.tabLessScanners = ["spotifyAPI"] //TabIds

function logger(...args) {
    if (extensionConfig.debug) {
        console.log(...args)
    }
}

chrome.storage.local.set({ "extensionConfig": extensionConfig })

