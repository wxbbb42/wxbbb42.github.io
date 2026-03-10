import * as THREE from 'three'
import { COLORS, TOWN } from '../utils/constants.js'

export default class Ground {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this._createGrass()
    this._createPaths()
  }

  _createGrass() {
    const geo = new THREE.PlaneGeometry(TOWN.size, TOWN.size, 20, 20)
    geo.rotateX(-Math.PI / 2)

    // Subtle height variation
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      pos.setY(i, y + (Math.random() - 0.5) * 0.15)
    }
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.grass,
      flatShading: true,
      roughness: 0.9,
      metalness: 0,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.receiveShadow = true
    this.group.add(mesh)
  }

  _createPaths() {
    // Main vertical path (center of town)
    this._addPath(0, -5, 3, 20)
    // Horizontal path connecting buildings
    this._addPath(0, 2, 24, 3)
    // Path to lab entrance
    this._addPath(10, -4, 3, 8)
  }

  _addPath(x, z, width, depth) {
    const geo = new THREE.PlaneGeometry(width, depth)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.dirt,
      flatShading: true,
      roughness: 1,
      metalness: 0,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, 0.01, z)
    mesh.receiveShadow = true
    this.group.add(mesh)
  }
}
