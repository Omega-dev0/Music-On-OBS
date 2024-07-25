let extensionScannerState
let extensionState
let extensionSettings
let spotifyAPIState
let extensionConfig
let DataBinds

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
                "detectPause": {
                    save: true,
                    load: true,
                    element: document.getElementById("detectPause")
                },
                "displayOnlyOnSongChange":{
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
    let redirect_url = `chrome-extension://${chrome.runtime.id}/interface/spotifyAuth/index.html`
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
    if(extensionState.selectedScanner == "spotifyAPI"){
        extensionState.selectedScanner = "none"
        extensionState.scanners = extensionState.scanners.filter((scanner) => {
            return scanner.platform != "spotifyAPI";
        });
        chrome.storage.local.set({ "extension-state": extensionState });
    }
}

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
            if(div.getAttribute("outsideLink") == "true"){
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
            return }
        //create preview
        let message = document.getElementById("defaultMessage").value
        message = message.replaceAll("[__SONG__]", "Billie Jean")
        message = message.replaceAll("[__SUBTITLE__]", "Michael Jackson")
        message = message.replaceAll("[__LINK__]", "https://www.youtube.com/watch?v=Zi_XLOBDo_Y")
        message = message.replaceAll("[__TIME__]", "1:34")
        message = message.replaceAll("[__DURATION__]", "2:14")
        document.getElementById("integrationPopupPreview").innerHTML = message
        document.getElementById("commandPopup").style.display = "flex";
    });

    //integration popup binds

    //close
    document.getElementById("integrationPopupClose").addEventListener("click", () => {
        document.getElementById("commandPopup").style.display = "none";
    });

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

    document.getElementById("spotifyLogin").addEventListener("click", () => {
        startSpotifyLoginProcedure()
    })

    document.getElementById("spotifyLogout").addEventListener("click", () => {
        spotifyLogOut()
    })
}
function checkInstanceStatus() {
    if (!isInstanceValid()) {
        //DISABLE SOME STUFF
        document.getElementById("integrationCommandCopy").setAttribute("customDisable", true)
        document.getElementById("copyInstanceLink").setAttribute("customDisable", true)
    } else {
        document.getElementById("integrationCommandCopy").removeAttribute("customDisable")
        document.getElementById("copyInstanceLink").removeAttribute("customDisable")
    }
}

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
    let url = `${extensionConfig.serverAdress}/${route}?token=${extensionSettings.instance.publicToken}`
    
    if (additionnalArgs == undefined) {
        return url
    }
    let args = additionnalArgs.join("&")
    url += "&" + args
    return url
}
function isInstanceValid() {
    return extensionSettings.instance.privateToken == "" ? false : true
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
    console.log("[STORAGE] Updated", extensionState, extensionScannerState, extensionSettings)
});

//---------------ON LAUNCH--------------

function saveSettings() {
    console.log("Saving settings")

    //extension settings
    for (let categorie in DataBinds.extensionSettings) {
        console.log(">>>", categorie, DataBinds.extensionSettings[categorie])
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
            console.log(key, doc)
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
    document.addEventListener("DOMContentLoaded", () => {
        defineDataBinds()
        translator()
        loadSettings()
        bindEvents()
        checkSpotifyCredentialsStatus()
        checkInstanceStatus()
        checkSpotifyLoggedStatus()
    });
})

