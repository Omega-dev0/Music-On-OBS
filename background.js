//const serverURL = "http://127.0.0.1:6011";
//const serverURL2 = "http://127.0.0.1:6013";
var socket;

//IMPORTS
const serverURL = "http://129.151.87.197:6011";
const serverURL2 = "http://129.151.87.197:6013";

//ADD SETTING
chrome.runtime.onInstalled.addListener(async () => {
  chrome.storage.local.set({
    "extension-state": {
      stopped: true,
      scanners: [],
      selectedScanner: "",
    },
  });

  chrome.storage.local.set({
    "extension-scanner-state": {
      paused: false,
      title: "Default title",
      subtitle: "Defaut subtitle",
      currentTime: "",
      currentLength: "",
      url: "",
      cover: "",
    },
  });
  let spotifyState = (await chrome.storage.local.get("spotifyState"))["spotifyState"];
  chrome.storage.local.set({
    "spotifyState": {
      spotifyToken: spotifyState == undefined ? "" : spotifyState.spotifyToken,
      spotifyTokenExpiry: spotifyState == undefined ?  0 : spotifyState.spotifyTokenExpiry,
    },
  });
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

  chrome.storage.local.set({
    "extension-settings": {
      instance: {
        privateToken: extensionSettings == undefined ? "" : extensionSettings.instance.privateToken,
        serverURL: serverURL,
        serverURL2: serverURL2,
        spotifyId: extensionSettings == undefined ? "" : extensionSettings.instance.spotifyId,
        spotifyAppToken: extensionSettings == undefined ? "" : extensionSettings.instance.spotifyAppToken,
        spotifyRefreshToken: extensionSettings == undefined ? "" : extensionSettings.instance.spotifyRefreshToken,
      },
      behaviour: extensionSettings == undefined ? {
        displayPause: false,
        // smartSwitch: false,
        detectPause: true,
      } : extensionSettings.behaviour,
      integration: extensionSettings == undefined ? {
        defaultMessage: chrome.i18n.getMessage("defaultIntegrationMessage") || "Current song: [__LINK__]",
        pausedMessage: chrome.i18n.getMessage("pausedIntegrationMessage") || "The music is currently paused",
        errorMessage: chrome.i18n.getMessage("errorIntegrationMessage") || "Unable to get current song name!",
      } : extensionSettings.integration,
      overlay: extensionSettings == undefined ? {
        primaryColor: "#b94901",
        secondaryColor: "#0013ff",
        titleColor: "#FFFFFF",
        subtitleColor: "#DEDEDE",
        style: "default",
        displayTitle: true,
        displaySubtitle: true,
        displayProgress: true,
        displayCover: true,
        displayCoverOnContent: true,
        progressBarColor: "#334484",
        progressBarBackgroundColor: "#121111",
      } : extensionSettings.overlay,
    },
  });

  console.log("Default data installed");
});

function contactServer(channel, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(channel, payload, (response) => {
      resolve(response);
    });
  });
}



let snapshot = {}
async function syncServer() {
  let extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];


  if (extensionSettings.behaviour.detectPause == false) {
    extensionState.paused = false
    extensionScannerState.paused = extensionScannerState.paused == undefined ? undefined : extensionScannerState.paused
  }

  //ERROR WARNING
  for(key of Object.keys(extensionScannerState)){
    if(extensionScannerState[key] == undefined){
     console.warn(`Undefined data in the scanner data: ${key}`, extensionScannerState, extensionState, extensionSettings)
    }
  }

  if (extensionState.stopped == true) {
    chrome.action.setIcon({
      path: {
        16: "/images/default/default16.png",
        32: "/images/default/default32.png",
        48: "/images/default/default48.png",
        128: "/images/default/default128.png",
      },
    });
  } else if (extensionScannerState.paused == true) {
    chrome.action.setIcon({
      path: {
        16: "/images/paused/16x16.png",
        32: "/images/paused/32x32.png",
        48: "/images/paused/48x48.png",
        128: "/images/paused/128x128.png",
      },
    });
  } else {
    chrome.action.setIcon({
      path: {
        16: "/images/playing/16x16.png",
        32: "/images/playing/32x32.png",
        48: "/images/playing/48x48.png",
        128: "/images/playing/128x128.png",
      },
    });
  }

  let data = {
    extensionScannerState: extensionScannerState,
    extensionSettings: extensionSettings,
    extensionState: extensionState,
  };
  data.extensionState.scanners = []
  data.instance = {}
  if (JSON.stringify(data) == JSON.stringify(snapshot)) {
    return
  }

  contactServer("sync-server", data).then((res) => {
    snapshot = data
  })
}

//HANDLE NON EXISTING TABS


function getPlatformFromURL(url) {
  let platforms = {
    "www.youtube.com": "youtube",
    "open.spotify.com": "spotify",
    "soundcloud.com": "soundcloud",
    "music.youtube.com": "youtube music",
    "epidemicsound.com": "epidemic sound",
    "www.deezer.com": "deezer",
    "play.pretzel.rocks": "pretzel",
    "music.yandex.ru": "yandex"
  }

  return platforms[new URL(url).host]
}


async function onLaunch() {
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  console.log("Launch");
  chrome.storage.local.set({
    "extension-state": {
      stopped: true,
      scanners: extensionState.scanners,
      selectedScanner: "none",
    },
  });

  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  console.log(extensionSettings)
}

//HANDLING LISTENERS BEING CLOSED
async function updateAvailableScanners() {
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  //CLEARING OUT OUTDATED TABS
  let nl = [];
  for (let scanner of extensionState.scanners) {
    try {
      let tab = await chrome.tabs.get(scanner.id);
      if (typeof tab != "undefined") {
        nl.push(scanner);
      }
    } catch (e) {
      //NO TAB EXISTS
    }
  }

  //ADDING NEW TABS (backup)
  let matchingTabs = await chrome.tabs.query({
    url: ["https://www.youtube.com/*", "https://open.spotify.com/*", "https://*.soundcloud.com/*", "https://music.youtube.com/*", "https://*.epidemicsound.com/*", "https://www.deezer.com/*", "https://play.pretzel.rocks/*"],
  });

  for (tab of matchingTabs) {
    if (
      nl.filter((scanner) => {
        return scanner.id == tab.id;
      }).length == 0
    ) {
      nl.push({
        title: tab.title,
        id: tab.id,
        platform: getPlatformFromURL(tab.url),
      })
    } else {
      let index = nl
        .map(function (e) {
          return e.id;
        })
        .indexOf(tab.id);

      if (index >= 0) {
        nl[index] = {
          title: tab.title,
          id: tab.id,
          platform: getPlatformFromURL(tab.url),
        };
      }
    }
  }

  chrome.storage.local.set({
    "extension-state": {
      stopped: extensionState.stopped,
      scanners: nl,
      selectedScanner: extensionState.selectedScanner,
    },
  });
}
chrome.tabs.onUpdated.addListener(updateAvailableScanners)
chrome.tabs.onRemoved.addListener(updateAvailableScanners)


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let actions = {
    "instance-create": async () => {
      await contactServer("register", {
        generateNewToken: true,
        token: message.payload.token,
      });
      syncServer();
      sendResponse(true);
    },
    "sync-server": async () => {
      syncServer();
      sendResponse(true);
    },
    "listener-register": async () => {
      let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
      let scanners = extensionState.scanners;
      console.log("Registering listener", message.data);
      scanners = extensionState.scanners.filter((x) => {
        return x.id != sender.tab.id;
      });
      scanners.push({
        title: message.data.title,
        id: sender.tab.id,
        platform: message.data.platform,
      });
      chrome.storage.local.set({
        "extension-state": {
          stopped: extensionState.stopped,
          scanners: scanners,
          selectedScanner: extensionState.selectedScanner,
        },
      });
      sendResponse({ tabId: sender.tab.id, url: sender.tab.url, title: message.data.title });
    },
    "listener-update": async () => {
      sendResponse(true)
    },
  };
  let action = actions[message.key];
  if (!action) {
    console.error("A script called a message without a valid action !");
    console.log(message);
    return true;
  } else {
    action();
    return true;
  }
});



chrome.runtime.onConnect.addListener(function (port) {
  console.log(`New port connected: ${port}`);
  if (port.name.split("-")[0] != "listener") {
    console.log(`Port rejected: ${port}`);
    return;
  }
  port.onMessage.addListener(function (message) {
    let action = connectActions[message.key];
    if (!action) {
      console.error("A script called a message without a valid action !");
      console.log(message);
    } else {
      action(port.name.split("-")[1], message);
    }
  });
});

chrome.storage.onChanged.addListener(async (object, areaName) => {
  //console.log("Change detected:", object);
  //syncServer()
});

chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"].newValue;
    console.log("State changed", extensionState)
  }
  if (object["extension-scanner-state"] != undefined) {
    extensionScannerState = object["extension-scanner-state"].newValue;
  }
});

chrome.runtime.onStartup.addListener(onLaunch);


try {
  importScripts("socket.io.js");

  socket = io(serverURL, {
    jsonp: false,
  });

  socket.on("connect", () => {
    console.log(`Connected to ${serverURL}, socket id: ${socket.id}`);
  });

  socket.on("registerResponse", async (data) => {
    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    extensionSettings.instance.privateToken = data.token;
    chrome.storage.local.set({
      "extension-settings": extensionSettings,
    });

    console.log("New token received!");
  });
} catch (e) {
  console.error("SOCKET.IO DID NOT LOAD OR CONNECT!!!!!! EVERYTHING IS LOST (almost try to reload the extension and if the error persists send to the dev the error below and make sure to let them know it's PANIK time)");
  console.log(e);
}

try {
  importScripts("spotify-api.js");
}catch(e){
  console.error("Importing the spotify api module failed")
  console.log(e)
}

console.log("Hey I'm a background worker");
