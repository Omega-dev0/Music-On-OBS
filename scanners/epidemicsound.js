let extensionState;
let extensionSettings;
let extensionScannerState;
let interval;

let allowed = false;
let TAB_ID;

let snapshot;
let port


const platform = "epidemic sound";


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
  chrome.storage.local.set({
    "extension-scanner-state": {
      paused: data.paused,
      title: data.title,
      subtitle: data.subtitle,
      currentTime: getTimeFromTimeString(data.progress, ":"),
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
  return {
    url: document.querySelector(`a[aria-label="track page"]`)?.href,
    subtitle: document.querySelector(`a[aria-label="creatives"]`)?.innerHTML,
    title: (document.querySelector('[class^="src-mainapp-player-components-___ScrollingLabel__label___"]') || document.querySelector(`a[aria-label="track page"]`))?.innerHTML,
    cover: "https://www.epidemicsound.com/blog/content/images/2021/03/ES-logo-new-new-png.png",
    progress: (document.querySelectorAll(".src-mainapp-player-components-___LineProgressBar__duration___63Q0W > span").item(0) || document.querySelectorAll(".src-mainapp-player-components-___PlayerBar__waveformWrapper___BInpA > span").item(0))?.innerHTML,
    duration: (document.querySelectorAll(".src-mainapp-player-components-___LineProgressBar__duration___63Q0W > span").item(1) || document.querySelectorAll(".src-mainapp-player-components-___PlayerBar__waveformWrapper___BInpA > span").item(1))?.innerHTML,
    paused: document.querySelector('button[aria-label="Pause"][id]') == null,
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
