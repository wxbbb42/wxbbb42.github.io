export default class Dialog {
  constructor(experience) {
    this.experience = experience
    this.el = document.getElementById('dialog')
    this.nameEl = document.getElementById('dialog-name')
    this.textEl = document.getElementById('dialog-text')
    this.nextEl = document.getElementById('dialog-next')

    this.active = false
    this.typingInterval = null
    this.onClose = null

    this._handleDismiss = this._handleDismiss.bind(this)
  }

  show(name, text, onClose) {
    if (this.active) return

    this.active = true
    this.experience.input.locked = true
    this.onClose = onClose || null

    this.el.style.display = 'block'
    this.nameEl.textContent = name
    this.textEl.textContent = ''
    this.nextEl.style.display = 'none'

    // Typewriter effect
    let i = 0
    this.typingInterval = setInterval(() => {
      this.textEl.textContent += text[i]
      i++
      if (i >= text.length) {
        clearInterval(this.typingInterval)
        this.typingInterval = null
        this.nextEl.style.display = 'inline'
        // Allow dismissal
        document.addEventListener('keydown', this._handleDismiss)
        this.el.addEventListener('click', this._handleDismiss)
      }
    }, 28)
  }

  _handleDismiss(e) {
    if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'Enter' && e.code !== 'KeyE') return

    this.close()
  }

  close() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval)
      this.typingInterval = null
    }

    this.el.style.display = 'none'
    this.active = false
    this.experience.input.locked = false

    document.removeEventListener('keydown', this._handleDismiss)
    this.el.removeEventListener('click', this._handleDismiss)

    if (this.onClose) {
      this.onClose()
      this.onClose = null
    }
  }
}
