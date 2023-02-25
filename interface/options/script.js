window.addEventListener("DOMContentLoaded", function () {
  function showContainer(id) {
    for (let i = 0; i < document.getElementsByClassName("container").length; i++) {
      container = document.getElementsByClassName("container")[i];
      if (container.id != id) {
        container.style = "display: none;";
      } else {
        container.style = "display: flex;";
      }
    }
  }

  //Checkbox title clickable bind
  for (let i = 0; i < document.getElementsByClassName("checkbox-container").length; i++) {
    let div = document.getElementsByClassName("checkbox-container")[i];
    div.children[1].addEventListener("click", () => {
      div.children[0].checked = !div.children[0].checked;
    });
  }

  //Sidebar div clickable bind
  for (let i = 0; i < document.getElementsByClassName("sidebar-element").length; i++) {
    let div = document.getElementsByClassName("sidebar-element")[i];
    div.addEventListener("click", () => {
      showContainer(div.children[0].innerHTML);
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

  //SPOTIFY OAUTH
  document.getElementById("spotifyAPI").addEventListener("click", () => {
    chrome.runtime.sendMessage({ key: "spotify-login" }, (res) => {
      if (res.status == false) {
        console.warn("SPOTIFY LOGIN ERROR", res);
      } else if (res.status == true) {
        document.getElementById("spotifyAPI").setAttribute("customDisable", "");
        document.getElementById("spotifyAPILogout").removeAttribute("customDisable");
      }
    });
  });
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
      smartSwitch: dv("smartSwitch"),
    },
    integration: {
      defaultMessage: dv("defaultMessage"),
      pausedMessage: dv("pausedMessage"),
      errorMessage: dv("errorMessage"),
    },
    overlay: {
      primaryColor: "",
      secondaryColor: "",
      style: "",
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

async function loadSettings() {
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  let extensionOAUTH = (await chrome.storage.local.get("extension-oauth"))["extension-oauth"];

  dsv("instanceToken", extensionSettings.instance.privateToken);
  dsv("instanceLink", extensionSettings.instance.publicToken);

  dsv("displayPause", extensionSettings.behaviour.displayPause);
  dsv("smartSwitch", extensionSettings.behaviour.smartSwitch);

  dsv("displayPause", extensionSettings.behaviour.displayPause);
  dsv("smartSwitch", extensionSettings.behaviour.smartSwitch);

  dsv("defaultMessage", extensionSettings.integration.defaultMessage);
  dsv("pausedMessage", extensionSettings.integration.pausedMessage);
  dsv("errorMessage", extensionSettings.integration.errorMessage);

  if (extensionOAUTH.spotify.loggedIn == true) {
    document.getElementById("spotifyAPI").setAttribute("customDisable", "");
    document.getElementById("spotifyAPILogout").removeAttribute("customDisable");
  } else {
    document.getElementById("spotifyAPILogout").setAttribute("customDisable", "");
    document.getElementById("spotifyAPI").removeAttribute("customDisable");
  }
  //TODO ADD OVERLAY
}

//SPOTIFY OAUTH END
loadSettings();
