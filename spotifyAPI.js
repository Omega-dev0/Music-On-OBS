function SpotifyAPIScanner() {
  let extensionState;
  let extensionSettings;
  let oauth;

  let interval;
  let snapshot;

  async function onLaunch() {
    extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    oauth = (await chrome.storage.local.get("extension-oauth"))["extension-oauth"];
    extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    if (!extensionState.selectedScanner == "SpotifyAPI" || oauth.loggedIn == false || extensionState.stopped == false) {
      return;
    }

    run();
  }

  async function getData() {
    let response = await fetch("https://api.spotify.com/v1/me/player/currently-playing?market=FR", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + oauth.spotify.token,
      },
    });
    if (response.status == 204) {
      return {
        type: "204"
      }
    }
    const content = await response.json();

    if (content.currently_playing_type != "track") {
      return { type: content.currently_playing_type };
    }
    return {
      url: content.item.external_urls.spotify,
      subtitle: content.item.artists
        .map((x) => {
          return x.name;
        })
        .join(", "),
      title: content.item.name,
      cover: content.item.album.images[0].url,
      duration: Math.round(content.item.duration_ms / 1000),
      progress: Math.round(content.progress_ms / 1000),
      paused: !content.is_playing,
      type: content.currently_playing_type,
    };
  }

  async function run() {
    let fn = async () => {
      if (oauth.spotify.loggedIn == false || extensionState.selectedScanner != "spotifyAPI" || extensionState.stopped == true) {
        if (interval) {
          clearInterval(interval);
        }
        interval = undefined;
        return;
      }
      let data = await getData();
      if (extensionSettings.behaviour.detectPause == false) {
        data.paused == false;
      }
      if (data.type == "track") {
        chrome.storage.local.set({
          "extension-scanner-state": {
            paused: data.paused,
            title: data.title,
            subtitle: data.subtitle,
            currentTime: data.progress,
            currentLength: data.duration,
            url: data.url,
            cover: data.cover,
          },
        });
      } else {
        console.log("unsupported type", data);
        chrome.storage.local.set({
          "extension-scanner-state": {
            paused: true,
            title: "Unsupported type",
            subtitle: data.type == "204" ? "Player not detected" : "",
            currentTime: 0,
            currentLength: 0,
            url: "",
            cover: "",
          },
        });
      }
      if (!snapshot) {
        syncServer();
      } else {
        if (snapshot.paused != data.paused || snapshot.title != data.title || snapshot.subtitle != data.subtitle || snapshot.url != data.url || snapshot.cover != data.cover) {
          syncServer();
        }
      }

      snapshot = data;
    };
    interval = setInterval(fn, 5000);
    fn();
  }

  chrome.storage.onChanged.addListener(async (object, areaName) => {
    if (areaName != "local") {
      return;
    }
    if (object["extension-state"] != undefined) {
      extensionState = object["extension-state"].newValue;
      if (extensionState.selectedScanner == "spotifyAPI" && interval == undefined && extensionState.stopped == false) {
        run();
      } else {
        clearInterval(interval);
        interval = undefined;
      }
    }
    if (object["extension-settings"] != undefined) {
      extensionSettings = object["extension-settings"].newValue;
    }
    if (object["extension-oauth"] != undefined) {
      oauth = object["extension-oauth"].newValue;
    }
  });
  console.log("SpotifyScannerReady");
  onLaunch();
}

exports = SpotifyAPIScanner;
