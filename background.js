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
let READY = false

const manifestData = chrome.runtime.getManifest();

const extensionReady = new EventTarget()
//-----------SCANNERS HANDLING----------
async function updateScannersList() {
    let scanners = extensionState.scanners;
    //removing outdated scanners
    scanners = scanners.filter(async (scanner) => {
        if (extensionConfig.tabLessScanners.includes(scanner.tabId)) {
            return true
        }
        try {
            let tab = await chrome.tabs.get(scanner.tabId);
            return typeof tab != "undefined"
        } catch (e) {
            return false
        }
    });
    console.log("filtered scanners", scanners)
    chrome.storage.local.set({
        "extension-state": {
            stopped: extensionState.stopped,
            scanners: scanners,
            selectedScanner: extensionState.selectedScanner,
        },
    });
}

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    updateScannersList()
})



//-----------------UTILS----------------
let snapshot = ""
async function syncServer() {

    let data = {
        extensionState: extensionState || (await chrome.storage.local.get("extension-state"))["extension-state"],
        extensionScannerState: extensionScannerState || (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"],
        extensionSettings: extensionSettings || (await chrome.storage.local.get("extension-settings"))["extension-settings"],
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

let currentLogo = ""
async function updateLogo() {
    if (extensionState.stopped == true) {
        if(currentLogo == "default") { return }
        chrome.action.setIcon({
            path: {
                16: "/images/default/default16.png",
                32: "/images/default/default32.png",
                48: "/images/default/default48.png",
                128: "/images/default/default128.png",
            },
        });
        currentLogo = "default"
    } else if (extensionScannerState.paused == true) {
        if(currentLogo == "paused") { return }
        chrome.action.setIcon({
            path: {
                16: "/images/paused/16x16.png",
                32: "/images/paused/32x32.png",
                48: "/images/paused/48x48.png",
                128: "/images/paused/128x128.png",
            },
        });
        currentLogo = "paused"
    } else {
        if(currentLogo == "playing") { return }
        chrome.action.setIcon({
            path: {
                16: "/images/playing/16x16.png",
                32: "/images/playing/32x32.png",
                48: "/images/playing/48x48.png",
                128: "/images/playing/128x128.png",
            },
        });
        currentLogo = "playing"
    }
}

//---------------MESSAGING--------------

async function updateScanner(senderTabId, title, platform) {
    console.log("Updating scanner", senderTabId, title, platform)
    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    let scanners = extensionState.scanners;

    scanners = extensionState.scanners.filter((scanner) => {
        return scanner.tabId != senderTabId;
    });
    scanners.push({
        title: title,
        tabId: senderTabId,
        platform: platform,
    });
    console.log(scanners)
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
actions["instance-create"] = async (sender, message, sendResponse) => {
    emitServerEvent("instance-create",{}).then(async (response) => {
        extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
        extensionSettings.instance.privateToken = response.privateToken;
        extensionSettings.instance.publicToken = response.publicToken;
        chrome.storage.local.set({
            "extension-settings": extensionSettings,
        })
    })
    sendResponse()
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
        console.log("Updated extension state", extensionState)
    }
    if (object["extension-scanner-state"] != undefined) {
        extensionScannerState = object["extension-scanner-state"].newValue;
    }
    if (object["extension-settings"] != undefined) {
        extensionSettings = object["extension-settings"].newValue;
        console.log("Updated extension settings", extensionSettings)
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
    let data = (await chrome.storage.local.get());
    extensionState = data["extension-state"];
    extensionScannerState = data["extension-scanner-state"];
    extensionSettings = data["extension-settings"];
    spotifyAPIState = data["spotifyAPI-state"];
    resolve();
}))

Promise.all(promises).then(() => {
    console.log("Background worker ready")
    extensionReady.dispatchEvent(new Event("ready"))
    READY = true
})