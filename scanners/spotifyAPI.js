

//------------- Spotify API Manager ----------
function isAuthentificated() {
    if (extensionSettings.spotifyAPI.spotifyAppToken == undefined || extensionSettings.spotifyAPI.spotifyId == undefined || extensionSettings.spotifyAPI.spotifyRefreshToken == undefined) {
        return false
    }
    return true
}

async function checkTokenValidity() {
    if (Date.now() >= spotifyAPIState.spotifyTokenExpiry) {
        let newToken = await getAccesstokenFromRefreshToken();
        spotifyAPIState.spotifyToken = newToken;
        spotifyAPIState.spotifyTokenExpiry = Date.now() + 2000 * 1000;
        await chrome.storage.local.set({ "spotifyAPI-state": spotifyAPIState });
    }
}

//--------------- Spotify API  --------------

/**
 * Retrieves a new access token from Spotify using a refresh token.
 * @returns {Promise<string>} A promise that resolves to the new access token.
 * @throws {Error} If failed to obtain a new access token.
 */
async function getAccesstokenFromRefreshToken() {
    const endpointUrl = "https://accounts.spotify.com/api/token";
    const data = new URLSearchParams();
    data.append("grant_type", "refresh_token");
    data.append("refresh_token", extensionSettings.spotifyAPI.spotifyRefreshToken);

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(extensionSettings.spotifyAPI.spotifyId + ":" + extensionSettings.spotifyAPI.spotifyAppToken),
        },
        body: data,
    };

    let response = await fetch(endpointUrl, requestOptions)
    if (response.status != 200) {
        throw new Error("Failed to obtain a new access token");
    }
    let json = await response.json();
    return json.access_token;
}

async function getCurrentPlayingTrack() {
    const endpointUrl = "https://api.spotify.com/v1/me/player/currently-playing";
    const requestOptions = {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${spotifyAPIState.spotifyToken}`,
        },
    };

    let response = await fetch(endpointUrl, requestOptions)
    if (response.status != 200) {
        throw new Error("Failed to get spotify track!");
    }

    let json = await response.json();
    return json;
}

//--------------- CUSTOM SCANNER ------------
class SpotifyScanner {
    constructor(platform, tabId, title) {
        this.platform = platform;
        this.tabId = tabId;
        this.allowed = false

        this.extensionState = {}
        this.refreshInterval = 1000;
        this.registered = true
        this.settings = extensionConfig;
        this.additionalAllowedChecks = [];
        this.title = title;
    }

    async update(data) {
        this.extensionState = extensionState;

        this.updateIfAllowed();
        if (!this.allowed) { return }

        logger(this.settings.debug, `[MOS][SCANNER - UPDATE]: (${this.platform})`, this)
        if (JSON.stringify(this.data) == JSON.stringify(data)) { return }

        logger(this.settings.debug, "[SCANNER] Updating scanner with platform: " + this.platform)
        await chrome.storage.local.set({
            "extension-scanner-state": data
        })
        updateServer();
        this.data = data;
    }

    updateIfAllowed() {
        if (this.extensionState.stopped) { return false }
        if (this.tabId == undefined) { return false }

        for (let check of this.additionalAllowedChecks) {
            if (!check(this)) {
                this.allowed = false;
                return false;
            }
        }

        let selectedScanner = this.extensionState.selectedScanner;
        if (selectedScanner == this.tabId) {
            this.allowed = true;
            return true;
        } else {
            this.allowed = false;
            return false;
        }
    }

    setAdditionalAllowedCheck(f) {
        this.additionalAllowedChecks.push(f);
    }
}

function updateServer() {
    
}

//----------------- Scanner -----------------
extensionReady.addEventListener("ready", async () => {

    let SCANNER = new SpotifyScanner("spotifyAPI", "spotifyAPI", "Spotify API"); // platform, tabId, title

    async function SpotifygetData() {
        if (!isAuthentificated()) { return {} }
        await checkTokenValidity();

        let track = await getCurrentPlayingTrack();

        let data = {
            paused: !track.is_playing,
            title: track.item.name,
            subtitle: track.item.artists.map((x) => x.name).join(", "),
            currentTime: Math.floor(track.progress_ms / 1000),
            currentLength: Math.floor(track.item.duration_ms / 1000),
            url: track.item.external_urls.spotify,
            cover: track.item.album.images[0].url,
        }

        return data;
    }

    SCANNER.setAdditionalAllowedCheck((scanner) => {
        if (!isAuthentificated()) {
            return false;
        } else {
            return true;
        }
    })
    setInterval(async () => {
        SCANNER.update(await SpotifygetData());
    }, SCANNER.refreshInterval);

    console.log("Spotify API Scanner started")
})