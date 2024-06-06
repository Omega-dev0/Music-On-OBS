let extensionScannerState
let extensionState
let extensionSettings
let spotifyAPIState
//------------------DATA BINDS----------
const DataBinds = {
    "extensionSettings":{
        "instance": {
            "privateToken": "",
            "publicToken": document.getElementById("publicToken"),
        },
        "spotifyAPI": {
            "spotifyId": document.getElementById("spotifyId"),
            "spotifyAppToken": document.getElementById("spotifyAppToken"),
            "spotifyRefreshToken": "",
        },
        "behaviour": {
            "displayPause": document.getElementById("displayPause"),
            "detectPause": document.getElementById("detectPause"),
        },
        "integration": {
            "defaultMessage": document.getElementById("defaultMessage"),
            "pausedMessage": document.getElementById("pausedMessage"),
            "errorMessage": document.getElementById("errorMessage"),
        },
    }
}

function saveSettings() {
    
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
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
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
    console.log("[STORAGE] Updated", extensionState, extensionScannerState, extensionSettings)
});

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
    spotifyAPI = (await chrome.storage.local.get("spotifyAPI-settings"))["spotifyAPI-settings"];
    resolve();
}))

Promise.all(promises).then(() => {
    console.log("Background worker ready")
})

document.addEventListener("DOMContentLoaded", () => {
    translator()
});