import * as THREE from 'three'
import { COLORS } from '../utils/constants.js'

export default class Buildings {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this.labDoorPosition = new THREE.Vector3(10, 0, 2)
    this.buildings = []

    this._createBuildings()
  }

  _createBuildings() {
    const resources = this.experience.resources

    // CLAWD LABS - main building (right side of town)
    if (resources.items.buildingLab) {
      const lab = this._placeModel(resources.items.buildingLab, 10, 0, -2, 2.5)
      this._addLabel(lab, 'CLAWD LABS', 10, 5, -2)
      this.buildings.push({ name: 'lab', mesh: lab, pos: new THREE.Vector3(10, 0, -2) })

      // Lab collider
      this.experience.physics.addBoxCollider(10, 2.5, -2, 3, 2.5, 3)
    }

    // House 1 (left side)
    if (resources.items.buildingHouse1) {
      const house1 = this._placeModel(resources.items.buildingHouse1, -10, 0, -4, 2)
      this.buildings.push({ name: 'house1', mesh: house1, pos: new THREE.Vector3(-10, 0, -4) })
      this.experience.physics.addBoxCollider(-10, 2, -4, 2.5, 2, 2.5)
    }

    // House 2 (left-center)
    if (resources.items.buildingHouse2) {
      const house2 = this._placeModel(resources.items.buildingHouse2, -6, 0, -12, 1.8)
      this.buildings.push({ name: 'house2', mesh: house2, pos: new THREE.Vector3(-6, 0, -12) })
      this.experience.physics.addBoxCollider(-6, 1.8, -12, 2, 1.8, 2)
    }
  }

  _placeModel(gltf, x, y, z, scale) {
    const model = gltf.scene.clone()
    model.position.set(x, y, z)
    model.scale.setScalar(scale)
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    this.group.add(model)
    return model
  }

  _addLabel(parent, text, x, y, z) {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 512, 128)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 256, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.position.set(x, y, z)
    sprite.scale.set(4, 1, 1)
    this.group.add(sprite)
  }
}
