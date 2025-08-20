
let socket = null;
let hasWarned = false;

/**
 * Connects to the server using socket.io.
 */
async function connectToServer() {
    if (socket) {
        console.warn("[SOCKET] Already connected to the server, skipping connection")
        return
    }
    if (extensionConfig.fakeServerConnection) {
        if (hasWarned) return
        console.warn("[SOCKET] Fake server connection enabled")
        hasWarned = true
        return
    }
    if (io == undefined) {
        console.warn("[SOCKET] Socket IO failed to load, skipping connection")
        return
    }

    let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"];
    if (!extensionSettings || !extensionSettings.instance || !extensionSettings.instance.privateToken || !extensionSettings.instance.publicToken) {
        console.error("[SOCKET] Extension settings or instance data not found, cannot connect to server");
        return;
    }
    console.log("Extension settings", extensionSettings)
    socket = await io(extensionConfig.serverAdress, {
        randomizationFactor: 0.9,
        auth: {
            privateToken: extensionSettings.instance.privateToken,
            publicToken: extensionSettings.instance.publicToken,
        },
        transports: ["websocket"],
    })
    logger(socket)


    socket.on("connect", async () => {
        logger(`[SOCKET] Connected to ${extensionConfig.serverAdress}, id: ${socket.id}`, socket)

        syncSettingsState()
        syncScannerState()

        let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
        chrome.storage.local.set({
            "extension-state": {
                stopped: extensionState.stopped,
                scanners: extensionState.scanners,
                selectedScanner: extensionState.selectedScanner,
                connected: true,
            },
        });
    })

    socket.on("connect_error", (error) => {
        logger(`[SOCKET] Failed to connect to ${extensionConfig.serverAdress}`, error)
    })

    socket.on("disconnect", async () => {
        logger(`[SOCKET] Disconnected from ${extensionConfig.serverAdress}`, socket)
        let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
        chrome.storage.local.set({
            "extension-state": {
                stopped: extensionState.stopped,
                scanners: extensionState.scanners,
                selectedScanner: extensionState.selectedScanner,
                connected: false,
            },
        });
    })
}

async function disconnectFromServer() {
    if (socket == null) {
        console.log("[SOCKET] Not connected to the server, skipping disconnection")
        return
    }
    if (extensionConfig.fakeServerConnection) {
        console.warn("[SOCKET] Fake server connection enabled, skipping disconnection")
        return
    }

    socket.disconnect();
    socket = null;
    logger("[SOCKET] Disconnected from server");

    let extensionState = (await chrome.storage.local.get("extension-state"))["extension-state"];
    chrome.storage.local.set({
        "extension-state": {
            stopped: extensionState.stopped,
            scanners: extensionState.scanners,
            selectedScanner: extensionState.selectedScanner,
            connected: false,
        },
    });
}

/**
 * Contacts the server using the specified event and payload.
 * @param {string} eventName - The eventName to emit the payload on.
 * @param {any} payload - The data to send to the server.
 * @returns {Promise<any>} - A promise that resolves with the server response.
 */
function emitServerEvent(eventName, payload) {
    if (extensionConfig.fakeServerConnection) {
        return new Promise((resolve, reject) => { resolve(fakePackets(eventName, payload)) })
    }
    return new Promise((resolve, reject) => {
        if (!socket || !socket.connected) {
            console.warn(`[SOCKET] Not connected to the server, cannot emit event: ${eventName}`);
            return
        }
        console.log(`[SOCKET] Emitting event: ${eventName}`, payload);
        socket.emit(eventName, payload, (response) => {
            resolve(response);
        });
    });
}


function fakePackets(eventName, payload) {
    console.log(`[FAKE] ${eventName}`, payload)
    if (eventName == "instance-create") {
        return { publicToken: "publicTokenTest", privateToken: "privateTokenTest" }
    }

    return {}
}