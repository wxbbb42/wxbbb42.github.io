class TownScene extends Phaser.Scene {
  constructor() { super({ key: 'TownScene' }); }
  preload() {}
  create() {
    const W = this.scale.width, H = this.scale.height;
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x7ec850, 0x7ec850, 1);
    sky.fillRect(0, 0, W, H);
    const ground = this.add.graphics();
    ground.fillStyle(0x7ec850);
    ground.fillRect(0, H * 0.55, W, H * 0.45);
    this.drawTown();
    this.player = this.add.rectangle(W / 2, H * 0.65, 14, 18, 0xff0000);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: 87, down: 83, left: 65, right: 68 });
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.createFlowers();
    this.showDialog('???', 'Welcome to CLAWD WORLD!\nUse arrow keys to move.\nWalk into the building to meet the agents.', () => {});
  }
  drawTown() {
    const W = this.scale.width, H = this.scale.height;
    const g = this.add.graphics();
    g.fillStyle(0xf8e8d8); g.fillRect(W/2 - 72, H * 0.3, 144, 120);
    g.fillStyle(0xcc4444); g.fillRect(W/2 - 80, H * 0.27, 160, 24);
    g.fillStyle(0x88ccff); g.fillRect(W/2 - 52, H * 0.35, 28, 24);
    g.fillStyle(0x88ccff); g.fillRect(W/2 + 24, H * 0.35, 28, 24);
    g.fillStyle(0x88ccff); g.fillRect(W/2 - 12, H * 0.44, 24, 28);
    g.lineStyle(2, 0x333333); g.strokeRect(W/2 - 12, H * 0.44, 24, 28);
    g.fillStyle(0xffffff); g.fillRect(W/2 - 36, H * 0.41, 72, 14);
    g.lineStyle(1, 0x999999); g.strokeRect(W/2 - 36, H * 0.41, 72, 14);
    g.fillStyle(0xe8e0d0); g.fillRect(W/2 - 20, H * 0.52, 40, H * 0.2);
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 === 0 ? 0xd0c8b8 : 0xe8e0d0);
      g.fillRect(W/2 - 20, H * 0.52 + i * 16, 40, 16);
    }
    this.drawTree(g, W/2 - 120, H * 0.48); this.drawTree(g, W/2 - 160, H * 0.52);
    this.drawTree(g, W/2 + 100, H * 0.48); this.drawTree(g, W/2 + 140, H * 0.52);
    this.add.text(W/2, H * 0.413, 'CLAWD LABS', { fontSize: '6px', fontFamily: "'Press Start 2P'", color: '#333', align: 'center' }).setOrigin(0.5);
  }
  drawTree(g, x, y) {
    g.fillStyle(0x8B5E3C); g.fillRect(x - 6, y + 16, 12, 16);
    g.fillStyle(0x228B22); g.fillCircle(x, y, 24);
    g.fillStyle(0x2ea82e); g.fillCircle(x - 8, y - 6, 16); g.fillCircle(x + 8, y - 6, 16);
  }
  createFlowers() {
    const W = this.scale.width, H = this.scale.height;
    const positions = [
      [W/2-90,H*0.58],[W/2-60,H*0.62],[W/2-140,H*0.60],
      [W/2+70,H*0.58],[W/2+110,H*0.62],[W/2+150,H*0.60],
      [W/2-180,H*0.68],[W/2+180,H*0.68],[W/2-40,H*0.72],[W/2+50,H*0.70],
    ];
    const colors = [0xff6688,0xffaacc,0xff88aa,0xffddee,0xffffff,0xffff88];
    const g = this.add.graphics();
    for (const [x,y] of positions) {
      g.lineStyle(1,0x228B22); g.lineBetween(x,y+8,x,y);
      const c = colors[Math.floor(Math.random()*colors.length)];
      for (let i=0;i<5;i++) { const a=(i/5)*Math.PI*2; g.fillStyle(c); g.fillCircle(x+Math.cos(a)*4,y+Math.sin(a)*4,3); }
      g.fillStyle(0xffff00); g.fillCircle(x,y,2.5);
    }
  }
  showDialog(name, text, onClose) {
    const dialog = document.getElementById('dialog');
    const nameEl = document.getElementById('dialog-name');
    const textEl = document.getElementById('dialog-text');
    dialog.style.display = 'block'; nameEl.textContent = name;
    let i = 0; textEl.textContent = '';
    const t = setInterval(() => {
      textEl.textContent += text[i++];
      if (i >= text.length) {
        clearInterval(t);
        const close = (e) => { if (e.code==='Space'||e.code==='Enter') { dialog.style.display='none'; document.removeEventListener('keydown',close); if(onClose)onClose(); } };
        document.addEventListener('keydown', close);
        dialog.onclick = () => { dialog.style.display='none'; if(onClose)onClose(); };
      }
    }, 30);
  }
  update() {
    const speed = 120, body = this.player.body, W = this.scale.width, H = this.scale.height;
    body.setVelocity(0);
    if (this.cursors.left.isDown || this.wasd.left.isDown) body.setVelocityX(-speed);
    else if (this.cursors.right.isDown || this.wasd.right.isDown) body.setVelocityX(speed);
    if (this.cursors.up.isDown || this.wasd.up.isDown) body.setVelocityY(-speed);
    else if (this.cursors.down.isDown || this.wasd.down.isDown) body.setVelocityY(speed);
    const px = this.player.x, py = this.player.y;
    if (px > W/2-18 && px < W/2+18 && py < H*0.495 && py > H*0.44) {
      this.cameras.main.fadeOut(400,0,0,0);
      this.time.delayedCall(450, () => this.scene.start('LobbyScene'));
    }
  }
}
