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



async function update() {
  let extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];

  document.getElementById("titleDisplay").innerHTML = extensionScannerState.title;
  document.getElementById("subtitleDisplay").innerHTML = extensionScannerState.subtitle;
  if (extensionScannerState.paused == true) {
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

chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-scanner-state"] != undefined) {
    let data = object["extension-scanner-state"].newValue;
    document.getElementById("titleDisplay").innerHTML = data.title;
    document.getElementById("subtitleDisplay").innerHTML = data.subtitle;
    if (data.paused == true) {
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
  }
  if (object["extension-state"] != undefined) {
    let data = object["extension-state"].newValue;
    if (data.stopped == true) {
      document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Inactive`;
      document.getElementById("statusDisplay").className = "inactive";
      document.getElementById("stop").setAttribute("customDisable", "");
      document.getElementById("start").removeAttribute("customDisable");
    }
    let html = ``;
    /*
    {
      tabId:""
      name:""
    }
    
    for(let i;i=0;i<=data.scanners.length){
      scanner = data.scanners[i]
      html += ``
    }
    */
    //TODO
  }
});

function e(){
  document.getElementById("listenerSelect").addEventListener("change", async ()=>{
    let value = document.getElementById("listenerSelect").value

    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];

    chrome.storage.local.set({
      "extension-state": {
        stopped: extensionState.stopped,
        scanners: extensionState.scanners,
        selectedScanner: value,
      },
    });
  })

  document.getElementById("start").addEventListener("click", async ()=>{
    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    chrome.storage.local.set({
      "extension-state": {
        stopped: false,
        scanners: extensionState.scanners,
        selectedScanner: document.getElementById("listenerSelect").value,
      },
    });
  })
  document.getElementById("stop").addEventListener("click", async ()=>{
    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    chrome.storage.local.set({
      "extension-state": {
        stopped: true,
        scanners: extensionState.scanners,
        selectedScanner: document.getElementById("listenerSelect").value,
      },
    });
  })
}

document.addEventListener("DOMContentLoaded", update);
document.addEventListener("DOMContentLoaded", translator);
document.addEventListener("DOMContentLoaded", e);