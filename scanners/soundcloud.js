
const PLATFORM = "soundcloud";
const SCANNER = new Scanner(PLATFORM);

function getData() {
    let elapsedString = document.querySelector(".playbackTimeline__timePassed > span[aria-hidden='true']")?.innerHTML
    let durationString = document.querySelector(".playbackTimeline__duration > span[aria-hidden='true']")?.innerHTML

    let duration = durationString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)
    let elapsed = elapsedString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)

    let progress = elapsed == undefined || duration == undefined ? undefined : Math.floor((elapsed / duration) * 10000)/100;

    return {
        url: document.querySelector(".playbackSoundBadge__titleLink")?.href,
        subtitle: navigator.mediaSession.metadata?.artist,
        title: navigator.mediaSession.metadata?.title,
        cover: navigator.mediaSession.metadata?.artwork[0].src,
        progress: progress,
        duration: duration,
        paused: navigator.mediaSession.playbackState == "paused",
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

