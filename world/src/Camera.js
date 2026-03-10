import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export default class Camera {
  constructor(experience) {
    this.experience = experience

    this.instance = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    )

    // Third-person offset from target
    this.offset = new THREE.Vector3(0, 6, 9)
    this.lookAtOffset = new THREE.Vector3(0, 1, 0)

    // Smooth follow target
    this.target = new THREE.Vector3(0, 0, 0)
    this.smoothPosition = new THREE.Vector3()
    this.smoothLookAt = new THREE.Vector3()

    // Set initial position
    this.smoothPosition.copy(this.target).add(this.offset)
    this.instance.position.copy(this.smoothPosition)
    this.smoothLookAt.copy(this.target).add(this.lookAtOffset)
    this.instance.lookAt(this.smoothLookAt)

    this.experience.scene.add(this.instance)

    // Debug orbit controls (toggle with C key)
    this.orbitMode = false
    this.orbitControls = new OrbitControls(this.instance, experience.canvas)
    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.1
    this.orbitControls.enabled = false

    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        this.orbitMode = !this.orbitMode
        this.orbitControls.enabled = this.orbitMode
        if (this.orbitMode) {
          // Set orbit target to current look-at point
          this.orbitControls.target.copy(this.smoothLookAt)
          console.log('📷 Orbit camera ON — drag to rotate, scroll to zoom')
        } else {
          console.log('📷 Orbit camera OFF — following player')
        }
      }
    })

    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    this.instance.aspect = window.innerWidth / window.innerHeight
    this.instance.updateProjectionMatrix()
  }

  setTarget(position) {
    this.target.copy(position)
  }

  update(delta) {
    if (this.orbitMode) {
      this.orbitControls.update()
      return
    }

    const lerpFactor = 1 - Math.pow(0.01, delta)

    // Desired camera position
    const desiredPos = this.target.clone().add(this.offset)
    this.smoothPosition.lerp(desiredPos, lerpFactor)
    this.instance.position.copy(this.smoothPosition)

    // Desired look-at point
    const desiredLookAt = this.target.clone().add(this.lookAtOffset)
    this.smoothLookAt.lerp(desiredLookAt, lerpFactor)
    this.instance.lookAt(this.smoothLookAt)
  }
}
