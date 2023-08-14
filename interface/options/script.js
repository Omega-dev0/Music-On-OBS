let extensionSettings;
let extensionOAUTH;
let extensionState;

function showContainer(id) {
  for (let i = 0; i < document.getElementsByClassName("container").length; i++) {
    container = document.getElementsByClassName("container")[i];
    if (container.id != id) {
      container.style = "display: none;";
    } else {
      container.style = "display: flex;";
    }
  }
  id = id.toLowerCase() + "-button";
  for (let i = 0; i < document.getElementsByClassName("sidebar-element").length; i++) {
    container = document.getElementsByClassName("sidebar-element")[i];
    if (container.id != id) {
      container.classList.remove("sidebar-selected");
    } else {
      container.classList.add("sidebar-selected");
    }
  }
}

window.addEventListener("DOMContentLoaded", async function () {
  //Checkbox title clickable bind
  for (let i = 0; i < document.getElementsByClassName("checkbox-container").length; i++) {
    let div = document.getElementsByClassName("checkbox-container")[i];
    div.children[1].addEventListener("click", () => {
      div.children[0].checked = !div.children[0].checked;
      saveSettings();
    });
  }

  //Sidebar div clickable bind
  for (let i = 0; i < document.getElementsByClassName("sidebar-element").length; i++) {
    let div = document.getElementsByClassName("sidebar-element")[i];
    div.addEventListener("click", () => {
      showContainer(div.children[1].innerHTML);
    });
  }

  //Save trigger bind
  let elements = document.querySelectorAll("[saveTrigger]");
  for (let i = 0; i < elements.length; i++) {
    let div = elements[i];
    div.addEventListener("change", () => {
      saveSettings();
    });
  }

  document.getElementById("copyInstanceLink").addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("instanceLink").value);
    alert("Link copied, be careful!");
  });

  document.getElementById("createNewInstance").addEventListener("click", createNewInstance);

  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  document.getElementById("nightbotCommandCopy").addEventListener("click", () => {
    navigator.clipboard.writeText(`$(urlfetch ${extensionSettings.instance.serverURL2}/integration?token=${extensionSettings.instance.privateToken})`);
    alert("Command copied, be careful to not show it!");
  });
  document.getElementById("seCommandCopy").addEventListener("click", () => {
    navigator.clipboard.writeText(`$(urlfetch ${extensionSettings.instance.serverURL2}/integration?token=${extensionSettings.instance.privateToken}))`);
    alert("Command copied, Make sure in command > advanced settings > Hide command from public pages --> Enabled !");
  });

  loadSettings();
});
function translator() {
  let elements = document.querySelectorAll("[translated]");
  elements.forEach((element) => {
    try {
      element.innerHTML = chrome.i18n.getMessage(
        element.innerHTML
          .replaceAll(" ", "_")
          .replace(/[^\x00-\x7F]/g, "")
          .replaceAll(":", "")
          .replaceAll("]", "")
          .replaceAll("[", "")
          .replaceAll(")", "")
          .replaceAll("(", "")
      );
    } catch (error) {
      console.warn("[TRANSLATOR] - Failed to translate for:", element.innerHTML, error);
    }
  });
}
document.addEventListener("DOMContentLoaded", translator);

function dv(id) {
  let doc = document.getElementById(id);
  if (doc.type == "checkbox") {
    return doc.checked;
  } else {
    return doc.value;
  }
}
function dsv(id, value) {
  let doc = document.getElementById(id);
  if (doc.type == "checkbox") {
    doc.checked = value;
  } else {
    doc.value = value;
  }
}
//ADD SETTING
async function saveSettings() {
  let settings = {
    behaviour: {
      displayPause: dv("displayPause"),
      detectPause: dv("detectPause"),
      // smartSwitch: dv("smartSwitch"),
    },
    integration: {
      defaultMessage: dv("defaultMessage"),
      pausedMessage: dv("pausedMessage"),
      errorMessage: dv("errorMessage"),
    },
    overlay: {
      primaryColor: dv("overlayPrimaryColor"),
      secondaryColor: dv("overlaySecondaryColor"),
      titleColor: dv("overlayTitleColor"),
      subtitleColor: dv("overlaySubtitleColor"),
      style: "default",
      displayTitle: dv("overlayDisplayTitle"),
      displaySubtitle: dv("overlayDisplaySubtitle"),
      displayProgress: dv("overlayDisplayProgressBar"),
      displayCover: dv("overlayUseCover"),
      displayCoverOnContent: dv("overlayUserCoverAsContent"),
      progressBarColor: dv("overlayProgressBarColor"),
      progressBarBackgroundColor: dv("overlayProgressBarBackgroundColor"),
    },
  };
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  chrome.storage.local.set({
    "extension-settings": {
      instance: extensionSettings.instance,
      behaviour: settings.behaviour,
      integration: settings.integration,
      overlay: settings.overlay,
    },
  });

  chrome.runtime.sendMessage({ key: "sync-server" });
}

function createNewInstance() {
  console.log("Creating new instance");
  chrome.runtime.sendMessage({ key: "instance-create", payload: { token: "" } });
}

async function loadSettings() {
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  dsv("instanceToken", extensionSettings.instance.privateToken);
  dsv("instanceLink", extensionSettings.instance.privateToken == "" ? "" : `${extensionSettings.instance.serverURL2}/overlay?token=${extensionSettings.instance.privateToken}`);

  dsv("detectPause", extensionSettings.behaviour.detectPause);
  dsv("displayPause", extensionSettings.behaviour.displayPause);
  //dsv("smartSwitch", extensionSettings.behaviour.smartSwitch);

  dsv("defaultMessage", extensionSettings.integration.defaultMessage);
  dsv("pausedMessage", extensionSettings.integration.pausedMessage);
  dsv("errorMessage", extensionSettings.integration.errorMessage);

  dsv("overlayPrimaryColor", extensionSettings.overlay.primaryColor),
    dsv("overlaySecondaryColor", extensionSettings.overlay.secondaryColor),
    dsv("overlayTitleColor", extensionSettings.overlay.titleColor),
    dsv("overlaySubtitleColor", extensionSettings.overlay.subtitleColor),
    dsv("overlayDisplayTitle", extensionSettings.overlay.displayTitle),
    dsv("overlayDisplaySubtitle", extensionSettings.overlay.displaySubtitle),
    dsv("overlayDisplayProgressBar", extensionSettings.overlay.displayProgress),
    dsv("overlayUseCover", extensionSettings.overlay.displayCover),
    dsv("overlayUserCoverAsContent", extensionSettings.overlay.displayCoverOnContent),
    dsv("overlayProgressBarColor", extensionSettings.overlay.progressBarColor),
    dsv("overlayProgressBarBackgroundColor", extensionSettings.overlay.progressBarBackgroundColor);
}

function update() {
  console.log("update");
  dsv("instanceToken", extensionSettings.instance.privateToken);
  dsv("instanceLink", extensionSettings.instance.privateToken == "" ? "" : `${extensionSettings.instance.serverURL2}/overlay?token=${extensionSettings.instance.privateToken}`);

  dsv("detectPause", extensionSettings.behaviour.detectPause);
  dsv("displayPause", extensionSettings.behaviour.displayPause);
  //dsv("smartSwitch", extensionSettings.behaviour.smartSwitch);

  dsv("defaultMessage", extensionSettings.integration.defaultMessage);
  dsv("pausedMessage", extensionSettings.integration.pausedMessage);
  dsv("errorMessage", extensionSettings.integration.errorMessage);

  dsv("overlayPrimaryColor", extensionSettings.overlay.primaryColor),
    dsv("overlaySecondaryColor", extensionSettings.overlay.secondaryColor),
    dsv("overlayTitleColor", extensionSettings.overlay.titleColor),
    dsv("overlaySubtitleColor", extensionSettings.overlay.subtitleColor),
    dsv("overlayDisplayTitle", extensionSettings.overlay.displayTitle),
    dsv("overlayDisplaySubtitle", extensionSettings.overlay.displaySubtitle),
    dsv("overlayDisplayProgressBar", extensionSettings.overlay.displayProgress),
    dsv("overlayUseCover", extensionSettings.overlay.displayCover),
    dsv("overlayUserCoverAsContent", extensionSettings.overlay.displayCoverOnContent),
    dsv("overlayProgressBarColor", extensionSettings.overlay.progressBarColor),
    dsv("overlayProgressBarBackgroundColor", extensionSettings.overlay.progressBarBackgroundColor);
}

chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-settings"] != undefined) {
    extensionSettings = object["extension-settings"].newValue;
    update();
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"].newValue;
  }
});

//SPOTIFY OAUTH END
