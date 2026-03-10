import * as THREE from 'three'

export default class Renderer {
  constructor(experience) {
    this.experience = experience
    this.canvas = experience.canvas

    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    })
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.instance.setSize(window.innerWidth, window.innerHeight)
    this.instance.toneMapping = THREE.ACESFilmicToneMapping
    this.instance.toneMappingExposure = 1.2
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap

    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    this.instance.setSize(window.innerWidth, window.innerHeight)
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  render() {
    this.instance.render(this.experience.scene, this.experience.camera.instance)
  }
}
