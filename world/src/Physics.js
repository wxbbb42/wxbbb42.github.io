import * as THREE from 'three'

export default class Physics {
  constructor(experience, RAPIER) {
    this.experience = experience
    this.RAPIER = RAPIER
    this.colliders = []

    // Create physics world
    const gravity = { x: 0.0, y: -9.81, z: 0.0 }
    this.world = new RAPIER.World(gravity)

    // Create ground
    const groundDesc = RAPIER.RigidBodyDesc.fixed()
    const groundBody = this.world.createRigidBody(groundDesc)
    const groundCollider = RAPIER.ColliderDesc.cuboid(30, 0.1, 30)
      .setTranslation(0, -0.1, 0)
    this.world.createCollider(groundCollider, groundBody)

    // Character controller
    this.characterController = this.world.createCharacterController(0.01)
    this.characterController.setApplyImpulsesToDynamicBodies(true)
    this.characterController.enableAutostep(0.3, 0.2, true)
    this.characterController.enableSnapToGround(0.3)

    // Character collider (capsule)
    const charBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(0, 0.5, 5)
    this.characterBody = this.world.createRigidBody(charBodyDesc)
    const charColliderDesc = RAPIER.ColliderDesc.capsule(0.35, 0.3)
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

  moveCharacter(velocity, delta) {
    const movement = { x: velocity.x * delta, y: -9.81 * delta, z: velocity.z * delta }
    this.characterController.computeColliderMovement(this.characterCollider, movement)
    const corrected = this.characterController.computedMovement()
    const pos = this.characterBody.translation()
    this.characterBody.setNextKinematicTranslation({
      x: pos.x + corrected.x,
      y: pos.y + corrected.y,
      z: pos.z + corrected.z,
    })
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
