const manifest = chrome.runtime.getManifest();

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed");

  chrome.storage.local.set({ scanners: [] });
  chrome.storage.local.set({ activeScanner: "0" });

  const server_url = "http://129.151.84.152:3000";

  chrome.storage.local.set({ server_url: server_url });

  if (!(await chrome.storage.local.get("persistent")).persistent) {
    chrome.storage.local.set({
      persistent: {
        serverLink: server_url,
        token: "",
      },
    });
  }else{
    per = (await chrome.storage.local.get("persistent")).persistent
    chrome.storage.local.set({
      persistent: {
        serverLink: server_url,
        token: per.token,
      },
    });
  }

  chrome.storage.local.set({
    state: {
      title: "",
      chapter: "",
      paused: false,
      url: "",

      source: "",
    },
  });

  if (!(await chrome.storage.local.get("settings")).settings) {
    chrome.storage.local.set({
      settings: {
        token: "",
        serverLink: server_url,
        youtube: {
          detectPause: true,
          displayPause: false,
          pausedText: "The music is currently paused",

          displayTitle: true,
          displayChapter: true,
        },
      },
    });
  }
});

//Sending tabid to scanners


chrome.tabs.onRemoved.addListener(async (tabId,removeInfo)=>{
  console.log("Tab closed:", tabId)
  let scanners = (await chrome.storage.local.get("scanners")).scanners;
  filteredArray = scanners.filter(function(e) { return e.tabId !== tabId })
  chrome.storage.local.set({scanners : filteredArray})
})


function update(data) {
  return new Promise(async function (resolve, reject) {
    updating = true;
    chrome.storage.local.set({
      state: {
        title: data.title,
        chapter: data.chapter,
        paused: data.paused,
        url: data.url,

        source: data.source,
      },
    });
    console.log("State changed");

    let persistent = (await chrome.storage.local.get("persistent")).persistent;
    let server_url = persistent ? persistent.serverLink : (await chrome.storage.local.get("server_url")).server_url;

    let Rdata = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    data.token = persistent.token;
    Rdata.body = JSON.stringify(data);

    fetch(server_url + "/update", Rdata)
      .then(async (rawResponse) => {
        if (rawResponse.status == 200) {
          let json = await rawResponse.json();
          updating = false;
          resolve(json);
        } else {
          updating = false;
          console.log("ERROR",rawResponse);
          reject(rawResponse.status);
        }
      })
      .catch((err) => {
        updating = false;
        console.log("ERROR",err);
        reject(err)
      });
  });
}


async function processMsg(msg,sender){
  if (msg.text.split("__JSON__")[0] == "TABID_REQUEST") {
    console.log("TAB ID REQUEST")
    let scanners = (await chrome.storage.local.get("scanners")).scanners;
    scanners.push({ tabId: sender.tab.id, url: sender.tab.url, title: sender.tab.title });
    chrome.storage.local.set({scanners : scanners})
    return ({ tab: sender.tab });
  }else if(msg.text.split("__JSON__")[0] == "SERVER_UPDATE"){
    data = JSON.parse(msg.text.split("__JSON__")[1])
    update(data)
    .then((newdata) => {
      console.log("Updated data", newdata);
      json = {
        status: true,
        data: newdata,
        tabId: sender.tab.id
      }
      return ({done:true,data:newdata})
    })

    .catch((status) => {
      json = {
        status: false,
        data: status,
        tabId: (sender.tab) ? sender.tab.id : false
      }

      return ({done:false,data:status})
    });
  }else if(msg.text.split("__JSON__")[0] == "FORCEINJECT"){
    data = JSON.parse(msg.text.split("__JSON__")[1])
    chrome.scripting.executeScript({
      target: { tabId: data.tabId },
      files: ['/scanners/youtube.js']
    });
  }
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  processMsg(msg, sender).then(sendResponse);
  return true; // keep the messaging channel open for sendResponse
});

async function updateTabs(){
  new_scanners = []
  let scanners = (await chrome.storage.local.get("scanners")).scanners;
  for(var i = 0; i < scanners.length; i++) {
    opt = scanners[i];
    try {
    tab = await chrome.tabs.get(opt.tabId);
    if(tab){
      title = (tab.title) ? tab.title.replace(/^\(\d+\)\ /,'') : `Tab ${tab.id}`
      new_scanners.push({ tabId: tab.id, url: tab.url, title: title })
    }
    } catch(error) {
      console.log(error)
    }
  }

  chrome.storage.local.set({scanners: new_scanners})
}

setInterval(updateTabs,1000)



