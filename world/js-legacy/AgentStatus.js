// AgentStatus.js — reads status.json
const AgentStatus = (() => {
  const AGENTS = ['main', 'caigou', 'startup'];
  let interval = null;
  function updateHUD(id, status) {
    const dot = document.getElementById(`dot-${id}`);
    const label = document.getElementById(`status-${id}`);
    if (!dot || !label) return;
    dot.className = 'dot ' + status;
    label.textContent = status;
    label.style.color = status === 'working' ? '#ffd700' : status === 'thinking' ? '#44aaff' : '#aaa';
  }
  async function poll() {
    try {
      const res = await fetch(`./status.json?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      for (const id of AGENTS) if (data[id]) updateHUD(id, data[id]);
    } catch(e) {}
  }
  function start() { poll(); interval = setInterval(poll, 10000); }
  function stop() { if (interval) clearInterval(interval); }
  return { start, stop, updateHUD };
})();
