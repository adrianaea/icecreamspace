// Ice Cream Solar System

let currentArchetype;
let activePlanets = [];
let regenerateBtn;
let systemTimer = 0;
let textAlpha = 0;

// Master Flavor Registry (The 10 unique planetary asset profiles)
const planetFlavors = [
  { name: "Mint Aquamarine", baseColor: "#7fffd4", coreSize: 40 },
  { name: "Marbled Blueberry", baseColor: "#4682b4", coreSize: 55 },
  { name: "Ube Purple Swirl", baseColor: "#663399", coreSize: 50 },
  { name: "Volcanic Cherry Choc", baseColor: "#3d2314", coreSize: 45 },
  { name: "Espresso Desert Sand", baseColor: "#d2b48c", coreSize: 42 },
  { name: "Matcha Swamp Orb", baseColor: "#556b2f", coreSize: 48 },
  { name: "Mango Solar Sherbet", baseColor: "#ffaa00", coreSize: 52 },
  { name: "Strawberry Nebula", baseColor: "#ff6b6b", coreSize: 46 },
  { name: "Pistachio Comet Core", baseColor: "#93c572", coreSize: 38 },
  { name: "Vanilla Cosmic Void", baseColor: "#f3e5ab", coreSize: 60 }
];

// Weather Topping Registry 
const weatherToppings = [
  { type: "Sprinkle Rain", text: "Atmosphere: Torrential Rainbow Sprinkle Rain" },
  { type: "Fudge Floods", text: "Atmosphere: Deep Hot Fudge Floods" },
  { type: "Confectionary Calm", text: "Atmosphere: Absolute Confectionary Calm" }
];

// Cosmic Archetypes for Curated Systems
const archetypes = {
  "Harmonic Resonance": { spaceColor: "#0f1a24", lineAlpha: 30, speedMult: 0.5 },
  "Gravitational Collapse": { spaceColor: "#1a0f1a", lineAlpha: 15, speedMult: 1.8 },
  "Galactic Drift": { spaceColor: "#121212", lineAlpha: 20, speedMult: 0.9 }
};

function setup() {
  createCanvas(1000, 800);
  angleMode(DEGREES);
  
  // HTML Interface Element Integration
  regenerateBtn = createButton('🎲 Create New Solar System');
  regenerateBtn.position(20, 20);
  regenerateBtn.mousePressed(generateNewSystem);
  
  generateNewSystem();
}

function generateNewSystem() {
  systemTimer = 0;
  textAlpha = 0;
  activePlanets = [];
  
  // 1. CHANCE OPERATIONS: Select an underlying cosmic archetype
  let keys = Object.keys(archetypes);
  currentArchetype = archetypes[random(keys)];
  
  // 2. SYSTEM OF CURATION: Shuffle flavors and pick exactly 3 out of the 10
  let shuffledFlavors = shuffle(planetFlavors);
  
  // Fixed Ring Allocations (Inner, Mid, Outer) to ensure zero overlap clutter
  let orbitalRings = [120, 200, 280];
  
  for (let i = 0; i < 3; i++) {
    let chosenWeather = random(weatherToppings);
    
    activePlanets.push({
      flavor: shuffledFlavors[i].name,
      color: shuffledFlavors[i].baseColor,
      size: shuffledFlavors[i].coreSize,
      distance: orbitalRings[i] + random(-15, 15), 
      angle: random(0, 360),
      speed: random(0.2, 0.5) * currentArchetype.speedMult * (1.5 - (i * 0.4)), 
      weather: chosenWeather,
      currentX: 0,
      currentY: 0
    });
  }
}

function draw() {
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
  
  // --- Layer 2: Core Sun Asset Placeholder (The Waffle Cone Sun) ---
  drawWaffleConeSun();
  
  // --- Layer 3: Planet Rendering Matrix & Hover Evaluations ---
  let hoveredPlanetText = "";
  
  for (let p of activePlanets) {
    push();
    rotate(p.angle);
    
    // Compute the absolute screen positions for mouse collision logic
    p.currentX = (width / 2) + p.distance * cos(p.angle);
    p.currentY = (height / 2) + p.distance * sin(p.angle);
    
    // Check if the user is hovering over this specific body
    let d = dist(mouseX, mouseY, p.currentX, p.currentY);
    let isHovered = (d < p.size / 2);
    
    translate(p.distance, 0);
    rotate(-p.angle); // Inverse rotation to keep textures upright
    
    // Draw the planetary flavor asset blueprint
    stroke("#2d241e");
    strokeWeight(3);
    fill(p.color);
    ellipse(0, 0, p.size, p.size);
    
    // Abstract texture overlay
    noStroke();
    fill(255, 255, 255, 40);
    arc(0, 0, p.size, p.size, 180, 360);
    
    // Visual indicator showing the hovering context trigger actively
    if (isHovered) {
      stroke(255);
      strokeWeight(2);
      noFill();
      ellipse(0, 0, p.size + 10, p.size + 10);
      hoveredPlanetText = `${p.flavor} // ${p.weather.text}`;
    }
    
    pop();
    
    // Drive rotation frames over time smoothly
    p.angle += p.speed;
  }
  
  // Pull coordinate scope back to top-left mode for typographic layouts
  resetMatrix();
  drawInterfaceMarkup(hoveredPlanetText);
}

// --- Blueprint Drawing Engines ---

function drawWaffleConeSun() {
  push();
  stroke("#2d241e");
  strokeWeight(3);
  fill("#d9a066");
  triangle(-30, 10, 30, 10, 0, 80);
  
  stroke(45, 36, 30, 40);
  for(let i = -20; i <= 20; i += 10) {
    line(i, 10, 0, 80);
  }
  
  stroke("#2d241e");
  strokeWeight(3);
  fill("#fffacd");
  ellipse(0, -15, 75, 75);
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

function drawInterfaceMarkup(hoverText) {
  noStroke();
  fill(255, 255, 255, textAlpha * 0.4);
  textFont('Courier New', 12);
  text("ORBITAL OBSERVED ENGINE // PROTO_V2", 230, 34);
  
  if (hoverText !== "") {
    fill(255);
    textFont('Georgia', 16);
    textAlign(CENTER);
    text(hoverText, width / 2, height - 50);
  } else {
    fill(255, 255, 255, 120);
    textFont('Arial', 14);
    textAlign(CENTER);
    text("✦ Hover cursor over a celestial flavor planet to read its localized atmospheric topping weather ✦", width / 2, height - 50);
  }
}
