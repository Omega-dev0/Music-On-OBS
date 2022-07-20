$(eval 
const error_message = "Could not fetch current playlist !";
const message = "Current Playlist:";
const api = $(urlfetch json http://129.151.84.152:3000/get?token=TOKEN&format=json); if(api.error || api.url == "" || api.url == "undefined"){error_message}else{if(api.paused == false){`${message} ${api.url.split("https://www.")[1]}`}else{api.config.youtube.pausedText}};)

$(eval 
    const error_message = "Could not fetch current playlist !";
    const message = "Current Playlist:";
    const api = $(urlfetch json http://129.151.84.152:3000/get?token=eefe0571-a081-43bc-bd3c-6d1071d9bf96&format=json); if(api.error || api.url == "" || api.url == "undefined"){
        error_message
    }else{
        if(api.paused == false){`${message} ${api.url.split("https://www.")[1]}`
    }else{api.config.youtube.pausedText}};)