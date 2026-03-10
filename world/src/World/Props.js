import * as THREE from 'three'

export default class Props {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this._createEquipment()
    this._createSatelliteDish()
    this._createRover()
    this._createTurret()
    this._createBarrels()
  }

  _createEquipment() {
    const r = this.experience.resources

    if (r.items.machineGenerator) {
      this._place(r.items.machineGenerator, -8, 0, 8, 2.0)
    }
    if (r.items.machineWireless) {
      this._place(r.items.machineWireless, -5, 0, 9, 2.0)
    }

    // Rails via InstancedMesh — one draw call for 4 rail segments
    if (r.items.rail) {
      let railMesh = null
      r.items.rail.scene.traverse(c => { if (c.isMesh && !railMesh) railMesh = c })
      if (railMesh) {
        const railPositions = [-11, -9, -7, -5].map(x => ({ x, y: 0, z: 6, s: 1.8 }))
        const instanced = new THREE.InstancedMesh(railMesh.geometry, railMesh.material, railPositions.length)
        instanced.castShadow = true
        instanced.receiveShadow = true
        const dummy = new THREE.Object3D()
        railPositions.forEach(({ x, y, z, s }, i) => {
          dummy.position.set(x, y, z)
          dummy.scale.setScalar(s)
          dummy.updateMatrix()
          instanced.setMatrixAt(i, dummy.matrix)
        })
        instanced.instanceMatrix.needsUpdate = true
        this.group.add(instanced)
      }
      this.experience.physics.addBoxCollider(-9, 0.4, 6, 5, 0.4, 0.2)
    }
  }

  _createBarrels() {
    const r = this.experience.resources
    const positions = [
      { x: -9, z: 7, s: 1.8 },
      { x: -6, z: 10, s: 1.8 },
      { x: -10, z: 10, s: 1.5 },
    ]
    for (const p of positions) {
      const gltf = Math.random() > 0.5 ? r.items.barrels : r.items.barrel
      if (!gltf) continue
      this._place(gltf, p.x, 0, p.z, p.s)
    }
  }

  _createSatelliteDish() {
    const r = this.experience.resources
    if (!r.items.satelliteDishLarge) return

    this._place(r.items.satelliteDishLarge, -2, 0, 5, 2.5)

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 256, 128)
    ctx.fillStyle = '#44ffaa'
    ctx.font = '20px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('CLAWD BASE', 128, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(-2, 3, 5)
    sprite.scale.set(2, 1, 1)
    this.group.add(sprite)
  }

  _createRover() {
    const r = this.experience.resources
    if (!r.items.rover) return
    const rover = this._place(r.items.rover, 5, 0, 10, 2.5)
    rover.rotation.y = Math.PI * 0.17
    this.experience.physics.addBoxCollider(5, 0.5, 10, 1.5, 0.5, 1)
  }

  _createTurret() {
    const r = this.experience.resources
    if (!r.items.turretSingle) return
    this._place(r.items.turretSingle, 12, 0, -2, 1.8)
    this.experience.physics.addBoxCollider(12, 1, -2, 0.5, 1, 0.5)
  }

  _place(gltf, x, y, z, scale) {
    const model = gltf.scene.clone()
    model.position.set(x, y, z)
    model.scale.setScalar(scale)
    model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
    this.group.add(model)
    return model
  }
}
