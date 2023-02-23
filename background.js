const serverURL = "http://127.0.0.1:4001";
var socket
try {
  importScripts("socket.io.js");

  socket = io(serverURL, {
    jsonp: false,
  });

  socket.on("connect", () => {
    console.log(socket.id);
  });
} catch (e) {
  console.error("SOCKET.IO DID NOT LOAD OR CONNECT!!!!!! EVERYTHING IS LOST (almost try to reload the extension and if the error persists send to the dev the error below and make sure to let them know it's PANIK time)");
  console.log(e);
}

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
    },
  });

  chrome.storage.local.set({
    "extension-settings": {
      instance: {
        privateToken: "",
        publicToken: "",
        serverURL: serverURL,
      },
      behaviour: {
        displayPause: false,
        smartSwitch: false,
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
    scannerState: extensionScannerState,
    settings: extensionSettings,
    state: extensionState,
  };

  contactServer("sync-server",data)
}

async function onLaunch() {
  console.log("Launch");
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
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

      return true;
    },
    "sync-server": () => {
      syncServer();
      return true;
    },
  };
  let action = actions[message.key];
  if (!action) {
    console.error("A script called a message without a valid action !");
    console.log(message);
    return true;
  } else {
    return action();
  }
});


chrome.storage.onChanged.addListener(async (object, areaName) => {
  console.log("Change detected:",object)
});

onLaunch();
