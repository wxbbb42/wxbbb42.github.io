import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

export default class Renderer {
  constructor(experience) {
    this.experience = experience
    this.canvas = experience.canvas

    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.instance.setSize(window.innerWidth, window.innerHeight)
    this.instance.toneMapping = THREE.ACESFilmicToneMapping
    this.instance.toneMappingExposure = 1.4
    this.instance.outputColorSpace = THREE.SRGBColorSpace

    this._setupPostProcessing()

    window.addEventListener('resize', () => this.resize())
  }

  _setupPostProcessing() {
    const { scene, camera } = this.experience
    const w = window.innerWidth
    const h = window.innerHeight

    this.composer = new EffectComposer(this.instance)
    this.composer.addPass(new RenderPass(scene, camera.instance))

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.8,   // strength
      0.4,   // radius
      0.7,   // threshold
    )
    this.composer.addPass(this.bloomPass)

    // OutputPass handles tone mapping + color space conversion
    this.composer.addPass(new OutputPass())
  }

  updateDOF() {}  // stub

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.instance.setSize(w, h)
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.composer.setSize(w, h)
  }

  render() {
    this.composer.render()
  }
}
