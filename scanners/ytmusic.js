let extensionState;
let extensionSettings;
let extensionScannerState;
let interval;

let allowed = false;
let TAB_ID;
let port

let snapshot;

const platform = "youtube music"

//UTILITY
function getTimeFromTimeString(str, divider) {
  if (str == undefined) { return undefined }
  let split = str.split(divider);
  if (split.length == 1) {
    return parseInt(str);
  } else if (split.length == 2) {
    return parseInt(split[0]) * 60 + parseInt(split[1]);
  } else if (split.length == 3) {
    return parseInt(split[0]) * 3600 + parseInt(split[1]) * 60 + parseInt(split[2]);
  }
}

function sendMessage(msg) {
  chrome.runtime.sendMessage(msg)
}

//GETS DATA FROM STORAGE
async function onLaunch() {
  extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

  //GET TAB
  let res = await chrome.runtime.sendMessage({ key: "listener-register", data: { platform: platform, title: document.title } });
  TAB_ID = res.tabId;
  if (extensionState.selectedScanner != TAB_ID || TAB_ID != undefined) {
    return;
  }
  allowed = true;
}

new MutationObserver(function (mutations) {
  //Tab title changed
  sendMessage({ key: "listener-update", data: { platform: platform, title: document.title } });
}).observe(document.querySelector("title"), { subtree: true, characterData: true, childList: true });

//UPDATE
let data = null;
function update(forceUpdate) {
  if (allowed != true) {
    return;
  }
  try {
    data = getData();
  } catch (e) {
    data = snapshot
    console.warn(`MOS - Failed to fetch data for current song!`)
    console.warn(e)
  }
  if (JSON.stringify(data) == JSON.stringify(snapshot) && forceUpdate != true) {
    return; // ALREADY UPDATED
  }

  let ct = getTimeFromTimeString(data.progress, ":")
  chrome.storage.local.set({
    "extension-scanner-state": {
      paused: ct > 0 ? data.paused : false,
      title: data.title,
      subtitle: data.subtitle,
      currentTime: ct,
      currentLength: getTimeFromTimeString(data.duration, ":"),
      url: data.url,
      cover: data.cover,
    },
  });
  if (!snapshot) {
    sendMessage({ key: "sync-server" });
  } else {
    if (JSON.stringify(snapshot) != JSON.stringify(data)) {
      sendMessage({ key: "sync-server" });
    }
  }
  snapshot = data;
}

//GETS DATA FROM PAGE
function getData() {
  let coverElement = document.querySelector(".image.style-scope.ytmusic-player-bar")?.src
  return {
    url: document.querySelectorAll(".ytmusic-player-bar >.yt-simple-endpoint.yt-formatted-string").item(1)?.href.replace(/list=[^&]*&/g, '') || document.location.href,
    subtitle: navigator.mediaSession.metadata?.artist,
    title: navigator.mediaSession.metadata?.title,
    cover: coverElement == undefined ? undefined : (new URL(coverElement).host == "lh3.googleusercontent.com" ? document.querySelector(".image.style-scope.ytmusic-player-bar")?.src.replace("w60-h60", "w600-h600") : document.querySelector(".image.style-scope.ytmusic-player-bar")?.src.split("?sqp")[0]),
    progress: document.querySelector(`.time-info`)?.innerHTML.split(" / ")[0]?.replace("\n    ", ""),
    duration: document.querySelector(`.time-info`)?.innerHTML.split(" / ")[1]?.replace("\n  ", ""),
    paused: document.querySelector("#play-pause-button")?.ariaLabel == undefined ? undefined : (document.querySelector("#play-pause-button")?.ariaLabel == "Play"),
  };
}

//MAKES SURE DATA FROM DB IS UP TO DATE
chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"].newValue;
    if (extensionState.selectedScanner == TAB_ID && TAB_ID != undefined && extensionState.stopped == false) {
      allowed = true;
      update(true);
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
});

console.log(`MOS - ${platform} Scanner ready`);
onLaunch();

setInterval(update, 1000);
