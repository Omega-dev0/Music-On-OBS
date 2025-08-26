
const PLATFORM = "youtube"
const SCANNER = new Scanner(PLATFORM);


function removeNonLetterBeforeFirstLetter(inputString) {
    let firstLetterIndex = -1;
    for (let i = 0; i < inputString.length; i++) {
        if (/[a-zA-Z]/.test(inputString[i])) {
            firstLetterIndex = i;
            break;
        }
    }
    if (firstLetterIndex === -1) {
        return inputString;
    }
    return inputString.slice(firstLetterIndex).replace(/^[^a-zA-Z]*/, '');
}
function getChapterFromList(time, chapterList) {
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

function buildChapterList() {
    let chapterList = {};
    let descChapters = {};
    let commentChapters = {};

    let descSpanList = document.querySelectorAll(".ytd-expandable-video-description-body-renderer#inline-expander #attributed-snippet-text > span > span")
    for (var i = 0; i < descSpanList.length; i++) {
        let span = descSpanList.item(i);
        let link = span.querySelector("a");
        if (link != undefined && descSpanList.item(i + 1) != undefined) {
            if (link.href.includes("watch?v=") && link.innerHTML.replace(/[:0123456789]+/g, "") == "") {
                descChapters[getTimeFromTimeString(link.innerHTML, ":")] = descSpanList.item(i + 1).innerHTML;
            }
        }
    }

    let firstCommentSpanList = document.querySelectorAll("#sections > #contents > ytd-comment-thread-renderer").item(0);
    if (firstCommentSpanList != undefined) {
        firstCommentSpanList = firstCommentSpanList.querySelectorAll("#comment > #body > #main > #expander > #content > #content-text > span > span");
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
    }
    chapterList = Object.keys(descChapters).length > Object.keys(commentChapters).length ? descChapters : commentChapters;
    return chapterList;
}

function getData() {
    let videoElement = document.getElementsByClassName("video-stream")[0];
    let chapter = document.querySelector(".sponsorChapterText")?.innerHTML
    let chapterList = buildChapterList();
    if (chapter == undefined || chapter == "") {
        if (Object.keys(chapterList).length > 0) {
            chapter = getChapterFromList(videoElement.currentTime, chapterList);
        } else {
            chapter = document.querySelector("#upload-info >#channel-name > #container > #text-container > #text > a")?.innerHTML;
        }
    }



    let elapsed = videoElement.currentTime
    let duration = videoElement.duration;

    let progress = elapsed == undefined || duration == undefined ? undefined : Math.floor((elapsed / duration) * 10000) / 100;

    return {
        url: window.location.href.split("&ab_channel=")[0],
        subtitle: removeNonLetterBeforeFirstLetter(chapter),
        title: document.querySelector("#title > h1 > yt-formatted-string > font > font") != null ? document.querySelector("#title > h1 > yt-formatted-string > font > font").innerHTML : document.querySelector("#title > h1 > yt-formatted-string").innerHTML,
        cover: `https://img.youtube.com/vi/${window.location.href.split("watch?v=")[1].split("&")[0]}/mqdefault.jpg`,
        progress: progress,
        duration: duration,
        paused: videoElement.paused,
        isLive: document.querySelector(".ytp-live-badge") != undefined ? getComputedStyle(document.querySelector(".ytp-live-badge")).display != 'none' : false
    };
}


setInterval(() => {
    SCANNER.update(getData);
}, SCANNER.refreshInterval);

chrome.storage.onChanged.addListener(async (object, areaName) => {
    if (areaName != "local") {
        return;
    }
    if (object["extension-state"] != undefined) {
        SCANNER.update(getData)
    }
});

console.log(`MOS - ${PLATFORM} Scanner ready`);

