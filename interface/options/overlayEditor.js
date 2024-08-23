const elements = {
    "progressBarLine": {
        elementId: "progressBarLine",
        name: "Progress Bar - Line",
        properties: {
            "width": {
                "name": "Width",
                "type": "px",
                "cssProperty": "--element-width",
                "value": "200",
            },
            "height": {
                "name": "Height",
                "type": "px",
                "cssProperty": "--element-height",
                "value": "5",
            },
            "Rotation": {
                "name": "Rotation",
                "type": "deg",
                "cssProperty": "--element-rotation",
                "value": "0",
            },
            "borderRadius": {
                "name": "Border Radius",
                "type": "px",
                "cssProperty": "--element-roundness",
                "value": "5",
            },
            "primaryColor": {
                "name": "Primary Color",
                "type": "color",
                "cssProperty": "--element-primary-color",
                "value": "#444444",
            },
            "secondaryColor": {
                "name": "Secondary Color",
                "type": "color",
                "cssProperty": "--element-secondary-color",
                "value": "#1688C8",
            },

        }
    },
    "progressBarCircle": {
        elementId: "progressBarCircle",
        name: "Progress Bar - Circle",
        properties: {
            "width": {
                "name": "Width",
                "type": "px",
                "cssProperty": "--element-width",
                "value": "100",
            },
            "height": {
                "name": "Height",
                "type": "px",
                "cssProperty": "--element-height",
                "value": "100",
            },
            "Rotation": {
                "name": "Rotation",
                "type": "deg",
                "cssProperty": "--element-rotation",
                "value": "0",
            },
            "lineWidth": {
                "name": "Thickness",
                "type": "",
                "cssProperty": "--element-line-width",
                "value": "40",
            },
            "primaryColor": {
                "name": "Primary Color",
                "type": "color",
                "cssProperty": "--element-primary-color",
                "value": "#444444",
            },
            "secondaryColor": {
                "name": "Secondary Color",
                "type": "color",
                "cssProperty": "--element-secondary-color",
                "value": "#1688C8",
            },

        }
    },
}


let CURRENT_OVERLAY_DATA = []

function getCssValue(value, type) {
    if (type == "color") {
        return value;
    } else {
        return `${value}${type}`;
    }
}

function ValueFromCss(element, propertyData) {
    let value = element.style.getPropertyValue(propertyData.cssProperty);
    if (propertyData.type == "color") {
        return value;
    } else {
        return value.replace(propertyData.type, "");
    }
}
let SELECTED = null
function buildElementsDisplay() {
    for (let key of Object.keys(elements)) {
        let elementData = elements[key];
        let element = document.getElementById(`OVERLAY_${elementData.elementId}`);
        for (let property of Object.keys(elementData.properties)) {
            let propertyData = elementData.properties[property];
            element.style.setProperty(propertyData.cssProperty, getCssValue(propertyData.value, propertyData.type));
        }
        document.getElementById("overlayElementsScroller").appendChild(element);
        function handleFirstClick(e) {
            if (e.button != 0) { return }
            let clone = element.cloneNode(true);
            clone.id = `OVERLAY_${elementData.elementId}-clone-${Math.random().toString(36).substring(7)}`;
            clone.style.position = "absolute";
            clone.classList.add("overlayComponent");
            clone.setAttribute("elementId", key);
            clone.style.left = `${e.clientX - e.offsetX}px`;
            clone.style.top = `${e.clientY - e.offsetY}px`;
            document.getElementById("canvas").appendChild(clone);
            stickElToMouse(e, clone);
            showPropertiesEditor(clone);
            if (SELECTED != null) {
                SELECTED.classList.remove("elementSelected");
            }
            SELECTED = clone;
            clone.classList.add("elementSelected");
            removeEventListener("mousedown", handleFirstClick);
        }
        element.addEventListener("mousedown", handleFirstClick);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    buildElementsDisplay();
});

let previousOverlayDataPoints = []
function buildOverlayData() {
    let containerAbsolutePos = document.getElementById("canvas").getBoundingClientRect();
    let data = []
    for (let element of document.getElementsByClassName("overlayComponent")) {
        let elementAbsolutePos = element.getBoundingClientRect();
        let elementId = element.getAttribute("elementId");
        let elementData = {
            id: element.id,
            type: elementId,
            x: elementAbsolutePos.left - containerAbsolutePos.left,
            y: elementAbsolutePos.top - containerAbsolutePos.top,
            properties: {}
        }
        for (let propertyKey of Object.keys(elements[elementId].properties)) {
            let propertyData = elements[elementId].properties[propertyKey];
            propertyData.value = ValueFromCss(element, propertyData);
            elementData.properties[propertyKey] = propertyData.value;
        }
        data.push(elementData);
    }
    console.log(data);
    CURRENT_OVERLAY_DATA = data;

    previousOverlayDataPoints.push(data);
    console.log(previousOverlayDataPoints);
    if (previousOverlayDataPoints.length > 100) {
        previousOverlayDataPoints.shift();
    }

    async () => {
        let extensionSettings = (await chrome.storage.local.get("extension-settings"))["extension-settings"]
        extensionSettings.overlay = {
            elementsData: data
        };
        chrome.storage.local.set({ "extension-settings": extensionSettings });
    }
}

function loadOverlayData(data) {
    
    console.log("laoding:",data);
    document.getElementById("canvas").innerHTML = "";
    let containerAbsolutePos = document.getElementById("canvas").getBoundingClientRect();
    for (let element of data) {
        let el = document.getElementById(`OVERLAY_${element.type}`);
        let clone = el.cloneNode(true);
        clone.id = element.id;
        clone.style.position = "absolute";
        clone.classList.add("overlayComponent");
        clone.setAttribute("elementId", element.id);
        clone.style.left = `${element.x + containerAbsolutePos.left}px`;
        clone.style.top = `${element.y + containerAbsolutePos.top}px`;

        for (let propertyKey of Object.keys(element.properties)) {
            let propertyData = elements[element.type].properties[propertyKey];
            propertyData.value = element.properties[propertyKey];
            clone.style.setProperty(propertyData.cssProperty, getCssValue(propertyData.value, propertyData.type));
        }
        document.getElementById("canvas").appendChild(clone);
    }
}

//---------------------------


function stickElToMouse(e, element) {
    let container = document.getElementById("canvas");
    let containerRect = container.getBoundingClientRect();
    let isMouseDown = true;
    let offsetX = e.offsetX;
    let offsetY = e.offsetY;

    function handleMouseDown(e) {
        if (e.button != 0) { return }

        isMouseDown = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        document.addEventListener("mousemove", handleMouseMove);

        showPropertiesEditor(element);
    }

    function handleMouseMove(e) {
        if (isMouseDown) {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }
    }

    function handleMouseUp() {
        containerRect = container.getBoundingClientRect();
        if (e.button != 0) { return }
        if (!isMouseDown) { return }
        isMouseDown = false;


        let elementCenter = {
            x: element.offsetLeft + element.offsetWidth / 2,
            y: element.offsetTop + element.offsetHeight / 2
        };

        if (
            elementCenter.x < containerRect.left ||
            elementCenter.x > containerRect.right ||
            elementCenter.y < containerRect.top ||
            elementCenter.y > containerRect.bottom
        ) {
            element.remove();
        }
        document.removeEventListener("mousemove", handleMouseMove);
        buildOverlayData();
    }

    element.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
}
document.addEventListener("mousedown", (e) => {
    e = e || window.event;

    let targetElement = (e.target || e.srcElement);

    while (true) {
        if (targetElement == document.getElementById("canvas") || targetElement.classList.contains("overlayElementContainer") || targetElement == null) {
            break;
        }
        targetElement = targetElement.parentElement;
    }
    let element = targetElement;
    if (element == null) { return; }
    if (targetElement == document.getElementById("canvas")) {
        if (SELECTED != null) {
            SELECTED.classList.remove("elementSelected");
        }
        SELECTED = null;
        document.getElementById("propertiesContainer").innerHTML = "";
        document.getElementById("properties_elementName").innerHTML = "";
    } else if (element.classList.contains("overlayComponent")) {
        if (SELECTED != null) {
            SELECTED.classList.remove("elementSelected");
        }
        SELECTED = element;
        element.classList.add("elementSelected");
    }
});

document.addEventListener("keydown", (e) => {
    console.log(e.key);
    if (e.key == "Delete" || e.key == "Backspace") {
        if (SELECTED != null) {
            SELECTED.remove();
            buildOverlayData();
        }
    }
    if (e.ctrlKey && e.key === "z") {
        return
        if (previousOverlayDataPoints.length <= 0) {
            alert("No more undos available");
            return;
        }
        loadOverlayData(previousOverlayDataPoints.pop());
    }
});

function createPropertyField(propertyData, id) {
    let translatedName = chrome.i18n.getMessage(`PROPERTY_${propertyData.Name}`)
    if (propertyData.type != "color" && propertyData.type != "text") {
        let field = `
    <div style="margin-top: 10px;">
      <label>${translatedName == "" ? propertyData.name : translatedName}: </label><input cssValue="${propertyData.cssProperty}" value="${propertyData.value}" type="number" id="${id}" style="width: 3.5rem; background-color: #3C3C3C; margin: 0px;outline: 0px;box-shadow: none; padding: 0.5vh 0.5vw; border-radius: 3px; color: white; border: 1px white solid;"/><label >${propertyData.type}</label><br />
    </div>`

        return field;
    } else if (propertyData.type == "color") {
        let field = `
    <div style="margin-top: 10px;">
      <label>${translatedName == "" ? propertyData.name : translatedName}: </label><input cssValue="${propertyData.cssProperty}" value="${propertyData.value}" type="color" id="${id}" style="width: 3.5rem; margin: 0px;outline: 0px;box-shadow: none color: white;"/><br />
    </div>`
        return field;
    }
}

function showPropertiesEditor(element) {
    document.getElementById("propertiesContainer").innerHTML = "";
    document.getElementById("properties_elementName").innerHTML = "";
    let elementId = element.getAttribute("elementId");
    let properties = elements[elementId].properties;

    let propertiesHtml = "";
    for (let property of Object.keys(properties)) {
        let id = `${elementId}-${property}`;
        propertiesHtml += createPropertyField(properties[property], id);
    }
    document.getElementById("properties_elementName").innerHTML = elements[elementId].name;
    document.getElementById("propertiesContainer").innerHTML = propertiesHtml;

    for (let property of Object.keys(properties)) {
        let id = `${elementId}-${property}`;
        let input = document.getElementById(id);
        input.addEventListener("input", (e) => {
            let cssProperty = e.target.getAttribute("cssValue");
            element.style.setProperty(cssProperty, getCssValue(e.target.value, properties[property].type));
            buildOverlayData();
        });
    }
}