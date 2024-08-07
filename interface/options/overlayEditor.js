const elements = {
    "progressBarLine": {
        elementId: "progressBarLine",
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

function getCssValue(value, type) {
    if (type == "color") {
        return value;
    } else {
        return `${value}${type}`;
    }
}

function buildElementsDisplay() {
    for (let key of Object.keys(elements)) {
        let elementData = elements[key];
        let element = document.getElementById(`OVERLAY_${elementData.elementId}`);
        for (let property of Object.keys(elementData.properties)) {
            let propertyData = elementData.properties[property];
            element.style.setProperty(propertyData.cssProperty, getCssValue(propertyData.value, propertyData.type));
        }
        document.getElementById("overlayElementsScroller").appendChild(element);
        element.addEventListener("mousedown", function (e) {
            if(e.button != 0) { return }
            let clone = element.cloneNode(true);
            clone.id = `OVERLAY_${elementData.elementId}-clone`;
            clone.style.position = "absolute";

            clone.style.left = `${e.clientX - e.offsetX}px`;
            clone.style.top = `${e.clientY - e.offsetY}px`;
            document.getElementById("canvas").appendChild(clone);
            stickElToMouse(e, clone);
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    buildElementsDisplay();
});


//---------------------------

function stickElToMouse(e, element) {
    let container = document.getElementById("canvas");
    let containerRect = container.getBoundingClientRect();
    let isMouseDown = true;
    let offsetX = e.offsetX;
    let offsetY = e.offsetY;
    element.addEventListener("mousedown", function (e) {
        if(e.button != 0) { return }
        isMouseDown = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    });
    document.addEventListener("mousemove", function (e) {
        if (isMouseDown) {
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        }
    });
    document.addEventListener("mouseup", function () {
        if(e.button != 0) { return }
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
    });
}