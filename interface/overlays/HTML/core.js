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

function updateMarquee(marqueeElement, text) {
  let size = parseInt(getTextWidth(text, getCanvasFont(marqueeElement.querySelector("div > span"))));
  document.documentElement.style.setProperty("--textWidth", size + "px");
  let csv = window.getComputedStyle(document.documentElement);
  csv.getVar = getVar;

  if (size < parseInt(csv.getVar("titleWidth", "px"))) {
    document.getElementById("title").querySelector(".title_marquee__inner").hidden = true;
    document.getElementById("title").querySelector(".title_marquee_default").hidden = false;
    document.getElementById("title").querySelector(".title_marquee_default").innerHTML = text;
    return;
  } else {
    document.getElementById("title").querySelector(".title_marquee__inner").hidden = false;
    document.getElementById("title").querySelector(".title_marquee_default").hidden = true;
  }

  let animationDuration = (((size) / csv.getVar("titleSpeed", "")) + ((csv.getVar("titleOffset", "px")) / csv.getVar("titleSpeed", ""))) * 2;
  //REDO
  let separation = size / csv.getVar("titleSpeed", "") + csv.getVar("titleOffset", "px") / csv.getVar("titleSpeed", "");
  console.log(separation, animationDuration, size);

  document.documentElement.style.setProperty("--titleSeparation", separation + "s");
  document.documentElement.style.setProperty("--titleAnimationDuration", animationDuration + "s");

  for (span of marqueeElement.querySelectorAll("span")) {
    span.innerHTML = text;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateMarquee(document.querySelector(".title_marquee"), "This is a test");
});

//UTILITY FUNCTIONS
function getVar(name, unit) {
  return this.getPropertyValue(`--${name}`).replace(unit, "").replace(" ", "");
}
