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

    // Spherical camera orbit around player
    this.azimuth   = Math.PI        // horizontal angle (radians), start behind player
    this.elevation = 0.45           // vertical angle (radians), ~25° above horizon
    this.radius    = 9              // distance from player
    this.minElevation = 0.05        // prevent going below ground
    this.maxElevation = Math.PI / 2 - 0.05

    // Smooth follow target
    this.target     = new THREE.Vector3(0, 0, 0)
    this.lookAtOffset = new THREE.Vector3(0, 1.2, 0)
    this.smoothPosition = new THREE.Vector3()
    this.smoothLookAt   = new THREE.Vector3()

    // Pointer lock mouse look
    this.sensitivity = 0.002
    this._pointerLocked = false
    this._setupPointerLock()

    // Set initial position
    this._applySpherical()
    this.smoothPosition.copy(this.instance.position)
    this.smoothLookAt.copy(this.target).add(this.lookAtOffset)

    this.experience.scene.add(this.instance)

    // Debug orbit controls (C key)
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
          this.orbitControls.target.copy(this.smoothLookAt)
          console.log('📷 Orbit camera ON')
        } else {
          console.log('📷 Orbit camera OFF')
        }
      }
      // ESC to exit pointer lock (browser handles this natively too)
    })

    window.addEventListener('resize', () => this.resize())
  }

  _setupPointerLock() {
    const canvas = this.experience.canvas

    // Click to lock pointer
    canvas.addEventListener('click', () => {
      if (!this._pointerLocked && !this.orbitMode) {
        canvas.requestPointerLock()
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this._pointerLocked = document.pointerLockElement === canvas
      // Show/hide hint
      const hint = document.getElementById('pointer-lock-hint')
      if (hint) hint.style.display = this._pointerLocked ? 'none' : 'flex'
    })

    document.addEventListener('mousemove', (e) => {
      if (!this._pointerLocked || this.orbitMode) return
      this.azimuth   -= e.movementX * this.sensitivity
      this.elevation  = Math.max(
        this.minElevation,
        Math.min(this.maxElevation, this.elevation - e.movementY * this.sensitivity)
      )
    })
  }

  _applySpherical() {
    // Convert spherical → cartesian offset from target
    const sinEl = Math.sin(this.elevation)
    const cosEl = Math.cos(this.elevation)
    const x = this.radius * cosEl * Math.sin(this.azimuth)
    const y = this.radius * sinEl
    const z = this.radius * cosEl * Math.cos(this.azimuth)
    this.instance.position.set(
      this.target.x + x,
      this.target.y + this.lookAtOffset.y + y,
      this.target.z + z,
    )
    const lookAt = this.target.clone().add(this.lookAtOffset)
    this.instance.lookAt(lookAt)
  }

  resize() {
    this.instance.aspect = window.innerWidth / window.innerHeight
    this.instance.updateProjectionMatrix()
  }

  setTarget(position) {
    this.target.copy(position)
  }

  // Returns the horizontal forward direction of camera (for player movement)
  getAzimuth() {
    return this.azimuth
  }

  update(delta) {
    if (this.orbitMode) {
      this.orbitControls.update()
      return
    }

    const lerpFactor = 1 - Math.pow(0.015, delta)

    // Compute desired camera position from spherical coords
    const sinEl = Math.sin(this.elevation)
    const cosEl = Math.cos(this.elevation)
    const x = this.radius * cosEl * Math.sin(this.azimuth)
    const y = this.radius * sinEl
    const z = this.radius * cosEl * Math.cos(this.azimuth)

    const desiredPos = new THREE.Vector3(
      this.target.x + x,
      this.target.y + this.lookAtOffset.y + y,
      this.target.z + z,
    )
    const desiredLookAt = this.target.clone().add(this.lookAtOffset)

    this.smoothPosition.lerp(desiredPos, lerpFactor)
    this.smoothLookAt.lerp(desiredLookAt, lerpFactor)

    this.instance.position.copy(this.smoothPosition)
    this.instance.lookAt(this.smoothLookAt)
  }
}
