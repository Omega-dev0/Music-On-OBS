function getRefreshTokenFromCode(code, clientId, clientSecret, redirectUri) {
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const data = new URLSearchParams();
    data.append("grant_type", "authorization_code");
    data.append("code", code);
    data.append("redirect_uri", redirectUri);

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
                throw new Error("Failed to obtain a refresh token");
            }
            return response.json();
        })
        .then((data) => data.refresh_token)
        .catch((error) => {
            console.error("Error:", error);
        });
}


window.addEventListener("DOMContentLoaded", async function () {
    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('state') != "MOS") {
        console.error("Incorrect state")
        document.getElementById("status").innerHTML("Failed - Incorrect state")
        return
    }

    if (urlParams.get('error') != null) {
        console.error("An error occured!", urlParams.get('error'))
        alert("Oops an error ocurred during the Auth flow")
        document.getElementById("status").innerHTML("Failed - Error")
        return
    }
    let instance = extensionSettings.instance
    const code = urlParams.get('code')
    let redirect_url = `chrome-extension://${chrome.runtime.id}/interface/spotifyAuth/index.html`
    try {
        const refresh_token = await getRefreshTokenFromCode(code, instance.spotifyId, instance.spotifyAppToken, redirect_url)
        let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
        extensionSettings.instance.spotifyRefreshToken = refresh_token;
        console.log("Got token!",extensionSettings)
        chrome.storage.local.set({
            "extension-settings": extensionSettings,
        });
        document.getElementById("status").innerHTML("Success - You can close this page")
    } catch {
        console.log("Getting the refresh token failed!")
    }
})