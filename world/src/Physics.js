import * as THREE from 'three'
import { sampleGroundHeight, GROUND_SIZE, GROUND_SEGMENTS } from './World/Ground.js'

export default class Physics {
  constructor(experience, RAPIER) {
    this.experience = experience
    this.RAPIER = RAPIER
    this.colliders = []

    // Create physics world
    const gravity = { x: 0.0, y: -9.81, z: 0.0 }
    this.world = new RAPIER.World(gravity)

    // HeightField ground — built from same vertex data as visual terrain mesh
    // Strategy: read heights directly from Ground mesh geometry (zero-divergence)
    // Rapier heightfield uses COLUMN-MAJOR order: heights[col * (nRows+1) + row]
    // nrows = segments along Z, ncols = segments along X
    const HF_RES  = GROUND_SEGMENTS  // 128
    const HF_SIZE = GROUND_SIZE       // 40
    const nRows   = HF_RES           // along Z axis
    const nCols   = HF_RES           // along X axis
    const half    = HF_SIZE / 2

    // Column-major: iterate col (X) outer, row (Z) inner
    const heights = new Float32Array((nRows + 1) * (nCols + 1))
    for (let col = 0; col <= nCols; col++) {
      for (let row = 0; row <= nRows; row++) {
        const x = -half + (col / nCols) * HF_SIZE
        const z = -half + (row / nRows) * HF_SIZE
        heights[col * (nRows + 1) + row] = sampleGroundHeight(x, z)
      }
    }

    const hfBodyDesc = RAPIER.RigidBodyDesc.fixed()
    const hfBody     = this.world.createRigidBody(hfBodyDesc)
    const hfDesc     = RAPIER.ColliderDesc.heightfield(
      nRows, nCols, heights,
      { x: HF_SIZE, y: 1.0, z: HF_SIZE }
    )
    // HeightField is centered at origin by default — matches visual mesh
    this.world.createCollider(hfDesc, hfBody)

    // Character controller
    this.characterController = this.world.createCharacterController(0.01)
    this.characterController.setApplyImpulsesToDynamicBodies(true)
    this.characterController.enableAutostep(0.4, 0.3, true)
    this.characterController.enableSnapToGround(0.5)

    // Character collider (capsule)
    // Capsule center starts at: groundY(0,5) + capsuleOffset(0.55)
    const startGroundY = sampleGroundHeight(0, 5)
    const charBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(0, startGroundY + 0.55, 5)
    this.characterBody = this.world.createRigidBody(charBodyDesc)
    const charColliderDesc = RAPIER.ColliderDesc.capsule(0.3, 0.25)
    this.characterCollider = this.world.createCollider(charColliderDesc, this.characterBody)
  }

  addBoxCollider(x, y, z, hx, hy, hz) {
    const bodyDesc = this.RAPIER.RigidBodyDesc.fixed()
    const body = this.world.createRigidBody(bodyDesc)
    const colliderDesc = this.RAPIER.ColliderDesc.cuboid(hx, hy, hz)
      .setTranslation(x, y, z)
    const collider = this.world.createCollider(colliderDesc, body)
    this.colliders.push(collider)
    return collider
  }

  moveCharacter(velocity, verticalVelocity, delta) {
    const movement = {
      x: velocity.x * delta,
      y: verticalVelocity * delta,
      z: velocity.z * delta,
    }
    this.characterController.computeColliderMovement(this.characterCollider, movement)
    const corrected = this.characterController.computedMovement()
    const pos = this.characterBody.translation()
    this.characterBody.setNextKinematicTranslation({
      x: pos.x + corrected.x,
      y: pos.y + corrected.y,
      z: pos.z + corrected.z,
    })
    // Use Rapier's built-in grounded detection
    return this.characterController.computedGrounded()
  }

  getCharacterPosition() {
    const pos = this.characterBody.translation()
    return new THREE.Vector3(pos.x, pos.y, pos.z)
  }

  setCharacterPosition(x, y, z) {
    this.characterBody.setTranslation({ x, y, z }, true)
  }

  update(delta) {
    this.world.step()
  }
}
