let extensionState;
let extensionSettings;

async function onLaunch() {
  extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
}

function DOMLOADED() {
  let elements = {
    songName: document.getElementById,
  };
}

function checkIfValid() {
  let url = window.location.href;
  let domain = new URL(url);
  domain = domain.hostname.replace("www.", "");
  if (!domain == "soundcloud.com") {
    return false
  }else{
    return true
  }
}

chrome.storage.onChanged.addListener(async (object, areaName) => {
  console.log("Change detected:", object);
  if (areaName != "local") {
    return;
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"];
  }
  if (object["extension-settings"] != undefined) {
    extensionSettings = object["extension-settings"];
  }
});

onLaunch();
