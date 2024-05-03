




let extensionState;
let extensionSettings;
let extensionScannerState;
let spotifyState;

const TAB_ID = "SPOTIFY-API"
let allowed = false


let timeout = 1500



setInterval(async () => {
    if(!extensionState){
        extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    }
    if(!extensionSettings){
        extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    }
    if (extensionState.selectedScanner == TAB_ID && extensionState.stopped == false && extensionSettings.instance.spotifyRefreshToken != "") { getCurrentSong() }
}, timeout)


async function getCreds() {
    let is = ((await chrome.storage.local.get("extension-settings"))["extension-settings"]).instance;
    let exists = false
    if (is.spotifyId != "" && is.spotifyAppToken != "") {
        exists = true
    }
    return {
        exists: exists,
        creds: {
            id: is.spotifyId,
            appToken: is.spotifyAppToken,
            refreshToken: is.spotifyRefreshToken
        }
    }
}

snapshot = {}

async function getCurrentSong() {
    let credsStatus = await getCreds()
    if (!credsStatus.exists) {
        return
    }
    let spotifyState = (await chrome.storage.local.get("spotifyState"))["spotifyState"];

    if (Date.now() >= spotifyState.spotifyTokenExpiry) {
        try {
            let token = await getAccessTokenFromRefreshToken(credsStatus.creds.refreshToken, credsStatus.creds.id, credsStatus.creds.appToken)
            chrome.storage.local.set({
                "spotifyState": {
                    spotifyToken: token,
                    spotifyTokenExpiry: Date.now() + 2000 * 1000
                },
            });
            spotifyState = {
                spotifyToken: token,
                spotifyTokenExpiry: Date.now() + 2000 * 1000
            }
        } catch (e) {
            console.warn("Spotify token refresh failed!", e)
            return
        }
    }

    try {
        let track = await getCurrentPlayingTrack(spotifyState.spotifyToken)
        let txt = await track.text()
        if (txt != "") {
            let json = JSON.parse(txt)

            let data = {
                paused: !json.is_playing,
                title: json.item.name,
                subtitle: json.item.artists.map((x) => x.name).join(", "),
                currentTime: Math.floor(json.progress_ms / 1000),
                currentLength: Math.floor(json.item.duration_ms / 1000),
                url: json.item.external_urls.spotify,
                cover: json.item.album.images[0].url,
            }
            chrome.storage.local.set({
                "extension-scanner-state": data
            });
            syncServer()
        }
    } catch (e) {
        console.warn("Getting song failed!", e)
    }
    //REQUEST
}

function getCurrentPlayingTrack(accessToken) {
    const url = "https://api.spotify.com/v1/me/player/currently-playing";

    const requestOptions = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    };

    return fetch(url, requestOptions)
        .then((response) => {
            if (!response.ok) {
                console.error(response)
                throw new Error("Failed to retrieve currently playing track");
            }
            return response
        })
        .then((data) => data)
}

function getAccessTokenFromRefreshToken(refreshToken, clientId, clientSecret) {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const data = new URLSearchParams();
    data.append("grant_type", "refresh_token");
    data.append("refresh_token", refreshToken);

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
        },
        body: data,
    };

    return fetch(tokenUrl, requestOptions)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to obtain a new access token");
            }
            return response.json();
        })
        .then((data) => data.access_token)
        .catch((error) => {
            console.error("Error:", error);
        });
}


chrome.storage.onChanged.addListener(async (object, areaName) => {
    if (areaName != "local") {
        return;
    }
    if (object["extension-state"] != undefined) {
        extensionState = object["extension-state"].newValue;
        if (extensionState.selectedScanner == TAB_ID && TAB_ID != undefined && extensionState.stopped == false) {
            allowed = true;
        } else {
            allowed = false;
        }
    }
    if (object["extension-settings"] != undefined) {
        extensionSettings = object["extension-settings"].newValue;
    }
    if (object["extension-scanner-state"] != undefined) {
        extensionScannerState = object["extension-scanner-state"].newValue;
    }
    if (object["spotifyState"] != undefined) {
        spotifyState = object["spotifyState"].newValue;
    }
});