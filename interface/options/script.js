let extensionScannerState
let extensionState
let extensionSettings
let spotifyAPIState
let extensionConfig
let DataBinds
let loaded = false

//------------------DATA BINDS----------
function defineDataBinds() {
    DataBinds = {
        "extensionSettings": {
            "instance": {
                "privateToken": {
                    save: false,
                    load: true,
                    element: null
                },
                "publicToken": {
                    save: false,
                    load: true,
                    element: document.getElementById("publicToken")
                },
            },
            "spotifyAPI": {
                "spotifyId": {
                    save: true,
                    load: true,
                    element: document.getElementById("spotifyId")
                },
                "spotifyAppToken": {
                    save: true,
                    load: true,
                    element: document.getElementById("spotifyAppToken")
                },
                "spotifyRefreshToken": {
                    save: false,
                    load: true,
                    element: null
                },
            },
            "behaviour": {
                "displayPause": {
                    save: true,
                    load: true,
                    element: document.getElementById("displayPause")
                },
                "displayOnlyOnSongChange": {
                    save: true,
                    load: true,
                    element: document.getElementById("displaySongChange")
                }
            },
            "integration": {
                "defaultMessage": {
                    save: true,
                    load: true,
                    element: document.getElementById("defaultMessage")
                },
                "pausedMessage": {
                    save: true,
                    load: true,
                    element: document.getElementById("pausedMessage")
                },
                "errorMessage": {
                    save: true,
                    load: true,
                    element: document.getElementById("errorMessage")
                },
            },
            "overlay": {
                primaryColor: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayPrimaryColor")
                },
                secondaryColor: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlaySecondaryColor")
                },
                displayCover:
                {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayUseCover")
                },
                useCoverForGradientColors: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayUserCoverAsContent")
                },
                useCoverImage: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayUseImageAsContent")
                },
                titleColor: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayTitleColor")
                },
                subtitleColor: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlaySubtitleColor")
                },
                displayTitle: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayDisplayTitle")
                },
                displaySubtitle: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayDisplaySubtitle")
                },
                progressBarColor: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayProgressBarColor")
                },
                displayProgress: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayDisplayProgressBar")
                },
                progressBarBackgroundColor: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayProgressBarBackgroundColor")
                },
                titleFont: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayTitleFont")
                },
                subtitleFont: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlaySubtitleFont")
                },
                progressFont: {
                    save: true,
                    load: true,
                    element: document.getElementById("overlayProgressFont")
                }
            }
        }
    }
}

//------------CONTAINER SWITCHING-------
function showContainer(id) {
    for (let i = 0; i < document.getElementsByClassName("container").length; i++) {
        let container = document.getElementsByClassName("container")[i];
        if (container.id != id) {
            container.style = "display: none;";
        } else {
            container.style = "display: flex;";
        }
    }
    id = id.toLowerCase() + "-button";
    for (let i = 0; i < document.getElementsByClassName("sidebar-element").length; i++) {
        let container = document.getElementsByClassName("sidebar-element")[i];
        if (container.id != id) {
            container.classList.remove("sidebar-selected");
        } else {
            container.classList.add("sidebar-selected");
        }
    }
}

//---------------SPOTIFY AUTH-----------
function checkSpotifyCredentialsStatus() {
    if (extensionSettings.spotifyAPI.spotifyId != "" && extensionSettings.spotifyAPI.spotifyAppToken != "" && extensionSettings.spotifyAPI.spotifyRefreshToken == "") {
        //Available
        document.getElementById("spotifyLogin").removeAttribute("customDisable")
    } else {
        //Unavailable
        document.getElementById("spotifyLogin").setAttribute("customDisable", true)
    }
    let redirect_url = `chrome-extension://${chrome.runtime.id}/interface/spotifyAuth/index.html`
    document.getElementById("spotifyRedirectURI").value = redirect_url;
}
function startSpotifyLoginProcedure() {
    if (extensionSettings.spotifyAPI.spotifyId == "" || extensionSettings.spotifyAPI.spotifyAppToken == "") {
        alert(chrome.i18n.getMessage("spotifyCredentialsMissing"));
        return
    }
    if (extensionSettings.spotifyAPI.spotifyRefreshToken != "") {
        alert(chrome.i18n.getMessage("spotifyAlreadyLogged"));
        return
    }

    window.open(`https://accounts.spotify.com/authorize?response_type=code&redirect_uri=${redirect_url}&client_id=${extensionSettings.spotifyAPI.spotifyId}&state=MOS&scope=user-read-currently-playing&show_dialog=true`, "_blank")
}
function checkSpotifyLoggedStatus() {
    if (extensionSettings.spotifyAPI.spotifyRefreshToken != "") {
        document.getElementById("spotifyStatus").innerHTML = chrome.i18n.getMessage("spotifyLogged");
        document.getElementById("spotifyLogout").removeAttribute("customDisable")
        document.getElementById("spotifyLogin").setAttribute("customDisable", true)
    } else {
        document.getElementById("spotifyStatus").innerHTML = chrome.i18n.getMessage("spotifyNotLogged");
        document.getElementById("spotifyLogin").removeAttribute("customDisable")
        document.getElementById("spotifyLogout").setAttribute("customDisable", true)
    }
}
async function spotifyLogOut() {
    extensionSettings.spotifyAPI.spotifyRefreshToken = ""
    chrome.storage.local.set({ "extension-settings": extensionSettings });
    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    if (extensionState.selectedScanner == "spotifyAPI") {
        extensionState.selectedScanner = "none"
        extensionState.scanners = extensionState.scanners.filter((scanner) => {
            return scanner.platform != "spotifyAPI";
        });
        chrome.storage.local.set({ "extension-state": extensionState });
    }
}

let importedOverlay = null

//-------------------BINDS--------------
function bindEvents() {
    //Checkbox title clickable bind
    for (let i = 0; i < document.getElementsByClassName("checkbox-container").length; i++) {
        let div = document.getElementsByClassName("checkbox-container")[i];
        div.children[1].addEventListener("click", () => {
            div.children[0].checked = !div.children[0].checked;
            saveSettings();
        });
    }

    //Sidebar div clickable bind
    for (let i = 0; i < document.getElementsByClassName("sidebar-element").length; i++) {
        let div = document.getElementsByClassName("sidebar-element")[i];

        div.addEventListener("click", () => {
            if (div.getAttribute("outsideLink") == "true") {
                window.open(div.children[1].getAttribute("data"), "_blank")
                return
            }
            showContainer(div.children[1].getAttribute("data"));
        });
    }

    //Save trigger bind
    let elements = document.querySelectorAll("[saveTrigger]");
    for (let i = 0; i < elements.length; i++) {
        let div = elements[i];
        div.addEventListener("change", () => {
            saveSettings();
        });
    }

    //copy integration command popup display
    document.getElementById("integrationCommandCopy").addEventListener("click", () => {
        if (!isInstanceValid()) {
            alert(chrome.i18n.getMessage("createAnInstanceFirst"));
            return
        }
        //create preview
        let message = document.getElementById("defaultMessage").value
        message = message.replaceAll("[SONG]", "Billie Jean")
        message = message.replaceAll("[SUBTITLE]", "Michael Jackson")
        message = message.replaceAll("[LINK]", "https://www.youtube.com/watch?v=Zi_XLOBDo_Y")
        message = message.replaceAll("[TIME]", "1:34")
        message = message.replaceAll("[DURATION]", "2:14")
        document.getElementById("integrationPopupPreview").innerHTML = message
        document.getElementById("commandPopup").style.display = "flex";
    });

    document.getElementById("changeStyle").addEventListener("click", () => {
        document.getElementById("overlayStylePopup").style.display = "flex";
    });



    //close
    document.getElementById("integrationPopupClose").addEventListener("click", () => {
        document.getElementById("commandPopup").style.display = "none";
    });

    //style popup binds
    document.getElementById("overlayStylePopupSave").addEventListener("click", async () => {
        document.getElementById("overlayStylePopup").style.display = "none";
        document.getElementById("overlayStylePreview").src = ``;
        document.getElementById("overlayStylePreview").style.display = "none";
        console.log("Saving overlay style", importedOverlay)
        if (importedOverlay != null) {
            let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
            extensionSettings.overlay.overlayDataType = importedOverlay.overlayDataType;
            extensionSettings.overlay.overlayData = importedOverlay.overlayData;
            chrome.storage.local.set({ "extension-settings": extensionSettings });
        }
        importedOverlay = null;
    });
    document.getElementById("overlayStyleImport").addEventListener("click", async () => {
        let content = await navigator.clipboard.readText()
        try {
            let json = JSON.parse(content)
            if (json.overlayDataType == undefined || json.overlayData == undefined) {
                throw new Error("Invalid overlay data format");
            }

            if (json.overlayPreview != undefined) {
                document.getElementById("overlayStylePreview").src = `${extensionConfig.serverAdress}${json.overlayPreview}`;
                document.getElementById("overlayStylePreview").style.display = "block";
            }

            importedOverlay = json;
            alert(`${chrome.i18n.getMessage("overlayStyleImported")}: ${json.overlayName}`);

        } catch (error) {
            console.error("[OVERLAY STYLE IMPORT] - Invalid ovverlay data", error, content);
            alert(chrome.i18n.getMessage("invalidOverlayStyle"));
            return
        }
    });
    document.getElementById("overlayStylesBrowserLink").href = `${extensionConfig.serverAdress}/overlays`



    //copy nighbot
    document.getElementById("integrationPopupNightbotCopy").addEventListener("click", () => {
        copyTextToClipboard(getNightbotCommand())
    })

    document.getElementById("integrationPopupSECopy").addEventListener("click", () => {
        copyTextToClipboard(getStreamlabsCommand())
    })

    document.getElementById("integrationPopupBotrixCopy").addEventListener("click", () => {
        copyTextToClipboard(getBotRixCommand())
    })
    /* document.getElementById("integrationPopupStreamerbotCopy").addEventListener("click", () => {
        copyTextToClipboard(getStreamerBotCommand())
        alert("")
    }) */

    document.getElementById("spotifyLogin").addEventListener("click", () => {
        startSpotifyLoginProcedure()
    })

    document.getElementById("spotifyLogout").addEventListener("click", () => {
        spotifyLogOut()
    })

    document.getElementById("createNewInstance").addEventListener("click", createInstance)
    document.getElementById("copyInstanceLink").addEventListener("click", copyInstanceLink)

}
function checkInstanceStatus() {
    if (!isInstanceValid()) {
        //DISABLE SOME STUFF
        document.getElementById("integrationCommandCopy").setAttribute("customDisable", true)
        document.getElementById("copyInstanceLink").setAttribute("customDisable", true)
    } else {
        document.getElementById("integrationCommandCopy").removeAttribute("customDisable")
        document.getElementById("copyInstanceLink").removeAttribute("customDisable")

        document.getElementById("instanceLink").value = getBaseURL("overlay")
    }
}

//-------- INSTANCE MANAGEMENT----------
function createInstance() {
    chrome.runtime.sendMessage({ key: "instance-create", payload: {} });
}
function copyInstanceLink() {
    copyTextToClipboard(document.getElementById("instanceLink").value)
}

//------------ GENERATE OVERLAY JSON ---------


//----------------UTILITIES-------------
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        alert(chrome.i18n.getMessage("textCopiedToClipboard"));
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        alert(chrome.i18n.getMessage("textCopiedToClipboard"));
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}
function getElementValue(doc) {
    if (doc.type == "checkbox") {
        return doc.checked;
    } else {
        return doc.value;
    }
}
function setElementValue(doc, value) {
    if (doc.type == "checkbox") {
        doc.checked = value;
    } else {
        doc.value = value;
    }
}
function getBaseURL(route, additionnalArgs) {
    let url = `${extensionConfig.serverAdress}/${route}/${extensionSettings.instance.publicToken}`

    if (additionnalArgs == undefined) {
        return url
    }
    let args = additionnalArgs.join("&")
    url += "?" + args
    return url
}
function isInstanceValid() {
    return extensionSettings.instance.privateToken == "" ? false : true
}
function setAboutPage() {
    let text = document.getElementById("platformsBox").innerHTML
    for (scanner of extensionConfig.scanners) {
        console.log(scanner)
        if (scanner.platform == "none" || scanner.disabled == true) continue
        let tooltip = ""
        if (scanner.notice != undefined) {
            tooltip = `tooltip="${scanner.notice}" style="color: orange;"`
        }
        text += `<label ${tooltip}>- ${scanner.name}</label><br>`
    }
    document.getElementById("platformsBox").innerHTML = text
    let manifest = chrome.runtime.getManifest()
    document.getElementById("extensionVersion").innerHTML = `${chrome.i18n.getMessage("extension_version")}: ${manifest.version_name}`
}

function setupTooltips() {
    document.querySelectorAll('[tooltip]').forEach(el => {
        let tooltipDiv;
        el.addEventListener('mouseenter', e => {
            tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'custom-tooltip';
            tooltipDiv.innerText = el.getAttribute('tooltip');
            document.body.appendChild(tooltipDiv);
            const rect = el.getBoundingClientRect();
            tooltipDiv.style.position = 'fixed';
            tooltipDiv.style.left = rect.left + 'px';
            tooltipDiv.style.top = (rect.bottom + 8) + 'px';
            tooltipDiv.style.zIndex = 9999;
            tooltipDiv.style.background = '#222';
            tooltipDiv.style.color = '#fff';
            tooltipDiv.style.padding = '4px 8px';
            tooltipDiv.style.borderRadius = '4px';
            tooltipDiv.style.fontSize = '12px';
            tooltipDiv.style.pointerEvents = 'none';
            tooltipDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        });
        el.addEventListener('mouseleave', e => {
            if (tooltipDiv) {
                tooltipDiv.remove();
                tooltipDiv = null;
            }
        });
    });
}

//--------------LOCALIZATION------------
function translator() {
    let elements = document.querySelectorAll("[translated]");
    elements.forEach((element) => {
        try {
            let translation = chrome.i18n.getMessage(
                element.innerHTML
                    .replaceAll(" ", "_")
                    .replace(/[^\x00-\x7F]/g, "")
                    .replaceAll(":", "")
                    .replaceAll("]", "")
                    .replaceAll("[", "")
                    .replaceAll(")", "")
                    .replaceAll("(", "")
            );
            if (translation == "") {
                element.classList.add("untranslated");
                return
            };
            element.innerHTML = translation

            if (element.title != "") {
                element.title = chrome.i18n.getMessage(
                    element.title
                        .replaceAll(" ", "_")
                        .replace(/[^\x00-\x7F]/g, "")
                        .replaceAll(":", "")
                        .replaceAll("]", "")
                        .replaceAll("[", "")
                        .replaceAll(")", "")
                        .replaceAll("(", "")
                );
            }

        } catch (error) {
            console.warn("[TRANSLATOR] - Failed to translate for:", element.innerHTML, error);
        }
    });
}

//----------INTEGRATION COMMANDS--------
function getNightbotCommand() {
    let command = `$(eval const api = $(urlfetch ${getBaseURL("integration", ["format=json"])}); if(api.error || api.url == "undefined"){"Unable to get current song name!"}else{api.m}; )`
    return command
}
function getStreamlabsCommand() {
    let command = `$(customapi ${getBaseURL("integration")})`
    return command
}
function getBotRixCommand() {
    let command = `fetch[${getBaseURL("integration")}]`
    return command
}



async function getStreamerBotCommand() {
    let object = {
        "meta": {
            "name": "MOS-Export",
            "author": "Omega77073",
            "version": "1.0.0",
            "description": "A command to use streamer.bot and MOS integration",
            "autoRunAction": null,
            "minimumVersion": null
        },
        "data": {
            "actions": [
                {
                    "id": "6978357c-d5d1-4e1b-991e-0fd173a38c22",
                    "queue": "00000000-0000-0000-0000-000000000000",
                    "enabled": true,
                    "excludeFromHistory": false,
                    "excludeFromPending": false,
                    "name": "MOS-Fetch",
                    "group": "",
                    "alwaysRun": true,
                    "randomAction": false,
                    "concurrent": true,
                    "triggers": [
                        {
                            "commandId": "93aef4f3-4115-4d61-b848-786deec4bf88",
                            "id": "6b5480fa-14d1-436b-9527-39d6d0d2a1e7",
                            "type": 401,
                            "enabled": true,
                            "exclusions": []
                        }
                    ],
                    "subActions": [
                        {
                            "url": getBaseURL("integration"),
                            "variableName": "mos-msg",
                            "headers": {},
                            "parseAsJson": false,
                            "autoType": false,
                            "id": "644bcf71-100d-47fa-892a-5157a14aad87",
                            "weight": 0.0,
                            "type": 1007,
                            "parentId": null,
                            "enabled": true,
                            "index": 0
                        },
                        {
                            "text": "%mos-msg%",
                            "useBot": true,
                            "fallback": true,
                            "id": "06a943e3-ed1b-47a9-bef9-32bfdff89b92",
                            "weight": 0.0,
                            "type": 10,
                            "parentId": null,
                            "enabled": true,
                            "index": 1
                        }
                    ],
                    "collapsedGroups": []
                }
            ],
            "queues": [],
            "commands": [
                {
                    "permittedUsers": [],
                    "permittedGroups": [],
                    "id": "93aef4f3-4115-4d61-b848-786deec4bf88",
                    "name": "MOS",
                    "enabled": false,
                    "include": false,
                    "mode": 0,
                    "command": "!music",
                    "regexExplicitCapture": false,
                    "location": 0,
                    "ignoreBotAccount": false,
                    "ignoreInternal": true,
                    "sources": 1,
                    "persistCounter": false,
                    "persistUserCounter": false,
                    "caseSensitive": false,
                    "globalCooldown": 0,
                    "userCooldown": 0,
                    "group": null,
                    "grantType": 0
                }
            ],
            "websocketServers": [],
            "websocketClients": [],
            "timers": []
        },
        "version": 23,
        "exportedFrom": "1.0.0",
        "minimumVersion": "1.0.0-alpha.1"
    }

    return getBaseURL("integration");
}
//------------STORAGE UPDATES-----------
chrome.storage.onChanged.addListener(async (object, areaName) => {
    if (areaName != "local") {
        return;
    }
    console.log("[STORAGE] Updated", object)
    if (object["extension-state"] != undefined) {
        extensionState = object["extension-state"].newValue;
    }
    if (object["extension-scanner-state"] != undefined) {
        extensionScannerState = object["extension-scanner-state"].newValue;
    }
    if (object["extension-settings"] != undefined) {
        extensionSettings = object["extension-settings"].newValue;
        checkSpotifyLoggedStatus()
        checkSpotifyCredentialsStatus()
        checkInstanceStatus()
        loadSettings()
    }
    if (object["spotifyAPI-state"] != undefined) {
        spotifyAPIState = object["spotifyAPI-state"].newValue;
    }
    //console.log("[STORAGE] Updated", extensionState, extensionScannerState, extensionSettings)
});

//---------------ON LAUNCH--------------

function saveSettings() {
    console.log("Saving settings")

    //extension settings
    for (let categorie in DataBinds.extensionSettings) {
        //console.log(">>>", categorie, DataBinds.extensionSettings[categorie])
        for (let key in DataBinds.extensionSettings[categorie]) {
            //console.log(key, DataBinds.extensionSettings[categorie][key])
            let doc = DataBinds.extensionSettings[categorie][key];
            if (doc.save == false) continue;
            if (doc.element == null) continue;
            extensionSettings[categorie][key] = getElementValue(doc.element)
        }
    }
    console.log(extensionSettings)
    chrome.storage.local.set({ "extension-settings": extensionSettings });
}
function loadSettings() {
    console.log("Loading settings")

    //extension settings
    for (let categorie in DataBinds.extensionSettings) {
        for (let key in DataBinds.extensionSettings[categorie]) {
            let doc = DataBinds.extensionSettings[categorie][key];
            if (doc.load == false) continue;
            if (doc.element == null) continue;
            if (extensionSettings[categorie][key] == undefined) {
                setElementValue(doc.element, "")
            } else {
                setElementValue(doc.element, extensionSettings[categorie][key])
                doc.element.setAttribute("correctlyLoaded", true)
            }

        }
    }
    console.log(extensionSettings)
}

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
    spotifyAPI = (await chrome.storage.local.get("spotifyAPI-settings"))["spotifyAPI-settings"];
    resolve();
}))

promises.push(new Promise(async (resolve, reject) => {
    extensionConfig = (await chrome.storage.local.get("extensionConfig"))["extensionConfig"];
    resolve();
}))

Promise.all(promises).then(() => {
    console.log("Background worker ready")

    let init = () => {
        defineDataBinds()
        translator()
        loadSettings()
        bindEvents()
        checkSpotifyCredentialsStatus()
        checkInstanceStatus()
        checkSpotifyLoggedStatus()
        setAboutPage()
        showContainer("Instance")
        setupTooltips()
    }

    if (loaded) {
        init()
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            init()
        })
    }


})

document.addEventListener("DOMContentLoaded", () => {
    loaded = true
})