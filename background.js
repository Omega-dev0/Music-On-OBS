const serverURL = "http://127.0.0.1:4011";
const serverURL2 = "http://127.0.0.1:4013";
var socket;

//IMPORTS

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
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

  chrome.storage.local.set({
    "extension-settings": {
      instance: {
        privateToken: extensionSettings == undefined ? "" : extensionSettings.instance.privateToken,
        serverURL: serverURL,
        serverURL2: serverURL2,
      },
      behaviour: {
        displayPause: false,
        // smartSwitch: false,
        detectPause: true,
      },
      integration: {
        defaultMessage: "Current song: [__LINK__]",
        pausedMessage: "The music is currently paused",
        errorMessage: "Unable to get current song name!",
      },
      overlay: {
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
      },
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

async function syncServer() {
  let extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];


  if(extensionState.stopped == true){
    chrome.action.setIcon({
      path: {
        16: "/images/default/default16.png",
        32: "/images/default/default32.png",
        48: "/images/default/default48.png",
        128: "/images/default/default128.png",
      },
    });
  }else if(extensionScannerState.paused == true) {
    chrome.action.setIcon({
      path: {
        16: "/images/paused/16x16.png",
        32: "/images/paused/32x32.png",
        48: "/images/paused/48x48.png",
        128: "/images/paused/128x128.png",
      },
    });
  }else{
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
  
  contactServer("sync-server", data);
  
}

//HANDLING LISTENERS BEING CLOSED
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  let nl = extensionState.scanners.filter((x) => {
    return tabId != x.id;
  });
  if (nl.length != extensionState.scanners.length) {
    chrome.storage.local.set({
      "extension-state": {
        stopped: extensionState.stopped,
        scanners: nl,
        selectedScanner: extensionState.selectedScanner,
      },
    });
  }
});

async function onLaunch() {
  console.log("Launch");
  chrome.storage.local.set({
    "extension-state": {
      stopped: true,
      scanners: [],
      selectedScanner: "none",
    },
  });
}

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
      let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
      scanners = extensionState.scanners;

      let index = scanners
        .map(function (e) {
          return e.id;
        })
        .indexOf(sender.tab.id);
      scanners[index] = {
        title: message.data.title,
        id: sender.tab.id,
        platform: message.data.platform,
      };

      chrome.storage.local.set({
        "extension-state": {
          stopped: extensionState.stopped,
          scanners: scanners,
          selectedScanner: extensionState.selectedScanner,
        },
      });
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

chrome.storage.onChanged.addListener(async (object, areaName) => {
  console.log("Change detected:", object);
  //syncServer()
});

chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"].newValue;
  }
  if (object["extension-scanner-state"] != undefined) {
    extensionScannerState = object["extension-scanner-state"].newValue;
  }
});
