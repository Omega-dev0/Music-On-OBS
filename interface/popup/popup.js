const manifest = chrome.runtime.getManifest();

document.getElementById("start").addEventListener("click", async () => {
  tabID = document.getElementById("tabSelector").value;
  if (tabID != "" && tabID) {
    chrome.storage.local.set({ activeScanner: tabID });
  }
});

document.getElementById("stop").addEventListener("click", async () => {
  chrome.storage.local.set({ activeScanner: "0" });
  let presets = (await chrome.storage.local.get("presets")).presets
  let preset = (await chrome.storage.local.get("usedPreset")).usedPreset
  preJson = {
    type: "full",
    title: chrome.i18n.getMessage("theExtensionIsStopped"),
    chapter: "",
    url: "",
    theme: presets[preset] || presets["default"],
    version: manifest.version,
    paused: false,
    source: "STOPPED",
  };
  json = JSON.stringify(preJson);
  chrome.runtime.sendMessage({ text: "SERVER_UPDATE__JSON__" + json });
});

document.getElementById("update").addEventListener("click", async () => {
  chrome.storage.local.set({ updateRequired: true });
});

async function updateTabs() {
  let scanners = (await chrome.storage.local.get("scanners")).scanners;
  let ids = [];
  for (var i = 0; i < scanners.length; i++) {
    var opt = scanners[i];
    opte = document.getElementById("TABS_" + opt.tabId);
    if (!opte) {
      var el = document.createElement("option");
      el.textContent = opt.title.substring(0, 15) + "...";
      el.value = opt.tabId;
      el.id = "TABS_" + opt.tabId;
      document.getElementById("tabSelector").appendChild(el);
    } else if (opte.textContent != opt.title.substring(0, 15) + "...") {
      opte.textContent = opt.title.substring(0, 15) + "...";
    }
    ids.push("TABS_" + opt.tabId);
  }
  Array.from(document.getElementById("tabSelector").options).forEach(function (option_element) {
    if (ids.includes(option_element.id) == false) {
      option_element.remove();
    }
  });
}

async function updateStatus() {
  let state = (await chrome.storage.local.get("state")).state;
  document.getElementById("display_title").innerHTML = state.title;
  document.getElementById("display_chapter").innerHTML = state.chapter;

  let activeScanner = (await chrome.storage.local.get("activeScanner")).activeScanner;
  if (activeScanner == 0) {
    document.getElementById("status").innerHTML = chrome.i18n.getMessage("notRunning");
    document.getElementById("status").style = "color: red";
    document.getElementById("pauseWarning").hidden = true;
  } else if (state.paused == true) {
    document.getElementById("status").innerHTML = chrome.i18n.getMessage("paused");
    document.getElementById("status").style = "color: rgb(235, 141, 18)";
    document.getElementById("pauseWarning").hidden = true;
  } else {
    document.getElementById("status").innerHTML = chrome.i18n.getMessage("runningOnTab") + ": " + activeScanner;
    document.getElementById("status").style = "color: green";
    document.getElementById("pauseWarning").hidden = true;
  }
}

async function loop() {
  updateTabs();
  updateStatus();
}

function localizeString(_, str) {
  let txt = str ? chrome.i18n.getMessage(str) : "";
  return txt;
}

document.addEventListener(
  "DOMContentLoaded",
  function () {
    for (let element of document.getElementsByClassName("localized")) {
      var messageRegex = /__MSG_(\w+)__/g;
      element.innerHTML = element.innerHTML.replace(messageRegex, localizeString);
    }
  },
  false
);


async function onOpen() {
  let activeScanner = (await chrome.storage.local.get("activeScanner")).activeScanner;
  if (activeScanner.toString() != "0") {
    document.getElementById("tabSelector").value = activeScanner;
  }
  document.getElementById("selectedPreset").value = (await chrome.storage.local.get("usedPreset")).usedPreset;
}
document.getElementById("selectedPreset").addEventListener("change",()=>{
  console.log("Selected preset:",document.getElementById("selectedPreset").value)
  chrome.storage.local.set({ usedPreset:document.getElementById("selectedPreset").value });
  chrome.storage.local.set({ updateRequired: true });
})

setInterval(loop, 1000);
loop();
onOpen();
