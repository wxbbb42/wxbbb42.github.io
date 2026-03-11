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

    // Smooth follow — XZ and Y have independent lerp speeds
    this.target        = new THREE.Vector3(0, 0, 0)
    this.lookAtOffset  = new THREE.Vector3(0, 1.2, 0)
    this.smoothPosXZ   = new THREE.Vector2(0, 0)   // X and Z smooth
    this.smoothPosY    = 0                           // Y smooth (slower, lag on jump)
    this.smoothLookAt  = new THREE.Vector3()

    // Mouse state (right button drag)
    this.sensitivity = 0.005
    this._rmb        = false
    this._lastX      = 0
    this._lastY      = 0

    this._setupMouseControls()

    // Camera collision — cache collidable meshes (rebuilt on demand)
    this._camRaycaster     = new THREE.Raycaster()
    this._camRayDir        = new THREE.Vector3()
    this._collidableMeshes = []
    this._collisionDirty   = true  // rebuild mesh list next frame

    // Set initial position
    this.smoothPosXZ.set(this.target.x, this.target.z)
    this.smoothPosY = this.target.y + this.lookAtOffset.y
    this._updateInstance(this.radius)

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
        console.log(this.orbitMode ? '📷 Orbit ON' : '📷 Orbit OFF')
      }
    })

    window.addEventListener('resize', () => this.resize())
  }

  _setupMouseControls() {
    const canvas = this.experience.canvas

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        this._rmb  = true
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

    canvas.addEventListener('wheel', (e) => {
      if (this.orbitMode) return
      e.preventDefault()
      this.targetRadius = Math.max(
        this.minRadius,
        Math.min(this.maxRadius, this.targetRadius + e.deltaY * 0.01)
      )
    }, { passive: false })

    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  // Build list of meshes that block camera (buildings + ground only, not particles/lights)
  _rebuildCollidables() {
    this._collidableMeshes = []
    const world = this.experience.world
    if (!world) return

    const collectMeshes = (obj) => {
      if (!obj) return
      obj.traverse((child) => {
        if (child.isMesh) this._collidableMeshes.push(child)
      })
    }

    // Only check buildings and ground — NOT particles, trees, props
    if (world.buildings?.group)  collectMeshes(world.buildings.group)
    if (world.ground?.group)     collectMeshes(world.ground.group)
    // Editor-placed models
    this.experience.scene.children.forEach((obj) => {
      if (obj.userData?._editorModel) collectMeshes(obj)
    })

    this._collisionDirty = false
  }

  _computeCameraCollisionRadius(lookAt) {
    if (this._collisionDirty || this._collidableMeshes.length === 0) {
      this._rebuildCollidables()
    }

    const sinEl = Math.sin(this.elevation)
    const cosEl = Math.cos(this.elevation)
    this._camRayDir.set(
      cosEl * Math.sin(this.azimuth),
      sinEl,
      cosEl * Math.cos(this.azimuth),
    ).normalize()

    this._camRaycaster.set(lookAt, this._camRayDir)
    this._camRaycaster.far = this.radius + 0.5

    const hits = this._camRaycaster.intersectObjects(this._collidableMeshes, false)
    if (hits.length > 0) {
      return Math.max(1.5, hits[0].distance - 0.3)
    }
    return this.radius
  }

  _updateInstance(effectiveRadius) {
    const sinEl  = Math.sin(this.elevation)
    const cosEl  = Math.cos(this.elevation)
    const lookAt = new THREE.Vector3(
      this.smoothPosXZ.x,
      this.smoothPosY,
      this.smoothPosXZ.y,
    )
    this.instance.position.set(
      lookAt.x + effectiveRadius * cosEl * Math.sin(this.azimuth),
      lookAt.y + effectiveRadius * sinEl,
      lookAt.z + effectiveRadius * cosEl * Math.cos(this.azimuth),
    )
    this.smoothLookAt.copy(lookAt)
    this.instance.lookAt(lookAt)
  }

  resize() {
    this.instance.aspect = window.innerWidth / window.innerHeight
    this.instance.updateProjectionMatrix()
  }

  setTarget(position) {
    this.target.copy(position)
  }

  // Mark collidable mesh list dirty (call when Editor places/removes models)
  invalidateCollisionCache() {
    this._collisionDirty = true
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

    // Independent XZ vs Y lerp — Y is slower (lag during jump)
    const lerpXZ = 1 - Math.pow(0.015, delta)   // fast XZ follow
    const lerpY  = 1 - Math.pow(0.08,  delta)   // slow Y follow (jump lag)

    const targetLookAtY = this.target.y + this.lookAtOffset.y
    this.smoothPosXZ.x += (this.target.x - this.smoothPosXZ.x) * lerpXZ
    this.smoothPosXZ.y += (this.target.z - this.smoothPosXZ.y) * lerpXZ
    this.smoothPosY    += (targetLookAtY  - this.smoothPosY)    * lerpY

    // Camera collision (optimized: only collidable meshes)
    const lookAt = new THREE.Vector3(this.smoothPosXZ.x, this.smoothPosY, this.smoothPosXZ.y)
    const safeRadius      = this._computeCameraCollisionRadius(lookAt)
    const effectiveRadius = Math.min(this.radius, safeRadius)

    // Final camera position
    const sinEl = Math.sin(this.elevation)
    const cosEl = Math.cos(this.elevation)
    this.instance.position.set(
      lookAt.x + effectiveRadius * cosEl * Math.sin(this.azimuth),
      lookAt.y + effectiveRadius * sinEl,
      lookAt.z + effectiveRadius * cosEl * Math.cos(this.azimuth),
    )
    this.smoothLookAt.copy(lookAt)
    this.instance.lookAt(lookAt)
  }
}
