export const AGENTS = [
  { id: 'main',    name: 'Claw 🦞', role: 'Chief Assistant',    color: 0xff4444, dialog: "I'm Claw, your main assistant.\nMemory, scheduling, everything.\nCurrently: {status}" },
  { id: 'caigou',  name: 'Coin 🐶', role: 'Market Analyst',     color: 0xf0a000, dialog: "I'm Coin. Markets & ETFs.\nDaily briefings every morning.\nCurrently: {status}" },
  { id: 'startup', name: 'Neo 🚀',  role: 'Startup Strategist', color: 0x4488ff, dialog: "I'm Neo. Product strategy\nand competitive analysis.\nCurrently: {status}" },
]

export const COLORS = {
  grass: 0x7bc242,
  grassDark: 0x5ea030,
  dirt: 0xc8a860,
  water: 0x3878c8,
  waterLight: 0x5898e8,
  sky: 0x87ceeb,
  fog: 0xc8e8ff,
  treeTrunk: 0x8B5E3C,
  treeGreen: 0x2d8a2d,
  treeGreenLight: 0x4CAF50,
  treeGreenDark: 0x1B5E20,
  fence: 0xeeeeee,
  rock: 0x888888,
}

// Town layout dimensions
export const TOWN = {
  size: 60,          // ground plane size
  halfSize: 30,
  playerStart: { x: 0, y: 0.5, z: 5 },
  interiorOffset: { x: 0, y: -50, z: 0 },
}

// Skin tone fix for Quaternius characters (their Skin material is near-black)
export const SKIN_COLOR = 0xf5c6a0  // warm peach/beige

export const STATUS_COLORS = {
  idle:     { hex: 0x888888, intensity: 0.3 },
  working:  { hex: 0xffd700, intensity: 1.0 },
  thinking: { hex: 0x44aaff, intensity: 0.8 },
}
