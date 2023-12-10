let extensionSettings;
let extensionOAUTH;
let extensionState;

function showContainer(id) {
  console.log(id)
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


async function checkLoginStatus() {
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  if (extensionSettings.instance.spotifyId != "" && extensionSettings.instance.spotifyAppToken != "") {
    document.getElementById("spotifyLogin").removeAttribute("customDisable")
  } else {
    document.getElementById("spotifyLogin").setAttribute("customDisable", true)
  }
}


function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function () {
    console.log('Async: Copying to clipboard was successful!');
  }, function (err) {
    console.error('Async: Could not copy text: ', err);
  });
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
      showContainer(div.children[1].getAttribute("data"));
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


  //Save button for spotify
  document.getElementById("save").addEventListener("click", async () => {
    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

    let instance = extensionSettings.instance
    instance.spotifyId = dv("spotifyId")
    instance.spotifyAppToken = dv("spotifyToken")

    chrome.storage.local.set({
      "extension-settings": {
        instance: instance,
        behaviour: extensionSettings.behaviour,
        integration: extensionSettings.integration,
        overlay: extensionSettings.overlay,
      },
    });
    alert("Id and secret saved!");
  });

  document.getElementById("spotifyLogin").addEventListener("click", async () => {
    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

    let instance = extensionSettings.instance
    if (instance.spotifyId == "" || instance.spotifyAppToken == "") {
      alert("You must set the ID and Secret first ! Find them in your app at https://developer.spotify.com/dashboard");
      return
    }

    let redirect_url = `chrome-extension://${chrome.runtime.id}/interface/spotifyAuth/index.html`
    window.open(`https://accounts.spotify.com/authorize?response_type=code&redirect_uri=${redirect_url}&client_id=${instance.spotifyId}&state=MOS&scope=user-read-currently-playing&show_dialog=true`, "_blank")

  });

  document.getElementById("spotifyId").addEventListener("change", checkLoginStatus)
  document.getElementById("spotifyToken").addEventListener("change", checkLoginStatus)

  document.getElementById("spotifyLogout").addEventListener("click", async () => {
    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    extensionSettings.instance.spotifyRefreshToken = ""
    chrome.storage.local.set({
      "extension-settings": extensionSettings
    })
    document.getElementById("spotifyStatus").innerHTML = "Status: Not logged in"
  });


  document.getElementById("createNewInstance").addEventListener("click", createNewInstance);


  //Integration commands
  document.getElementById("nightbotCommandCopy").addEventListener("click", async () => {
    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    let cmd = `$(eval const api = $(urlfetch ${extensionSettings.instance.serverURL2}/integration?token=${extensionSettings.instance.privateToken}&format=json); if(api.error || api.url == "undefined"){"${extensionSettings.integration.errorMessage}"}else{api.m}; )`
    fallbackCopyTextToClipboard(cmd)
  })

});
function translator() {
  let elements = document.querySelectorAll("[translated]");
  elements.forEach((element) => {
    try {
      let translation = chrome.i18n.getMessage(
        element.innerHTML
          .replaceAll(" ", "_")
          .replace(/[^\x00-\x7F]/g, "")
          .replaceAll(":", "")
          .replaceAll("]", "")
          .replaceAll("[", "")
          .replaceAll(")", "")
          .replaceAll("(", "")
      );
      console.log(element.innerHTML, translation)
      element.innerHTML = translation

      if (element.title != "") {
        element.title = chrome.i18n.getMessage(
          element.title
            .replaceAll(" ", "_")
            .replace(/[^\x00-\x7F]/g, "")
            .replaceAll(":", "")
            .replaceAll("]", "")
            .replaceAll("[", "")
            .replaceAll(")", "")
            .replaceAll("(", "")
        );
      }

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
      style: dv("styleSelection"),
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
  dsv("styleSelection", extensionSettings.overlay.style);
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

  dsv("spotifyId", extensionSettings.instance.spotifyId)
  dsv("spotifyToken", extensionSettings.instance.spotifyAppToken)

  if (extensionSettings.instance.spotifyRefreshToken != "") {
    document.getElementById("spotifyStatus").innerHTML = "Status: Logged in"
  }

  let redirect_url = `chrome-extension://${chrome.runtime.id}/interface/spotifyAuth/index.html`
  document.getElementById("spotifyRedirectURI").innerHTML = redirect_url
  checkLoginStatus()
}

function update() {
  console.log("update");
  dsv("instanceToken", extensionSettings.instance.privateToken);
  dsv("instanceLink", extensionSettings.instance.privateToken == "" ? "" : `${extensionSettings.instance.serverURL2}/overlay?token=${extensionSettings.instance.privateToken}`);

  dsv("detectPause", extensionSettings.behaviour.detectPause);
  dsv("displayPause", extensionSettings.behaviour.displayPause);
  dsv("styleSelection", extensionSettings.overlay.style);
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

  dsv("spotifyId", extensionSettings.instance.spotifyId)
  dsv("spotifyToken", extensionSettings.instance.spotifyAppToken)

  if (extensionSettings.instance.spotifyRefreshToken != "") {
    document.getElementById("spotifyStatus").innerHTML = "Status: Logged in"
  } else {
    document.getElementById("spotifyStatus").innerHTML = "Status: Not logged in"
  }

  let redirect_url = `chrome-extension://${chrome.runtime.id}/interface/spotifyAuth/index.html`
  document.getElementById("spotifyRedirectURI").innerHTML = redirect_url
  checkLoginStatus()
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
