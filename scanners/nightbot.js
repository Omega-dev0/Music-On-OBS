
const PLATFORM = "nightbot";
const SCANNER = new Scanner(PLATFORM);

function getData() {
    let remainingTimeString = document.querySelectorAll(".nightbot-CurrentSongRequestDescription-module__artistContainer-II8uF p")?.item(2)?.innerHTML
    let remainingTime = remainingTimeString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)
    let progress = parseFloat(document.querySelector(".nightbot-SongControls-module__progress-aj9Qd").style.width.replace("%",""))
    let duration = remainingTime == undefined ? undefined : Math.floor((100 - progress) * remainingTime / progress);
    return {
        url: document.querySelector(".nightbot-CurrentSongRequestDescription-module__title-WUSTQ")?.href,
        subtitle: document.querySelectorAll(".nightbot-CurrentSongRequestDescription-module__artistContainer-II8uF p")?.item(0)?.innerHTML,
        title: document.querySelector(".nightbot-CurrentSongRequestDescription-module__title-WUSTQ")?.innerHTML,
        cover: document.querySelector(".sc-artwork > span")?.style?.backgroundImage?.replace(`url("`,``).replace(`")`,``) || `https://img.youtube.com/vi/${document.querySelector("iframe")?.src?.split("?")[0]?.split("/")?.pop()}/mqdefault.jpg`,
        progress: progress,
        duration: duration,
        //paused: document.querySelector(".ytp-play-button")?.title!=undefined ? document.querySelector(".ytp-play-button").title == "Play": document.querySelector(".waveform.g-all-transitions-200.loaded.playing") == null,
        paused: document.querySelector(".nightbot-badge-module__label-v5i2W").innerHTML=="Up next",
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

