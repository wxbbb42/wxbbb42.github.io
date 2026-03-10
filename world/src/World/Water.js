import * as THREE from 'three'
import { TOWN } from '../utils/constants.js'

// Craters scattered near the south area
export default class CraterField {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this._createCraterField()
  }

  _createCraterField() {
    const r = this.experience.resources

    if (r.items.craterLarge) {
      const craterPositions = [-6, -1, 4, 8]
      for (const cx of craterPositions) {
        const model = r.items.craterLarge.scene.clone()
        model.scale.setScalar(1.5)
        model.position.set(cx, -0.3, TOWN.halfSize - 2 + (Math.random() - 0.5) * 2)
        model.rotation.y = Math.random() * Math.PI * 2
        model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
        this.group.add(model)
      }
    }

    if (r.items.meteorHalf) {
      const m1 = r.items.meteorHalf.scene.clone()
      m1.scale.setScalar(1.0)
      m1.position.set(-4, -0.2, TOWN.halfSize - 4)
      m1.rotation.set(0.3, 1.2, 0)
      m1.traverse(c => { if (c.isMesh) { c.castShadow = true } })
      this.group.add(m1)

      const m2 = r.items.meteorHalf.scene.clone()
      m2.scale.setScalar(0.7)
      m2.position.set(6, -0.1, TOWN.halfSize - 3)
      m2.rotation.set(-0.2, 0.5, 0.4)
      m2.traverse(c => { if (c.isMesh) { c.castShadow = true } })
      this.group.add(m2)
    }

    const smallRockModels = [r.items.rocksSmallA, r.items.rocksSmallB].filter(Boolean)
    for (let i = 0; i < 6; i++) {
      const gltf = smallRockModels[Math.floor(Math.random() * smallRockModels.length)]
      if (!gltf) continue
      const rock = gltf.scene.clone()
      rock.scale.setScalar(0.3 + Math.random() * 0.5)
      rock.position.set(
        -8 + Math.random() * 16,
        -0.2,
        TOWN.halfSize - 4 + Math.random() * 4
      )
      rock.rotation.y = Math.random() * Math.PI * 2
      rock.traverse(c => { if (c.isMesh) { c.receiveShadow = true } })
      this.group.add(rock)
    }
  }

  update() {}
}
