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
async function updateScannersList(removedTabId) {
    extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    let scanners = extensionState.scanners;
    //removing outdated scanners

    const filterFunction = async (scanner) => {
        if (extensionConfig.tabLessScanners.includes(scanner.tabId)) {
            return true
        }
        let result = true
        try {
            let tab = await chrome.tabs.get(scanner.tabId);

            result = typeof tab != "undefined"
        } catch (e) {
            result = false
        }
        return result;
    }


    let fscanners = []
    for (let scanner of scanners) {
        let stillExists = await filterFunction(scanner);
        if (stillExists) {
            fscanners.push(scanner);
        }
    }

    // Check for spotify API availability
    if (extensionSettings.spotifyAPI.spotifyRefreshToken != "" && fscanners.find((scanner) => scanner.platform == "spotifyAPI") == undefined) {
        fscanners.push({
            platform: "spotifyAPI",
            tabId: "spotifyAPI",
            title: "Spotify API"
        })
    }

    chrome.storage.local.set({
        "extension-state": {
            stopped: extensionState.stopped,
            scanners: fscanners,
            selectedScanner: extensionState.selectedScanner,
            connected: extensionState.connected,
        },
    });

    if (extensionState.selectedScanner == removedTabId) {
        chrome.storage.local.set({
            "extension-state": {
                stopped: true,
                scanners: extensionState.scanners,
                selectedScanner: "none",
                connected: extensionState.connected,
            },
        });
        disconnectFromServer()
    }
}

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    updateScannersList(tabId)
})



//-----------------UTILS----------------
let snapshot = ""
async function syncScannerState() {

    let data = extensionScannerState || (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"]

    updateLogo()

    if (JSON.stringify(data) == snapshot) {
        return
    }

    emitServerEvent("updateScannerState", data).then((response) => {
        snapshot = JSON.stringify(data)
        logger("[SYNC] Server scanner state synced")
    }).catch((e) => {
        console.error("Failed to sync server scanner state (not critical, only problematic if it repeats)", e)
    })
}

let snapshot2 = ""
async function syncSettingsState() {

    let data = extensionSettings || (await chrome.storage.local.get("extension-settings"))["extension-settings"]
    if (JSON.stringify(data) == snapshot2) {
        return
    }
    data.extensionSettings = null
    emitServerEvent("updateSettingsState", data).then((response) => {
        snapshot2 = JSON.stringify(data)
        logger("[SYNC] Server settings synced")
    }).catch((e) => {
        console.error("Failed to sync server settings ", e)
    })
}

let currentLogo = ""
async function updateLogo() {
    if (extensionState.stopped == true) {
        if (currentLogo == "default") { return }
        chrome.action.setIcon({
            path: {
                16: "/images/default/default16.png",
                32: "/images/default/default32.png",
                48: "/images/default/default48.png",
                128: "/images/default/default128.png",
            },
        });
        currentLogo = "default"
    } else if (extensionScannerState.paused == true || extensionState.connected == false) {
        if (currentLogo == "paused") { return }
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
        if (currentLogo == "playing") { return }
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
    await chrome.storage.local.set({
        "extension-state": {
            stopped: extensionState.stopped,
            scanners: scanners,
            selectedScanner: extensionState.selectedScanner,
            connected: extensionState.connected,
        },
    });
}

const actions = {}
actions["sync-scanner-state"] = async (sender, message, sendResponse) => {
    syncScannerState()
    sendResponse(true)
}
actions["sync-settings-state"] = async (sender, message, sendResponse) => {
    syncSettingsState()
    sendResponse(true)
}
actions["update-scanner"] = async (sender, message, sendResponse) => {
    await updateScanner(sender.tab.id, message.data.title, message.data.platform)
    sendResponse({ tabId: sender.tab.id, url: sender.tab.url, title: message.data.title, settings: extensionConfig });
}
actions["instance-create"] = async (sender, message, sendResponse) => {
    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    let res = await fetch(`${extensionConfig.serverAdress}/api/createNewInstance`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            settings: extensionSettings,
        })
    });
    data = await res.json();

    if (data.error) {
        console.error("Failed to create new instance", data.error)
        sendResponse({ error: data.error });
        return;
    }

    extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    extensionSettings.instance.publicToken = data.publicToken;
    extensionSettings.instance.privateToken = data.privateToken;
    await chrome.storage.local.set({
        "extension-settings": extensionSettings
    });

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

        if (extensionState.stopped == true) {
            disconnectFromServer()
        } else {
            connectToServer()
        }


        console.log("Updated extension state", extensionState)
    }
    if (object["extension-scanner-state"] != undefined) {
        extensionScannerState = object["extension-scanner-state"].newValue;
        syncScannerState()
    }
    if (object["extension-settings"] != undefined) {
        extensionSettings = object["extension-settings"].newValue;
        syncSettingsState()
        // console.log("Updated extension settings", extensionSettings)
    }
    if (object["spotifyAPI-state"] != undefined) {
        spotifyAPIState = object["spotifyAPI-state"].newValue;
    }



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