let extensionState;
let extensionSettings;
let extensionScannerState;
let interval;

let allowed = false;
let TAB_ID;

let snapshot;


const platform = "youtube";
let chapterList = {};
let descChapters = {};
let commentChapters = {};
//UTILITY
function getTimeFromTimeString(str, divider) {
  let split = str.split(divider);
  if (split.length == 1) {
    return parseInt(str);
  } else if (split.length == 2) {
    return parseInt(split[0]) * 60 + parseInt(split[1]);
  } else if (split.length == 3) {
    return parseInt(split[0]) * 3600 + parseInt(split[1]) * 60 + parseInt(split[2]);
  }
}


function capitalizeFirstAsciiLetter(inputString) {
  for (let i = 0; i < inputString.length; i++) {
    const charCode = inputString.charCodeAt(i);
    if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
      // Check if the character is an uppercase or lowercase letter
      const capitalizedChar = inputString[i].toUpperCase();
      return inputString.slice(0, i) + capitalizedChar + inputString.slice(i + 1);
    }
  }
  return inputString; // No ASCII letters found
}

function removeNonLetterBeforeFirstLetter(inputString) {
  // Find the index of the first letter character
  let firstLetterIndex = -1;
  for (let i = 0; i < inputString.length; i++) {
      if (/[a-zA-Z]/.test(inputString[i])) {
          firstLetterIndex = i;
          break;
      }
  }

  // If no letter is found, return the original string
  if (firstLetterIndex === -1) {
      return inputString;
  }

  // Remove non-letter characters before the first letter
  return inputString.slice(firstLetterIndex).replace(/^[^a-zA-Z]*/, '');
}


function getChapterFromList(time) {
  if (time < parseInt(Object.keys(chapterList)[0])) {
    return chapterList[Object.keys(chapterList)[0]];
  }
  for (let timestamp of Object.keys(chapterList)) {
    let chapterName = chapterList[timestamp];
    if (time <= parseInt(timestamp)) {
      return chapterList[Object.keys(chapterList)[Object.keys(chapterList).indexOf(timestamp) - 1]];
    }
  }

  return chapterList[Object.keys(chapterList)[Object.keys(chapterList).length - 1]];
}




function sendMessage(msg){
  chrome.runtime.sendMessage(msg)
}

//GETS DATA FROM STORAGE
async function onLaunch() {
  extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
  extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];

  

  //GET TAB
  let res = await chrome.runtime.sendMessage({ key: "listener-register", data: { platform: platform, title: document.title } });
  TAB_ID = res.tabId;
  if (extensionState.selectedScanner != TAB_ID || TAB_ID == undefined) {
    return;
  }
  allowed = true;
}

new MutationObserver(function (mutations) {
  //Tab title changed
  sendMessage({ key: "listener-update", data: { platform: platform, title: document.title } });
}).observe(document.querySelector("title"), { subtree: true, characterData: true, childList: true });

//UPDATE
let data = null;
function update(forceUpdate) {
  if (allowed != true) {
    return;
  }
  data = getData();
  if (JSON.stringify(data) == JSON.stringify(snapshot) && forceUpdate != true) {
    return; // ALREADY UPDATED
  }

  chrome.storage.local.set({
    "extension-scanner-state": {
      paused: data.paused,
      title: data.title,
      subtitle: data.subtitle,
      currentTime: data.progress,
      currentLength: data.duration,
      url: data.url,
      cover: data.cover,
    },
  });
  if (!snapshot) {
    sendMessage({ key: "sync-server" });
  } else {
    if (data.url != snapshot.url || data.title != snapshot.title) {
      chapterList = {};
      descChapters = {};
      commentChapters = {};
    }
    if (snapshot != data) {
      sendMessage({ key: "sync-server" });
    }
  }
  snapshot = data;
}

//GETS DATA FROM PAGE
function getData() {
  //CHAPTERS
  let videoChapter = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-chapter-container > button > div.ytp-chapter-title-content").innerHTML;
  let chapter = "";

  let videoElement = document.getElementsByClassName("video-stream")[0];
  let progress = parseInt(videoElement.currentTime);

  if (videoChapter != "") {
    chapter = videoChapter;
  } else if (Object.keys(chapterList).length > 0) {
    chapter = getChapterFromList(progress);
  } else {
    chapter =  document.querySelector("#upload-info >#channel-name > #container > #text-container > #text > a").innerHTML;
  }

  let isLive =  document.querySelector(".ytp-live-badge")!= undefined ? getComputedStyle(document.querySelector(".ytp-live-badge")).display != 'none' :false

  return {
    url: window.location.href.split("&ab_channel=")[0],
    subtitle: removeNonLetterBeforeFirstLetter(capitalizeFirstAsciiLetter(chapter)),
    title: capitalizeFirstAsciiLetter(document.querySelector("#title > h1 > yt-formatted-string > font > font") != null ? document.querySelector("#title > h1 > yt-formatted-string > font > font").innerHTML : document.querySelector("#title > h1 > yt-formatted-string").innerHTML),
    cover: `https://img.youtube.com/vi/${window.location.href.split("watch?v=")[1].split("&")[0]}/mqdefault.jpg`,
    progress: progress,
    duration: isLive == true ? "live" : videoElement.duration,
    paused: videoElement.paused,
  };
}éé

//MAKES SURE DATA FROM DB IS UP TO DATE
chrome.storage.onChanged.addListener(async (object, areaName) => {
  if (areaName != "local") {
    return;
  }
  if (object["extension-state"] != undefined) {
    extensionState = object["extension-state"].newValue;
    if (extensionState.selectedScanner == TAB_ID && TAB_ID != undefined && extensionState.stopped == false) {
      allowed = true;
      update(true);
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
  if (allowed == true) {
    if (Object.keys(descChapters).length == 0) {
      let descSpanList = document.querySelectorAll("#description > .content > span > span");
      for (var i = 0; i < descSpanList.length; i++) {
        let span = descSpanList.item(i);
        let link = span.querySelector("a");
        if (link != undefined && descSpanList.item(i + 1) != undefined) {
          if (link.href.includes("watch?v=") && link.innerHTML.replace(/[:0123456789]+/g, "") == "") {
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
            if (link.href.includes("watch?v=") && link.innerHTML.replace(/[:0123456789]+/g, "") == "") {
              commentChapters[getTimeFromTimeString(link.innerHTML, ":")] = firstCommentSpanList.item(i + 1).innerHTML;
            }
          }
        }
        if (Object.keys(descChapters).length < Object.keys(commentChapters).length) {
          chapterList = commentChapters;
        }
      }
    }
  }
}, 10000);

console.log(`MOS - ${platform} Scanner ready`);
onLaunch();

setInterval(update, 1000);
