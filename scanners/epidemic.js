
const PLATFORM = "epidemic"
const SCANNER = new Scanner(PLATFORM);

function getData() {
    let elapsedString = document.querySelectorAll(`.src-mainapp-player-components-___LineProgressBar-module__duration___nkJZv span`)?.item(0)?.innerHTML || document.querySelectorAll(".src-mainapp-player-components-___PlayerBar-module__waveformWrapper___-K5Gq span").item(0)?.innerHTML
    let durationString = document.querySelectorAll(`.src-mainapp-player-components-___LineProgressBar-module__duration___nkJZv span`)?.item(1)?.innerHTML || document.querySelectorAll(".src-mainapp-player-components-___PlayerBar-module__waveformWrapper___-K5Gq span").item(1)?.innerHTML

    let duration = durationString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)
    let elapsed = elapsedString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)

    let progress = elapsed == undefined || duration == undefined ? undefined : Math.floor((elapsed / duration) * 10000)/100;

    return {
        url:  document.querySelector(`a[aria-label="track page"]`)?.href,
        subtitle: document.querySelector(`a[aria-label="creatives"]`)?.innerHTML,
        title: document.querySelector(`a[aria-label="track page"]`)?.querySelector("div > span > span")?.innerHTML || document.querySelector(`a[aria-label="track page"]`).innerHTML,
        cover: document.querySelector("[data-cy-playerbar=true] img").src || "/static/logo.png",
        progress: progress,
        duration: duration,
        paused: navigator.mediaSession?.playbackState == "paused",
        isLive:false
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

