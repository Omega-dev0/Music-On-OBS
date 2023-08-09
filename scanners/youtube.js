let extensionState;
let extensionSettings;
let extensionScannerState;
let interval;

let allowed = false;
let TAB_ID;

let snapshot;

const platform = "youtube music";
let chapterList = {};
let descChapters = {};
let commentChapters = {};
//UTILITY
function getTimeFromTimeString(str, divider) {
  let split = str.split(divider);
  if (split.length == 1) {
    return str;
  } else if (split.length == 2) {
    return split[0] * 60 + split[1];
  } else if (split.length == 3) {
    return split[0] * 3600 + split[1] * 60 + split[2];
  }
}

function getChapterFromList(time){
  if(time < parseInt(Object.keys(chapterList)[0])){
    return chapterList[Object.keys(chapterList)[0]]
  }
  for(let timestamp of Object.keys(chapterList)){
    let chapterName = chapterList[timestamp]
    if(time <= parseInt(timestamp)){
      return chapterList[Object.keys(chapterList)[Object.keys(chapterList).indexOf(timestamp) - 1]]
    }
  }

  return chapterList[Object.keys(chapterList)[Object.keys(chapterList).length - 1]]
}


//GETS DATA FROM STORAGE
async function onLaunch() {
  extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

  //GET TAB
  let res = await chrome.runtime.sendMessage({ key: "listener-register", data: { platform: platform, title: document.title } });
  TAB_ID = res.tabId;
  if (extensionState.selectedScanner != TAB_ID || TAB_ID != undefined) {
    return;
  }
  allowed = true;
}

new MutationObserver(function (mutations) {
  //Tab title changed
  chrome.runtime.sendMessage({ key: "listener-update", data: { platform: platform, title: document.title } });
}).observe(document.querySelector("title"), { subtree: true, characterData: true, childList: true });

//UPDATE
let data = null;
function update() {
  if (allowed != true) {
    return;
  }
  data = getData();
  if (JSON.stringify(data) == JSON.stringify(snapshot)) {
    return; // ALREADY UPDATED
  }

  

  chrome.storage.local.set({
    "extension-scanner-state": {
      paused: data.paused,
      title: data.title,
      subtitle: data.subtitle,
      currentTime: getTimeFromTimeString(data.progress),
      currentLength: getTimeFromTimeString(data.duration),
      url: data.url,
      cover: data.cover,
    },
  });
  if (!snapshot) {
    chrome.runtime.sendMessage({ key: "sync-server" });
  } else {
    if(data.url != snapshot.url) {
      chapterList, descChapters, commentChapters = {}
    }
    if (snapshot != data) {
      chrome.runtime.sendMessage({ key: "sync-server" });
    }
  }
  snapshot = data;
}

//GETS DATA FROM PAGE
function getData() {
  //CHAPTERS
  let videoChapter = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-chapter-container > button > div.ytp-chapter-title-content").innerHTML;
  let chapter = ""

  if(videoChapter != ""){
    chapter = videoChapter
  }else if(Object.keys(chapterList).length > 0){
    chapter = getChapterFromList(parseInt(getTimeFromTimeString(document.querySelector(".ytp-time-current").innerHTML, ":")))
  }else{
    chapter = document.querySelector("#channel-name > #container > #text-container > #text > a").innerHTML;
  }

  return {
    url: window.location.href,
    subtitle: chapter,
    title: document.querySelector("#title > h1 > yt-formatted-string").innerHTML,
    cover: `https://img.youtube.com/vi/${window.location.href.split("watch?v=")[1].split("&")[0]}/mqdefault.jpg`,
    progress: document.querySelector(".ytp-time-current").innerHTML,
    duration: document.querySelector(".ytp-time-duration").innerHTML,
    paused: !(document.querySelector(".ytp-play-button.ytp-button").getAttribute("data-title-no-tooltip") == "Pause"),
  };
}

//MAKES SURE DATA FROM DB IS UP TO DATE
chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"].newValue;
    if (extensionState.selectedScanner == TAB_ID && TAB_ID != undefined && extensionState.stopped == false) {
      allowed = true;
      update();
    } else {
      allowed = false;
    }
  }
  if (object["extension-settings"] != undefined) {
    extensionSettings = object["extension-settings"].newValue;
  }
  if (object["extension-scanner-state"] != undefined) {
    extensionScannerState = object["extension-scanner-state"].newValue;
  }
});



let chaptersLoopConnection = setInterval(() => {
  if (Object.keys(descChapters).length == 0) {
    let descSpanList = document.querySelectorAll("#description > .content > span > span");
    for (var i = 0; i < descSpanList.length; i++) {
      let span = descSpanList.item(i);
      let link = span.querySelector("a");
      if (link != undefined && descSpanList.item(i + 1) != undefined) {
        if (link.href.includes("watch?v=") &&  link.innerHTML.replace(/[:0123456789]+/g,"") == "") {
          descChapters[getTimeFromTimeString(link.innerHTML, ":")] = descSpanList.item(i + 1).innerHTML;
        }
      }
    }
    chapterList = descChapters;
  }
  if (Object.keys(commentChapters).length == 0) {
    let firstCommentSpanList = document.querySelectorAll("#sections > #contents > ytd-comment-thread-renderer").item(0);
    if (firstCommentSpanList != undefined) {
      firstCommentSpanList = firstCommentSpanList.querySelectorAll("#body > #main > #comment-content > #expander > #content > #content-text > span");
    }
    if (firstCommentSpanList != undefined) {
      for (var i = 0; i < firstCommentSpanList.length; i++) {
        let span = firstCommentSpanList.item(i);
        let link = span.querySelector("a");
        if (link != undefined && firstCommentSpanList.item(i + 1) != undefined) {
          if (link.href.includes("watch?v=") &&  link.innerHTML.replace(/[:0123456789]+/g,"") == "") {
            commentChapters[getTimeFromTimeString(link.innerHTML, ":")] = firstCommentSpanList.item(i + 1).innerHTML;
          }
        }
      }
      if (Object.keys(descChapters).length < Object.keys(commentChapters).length) {
        chapterList = commentChapters;
      }
    }
  }
},10000);

console.log(`MOS - ${platform} Scanner ready`);
onLaunch();

setInterval(update, 1000);
