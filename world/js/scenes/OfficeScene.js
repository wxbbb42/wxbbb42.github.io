const AGENT_DATA = [
  { id:'main', name:'Claw 🦞', role:'Chief Assistant', color:0xff4444, deskX:130, dialog:"I'm Claw, your main assistant.\nMemory, scheduling, everything.\nCurrently: {status}" },
  { id:'caigou', name:'Coin 🐶', role:'Market Analyst', color:0xf0a000, deskX:320, dialog:"I'm Coin. Markets & ETFs.\nDaily briefings every morning.\nCurrently: {status}" },
  { id:'startup', name:'Neo 🚀', role:'Startup Strategist', color:0x4488ff, deskX:510, dialog:"I'm Neo. Product strategy\nand competitive analysis.\nCurrently: {status}" }
];
class OfficeScene extends Phaser.Scene {
  constructor() { super({ key: 'OfficeScene' }); }
  create() {
    const W=this.scale.width,H=this.scale.height,g=this.add.graphics();
    for(let r=0;r<18;r++){ g.fillStyle(r%2===0?0xc8a86a:0xb89858); g.fillRect(0,r*32,W,32); }
    g.fillStyle(0xe8e0d8); g.fillRect(0,0,W,64);
    g.fillStyle(0xcc4444); g.fillRect(0,0,W,20);
    g.fillStyle(0x88ccff); g.fillRect(W/2-60,22,120,32);
    g.lineStyle(3,0xffffff); g.lineBetween(W/2,22,W/2,54); g.lineBetween(W/2-60,38,W/2+60,38);
    this.agentSprites={}; this.agentGlows={};
    for(const a of AGENT_DATA){
      this.drawDesk(g,a);
      const glow=this.add.graphics(); glow.fillStyle(0xffd700,0.3); glow.fillCircle(a.deskX,H*0.45,20); this.agentGlows[a.id]=glow;
      const sprite=this.add.rectangle(a.deskX,H*0.45,14,18,a.color); this.agentSprites[a.id]=sprite;
      this.add.text(a.deskX,H*0.45+20,a.name,{fontSize:'6px',fontFamily:"'Press Start 2P'",color:'#222'}).setOrigin(0.5);
      this.add.text(a.deskX,H*0.45+30,a.role,{fontSize:'5px',fontFamily:"'Press Start 2P'",color:'#888'}).setOrigin(0.5);
    }
    g.fillStyle(0xdddddd); g.fillRect(W-64,64,48,80);
    g.fillStyle(0x888888); g.fillRect(W-43,100,6,24);
    g.fillStyle(0xffdd00); g.fillCircle(W-26,82,5);
    this.add.text(W-40,140,'↓ 1F',{fontSize:'6px',fontFamily:"'Press Start 2P'",color:'#555'}).setOrigin(0.5);
    this.player=this.add.rectangle(W/2,H-60,14,18,0xff0000);
    this.physics.add.existing(this.player); this.player.body.setCollideWorldBounds(true);
    this.cursors=this.input.keyboard.createCursorKeys();
    this.wasd=this.input.keyboard.addKeys({up:87,down:83,left:65,right:68});
    this.cameras.main.fadeIn(400,0,0,0); this.activeDialog=null;
    this.tweenAgents();
    this.time.addEvent({delay:1000,loop:true,callback:this.updateAgentVisuals,callbackScope:this});
  }
  drawDesk(g,a) {
    const x=a.deskX,H=this.scale.height,dY=H*0.55;
    g.fillStyle(0x8B5E3C); g.fillRect(x-44,dY,88,28);
    g.fillStyle(0xa87050); g.fillRect(x-44,dY-4,88,6);
    g.fillStyle(0x222244); g.fillRect(x-18,dY-36,36,28);
    g.fillStyle(0x3344aa); g.fillRect(x-14,dY-32,28,20);
    g.fillStyle(0x88aaff,0.6); g.fillRect(x-12,dY-30,24,16);
    g.fillStyle(0xcccccc); g.fillRect(x-18,dY+4,36,8);
  }
  tweenAgents() {
    for(const a of AGENT_DATA){ const s=this.agentSprites[a.id]; if(!s)continue; this.tweens.add({targets:s,y:s.y-4,duration:800+Math.random()*400,yoyo:true,repeat:-1,ease:'Sine.easeInOut',delay:Math.random()*600}); }
  }
  updateAgentVisuals() {
    for(const a of AGENT_DATA){
      const dot=document.getElementById(`dot-${a.id}`); if(!dot)continue;
      const status=dot.className.replace('dot ','').trim();
      const glow=this.agentGlows[a.id]; if(!glow)continue;
      glow.clear();
      const color=status==='working'?0xffd700:status==='thinking'?0x44aaff:0x888888;
      glow.fillStyle(color,status==='idle'?0.1:0.4);
      glow.fillCircle(AGENT_DATA.find(x=>x.id===a.id).deskX,this.scale.height*0.45,22);
    }
  }
  showDialog(name,text){
    const dialog=document.getElementById('dialog'),nameEl=document.getElementById('dialog-name'),textEl=document.getElementById('dialog-text');
    dialog.style.display='block'; nameEl.textContent=name; let i=0; textEl.textContent='';
    const t=setInterval(()=>{ textEl.textContent+=text[i++]; if(i>=text.length){ clearInterval(t); dialog.onclick=()=>{dialog.style.display='none';this.activeDialog=null;}; }},28);
  }
  update(){
    const speed=120,body=this.player.body,W=this.scale.width,H=this.scale.height;
    body.setVelocity(0);
    if(this.cursors.left.isDown||this.wasd.left.isDown) body.setVelocityX(-speed);
    else if(this.cursors.right.isDown||this.wasd.right.isDown) body.setVelocityX(speed);
    if(this.cursors.up.isDown||this.wasd.up.isDown) body.setVelocityY(-speed);
    else if(this.cursors.down.isDown||this.wasd.down.isDown) body.setVelocityY(speed);
    const px=this.player.x,py=this.player.y;
    if(!this.activeDialog){
      for(const a of AGENT_DATA){
        if(Math.abs(px-a.deskX)<50&&Math.abs(py-H*0.45)<60){
          const dot=document.getElementById(`dot-${a.id}`);
          const status=dot?dot.className.replace('dot ','').trim():'idle';
          this.activeDialog=a.id;
          this.showDialog(a.name,a.dialog.replace('{status}',status.toUpperCase()));
          break;
        }
      }
    }
    if(px>W-72&&py<150){ this.cameras.main.fadeOut(400,0,0,0); this.time.delayedCall(450,()=>this.scene.start('LobbyScene')); }
  }
}
