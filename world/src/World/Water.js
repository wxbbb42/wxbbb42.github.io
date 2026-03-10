import * as THREE from 'three'
import { COLORS, TOWN } from '../utils/constants.js'

export default class Water {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this.time = 0
    this._createWater()
  }

  _createWater() {
    const width = TOWN.size
    const depth = 8

    const geo = new THREE.PlaneGeometry(width, depth, 40, 8)
    geo.rotateX(-Math.PI / 2)

    this.waterGeo = geo

    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.water,
      flatShading: true,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    })

    this.waterMesh = new THREE.Mesh(geo, mat)
    this.waterMesh.position.set(0, -0.3, TOWN.halfSize - 2)
    this.waterMesh.receiveShadow = true
    this.group.add(this.waterMesh)

    // Lily pads
    this._createLilyPads()

    // Water collider (prevent player from walking in)
    this.experience.physics.addBoxCollider(
      0, 0.5, TOWN.halfSize - 2,
      TOWN.halfSize, 0.5, depth / 2
    )
  }

  _createLilyPads() {
    const padGeo = new THREE.CircleGeometry(0.3, 6)
    padGeo.rotateX(-Math.PI / 2)
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x2d8a2d,
      flatShading: true,
      roughness: 0.7,
    })

    for (let i = 0; i < 12; i++) {
      const pad = new THREE.Mesh(padGeo, padMat)
      pad.position.set(
        -20 + Math.random() * 40,
        -0.18,
        TOWN.halfSize - 4 + Math.random() * 4
      )
      pad.scale.setScalar(0.5 + Math.random() * 0.8)
      this.group.add(pad)

      // Occasional flower on lily pad
      if (Math.random() > 0.6) {
        const flowerGeo = new THREE.IcosahedronGeometry(0.1, 0)
        const flowerMat = new THREE.MeshStandardMaterial({
          color: 0xff88aa,
          flatShading: true,
        })
        const flower = new THREE.Mesh(flowerGeo, flowerMat)
        flower.position.copy(pad.position)
        flower.position.y = -0.1
        this.group.add(flower)
      }
    }
  }

  update(delta) {
    this.time += delta

    // Animate water vertices
    const pos = this.waterGeo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const y = Math.sin(x * 0.5 + this.time * 1.5) * 0.08 +
                Math.sin(z * 0.3 + this.time * 1.2) * 0.06
      pos.setY(i, y)
    }
    pos.needsUpdate = true
    this.waterGeo.computeVertexNormals()
  }
}
