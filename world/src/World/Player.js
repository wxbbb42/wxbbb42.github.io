import * as THREE from 'three'
import { TOWN, SKIN_COLOR } from '../utils/constants.js'
import { fixCharacterSkin } from '../utils/math.js'

export default class Player {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this.position = new THREE.Vector3(
      TOWN.playerStart.x,
      TOWN.playerStart.y,
      TOWN.playerStart.z
    )

    // Horizontal movement — smoothed (friction feel)
    this.inputVelocity  = new THREE.Vector3()  // raw input direction × speed
    this.smoothVelocity = new THREE.Vector3()  // lerped velocity (for slide decel)
    this.targetRotation = 0
    this.speed = 6

    // Vertical / jump
    this.verticalVelocity = 0       // m/s, positive = up
    this._isGrounded      = true
    this._wasGrounded     = true

    // Mars gravity constants
    this.GRAVITY_UP   = -3.72       // while rising (38% of Earth)
    this.GRAVITY_DOWN = -3.72 * 1.8 // while falling (heavier = snappier landing)
    this.JUMP_VELOCITY = 6.0

    // Landing squash & stretch
    this._landingScale = 1.0
    this._squashT      = 0
    this._squashing    = false
    this._peakVelocity = 0

    // Animation
    this.mixer = null
    this.actions = {}
    this.currentAction = null

    // Capsule half-height+radius offset (capsule center above feet)
    this._capsuleOffset = 0.55

    this._createCharacter()
    this.group.position.copy(this.position)
  }

  _createCharacter() {
    const astronautGltf = this.experience.resources.items.astronautPlayer
    if (astronautGltf) {
      const rawModel = astronautGltf.scene.clone()
      rawModel.scale.setScalar(1.4)
      rawModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      const wrapper = new THREE.Group()
      wrapper.add(rawModel)
      rawModel.rotation.y = Math.PI

      const box = new THREE.Box3().setFromObject(wrapper)
      const center = box.getCenter(new THREE.Vector3())
      wrapper.position.set(-center.x, -box.min.y, -center.z)

      this.model = wrapper
      this.group.add(wrapper)
      return
    }

    const gltf = this.experience.resources.items.player
    if (gltf) {
      this.model = gltf.scene
      this.model.scale.setScalar(0.5)
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      fixCharacterSkin(this.model, SKIN_COLOR)
      this.group.add(this.model)

      this.mixer = new THREE.AnimationMixer(this.model)
      for (const clip of gltf.animations) {
        const action = this.mixer.clipAction(clip)
        this.actions[clip.name] = action
      }
      this._playAction('Idle')
    } else {
      this._createFallback()
    }
  }

  _createFallback() {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, flatShading: true })
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, flatShading: true })
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), bodyMat)
    body.position.y = 0.5
    body.castShadow = true
    this.group.add(body)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), headMat)
    head.position.y = 1.0
    head.castShadow = true
    this.group.add(head)
  }

  _playAction(name) {
    if (this.currentAction === name) return
    const newAction = this.actions[name]
    if (!newAction) return
    const oldAction = this.actions[this.currentAction]
    if (oldAction) oldAction.fadeOut(0.2)
    newAction.reset().fadeIn(0.2).play()
    this.currentAction = name
  }

  update(delta) {
    const input  = this.experience.input
    const camera = this.experience.camera

    if (this.mixer) this.mixer.update(delta)

    if (input.locked) {
      this._playAction('Idle')
      return
    }

    // Camera-relative directions (horizontal only)
    const cameraDir = new THREE.Vector3()
    camera.instance.getWorldDirection(cameraDir)
    cameraDir.y = 0
    cameraDir.normalize()

    const cameraRight = new THREE.Vector3()
    cameraRight.crossVectors(cameraDir, new THREE.Vector3(0, 1, 0)).normalize()

    // Raw input velocity
    this.inputVelocity.set(0, 0, 0)
    if (input.keys.forward)  this.inputVelocity.add(cameraDir)
    if (input.keys.backward) this.inputVelocity.sub(cameraDir)
    if (input.keys.left)     this.inputVelocity.sub(cameraRight)
    if (input.keys.right)    this.inputVelocity.add(cameraRight)

    const hasInput = this.inputVelocity.lengthSq() > 0
    if (hasInput) {
      this.inputVelocity.normalize().multiplyScalar(this.speed)
      this.targetRotation = Math.atan2(this.inputVelocity.x, this.inputVelocity.z)
      this._playAction('Walk')
    } else {
      this._playAction('Idle')
    }

    // Friction / deceleration: smooth velocity toward input
    // accel fast (0.12 factor → ~8 frames), decel slower (0.08 → ~12 frames)
    const lerpFactor = hasInput ? 0.18 : 0.10
    this.smoothVelocity.lerp(this.inputVelocity, lerpFactor)

    // Rotation — smooth turn
    let diff = this.targetRotation - this.group.rotation.y
    while (diff > Math.PI)  diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    this.group.rotation.y += diff * 0.15

    // Jump (only when grounded)
    if (input.consumeJump() && this._isGrounded) {
      this.verticalVelocity = this.JUMP_VELOCITY
      this._isGrounded = false
    }

    // Asymmetric gravity: lighter going up, heavier falling down
    const gravity = this.verticalVelocity > 0 ? this.GRAVITY_UP : this.GRAVITY_DOWN
    this.verticalVelocity += gravity * delta

    // Track peak downward speed for squash intensity
    if (!this._isGrounded && this.verticalVelocity < this._peakVelocity) {
      this._peakVelocity = this.verticalVelocity
    }

    // Physics move — uses smoothed horizontal + vertical
    const grounded = this.experience.physics.moveCharacter(
      this.smoothVelocity, this.verticalVelocity, delta
    )

    if (grounded && this.verticalVelocity <= 0) {
      if (!this._wasGrounded) {
        // Landing: trigger squash
        const impact = Math.min(Math.abs(this._peakVelocity) / this.JUMP_VELOCITY, 1)
        this._squashT      = 0
        this._squashing    = true
        this._landingScale = 1 - impact * 0.35
        this._peakVelocity = 0
      }
      this.verticalVelocity = 0
      this._isGrounded = true
    } else if (!grounded) {
      this._isGrounded = false
    }
    this._wasGrounded = grounded

    // Position: fully trust Rapier physics Y (fix float/clip bug)
    const newPos = this.experience.physics.getCharacterPosition()
    this.position.copy(newPos)

    // Feet Y = capsule center Y - capsuleOffset
    const feetY = newPos.y - this._capsuleOffset
    this.group.position.set(newPos.x, feetY, newPos.z)

    // Squash & stretch
    if (this._squashing) {
      this._squashT += delta * 8
      if (this._squashT >= 1) {
        this._squashT   = 1
        this._squashing = false
      }
      const t     = this._squashT
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2
      const scaleY  = this._landingScale + (1 - this._landingScale) * eased
      const scaleXZ = 1 + (1 - scaleY) * 0.5
      this.group.scale.set(scaleXZ, scaleY, scaleXZ)
    } else if (this._isGrounded) {
      this.group.scale.set(1, 1, 1)
    }

    // Camera target: use visual group position
    camera.setTarget(this.group.position)
  }

  teleportTo(x, y, z) {
    this.position.set(x, y, z)
    this.group.position.copy(this.position)
    this.experience.physics.setCharacterPosition(x, y, z)
    this.experience.camera.setTarget(this.position)
  }
}
