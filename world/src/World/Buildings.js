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
      // Entrance indicator: amber point light + ground ring
      this._addEntrance(10, 0, 2)
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

  _addEntrance(x, y, z) {
    // Amber point light above door
    const light = new THREE.PointLight(0xC17A3A, 2.5, 6)
    light.position.set(x, y + 3, z)
    this.group.add(light)

    // Pulsing "ENTER" sprite above the door
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#C17A3A'
    ctx.font = 'bold 28px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('[ ENTER ]', 128, 32)
    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true })
    this._entranceSprite = new THREE.Sprite(mat)
    this._entranceSprite.position.set(x, y + 2, z)
    this._entranceSprite.scale.set(3, 0.75, 1)
    this.group.add(this._entranceSprite)

    // Ground ring: torus lying flat
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.06, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0xC17A3A, emissive: 0xC17A3A, emissiveIntensity: 0.8 })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, y + 0.05, z)
    this.group.add(ring)
    this._entranceRing = ring
    this._entranceLight = light
    this._entranceT = 0
  }

  update(delta) {
    // Pulse entrance light and sprite
    if (!this._entranceLight) return
    this._entranceT = (this._entranceT || 0) + delta
    const pulse = 0.7 + 0.3 * Math.sin(this._entranceT * 2.5)
    this._entranceLight.intensity = 2.5 * pulse
    if (this._entranceSprite) this._entranceSprite.material.opacity = 0.6 + 0.4 * pulse
    if (this._entranceRing) this._entranceRing.material.emissiveIntensity = 0.5 + 0.5 * pulse
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
