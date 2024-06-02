
//-------------------- SCANNER CLASS ----------------
class Scanner {
    constructor(platform, tabId) {
        this.platform = platform;
        this.tabId = tabId;
        this.allowed = false

        this.refreshInterval = 1000;
        this.registered = false
        this.additionalAllowedChecks = [];


        //Tab title changed
        new MutationObserver(function (mutations) {
            chrome.runtime.sendMessage({ key: "update-scanner", data: { platform: platform, title: document.title} });
        }).observe(document.querySelector("title"), { subtree: true, characterData: true, childList: true });

        this.updateScannerInfo();
    }

    async update(data) {
        if (this.registered == false) {
            await this.updateScannerInfo();
        }
        logger(this.settings.debug, `[MOS][SCANNER - UPDATE REQUEST]: (${this.platform}, ${this.tabId}): registered: ${this.registered}, allowed: ${this.allowed}`, this)
        await this.updateIfAllowed();
        if (!this.allowed) { return }

        if(data.currentTime != undefined){
            if(data.currentTime.includes(":")){
                data.currentTime = getTimeFromTimeString(data.currentTime, ":")
            }
        }

        if(data.currentLength != undefined){
            if(data.currentLength.includes(":")){
                data.currentLength = getTimeFromTimeString(data.currentLength, ":")
            }
        }





        if (JSON.stringify(this.data) == JSON.stringify(data)) { return }

        logger(this.settings.debug, "[SCANNER - UPDATE] Updating scanner with platform: " + this.platform)

        await chrome.storage.local.set({
            "extension-scanner-state": data
        })
        updateServer();
        this.data = data;
    }

    async updateIfAllowed() {
        let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
        console.log(extensionState)
        if (extensionState.stopped == true) { 
            this.allowed = false;
            return false 
        }
        if (this.tabId == undefined) { 
            this.allowed = false;
            return false
         }

        for(let check of this.additionalAllowedChecks){
            if(!check(this)){
                this.allowed = false;
                return false;
            }
        }

        let errorDetection = hasErrors(data)
        if(errorDetection.hasErrors == true){
            chrome.runtime.sendMessage({ key: "scanner-failure-report", data: errorDetection });
        }

        let selectedScanner = extensionState.selectedScanner;
        if (selectedScanner == this.tabId) {
            this.allowed = true;
            return true;
        } else {
            this.allowed = false;
            return false;
        }
    }

    async updateScannerInfo() {
        try {
            let response = await chrome.runtime.sendMessage({ key: "update-scanner", data: { platform: this.platform, title: document.title} });
            this.tabId = response.tabId;
            this.settings = response.settings;
            this.registered = true;
        } catch (error) {
            console.error(error)
        }
    }

    setAdditionalAllowedCheck(f){
        this.additionalAllowedChecks.push(f);
    }

    hasErrors(data){
        let fields = ["url", "title", "subtitle", "cover", "progress", "duration"];
        for(let field of fields){
            if(data[field] == undefined){
                return {
                    hasErrors: true,
                    field: field,
                    platform: this.platform,
                };
            }
        }
        return {
            hasErrors: false
        }
    }
}

//------------------------ UTILS --------------------
function updateServer() {
    
}

function getTimeFromTimeString(str, divider) {
    if (str == undefined) { return undefined }
    let split = str.split(divider);
    if (split.length == 1) {
        return parseInt(str);
    } else if (split.length == 2) {
        return parseInt(split[0]) * 60 + parseInt(split[1]);
    } else if (split.length == 3) {
        return parseInt(split[0]) * 3600 + parseInt(split[1]) * 60 + parseInt(split[2]);
    }
}

function logger(debug, ...message) {
    if (debug) {
        console.log(...message)
    }
}



