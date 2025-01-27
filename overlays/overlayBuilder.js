function openJSON(path) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                const status = xhr.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject("Failed to open JSON file", path);
                }
            }
        };
        xhr.open("GET", path, true);
        xhr.send();
    });
}


function replace(string, data) {
    let keys = Object.keys(data);
    for (let key of keys) {
        string = string.replaceAll(`$${key}`, data[key]);
    }
    return string;
}

async function buildOverlayData(overlay,config){
    let baseData = await openJSON(`/overlays/overlayConfigs/${overlay}.json`);


    let rawData = JSON.stringify(baseData);   
    //UI BASED SETTINGS 
    rawData = replace(rawData, {
        '$TITLE_COLOR': config.titleColor,
        "$HIDE_TITLE": config.hideTitle,

        "$PRIMARY_COLOR": config.primaryColor,
        "$SECONDARY_COLOR": config.secondaryColor,

        "$SUBTITLE_COLOR": config.subtitleColor,
        "$HIDE_SUBTITLE": config.hideSubtitle,

        "$HIDE_COVER": config.hideCover,

        "$HIDE_PROGRESS": config.hideProgress,
        "$PROGRESS_PRIMARY_COLOR": config.progressColor,
        "$PROGRESS_SECONDARY_COLOR": config.progressSecondaryColor,
    });

    
}

async function applyOverlayMetadata(data) {
    let newData = {
        ...data,
        
    }
}