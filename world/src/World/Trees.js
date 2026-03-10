import * as THREE from 'three'
import { COLORS, TOWN } from '../utils/constants.js'

export default class Trees {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.experience.scene.add(this.group)

    this._createTrees()
  }

  _createTreeTemplate(type) {
    const tree = new THREE.Group()

    // Trunk
    const trunkH = type === 'tall' ? 1.8 : type === 'medium' ? 1.2 : 0.8
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, trunkH, 6)
    const trunkMat = new THREE.MeshStandardMaterial({
      color: COLORS.treeTrunk,
      flatShading: true,
      roughness: 0.9,
    })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = trunkH / 2
    trunk.castShadow = true
    tree.add(trunk)

    // Canopy
    const greens = [COLORS.treeGreen, COLORS.treeGreenLight, COLORS.treeGreenDark]

    if (type === 'tall') {
      // Pine tree: stacked cones
      for (let i = 0; i < 3; i++) {
        const coneGeo = new THREE.ConeGeometry(1.2 - i * 0.25, 1.2, 6)
        const coneMat = new THREE.MeshStandardMaterial({
          color: greens[i % greens.length],
          flatShading: true,
          roughness: 0.8,
        })
        const cone = new THREE.Mesh(coneGeo, coneMat)
        cone.position.y = trunkH + 0.4 + i * 0.7
        cone.castShadow = true
        tree.add(cone)
      }
    } else if (type === 'medium') {
      // Round tree: sphere canopy
      const sphereGeo = new THREE.IcosahedronGeometry(1.2, 1)
      const sphereMat = new THREE.MeshStandardMaterial({
        color: COLORS.treeGreenLight,
        flatShading: true,
        roughness: 0.8,
      })
      const sphere = new THREE.Mesh(sphereGeo, sphereMat)
      sphere.position.y = trunkH + 0.8
      sphere.castShadow = true
      tree.add(sphere)
    } else {
      // Bush: flattened sphere
      const bushGeo = new THREE.IcosahedronGeometry(0.9, 1)
      bushGeo.scale(1, 0.7, 1)
      const bushMat = new THREE.MeshStandardMaterial({
        color: COLORS.treeGreenDark,
        flatShading: true,
        roughness: 0.8,
      })
      const bush = new THREE.Mesh(bushGeo, bushMat)
      bush.position.y = 0.6
      bush.castShadow = true
      tree.add(bush)
    }

    return tree
  }

  _createTrees() {
    const types = ['tall', 'medium', 'bush']
    const half = TOWN.halfSize
    const margin = 2
    const positions = []

    // Border trees - top edge
    for (let x = -half + margin; x <= half - margin; x += 3 + Math.random() * 2) {
      positions.push({ x, z: -half + margin + Math.random() * 2 })
    }
    // Bottom edge
    for (let x = -half + margin; x <= half - margin; x += 3 + Math.random() * 2) {
      positions.push({ x, z: half - margin - Math.random() * 2 })
    }
    // Left edge
    for (let z = -half + margin + 3; z <= half - margin - 3; z += 3 + Math.random() * 2) {
      positions.push({ x: -half + margin + Math.random() * 2, z })
    }
    // Right edge
    for (let z = -half + margin + 3; z <= half - margin - 3; z += 3 + Math.random() * 2) {
      positions.push({ x: half - margin - Math.random() * 2, z })
    }

    // Some scattered interior trees
    const interiorPositions = [
      { x: -8, z: -10 }, { x: 8, z: -12 }, { x: -12, z: 8 },
      { x: 15, z: 12 }, { x: -15, z: -5 }, { x: 18, z: -8 },
      { x: -10, z: 15 }, { x: 5, z: 18 },
    ]
    positions.push(...interiorPositions)

    for (const pos of positions) {
      const type = types[Math.floor(Math.random() * types.length)]
      const tree = this._createTreeTemplate(type)
      const scale = 0.8 + Math.random() * 0.6
      tree.scale.setScalar(scale)
      tree.position.set(pos.x, 0, pos.z)
      tree.rotation.y = Math.random() * Math.PI * 2
      this.group.add(tree)

      // Physics collider for trees
      this.experience.physics.addBoxCollider(
        pos.x, 1, pos.z,
        0.4, 1, 0.4
      )
    }
  }
}
