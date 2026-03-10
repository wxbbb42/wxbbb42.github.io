class TownScene extends Phaser.Scene {
  constructor() { super({ key: 'TownScene' }); }
  preload() {}
  create() {
    const W = this.scale.width, H = this.scale.height;
    // Tile size for the 16-pixel grid
    const T = 16;
    const COLS = Math.ceil(W / T);  // 40
    const ROWS = Math.ceil(H / T);  // 36

    // === COLOR PALETTE (GBA Pokémon FR/LG) ===
    const C = {
      grass1: 0x90d860, grass2: 0x80c850, grass3: 0x70b840,
      dirt1: 0xc8b870, dirt2: 0xb8a860, dirt3: 0xd8c880,
      treeTrunk: 0x785830, treeGreen1: 0x208020, treeGreen2: 0x38a038, treeGreen3: 0x60c060,
      treeDark: 0x186018, treeEdge: 0x488848,
      roofRed1: 0xe07848, roofRed2: 0xc06038, roofRed3: 0xf09868, roofStripe: 0xf8b888,
      wall1: 0xe8e8f0, wall2: 0xd0d0d8, wallShade: 0xb8b8c8,
      windowBlue: 0x58a0d8, windowFrame: 0x404858,
      doorBrown: 0xb08050, doorFrame: 0x887040,
      fenceWhite: 0xf0f0f0, fenceShadow: 0xc8c8c8,
      water1: 0x3878c8, water2: 0x4888d8, water3: 0x5898e8, waterLight: 0x78b8f8,
      lilyPad: 0x48a048, lilyFlower: 0xf098b0,
      flowerRed: 0xe04040, flowerPink: 0xf080a0, flowerYellow: 0xf8d830, flowerWhite: 0xf0f0e8,
      signPost: 0x886838, signBoard: 0xd0c090,
      pathEdge: 0xa89858,
      clawdRoof1: 0xe07848, clawdRoof2: 0xc06038, clawdRoofTile: 0xd89870,
      clawdWall: 0xd8d0c0, clawdWallDark: 0xb0a890,
      clawdDoor: 0x607898, pokeball1: 0xf0f0f0, pokeball2: 0xe04040,
    };

    const g = this.add.graphics();

    // ============================
    // 1) BASE GRASS FILL
    // ============================
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const variant = ((r + c) % 3 === 0) ? C.grass2 : ((r * 7 + c * 3) % 5 === 0) ? C.grass3 : C.grass1;
        g.fillStyle(variant);
        g.fillRect(c * T, r * T, T, T);
      }
    }

    // ============================
    // 2) TREE BORDER (dense perimeter, 3 tiles thick)
    // ============================
    this.drawTreeBorder(g, T, COLS, ROWS, C);

    // ============================
    // 3) DIRT/PATH AREA (inner town ground)
    // ============================
    this.drawPaths(g, T, C);

    // ============================
    // 4) LEFT HOUSE (top - player's house style)
    // ============================
    this.drawHouse(g, T * 5, T * 6, T, C, 'HOUSE 1');

    // ============================
    // 5) LEFT HOUSE (bottom - rival's house style)
    // NOT in the screenshot's left side. Actually the screenshot shows:
    //   - Top left: house 1
    //   - Bottom left: garden area with flowers
    //   - Right: Lab building (Pokémon Center shape)
    // Let's match exactly: two buildings left column, one large building right
    // ============================

    // ============================
    // 6) CLAWD LABS (Pokémon Center/Lab style, right side)
    // ============================
    this.drawLab(g, T * 22, T * 8, T, C);

    // ============================
    // 7) FENCES
    // ============================
    this.drawFences(g, T, C);

    // ============================
    // 8) FLOWER GARDEN (bottom left area)
    // ============================
    this.drawFlowerGarden(g, T, C);

    // ============================
    // 9) SIGN
    // ============================
    this.drawSign(g, T * 11, T * 16, T, C);

    // ============================
    // 10) WATER (bottom)
    // ============================
    this.drawWater(g, T, COLS, ROWS, C);

    // ============================
    // 11) NPC (Professor/Oak style)
    // ============================
    this.drawNPC(T * 14, T * 16, C);

    // ============================
    // 12) PLAYER
    // ============================
    this.drawPlayer(T * 12, T * 14);

    // === Physics player ===
    this.player = this.add.rectangle(T * 12, T * 14, 14, 18, 0x000000);
    this.player.setAlpha(0); // invisible, we use the sprite
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(14, 14);

    // Player sprite group (follows physics body)
    this.playerSprite = this.add.graphics();
    this.drawPlayerSprite(this.playerSprite, 0, 0);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: 87, down: 83, left: 65, right: 68 });
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Door position for CLAWD LABS
    this.labDoorX = T * 26;
    this.labDoorY = T * 17;

    // Collision boundaries (simplified)
    this.createCollisions(T, C);

    this.showDialog('???', 'Welcome to CLAWD TOWN!\nUse arrow keys to move.\nVisit CLAWD LABS to meet the agents.', () => {});
  }

  // ============================
  // TREE BORDER
  // ============================
  drawTreeBorder(g, T, COLS, ROWS, C) {
    // Draw dense tree tiles around the perimeter
    // Top: rows 0-2, Bottom: rows ROWS-4 to ROWS (except water gap)
    // Left: cols 0-2, Right: cols COLS-3 to COLS

    const drawTreeTile = (x, y, seed) => {
      // Trunk
      g.fillStyle(C.treeTrunk);
      g.fillRect(x + 5, y + 10, 6, 6);

      // Main canopy (layered circles for GBA feel)
      g.fillStyle(C.treeGreen1);
      g.fillRect(x + 1, y + 2, 14, 10);
      g.fillRect(x + 3, y, 10, 14);

      // Highlights
      g.fillStyle(C.treeGreen2);
      g.fillRect(x + 3, y + 2, 10, 6);
      g.fillRect(x + 5, y + 1, 6, 3);

      // Light spots
      g.fillStyle(C.treeGreen3);
      g.fillRect(x + 4, y + 3, 3, 2);
      g.fillRect(x + 9, y + 4, 2, 2);

      // Dark edge (bottom)
      g.fillStyle(C.treeDark);
      g.fillRect(x + 2, y + 10, 12, 2);
    };

    // Top border: 3 rows
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < COLS; c++) {
        drawTreeTile(c * T, r * T, r * COLS + c);
      }
    }

    // Bottom border: 3 rows (leave gap for water area at bottom)
    // In screenshot, bottom has water, then trees below the town area
    // Actually the path leads down to water. Trees are above the water on sides.
    // Let's put trees on left/right borders going down to where water starts
    const WATER_START = ROWS - 5;

    // Left border: cols 0-2, from row 3 down
    for (let r = 3; r < WATER_START; r++) {
      for (let c = 0; c < 3; c++) {
        drawTreeTile(c * T, r * T, r * COLS + c);
      }
    }

    // Right border: cols COLS-3 to COLS, from row 3 down
    for (let r = 3; r < WATER_START; r++) {
      for (let c = COLS - 3; c < COLS; c++) {
        drawTreeTile(c * T, r * T, r * COLS + c);
      }
    }

    // Bottom-left trees (next to water, left side)
    for (let r = WATER_START; r < ROWS; r++) {
      for (let c = 0; c < 3; c++) {
        drawTreeTile(c * T, r * T, r * COLS + c);
      }
    }

    // Bottom-right trees (next to water, right side)
    for (let r = WATER_START; r < ROWS; r++) {
      for (let c = COLS - 3; c < COLS; c++) {
        drawTreeTile(c * T, r * T, r * COLS + c);
      }
    }

    // A few extra trees behind buildings (row 3-4, scattered)
    const extraTrees = [
      [3, 3], [3, 4], [3, 14], [3, 15], [3, 16],
      [4, 3], [4, 15],
    ];
    for (const [r, c] of extraTrees) {
      drawTreeTile(c * T, r * T, r * COLS + c);
    }
  }

  // ============================
  // PATHS (dirt ground between buildings)
  // ============================
  drawPaths(g, T, C) {
    // Main vertical path (center of town)
    for (let r = 5; r < 31; r++) {
      for (let c = 13; c < 16; c++) {
        const variant = (r + c) % 2 === 0 ? C.dirt1 : C.dirt3;
        g.fillStyle(variant);
        g.fillRect(c * T, r * T, T, T);
      }
      // Path edges
      g.fillStyle(C.pathEdge);
      g.fillRect(13 * T, r * T, 1, T);
      g.fillRect(16 * T - 1, r * T, 1, T);
    }

    // Horizontal path to lab (right)
    for (let r = 14; r < 17; r++) {
      for (let c = 15; c < 22; c++) {
        const variant = (r + c) % 2 === 0 ? C.dirt1 : C.dirt3;
        g.fillStyle(variant);
        g.fillRect(c * T, r * T, T, T);
      }
    }

    // Horizontal path to houses (left)
    for (let r = 14; r < 17; r++) {
      for (let c = 7; c < 14; c++) {
        const variant = (r + c) % 2 === 0 ? C.dirt1 : C.dirt3;
        g.fillStyle(variant);
        g.fillRect(c * T, r * T, T, T);
      }
    }

    // Small path area in front of lab entrance
    for (let r = 17; r < 19; r++) {
      for (let c = 22; c < 31; c++) {
        const variant = (r + c) % 2 === 0 ? C.dirt1 : C.dirt3;
        g.fillStyle(variant);
        g.fillRect(c * T, r * T, T, T);
      }
    }

    // Path down to bottom exit
    for (let r = 25; r < 31; r++) {
      for (let c = 13; c < 16; c++) {
        const variant = (r + c) % 2 === 0 ? C.dirt1 : C.dirt3;
        g.fillStyle(variant);
        g.fillRect(c * T, r * T, T, T);
      }
    }
  }

  // ============================
  // HOUSE (GBA style with red roof)
  // ============================
  drawHouse(g, x, y, T, C, label) {
    const hw = T * 8;  // house width (8 tiles)
    const hh = T * 6;  // house height (6 tiles)

    // Shadow underneath
    g.fillStyle(0x608040);
    g.fillRect(x + 4, y + hh - 2, hw, 4);

    // Main wall
    g.fillStyle(C.wall1);
    g.fillRect(x, y + T * 2, hw, hh - T * 2);

    // Wall panel lines
    g.fillStyle(C.wall2);
    for (let i = 0; i < 4; i++) {
      g.fillRect(x, y + T * 2 + i * T, hw, 1);
    }

    // Wall base
    g.fillStyle(C.wallShade);
    g.fillRect(x, y + hh - 4, hw, 4);

    // Roof
    // Main roof body
    g.fillStyle(C.roofRed1);
    g.fillRect(x - T, y, hw + T * 2, T * 2.5);

    // Roof top ridge
    g.fillStyle(C.roofRed2);
    g.fillRect(x - T, y, hw + T * 2, T * 0.5);

    // Roof stripe highlights
    g.fillStyle(C.roofStripe);
    g.fillRect(x - T + 4, y + T * 0.8, hw + T * 2 - 8, 3);
    g.fillRect(x - T + 4, y + T * 1.6, hw + T * 2 - 8, 3);

    // Roof shadow bottom edge
    g.fillStyle(C.roofRed2);
    g.fillRect(x - T, y + T * 2.3, hw + T * 2, 3);

    // Windows (two)
    const wy = y + T * 2.8;
    // Left window
    g.fillStyle(C.windowFrame);
    g.fillRect(x + T * 1, wy, T * 2, T * 1.5);
    g.fillStyle(C.windowBlue);
    g.fillRect(x + T * 1 + 2, wy + 2, T * 2 - 4, T * 1.5 - 4);
    // Window cross
    g.fillStyle(C.windowFrame);
    g.fillRect(x + T * 2, wy + 2, 2, T * 1.5 - 4);
    g.fillRect(x + T * 1 + 2, wy + T * 0.7, T * 2 - 4, 2);

    // Right window
    g.fillStyle(C.windowFrame);
    g.fillRect(x + T * 5, wy, T * 2, T * 1.5);
    g.fillStyle(C.windowBlue);
    g.fillRect(x + T * 5 + 2, wy + 2, T * 2 - 4, T * 1.5 - 4);
    g.fillStyle(C.windowFrame);
    g.fillRect(x + T * 6, wy + 2, 2, T * 1.5 - 4);
    g.fillRect(x + T * 5 + 2, wy + T * 0.7, T * 2 - 4, 2);

    // Door
    const dx = x + T * 3;
    const dy = y + hh - T * 2;
    g.fillStyle(C.doorFrame);
    g.fillRect(dx, dy, T * 2, T * 2);
    g.fillStyle(C.doorBrown);
    g.fillRect(dx + 2, dy + 2, T * 2 - 4, T * 2 - 2);
    // Door knob
    g.fillStyle(0xf8d830);
    g.fillCircle(dx + T * 1.5, dy + T, 2);

    // Pipe/drain on sides
    g.fillStyle(0xc0c0c8);
    g.fillRect(x + hw - 6, y + T * 2, 4, hh - T * 2);
    g.fillRect(x + 2, y + T * 2, 4, hh - T * 2);
  }

  // ============================
  // LAB BUILDING (Pokémon Center / Professor's Lab style)
  // ============================
  drawLab(g, x, y, T, C) {
    const lw = T * 12;  // 12 tiles wide
    const lh = T * 9;   // 9 tiles tall

    // Shadow
    g.fillStyle(0x608040);
    g.fillRect(x + 4, y + lh - 2, lw, 6);

    // Main wall (lower section)
    g.fillStyle(C.clawdWall);
    g.fillRect(x, y + T * 4, lw, lh - T * 4);

    // Wall details (horizontal lines)
    g.fillStyle(C.clawdWallDark);
    for (let i = 0; i < 5; i++) {
      g.fillRect(x, y + T * 4 + i * T, lw, 1);
    }

    // Upper wall section (taller, like Pokémon Center)
    g.fillStyle(0xd0c8b8);
    g.fillRect(x + T * 2, y + T * 1.5, lw - T * 4, T * 3);

    // Main roof (red tiled roof)
    g.fillStyle(C.clawdRoof1);
    g.fillRect(x - T, y + T * 0.5, lw + T * 2, T * 1.5);
    // Upper section roof
    g.fillStyle(C.clawdRoof1);
    g.fillRect(x + T * 1, y, lw - T * 2, T * 2);

    // Roof tiles pattern
    g.fillStyle(C.clawdRoofTile);
    for (let i = 0; i < 6; i++) {
      g.fillRect(x + T * 1 + i * T * 1.6, y + 2, T * 1.2, T * 0.3);
      g.fillRect(x + T * 1.8 + i * T * 1.6, y + T * 0.5, T * 1.2, T * 0.3);
    }
    g.fillStyle(C.clawdRoof2);
    g.fillRect(x - T, y + T * 1.8, lw + T * 2, 3);
    g.fillRect(x + T * 1, y + T * 1.8, lw - T * 2, 3);

    // Entrance overhang
    g.fillStyle(C.clawdRoof1);
    g.fillRect(x + T * 3, y + T * 4, T * 6, T * 1.5);
    g.fillStyle(C.clawdRoof2);
    g.fillRect(x + T * 3, y + T * 5.3, T * 6, 3);

    // Support pillars for overhang
    g.fillStyle(0xc0b8a8);
    g.fillRect(x + T * 3.2, y + T * 5.5, T * 0.6, T * 3.5);
    g.fillRect(x + T * 8.2, y + T * 5.5, T * 0.6, T * 3.5);

    // Windows on upper section
    const wy = y + T * 2;
    g.fillStyle(C.windowFrame);
    g.fillRect(x + T * 3, wy, T * 2, T * 1.5);
    g.fillStyle(C.windowBlue);
    g.fillRect(x + T * 3 + 2, wy + 2, T * 2 - 4, T * 1.5 - 4);
    g.fillStyle(C.windowFrame);
    g.fillRect(x + T * 4, wy + 2, 2, T * 1.5 - 4);

    g.fillStyle(C.windowFrame);
    g.fillRect(x + T * 7, wy, T * 2, T * 1.5);
    g.fillStyle(C.windowBlue);
    g.fillRect(x + T * 7 + 2, wy + 2, T * 2 - 4, T * 1.5 - 4);
    g.fillStyle(C.windowFrame);
    g.fillRect(x + T * 8, wy + 2, 2, T * 1.5 - 4);

    // Pokéball emblem (center of building front)
    const px = x + T * 6;
    const py = y + T * 4.5;
    // Outer circle
    g.fillStyle(C.pokeball2);
    g.fillCircle(px, py, 12);
    // Bottom half white
    g.fillStyle(C.pokeball1);
    g.fillRect(px - 12, py, 24, 12);
    // Cut to circle shape (crude but pixel-art appropriate)
    g.fillStyle(C.clawdRoof1); // match roof color to mask corners
    g.fillRect(px - 14, py + 6, 6, 8);
    g.fillRect(px + 8, py + 6, 6, 8);
    // Center band
    g.fillStyle(0x303030);
    g.fillRect(px - 12, py - 1, 24, 3);
    // Center button
    g.fillStyle(0xf8f8f8);
    g.fillCircle(px, py, 4);
    g.fillStyle(0x303030);
    g.fillCircle(px, py, 2);

    // Door (center, large)
    const dx = x + T * 5;
    const dy = y + lh - T * 2.5;
    g.fillStyle(C.clawdDoor);
    g.fillRect(dx, dy, T * 2, T * 2.5);
    g.fillStyle(0x7890a8);
    g.fillRect(dx + 3, dy + 3, T * 2 - 6, T * 2.5 - 3);
    // Door divider
    g.fillStyle(C.clawdDoor);
    g.fillRect(dx + T, dy + 3, 2, T * 2.5 - 3);

    // Side decorations - flower pots at entrance
    this.drawSmallFlowerPot(g, x + T * 3.5, y + lh - T * 1, C);
    this.drawSmallFlowerPot(g, x + T * 8.5, y + lh - T * 1, C);

    // Label
    this.add.text(x + T * 6, y + T * 3.7, 'CLAWD LABS', {
      fontSize: '7px', fontFamily: "'Press Start 2P'", color: '#443322', align: 'center'
    }).setOrigin(0.5);

    // Store door position for collision
    this.labDoorX = dx + T;
    this.labDoorY = dy + T * 2;
  }

  drawSmallFlowerPot(g, x, y, C) {
    g.fillStyle(0xc06030);
    g.fillRect(x - 4, y, 8, 6);
    g.fillStyle(0xe04040);
    g.fillCircle(x, y - 2, 4);
    g.fillStyle(0x48a048);
    g.fillRect(x - 1, y - 6, 2, 5);
  }

  // ============================
  // FENCES
  // ============================
  drawFences(g, T, C) {
    // Fence along bottom of house area (left side)
    const fy = T * 19;

    // Horizontal fence below houses
    for (let c = 4; c < 13; c++) {
      this.drawFencePost(g, c * T, fy, T, C);
    }

    // Fence along right side near water
    for (let c = 16; c < 22; c++) {
      this.drawFencePost(g, c * T, T * 27, T, C);
    }
  }

  drawFencePost(g, x, y, T, C) {
    // Vertical post
    g.fillStyle(C.fenceWhite);
    g.fillRect(x + 3, y, 3, T);
    g.fillRect(x + T - 6, y, 3, T);
    // Horizontal rails
    g.fillRect(x, y + 3, T, 2);
    g.fillRect(x, y + T - 5, T, 2);
    // Post tops
    g.fillStyle(C.fenceShadow);
    g.fillRect(x + 3, y, 3, 2);
    g.fillRect(x + T - 6, y, 3, 2);
  }

  // ============================
  // FLOWER GARDEN (bottom left)
  // ============================
  drawFlowerGarden(g, T, C) {
    const flowers = [
      // Red flower clusters (like in the screenshot)
      { x: T * 5, y: T * 21, color: C.flowerRed },
      { x: T * 6, y: T * 21, color: C.flowerRed },
      { x: T * 7, y: T * 21, color: C.flowerRed },
      { x: T * 8, y: T * 21, color: C.flowerRed },
      { x: T * 5, y: T * 22, color: C.flowerRed },
      { x: T * 6, y: T * 22, color: C.flowerRed },
      { x: T * 7, y: T * 22, color: C.flowerRed },
      { x: T * 8, y: T * 22, color: C.flowerRed },
      { x: T * 5, y: T * 23, color: C.flowerRed },
      { x: T * 6, y: T * 23, color: C.flowerRed },
      { x: T * 7, y: T * 23, color: C.flowerRed },
      { x: T * 8, y: T * 23, color: C.flowerRed },

      // Some pink/yellow ones mixed in
      { x: T * 9, y: T * 21, color: C.flowerPink },
      { x: T * 10, y: T * 22, color: C.flowerYellow },
      { x: T * 9, y: T * 23, color: C.flowerPink },
      { x: T * 10, y: T * 21, color: C.flowerRed },

      // Small cluster near fence
      { x: T * 4, y: T * 20, color: C.flowerPink },
      { x: T * 11, y: T * 20, color: C.flowerYellow },
    ];

    for (const f of flowers) {
      this.drawPixelFlower(g, f.x + T / 2, f.y + T / 2, f.color);
    }
  }

  drawPixelFlower(g, x, y, color) {
    // Stem
    g.fillStyle(0x48a048);
    g.fillRect(x - 1, y + 2, 2, 6);
    // Petals (5 small squares in cross)
    g.fillStyle(color);
    g.fillRect(x - 3, y - 1, 3, 3);
    g.fillRect(x + 1, y - 1, 3, 3);
    g.fillRect(x - 1, y - 3, 3, 3);
    g.fillRect(x - 1, y + 1, 3, 3);
    // Center
    g.fillStyle(0xf8e830);
    g.fillRect(x - 1, y - 1, 3, 3);
  }

  // ============================
  // SIGN
  // ============================
  drawSign(g, x, y, T, C) {
    // Post
    g.fillStyle(C.signPost);
    g.fillRect(x + T / 2 - 2, y, 4, T);
    // Board
    g.fillStyle(C.signBoard);
    g.fillRect(x - 2, y - 2, T + 4, T * 0.6);
    g.fillStyle(C.signPost);
    g.fillRect(x - 2, y - 2, T + 4, 2);
    g.fillRect(x - 2, y + T * 0.6 - 2, T + 4, 2);
  }

  // ============================
  // WATER (bottom section with lily pads)
  // ============================
  drawWater(g, T, COLS, ROWS, C) {
    const waterStartRow = ROWS - 5;
    const waterCols = { start: 3, end: COLS - 3 };

    for (let r = waterStartRow; r < ROWS; r++) {
      for (let c = waterCols.start; c < waterCols.end; c++) {
        // Water base
        const variant = (r + c) % 3 === 0 ? C.water1 : (r + c) % 3 === 1 ? C.water2 : C.water3;
        g.fillStyle(variant);
        g.fillRect(c * T, r * T, T, T);

        // Water highlights (small wave lines)
        if ((r * 7 + c * 13) % 11 === 0) {
          g.fillStyle(C.waterLight);
          g.fillRect(c * T + 2, r * T + 6, 8, 2);
        }
      }
    }

    // Shore line (top edge of water)
    g.fillStyle(C.dirt2);
    for (let c = waterCols.start; c < waterCols.end; c++) {
      g.fillRect(c * T, waterStartRow * T - 2, T, 4);
    }

    // Lily pads
    const lilyPositions = [
      [5, waterStartRow + 1], [8, waterStartRow + 2], [12, waterStartRow + 1],
      [18, waterStartRow + 2], [25, waterStartRow + 1], [30, waterStartRow + 2],
      [15, waterStartRow + 3], [22, waterStartRow + 1], [35, waterStartRow + 2],
    ];
    for (const [c, r] of lilyPositions) {
      if (c >= waterCols.start && c < waterCols.end) {
        // Lily pad (green oval)
        g.fillStyle(C.lilyPad);
        g.fillCircle(c * T + 8, r * T + 8, 6);
        g.fillStyle(0x60b060);
        g.fillCircle(c * T + 7, r * T + 7, 4);
        // Small notch
        g.fillStyle((r + c) % 3 === 0 ? C.water1 : C.water2);
        g.fillRect(c * T + 8, r * T + 6, 3, 2);

        // Occasional flower on lily pad
        if ((r + c) % 4 === 0) {
          g.fillStyle(C.lilyFlower);
          g.fillCircle(c * T + 6, r * T + 5, 3);
          g.fillStyle(0xf8e0e0);
          g.fillCircle(c * T + 6, r * T + 5, 1.5);
        }
      }
    }
  }

  // ============================
  // NPC sprite (simple pixel character)
  // ============================
  drawNPC(x, y, C) {
    const g = this.add.graphics();
    // Hair/head
    g.fillStyle(0xd0c0b0);
    g.fillRect(x - 6, y - 16, 12, 12);
    // Hair
    g.fillStyle(0xc8c0b8);
    g.fillRect(x - 6, y - 16, 12, 4);
    // Eyes
    g.fillStyle(0x303030);
    g.fillRect(x - 3, y - 10, 2, 2);
    g.fillRect(x + 2, y - 10, 2, 2);
    // Body (lab coat)
    g.fillStyle(0xf0f0f0);
    g.fillRect(x - 7, y - 4, 14, 12);
    // Shirt underneath
    g.fillStyle(0xc06030);
    g.fillRect(x - 3, y - 4, 6, 3);
    // Feet
    g.fillStyle(0x604020);
    g.fillRect(x - 5, y + 8, 4, 3);
    g.fillRect(x + 1, y + 8, 4, 3);

    // NPC collision zone (for dialog trigger)
    this.npcX = x;
    this.npcY = y;
  }

  // ============================
  // PLAYER sprite (GBA-style trainer)
  // ============================
  drawPlayer(x, y) {
    // This is just the initial visual; updated in update()
  }

  drawPlayerSprite(g, x, y) {
    g.clear();
    // Hat
    g.fillStyle(0xe04040);
    g.fillRect(x - 7, y - 18, 14, 5);
    g.fillStyle(0xc03030);
    g.fillRect(x - 5, y - 19, 10, 3);
    // Head/face
    g.fillStyle(0xf0c8a0);
    g.fillRect(x - 5, y - 13, 10, 8);
    // Hair
    g.fillStyle(0x604020);
    g.fillRect(x - 6, y - 14, 3, 6);
    g.fillRect(x + 3, y - 14, 3, 6);
    // Eyes
    g.fillStyle(0x202020);
    g.fillRect(x - 3, y - 10, 2, 2);
    g.fillRect(x + 1, y - 10, 2, 2);
    // Body (jacket)
    g.fillStyle(0x4060c0);
    g.fillRect(x - 6, y - 5, 12, 10);
    // Jacket detail
    g.fillStyle(0x3050a0);
    g.fillRect(x - 1, y - 5, 2, 10);
    // Backpack
    g.fillStyle(0x40a040);
    g.fillRect(x + 5, y - 4, 4, 8);
    // Legs
    g.fillStyle(0x4060c0);
    g.fillRect(x - 5, y + 5, 4, 6);
    g.fillRect(x + 1, y + 5, 4, 6);
    // Shoes
    g.fillStyle(0xe04040);
    g.fillRect(x - 5, y + 10, 4, 2);
    g.fillRect(x + 1, y + 10, 4, 2);
  }

  // ============================
  // COLLISIONS (simplified boundary walls)
  // ============================
  createCollisions(T) {
    // Create invisible wall rectangles for buildings and trees
    this.walls = [];

    const addWall = (x, y, w, h) => {
      const wall = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000);
      wall.setAlpha(0);
      this.physics.add.existing(wall, true); // static
      this.physics.add.collider(this.player, wall);
      this.walls.push(wall);
    };

    // Tree borders
    addWall(0, 0, T * 3, T * 36);       // Left trees
    addWall(T * 37, 0, T * 3, T * 36);   // Right trees
    addWall(0, 0, T * 40, T * 3);        // Top trees

    // House 1
    addWall(T * 4, T * 6, T * 10, T * 5.5);

    // Lab building
    addWall(T * 21, T * 8, T * 14, T * 8.5);

    // Water boundary
    addWall(T * 3, T * 31, T * 34, T * 5);

    // Fence
    addWall(T * 4, T * 19, T * 9, T);
  }

  showDialog(name, text, onClose) {
    const dialog = document.getElementById('dialog');
    const nameEl = document.getElementById('dialog-name');
    const textEl = document.getElementById('dialog-text');
    dialog.style.display = 'block';
    nameEl.textContent = name;
    let i = 0;
    textEl.textContent = '';
    const t = setInterval(() => {
      textEl.textContent += text[i++];
      if (i >= text.length) {
        clearInterval(t);
        const close = (e) => {
          if (e.code === 'Space' || e.code === 'Enter') {
            dialog.style.display = 'none';
            document.removeEventListener('keydown', close);
            if (onClose) onClose();
          }
        };
        document.addEventListener('keydown', close);
        dialog.onclick = () => {
          dialog.style.display = 'none';
          if (onClose) onClose();
        };
      }
    }, 30);
  }

  update() {
    const speed = 120;
    const body = this.player.body;
    const T = 16;

    body.setVelocity(0);
    if (this.cursors.left.isDown || this.wasd.left.isDown) body.setVelocityX(-speed);
    else if (this.cursors.right.isDown || this.wasd.right.isDown) body.setVelocityX(speed);
    if (this.cursors.up.isDown || this.wasd.up.isDown) body.setVelocityY(-speed);
    else if (this.cursors.down.isDown || this.wasd.down.isDown) body.setVelocityY(speed);

    // Update player sprite position
    this.playerSprite.setPosition(this.player.x, this.player.y);

    const px = this.player.x;
    const py = this.player.y;

    // Lab door trigger
    if (px > this.labDoorX - 20 && px < this.labDoorX + 20 && py > this.labDoorY - 10 && py < this.labDoorY + 10) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(450, () => this.scene.start('LobbyScene'));
    }

    // NPC dialog trigger
    if (this.npcX && !this.npcDialogShown) {
      if (Math.abs(px - this.npcX) < 30 && Math.abs(py - this.npcY) < 30) {
        this.npcDialogShown = true;
        this.showDialog('PROFESSOR', "Welcome to CLAWD TOWN!\nI'm studying AI agents here.\nVisit the lab to meet them!", () => {
          this.npcDialogShown = false;
        });
      }
    }
  }
}
