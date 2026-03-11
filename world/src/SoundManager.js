/**
 * SoundManager — procedural audio via Web Audio API
 * No files needed. Generates footstep + jump + land sounds synthetically.
 */
export default class SoundManager {
  constructor() {
    this._ctx = null
    this._init()
  }

  _init() {
    // AudioContext must be resumed after user gesture
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.warn('Web Audio not supported')
    }

    // Resume on first interaction
    const resume = () => {
      if (this._ctx?.state === 'suspended') this._ctx.resume()
      window.removeEventListener('mousedown', resume)
      window.removeEventListener('keydown', resume)
    }
    window.addEventListener('mousedown', resume)
    window.addEventListener('keydown', resume)
  }

  // Low-level: play a shaped noise burst
  _noise(opts = {}) {
    if (!this._ctx || this._ctx.state !== 'running') return
    const {
      duration    = 0.08,
      startFreq   = 200,
      endFreq     = 80,
      gain        = 0.18,
      filterType  = 'bandpass',
      filterFreq  = 300,
      filterQ     = 1.5,
    } = opts

    const bufSize = Math.ceil(this._ctx.sampleRate * duration)
    const buffer  = this._ctx.createBuffer(1, bufSize, this._ctx.sampleRate)
    const data    = buffer.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1)
    }

    const src = this._ctx.createBufferSource()
    src.buffer = buffer

    // Envelope
    const gainNode = this._ctx.createGain()
    gainNode.gain.setValueAtTime(gain, this._ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration)

    // Filter
    const filter = this._ctx.createBiquadFilter()
    filter.type            = filterType
    filter.frequency.value = filterFreq
    filter.Q.value         = filterQ

    // Tone sweep (optional body)
    const osc = this._ctx.createOscillator()
    osc.type                        = 'sine'
    osc.frequency.setValueAtTime(startFreq, this._ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(endFreq, this._ctx.currentTime + duration * 0.5)
    const oscGain = this._ctx.createGain()
    oscGain.gain.setValueAtTime(gain * 0.4, this._ctx.currentTime)
    oscGain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration * 0.5)

    src.connect(filter)
    filter.connect(gainNode)
    osc.connect(oscGain)
    oscGain.connect(gainNode)
    gainNode.connect(this._ctx.destination)

    src.start()
    src.stop(this._ctx.currentTime + duration)
    osc.start()
    osc.stop(this._ctx.currentTime + duration * 0.5)
  }

  // Muffled heavy boot step (astronaut suit on Martian regolith)
  playFootstep() {
    this._noise({
      duration   : 0.09,
      startFreq  : 120,
      endFreq    : 60,
      gain       : 0.12,
      filterType : 'lowpass',
      filterFreq : 250,
      filterQ    : 0.8,
    })
    // Slight suit rumble
    this._noise({
      duration   : 0.14,
      startFreq  : 60,
      endFreq    : 30,
      gain       : 0.06,
      filterType : 'lowpass',
      filterFreq : 100,
      filterQ    : 1.0,
    })
  }

  // Short whoosh on jump
  playJump() {
    this._noise({
      duration   : 0.18,
      startFreq  : 180,
      endFreq    : 90,
      gain       : 0.09,
      filterType : 'bandpass',
      filterFreq : 400,
      filterQ    : 2,
    })
  }

  // Heavier thud on landing
  playLand(intensity = 1) {
    this._noise({
      duration   : 0.15,
      startFreq  : 100,
      endFreq    : 30,
      gain       : 0.15 * intensity,
      filterType : 'lowpass',
      filterFreq : 180,
      filterQ    : 0.5,
    })
  }
}
