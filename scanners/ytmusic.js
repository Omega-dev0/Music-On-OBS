
const PLATFORM = "ytmusic"
const SCANNER = new Scanner(PLATFORM);

function getData() {
    let coverElement = document.querySelector(".image.style-scope.ytmusic-player-bar")?.src

    let elapsedString = document.querySelector(`.time-info`)?.innerHTML.split(" / ")[0]?.replace("\n    ", "")
    let durationString = document.querySelector(`.time-info`)?.innerHTML.split(" / ")[1]?.replace("\n  ", "")

    let duration = durationString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)
    let elapsed = elapsedString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)

    let progress = elapsed == undefined || duration == undefined ? undefined : Math.floor((elapsed / duration) * 10000) / 100;

    return {
        url: document.querySelectorAll(".ytmusic-player-bar >.yt-simple-endpoint.yt-formatted-string").item(1)?.href.replace(/list=[^&]*&/g, '') || document.location.href,
        subtitle: navigator.mediaSession.metadata?.artist,
        title: navigator.mediaSession.metadata?.title,
        cover: coverElement == undefined ? undefined : (new URL(coverElement).host == "lh3.googleusercontent.com" ? document.querySelector(".image.style-scope.ytmusic-player-bar")?.src.replace("w60-h60", "w600-h600") : document.querySelector(".image.style-scope.ytmusic-player-bar")?.src.split("?sqp")[0]),
        progress: progress,
        duration: duration,
        paused: navigator.mediaSession.playbackState != "playing",
        isLive: false
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

