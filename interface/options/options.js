debounce = {
  load: false,
  save: false,
  create: false,
};


const messages = {
  contacting: chrome.i18n.getMessage("OPTIONScontactingServer") || "Contacting server...",
  saved: chrome.i18n.getMessage("OPTIONSsaved") || "Settings saved !",
  notFound: chrome.i18n.getMessage("OPTIONSnotFound") || "Instance not found",
  savedFailed: chrome.i18n.getMessage("OPTIONSsavedFailed") || "Save failed",
  settingsLoaded: chrome.i18n.getMessage("OPTIONSsettingsLoaded") || "Settings Loaded !",
  requestFailed: chrome.i18n.getMessage("OPTIONSrequestFailed") || "Request Failed !",
  created: chrome.i18n.getMessage("OPTIONScreated") || "Instance created",
  creationFailed: chrome.i18n.getMessage("OPTIONScreationFailed") || "Creation failed !"
}

const manifest = chrome.runtime.getManifest();

function contactServer(method, endpoint, data, token, format) {
  return new Promise(async function (resolve, reject) {
    let persistent = (await chrome.storage.local.get("persistent")).persistent;

    let server_url = persistent ? persistent.serverLink : (await chrome.storage.local.get("server_url")).server_url;

    let Rdata = {
      method: method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    if (method != "GET") {
      Rdata.body = JSON.stringify(data);
      Rdata.body.token = token
    }
    if (method == "GET") {
      str = `?token=${token}&format=${format}`;
    } else {
      str = "";
    }
    fetch(server_url + "/" + endpoint + str, Rdata)
      .then(async (rawResponse) => {
        if (rawResponse.status == 200) {
          resolve(await rawResponse.json());
        } else {
          reject(rawResponse.status);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
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

async function getSettings() {
  return new Promise(async (resolve,reject)=>{  
  let persistent = (await chrome.storage.local.get("persistent")).persistent;

  resolve({
    token: persistent.token,
    serverLink: persistent.serverLink,
    youtube: {
      detectPause: document.getElementById("YTpauseDetection").checked,
      displayPause: document.getElementById("YTdisplayPause").checked,
      pausedText: document.getElementById("YTpauseText").value,

      displayTitle: document.getElementById("YTdisplayTitle").checked,
      displayChapter: document.getElementById("YTdisplayChapter").checked,
      themeId: "default"
    },
  })
      
})
}

async function save() {
  let persistent = (await chrome.storage.local.get("persistent")).persistent;
  if (debounce.save == true || persistent.token == undefined || persistent.token == "") {
    return;
  }
  debounce.save = true;
  const settings = await getSettings();

  document.getElementById("save").innerHTML = messages.contacting;
  chrome.storage.local.set({ settings: settings });
  contactServer("POST", "update", { type: "settings", config: settings }, persistent.token)
    .then(async (data) => {
      document.getElementById("save").innerHTML = messages.saved;
      console.log(data);

      let persistent = (await chrome.storage.local.get("persistent")).persistent 

      if(data.config.token != persistent.token || data.config.serverLink != persistent.serverLink){
        chrome.storage.local.set({
          persistent:{
            token:data.config.token,
            serverLink:data.config.serverLink
          }
        })

        document.getElementById("token").value = data.config.token;
        document.getElementById("link").value = data.config.serverLink + `/get?token=${data.config.token}`;
      }
      debounce.save = false;
    })
    .catch((status) => {
      debounce.save = false;
      console.log(status);
      if (status == 404) {
        document.getElementById("load").innerHTML = messages.notFound;
        debounce.load = false;
      } else {
        document.getElementById("save").innerHTML = messages.savedFailed;
      }
    });
}

async function load(data) {
  let persistent = (await chrome.storage.local.get("persistent")).persistent;

  if (persistent && persistent.token) {
    document.getElementById("token").value = persistent.token;
    document.getElementById("link").value = persistent.serverLink + `/get?token=${persistent.token}`;
  }

  document.getElementById("YTpauseDetection").checked = data.youtube.detectPause;
  document.getElementById("YTdisplayPause").checked = data.youtube.displayPause;
  document.getElementById("YTdisplayTitle").checked = data.youtube.displayTitle;
  document.getElementById("YTdisplayChapter").checked = data.youtube.displayChapter;
  document.getElementById("YTpauseText").value = data.youtube.pausedText;
}

function loadFromInstance() {
  if (debounce.load == true) {
    return;
  }
  debounce.load = true;
  let token = document.getElementById("newToken").value;
  if (!token || token == "") {
    return;
  }

  document.getElementById("load").innerHTML = messages.contacting;
  contactServer("GET", "get", {}, token, "cfg")
    .then((data) => {
      console.log(data);
      chrome.storage.local.set({
        persistent: {
          token: data.token,
          serverLink: data.serverLink,
        },
      });
      chrome.storage.local.set({
        settings: data,
      });
      load(data);
      document.getElementById("load").innerHTML = messages.settingsLoaded;
      debounce.load = false;
    })
    .catch((status) => {
      if (status == 404) {
        document.getElementById("load").innerHTML = messages.notFound;
        debounce.load = false;
      } else {
        document.getElementById("load").innerHTML = messages.requestFailed;
        debounce.load = false;
      }
    });
}

chrome.storage.local.get("settings", ({ settings }) => {
  console.log("Settings", settings)
  load(settings);
});

function create() {
  if (debounce.create == true) {
    return;
  }
  debounce.create = true;

  document.getElementById("create").innerHTML = messages.contacting;
  contactServer("POST", "create", { senderVersion: manifest.version, language: chrome.i18n.getUILanguage() }, "", "")
    .then(async (data) => {
      console.log(data);

      document.getElementById("token").value = data.config.token;
      document.getElementById("link").value = data.config.serverLink + `/get?token=${data.config.token}`;

      chrome.storage.local.set({
        persistent: {
          token: data.config.token,
          serverLink: data.config.serverLink,
        },
      });

      document.getElementById("create").innerHTML = messages.created;
      contactServer("POST", "update", { type: "settings", config: (await chrome.storage.local.get("settings")).settings }, data.config.token).then((data) => {
        console.log("Settings saved to new instance");
        debounce.create = false;
      })
      .catch(err=>{
        console.log("Failed to save settings to new instance", err)
        debounce.create = false;
      })
    })
    .catch((status) => {
      console.log(status)
      document.getElementById("create").innerHTML = messages.creationFailed;
      debounce.create = false;
    });
}

document.getElementById("load").addEventListener("click", loadFromInstance);
document.getElementById("save").addEventListener("click", save);
document.getElementById("create").addEventListener("click", create);
