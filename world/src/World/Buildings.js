import * as THREE from 'three'

export default class Buildings {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this.labDoorPosition = new THREE.Vector3(10, 0, 2)
    this.buildings = []

    this._createBuildings()
    this._createRocket()
  }

  _createBuildings() {
    const r = this.experience.resources

    // Main Hangar (CLAWD LABS)
    if (r.items.hangarLargeA) {
      const lab = this._placeModel(r.items.hangarLargeA, 10, 0, -2, 3.5)
      this._addLabel('CLAWD LABS', 10, 6, -2)
      this.buildings.push({ name: 'lab', mesh: lab })
      this.experience.physics.addBoxCollider(10, 3, -2, 4, 3, 4)
    }

    // Comms Station
    if (r.items.structureDetailed) {
      const comms = this._placeModel(r.items.structureDetailed, -10, 0, -4, 2.5)
      this._addLabel('COMMS', -10, 4, -4)
      this.buildings.push({ name: 'comms', mesh: comms })
      this.experience.physics.addBoxCollider(-10, 2, -4, 2.5, 2, 2.5)
    }

    // Storage Hangar
    if (r.items.hangarSmallA) {
      const storage = this._placeModel(r.items.hangarSmallA, -6, 0, -12, 2.5)
      this.buildings.push({ name: 'storage', mesh: storage })
      this.experience.physics.addBoxCollider(-6, 2, -12, 2, 2, 2)
    }

    // Greenhouse Dome
    if (r.items.hangarRoundGlass) {
      const dome = this._placeModel(r.items.hangarRoundGlass, 8, 0, -10, 2.5)
      this.buildings.push({ name: 'dome', mesh: dome })
      this.experience.physics.addBoxCollider(8, 2, -10, 2, 2, 2)
    }
  }

  _createRocket() {
    const r = this.experience.resources
    const rocketGroup = new THREE.Group()
    rocketGroup.position.set(-10, 0, -10)
    rocketGroup.scale.setScalar(2.5)

    const parts = ['rocketBaseA', 'rocketFuelA', 'rocketSidesA', 'rocketFinsA', 'rocketTopA']
    const offsets = [0, 1.0, 2.0, 3.0, 4.0]

    for (let i = 0; i < parts.length; i++) {
      const gltf = r.items[parts[i]]
      if (!gltf) continue
      const model = gltf.scene.clone()
      model.position.y = offsets[i]
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
      rocketGroup.add(model)
    }

    this.group.add(rocketGroup)
    this._addLabel('LAUNCH PAD', -10, 12, -10)
    this.experience.physics.addBoxCollider(-10, 4, -10, 1.5, 4, 1.5)
  }

  _placeModel(gltf, x, y, z, scale) {
    const model = gltf.scene.clone()
    model.position.set(x, y, z)
    model.scale.setScalar(scale)
    model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
    this.group.add(model)
    return model
  }

  _addLabel(text, x, y, z) {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = '#44ffaa'
    ctx.font = 'bold 42px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 256, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(x, y, z)
    sprite.scale.set(4, 1, 1)
    this.group.add(sprite)
  }
}
