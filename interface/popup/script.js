let extensionScannerState
let extensionState






//----------- UI ACTIONS ----------------
function bindActions() {
    //Scanner select

    document.getElementById("scannerSelect").addEventListener("change", async () => {
        let value = document.getElementById("scannerSelect").value;
        updateSelectorColor()
        console.log("Selected scanner", extensionState)
        chrome.storage.local.set({
            "extension-state": {
                stopped: extensionState.stopped,
                scanners: extensionState.scanners,
                selectedScanner: value,
                connected: extensionState.connected,
            },
        });

        if (document.getElementById("scannerSelect").value == "none" && extensionState.stopped == false) {
            chrome.storage.local.set({
                "extension-scanner-state": {
                    paused: true,
                    title: "",
                    subtitle: "",
                    currentTime: 0,
                    currentLength: 0,
                    url: "",
                    cover: "",
                },
            });
        }
    });


    //Start
    document.getElementById("start").addEventListener("click", async () => {
        chrome.storage.local.set({
            "extension-state": {
                stopped: false,
                scanners: extensionState.scanners,
                selectedScanner: extensionState.selectedScanner,
                connected: extensionState.connected,
            },
        });
        if (document.getElementById("scannerSelect").value == "none") {
            chrome.storage.local.set({
                "extension-scanner-state": {
                    paused: true,
                    title: "",
                    subtitle: "",
                    currentTime: 0,
                    currentLength: 0,
                    url: "",
                    cover: "",
                },
            });
        }
    });

    //Stop
    document.getElementById("stop").addEventListener("click", async () => {
        chrome.storage.local.set({
            "extension-state": {
                stopped: true,
                scanners: extensionState.scanners,
                selectedScanner: extensionState.selectedScanner,
                connected: extensionState.connected,
            },
        });

        chrome.storage.local.set({
            "extension-scanner-state": {
                paused: true,
                title: "Extension stopped",
                subtitle: "",
                currentTime: 0,
                currentLength: 0,
                url: "",
                cover: "",
            },
        });
    });
}

//----------- UI SETTERS ----------------
function setTitleDisplay(text) {
    document.getElementById("titleDisplay").innerHTML = text
}

function setSubtitleDisplay(text) {
    document.getElementById("subtitleDisplay").innerHTML = text
}

function setState() {
    //paused, active, inactive, disconnected


    if (extensionState.stopped == true) {
        document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: ${chrome.i18n.getMessage("Inactive")}`;
        document.getElementById("stop").setAttribute("customDisable", "");
        document.getElementById("start").removeAttribute("customDisable")
        document.getElementById("statusDisplay").className = "inactive";
    } else if (extensionScannerState.paused == true) {
        document.getElementById("start").setAttribute("customDisable", "");
        document.getElementById("stop").removeAttribute("customDisable")
        document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: ${chrome.i18n.getMessage("paused")} <br> ${chrome.i18n.getMessage("Listening_to")}: ${extensionState.selectedScanner}`;
        document.getElementById("statusDisplay").className = "paused";
    } else if (extensionState.connected == false) {
        document.getElementById("start").setAttribute("customDisable", "");
        document.getElementById("stop").removeAttribute("customDisable")
        document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: ${chrome.i18n.getMessage("waiting_connecting")} <br> ${chrome.i18n.getMessage("Listening_to")}: ${extensionState.selectedScanner}`;
        document.getElementById("statusDisplay").className = "disconnected";
    } else {
        document.getElementById("start").setAttribute("customDisable", "");
        document.getElementById("stop").removeAttribute("customDisable")
        document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: ${chrome.i18n.getMessage("active")} <br> ${chrome.i18n.getMessage("Listening_to")}: ${extensionState.selectedScanner}`;
        document.getElementById("statusDisplay").className = "active";
    }
}

function updateAvailableScanners() {
    console.log(extensionState, "extensionState")
    let scanners = extensionState.scanners;
    let select = document.getElementById("scannerSelect");
    let innerHTML = `<option value="none" style="background-color: #1f1d1d" selected="selected">None</option>`
    for (let scanner of scanners) {

        let option = document.createElement("option");
        option.value = scanner.tabId;
        option.innerHTML = fitStringToWidth(scanner.title, 170);
        option.style.backgroundColor = getPlatformConfig(scanner.platform).color;


        innerHTML += option.outerHTML;
    }

    select.innerHTML = innerHTML;
    select.value = extensionState.selectedScanner;
    updateSelectorColor()
}

function updateSelectorColor() {
    let value = document.getElementById("scannerSelect").value;
    let platform = extensionState.scanners.find((scanner) => scanner.tabId == value) == undefined ? "none" : extensionState.scanners.find((scanner) => scanner.tabId == value).platform;
    document.getElementById("scannerSelect").style.backgroundColor = getPlatformConfig(platform).color;
}

//----------- UTILITIES -----------------
function getState() {
    if (extensionState.stopped == true) {
        return "inactive"
    }

    if (extensionScannerState.paused == true) {
        return "paused"
    }

    if (extensionScannerState.connected == false) {
        return "Waiting for server connection..."
    }

    return "active"
}

function translator() {
    let elements = document.querySelectorAll("[translated]");
    elements.forEach((element) => {
        try {
            let translation = chrome.i18n.getMessage(element.innerHTML.replaceAll(" ", "_").replace(/[^\x00-\x7F]/g, ""));
            if (translation != "") {
                element.innerHTML = translation;
            }
        } catch (error) {
            console.warn("[TRANSLATOR] - Failed to translate for:", element.innerHTML, error);
        }
    });
}

function _escTag(s) {
    return s.replace("<", "&lt;").replace(">", "&gt;");
}

function getTextWidth(str, className) {
    let span = document.createElement("span");
    if (className) span.className = className;
    span.style.display = "inline";
    span.style.visibility = "hidden";
    span.style.padding = "0px";
    document.body.appendChild(span);
    span.innerHTML = _escTag(str);
    let w = span.offsetWidth;
    document.body.removeChild(span);
    return w;
}

function fitStringToWidth(str, width, className) {
    var span = document.createElement("span");
    if (className) span.className = className;
    span.style.display = "inline";
    span.style.visibility = "hidden";
    span.style.padding = "0px";
    document.body.appendChild(span);
    var result = _escTag(str);
    span.innerHTML = result;
    if (span.offsetWidth > width) {
        var posStart = 0,
            posMid,
            posEnd = str.length,
            posLength;
        while ((posLength = (posEnd - posStart) >> 1)) {
            posMid = posStart + posLength;
            span.innerHTML = _escTag(str.substring(0, posMid)) + "&hellip;";
            if (span.offsetWidth > width) posEnd = posMid;
            else posStart = posMid;
        }
        result = '<abbr title="' + str.replace('"', "&quot;") + '">' + _escTag(str.substring(0, posStart)) + "&hellip;</abbr>";
    }
    document.body.removeChild(span);
    return result;
}

function getPlatformConfig(platform) {
    return extensionConfig.scanners.find((scanner) => scanner.platform == platform);
}

//-------- STORAGE MANAGEMENT -----------
const promises = [];
promises.push(new Promise(async (resolve, reject) => {
    extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    resolve();
}))

promises.push(new Promise(async (resolve, reject) => {
    extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
    resolve();
}))

chrome.storage.onChanged.addListener(async (object, areaName) => {
    if (areaName != "local") {
        return;
    }
    if (object["extension-state"] != undefined) {
        extensionState = object["extension-state"].newValue;
        update();
    }
    if (object["extension-scanner-state"] != undefined) {
        extensionScannerState = object["extension-scanner-state"].newValue;
        update();
    }
});

//----------- ON LAUNCH ------------------

let loaded = false

Promise.all(promises).then(() => {
    if (loaded) {
        update();
        updateAvailableScanners();
        translator();
        bindActions();
    } else {
        document.addEventListener("DOMContentLoaded", update);
        document.addEventListener("DOMContentLoaded", translator);
        document.addEventListener("DOMContentLoaded", bindActions);
        document.addEventListener("DOMContentLoaded", updateAvailableScanners);
    }
})

function update() {
    setTitleDisplay(extensionScannerState.title);
    setSubtitleDisplay(extensionScannerState.subtitle);

    setState();

    updateAvailableScanners();
}

document.addEventListener("DOMContentLoaded", () => { loaded = true });
