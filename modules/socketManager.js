
let socket = null;
let hasWarned = false;

/**
 * Connects to the server using socket.io.
 */
async function connectToServer() {
    if(extensionConfig.fakeServerConnection){
        if(hasWarned) return
        console.warn("[SOCKET] Fake server connection enabled")
        hasWarned = true
        return
    }
    if(io == undefined){
        console.warn("[SOCKET] Socket IO failed to load, skipping connection")
        return
    }

    socket = io(extensionConfig.serverAdress, {
        randomizationFactor: 0.9,
    })

    socket.on("connect", () => {
        logger(`[SOCKET] Connected to ${extensionConfig.serverAdress}, id: ${socket.id}`)
    })

    socket.on("createNewInstance", async (data) => {
        logger("[SOCKET] createNewInstance")

        let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
        extensionSettings.instance.privateToken = data.privateToken;
        extensionSettings.instance.publicToken = data.publicToken;

        chrome.storage.local.set({
            "extension-settings": extensionSettings,
        })
    })
}

/**
 * Contacts the server using the specified event and payload.
 * @param {string} eventName - The eventName to emit the payload on.
 * @param {any} payload - The data to send to the server.
 * @returns {Promise<any>} - A promise that resolves with the server response.
 */
function emitServerEvent(eventName, payload) {
    if(extensionConfig.fakeServerConnection){
        console.warn(`[SOCKET] Fake server connection enabled, not sending ${eventName}`)
        return new Promise((resolve, reject) => {resolve()})
    }
    return new Promise((resolve, reject) => {
        if (!socket) {
            reject("The extension is not connected to the server !")
        }
        socket.emit(eventName, payload, (response) => {
            resolve(response);
        });
    });
}