const imports = ["init.js", "modules/socketManager.js", "scanners/spotifyAPI.js"]
importScripts("settings.js")
try {
    importScripts("modules/socket.io.js");
} catch (e) {
    console.error("Failed to import socket.io", e)
}
let extensionScannerState
let extensionState
let extensionSettings
let spotifyAPIState

const manifestData = chrome.runtime.getManifest();

const extensionReady = new EventTarget()
//-----------SCANNERS HANDLING----------
async function updateScannersList() {
    let scanners = extensionState.scanners;
    //removing outdated scanners
    scanners = scanners.filter(async (scanner) => {
        if (tabLessScanners.includes(scanner.tabId)) {
            return true
        }
        try {
            let tab = await chrome.tabs.get(scanner.tabId);
            return typeof tab != "undefined"
        } catch (e) {
            return false
        }
    });

}

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    updateScannersList()
})



//-----------------UTILS----------------
let snapshot = ""
async function syncServer() {
    let data = {
        extensionState,
        extensionScannerState,
        extensionSettings
    }

    //Data that does not need to our should not be uploaded to the server
    data.extensionSettings.instance = {}
    data.extensionSettings.spotifyAPI = {}
    data.extensionState.scanners = []
    data.extensionState.selectedScanner = undefined

    updateLogo()

    if (JSON.stringify(data) == JSON.stringify(snapshot)) {
        return
    }

    emitServerEvent("update", data).then((response) => {
        snapshot = JSON.stringify(data)
        logger("[SYNC] Server synced")
    }).catch((e) => {
        console.error("Failed to sync server (not critical, only problematic if it repeats)", e)
    })
}

async function updateLogo() {
    if (extensionState.stopped == true) {
        chrome.action.setIcon({
            path: {
                16: "/images/default/default16.png",
                32: "/images/default/default32.png",
                48: "/images/default/default48.png",
                128: "/images/default/default128.png",
            },
        });
    } else if (extensionScannerState.paused == true) {
        chrome.action.setIcon({
            path: {
                16: "/images/paused/16x16.png",
                32: "/images/paused/32x32.png",
                48: "/images/paused/48x48.png",
                128: "/images/paused/128x128.png",
            },
        });
    } else {
        chrome.action.setIcon({
            path: {
                16: "/images/playing/16x16.png",
                32: "/images/playing/32x32.png",
                48: "/images/playing/48x48.png",
                128: "/images/playing/128x128.png",
            },
        });
    }
}

//---------------MESSAGING--------------

async function updateScanner(senderTabId, title, platform) {
    console.log("Updating scanner", senderTabId, title, platform)
    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    let scanners = extensionState.scanners;
    console.log(scanners)
    scanners = extensionState.scanners.filter((scanner) => {
        return scanner.tabId != senderTabId;
    });
    scanners.push({
        title: title,
        tabId: senderTabId,
        platform: platform,
    });
    await chrome.storage.local.set({
        "extension-state": {
            stopped: extensionState.stopped,
            scanners: scanners,
            selectedScanner: extensionState.selectedScanner,
        },
    });
}

const actions = {}
actions["sync-server"] = async (sender, message, sendResponse) => {
    syncServer()
    sendResponse(true)
}
actions["update-scanner"] = async (sender, message, sendResponse) => {
    await updateScanner(sender.tab.id, message.data.title, message.data.platform)
    sendResponse({ tabId: sender.tab.id, url: sender.tab.url, title: message.data.title, settings: extensionConfig });
}
actions["scanner-failure-report"] = async (sender, message, sendResponse) => {
    message.data.version = manifestData.version;
    emitServerEvent("scanner-failure-report", message.data)
    sendResponse();
}


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    let action = actions[message.key];
    logger(`[MESSAGE] ${sender}: ${message.key}`, message)
    if (!action) {
        console.error("A script called a message without a valid action !");
        console.log(message);
        return true
    } else {
        action(sender, message, sendResponse);
        return true
    }
});

//------------STORAGE UPDATES-----------
chrome.storage.onChanged.addListener(async (object, areaName) => {
    if (areaName != "local") {
        return;
    }
    if (object["extension-state"] != undefined) {
        extensionState = object["extension-state"].newValue;
    }
    if (object["extension-scanner-state"] != undefined) {
        extensionScannerState = object["extension-scanner-state"].newValue;
    }
    if (object["extension-settings"] != undefined) {
        extensionSettings = object["extension-settings"].newValue;
    }
    if (object["spotifyAPI-state"] != undefined) {
        spotifyAPIState = object["spotifyAPI-state"].newValue;
    }

    syncServer()
    //logger("[STORAGE] Updated", extensionState, extensionScannerState, extensionSettings)
});

//---------------IMPORTS----------------
function importAllImports() {
    for (let imp of imports) {
        try {
            importScripts(imp)
        } catch (e) {
            console.error(`Failed to import ${imp}`, e)
        }
    }
}
importAllImports()

//---------------ON LAUNCH--------------

let promises = []

promises.push(new Promise(async (resolve, reject) => {
    extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    resolve();
}))

promises.push(new Promise(async (resolve, reject) => {
    extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
    resolve();
}))

promises.push(new Promise(async (resolve, reject) => {
    extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    resolve();
}))

promises.push(new Promise(async (resolve, reject) => {
    spotifyAPIState = (await chrome.storage.local.get("spotifyAPI-state"))["spotifyAPI-state"];
    resolve();
}))

Promise.all(promises).then(() => {
    console.log("Background worker ready")
    extensionReady.dispatchEvent(new Event("ready"))
})