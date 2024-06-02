
const PLATFORM = "ytmusic"
const SCANNER = new Scanner(PLATFORM);

function getData() {
    let coverElement = document.querySelector(".image.style-scope.ytmusic-player-bar")?.src
    return {
        url: document.querySelectorAll(".ytmusic-player-bar >.yt-simple-endpoint.yt-formatted-string").item(1)?.href.replace(/list=[^&]*&/g, '') || document.location.href,
        subtitle: navigator.mediaSession.metadata?.artist,
        title: navigator.mediaSession.metadata?.title,
        cover: coverElement == undefined ? undefined : (new URL(coverElement).host == "lh3.googleusercontent.com" ? document.querySelector(".image.style-scope.ytmusic-player-bar")?.src.replace("w60-h60", "w600-h600") : document.querySelector(".image.style-scope.ytmusic-player-bar")?.src.split("?sqp")[0]),
        progress: document.querySelector(`.time-info`)?.innerHTML.split(" / ")[0]?.replace("\n    ", ""),
        duration: document.querySelector(`.time-info`)?.innerHTML.split(" / ")[1]?.replace("\n  ", ""),
        paused: document.querySelector("#play-pause-button")?.ariaLabel == undefined ? undefined : (document.querySelector("#play-pause-button")?.ariaLabel == "Play"),
    };
}


setInterval(() => {
    SCANNER.update(getData());
}, SCANNER.refreshInterval);


chrome.storage.onChanged.addListener(async (object, areaName) => {
    if (areaName != "local") {
        return;
    }
    if (object["extension-state"] != undefined) {
        SCANNER.update(getData())
    }
});

console.log(`MOS - ${PLATFORM} Scanner ready`);

