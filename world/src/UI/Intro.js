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
    this.enterBtn.classList.remove('hidden')
    this.loadingText.textContent = 'ready!'

    this.enterBtn.addEventListener('click', () => {
      this._enter()
    })
  }

  _enter() {
    this.overlay.classList.add('hidden')

    // Start the experience
    if (this.onEnter) {
      setTimeout(() => this.onEnter(), 800)
    }
  }
}
