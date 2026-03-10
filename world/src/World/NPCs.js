import * as THREE from 'three'
import { COLORS } from '../utils/constants.js'

export default class NPCs {
  constructor(experience) {
    this.experience = experience
    this.npcs = []
    this.group = new THREE.Group()
    this.mixers = []
    this.experience.scene.add(this.group)

    this._createCommander()
  }

  _createCommander() {
    const gltf = this.experience.resources.items.astronaut
    const npcGroup = new THREE.Group()
    npcGroup.position.set(0, 0, 2)

    if (gltf) {
      const model = gltf.scene.clone()
      model.scale.setScalar(1.4)
      model.traverse(c => {
        if (c.isMesh) { c.castShadow = true; c.receiveShadow = true }
      })
      npcGroup.add(model)
      // Kenney astronaut has no animations — add gentle bob
    } else {
      this._createFallbackNPC(npcGroup, COLORS.metal)
    }

    this.group.add(npcGroup)
    this.npcs.push({
      mesh: npcGroup,
      name: 'Commander Aria',
      dialog: "Welcome to CLAWD BASE!\nUse WASD to move around.\nPress E to interact.\nEnter the hangar to meet the agents!",
      radius: 2.5,
      triggered: false,
    })
  }

  _createFallbackNPC(group, color) {
    const bodyMat = new THREE.MeshStandardMaterial({ color, flatShading: true })
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, flatShading: true })

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), bodyMat)
    body.position.y = 0.55
    body.castShadow = true
    group.add(body)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), headMat)
    head.position.y = 1.1
    head.castShadow = true
    group.add(head)
  }

  update(delta) {
    // Gentle bob for astronaut NPC
    for (const npc of this.npcs) {
      npc.mesh.position.y = Math.sin(Date.now() * 0.002) * 0.04
    }
    for (const mixer of this.mixers) {
      mixer.update(delta)
    }
  }

  getNearbyNPC(playerPos, interactRadius = 2.5) {
    for (const npc of this.npcs) {
      const dx = playerPos.x - npc.mesh.position.x
      const dz = playerPos.z - npc.mesh.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < npc.radius) return npc
    }
    return null
  }
}
