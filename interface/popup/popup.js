document.getElementById("start").addEventListener("click", async ()=>{
    tabID = document.getElementById("tabSelector").value
    if(tabID != "" && tabID){
    chrome.storage.local.set({ activeScanner: tabID });
    }
});

document.getElementById("stop").addEventListener("click", async ()=>{
    chrome.storage.local.set({ activeScanner: "0" });
});

document.getElementById("update").addEventListener("click", async ()=>{
    chrome.storage.local.set({ updateRequired: true });
});

document.getElementById("force").addEventListener("click", async ()=>{
    var query = { active: true, currentWindow: true };
    function callback(tabs) {
        var currentTab = tabs[0]; 
        console.log(currentTab); 
        json = JSON.stringify({tabId: currentTab.id})
        chrome.runtime.sendMessage({ text: "FORCEINJECT__JSON__"+json })
    }
    chrome.tabs.query(query, callback);
});


async function updateTabs(){

    let scanners = (await chrome.storage.local.get("scanners")).scanners;
    let ids = []
    for(var i = 0; i < scanners.length; i++) {
        var opt = scanners[i];
        if(!document.getElementById("TABS_"+opt.tabId)){
        var el = document.createElement("option");
        el.textContent = opt.title.substring(0,15)+"...";
        el.value = opt.tabId;
        el.id = "TABS_"+opt.tabId
        document.getElementById("tabSelector").appendChild(el);
       
        }
        ids.push("TABS_"+opt.tabId)
    }
    Array.from(document.getElementById("tabSelector").options).forEach(function(option_element) {
        
        if(ids.includes(option_element.id) == false){
            option_element.remove()
        }
    });
}

async function updateStatus(){
    let state = (await chrome.storage.local.get("state")).state;
    document.getElementById("display_title").innerHTML = state.title
    document.getElementById("display_chapter").innerHTML = state.chapter

    let activeScanner = (await chrome.storage.local.get("activeScanner")).activeScanner;
    if(activeScanner == 0){
        document.getElementById("status").innerHTML = "Not running"
        document.getElementById("status").style = "color: red"
    }else if(state.paused == true){
        document.getElementById("status").innerHTML = "Paused"
        document.getElementById("status").style = "color: rgb(235, 141, 18)"
    }else{
        document.getElementById("status").innerHTML = "Running on tab: " + activeScanner
        document.getElementById("status").style = "color: green"
    }
}

async function loop(){
    updateTabs()

    updateStatus()
}

loop()

setInterval(loop,1000)