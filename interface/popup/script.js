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
let extensionState;
let extensionScannerState;

//TEXT WIDTH (requires document)
function _escTag(s) {
  return s.replace("<", "&lt;").replace(">", "&gt;");
} // ESCAPPING < and >
function getTextWidth(str, className) {
  let span = document.createElement("span");
  if (className) span.className = className;
  span.style.display = "inline";
  span.style.visibility = "hidden";
  span.style.padding = "0px";
  document.body.appendChild(span);
  span.innerHTML = _escTag(str);
  let w = span.offsetWidth;
  document.body.removeChild(span);
  return w;
}
function fitStringToWidth(str, width, className) {
  var span = document.createElement("span");
  if (className) span.className = className;
  span.style.display = "inline";
  span.style.visibility = "hidden";
  span.style.padding = "0px";
  document.body.appendChild(span);
  var result = _escTag(str);
  span.innerHTML = result;
  if (span.offsetWidth > width) {
    var posStart = 0,
      posMid,
      posEnd = str.length,
      posLength;
    while ((posLength = (posEnd - posStart) >> 1)) {
      posMid = posStart + posLength;
      span.innerHTML = _escTag(str.substring(0, posMid)) + "&hellip;";
      if (span.offsetWidth > width) posEnd = posMid;
      else posStart = posMid;
    }
    result = '<abbr title="' + str.replace('"', "&quot;") + '">' + _escTag(str.substring(0, posStart)) + "&hellip;</abbr>";
  }
  document.body.removeChild(span);
  return result;
}

//SELECT CUSTOM

async function update() {
  if (!extensionSettings || !extensionState || !extensionScannerState) {
    extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
  }

  document.getElementById("titleDisplay").innerHTML = extensionScannerState.title;
  document.getElementById("subtitleDisplay").innerHTML = extensionScannerState.subtitle;
  if (extensionScannerState.paused == true) {
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: ${chrome.i18n.getMessage("Paused")} <br> ${chrome.i18n.getMessage("Listening_to")}: ${extensionState.selectedScanner}`;
    document.getElementById("statusDisplay").className = "paused";
    document.getElementById("start").setAttribute("customDisable", "");
    document.getElementById("stop").removeAttribute("customDisable");
  } else {
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: ${chrome.i18n.getMessage("Active")} <br> ${chrome.i18n.getMessage("Listening_to")}: ${extensionState.selectedScanner}`;
    document.getElementById("statusDisplay").className = "active";
    document.getElementById("start").setAttribute("customDisable", "");
    document.getElementById("stop").removeAttribute("customDisable");
  }
  if (extensionState.stopped == true) {
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: ${chrome.i18n.getMessage("Inactive")}`;
    document.getElementById("statusDisplay").className = "inactive";
    document.getElementById("stop").setAttribute("customDisable", "");
    document.getElementById("start").removeAttribute("customDisable");
  }

  //SCANNERS LIST
  let options = "";

  let platformColours = {
    youtube: "#bf2e2e",
    spotify: "#2ebf52",
    soundcloud: "#bf7b2e",
    "epidemic sound": "#363433",
    "youtube music": "#363433",
    "deezer": "#1d7833",
    "pretzel": "#4287f5"
  };

  let scanners = extensionState.scanners
  if (extensionSettings.instance.spotifyId != "" && extensionSettings.instance.spotifyAppToken != "" && extensionSettings.instance.spotifyRefreshToken != "") {
    if (scanners.filter((x) => x.id == "SPOTIFY-API").length == 0) {
      scanners.push({
        id: "SPOTIFY-API",
        platform: "spotify",
        title: "Spotify API"
      })
    }
  } else {
    scanners = scanners.filter((x) => {
      return x.id != "SPOTIFY-API"
    })
  }
  if (scanners) {
    options += `<option value="none" style="background-color:#1f1d1d;">None</option>`;
    for (let listener of scanners) {
      options += `<option value="${listener.id}" style="background-color:${platformColours[listener.platform]};">${fitStringToWidth(`${listener.title}`, 170)}</option>`;
    }
  }

  document.getElementById("listenerSelect").innerHTML = options;

  if (extensionState.scanners.filter((x) => x.id == extensionState.selectedScanner).length > 0) {
    document.getElementById("listenerSelect").value = extensionState.selectedScanner;
    updateSelectColor()
  } else {
    document.getElementById("listenerSelect").value = "none";
    updateSelectColor()
  }
}

function updateSelectColor() {
  let select = document.getElementById("listenerSelect")
  for (let option of select.querySelectorAll("option")) {
    console.log(option.innerHTML, option.value, select.value)
    if (option.value == select.value) {
      select.style.backgroundColor = option.style.backgroundColor
    }
  }
}

function e() {
  document.getElementById("listenerSelect").addEventListener("change", async () => {
    let value = document.getElementById("listenerSelect").value;
    updateSelectColor()
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
    extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

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
    chrome.storage.local.set({
      "extension-scanner-state": {
        paused: true,
        title: "Extension stopped",
        subtitle: "",
        currentTime: 0,
        currentLength: 0,
        url: "",
        cover: "",
      },
    });
    chrome.runtime.sendMessage({ key: "sync-server" });
  });
}

document.addEventListener("DOMContentLoaded", update);
document.addEventListener("DOMContentLoaded", translator);
document.addEventListener("DOMContentLoaded", e);

update();

chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-settings"] != undefined) {
    extensionSettings = object["extension-settings"].newValue;
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"].newValue;
  }
  if (object["extension-scanner-state"] != undefined) {
    extensionScannerState = object["extension-scanner-state"].newValue;
  }
  update(object);
});
