import * as THREE from 'three'
import { COLORS, TOWN } from '../utils/constants.js'

// Shared instanced mesh factory — uses one draw call for repeated meshes
function createInstanced(sourceMesh, positions, scene) {
  if (!sourceMesh) return null
  const mesh = new THREE.InstancedMesh(sourceMesh.geometry, sourceMesh.material, positions.length)
  mesh.castShadow = true
  mesh.receiveShadow = true
  const dummy = new THREE.Object3D()
  positions.forEach(({ x, y, z, s, ry }, i) => {
    dummy.position.set(x, y, z)
    dummy.rotation.y = ry ?? 0
    dummy.scale.setScalar(s ?? 1)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
  scene.add(mesh)
  return mesh
}

// Pick first mesh from a GLTF scene
function firstMesh(gltf) {
  let found = null
  gltf?.scene?.traverse(c => { if (c.isMesh && !found) found = c })
  return found
}

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
    const scene = this.experience.scene
    const physics = this.experience.physics

    // ------- Border ring: InstancedMesh for the 20 edge rocks -------
    const borderPositions = []
    const borderCount = 20
    for (let i = 0; i < borderCount; i++) {
      const angle = (i / borderCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2
      const dist = half + Math.random() * 3
      borderPositions.push({
        x: Math.cos(angle) * dist,
        y: 0,
        z: Math.sin(angle) * dist,
        s: 0.5 + Math.random() * 0.6,
        ry: Math.random() * Math.PI * 2,
      })
      physics.addBoxCollider(
        Math.cos(angle) * dist, 0.8, Math.sin(angle) * dist,
        0.6, 0.8, 0.6
      )
    }

    // Split border rocks between rockLargeA and rockLargeB using InstancedMesh
    const halfBorder = Math.floor(borderCount / 2)
    const meshA = firstMesh(r.items.rockLargeA)
    const meshB = firstMesh(r.items.rockLargeB)
    if (meshA) createInstanced(meshA, borderPositions.slice(0, halfBorder), scene)
    if (meshB) createInstanced(meshB, borderPositions.slice(halfBorder), scene)

    // ------- Small scatter rocks (InstancedMesh) -------
    const smallPositions = []
    const smallCount = 8
    for (let i = 0; i < smallCount; i++) {
      smallPositions.push({
        x: (Math.random() - 0.5) * 20,
        y: 0,
        z: half - 4 + Math.random() * 4,
        s: 0.3 + Math.random() * 0.5,
        ry: Math.random() * Math.PI * 2,
      })
    }
    const smA = firstMesh(r.items.rocksSmallA)
    const smB = firstMesh(r.items.rocksSmallB)
    if (smA) createInstanced(smA, smallPositions.slice(0, 4), scene)
    if (smB) createInstanced(smB, smallPositions.slice(4), scene)

    // ------- Interior landmark props (individual, not instanced) -------
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
      physics.addBoxCollider(item.x, 0.8, item.z, 0.8, 0.8, 0.8)
    }

    // Crystal glow point lights
    for (const cp of [{ x: -6, z: -8 }, { x: 10, z: 7 }]) {
      const light = new THREE.PointLight(COLORS.crystal, 0.8, 5)
      light.position.set(cp.x, 1, cp.z)
      this.group.add(light)
    }
  }
}
