// Ice Cream Solar System

let currentArchetype;
let activePlanets = [];
let regenerateBtn;
let systemTimer = 0;
let textAlpha = 0;
let planetFlavors = [];
let previousFlavorSelection = "";
let coneImage;

const flavorAssets = [
  { name: "Berry", path: "assets/berry.PNG", coreSize: 120 },
  { name: "Candy", path: "assets/candy.PNG", coreSize: 120 },
  { name: "Chocolate", path: "assets/chocolate.PNG", coreSize: 120 },
  { name: "Coffee", path: "assets/coffee.png", coreSize: 120 },
  { name: "Cookie Dough", path: "assets/dough.PNG", coreSize: 120 },
  { name: "Mint", path: "assets/mint.PNG", coreSize: 120 },
  { name: "Monster", path: "assets/monster.PNG", coreSize: 120 },
  { name: "Oreo", path: "assets/oreo.PNG", coreSize: 120 },
  { name: "Rocky Road", path: "assets/rocky.png", coreSize: 120 },
  { name: "Vanilla", path: "assets/vanilla.PNG", coreSize: 120 },
];

// Weather Topping Registry
const weatherToppings = [
  { type: "Sprinkle Rain", text: "Colorful sprinkles drift through the sky." },
  { type: "Fudge Floods", text: "Warm chocolate fudge flows in slow rivers." },
  { type: "Plain Skies", text: "Clear, calm skies with a chance of sunshine." },
  {
    type: "Whipped Cream Tornado",
    text: "A fluffy swirl is spinning across the horizon.",
  },
  { type: "Cherry Hail", text: "Cherries fall from the clouds." },
  {
    type: "Marshmallow Mist",
    text: "Soft marshmallow clouds blanket the surface.",
  },
];

// Cosmic Archetypes for Curated Systems
const archetypes = {
  "Harmonic Resonance": {
    spaceColor: "#0f1a24",
    lineAlpha: 30,
    speedMult: 0.5,
  },
  "Gravitational Collapse": {
    spaceColor: "#1a0f1a",
    lineAlpha: 15,
    speedMult: 1.8,
  },
  "Galactic Drift": { spaceColor: "#121212", lineAlpha: 20, speedMult: 0.9 },
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);

  // Build the system immediately; flavor art loads in the background.
  planetFlavors = flavorAssets.map((flavor) => ({
    name: flavor.name,
    image: null,
    coreSize: flavor.coreSize,
  }));

  // HTML Interface Element Integration
  regenerateBtn = createButton("🎲 Shuffle the system");
  regenerateBtn.position(CENTER, 120);
  regenerateBtn.addClass("shuffle-button");
  regenerateBtn.mousePressed(() => window.location.reload());

  generateNewSystem();

  loadImage(
    "assets/cone.PNG",
    (image) => {
      coneImage = image;
    },
    () => console.warn("Could not load the cone image: assets/cone.PNG"),
  );

  // Loading in setup keeps a slow or missing image from holding up the page.
  for (const flavor of planetFlavors) {
    const asset = flavorAssets.find((item) => item.name === flavor.name);
    loadImage(
      asset.path,
      (image) => {
        flavor.image = image;
        for (const planet of activePlanets) {
          if (planet.flavor === flavor.name) planet.image = image;
        }
      },
      () => console.warn(`Could not load flavor image: ${asset.path}`),
    );
  }
}

function generateNewSystem() {
  systemTimer = 0;
  textAlpha = 0;
  activePlanets = [];

  // 1. CHANCE OPERATIONS: Select an underlying cosmic archetype
  let keys = Object.keys(archetypes);
  currentArchetype = archetypes[random(keys)];

  // Pick a fresh selection of 3–5 unique flavors for this system.
  const planetCount = floor(random(3, 6));
  let shuffledFlavors;
  let selectedFlavors;
  let selectionKey;
  do {
    shuffledFlavors = shuffle(planetFlavors);
    selectedFlavors = shuffledFlavors.slice(0, planetCount);
    selectionKey = selectedFlavors
      .map((flavor) => flavor.name)
      .sort()
      .join("|");
  } while (
    selectionKey === previousFlavorSelection &&
    planetFlavors.length > 1
  );
  previousFlavorSelection = selectionKey;

  const innerOrbit = min(width, height) * 0.17;
  const outerOrbit = min(width, height) * 0.38;

  for (let i = 0; i < planetCount; i++) {
    let chosenWeather = random(weatherToppings);
    const distance =
      planetCount === 1
        ? (innerOrbit + outerOrbit) / 2
        : map(i, 0, planetCount - 1, innerOrbit, outerOrbit) + random(-12, 12);

    activePlanets.push({
      flavor: selectedFlavors[i].name,
      image: selectedFlavors[i].image,
      size: random(90, 170),
      distance,
      angle: random(0, 360),
      speed:
        random(0.12, 0.3) *
        currentArchetype.speedMult *
        (random() < 0.5 ? -1 : 1),
      weather: chosenWeather,
      currentX: 0,
      currentY: 0,
    });
  }
}

function draw() {
  if (!currentArchetype) return;
  background(currentArchetype.spaceColor);
  systemTimer += 1;
  if (textAlpha < 255) textAlpha += 5;

  drawStarfield();

  // Center all orbital math directly on the screen coordinates
  translate(width / 2, height / 2);

  // --- Layer 1: Draw Curation Rings ---
  for (let p of activePlanets) {
    noFill();
    stroke(255, 255, 255, currentArchetype.lineAlpha);
    strokeWeight(1);
    ellipse(0, 0, p.distance * 2, p.distance * 2);
  }

  // --- Layer 2: Ice cream cone at the center of the system ---
  drawCenterCone();

  // --- Layer 3: Planet Rendering Matrix & Hover Evaluations ---
  let hoveredPlanet = null;

  for (let p of activePlanets) {
    push();
    rotate(p.angle);

    // Compute the absolute screen positions for mouse collision logic
    p.currentX = width / 2 + p.distance * cos(p.angle);
    p.currentY = height / 2 + p.distance * sin(p.angle);

    // Check if the user is hovering over this specific body
    let d = dist(mouseX, mouseY, p.currentX, p.currentY);
    let isHovered = d < p.size / 2 + 8;

    translate(p.distance, 0);
    rotate(-p.angle); // Inverse rotation to keep textures upright

    imageMode(CENTER);
    if (p.image) image(p.image, 0, 0, p.size, p.size);
    else {
      noStroke();
      fill(255, 220, 235);
      ellipse(0, 0, p.size, p.size);
    }

    // Visual indicator showing the hovering context trigger actively
    if (isHovered) {
      stroke(255);
      strokeWeight(2);
      noFill();
      ellipse(0, 0, p.size + 10, p.size + 10);
      hoveredPlanet = p;
    }

    pop();

    // Drive rotation frames over time smoothly
    p.angle += p.speed;
  }

  // Pull coordinate scope back to top-left mode for typographic layouts
  resetMatrix();
  drawInterfaceMarkup(hoveredPlanet);
}

function windowResized() {
  resizeCanvas(min(windowWidth, 1000), min(windowHeight, 800));
  generateNewSystem();
}

// --- Blueprint Drawing Engines ---

function drawCenterCone() {
  push();
  noStroke();
  fill("#fffacd");
  //ellipse(0, -39, 76, 68);
  if (coneImage) {
    imageMode(CENTER);
    image(coneImage, 0, 22, 180, 180);
  }
  pop();
}

function drawStarfield() {
  randomSeed(1995);
  fill(255, 255, 255, 80);
  noStroke();
  for (let i = 0; i < 50; i++) {
    ellipse(random(width), random(height), random(1, 3));
  }
}

function drawInterfaceMarkup(hoveredPlanet) {
  noStroke();
  textAlign(CENTER, CENTER);
  fill(255);
  textFont("Georgia");
  textSize(25);
  text("Ice Cream Solar System", width / 2, 38);

  textFont("Arial");
  textSize(13);
  fill(255, 255, 255, 190);
  text("Hover over a planet!", width / 2, 63);

  if (!hoveredPlanet) return;

  const cardW = min(330, width - 32);
  const cardH = 132;
  const cardX = (width - cardW) / 2;
  const cardY = height - cardH - 18;
  rectMode(CORNER);
  fill(13, 20, 32, 225);
  stroke(255, 255, 255, 75);
  strokeWeight(1);
  rect(cardX, cardY, cardW, cardH, 16);
  noStroke();
  if (hoveredPlanet.image) {
    image(hoveredPlanet.image, cardX + 11, cardY + 33, 66, 66);
  }
  textAlign(LEFT, CENTER);
  fill(255);
  textFont("Georgia");
  textSize(19);
  text(hoveredPlanet.flavor, cardX + 88, cardY + 35);
  fill(255, 220, 150);
  textFont("Arial");
  textSize(14);
  text(hoveredPlanet.weather.type, cardX + 88, cardY + 62);
  fill(235, 240, 248);
  textSize(12);
  text(hoveredPlanet.weather.text, cardX + 88, cardY + 91, cardW - 104, 34);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
