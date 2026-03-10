import * as THREE from 'three'
import Ground from './Ground.js'
import Rocks from './Trees.js'
import Buildings from './Buildings.js'
import Props from './Props.js'
import CraterField from './Water.js'
import Player from './Player.js'
import NPCs from './NPCs.js'
import Interior from './Interior.js'
import { TOWN } from '../utils/constants.js'
import { distance2D } from '../utils/math.js'

export default class World {
  constructor(experience) {
    this.experience = experience
    this.isInside = false

    // Create ground only — models are placed via the editor (Tab key)
    this.ground = new Ground(experience)
    this.buildings = null
    this.rocks = null
    this.props = null
    this.craterField = null

    // Load editor layout if saved
    if (experience.editor && experience.editor.hasSavedLayout()) {
      experience.editor.loadLayout()
    }
    this.player = new Player(experience)
    this.npcs = new NPCs(experience)
    this.interior = new Interior(experience)

    // Invisible boundary — ring of colliders following the irregular ground edge
    const groundHalf = (TOWN.size + 10) / 2
    const wallSegments = 96
    const wallH = 3
    for (let i = 0; i < wallSegments; i++) {
      const angle = (i / wallSegments) * Math.PI * 2
      const edgeR = 0.82
        + 0.055 * Math.sin(angle * 1.0 + 0.3)
        + 0.045 * Math.sin(angle * 2.0 + 1.7)
        + 0.035 * Math.sin(angle * 3.0 + 2.1)
        + 0.028 * Math.sin(angle * 4.0 + 0.8)
        + 0.022 * Math.sin(angle * 5.0 + 3.4)
        + 0.018 * Math.sin(angle * 7.0 + 1.3)
        + 0.014 * Math.sin(angle * 9.0 + 4.2)
        + 0.010 * Math.sin(angle * 13.0 + 0.6)
        + 0.007 * Math.sin(angle * 17.0 + 2.9)
        + 0.005 * Math.sin(angle * 23.0 + 1.1)
      const r = edgeR * groundHalf - 0.3
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const nx = Math.cos(angle)
      const nz = Math.sin(angle)
      // Smaller boxes with more segments = tighter fit to the curved edge
      experience.physics.addBoxCollider(x, wallH / 2, z, 0.2 + Math.abs(nz) * 0.7, wallH / 2, 0.2 + Math.abs(nx) * 0.7)
    }

    // Interaction state
    this.interactHint = document.getElementById('interact-hint')
    this.fadeOverlay = document.getElementById('fade-overlay')
    this.transitioning = false

    // Lab door trigger position
    this.labDoorPos = this.buildings ? this.buildings.labDoorPosition : new THREE.Vector3(10, 0, 2)
  }

  update(delta) {
    this.player.update(delta)
    this.npcs.update(delta)
    if (this.craterField) this.craterField.update(delta)
    this.interior.update(delta)

    if (this.transitioning) return

    this._checkInteractions()
  }

  _checkInteractions() {
    const playerPos = this.player.position
    const input = this.experience.input
    const dialog = this.experience.dialog

    if (dialog.active) return

    let showHint = false

    if (this.isInside) {
      // Check agent proximity
      const nearbyAgent = this.interior.getNearbyAgent(playerPos)
      if (nearbyAgent) {
        showHint = true
        if (input.consumeInteract()) {
          const status = this.experience.agentHUD.getStatus(nearbyAgent.id)
          const text = nearbyAgent.dialog.replace('{status}', status.toUpperCase())
          dialog.show(nearbyAgent.name, text)
        }
      }

      // Check exit door
      if (this.interior.isNearExit(playerPos)) {
        showHint = true
        if (input.consumeInteract()) {
          this._transitionToExterior()
        }
      }
    } else {
      // Check NPC proximity
      const nearbyNPC = this.npcs.getNearbyNPC(playerPos)
      if (nearbyNPC) {
        showHint = true
        if (input.consumeInteract()) {
          dialog.show(nearbyNPC.name, nearbyNPC.dialog)
          nearbyNPC.triggered = true
        }
      }

      // Check lab door proximity
      const distToLabDoor = distance2D(playerPos.x, playerPos.z, this.labDoorPos.x, this.labDoorPos.z)
      if (distToLabDoor < 2.5) {
        showHint = true
        if (input.consumeInteract()) {
          this._transitionToInterior()
        }
      }
    }

    this.interactHint.classList.toggle('hidden', !showHint)
  }

  _transitionToInterior() {
    this.transitioning = true
    this.interactHint.classList.add('hidden')

    // Fade to black
    this.fadeOverlay.classList.add('active')

    setTimeout(() => {
      this.isInside = true
      // Teleport player to interior
      this.player.teleportTo(
        TOWN.interiorOffset.x,
        TOWN.interiorOffset.y + 0.5,
        TOWN.interiorOffset.z + 5
      )

      // Fade from black
      setTimeout(() => {
        this.fadeOverlay.classList.remove('active')
        this.transitioning = false
      }, 500)
    }, 600)
  }

  _transitionToExterior() {
    this.transitioning = true
    this.interactHint.classList.add('hidden')

    // Fade to black
    this.fadeOverlay.classList.add('active')

    setTimeout(() => {
      this.isInside = false
      // Teleport player back to exterior (near lab door)
      this.player.teleportTo(
        this.labDoorPos.x,
        0.5,
        this.labDoorPos.z + 2
      )

      // Fade from black
      setTimeout(() => {
        this.fadeOverlay.classList.remove('active')
        this.transitioning = false
      }, 500)
    }, 600)
  }
}
