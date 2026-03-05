// main.js
const config = {
  type: Phaser.AUTO, width: 640, height: 576,
  parent: 'game-container', pixelArt: true, backgroundColor: '#7ec850',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: [TownScene, LobbyScene, OfficeScene]
};
let game;
document.getElementById('enter-btn').addEventListener('click', () => {
  const overlay = document.getElementById('intro-overlay');
  const flash = document.getElementById('flash');
  flash.style.opacity = '1';
  setTimeout(() => { flash.style.opacity = '0'; }, 150);
  setTimeout(() => { flash.style.opacity = '1'; }, 300);
  setTimeout(() => { flash.style.opacity = '0'; }, 450);
  setTimeout(() => {
    overlay.classList.add('hidden');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.getElementById('agent-hud').style.display = 'flex';
      game = new Phaser.Game(config);
      AgentStatus.start();
    }, 900);
  }, 600);
});
