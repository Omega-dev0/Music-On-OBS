const serverURL = "http://127.0.0.1:4001";
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
} catch (e) {
  console.error("SOCKET.IO DID NOT LOAD OR CONNECT!!!!!! EVERYTHING IS LOST (almost try to reload the extension and if the error persists send to the dev the error below and make sure to let them know it's PANIK time)");
  console.log(e);
}

//ADD SETTING
chrome.runtime.onInstalled.addListener(() => {
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

  chrome.storage.local.set({
    "extension-settings": {
      instance: {
        privateToken: "",
        serverURL: serverURL,
      },
      behaviour: {
        displayPause: false,
        smartSwitch: false,
        detectPause: true,
      },
      integration: {
        defaultMessage: "Current song: [__SONG__]",
        pausedMessage: "The music is currently paused",
        errorMessage: "Unable to get current song name!",
      },
      overlay: {
        primaryColor: "",
        secondaryColor: "",
        style: "",
        displayTitle:true,
        displaySubtitle:true,
        displayProgress:true,
        displayDurationCounter:false,
        displayProgressCounter:false,
        displayCover:true
      },
    },
  });
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

  let data = {
    extensionScannerState: extensionScannerState,
    extensionSettings: extensionSettings,
    extensionState: extensionState,
  };

  contactServer("sync-server", data);
  console.log("--> sync server")
}

//HANDLING LISTENERS BEING CLOSED
chrome.tabs.onRemoved.addListener(async (tabId,removeInfo)=>{
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  let nl = extensionState.scanners.filter((x)=>{return tabId != x.id})
  if(nl.length != extensionState.scanners.length){
    chrome.storage.local.set({
      "extension-state": {
        stopped: extensionState.stopped,
        scanners: nl,
        selectedScanner: extensionState.selectedScanner,
      },
    });
  }
})

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
      let extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
      let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
      let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];

      if (message.payload.token == "") {
        await contactServer("instance-create", {
          generateToken: true,
          scannerState: extensionScannerState,
          settings: extensionSettings,
          state: extensionState,
        });
        console.log(response);
      } else {
        await contactServer("instance-create", {
          generateToken: false,
          token: message.payload.token,
          scannerState: extensionScannerState,
          settings: extensionSettings,
          state: extensionState,
        });
      }
      syncServer();
      sendResponse(true);
    },
    "sync-server": async () => {
      syncServer();
      sendResponse(true);
    },
    "listener-register": async () => {
      let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
      console.log("Scanners", extensionState.scanners);
      scanners = extensionState.scanners;
      scanners.push({
        title: sender.tab.title,
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
      sendResponse({ tabId: sender.tab.id, url: sender.tab.url, title: sender.tab.title });
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

chrome.runtime.onStartup.addListener(function() {
  onLaunch();
})

