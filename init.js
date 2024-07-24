
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
        "extension-scanner-state": {
            paused: false,
            title: "Default title",
            subtitle: "Defaut subtitle",
            currentTime: "",
            currentLength: "",
            url: "",
            cover: "",
        }
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

const DataSchema = {
    "extension-settings": {
        instance: {
            privateToken: {
                defaultValue: "",
                legacySwitch: {
                    category: "instance",
                    key: "privateToken"
                }
            },
            publicToken: {
                defaultValue: "",
                legacySwitch: {
                    category: "instance",
                    key: "publicToken"
                }
            },
        },
        spotifyAPI: {
            spotifyId: {
                defaultValue: "",
                legacySwitch: {
                    category: "instance",
                    key: "spotifyId"
                }
            },
            spotifyAppToken: {
                defaultValue: "",
                legacySwitch: {
                    category: "instance",
                    key: "spotifyAppToken"
                }
            },
            spotifyRefreshToken: {
                defaultValue: "",
                legacySwitch: {
                    category: "instance",
                    key: "spotifyRefreshToken"
                }
            },
        },
        behaviour: {
            displayPause: {
                defaultValue: true,
                legacySwitch: {
                    category: "behaviour",
                    key: "displayPause"
                }
            },
            detectPause: {
                defaultValue: true,
                legacySwitch: {
                    category: "behaviour",
                    key: "detectPause"
                }
            },
        },
        integration: {
            defaultMessage: {
                defaultValue: chrome.i18n.getMessage("defaultIntegrationMessage"),
                legacySwitch: {
                    category: "integration",
                    key: "defaultMessage"
                }
            },
            pausedMessage: {
                defaultValue: chrome.i18n.getMessage("pausedIntegrationMessage"),
                legacySwitch: {
                    category: "integration",
                    key: "pausedMessage"
                }
            },
            errorMessage: {
                defaultValue: chrome.i18n.getMessage("errorIntegrationMessage"),
                legacySwitch: {
                    category: "integration",
                    key: "errorMessage"
                }
            },
        },
        overlay: {},
    },
    "extension-state": {
        stopped: {
            defaultValue: true,
            forceReset: true,
        },
        scanners: {
            defaultValue: [],
            forceReset: true,
        },
        selectedScanner: {
            defaultValue: "none",
            forceReset: true,
        },
    },
    "extension-scanner-state": {
        paused: {
            defaultValue: false,
            forceReset: true,
        },
        title: {
            defaultValue: "Default title",
            forceReset: true,
        },
        subtitle: {
            defaultValue: "Defaut subtitle",
            forceReset: true,
        },
        currentTime: {
            defaultValue: "",
            forceReset: true,
        },
        currentLength: {
            defaultValue: "",
            forceReset: true,
        },
        url: {
            defaultValue: "",
            forceReset: true,
        },
        cover: {
            defaultValue: "",
            forceReset: true,
        },
    },
    "spotifyAPI-state": {
        spotifyToken: {
            defaultValue: "",
            legacySwitch: {
                category: "spotifyAPI-state",
                key: "spotifyToken"
            }
        },
        spotifyTokenExpiry: {
            defaultValue: 0,
            legacySwitch: {
                category: "spotifyAPI-state",
                key: "spotifyTokenExpiry"
            }
        },
    },
    "extension-statistics": {
        platformStats: {
            defaultValue: {},
        }
    }
}

async function fillSettingsStorage() {
    let currentData = (await chrome.storage.local.get())
    let newFullSetting = currentData
    for (namespace in DataSchema) {
        let currentSettings = currentData[namespace] || {}
        let settingsDataSchema = DataSchema[namespace]
        let newSettings = {}
        if (namespace == "extension-settings") {
            for (let catKey in settingsDataSchema) {
                if (currentSettings[catKey] == undefined) {
                    currentSettings[catKey] = {}
                }
                newSettings[catKey] = {}
                for (let key in settingsDataSchema[catKey]) {
                    let keyData = settingsDataSchema[catKey][key]

                    if (keyData.forceReset == true) {
                        newSettings[catKey][key] = keyData.defaultValue
                        continue
                    }

                    //If it does not exist and should not be reset
                    if (currentSettings[catKey][key] == undefined) {
                        //If there is a legacy value
                        if (keyData.legacySwitch != undefined) {
                            newSettings[catKey][key] = currentSettings[keyData.legacySwitch.category][keyData.legacySwitch.key]
                            if (newSettings[catKey][key] == undefined) {
                                newSettings[catKey][key] = keyData.defaultValue
                            }
                        }else{
                            newSettings[catKey][key] =  keyData.defaultValue
                        }
                    } else {
                        newSettings[catKey][key] = currentSettings[catKey][key]
                    }
                }
            }
        } else {
            for (let key in settingsDataSchema) {
                let keyData = settingsDataSchema[key]
                if (keyData.forceReset == true) {
                    newSettings[key] = keyData.defaultValue
                    continue
                }

                //If it does not exist and should not be reset
                if (currentSettings[key] == undefined) {
                    //If there is a legacy value
                    if (keyData.legacySwitch != undefined) {
                        newSettings[key] = currentSettings[keyData.legacySwitch.key]
                        if (newSettings[key] == undefined) {
                            newSettings[key] = keyData.defaultValue
                        }
                    }else{
                        newSettings[key] =  keyData.defaultValue
                    }
                } else {
                    newSettings[key] = currentSettings[key]
                }
            }
        }
        newFullSetting[namespace] = newSettings
    }
    chrome.storage.local.set(newFullSetting)
}
/**
 * Performs necessary actions when the extension is installed or updated.
 * @returns {Promise<void>} A promise that resolves when the actions are completed.
 */
async function onInstalled() {
    logger("[EVENT] onInstalled")
    await fillSettingsStorage()
    chrome.storage.local.set({
        "persistentData": {
            lastSeenPopupVersion: chrome.runtime.getManifest().version,
        }
    });
}


//---------------------BINDINGS------------------------
chrome.runtime.onInstalled.addListener(onInstalled);  //On install or on update
chrome.runtime.onStartup.addListener(onLaunch); //  On startup

