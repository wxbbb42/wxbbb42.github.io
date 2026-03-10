export default class Ticker {
  constructor() {
    this.callbacks = []
    this.lastTime = 0
    this.running = false
  }

  on(event, callback) {
    if (event === 'tick') this.callbacks.push(callback)
  }

  start() {
    this.running = true
    this.lastTime = performance.now()
    this._loop()
  }

  stop() {
    this.running = false
  }

  _loop() {
    if (!this.running) return
    requestAnimationFrame(() => this._loop())

    const now = performance.now()
    let delta = (now - this.lastTime) / 1000
    this.lastTime = now

    // Clamp delta to avoid spiral of death
    if (delta > 0.05) delta = 0.05

    for (const cb of this.callbacks) {
      cb(delta)
    }
  }
}
