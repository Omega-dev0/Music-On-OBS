
//---------------------ON LAUNCH------------------------
async function onLaunch() {
    logger("[EVENT] onLaunch")
    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    chrome.storage.local.set({
        "extension-state": {
            stopped: true,
            scanners: extensionState.scanners,
            selectedScanner: "none",
            connected: false
        },
        "extension-scanner-state": {
            paused: false,
            title: "",
            subtitle: "",
            currentTime: "",
            currentLength: "",
            url: "",
            cover: "",
        }
    });
    spotifyScannerInit()
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
                defaultValue: false,
                legacySwitch: {
                    category: "behaviour",
                    key: "displayPause"
                }
            },
            displayOnlyOnSongChange: {
                defaultValue: false,
                legacySwitch: {
                    category: "behaviour",
                    key: "displayOnSongChange"
                }
            }
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
        overlay: {
            overlayDataType: {
                defaultValue: "string",
                legacySwitch: {
                    category: "overlay",
                    key: "overlayDataType"
                }
            },
            overlayData: {
                defaultValue: "default",
                legacySwitch: {
                    category: "overlay",
                    key: "overlayData"
                }
            },
            primaryColor: {
                defaultValue: "#b94901",
                legacySwitch: {
                    category: "overlay",
                    key: "primaryColor"
                }
            },
            secondaryColor: {
                defaultValue: "#0013ff",
                legacySwitch: {
                    category: "overlay",
                    key: "secondaryColor"
                }
            },
            titleColor: {
                defaultValue: "#ffffff",
                legacySwitch: {
                    category: "overlay",
                    key: "titleColor"
                }
            },
            subtitleColor: {
                defaultValue: "#DEDEDE",
                legacySwitch: {
                    category: "overlay",
                    key: "subtitleColor"
                }
            },
            displayTitle: {
                defaultValue: true,
                legacySwitch: {
                    category: "overlay",
                    key: "displayTitle"
                },
            },
            displaySubtitle: {
                defaultValue: true,
                legacySwitch: {
                    category: "overlay",
                    key: "displaySubtitle"
                },
            },
            displayProgress: {
                defaultValue: true,
                legacySwitch: {
                    category: "overlay",
                    key: "displayProgress"
                },
            },
            displayCover: {
                defaultValue: true,
                legacySwitch: {
                    category: "overlay",
                    key: "displayCover"
                },
            },
            useCoverForGradientColors: {
                defaultValue: true,
                legacySwitch: {
                    category: "overlay",
                    key: "displayCoverOnContent"
                }
            },
            useCoverImage: {
                defaultValue: false,
                legacySwitch: {
                    category: "overlay",
                    key: "useCoverImage"
                }
            },
            progressBarColor: {
                defaultValue: "#334484",
                legacySwitch: {
                    category: "overlay",
                    key: "progressBarColor"
                }
            },
            progressBarBackgroundColor: {
                defaultValue: "#3f3f3fff",
                legacySwitch: {
                    category: "overlay",
                    key: "progressBarBackgroundColor"
                }
            },
            titleFont: {
                defaultValue: "https://fonts.googleapis.com/css2?family=Roboto:ital,wdth,wght@0,75..100,100..900;1,75..100,100..900&display=swap",
                legacySwitch: {
                    category: "overlay",
                    key: "titleFont"
                }
            },
            subtitleFont: {
                defaultValue: "https://fonts.googleapis.com/css2?family=Roboto:ital,wdth,wght@0,75..100,100..900;1,75..100,100..900&display=swap",
                legacySwitch: {
                    category: "overlay",
                    key: "subtitleFont"
                }
            },
            progressFont: {
                defaultValue: "https://fonts.googleapis.com/css2?family=Roboto:ital,wdth,wght@0,75..100,100..900;1,75..100,100..900&display=swap",
                legacySwitch: {
                    category: "overlay",
                    key: "progressFont"
                }
            }
        }
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
        connected: {
            defaultValue: false,
            forceReset: true,
        }
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
        isLive: {
            defaultValue: false,
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
                        } else {
                            newSettings[catKey][key] = keyData.defaultValue
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
                    } else {
                        newSettings[key] = keyData.defaultValue
                    }
                } else {
                    newSettings[key] = currentSettings[key]
                }
            }
        }
        newFullSetting[namespace] = newSettings
    }
    console.log(newFullSetting["extension-state"], "newFullSetting", (await chrome.storage.local.get())["extension-state"])
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





    onLaunch();
}


//---------------------BINDINGS------------------------
chrome.runtime.onInstalled.addListener(onInstalled);  //On install or on update
chrome.runtime.onStartup.addListener(onLaunch); //  On startup

