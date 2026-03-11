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
    this.azimuth      = Math.PI   // horizontal angle (start behind player)
    this.elevation    = 0.45      // vertical angle (~25° above horizon)
    this.radius       = 9         // current distance
    this.targetRadius = 9         // smooth zoom target
    this.minRadius    = 3
    this.maxRadius    = 20
    this.minElevation = 0.05
    this.maxElevation = Math.PI / 2 - 0.05

    // Smooth follow
    this.target       = new THREE.Vector3(0, 0, 0)
    this.lookAtOffset = new THREE.Vector3(0, 1.2, 0)
    this.smoothPosition = new THREE.Vector3()
    this.smoothLookAt   = new THREE.Vector3()

    // Mouse state
    this.sensitivity   = 0.005
    this._rmb          = false   // right mouse button held
    this._lastX        = 0
    this._lastY        = 0

    this._setupMouseControls()

    // Camera collision raycast
    this._camRaycaster = new THREE.Raycaster()
    this._camRayDir    = new THREE.Vector3()

    // Set initial position
    const initPos = this._computeDesiredPosition()
    this.smoothPosition.copy(initPos)
    this.smoothLookAt.copy(this.target).add(this.lookAtOffset)
    this.instance.position.copy(this.smoothPosition)
    this.instance.lookAt(this.smoothLookAt)

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
    })

    window.addEventListener('resize', () => this.resize())
  }

  _setupMouseControls() {
    const canvas = this.experience.canvas

    // Right mouse button drag to rotate
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this._rmb = true
        this._lastX = e.clientX
        this._lastY = e.clientY
        canvas.style.cursor = 'grabbing'
      }
    })

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this._rmb = false
        canvas.style.cursor = 'default'
      }
    })

    window.addEventListener('mousemove', (e) => {
      if (!this._rmb || this.orbitMode) return
      const dx = e.clientX - this._lastX
      const dy = e.clientY - this._lastY
      this._lastX = e.clientX
      this._lastY = e.clientY

      this.azimuth   -= dx * this.sensitivity
      this.elevation  = Math.max(
        this.minElevation,
        Math.min(this.maxElevation, this.elevation - dy * this.sensitivity)
      )
    })

    // Scroll to zoom
    canvas.addEventListener('wheel', (e) => {
      if (this.orbitMode) return
      e.preventDefault()
      this.targetRadius = Math.max(
        this.minRadius,
        Math.min(this.maxRadius, this.targetRadius + e.deltaY * 0.01)
      )
    }, { passive: false })

    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  _computeDesiredPosition() {
    const sinEl = Math.sin(this.elevation)
    const cosEl = Math.cos(this.elevation)
    const lookAt = this.target.clone().add(this.lookAtOffset)
    return new THREE.Vector3(
      lookAt.x + this.radius * cosEl * Math.sin(this.azimuth),
      lookAt.y + this.radius * sinEl,
      lookAt.z + this.radius * cosEl * Math.cos(this.azimuth),
    )
  }

  _computeCameraCollisionRadius() {
    // Raycast from lookAt point toward desired camera position
    // Returns the safe radius (shortened if something is in the way)
    const lookAt = this.target.clone().add(this.lookAtOffset)
    const sinEl  = Math.sin(this.elevation)
    const cosEl  = Math.cos(this.elevation)
    this._camRayDir.set(
      cosEl * Math.sin(this.azimuth),
      sinEl,
      cosEl * Math.cos(this.azimuth),
    ).normalize()

    this._camRaycaster.set(lookAt, this._camRayDir)
    this._camRaycaster.far = this.radius + 0.5

    // Check against all scene objects (exclude player)
    const player = this.experience.world?.player?.group
    const objects = []
    this.experience.scene.traverse((obj) => {
      if (obj.isMesh && obj !== player && !player?.getObjectById(obj.id)) {
        objects.push(obj)
      }
    })

    const hits = this._camRaycaster.intersectObjects(objects, false)
    if (hits.length > 0) {
      return Math.max(1.5, hits[0].distance - 0.3)
    }
    return this.radius
  }

  resize() {
    this.instance.aspect = window.innerWidth / window.innerHeight
    this.instance.updateProjectionMatrix()
  }

  setTarget(position) {
    this.target.copy(position)
  }

  getAzimuth() {
    return this.azimuth
  }

  update(delta) {
    if (this.orbitMode) {
      this.orbitControls.update()
      return
    }

    // Smooth zoom
    this.radius += (this.targetRadius - this.radius) * (1 - Math.pow(0.01, delta))

    // Camera collision: shorten radius if something is in the way
    const safeRadius = this._computeCameraCollisionRadius()
    const effectiveRadius = Math.min(this.radius, safeRadius)

    const lerpFactor = 1 - Math.pow(0.015, delta)
    const lookAt = this.target.clone().add(this.lookAtOffset)

    const sinEl = Math.sin(this.elevation)
    const cosEl = Math.cos(this.elevation)
    const desiredPos = new THREE.Vector3(
      lookAt.x + effectiveRadius * cosEl * Math.sin(this.azimuth),
      lookAt.y + effectiveRadius * sinEl,
      lookAt.z + effectiveRadius * cosEl * Math.cos(this.azimuth),
    )

    this.smoothPosition.lerp(desiredPos, lerpFactor)
    this.smoothLookAt.lerp(lookAt, lerpFactor)

    this.instance.position.copy(this.smoothPosition)
    this.instance.lookAt(this.smoothLookAt)
  }
}
