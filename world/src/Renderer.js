import * as THREE from 'three'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  SMAAEffect,
} from 'postprocessing'

export default class Renderer {
  constructor(experience) {
    this.experience = experience
    this.canvas = experience.canvas

    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false, // SMAA handles AA
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.instance.setSize(window.innerWidth, window.innerHeight)
    this.instance.toneMapping = THREE.ACESFilmicToneMapping
    this.instance.toneMappingExposure = 1.4  // slightly brighter for richer output
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap

    this._setupPostProcessing()

    window.addEventListener('resize', () => this.resize())
  }

  _setupPostProcessing() {
    const { scene, camera } = this.experience

    this.composer = new EffectComposer(this.instance)

    // 1. Base render
    this.composer.addPass(new RenderPass(scene, camera.instance))

    // 2. Bloom
    this.bloomEffect = new BloomEffect({
      intensity: 0.8,
      luminanceThreshold: 0.7,
      luminanceSmoothing: 0.4,
      mipmapBlur: true,
      radius: 0.5,
    })

    // 3. SMAA anti-aliasing
    this.smaaEffect = new SMAAEffect()

    this.composer.addPass(new EffectPass(camera.instance, this.bloomEffect, this.smaaEffect))
  }

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
