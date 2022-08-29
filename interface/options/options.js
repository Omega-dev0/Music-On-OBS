debounce = {
  load: false,
  save: false,
  create: false,
};



//Customization personalization:
//-Espace titre/chapitre
//-Couleur text
//-Couleur background

const messages = {
  contacting: chrome.i18n.getMessage("OPTIONScontactingServer"),
  saved: chrome.i18n.getMessage("OPTIONSsaved"),
  notFound: chrome.i18n.getMessage("OPTIONSnotFound"),
  savedFailed: chrome.i18n.getMessage("OPTIONSsavedFailed"),
  settingsLoaded: chrome.i18n.getMessage("OPTIONSsettingsLoaded"),
  requestFailed: chrome.i18n.getMessage("OPTIONSrequestFailed"),
  created: chrome.i18n.getMessage("OPTIONScreated"),
  creationFailed: chrome.i18n.getMessage("OPTIONScreationFailed"),
};

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
      Rdata.body.token = token;
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
    for (let element of document.getElementsByClassName("button")) {
      var messageRegex = /__MSG_(\w+)__/g;
      element.innerHTML = element.innerHTML.replace(messageRegex, localizeString);
    }
    for (let element of document.getElementsByClassName("collapsible")) {
      var messageRegex = /__MSG_(\w+)__/g;
      element.innerHTML = element.innerHTML.replace(messageRegex, localizeString);
    }
  },
  false
);

async function getSettings() {
  return new Promise(async (resolve, reject) => {
    let persistent = (await chrome.storage.local.get("persistent")).persistent;

    resolve({
      token: persistent.token,
      serverLink: persistent.serverLink,
      theme: "default",
      youtube: {
        detectPause: document.getElementById("YTpauseDetection").checked,
        displayPause: document.getElementById("YTdisplayPause").checked,
        pausedText: document.getElementById("YTpauseText").value,
        displayTitle: document.getElementById("YTdisplayTitle").checked,
        displayChapter: document.getElementById("YTdisplayChapter").checked,
        smartTabSwitch: document.getElementById("smartTabSwitch").checked,
      },
      spotify: {
        detectPause: document.getElementById("SPpauseDetection").checked,
        displayPause: document.getElementById("SPdisplayPause").checked,
        pausedText: document.getElementById("SPpauseText").value,

        displayTitle: document.getElementById("SPdisplayTitle").checked,
        displayChapter: document.getElementById("SPdisplayChapter").checked,
      },
      soundcloud: {
        detectPause: document.getElementById("SCpauseDetection").checked,
        displayPause: document.getElementById("SCdisplayPause").checked,
        pausedText: document.getElementById("SCpauseText").value,

        displayTitle: document.getElementById("SCdisplayTitle").checked,
        displayChapter: document.getElementById("SCdisplayChapter").checked,
      },
      pretzel: {
        detectPause: document.getElementById("PZpauseDetection").checked,
        displayPause: document.getElementById("PZdisplayPause").checked,
        pausedText: document.getElementById("PZpauseText").value,

        displayTitle: document.getElementById("PZdisplayTitle").checked,
        displayChapter: document.getElementById("PZdisplayChapter").checked,
      },
      ytmusic: {
        detectPause: document.getElementById("YTMpauseDetection").checked,
        displayPause: document.getElementById("YTMdisplayPause").checked,
        pausedText: document.getElementById("YTMpauseText").value,

        displayTitle: document.getElementById("YTMdisplayTitle").checked,
        displayChapter: document.getElementById("YTMdisplayChapter").checked,
      },
    });
  });
}

function makeCommand() {
  let command = `$(eval 
    const em = "${document.getElementById("nightbotErrorMessage").value}";
    const m = "${document.getElementById("nightbotMessage").value}";
    const api = $(urlfetch json http://129.151.84.152:3000/get?token=${
      document.getElementById("token").value
    }&format=json); if(api.error || api.url == "undefined"){em}else{if(api.paused == false){\`\${(api.url == "") ? "" : m} \${(api.url == "") ? "${
    document.getElementById("nightbotStoppedMessage").value
  }" : api.url}\`}else{api.config[api.platform.toLowerCase()].pausedText || api.config["youtube"].pausedText}};)`;

  document.getElementById("nightbotCommand").value = command;
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

      let persistent = (await chrome.storage.local.get("persistent")).persistent;

      if (data.config.token != persistent.token || data.config.serverLink != persistent.serverLink) {
        chrome.storage.local.set({
          persistent: {
            token: data.config.token,
            serverLink: data.config.serverLink,
          },
        });

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
  document.getElementById("smartTabSwitch").checked = data.youtube.smartTabSwitch || false
  document.getElementById("YTpauseDetection").checked = data.youtube.detectPause;
  document.getElementById("YTdisplayPause").checked = data.youtube.displayPause;
  document.getElementById("YTdisplayTitle").checked = data.youtube.displayTitle;
  document.getElementById("YTdisplayChapter").checked = data.youtube.displayChapter;
  document.getElementById("YTpauseText").value = data.youtube.pausedText;

  document.getElementById("SPpauseDetection").checked = data.spotify.detectPause;
  document.getElementById("SPdisplayPause").checked = data.spotify.displayPause;
  document.getElementById("SPdisplayTitle").checked = data.spotify.displayTitle;
  document.getElementById("SPdisplayChapter").checked = data.spotify.displayChapter;
  document.getElementById("SPpauseText").value = data.spotify.pausedText;

  document.getElementById("SCpauseDetection").checked = data.soundcloud.detectPause;
  document.getElementById("SCdisplayPause").checked = data.soundcloud.displayPause;
  document.getElementById("SCdisplayTitle").checked = data.soundcloud.displayTitle;
  document.getElementById("SCdisplayChapter").checked = data.soundcloud.displayChapter;
  document.getElementById("SCpauseText").value = data.soundcloud.pausedText;

  document.getElementById("PZpauseDetection").checked = data.pretzel.detectPause;
  document.getElementById("PZdisplayPause").checked = data.pretzel.displayPause;
  document.getElementById("PZdisplayTitle").checked = data.pretzel.displayTitle;
  document.getElementById("PZdisplayChapter").checked = data.pretzel.displayChapter;
  document.getElementById("PZpauseText").value = data.pretzel.pausedText;

  document.getElementById("YTMpauseDetection").checked = data.ytmusic.detectPause;
  document.getElementById("YTMdisplayPause").checked = data.ytmusic.displayPause;
  document.getElementById("YTMdisplayTitle").checked = data.ytmusic.displayTitle;
  document.getElementById("YTMdisplayChapter").checked = data.ytmusic.displayChapter;
  document.getElementById("YTMpauseText").value = data.ytmusic.pausedText;

  document.getElementById("EPIpauseDetection").checked = data.epidemic.detectPause;
  document.getElementById("EPIdisplayPause").checked = data.epidemic.displayPause;
  document.getElementById("EPIdisplayTitle").checked = data.epidemic.displayTitle;
  document.getElementById("EPIdisplayChapter").checked = data.epidemic.displayChapter;
  document.getElementById("EPIpauseText").value = data.ytmusic.pausedText;
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
  console.log("Settings", settings);
  console.log()
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
      contactServer("POST", "update", { type: "settings", config: (await chrome.storage.local.get("settings")).settings }, data.config.token)
        .then((data) => {
          console.log("Settings saved to new instance");
          chrome.storage.local.set({ updateRequired: true });
          debounce.create = false;
        })
        .catch((err) => {
          console.log("Failed to save settings to new instance", err);
          debounce.create = false;
        });
    })
    .catch((status) => {
      console.log(status);
      document.getElementById("create").innerHTML = messages.creationFailed;
      debounce.create = false;
    });
}

document.getElementById("load").addEventListener("click", loadFromInstance);
document.getElementById("create").addEventListener("click", create);

document.getElementById("save").addEventListener("click", save);

document.getElementById("nightbotMessage").addEventListener("input", makeCommand);
document.getElementById("nightbotErrorMessage").addEventListener("input", makeCommand);
document.getElementById("nightbotStoppedMessage").addEventListener("input", makeCommand);
document.getElementById("token").addEventListener("changed", makeCommand);

function onLoad() {
  var coll = document.getElementsByClassName("collapsible");
  var i;

  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  }
}

function hexToRGBA(colorEID,transparencyEID){
  color = document.getElementById(colorEID).value
  transparency = document.getElementById(transparencyEID).value
  const r = parseInt(color.substr(1,2), 16)
  const g = parseInt(color.substr(3,2), 16)
  const b = parseInt(color.substr(5,2), 16)
  return {R:r,G:g,B:b,A:transparency}
}

function RGBAtoHex(RGBA){
  r = parseInt(RGBA.R).toString(16)
  g = parseInt(RGBA.G).toString(16)
  b = parseInt(RGBA.B).toString(16)

  if (r.length == 1)
    r = "0" + r;
  if (g.length == 1)
    g = "0" + g;
  if (b.length == 1)
    b = "0" + b;

  return `#`+r+g+b
}


function getPreviewSettings(){
  data = {
    containerBackgroundColor: hexToRGBA("containerBackgroundColor", "containerTransparency"),
    containerPadding: document.getElementById("containerPadding").value,
    containerBorderRadius: document.getElementById("containerBorderRadius").value,
    spacing: document.getElementById("spacing").value,

    titleBackgroundColor: hexToRGBA("titleBackgroundColor", "titleTransparency"),
    titlePadding: document.getElementById("titlePadding").value,
    titleBorderRadius: document.getElementById("titleBorderRadius").value,
    titleColor: hexToRGBA("titleColor","titleTextTransparency"),
    titleSize: document.getElementById("titleSize").value,
    titleFont: document.getElementById("titleFont").value,
    
    subtitleBackgroundColor: hexToRGBA("subtitleBackgroundColor", "subtitleTransparency"),
    subtitlePadding: document.getElementById("subtitlePadding").value,
    subtitleBorderRadius: document.getElementById("subtitleBorderRadius").value,
    subtitleColor: hexToRGBA("subtitleColor","subtitleTextTransparency"),
    subtitleSize: document.getElementById("subtitleSize").value,
    subtitleFont: document.getElementById("subtitleFont").value,
  }
  return data
}

function loadPreviewData(data){
  document.getElementById("containerBackgroundColor").value = RGBAtoHex(data.containerBackgroundColor)
  document.getElementById("containerTransparency").value = data.containerBackgroundColor.A
  document.getElementById("containerPadding").value = data.containerPadding
  document.getElementById("containerBorderRadius").value = data.containerBorderRadius
  document.getElementById("spacing").value = data.spacing

  document.getElementById("titleBackgroundColor").value = RGBAtoHex(data.titleBackgroundColor)
  document.getElementById("titleTransparency").value = data.titleBackgroundColor.A
  document.getElementById("titlePadding").value = data.titlePadding
  document.getElementById("titleBorderRadius").value = data.titleBorderRadius
  document.getElementById("titleColor").value = RGBAtoHex(data.titleColor)
  document.getElementById("titleTextTransparency").value = data.titleColor.A
  document.getElementById("titleSize").value = data.titleSize
  document.getElementById("titleFont").value = data.titleFont

  document.getElementById("subtitleBackgroundColor").value = RGBAtoHex(data.subtitleBackgroundColor)
  document.getElementById("subtitleTransparency").value = data.subtitleBackgroundColor.A
  document.getElementById("subtitlePadding").value = data.subtitlePadding
  document.getElementById("subtitleBorderRadius").value = data.subtitleBorderRadius
  document.getElementById("subtitleColor").value = RGBAtoHex(data.subtitleColor)
  document.getElementById("subtitleTextTransparency").value = data.subtitleColor.A
  document.getElementById("subtitleSize").value = data.subtitleSize
  document.getElementById("subtitleFont").value = data.subtitleFont

  previewUpdate()
}

function previewUpdate() {
  data = getPreviewSettings()
  let html = `
  <html>
  <head>
  <style>
  h1 {
    color: rgba(${data.titleColor.R}, ${data.titleColor.G}, ${data.titleColor.B}, ${data.titleColor.A}); 
    font-size:${data.titleSize}px; 
    background-color: rgba(${data.titleBackgroundColor.R}, ${data.titleBackgroundColor.G}, ${data.titleBackgroundColor.B}, ${data.titleBackgroundColor.A});   
    border-radius: ${data.titleBorderRadius}px;  
    padding: ${data.titlePadding}px;
    font-family: ${data.titleFont};
    width: fit-content;
    margin-bottom: 0px;
  }
  h2 {
    color: rgba(${data.subtitleColor.R}, ${data.subtitleColor.G}, ${data.subtitleColor.B}, ${data.subtitleColor.A}); 
    font-size:${data.subtitleSize}px; 
    background-color: rgba(${data.subtitleBackgroundColor.R}, ${data.subtitleBackgroundColor.G}, ${data.subtitleBackgroundColor.B}, ${data.subtitleBackgroundColor.A});   
    border-radius: ${data.subtitleBorderRadius}px;  
    padding: ${data.subtitlePadding}px;
    font-family: ${data.subtitleFont};
    width: fit-content;
    margin-top: ${data.spacing}px; 
  }
  .container {
    background-color: rgba(${data.containerBackgroundColor.R}, ${data.containerBackgroundColor.G}, ${data.containerBackgroundColor.B}, ${data.containerBackgroundColor.A});
	  width: fit-content;
	  padding: ${data.containerPadding}px;
    border-radius: ${data.containerBorderRadius}px;
  }
  </style>
  </head>
  <body>
  <div class="container">
  <h1>${chrome.i18n.getMessage("myTitle")}</h1>
  <h2>${chrome.i18n.getMessage("mySubtitle")}</h2>
  </div>
  </body>
  </html>
  `;
  document.getElementById("previewIframe").srcdoc = html;
}

onLoad();
setTimeout(makeCommand, 100);

previewInputs = document.getElementsByClassName("previewInput")
for (var i = 0; i < previewInputs.length; i++) {
  input = previewInputs[i]
  if(input.nodeName.toLowerCase() == "button"){
    input.onclick = previewUpdate
  }else{
    input.onchange = previewUpdate
  }
}

document.getElementById("confirmPreviewSize").addEventListener("click",()=>{
  document.getElementById("previewIframe").width = document.getElementById("psizex").value
  document.getElementById("previewIframe").height = document.getElementById("psizey").value
  previewUpdate()
})

async function loadPreviewSettings(preset){
  let presets = (await chrome.storage.local.get("presets")).presets
  loadPreviewData(presets[preset])
}


loadPreviewSettings("preset1")

document.getElementById("selectedPreset").addEventListener("change",()=>{
  console.log("changing preset")
  loadPreviewSettings(document.getElementById("selectedPreset").value)
})

document.getElementById("savePreset").addEventListener("click", async ()=>{
  let settings = getPreviewSettings()
  let presets = (await chrome.storage.local.get("presets")).presets
  presets[document.getElementById("selectedPreset").value] = settings
  console.log(presets)
  chrome.storage.local.set({
    presets: presets
  })
  setTimeout(()=>{chrome.storage.local.set({ updateRequired: true })},1000);
})