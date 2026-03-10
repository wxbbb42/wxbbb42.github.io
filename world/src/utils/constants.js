export const AGENTS = [
  { id: 'main',    name: 'Claw 🦞', role: 'Chief Assistant',    color: 0xff4444, dialog: "I'm Claw, your main assistant.\nMemory, scheduling, everything.\nCurrently: {status}" },
  { id: 'caigou',  name: 'Coin 🐶', role: 'Market Analyst',     color: 0xf0a000, dialog: "I'm Coin. Markets & ETFs.\nDaily briefings every morning.\nCurrently: {status}" },
  { id: 'startup', name: 'Neo 🚀',  role: 'Startup Strategist', color: 0x4488ff, dialog: "I'm Neo. Product strategy\nand competitive analysis.\nCurrently: {status}" },
]

export const COLORS = {
  marsSurface:     0xC4835A,
  marsSurfaceDark: 0x9B6840,
  dust:            0xB07850,
  sky:             0x000008, // deep space black
  fog:             0x000008, // fade to space at horizon
  rock:            0x6B4226,
  rockLight:       0xCC7744,
  crystal:         0x88FFCC,
  metal:           0xBBBBCC,
}

// Base layout dimensions
export const TOWN = {
  size: 30,
  halfSize: 15,
  playerStart: { x: 0, y: 0.3, z: 5 },
  interiorOffset: { x: 0, y: -50, z: 0 },
}

// Skin tone fix for Quaternius characters (their Skin material is near-black)
export const SKIN_COLOR = 0xf5c6a0  // warm peach/beige

export const STATUS_COLORS = {
  idle:     { hex: 0x888888, intensity: 0.3 },
  working:  { hex: 0xffd700, intensity: 1.0 },
  thinking: { hex: 0x44aaff, intensity: 0.8 },
}
