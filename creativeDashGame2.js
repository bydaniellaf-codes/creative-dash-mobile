// ===== Creative Dash — Mobile, Tap-only version =====
// 3 rounds, 30s each, bottom color palette (tap -> select), eraser + sizes,
// drawing retains strokes, text uses noStroke().

let state = "start";   // "start", "instructions", "category", "draw", "win"
let round = 1;
const TOTAL_ROUNDS = 3;
const ROUND_SECONDS = 30;
let startTime = 0;
let hasDrawn = false;

const categories = [
  { a: "Music", b: "Movies" },
  { a: "Fashion", b: "Cars" },
  { a: "Food", b: "Video Games" }
];

const items = {
  Music: ["electric guitar","piano","drum","microphone","violin","headphones","vinyl","CD","acoustic guitar","music note"],
  Movies: ["camera","popcorn","ticket","tape","horror","screen", "romcom", "clapper","projector","scene","fantasy","adult animation","romance"],
  Fashion: ["vivenne westwood","rick owens","mowalola","maison margiela","vetements","balenciaga","ed hardy","LAbylinaalfaouri","chrome hearts","PRTCL CA"],
  Cars: ["sedan","truck","racecar","convertible","tesla","wheel","SUV","taxi","van","bus"],
  Food: ["pizza","burger","sushi","cake","apple","ice cream","salad","fries","sandwich","pasta","burrito","jollof rice","suya"],
  "Video Games": ["controller","console","nintendo DS","joystick","pc","headset","PSP","pacman","mario","luigi","minecraft"]
};

// Drawing layer
let drawLayer;

// Palette
let paletteColors;
let paletteBoxes = [];
let eraserBox = null;
let selected = { type: "color", value: null };
let eraserSizes = [12, 30, 60];
let eraserSizeButtons = [];
let uiPressed = false;

// Prompt
let currentPrompt = "";

function preload() {
  headingFont = loadFont("https://bydaniellaf-codes.github.io/creative-dash-assets/Brunine.ttf");
}

function setup() {
  canvas = createCanvas(800, 600);
  canvas.elt.style.touchAction = 'none'; // prevent scrolling/zoom interference
  textAlign(CENTER, CENTER);
  noSmooth();

  drawLayer = createGraphics(width, height);
  drawLayer.background(255);

  // palette colors
  paletteColors = [
    color(0,0,0), color(200,0,0), color(255,120,0),
    color(255,200,0), color(0,150,0), color(0,70,200),
    color(120,0,160), color(95,60,20)
  ];
  selected.value = paletteColors[0];

  // palette boxes
  let gap = 40, w = 30, h = 30;
  let startX = 20;
  let y = height - h - 20;
  for (let i=0; i<paletteColors.length; i++){
    paletteBoxes.push({ x: startX + i*gap, y: y, w: w, h: h, color: paletteColors[i] });
  }
  eraserBox = { x: startX + paletteColors.length * gap, y: y, w: 30, h: 30 };

  // eraser size buttons
  let bx = eraserBox.x + eraserBox.w + 20;
  for (let i=0;i<eraserSizes.length;i++){
    eraserSizeButtons.push({ x: bx + i*40, y: y, w: 30, h: 30, size: eraserSizes[i] });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawLayer = createGraphics(width, height);
  drawLayer.background(255);
}

function drawCategoryButton(cx, cy, label) {
  push();
  rectMode(CENTER);
  fill(240);
  stroke(0);
  rect(cx, cy, 200, 64, 10);
  noStroke();
  fill(0);
  textSize(18);
  text(label, cx, cy);
  pop();
}

function drawPalette() {
  for (let b of paletteBoxes) {
    noStroke();
    fill(b.color);
    rect(b.x, b.y, b.w, b.h);
    if (selected.type === "color" && selected.value === b.color) {
      stroke(0); strokeWeight(2);
      noFill();
      rect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      noStroke();
    }
  }
  fill(240);
  stroke(0);
  rect(eraserBox.x, eraserBox.y, eraserBox.w, eraserBox.h);
  noStroke();
  fill(0);
  textSize(12);
  text("E", eraserBox.x + eraserBox.w/2, eraserBox.y + eraserBox.h/2);

  if (selected.type === "eraser") {
    stroke(0); strokeWeight(2); noFill();
    rect(eraserBox.x - 2, eraserBox.y - 2, eraserBox.w + 4, eraserBox.h + 4);
    noStroke();
  }

  for (let b of eraserSizeButtons) {
    fill(230);
    stroke(0);
    rect(b.x, b.y, b.w, b.h);
    noStroke();
    fill(0);
    ellipse(b.x + b.w/2, b.y + b.h/2, b.size/3);
    if (selected.type === "eraser" && selected.value === b.size) {
      stroke(0); strokeWeight(2); noFill();
      rect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      noStroke();
    }
  }
}

function draw() {
  image(drawLayer, 0, 0);
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);

  if (state === "start") {
    background(255);
    textFont(headingFont);
    fill(30);
    textSize(60);
    text("Creative Dash!", width/2, height/2 - 40);
    textSize(20);
    text("Tap anywhere to start", width/2, height/2 + 40);
  }
  else if (state === "instructions") {
    textSize(20);
    text("Choose a category, get a random prompt,", width/2, height/2 - 40);
    text("and draw in 30s. Full creative freedom!", width/2, height/2);
    textSize(16);
    text("Tap anywhere to continue", width/2, height - 80);
  }
  else if (state === "category") {
    textSize(22);
    text(`Round ${round}: Choose a category`, width/2, 80);
    let c = categories[round-1];
    drawCategoryButton(width/2 - 150, height/2, c.a);
    drawCategoryButton(width/2 + 150, height/2, c.b);
  }
  else if (state === "draw") {
    fill(255);
    rect(0,0,width,120);
    fill(0);
    textSize(18);
    text(`Prompt: ${currentPrompt}`, width/2, 30);
    let elapsed = int((millis() - startTime) / 1000);
    let remaining = max(0, ROUND_SECONDS - elapsed);
    text(`Time left: ${remaining}s`, width/2, 60);
    text(`Round ${round} of ${TOTAL_ROUNDS}`, width/2, 90);
    drawPalette();

    if (remaining <= 0) {
      if (hasDrawn) {
        round++;
        hasDrawn = false;
        drawLayer.background(255);
        if (round > TOTAL_ROUNDS) state = "win";
        else state = "category";
      } else {
        round = 1;
        hasDrawn = false;
        drawLayer.background(255);
        state = "category";
      }
    }
  }
  else if (state === "win") {
    background(255);
    fill(0);
    textSize(36);
    text("Great job!", width/2, height/2 - 20);
    textSize(18);
    text("Tap to play again", width/2, height/2 + 40);
  }
}

function touchStarted() {
  uiPressed = false;
  let px = mouseX, py = mouseY;

  if (state === "start") { state = "instructions"; return false; }
  else if (state === "instructions") { state = "category"; return false; }
  else if (state === "category") {
    let leftX = width/2 - 150, rightX = width/2 + 150, y = height/2;
    if (insideButton(leftX, y, 200, 64, px, py)) { pickPrompt(categories[round-1].a); return false; }
    if (insideButton(rightX, y, 200, 64, px, py)) { pickPrompt(categories[round-1].b); return false; }
  }
  else if (state === "win") { resetGame(); return false; }

  mousePressed();
  return false;
}

function touchMoved() { mouseDragged(); return false; }
function touchEnded() { mouseReleased(); return false; }

function mousePressed() {
  uiPressed = false;
  if (state === "draw") {
    for (let b of paletteBoxes) {
      if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
        selected.type = "color"; selected.value = b.color; uiPressed = true; return;
      }
    }
    if (mouseX >= eraserBox.x && mouseX <= eraserBox.x + eraserBox.w &&
        mouseY >= eraserBox.y && mouseY <= eraserBox.y + eraserBox.h) {
      selected.type = "eraser"; selected.value = eraserSizes[1]; uiPressed = true; return;
    }
    for (let b of eraserSizeButtons) {
      if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
        selected.type = "eraser"; selected.value = b.size; uiPressed = true; return;
      }
    }
  }
}

function mouseDragged() {
  if (state !== "draw") return;
  if (uiPressed) return;

  if (selected.type === "eraser") {
    let s = selected.value || eraserSizes[1];
    drawLayer.noStroke();
    drawLayer.fill(255);
    drawLayer.ellipse(mouseX, mouseY, s, s);
  } else {
    drawLayer.stroke(selected.value);
    drawLayer.strokeWeight(4);
    drawLayer.line(pmouseX, pmouseY, mouseX, mouseY);
  }
  hasDrawn = true;
}

function mouseReleased() { uiPressed = false; }

function insideButton(cx, cy, w, h, px, py) {
  return (px >= cx - w/2 && px <= cx + w/2 &&
          py >= cy - h/2 && py <= cy + h/2);
}

function pickPrompt(categoryKey) {
  currentPrompt = random(items[categoryKey]);
  state = "draw";
  startTime = millis();
  hasDrawn = false;
  drawLayer.background(255);
}

function resetGame() {
  round = 1;
  state = "category";
  drawLayer.background(255);
  hasDrawn = false;
  selected.type = "color";
  selected.value = paletteColors[0];
}

// ---- RESPONSIVE VISUAL SCALING ----
function adjustCanvasScale() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const factor = Math.min(w / 800, h / 600);
  if (canvas && canvas.elt) {
    canvas.elt.style.width = (800 * factor) + 'px';
    canvas.elt.style.height = (600 * factor) + 'px';
    canvas.elt.style.transformOrigin = 'top left';
  }
}

function windowResized() {
  adjustCanvasScale();
}
