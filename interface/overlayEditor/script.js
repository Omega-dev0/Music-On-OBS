// first we need to create a stage

function main() {
    //interact(document.getElementById("test1")).draggable(draggable)
    //interact(document.getElementById("test2")).draggable(draggable)

    document.getElementById("test1").setAttribute('data-x', 150)
    document.getElementById("test1").setAttribute('data-y', 150)
    document.getElementById("test1").style.transform = `translate(150px, 150px) rotate(0rad)`

    document.getElementById("test2").setAttribute('data-x', 250)
    document.getElementById("test2").setAttribute('data-y', 250)
    document.getElementById("test2").style.transform = `translate(250px, 250px) rotate(0rad)`

    document.getElementById("test1").style.width = 100 + "px"
    setInterval(() => {
        let test = document.getElementById("test1")
        test.style.width = test.style.width.replace("px", "") * 1 + 1 + "px"
        if (test.style.width.replace("px", "") > 400) {
            test.style.width = 100 + "px"
        }
    }, 10)
}


document.addEventListener('DOMContentLoaded', main);
const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
const group = document.createElementNS("http://www.w3.org/2000/svg", "g");


let positions = {}

function resize() {

}
function move(event) {
    let x = (parseFloat(event.target.getAttribute('data-x')) || 0)
    let y = (parseFloat(event.target.getAttribute('data-y')) || 0)
    x += event.dx
    y += event.dy

    event.target.style.transform =
        `translate(${x}px, ${y}px) rotate(${event.target.getAttribute('data-angle') || 0}rad)`
    event.target.setAttribute('data-x', x)
    event.target.setAttribute('data-y', y)
}

let draggable = {

    modifiers: [

    ],

    listeners: {
        start: function (event) {
            if (positions[event.target.id] == undefined) {
                positions[event.target.id] = { x: 0, y: 0 }
            }
            select(event, false)
        },
        move: move
    }
}

let resizable = {
    edges: { top: true, left: true, bottom: true, right: true, invert: 'reposition' },

    modifiers: [
        // keep the edges inside the parent
        interact.modifiers.restrictEdges({
            outer: 'parent'
        }),
    ],

    listeners: {
        start: function (event) {
            if (positions[event.target.id] == undefined) {
                positions[event.target.id] = { x: 0, y: 0 }
            }
        },
        move: resize
    }
}

//----------------------------- INTERACTION HANDLERS ----------------------------

function select(event, canUnselect = true) {

    if (event == null) {
        if (selectedElement != null) {
            selectedElement.classList.remove("selected")
            toggleResize(selectedElement, false)
            toggleRotate(selectedElement, false)
            selectedElement = null
        }
        return
    }

    let element = event.currentTarget
    if (selectedElement != element && selectedElement != null) {
        selectedElement.classList.remove("selected")
        toggleResize(selectedElement, false)
        toggleRotate(selectedElement, false)
        selectedElement = element
        selectedElement.classList.add("selected")
        toggleResize(selectedElement, true)
        toggleRotate(selectedElement, true)
    } else if (selectedElement == null) {
        selectedElement = element
        element.classList.add("selected")
        toggleResize(selectedElement, true)
        toggleRotate(selectedElement, true)
    } else if (canUnselect) {
        selectedElement.classList.remove("selected")
        toggleResize(selectedElement, false)
        toggleRotate(selectedElement, false)
        selectedElement = null
    }

    bringToFront(element)
}

function bringToFront(element) {
    const highestZIndex = Array.from(document.querySelectorAll('#canvas .element'))
        .map(el => parseFloat(window.getComputedStyle(el).zIndex) || 0)
        .reduce((max, zIndex) => Math.max(max, zIndex), 0);

    element.style.zIndex = highestZIndex + 1;
}


// Resizing
handleOffset = 10
function toggleResize(element, isResizable) {
    if (!element.classList.contains("resizable")) {
        return
    }

    if (isResizable) {
        let newR = Object.assign({}, resizable)


        createResizeHandles(element);
        newR.edges = {
            top: "#resize-handle-top,#resize-handle-top-left,#resize-handle-top-right",
            left: "#resize-handle-left,#resize-handle-top-left,#resize-handle-bottom-left",
            bottom: "#resize-handle-bottom,#resize-handle-bottom-left,#resize-handle-bottom-right",
            right: "#resize-handle-right,#resize-handle-top-right,#resize-handle-bottom-right"
        }

        //interact(element).resizable(resizable);
    } else {
        interact(element).resizable(false);
        removeResizeHandles(element);
    }
}
function createResizeHandles(element) {
    const handles = ['top', 'left', 'bottom', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    handles.forEach(handle => {
        const handleElement = document.createElement('div');
        handleElement.classList.add('resize-handle', `resize-handle-${handle}`);
        handleElement.id = `resize-handle-${handle}`;
        handleElement.style.position = 'absolute';
        element.appendChild(handleElement);

        handleElement.style.cursor = `grab`;

        handleElement.addEventListener('mousedown', initDrag, false);
    });
    syncResizeHandles(element);
}
function syncResizeHandles(element) {
    const rect = element.getBoundingClientRect();
    const handles = element.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
        if (handle.classList.contains('resize-handle-top')) {
            handle.style.top = `-${handleOffset}px`;
            handle.style.left = '50%';
            handle.style.transform = 'translateX(-50%)';
        } else if (handle.classList.contains('resize-handle-left')) {
            handle.style.top = '50%';
            handle.style.left = `-${handleOffset}px`;
            handle.style.transform = 'translateY(-50%)';
        } else if (handle.classList.contains('resize-handle-bottom')) {
            handle.style.bottom = `-${handleOffset}px`;
            handle.style.left = '50%';
            handle.style.transform = 'translateX(-50%)';
        } else if (handle.classList.contains('resize-handle-right')) {
            handle.style.top = '50%';
            handle.style.right = `-${handleOffset}px`;
            handle.style.transform = 'translateY(-50%)';
        } else if (handle.classList.contains('resize-handle-top-left')) {
            handle.style.top = `-${handleOffset}px`;
            handle.style.left = `-${handleOffset}px`;
        }
        else if (handle.classList.contains('resize-handle-top-right')) {
            handle.style.top = `-${handleOffset}px`;
            handle.style.right = `-${handleOffset}px`;
        }
        else if (handle.classList.contains('resize-handle-bottom-left')) {
            handle.style.bottom = `-${handleOffset}px`;
            handle.style.left = `-${handleOffset}px`;
        }
        else if (handle.classList.contains('resize-handle-bottom-right')) {
            handle.style.bottom = `-${handleOffset}px`;
            handle.style.right = `-${handleOffset}px`;
        }
    });


}
function removeResizeHandles(element) {
    const handles = element.querySelectorAll('.resize-handle');
    handles.forEach(handle => handle.remove());
}

var startX, startY, startWidth, startHeight;

function initDrag(e) {
    e.preventDefault();
    let p = selectedElement
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.defaultView.getComputedStyle(p).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(p).height, 10);

    startTransformX = parseFloat(p.getAttribute('data-x')) || 0
    startTransformY = parseFloat(p.getAttribute('data-y')) || 0

    classList = e.target.classList

    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
}

function doDrag(e) {
    e.preventDefault();
    let p = selectedElement;
    let angle = parseFloat(p.getAttribute('data-angle')) || 0;
    let cosAngle = Math.cos(angle);
    let sinAngle = Math.sin(angle);

    let deltaX = e.clientX - startX;
    let deltaY = e.clientY - startY;
    console.log(angle, cosAngle, sinAngle)
    if (classList.contains('resize-handle-top')) {

        p.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
    } else if (classList.contains('resize-handle-left')) {

    } else if (classList.contains('resize-handle-bottom')) {

    } else if (classList.contains('resize-handle-right')) {

    } else if (classList.contains('resize-handle-top-left')) {

    } else if (classList.contains('resize-handle-top-right')) {

    } else if (classList.contains('resize-handle-bottom-left')) {

    } else if (classList.contains('resize-handle-bottom-right')) {

    }



}



function stopDrag(e) {
    e.preventDefault();
    let p = selectedElement
    document.documentElement.removeEventListener('mousemove', doDrag, false);
    document.documentElement.removeEventListener('mouseup', stopDrag, false);
}

// Rotating
let rotateHandleOffset = 15;
function toggleRotate(element, isRotatable) {
    if (element.classList.contains("rotatable")) {
        return
    }

    if (isRotatable) {
        let handle = createRotateHandle(element);
        interact(handle).draggable({
            onstart: function (event) {
                var box = event.target.parentElement;
                var rect = box.getBoundingClientRect();

                // store the center as the element has css `transform-origin: center center`
                box.setAttribute('data-center-x', rect.left + rect.width / 2);
                box.setAttribute('data-center-y', rect.top + rect.height / 2);
                // get the angle of the element when the drag starts
                box.setAttribute('data-angle', getDragAngle(event));
            },
            onmove: function (event) {
                var box = event.target.parentElement;

                let pos = {
                    x: parseFloat(box.getAttribute('data-x')) || 0,
                    y: parseFloat(box.getAttribute('data-y')) || 0
                };

                var angle = getDragAngle(event);

                // update transform style on dragmove
                box.style.transform = 'translate(' + pos.x + 'px, ' + pos.y + 'px) rotate(' + angle + 'rad' + ')';
            },
            onend: function (event) {
                var box = event.target.parentElement;

                // save the angle on dragend
                box.setAttribute('data-angle', getDragAngle(event));
            },
        });
    }
    else {
        //interact(element).draggable(false);
        removeRotateHandle(element);
    }
}
function getDragAngle(event) {
    var box = event.target.parentElement;
    var startAngle = parseFloat(box.getAttribute('data-angle')) || 0;
    var center = {
        x: parseFloat(box.getAttribute('data-center-x')) || 0,
        y: parseFloat(box.getAttribute('data-center-y')) || 0
    };
    var angle = Math.atan2(center.y - event.clientY,
        center.x - event.clientX);

    return angle - startAngle;
}
function createRotateHandle(element) {
    const handleElement = document.createElement('div');
    handleElement.classList.add('rotate-handle');
    handleElement.id = 'rotate-handle';
    handleElement.style.position = 'absolute';
    handleElement.style.top = `-${rotateHandleOffset * 2}px`;
    handleElement.style.left = '50%';
    handleElement.style.transform = 'translateX(-50%)';
    handleElement.style.cursor = 'grab';
    element.appendChild(handleElement);
    syncRotateHandle(element);
    return handleElement;
}



function syncRotateHandle(element) {
    const handle = element.querySelector('#rotate-handle');
    if (handle) {
        handle.style.top = `-${rotateHandleOffset * 2}px`;
        handle.style.left = '50%';
        handle.style.transform = 'translateX(-50%)';
    }
}

function removeRotateHandle(element) {
    const handle = element.querySelector('#rotate-handle');
    if (handle) {
        handle.remove();
    }
}


let selectedElement = null



interact(".selectable").on('tap', select)


interact("#canvas")
    .dropzone({
        ondrop: function (event) {

        },
        accept: ".element, .dummyElement"
    })
    .on('dropactivate', function (event) {
        event.target.classList.add('drop-activated')
    })
    .on('tap', function (event) {
        if (event.target.id != "canvas") {
            return
        }
        if (selectedElement != null) {
            select(null)
        }
    })

interact(".elementRemoval")
    .dropzone({
        ondrop: function (event) {
            event.relatedTarget.remove()
        },
        accept: ".element, .dummyElement"
    })
    .on('dropactivate', function (event) {

        //event.relatedTarget.remove()
    })