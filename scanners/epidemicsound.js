let extensionState;
let extensionSettings;
let extensionScannerState;
let interval;

let allowed = false;
let TAB_ID;

let snapshot;

const platform = "epidemic sound";


//UTILITY
function getTimeFromTimeString(str, divider) {
  let split = str.split(divider);
  if (split.length == 1) {
    return str;
  } else if (split.length == 2) {
    return split[0] * 60 + split[1];
  } else if (split.length == 3) {
    return split[0] * 3600 + split[1] * 60 + split[2];
  }
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
  chrome.runtime.sendMessage({ key: "listener-update", data: { platform: platform, title: document.title } });
}).observe(document.querySelector("title"), { subtree: true, characterData: true, childList: true });

//UPDATE
let data = null;
function update() {
  if (allowed != true) {
    return;
  }
  data = getData();
  if (JSON.stringify(data) == JSON.stringify(snapshot)) {
    return; // ALREADY UPDATED
  }
  console.log("update", data, snapshot, data == snapshot);
  chrome.storage.local.set({
    "extension-scanner-state": {
      paused: data.paused,
      title: data.title,
      subtitle: data.subtitle,
      currentTime: getTimeFromTimeString(data.progress),
      currentLength: getTimeFromTimeString(data.duration),
      url: data.url,
      cover: data.cover,
    },
  });
  if (!snapshot) {
    chrome.runtime.sendMessage({ key: "sync-server" });
  } else {
    if (snapshot != data) {
      chrome.runtime.sendMessage({ key: "sync-server" });
    }
  }
  snapshot = data;
}

//GETS DATA FROM PAGE
function getData() {
  return {
    url: document.querySelector(`a[aria-label="track page"]`).href,
    subtitle: document.querySelector(`a[aria-label="creatives"]`).innerHTML,
    title: (document.querySelectorAll(".src-mainapp-components-___ScrollingLabel__label___BxH7N").item(0) || document.querySelector(`a[aria-label="track page"]`)).innerHTML,
    cover: "",
    progress: (document.querySelectorAll(".src-mainapp-player-components-___LineProgressBar__duration___63Q0W > span").item(0) || document.querySelector(".src-mainapp-player-components-___PlayerBar__elapsedTime___p-yYQ")).innerHTML,
    duration: (document.querySelectorAll(".src-mainapp-player-components-___LineProgressBar__duration___63Q0W > span").item(1) || document.querySelector(".src-mainapp-player-components-___PlayerBar__waveformWrapper___BInpA > span")).innerHTML,
    paused: !(document.querySelector(`.src-mainapp-player-components-___PlaybackControls__button___NXk1B.src-mainapp-player-components-___PlaybackControls__playPauseButton___UXa8w`).title == "Pause"),
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
      update();
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
