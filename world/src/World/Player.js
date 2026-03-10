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
    this.targetRotation = 0
    this.speed = 6

    // Animation
    this.mixer = null
    this.actions = {}
    this.currentAction = null

    this._createCharacter()
    this.group.position.copy(this.position)
  }

  _createCharacter() {
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

      // Set up animation mixer
      this.mixer = new THREE.AnimationMixer(this.model)

      // Find and store key animations
      for (const clip of gltf.animations) {
        const action = this.mixer.clipAction(clip)
        this.actions[clip.name] = action
      }

      // Start with idle
      this._playAction('Idle')
    } else {
      // Fallback: procedural box character
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

    // Move via physics
    this.experience.physics.moveCharacter(this.velocity, delta)
    const newPos = this.experience.physics.getCharacterPosition()
    this.position.copy(newPos)
    this.group.position.copy(this.position)

    // Update camera target
    camera.setTarget(this.position)
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
