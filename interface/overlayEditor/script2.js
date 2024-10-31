var gridSnap = 10;
var rotateSnap = 15;
document.addEventListener('keydown', function (event) {
    if (event.shiftKey) {
        gridSnap = 1;
        rotateSnap = 1;
        console.log('gridSnap', gridSnap);
    }
});

document.addEventListener('keyup', function (event) {
    if (!event.shiftKey) {
        gridSnap = 10;
        rotateSnap = 15;
        console.log('gridSnap', gridSnap);
    }
});


function htmlToNode(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const nNodes = template.content.childNodes.length;
    if (nNodes !== 1) {
        throw new Error(
            `html parameter must represent a single node; got ${nNodes}. ` +
            'Note that leading or trailing spaces around an element in your ' +
            'HTML, like " <img/> ", get parsed as text nodes neighbouring ' +
            'the element; call .trim() on your input to avoid this.'
        );
    }
    return template.content.firstChild;
}




function createNewElement(children) {
    let rect = children.getBoundingClientRect();
    let parentString = `
    <deckgo-drr style="--width:${children.offsetWidth}px; --height: ${children.offsetHeight}px; --top: ${rect.top}px; --left: ${rect.left}px;" unit="px">

    </deckgo-drr>`
    let parent = htmlToNode(parentString);
    let childrenClone = children.cloneNode(true);
    parent.appendChild(childrenClone);
    return parent;
}
