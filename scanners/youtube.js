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
function getChapters(data) {
  let tracks = {};
  let elements = data.descHTML.querySelectorAll("span, a");
  let index = 0;
  elements.forEach((element) => {
    if (element.tagName.toLowerCase() == "a") {
      let timestamp = element.innerHTML;
      if (timestamp.replace(/[:0123456789]+/g, "") == "") {
        let formatType = timestamp.split(":").length - 1;
        if (formatType == 1) {
          timestamp = "00:" + timestamp;
        }
        let a = timestamp.split(":");
        timestamp = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
        elementString = elements[index + 1].innerHTML.substring(1).replace("\n", "");
        while ([" ", "-", "#"].includes(elementString.charAt(0))) elementString = elementString.substring(1);
        tracks[timestamp] = elementString;
      }
    }
    index = index + 1;
  });
  return tracks;
}

function getChapter(data) {
  let timestamp = data.ytplayer.currentTime;
  let i = 0;
  let tracks = getChapters(data);
  let chapterName;
  Object.entries(tracks).forEach((entry) => {
    if (timestamp >= entry[0]) {
      if (!Object.entries(timestamps)[i + 1]) {
        chapterName = entry[1];
      } else {
        if (Object.entries(timestamps)[i + 1][0] > timestamp) {
          chapterName = entry[1];
        }
      }
    }
    i = i + 1;
  });
  if (chapterName) {
    return chapterName;
  } else {
    return "";
  }
}

function partialLoop(interation, fc, arg) {
  if (iterations / interation == parseInt(iterations / interation)) {
    return fc(arg);
  } else {
    return undefined;
  }
}

//LOOPS
console.log("Youtube scanner injected");
chrome.runtime.sendMessage({ text: "TABID_REQUEST" }, (tab) => {
  console.log("My tab", tab);
  console.log(tab)
  //DATA LOOP
  async function dataLoop() {

    let url = window.location.href;
    let domain = new URL(url);
    domain = domain.hostname.replace("www.", "");
    if (!domain == "youtube.com") {
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
    let title = document.querySelector(".title.ytd-video-primary-info-renderer > yt-formatted-string.style-scope.ytd-video-primary-info-renderer");
    let chapter = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-chapter-container > button > div.ytp-chapter-title-content");
    if (!data.chapters && data.descHTML) {
      data.chapters = getChapters(data);
    }
    partialLoop(5, getChapters, data);
    if (data.chapters && chapter.innerHTML == "") {
      chapter2 = getChapter(data);
    } else {
      chapter2 = "";
    }

    data.title = title ? title.innerHTML : false;
    data.chapterName = chapter.innerHTML != "" ? chapter.innerHTML : chapter2;
    data.descHTML = document.querySelector(".content.style-scope.ytd-video-secondary-info-renderer");
    data.url = window.location.href;
    data.ytplayer = document.getElementsByClassName("video-stream")[0];
    data.timestamp = data.ytplayer.currentTime;

    let config = (await chrome.storage.local.get("settings")).settings;
    detectPause = config.youtube.detectPause
    console.log("Timestamp",data.timestamp)
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
    if (!domain == "youtube.com") {
      return;
    }

    ur = (await chrome.storage.local.get("updateRequired")).updateRequired
    if (compareData(server_data, data) || ur == true || ur2 == true) {
      ur2 = false
      chrome.storage.local.set({ updateRequired: false });
      //State change that matters --> Update the server

      if (updating == false) {
        preJson = {
          type: "full",
          title: data.title,
          chapter: data.chapterName,
          url: data.url,
          version: manifest.version,
          paused: data.paused,
          source: "Youtube"
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
