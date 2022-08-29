const manifest = chrome.runtime.getManifest();

const domains = ["youtube.com", "open.spotify.com", "soundcloud.com", "play.pretzel.rocks", "music.youtube.com","epidemicsound.com"];

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed");
  let defaultPreset = {
    spacing: 35,
    containerBackgroundColor: {
      R: 0,
      G: 0,
      B: 0,
      A: "0",
    },
    containerPadding: "0",
    containerBorderRadius: "0",
    titleBackgroundColor: {
      R: 0,
      G: 0,
      B: 0,
      A: "0.7",
    },
    titlePadding: "10",
    titleBorderRadius: "15",
    titleColor: {
      R: 255,
      G: 255,
      B: 255,
      A: "1",
    },
    titleSize: "60",
    titleFont: "Arial, Helvetica, sans-serif",
    subtitleBackgroundColor: {
      R: 0,
      G: 0,
      B: 0,
      A: "0.7",
    },
    subtitlePadding: "10",
    subtitleBorderRadius: "15",
    subtitleColor: {
      R: 255,
      G: 255,
      B: 255,
      A: "1",
    },
    subtitleSize: "40",
    subtitleFont: "Arial, Helvetica, sans-serif",
  };
  let scanners = (await chrome.storage.local.get("scanners")).scanners;
  if (!scanners) {
    chrome.storage.local.set({ scanners: [] });
  }
  let activeScanner = (await chrome.storage.local.get("activeScanner")).activeScanner;
  if (!activeScanner) {
    chrome.storage.local.set({ activeScanner: "0" });
  }

  const server_url = "http://129.151.84.152:3000";

  chrome.storage.local.set({ server_url: server_url });

  if (!(await chrome.storage.local.get("persistent")).persistent) {
    chrome.storage.local.set({
      persistent: {
        serverLink: server_url,
        token: "",
      },
    });
  } else {
    per = (await chrome.storage.local.get("persistent")).persistent;
    chrome.storage.local.set({
      persistent: {
        serverLink: server_url,
        token: per.token,
      },
    });
  }
  if (!(await chrome.storage.local.get("state")).state) {
    chrome.storage.local.set({
      state: {
        title: "",
        chapter: "",
        paused: false,
        url: "",

        source: "",
      },
    });
  }
  settings = (await chrome.storage.local.get("settings")).settings;
  if (!settings) {
    chrome.storage.local.set({
      settings: {
        token: "",
        serverLink: server_url,
        youtube: {
          detectPause: true,
          displayPause: false,
          pausedText: "The music is currently paused",
          displayTitle: true,
          displayChapter: true,
          smartTabSwitch: false,
        },
        spotify: {
          detectPause: true,
          displayPause: false,
          pausedText: "The music is currently paused",
          displayTitle: true,
          displayChapter: true,
        },
        soundcloud: {
          detectPause: true,
          displayPause: false,
          pausedText: "The music is currently paused",
          displayTitle: true,
          displayChapter: true,
        },
        pretzel: {
          detectPause: true,
          displayPause: false,
          pausedText: "The music is currently paused",
          displayTitle: true,
          displayChapter: true,
        },
        ytmusic: {
          detectPause: true,
          displayPause: false,
          pausedText: "The music is currently paused",
          displayTitle: true,
          displayChapter: true,
        },
        epidemic: {
          detectPause: true,
          displayPause: false,
          pausedText: "The music is currently paused",
          displayTitle: true,
          displayChapter: true,
        },
      },
    });
  } else {
    chrome.storage.local.set({
      settings: {
        token: settings.token,
        serverLink: server_url,
        youtube: settings.youtube
          ? settings.youtube
          : {
              detectPause: true,
              displayPause: false,
              pausedText: "The music is currently paused",
              displayTitle: true,
              displayChapter: true,
              smartTabSwitch: false,
            },
        spotify: settings.spotify
          ? settings.spotify
          : {
              detectPause: true,
              displayPause: false,
              pausedText: "The music is currently paused",
              displayTitle: true,
              displayChapter: true,
            },
        soundcloud: settings.soundcloud
          ? settings.soundcloud
          : {
              detectPause: true,
              displayPause: false,
              pausedText: "The music is currently paused",
              displayTitle: true,
              displayChapter: true,
            },
        pretzel: settings.pretzel
          ? settings.pretzel
          : {
              detectPause: true,
              displayPause: false,
              pausedText: "The music is currently paused",
              displayTitle: true,
              displayChapter: true,
            },
        ytmusic: settings.ytmusic
          ? settings.ytmusic
          : {
              detectPause: true,
              displayPause: false,
              pausedText: "The music is currently paused",
              displayTitle: true,
              displayChapter: true,
            },
            epidemic: settings.epidemic
              ? settings.epidemic
              : {
                  detectPause: true,
                  displayPause: false,
                  pausedText: "The music is currently paused",
                  displayTitle: true,
                  displayChapter: true,
                },
      },
    });
  }

  presets = (await chrome.storage.local.get("presets")).presets;
  if (!presets) {
    chrome.storage.local.set({
      presets: {
        default: defaultPreset,
        preset1: defaultPreset,
        preset2: defaultPreset,
        preset3: defaultPreset,
        preset4: defaultPreset,
        preset5: defaultPreset,
        preset6: defaultPreset,
        preset7: defaultPreset,
        preset8: defaultPreset,
        preset9: defaultPreset,
        preset10: defaultPreset,
        platformDefined: {},
      },
    });
  }

  chrome.storage.local.set({ usedPreset: "preset1" });
});

//Sending tabid to scanners

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  console.log("Tab closed:", tabId);
  let scanners = (await chrome.storage.local.get("scanners")).scanners;
  filteredArray = scanners.filter(function (e) {
    return e.tabId !== tabId;
  });
  chrome.storage.local.set({ scanners: filteredArray });
});

function update(data) {
  return new Promise(async function (resolve, reject) {
    updating = true;
    chrome.storage.local.set({
      state: {
        title: data.title,
        chapter: data.chapter,
        paused: data.paused,
        url: data.url,

        source: data.source,
      },
    });
    console.log("State changed");

    let persistent = (await chrome.storage.local.get("persistent")).persistent;
    let server_url = persistent ? persistent.serverLink : (await chrome.storage.local.get("server_url")).server_url;

    let Rdata = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    data.token = persistent.token;
    //usedPreset
    let usedPreset = (await chrome.storage.local.get("usedPreset")).usedPreset;
    data.usedPreset = usedPreset;
    Rdata.body = JSON.stringify(data);

    fetch(server_url + "/update", Rdata)
      .then(async (rawResponse) => {
        if (rawResponse.status == 200) {
          let json = await rawResponse.json();
          updating = false;
          resolve(json);
        } else {
          updating = false;
          console.log("ERROR", rawResponse);
          reject(rawResponse.status);
        }
      })
      .catch((err) => {
        updating = false;
        console.log("ERROR", err);
        reject(err);
      });
  });
}

async function processMsg(msg, sender) {
  if (msg.text.split("__JSON__")[0] == "TABID_REQUEST") {
    console.log("TAB ID REQUEST");
    let scanners = (await chrome.storage.local.get("scanners")).scanners;
    scanners.push({ tabId: sender.tab.id, url: sender.tab.url, title: sender.tab.title });
    chrome.storage.local.set({ scanners: scanners });
    return { tab: sender.tab };
  } else if (msg.text.split("__JSON__")[0] == "SERVER_UPDATE") {
    data = JSON.parse(msg.text.split("__JSON__")[1]);
    update(data)
      .then((newdata) => {
        console.log("Updated data", newdata);
        json = {
          status: true,
          data: newdata,
          tabId: sender.tab.id,
        };
        return { done: true, data: newdata };
      })

      .catch((status) => {
        json = {
          status: false,
          data: status,
          tabId: sender.tab ? sender.tab.id : false,
        };

        return { done: false, data: status };
      });
  }
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log("New message:", msg.text);
  processMsg(msg, sender).then(sendResponse);
  return true; // keep the messaging channel open for sendResponse
});

async function updateTabs() {
  new_scanners = [];
  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      tab = tabs[i];
      if (tab && tab.url) {
        let domain = new URL(tab.url);
        domain = domain.hostname.replace("www.", "");
        if (domains.includes(domain)) {
          //console.log(tab.title);
          title = tab.title ? tab.title.replace(/^\(\d+\)\ /, "") : `Tab ${tab.id}`;
          new_scanners.push({ tabId: tab.id, url: tab.url, title: title });
        }
      }
    }
    chrome.storage.local.set({ scanners: new_scanners });

    //chapter.storage.local.get
  });
  //console.log("Scanners:", new_scanners)
}

lastPausedState = "";
lastActiveScanner = 0;

async function loop() {
  let state = (await chrome.storage.local.get("state")).state;
  let activeScanner = (await chrome.storage.local.get("activeScanner")).activeScanner;

  if (state.paused != lastPausedState || lastActiveScanner != activeScanner) {
    if (activeScanner == 0) {
      chrome.action.setIcon({
        path: {
          16: "/images/stopped/stopped16.png",
          32: "/images/stopped/stopped32.png",
          48: "/images/stopped/stopped48.png",
          128: "/images/stopped/stopped128.png",
        },
      });
    } else if (state.paused == true) {
      chrome.action.setIcon({
        path: {
          16: "/images/paused/paused16.png",
          32: "/images/paused/paused32.png",
          48: "/images/paused/paused48.png",
          128: "/images/paused/paused128.png",
        },
      });
    } else {
      chrome.action.setIcon({
        path: {
          16: "/images/playing/playing16.png",
          32: "/images/playing/playing32.png",
          48: "/images/playing/playing48.png",
          128: "/images/playing/playing128.png",
        },
      });
    }
    lastActiveScanner = activeScanner;
    lastPausedState = state.paused;
  }

  updateTabs();
}

chrome.runtime.onStartup.addListener(async () => {
  console.log("Startup");
  chrome.storage.local.set({ activeScanner: "0" });
});
setInterval(loop, 1000);
