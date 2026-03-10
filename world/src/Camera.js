import * as THREE from 'three'
import { lerp } from './utils/math.js'

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
    this.offset = new THREE.Vector3(0, 10, 14)
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
