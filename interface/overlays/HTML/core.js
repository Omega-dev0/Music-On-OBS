function getTextWidth(text, font) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function getCssStyle(element, prop) {
  return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFont(el = document.body) {
  const fontWeight = getCssStyle(el, "font-weight") || "normal";
  const fontSize = getCssStyle(el, "font-size") || "16px";
  const fontFamily = getCssStyle(el, "font-family") || "Times New Roman";

  return `${fontWeight} ${fontSize} ${fontFamily}`;
}

function updateMarquee(marqueeElement, text, type) {
  //subtitle or title
  let size = parseInt(getTextWidth(text, getCanvasFont(marqueeElement.querySelector("div > span"))));
  document.documentElement.style.setProperty("--"+type+"textWidth", size + "px");
  let csv = window.getComputedStyle(document.documentElement);
  csv.getVar = getVar;

  if (size < parseInt(csv.getVar(`${type}Width`, "px"))) {
    document.getElementById(type).querySelector(`.${type}_marquee_inner`).hidden = true;
    document.getElementById(type).querySelector(`.${type}_marquee_default`).hidden = false;
    document.getElementById(type).querySelector(`.${type}_marquee_default`).innerHTML = text;
    return;
  } else {
    document.getElementById(type).querySelector(`.${type}_marquee_inner`).hidden = false;
    document.getElementById(type).querySelector(`.${type}_marquee_default`).hidden = true;
  }

  let animationDuration = (((size) / csv.getVar(`${type}Speed`, "")) + ((csv.getVar(`${type}Offset`, "px")) / csv.getVar(`${type}Speed`, ""))) * 2;
  //REDO
  let separation = size / csv.getVar(`${type}Speed`, "") + csv.getVar(`${type}Offset`, "px") / csv.getVar(`${type}Speed`, "");
  console.log(separation, animationDuration, size);

  document.documentElement.style.setProperty(`--${type}Separation`, separation + "s");
  document.documentElement.style.setProperty(`--${type}AnimationDuration`, animationDuration + "s");

  for (span of marqueeElement.querySelectorAll("span")) {
    span.innerHTML = text;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateMarquee(document.querySelector(".title_marquee"), "This is a test","title");
});

//UTILITY FUNCTIONS
function getVar(name, unit) {
  return this.getPropertyValue(`--${name}`).replace(unit, "").replace(" ", "");
}
