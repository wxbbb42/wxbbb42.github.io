import * as THREE from 'three'
import { SKIN_COLOR } from '../utils/constants.js'
import { fixCharacterSkin } from '../utils/math.js'

export default class NPCs {
  constructor(experience) {
    this.experience = experience
    this.npcs = []
    this.group = new THREE.Group()
    this.mixers = []
    this.experience.scene.add(this.group)

    this._createProfessor()
  }

  _createProfessor() {
    const gltf = this.experience.resources.items.professor
    const npcGroup = new THREE.Group()
    npcGroup.position.set(0, 0, 2)

    if (gltf) {
      const model = gltf.scene
      model.scale.setScalar(0.5)
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      fixCharacterSkin(model, SKIN_COLOR)
      npcGroup.add(model)

      // Play idle animation
      const mixer = new THREE.AnimationMixer(model)
      const idleClip = gltf.animations.find(a => a.name === 'Idle')
      if (idleClip) {
        mixer.clipAction(idleClip).play()
      }
      this.mixers.push(mixer)
    } else {
      // Fallback: procedural NPC
      this._createFallbackNPC(npcGroup, 0xffffff)
    }

    this.group.add(npcGroup)
    this.npcs.push({
      mesh: npcGroup,
      name: 'Professor Oak',
      dialog: "Welcome to CLAWD TOWN!\nUse WASD to move around.\nPress E to interact.\nVisit CLAWD LABS to meet the agents!",
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
    for (const mixer of this.mixers) {
      mixer.update(delta)
    }
  }

  getNearbyNPC(playerPos, interactRadius = 2.5) {
    for (const npc of this.npcs) {
      const dx = playerPos.x - npc.mesh.position.x
      const dz = playerPos.z - npc.mesh.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < npc.radius) {
        return npc
      }
    }
    return null
  }
}
