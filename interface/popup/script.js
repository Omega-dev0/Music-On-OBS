function translator() {
  let elements = document.querySelectorAll("[translated]");
  elements.forEach((element) => {
    try {
      element.innerHTML = chrome.i18n.getMessage(element.innerHTML.replaceAll(" ", "_").replace(/[^\x00-\x7F]/g, ""));
    } catch (error) {
      console.warn("[TRANSLATOR] - Failed to translate for:", element.innerHTML, error);
    }
  });
}

let extensionSettings;
let extensionOAUTH;
let extensionState;
let extensionScannerState

async function update() {
  if (!extensionSettings || !extensionOAUTH || !extensionState || !extensionScannerState) {
    extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    extensionOAUTH = (await chrome.storage.local.get("extension-oauth"))["extension-oauth"];
    extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
  }
  document.getElementById("titleDisplay").innerHTML = extensionScannerState.title;
  document.getElementById("subtitleDisplay").innerHTML = extensionScannerState.subtitle;
  if (extensionState.paused == true) {
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Paused`;
    document.getElementById("statusDisplay").className = "paused";
    document.getElementById("start").setAttribute("customDisable", "");
    document.getElementById("stop").removeAttribute("customDisable");
  } else {
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Active`;
    document.getElementById("statusDisplay").className = "active";
    document.getElementById("start").setAttribute("customDisable", "");
    document.getElementById("stop").removeAttribute("customDisable");
  }
  if (extensionState.stopped == true) {
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Inactive`;
    document.getElementById("statusDisplay").className = "inactive";
    document.getElementById("stop").setAttribute("customDisable", "");
    document.getElementById("start").removeAttribute("customDisable");
  }
}

function e() {
  document.getElementById("listenerSelect").addEventListener("change", async () => {
    let value = document.getElementById("listenerSelect").value;

    //let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];

    chrome.storage.local.set({
      "extension-state": {
        stopped: extensionState.stopped,
        scanners: extensionState.scanners,
        selectedScanner: value,
      },
    });
  });

  document.getElementById("start").addEventListener("click", async () => {
    extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    extensionOAUTH = (await chrome.storage.local.get("extension-oauth"))["extension-oauth"];
    extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

    console.log(extensionOAUTH.spotify.loggedIn, document.getElementById("listenerSelect").value);
    if (extensionOAUTH.spotify.loggedIn == false && document.getElementById("listenerSelect").value == "spotifyAPI") {
      return;
    }
    chrome.storage.local.set({
      "extension-state": {
        stopped: false,
        scanners: extensionState.scanners,
        selectedScanner: document.getElementById("listenerSelect").value,
      },
    });
  });
  document.getElementById("stop").addEventListener("click", async () => {
    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    chrome.storage.local.set({
      "extension-state": {
        stopped: true,
        scanners: extensionState.scanners,
        selectedScanner: document.getElementById("listenerSelect").value,
      },
    });
  });
}

document.addEventListener("DOMContentLoaded", update);
document.addEventListener("DOMContentLoaded", translator);
document.addEventListener("DOMContentLoaded", e);
chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-settings"] != undefined) {
    extensionSettings = object["extension-settings"].newValue;
  }
  if (object["extension-oauth"] != undefined) {
    extensionOAUTH = object["extension-oauth"].newValue;
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"].newValue;
  }
  if(object["extension-scanner-state"] != undefined){
    extensionScannerState = object["extension-scanner-state"].newValue
  }
  update(object);
});
