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
        .then(async (response) => {
            if (!response.ok) {
                console.error("response:",response);
                console.log(await response.json())
                throw new Error("Failed to obtain a refresh token");
            }
            return response.json();
        })
        .then((data) => data.refresh_token)
        .catch((error) => {
            console.error("Error:", error);
            throw new Error("Error while fetching the refresh token");
        });
}


window.addEventListener("DOMContentLoaded", async function () {
    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('state') != "MOS") {
        console.error("Incorrect state")
        document.getElementById("status").innerHTML = "Failed - Incorrect state <br> Received:" + urlParams.get('state')
        return
    }

    if (urlParams.get('error') != null) {
        console.error("An error occured!", urlParams.get('error'))
        alert("Oops an error ocurred during the Auth flow")
        document.getElementById("status").innerHTML = "Failed - Error during the auth flow <br>" + urlParams.get('error')
        return
    }
    const code = urlParams.get('code')
    let redirect_url = `chrome-extension://${chrome.runtime.id}/interface/spotifyAuth/index.html`
    try {
        let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
        const refresh_token = await getRefreshTokenFromCode(code, extensionSettings.spotifyAPI.spotifyId, extensionSettings.spotifyAPI.spotifyAppToken, redirect_url)
        extensionSettings.spotifyAPI.spotifyRefreshToken = refresh_token;
        console.log("Got token!",extensionSettings)
        chrome.storage.local.set({
            "extension-settings": extensionSettings,
        });
        document.getElementById("status").innerHTML = "Success ! This page will close automatically"
        setTimeout(() => {
            window.close()
        },2500)
    } catch(e) {
        console.error(e)
        console.log("Getting the refresh token failed!")
        document.getElementById("status").innerHTML ="Failed to complete the spotify authentification <br>" + e
    }
})