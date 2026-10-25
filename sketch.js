//⋆｡‧˚ʚ🧸ɞ˚‧｡⋆

let currentArchetype;
let activePlanets = [];
let regenerateBtn;
let systemTimer = 0;
let textAlpha = 0;
let planetFlavors = [];
let previousFlavorSelection = "";
let coneImage;
let draggingPlanet = null;
let dragStartX = 0;
let dragStartY = 0;
let planetMovedThisDrag = false;
let coneValue = 0;
let currentSystemReading = '';
let currentCosmicMood = '';
let readingRevealAt = null;

// handmade flavor assets  
const flavorAssets = [
  { name: "Strawberry", path: "assets/berry.PNG", coreSize: 120 },
  { name: "Cotton Candy", path: "assets/candy.PNG", coreSize: 120 },
  { name: "Chocolate", path: "assets/chocolate.PNG", coreSize: 120 },
  { name: "Coffee", path: "assets/coffee.png", coreSize: 120 },
  { name: "Cookie Dough", path: "assets/dough.PNG", coreSize: 120 },
  { name: "Mint Chocolate Chip", path: "assets/mint.PNG", coreSize: 120 },
  { name: "Cookie Monster", path: "assets/monster.PNG", coreSize: 120 },
  { name: "Oreo", path: "assets/oreo.PNG", coreSize: 120 },
  { name: "Rocky Road", path: "assets/rocky.png", coreSize: 120 },
  { name: "Vanilla", path: "assets/vanilla.PNG", coreSize: 120 },
];

// Weather Topping Registry
const weatherToppings = [
  { type: "Sprinkle Rain", text: "Colorful sprinkles drift through the sky." },
  { type: "Fudge Floods", text: "Warm chocolate fudge flows through the landscape." },
  { type: "Plain Skies", text: "Clear, calm skies." },
  {
    type: "Whipped Cream Tornado",
    text: "A fluffy swirl is spinning across the horizon.",
  },
  { type: "Cherry Hail", text: "Cherries fall heavily from the clouds." },
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
  regenerateBtn = createButton("🎲 shuffle");
  regenerateBtn.position(50 , 70);
  regenerateBtn.size(90, 60);
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
  readingRevealAt = null;
  coneValue = floor(random(-5, 6));

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
  const planetValues = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 11]).slice(0, planetCount);

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
      value: planetValues[i],
      weather: chosenWeather,
      locked: false,
      currentX: 0,
      currentY: 0,
    });
  }

  updateSystemReading();
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
    if (draggingPlanet !== p && !p.locked) p.angle += p.speed;
  }

  // Pull coordinate scope back to top-left mode for typographic layouts
  resetMatrix();
  cursor(hoveredPlanet ? (draggingPlanet ? 'grabbing' : 'grab') : ARROW);
  const showReading = readingRevealAt !== null && millis() >= readingRevealAt;
  const isLoadingReading = readingRevealAt !== null && !showReading;
  drawInterfaceMarkup(
    hoveredPlanet,
    currentSystemReading,
    currentCosmicMood,
    showReading,
    isLoadingReading,
  );
}

function getPlanetQuadrant(angle) {
  const normalized = (angle + 360) % 360;
  if (normalized >= 180 && normalized < 270) return 'topLeft';
  if (normalized >= 270 || normalized < 0) return 'topRight';
  if (normalized < 90) return 'bottomRight';
  return 'bottomLeft';
}

function getSystemValue() {
  // Apply planets from the innermost orbit to the outermost orbit.
  let result = coneValue;
  const planetsByOrbit = [...activePlanets].sort((a, b) => a.distance - b.distance);
  for (const planet of planetsByOrbit) {
    switch (getPlanetQuadrant(planet.angle)) {
      case 'topLeft':
        result -= planet.value;
        break;
      case 'topRight':
        result += planet.value;
        break;
      case 'bottomLeft':
        result *= planet.value;
        break;
      case 'bottomRight':
        result /= planet.value;
        break;
    }
  }
  return result;
}

function getSystemDefinition(value) {
  if (value <= -100) return 'You are a midnight sundae: intense, mysterious, and unforgettable.';
  if (value <= -50) return 'Like dark chocolate, you turn quiet reflection into strength.';
  if (value <= -10) return 'Your rocky-road spirit finds possibility in every twist.';
  if (value <= -1) return 'You savor small joys, and your calm steadies the room.';
  if (value < 0) return 'A delicate sweetness: one sprinkle of spontaneity brightens your day.';
  if (value === 0) return 'Your cosmic scoop is perfectly poised and open to what comes next.';
  if (value <= 1) return 'Your gentle sweetness makes people feel at home.';
  if (value <= 10) return 'Your berry-bright curiosity brings color wherever you go.';
  if (value <= 50) return 'A triple-scoop force: generous, bold, and full of momentum.';
  if (value <= 100) return 'A cosmic sundae: layered, complex, and unforgettable.';
  return 'You are a galactic banana split: delightfully extravagant, no half-measures.';
}

function getPositionMood() {
  // Fine angle changes alter a hidden position signature without showing planet values.
  const moodWords = [
    'playful', 'dreamy', 'bold', 'curious', 'gentle',
    'radiant', 'mischievous', 'thoughtful', 'adventurous', 'cozy',
  ];
  const flavorQualities = [
    'creative spark', 'steady focus', 'bright optimism', 'cool calm',
    'cookie-dough creativity', 'vanilla warmth', 'bold confidence',
    'rocky-road resilience', 'quiet ambition', 'soft kindness',
  ];
  const cosmicAccents = [
    'a dash of chance', 'a swirl of confidence', 'a sprinkle of patience',
    'a ripple of optimism', 'a hidden cherry of courage',
    'a soft cloud of kindness', 'a chocolate-deep resolve',
    'a bright ribbon of curiosity', 'a surprising twist',
    'a second scoop of joy',
  ];
  const finishingTouches = [
    'room for joy', 'a sweet surprise', 'extra wonder', 'easy laughter',
    'the unexpected', 'your own recipe', 'a bright aftertaste',
    'sweet possibility', 'trusting your instincts', 'more to discover',
  ];

  const planetsByOrbit = [...activePlanets].sort((a, b) => a.distance - b.distance);
  const moodIndex = planetsByOrbit.reduce((sum, planet) => {
    const angleHundredths = Math.round((((planet.angle % 360) + 360) % 360) * 100);
    return sum + angleHundredths * planet.value;
  }, 0) % 10000;
  const moodWord = moodWords[Math.floor(moodIndex / 1000)];
  const flavorQuality = flavorQualities[Math.floor(moodIndex / 100) % 10];
  const cosmicAccent = cosmicAccents[Math.floor(moodIndex / 10) % 10];
  const finishingTouch = finishingTouches[moodIndex % 10];
  return `In a ${moodWord} mood: ${flavorQuality}; ${cosmicAccent}, ${finishingTouch}.`;
}

function updateSystemReading() {
  currentSystemReading = getSystemDefinition(getSystemValue());
  currentCosmicMood = getPositionMood();
}

function mousePressed() {
  // Check back to front so the visually topmost planet is the one grabbed.
  for (let i = activePlanets.length - 1; i >= 0; i--) {
    const planet = activePlanets[i];
    if (dist(mouseX, mouseY, planet.currentX, planet.currentY) <= planet.size / 2 + 8) {
      draggingPlanet = planet;
      dragStartX = mouseX;
      dragStartY = mouseY;
      planetMovedThisDrag = false;
      cursor('grabbing');
      return false;
    }
  }
}

function mouseDragged() {
  if (!draggingPlanet) return;

  if (dist(mouseX, mouseY, dragStartX, dragStartY) > 0.5) {
    draggingPlanet.locked = true;
    planetMovedThisDrag = true;
  }

  // Keep the planet on its own orbit and move it to the pointer's angle.
  const dx = mouseX - width / 2;
  const dy = mouseY - height / 2;
  draggingPlanet.angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
  draggingPlanet.currentX = width / 2 + draggingPlanet.distance * cos(draggingPlanet.angle);
  draggingPlanet.currentY = height / 2 + draggingPlanet.distance * sin(draggingPlanet.angle);
  return false;
}

function mouseReleased() {
  if (planetMovedThisDrag) {
    updateSystemReading();
    readingRevealAt = activePlanets.every((planet) => planet.locked)
      ? millis() + 1000
      : null;
  }
  draggingPlanet = null;
  planetMovedThisDrag = false;
  cursor(ARROW);
}

function drawWeatherAnimation(planet, centerX, centerY, radius) {
  const t = frameCount;
  push();
  translate(centerX, centerY);
  rectMode(CENTER);
  noStroke();

  switch (planet.weather.type.toLowerCase()) {
    case 'sprinkle rain':
      for (let i = 0; i < 16; i++) {
        const x = sin(i * 47 + t * 1.8) * radius;
        const y = ((i * 31 + t * 2.4) % (radius * 2)) - radius;
        push();
        translate(x, y);
        rotate(i * 37);
        fill(['#ff6b6b', '#ffd166', '#6ee7b7', '#8ec5ff'][i % 4]);
        rect(0, 0, 5, 13, 3);
        pop();
      }
      break;

    case 'fudge floods':
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * radius * 0.42 + sin(t * 2 + i * 50) * 7;
        const y = ((t * 2.2 + i * 37) % (radius * 2)) - radius;
        fill(96, 48, 31, 210);
        ellipse(x, y, 9, 22);
      }
      fill(255, 220, 180, 170);
      for (let i = 0; i < 3; i++) {
        const x = sin(t * 1.5 + i * 120) * radius * 0.7;
        const y = cos(t * 1.2 + i * 100) * radius * 0.7;
        ellipse(x, y, 5, 5);
      }
      break;

    case 'plain skies':
      noFill();
      for (let i = 0; i < 8; i++) {
        const angle = i * 45 + t * 0.8;
        const x = cos(angle) * radius;
        const y = sin(angle) * radius;
        stroke(255, 239, 172, 150 + 100 * sin(t * 4 + i * 60));
        strokeWeight(2);
        line(x - 4, y, x + 4, y);
        line(x, y - 4, x, y + 4);
      }
      break;

    case 'whipped cream tornado':
      noFill();
      for (let i = 0; i < 3; i++) {
        stroke(255, 248, 242, 210 - i * 35);
        strokeWeight(4 - i);
        const sway = sin(t * 2.5 + i * 60) * 10;
        arc(sway, 0, radius * (1.2 - i * 0.22), radius * 1.5, t * 3 + i * 100, t * 3 + 225 + i * 100);
      }
      break;

    case 'cherry hail':
      for (let i = 0; i < 8; i++) {
        const x = sin(i * 75 + t * 0.7) * radius;
        const y = ((i * 41 + t * 2.8) % (radius * 2)) - radius;
        fill(213, 42, 69, 230);
        ellipse(x, y, 12, 11);
        stroke(96, 145, 79);
        strokeWeight(2);
        line(x, y - 5, x + 3, y - 10);
        noStroke();
      }
      break;

    case 'marshmallow mist':
      fill(255, 245, 235, 185);
      for (let i = 0; i < 7; i++) {
        const x = sin(t * 0.7 + i * 52) * radius;
        const y = cos(t * 0.55 + i * 67) * radius * 0.8;
        ellipse(x, y, 25 + 5 * sin(t + i * 40), 15 + 3 * cos(t + i * 60));
      }
      break;
  }
  pop();
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

function drawInterfaceMarkup(hoveredPlanet, reading, cosmicMood, showReading, isLoadingReading) {
  noStroke();
  textAlign(CENTER, CENTER);
  fill('#fffacd');
  textFont("Georgia");
  textSize(42);
  text("⋆˙⟡ Scoopography ⏾⋆.˚⊹", width / 2, 68);
  //⋅˚.⋆☾⁺₊ ‧ 

  textFont("Arial");
  textSize(16);
  fill(255, 255, 255, 190);
  text("Drag every planet, then wait for your reading.", width / 2, 100);

  if (isLoadingReading) {
    noFill();
    stroke(255, 220, 170, 220);
    strokeWeight(2);
    arc(width / 2, height - 250, 24, 24, frameCount * 8, frameCount * 8 + 240);
    noStroke();
    textAlign(CENTER, CENTER);
    textFont('Arial');
    textSize(18);
    fill(255, 255, 255, 205);
    text('Reading your cosmic arrangement...', width / 2, height - 210);
  }

  if (showReading) {
    const readingCardW = min(360, width - 32);
    const readingCardH = 200;
    const readingCardX = (width - readingCardW) / 2;
    const readingCardY = height - 365;
    rectMode(CORNER);
    fill(13, 20, 32, 225);
    stroke(255, 255, 255, 75);
    strokeWeight(1);
    rect(readingCardX, readingCardY, readingCardW, readingCardH, 16);
    textAlign(CENTER, CENTER);
    textFont("Georgia");
    textSize(22);
    fill(255, 225, 170);
    text('Flavor Reading', width / 2, readingCardY + 23);
    textFont('Arial');
    textSize(18);
    fill(255, 255, 255, 205);
    text(reading, readingCardX + 16, readingCardY + 50, readingCardW - 32, 48);
    textSize(14);
    textLeading(18);
    fill(255, 220, 170, 210);
    text(cosmicMood, readingCardX + 16, readingCardY + 100, readingCardW - 32, 76);
  }

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
  imageMode(CORNER);
  if (hoveredPlanet.image) {
    image(hoveredPlanet.image, cardX + 11, cardY + 33, 66, 66);
  }
  drawWeatherAnimation(hoveredPlanet, cardX + 44, cardY + 66, 29);
  textAlign(LEFT, CENTER);
  fill(255);
  textFont("Georgia");
  textSize(22);
  text(hoveredPlanet.flavor, cardX + 88, cardY + 35);
  fill(255, 220, 150);
  textFont("Arial");
  textSize(16);
  text(hoveredPlanet.weather.type, cardX + 88, cardY + 62);
  fill(235, 240, 248);
  textSize(15);
  text(hoveredPlanet.weather.text, cardX + 88, cardY + 80, cardW - 104, 44);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
