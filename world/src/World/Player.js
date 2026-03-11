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
    this.velocity = new THREE.Vector3()
    this.verticalVelocity = 0       // m/s, positive = up
    this._isGrounded = true
    this.targetRotation = 0
    this.speed = 6

    // Mars gravity: 3.72 m/s² (38% of Earth's 9.81)
    this.GRAVITY = -3.72
    // Jump initial velocity — tuned for Mars feel (floaty, high arc)
    this.JUMP_VELOCITY = 6.0

    // Landing squash & stretch
    this._wasGrounded = true
    this._landingScale = 1.0          // current Y scale
    this._squashT      = 0            // animation progress 0→1
    this._squashing    = false
    this._peakVelocity = 0            // track max downward velocity for squash intensity

    // Animation
    this.mixer = null
    this.actions = {}
    this.currentAction = null

    // Raycaster for ground detection
    this._raycaster = new THREE.Raycaster()
    this._rayOrigin = new THREE.Vector3()
    this._rayDir = new THREE.Vector3(0, -1, 0)
    this._groundY = 0

    this._createCharacter()
    this.group.position.copy(this.position)
  }

  _createCharacter() {
    // The physics capsule center is above ground by (halfHeight + radius).
    // We offset the visual model down so its feet align with the ground.
    // Capsule params: halfHeight=0.3, radius=0.25 → center at 0.55 above ground
    this._capsuleOffset = 0.55

    // Try astronaut model first (Kenney — no animations, static)
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

      // Wrapper container: flip model 180° inside, then center
      // This way the group rotation (for movement direction) doesn't shift position
      const wrapper = new THREE.Group()
      wrapper.add(rawModel)
      rawModel.rotation.y = Math.PI // face forward

      // Now compute bounding box of the flipped model
      const box = new THREE.Box3().setFromObject(wrapper)
      const center = box.getCenter(new THREE.Vector3())
      // Offset wrapper so center-bottom is at origin
      wrapper.position.set(-center.x, -box.min.y, -center.z)

      this.model = wrapper
      this.group.add(wrapper)
      return
    }

    // Fallback to animated Quaternius player
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
    if (oldAction) {
      oldAction.fadeOut(0.2)
    }

    newAction.reset().fadeIn(0.2).play()
    this.currentAction = name
  }

  update(delta) {
    const input = this.experience.input
    const camera = this.experience.camera

    // Update animation mixer
    if (this.mixer) this.mixer.update(delta)

    if (input.locked) {
      this._playAction('Idle')
      return
    }

    // Get camera-relative forward/right directions
    const cameraDir = new THREE.Vector3()
    camera.instance.getWorldDirection(cameraDir)
    cameraDir.y = 0
    cameraDir.normalize()

    const cameraRight = new THREE.Vector3()
    cameraRight.crossVectors(cameraDir, new THREE.Vector3(0, 1, 0)).normalize()

    // Compute movement direction from input
    this.velocity.set(0, 0, 0)
    if (input.keys.forward) this.velocity.add(cameraDir)
    if (input.keys.backward) this.velocity.sub(cameraDir)
    if (input.keys.left) this.velocity.sub(cameraRight)
    if (input.keys.right) this.velocity.add(cameraRight)

    if (this.velocity.lengthSq() > 0) {
      this.velocity.normalize().multiplyScalar(this.speed)

      // Rotate character to face movement direction
      this.targetRotation = Math.atan2(this.velocity.x, this.velocity.z)

      this._playAction('Walk')
    } else {
      this._playAction('Idle')
    }

    // Smoothly rotate toward target
    let diff = this.targetRotation - this.group.rotation.y
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    this.group.rotation.y += diff * 0.15

    // Jump input — only when grounded
    if (input.consumeJump() && this._isGrounded) {
      this.verticalVelocity = this.JUMP_VELOCITY
      this._isGrounded = false
    }

    // Apply Mars gravity
    this.verticalVelocity += this.GRAVITY * delta

    // Track peak downward velocity for squash intensity
    if (!this._isGrounded && this.verticalVelocity < this._peakVelocity) {
      this._peakVelocity = this.verticalVelocity
    }

    // Move via physics (now passes vertical velocity separately)
    const grounded = this.experience.physics.moveCharacter(this.velocity, this.verticalVelocity, delta)
    if (grounded && this.verticalVelocity < 0) {
      // Just landed
      if (!this._wasGrounded) {
        const impact = Math.min(Math.abs(this._peakVelocity) / this.JUMP_VELOCITY, 1)
        this._squashT    = 0
        this._squashing  = true
        this._landingScale = 1 - impact * 0.35  // max squash 35%
        this._peakVelocity = 0
      }
      this.verticalVelocity = 0
      this._isGrounded = true
    }
    this._wasGrounded = grounded
    const newPos = this.experience.physics.getCharacterPosition()
    this.position.copy(newPos)

    // Raycast down to find the actual ground surface height
    this._rayOrigin.set(newPos.x, newPos.y + 2, newPos.z) // cast from above
    this._raycaster.set(this._rayOrigin, this._rayDir)
    this._raycaster.far = 10

    // Only check ground mesh (first child of ground group)
    const groundGroup = this.experience.world?.ground?.group
    if (groundGroup) {
      const hits = this._raycaster.intersectObjects(groundGroup.children, true)
      if (hits.length > 0) {
        this._groundY = hits[0].point.y
      }
    }

    // When airborne, use physics Y; when grounded, snap to raycast ground surface
    const physicsY = newPos.y - 0.55 // subtract capsule half-height to get feet position
    const visualY = this._isGrounded ? this._groundY : Math.max(physicsY, this._groundY)
    this.group.position.set(newPos.x, visualY, newPos.z)

    // Squash & stretch landing animation
    if (this._squashing) {
      this._squashT += delta * 8  // animation speed
      if (this._squashT >= 1) {
        this._squashT = 1
        this._squashing = false
      }
      // Ease out: squash → normal → slight stretch → normal
      const t = this._squashT
      const eased = t < 0.5
        ? 4 * t * t * t               // ease in cubic (squash phase)
        : 1 - Math.pow(-2 * t + 2, 3) / 2  // ease out cubic (recover)
      const scaleY = this._landingScale + (1 - this._landingScale) * eased
      const scaleXZ = 1 + (1 - scaleY) * 0.5  // opposite axis bulge
      this.group.scale.set(scaleXZ, scaleY, scaleXZ)
    } else if (!this._squashing && this._isGrounded) {
      this.group.scale.set(1, 1, 1)
    }

    // Update camera target (use visual position for smooth camera)
    camera.setTarget(this.group.position)
  }

  teleportTo(x, y, z) {
    this.position.set(x, y, z)
    this.group.position.copy(this.position)
    this.experience.physics.setCharacterPosition(x, y, z)
    this.experience.camera.setTarget(this.position)
    // Snap camera immediately
    this.experience.camera.smoothPosition.copy(this.position).add(this.experience.camera.offset)
  }
}
