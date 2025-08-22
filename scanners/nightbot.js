
const PLATFORM = "nightbot";
const SCANNER = new Scanner(PLATFORM);

function getData() {



    // detect if youtube or soundcloud
    let data
    let iframe = document.querySelector("iframe")
    if (iframe.title != undefined) {
        //YT

        let videoId = iframe.src.match(/\/embed\/([^?]+)/)?.[1]
        let remainingString = document.querySelectorAll("[class*='artistContainer'] > p")[2].innerHTML
        let percentProgress = parseFloat(document.querySelector("[class*='progressBar'] > [class*='progress']").style.width)

        let remaining = remainingString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)

        let duration = percentProgress < 100 ? (remaining / (100 - percentProgress)) * 100 : 0

        data = {
            title: iframe.title,
            subtitle: document.querySelector("[class*='artistContainer'] > p").innerHTML,
            cover: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            paused: document.querySelector("[class*='badgeContainer'] > [class*='badge'] > span").innerHTML == "Up Next",
            isLive: false,

            duration: duration,
            progress: percentProgress
        }
    } else {
        //Soundcloud
        let link = document.querySelector("a[class*='title']").href
        let remainingString = document.querySelectorAll("[class*='artistContainer'] > p")[2].innerHTML
        let percentProgress = parseFloat(document.querySelector("[class*='progressBar'] > [class*='progress']").style.width)

        let remaining = remainingString?.split(":").map((x) => parseInt(x)).reduce((acc, x) => acc * 60 + x, 0)

        let duration = percentProgress < 100 ? (remaining / (100 - percentProgress)) * 100 : 0




        data = {
            title: document.querySelector("a[class*='title']").innerHTML,
            subtitle: document.querySelector("[class*='artistContainer'] > p").innerHTML,
            cover: `https://music.omegadev.xyz/static/logo.png`,
            url: link,
            paused: document.querySelector("[class*='badgeContainer'] > [class*='badge'] > span").innerHTML == "Up Next",
            isLive: false,
            duration: duration,
            progress: percentProgress
        }
    }

    return data
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

