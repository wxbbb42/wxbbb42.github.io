class LobbyScene extends Phaser.Scene {
  constructor() { super({ key: 'LobbyScene' }); }
  create() {
    const W = this.scale.width, H = this.scale.height;
    const g = this.add.graphics();
    for (let r=0;r<18;r++) for (let c=0;c<20;c++) { g.fillStyle((r+c)%2===0?0xf0f0f0:0xe0e0e0); g.fillRect(c*32,r*32,32,32); }
    g.fillStyle(0xf8e8d8); g.fillRect(0,0,W,80);
    g.fillStyle(0xcc4444); g.fillRect(0,0,W,24);
    g.fillStyle(0x8B5E3C); g.fillRect(W/2-80,100,160,32);
    g.fillStyle(0xa87050); g.fillRect(W/2-80,96,160,8);
    g.fillStyle(0x333366); g.fillRect(W/2-20,80,40,28);
    g.fillStyle(0x4444aa); g.fillRect(W/2-16,84,32,18);
    g.fillStyle(0x88aaff,0.5); g.fillRect(W/2-14,86,28,14);
    this.drawPot(g,48,200); this.drawPot(g,W-48,200);
    g.fillStyle(0xfff0e0); g.fillRect(80,30,60,36); g.fillRect(W-140,30,60,36);
    g.fillStyle(0x4477cc); g.fillRect(84,34,52,28);
    g.fillStyle(0xdddddd); g.fillRect(W-72,80,56,96);
    g.fillStyle(0x888888); g.fillRect(W-47,124,6,24);
    g.fillStyle(0xffdd00); g.fillCircle(W-28,100,6);
    g.fillStyle(0x88ccff); g.fillRect(W/2-24,H-40,48,40);
    g.lineStyle(2,0x333333); g.strokeRect(W/2-24,H-40,48,40);
    this.add.text(W/2,108,'[ CLAWD LABS ]',{fontSize:'7px',fontFamily:"'Press Start 2P'",color:'#333'}).setOrigin(0.5);
    this.add.text(W-44,170,'LIFT',{fontSize:'6px',fontFamily:"'Press Start 2P'",color:'#555'}).setOrigin(0.5);
    this.add.text(W/2,H-60,'▼ EXIT',{fontSize:'6px',fontFamily:"'Press Start 2P'",color:'#555'}).setOrigin(0.5);
    this.npc = this.add.rectangle(W/2,148,14,18,0x6688cc);
    this.player = this.add.rectangle(W/2,H-60,14,18,0xff0000);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({up:87,down:83,left:65,right:68});
    this.cameras.main.fadeIn(400,0,0,0);
    this.dialogShown = false;
  }
  drawPot(g,x,y) {
    g.fillStyle(0xcc6633); g.fillRect(x-12,y+12,24,20);
    g.fillStyle(0x228B22); g.fillCircle(x,y,18);
    g.fillStyle(0x2ea82e); g.fillCircle(x-8,y-6,12); g.fillCircle(x+8,y-6,12);
  }
  showDialog(name,text) {
    const dialog=document.getElementById('dialog'),nameEl=document.getElementById('dialog-name'),textEl=document.getElementById('dialog-text');
    dialog.style.display='block'; nameEl.textContent=name; let i=0; textEl.textContent='';
    const t=setInterval(()=>{ textEl.textContent+=text[i++]; if(i>=text.length){ clearInterval(t); dialog.onclick=()=>{dialog.style.display='none';this.dialogShown=false;}; }},28);
  }
  update() {
    const speed=120,body=this.player.body,W=this.scale.width,H=this.scale.height;
    body.setVelocity(0);
    if(this.cursors.left.isDown||this.wasd.left.isDown) body.setVelocityX(-speed);
    else if(this.cursors.right.isDown||this.wasd.right.isDown) body.setVelocityX(speed);
    if(this.cursors.up.isDown||this.wasd.up.isDown) body.setVelocityY(-speed);
    else if(this.cursors.down.isDown||this.wasd.down.isDown) body.setVelocityY(speed);
    const px=this.player.x,py=this.player.y;
    if(Math.abs(px-W/2)<40&&Math.abs(py-148)<40&&!this.dialogShown){ this.dialogShown=true; this.showDialog('RECEPTIONIST','Welcome to CLAWD LABS!\nOur agents are on the 2nd floor.\nTake the elevator on the right →'); }
    if(px>W-80&&py<180&&py>80){ this.cameras.main.fadeOut(400,0,0,0); this.time.delayedCall(450,()=>this.scene.start('OfficeScene')); }
    if(py>H-44&&px>W/2-30&&px<W/2+30){ this.cameras.main.fadeOut(400,0,0,0); this.time.delayedCall(450,()=>this.scene.start('TownScene')); }
  }
}
