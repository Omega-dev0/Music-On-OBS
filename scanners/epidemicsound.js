


manifest = chrome.runtime.getManifest();
const server_data = {};
//UTILITY

function update(data) {
  
}

ur2 = false
//LOOP WIDE DATA
timestamps = false;

iterations = 0;
const data = {};

data.paused = false;
var previous_state = {};
enabled = false;

const pauseState = {
  stallCounter: 0,
  lastTimestamp: 0,
};

updating = false;

const retries = {
  count: 0,
  retry: false,
};

//UTILITIES

function compareData(d1, d2) {
  let changed = d1.title != d2.title || d1.chapterName != d2.chapterName || d1.url != d2.url || d1.paused != d2.paused;
  if (d2.title && d2.url) {
    return changed;
  } else {
    return false;
  }
}


//LOOPS
console.log("EpidemicSound scanner injected");
chrome.runtime.sendMessage({ text: "TABID_REQUEST" }, (tab) => {
  console.log("My tab", tab);
  //DATA LOOP
  async function dataLoop() {

    let url = window.location.href;
    let domain = new URL(url);
    domain = domain.hostname.replace("www.", "");
    if (!domain == "soundcloud.com") {
      return;
    }


    let activeScanner = (await chrome.storage.local.get("activeScanner")).activeScanner;
    //console.log(parseInt(activeScanner) == tab.tab.id, tab.tab.id, activeScanner)
    if (parseInt(activeScanner) != tab.tab.id) {
      enabled = false
      ur2 = true
      return;
    } else {
      enabled = true;
    }

    //console.log(data)
    iterations = iterations + 1;
    let title = document.querySelector('a[aria-label="track page"]').querySelector("div") == null ? document.querySelector('a[aria-label="track page"]').innerHTML : document.querySelector('a[aria-label="track page"]').querySelector("div > span > span").innerHTML
    let chapter = document.querySelector('a[aria-label="creatives"]').innerHTML
    data.title = title
    data.chapterName = chapter
    data.imageUrl = "https://yt3.ggpht.com/Pya1SavXmrR9FIUIAMhkqRACkMISVjppDC7wZr8oisbOEWkWxOgXnXCJZ1IdjlHW31MMzCZk=s900-c-k-c0x00ffffff-no-rj"
    data.url =  document.querySelector('a[aria-label="track page"]').href

    a = document.querySelector('.src-mainapp-player-components-___LineProgressBar__duration___1dluu > span').innerHTML.split(":")
    if(a.length  >2){
      data.timestamp = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
    }else{
      data.timestamp = (+a[0]) * 60 + (+a[1]);
    } 

    let config = (await chrome.storage.local.get("settings")).settings;
    detectPause = config.epidemic.detectPause

    if (pauseState.lastTimestamp == data.timestamp) {
      pauseState.stallCounter = pauseState.stallCounter + 1;
    } else {
      pauseState.stallCounter = 0;
    }

    if (pauseState.stallCounter >= 5 && detectPause == true) {
      data.paused = true;
    } else {
      data.paused = false;
    }

    pauseState.lastTimestamp = data.timestamp;
  }

  //UPDATES LOOP
  async function updates() {
    if(enabled == false){return}

    let url = window.location.href;
    let domain = new URL(url);
    domain = domain.hostname.replace("www.", "");
    if (!domain == "epidemicsound.com") {
      return;
    }

    ur = (await chrome.storage.local.get("updateRequired")).updateRequired
    if (compareData(server_data, data) || ur == true || ur2 == true) {
      ur2 = false
      chrome.storage.local.set({ updateRequired: false });
      //State change that matters --> Update the server

      if (updating == false) {
        let presets = (await chrome.storage.local.get("presets")).presets
        let preset = (await chrome.storage.local.get("usedPreset")).usedPreset

        preJson = {
          type: "full",
          title: data.title,
          chapter: data.chapterName,
          url: data.url,
          version: manifest.version,
          paused: data.paused,
          theme: presets[preset] || presets["default"],
          source: "Epidemic",
          imageUrl: data.imageUrl
        }
        json = JSON.stringify(preJson)
        updating = true
        chrome.runtime.sendMessage({ text: "SERVER_UPDATE__JSON__"+json })

        server_data.title = preJson.title
        server_data.chapterName = preJson.chapter
        server_data.url = preJson.url
        server_data.paused = preJson.paused

        setTimeout(()=>{
          updating = false
        }, 300)
      }
    }
  }
  setInterval(updates, 1000);
  setInterval(dataLoop, 1000);
});