import * as THREE from 'three'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  SMAAEffect,
  SSAOEffect,
  NormalPass,
} from 'postprocessing'

export default class Renderer {
  constructor(experience) {
    this.experience = experience
    this.canvas = experience.canvas

    // postprocessing REQUIRES: stencil:false, depth:false for correct framebuffer format
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,    // SMAA handles AA
      alpha: false,
      stencil: false,      // ← required by postprocessing
      depth: false,        // ← required by postprocessing
      powerPreference: 'high-performance',
    })
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.instance.setSize(window.innerWidth, window.innerHeight)
    this.instance.toneMapping = THREE.ACESFilmicToneMapping
    this.instance.toneMappingExposure = 1.4
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap
    this.instance.outputColorSpace = THREE.SRGBColorSpace

    this._setupPostProcessing()

    window.addEventListener('resize', () => this.resize())
  }

  _setupPostProcessing() {
    const { scene, camera } = this.experience

    // HalfFloatType = required for SSAO and other high-precision effects
    this.composer = new EffectComposer(this.instance, {
      frameBufferType: THREE.HalfFloatType,
    })

    // 1. Render pass
    const renderPass = new RenderPass(scene, camera.instance)
    this.composer.addPass(renderPass)

    // 2. Normal pass — SSAO needs scene normals
    this.normalPass = new NormalPass(scene, camera.instance)
    this.composer.addPass(this.normalPass)

    // 3. SSAO — contact shadows under character, building edges, terrain crevices
    this.ssaoEffect = new SSAOEffect(camera.instance, this.normalPass.texture, {
      blendFunction: 3,        // MULTIPLY
      distanceScaling: true,
      depthAwareUpsampling: true,
      normalDepthBuffer: undefined,
      samples: 9,
      rings: 4,
      intensity: 2.5,
      bias: 0.025,
      fade: 0.01,
      radius: 0.06,
      minRadiusScale: 0.33,
      luminanceInfluence: 0.7,
      color: null,
      resolutionScale: 0.5,
      resolutionX: undefined,
      resolutionY: undefined,
    })

    // 4. Bloom
    this.bloomEffect = new BloomEffect({
      intensity: 0.8,
      luminanceThreshold: 0.7,
      luminanceSmoothing: 0.4,
      mipmapBlur: true,
      radius: 0.5,
    })

    // 5. SMAA
    this.smaaEffect = new SMAAEffect()

    this.composer.addPass(new EffectPass(
      camera.instance,
      this.ssaoEffect,
      this.bloomEffect,
      this.smaaEffect,
    ))
  }

  updateDOF() {}  // stub — can add later

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
