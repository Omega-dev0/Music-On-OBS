
//---------------------ON LAUNCH------------------------
async function onLaunch() {
    logger("[EVENT] onLaunch")
    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    chrome.storage.local.set({
        "extension-state": {
            stopped: true,
            scanners: extensionState.scanners,
            selectedScanner: "none",
        },
    });
    await connectToServer()

    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    logger("[SOCKET] registerClient", extensionSettings.instance.privateToken, extensionSettings.instance.publicToken)
    emitServerEvent("registerClient", {
        privateToken: extensionSettings.instance.privateToken,
        publicToken: extensionSettings.instance.publicToken,
    });
}

//--------------ON UPDATE / INSTALL -----------------


/**
 * Performs necessary actions when the extension is installed or updated.
 * @returns {Promise<void>} A promise that resolves when the actions are completed.
 */
async function onInstalled() {
    logger("[EVENT] onInstalled")
    await legacySwitch();
    let extensionState = {
        stopped: true,
        scanners: [],
        selectedScanner: "none"
    }

    let extensionScannerState = {
        paused: false,
        title: "Default title",
        subtitle: "Defaut subtitle",
        currentTime: "",
        currentLength: "",
        url: "",
        cover: "",
    }

    let OldSpotifyState = (await chrome.storage.local.get("spotifyAPI-state"))["spotifyAPI-state"];
    let spotifyAPIState = {
        "spotifyAPI-state": {
            spotifyToken: OldSpotifyState == undefined ? "" : OldSpotifyState.spotifyToken,
            spotifyTokenExpiry: OldSpotifyState == undefined ? 0 : OldSpotifyState.spotifyTokenExpiry,
        }
    }


    let OldextensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    let extensionSettings = {
        instance: {
            privateToken: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.privateToken,
            publicToken: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.publicToken,
        },
        spotifyAPI: {
            spotifyId: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.spotifyId,
            spotifyAppToken: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.spotifyAppToken,
            spotifyRefreshToken: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.spotifyRefreshToken,
        },
        behaviour: {
            displayPause: OldextensionSettings == undefined ? true : OldextensionSettings.behaviour.displayPause,
            detectPause: OldextensionSettings == undefined ? true : OldextensionSettings.behaviour.detectPause,
        },
        integration: {
            defaultMessage: OldextensionSettings == undefined ? chrome.i18n.getMessage("defaultIntegrationMessage") : OldextensionSettings.integration.defaultMessage,
            pausedMessage: OldextensionSettings == undefined ? chrome.i18n.getMessage("pausedIntegrationMessage") : OldextensionSettings.integration.pausedMessage,
            errorMessage: OldextensionSettings == undefined ? chrome.i18n.getMessage("errorIntegrationMessage") : OldextensionSettings.integration.errorMessage,
        },
        overlay: {}
    }


    let OldStatistics = (await chrome.storage.local.get("extension-statistics"))["extension-statistics"];
    let statistics = {
        PlatformStats: OldStatistics == undefined ? {} : OldStatistics.SongsPerplatform,
    }

    chrome.storage.local.set({ "extension-settings": extensionSettings });
    chrome.storage.local.set({ "extension-state": extensionState });
    chrome.storage.local.set({ "extension-scanner-state": extensionScannerState });
    chrome.storage.local.set({ "spotifyAPI-state": spotifyAPIState });
    chrome.storage.local.set({ "extension-statistics": statistics });

    chrome.storage.local.set({
        "persistentData": {
            hasSeenUpdatePopup: false,
            version: chrome.runtime.getManifest().version
        }
    });


}


/**
 * Migrates extension settings from a previous version to the current version.
 * @returns {Promise<void>} A promise that resolves when the migration is complete.
 */
async function legacySwitch() {
    let manifest = chrome.runtime.getManifest();
    let version = manifest.version;
    let previousVersion = (await chrome.storage.local.get("persistentData")).persistentData
    if (previousVersion != undefined) {
        previousVersion = previousVersion.version;
    } else {
        previousVersion = "2.2.1.2"
    }
    if (previousVersion == version) { return }
    logger(`Migrating from v${previousVersion} to v${version}`)

    if (previousVersion != undefined) {
        previousVersion = previousVersion.version;
    }

    if (previousVersion == "") {
        //PREVIOUS VERSION WAS 2.2.1.2

        //Migrate extensionSettings
        let OldextensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
        let extensionSettings = {
            instance: {
                privateToken: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.privateToken,
                publicToken: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.publicToken,
            },
            spotifyAPI: {
                spotifyId: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.spotifyId,
                spotifyAppToken: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.spotifyAppToken,
                spotifyRefreshToken: OldextensionSettings == undefined ? "" : OldextensionSettings.instance.spotifyRefreshToken,
            },
            behaviour: {
                displayPause: OldextensionSettings == undefined ? true : OldextensionSettings.behaviour.displayPause,
                detectPause: OldextensionSettings == undefined ? true : OldextensionSettings.behaviour.detectPause,
            },
            integration: {
                defaultMessage: OldextensionSettings == undefined ? chrome.i18n.getMessage("defaultIntegrationMessage") : OldextensionSettings.integration.defaultMessage,
                pausedMessage: OldextensionSettings == undefined ? chrome.i18n.getMessage("pausedIntegrationMessage") : OldextensionSettings.integration.pausedMessage,
                errorMessage: OldextensionSettings == undefined ? chrome.i18n.getMessage("errorIntegrationMessage") : OldextensionSettings.integration.errorMessage,
            },
            overlay: {}
        }
        await chrome.storage.local.set({ "extension-settings": extensionSettings });
        return
    }
}

//---------------------BINDINGS------------------------
chrome.runtime.onInstalled.addListener(onInstalled);  //On install or on update
chrome.runtime.onStartup.addListener(onLaunch); //  On startup

