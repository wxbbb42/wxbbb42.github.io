export default class AgentHUD {
  constructor(experience) {
    this.experience = experience
    this.el = document.getElementById('agent-hud')
    this.interval = null
    this.status = { main: 'idle', caigou: 'idle', startup: 'idle' }
    this.listeners = []
  }

  start() {
    this.el.style.display = 'flex'
    this._poll()
    this.interval = setInterval(() => this._poll(), 10000)
  }

  stop() {
    if (this.interval) clearInterval(this.interval)
    this.el.style.display = 'none'
  }

  getStatus(id) {
    return this.status[id] || 'idle'
  }

  on(event, callback) {
    if (event === 'statusChange') this.listeners.push(callback)
  }

  async _poll() {
    try {
      const res = await fetch(`./status.json?t=${Date.now()}`)
      if (!res.ok) return
      const data = await res.json()

      for (const id of ['main', 'caigou', 'startup']) {
        if (data[id] && data[id] !== this.status[id]) {
          this.status[id] = data[id]
          this._updateDot(id, data[id])
          // Emit status change event
          for (const cb of this.listeners) {
            cb(id, data[id])
          }
        }
      }
    } catch (e) {
      // Silently fail
    }
  }

  _updateDot(id, status) {
    const dot = document.getElementById(`dot-${id}`)
    const label = document.getElementById(`status-${id}`)
    if (!dot || !label) return

    dot.className = 'dot ' + status
    label.textContent = status
    label.style.color = status === 'working' ? '#ffd700'
      : status === 'thinking' ? '#44aaff'
      : '#aaa'
  }
}
