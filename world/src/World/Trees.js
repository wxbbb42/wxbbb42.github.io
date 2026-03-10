import * as THREE from 'three'
import { COLORS, TOWN } from '../utils/constants.js'

export default class Rocks {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this._createRocks()
  }

  _createRocks() {
    const r = this.experience.resources
    const half = TOWN.halfSize

    const borderModels = [
      r.items.rockLargeA,
      r.items.rockLargeB,
      r.items.rocksSmallA,
      r.items.rocksSmallB,
    ].filter(Boolean)

    if (borderModels.length === 0) return

    // Border rocks — ring around the edge
    const borderCount = 20
    for (let i = 0; i < borderCount; i++) {
      const angle = (i / borderCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2
      const dist = half + Math.random() * 3
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist

      const gltf = borderModels[Math.floor(Math.random() * borderModels.length)]
      const model = gltf.scene.clone()
      model.scale.setScalar(0.5 + Math.random() * 0.6)
      model.position.set(x, 0, z)
      model.rotation.y = Math.random() * Math.PI * 2
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
      this.group.add(model)
      this.experience.physics.addBoxCollider(x, 0.8, z, 0.6, 0.8, 0.6)
    }

    // Interior scatter
    const interiorItems = [
      { model: r.items.rockCrystalsLargeA, x: -6, z: -8,  s: 2.0 },
      { model: r.items.rockLargeA,         x: 7,  z: -9,  s: 1.8 },
      { model: r.items.crater,             x: -9, z: 5,   s: 2.0 },
      { model: r.items.rockCrystals,       x: 10, z: 7,   s: 1.5 },
      { model: r.items.rockLargeB,         x: -11, z: -3, s: 1.8 },
      { model: r.items.bones,              x: 12, z: -4,  s: 1.5 },
      { model: r.items.rocksSmallA,        x: 3,  z: 11,  s: 1.5 },
    ]

    for (const item of interiorItems) {
      if (!item.model) continue
      const model = item.model.scene.clone()
      model.scale.setScalar(item.s)
      model.position.set(item.x, 0, item.z)
      model.rotation.y = Math.random() * Math.PI * 2
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
      this.group.add(model)
      this.experience.physics.addBoxCollider(item.x, 0.8, item.z, 0.8, 0.8, 0.8)
    }

    // Crystal glow lights
    for (const cp of [{ x: -6, z: -8 }, { x: 10, z: 7 }]) {
      const light = new THREE.PointLight(COLORS.crystal, 0.5, 4)
      light.position.set(cp.x, 1, cp.z)
      this.group.add(light)
    }
  }
}
