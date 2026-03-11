export default class Intro {
  constructor(experience) {
    this.experience = experience
    this.overlay = document.getElementById('intro-overlay')
    this.enterBtn = document.getElementById('enter-btn')
    this.loadingBar = document.getElementById('loading-bar')
    this.loadingText = document.getElementById('loading-text')

    this.onEnter = null
  }

  updateProgress(progress) {
    const pct = Math.round(progress * 100)
    this.loadingBar.style.width = pct + '%'
    this.loadingText.textContent = pct < 100 ? `loading... ${pct}%` : 'ready!'
  }

  showEnterButton() {
    // Auto-enter immediately — no button needed
    this.loadingText.textContent = 'ready!'
    this._enter()
  }

  _enter() {
    this.overlay.classList.add('hidden')
    if (this.onEnter) {
      setTimeout(() => this.onEnter(), 600)
    }
  }
}
