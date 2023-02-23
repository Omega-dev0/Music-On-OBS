function translator() {
  let elements = document.querySelectorAll("[translated]");
  elements.forEach((element) => {
    try {
      element.innerHTML = chrome.i18n.getMessage(element.innerHTML.replaceAll(" ", "_").replace(/[^\x00-\x7F]/g, ""));
    } catch (error) {
      console.warn("[TRANSLATOR] - Failed to translate for:", element.innerHTML, error);
    }
  });
}

async function update(){
  let extensionScannerState = (await chrome.storage.local.get("extension-scanner-state"))["extension-scanner-state"];
  let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];

  document.getElementById("titleDisplay").innerHTML = extensionScannerState.title
  document.getElementById("subtitleDisplay").innerHTML = extensionScannerState.subtitle
  if(extensionScannerState.paused == true){
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Paused`
    document.getElementById("statusDisplay").className = "paused"
  }else{
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Active`
    document.getElementById("statusDisplay").className = "active"
  }
  if(extensionState.stopped == true){
    document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Inactive`
    document.getElementById("statusDisplay").className = "inactive"
  }
}

chrome.storage.onChanged.addListener(async (object, areaName) => {
  if(areaName != "local"){return}
  if(object["extension-scanner-state"]!= undefined){
    let data = object["extension-scanner-state"].newValue
    document.getElementById("titleDisplay").innerHTML = data.title
    document.getElementById("subtitleDisplay").innerHTML = data.subtitle
    if(data.paused == true){
      document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Paused`
      document.getElementById("statusDisplay").className = "paused"
    }else{
      document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Active`
      document.getElementById("statusDisplay").className = "active"
    }
  }
  if(object["extension-state"]!= undefined){
    let data = object["extension-state"].newValue
    if(data.stopped == true){
      document.getElementById("statusDisplay").innerHTML = `${chrome.i18n.getMessage("Status")}: Inactive`
      document.getElementById("statusDisplay").className = "inactive"
    }
    let html = ``
    /*
    {
      tabId:""
      name:""
    }
    
    for(let i;i=0;i<=data.scanners.length){
      scanner = data.scanners[i]
      html += ``
    }
    */
   //TODO
  }
});

document.addEventListener("DOMContentLoaded", update);
document.addEventListener("DOMContentLoaded", translator);
