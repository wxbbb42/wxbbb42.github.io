export default class Input {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      interact: false,
    }
    this._interactPressed = false
    this.locked = false

    window.addEventListener('keydown', (e) => this._onKey(e, true))
    window.addEventListener('keyup', (e) => this._onKey(e, false))
    window.addEventListener('blur', () => this._reset())
  }

  _onKey(e, down) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward = down; break
      case 'KeyS': case 'ArrowDown':  this.keys.backward = down; break
      case 'KeyA': case 'ArrowLeft':  this.keys.left = down; break
      case 'KeyD': case 'ArrowRight': this.keys.right = down; break
      case 'KeyE': case 'Space':
        if (down && !this._interactPressed) {
          this.keys.interact = true
          this._interactPressed = true
        }
        if (!down) {
          this._interactPressed = false
        }
        break
    }
  }

  _reset() {
    this.keys.forward = false
    this.keys.backward = false
    this.keys.left = false
    this.keys.right = false
    this.keys.interact = false
    this._interactPressed = false
  }

  get moving() {
    return !this.locked && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right)
  }

  consumeInteract() {
    if (this.keys.interact) {
      this.keys.interact = false
      return true
    }
    return false
  }

  update() {
    // Reset one-shot keys at end of frame
  }
}
