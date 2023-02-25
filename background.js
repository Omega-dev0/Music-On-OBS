const serverURL = "http://127.0.0.1:4001";
var socket;

//SPOTIFY AUTH
const spotifySettings = {
  clientId: encodeURIComponent("d645ca3edc6e4394ab6b52d0f1bbd772"),
  responseType: encodeURIComponent("code"),
  redirectURI: encodeURIComponent("https://clecjadmjjoknaflecccgpjkojafeail.chromiumapp.org/"),
  scope: encodeURIComponent("user-read-currently-playing"),
  showDialog: encodeURIComponent("true"),
  state: "",
};

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

  chrome.storage.local.set({
    "extension-oauth": {
      spotify: {
        token: "",
        refreshToken: "",
        expiry: "",
        loggedIn: false,
      },
    },
  });
});

//SPOTIFY AUTH
function getSpotifyEndpoint() {
  spotifySettings.state = encodeURIComponent("meet" + Math.random().toString(36).substring(2, 15));
  let oauth2_url = `https://accounts.spotify.com/authorize
?client_id=${spotifySettings.clientId}
&response_type=${spotifySettings.responseType}
&redirect_uri=${spotifySettings.redirectURI}
&state=${spotifySettings.state}
&scope=${spotifySettings.scope}
&show_dialog=${spotifySettings.showDialog}
`;
  return oauth2_url;
}

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

  contactServer("sync-server", data);
}

async function onLaunch() {
  console.log("Launch");
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
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

      sendResponse(true);
    },
    "sync-server": async () => {
      syncServer();
      sendResponse(true);
    },
    "spotify-login": async () => {
      let oauth = (await chrome.storage.local.get("extension-oauth"))["extension-oauth"];
      if (oauth.spotify.loggedIn == true) {
        sendResponse({ status: false, message: "Already logged in" });
      }
      let url = getSpotifyEndpoint()
      console.log(url)
      chrome.identity.launchWebAuthFlow(
        {
          url: url,
          interactive: true,
        },
        function (redirect_url) {
          if (chrome.runtime.lastError) {
            sendResponse({ status: false, message: "Chrome runtime error",error:chrome.runtime.lastError});
          } else {
            if (redirect_url.includes("callback?error=access_denied")) {
              sendResponse({ status: false, message: "Access denied" });
            } else {
              let ACCESS_TOKEN = redirect_url.substring(redirect_url.indexOf("access_token=") + 13);
              ACCESS_TOKEN = ACCESS_TOKEN.substring(0, ACCESS_TOKEN.indexOf("&"));
              let state = redirect_url.substring(redirect_url.indexOf("state=") + 6);

              if (state === spotifySettings.state) {
                chrome.storage.local.set({
                  "extension-oauth": {
                    spotify: {
                      token: ACCESS_TOKEN,
                      refreshToken: "",
                      expiry: new Date(new Date().getTime() + 3600000),
                      loggedIn: true,
                    },
                  },
                });
                setTimeout(() => {
                  //REFRESH BEFORE THAT
                  chrome.storage.local.set({
                    "extension-oauth": {
                      spotify: {
                        token: "",
                        refreshToken: "",
                        expiry: "",
                        loggedIn: false,
                      },
                    },
                  });
                }, 3600000);
                sendResponse({ status: true });
              } else {
                sendResponse({ status: false, message: "State not valid" });
              }
            }
          }
        }
      );
    },
    test:async () => {
      setTimeout(() => {
        sendResponse("GG");
      }, 1500);
    },
  };
  let action = actions[message.key];
  if (!action) {
    console.error("A script called a message without a valid action !");
    console.log(message);
    return true;
  } else {
    action()
    return true;
  }
});

chrome.storage.onChanged.addListener(async (object, areaName) => {
  console.log("Change detected:", object);
});

onLaunch();
