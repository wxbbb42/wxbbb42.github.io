import * as THREE from 'three'
import Ground from './Ground.js'
import Trees from './Trees.js'
import Buildings from './Buildings.js'
import Props from './Props.js'
import Water from './Water.js'
import Player from './Player.js'
import NPCs from './NPCs.js'
import Interior from './Interior.js'
import { TOWN } from '../utils/constants.js'
import { distance2D } from '../utils/math.js'

export default class World {
  constructor(experience) {
    this.experience = experience
    this.isInside = false

    // Create all world elements
    this.ground = new Ground(experience)
    this.trees = new Trees(experience)
    this.buildings = new Buildings(experience)
    this.props = new Props(experience)
    this.water = new Water(experience)
    this.player = new Player(experience)
    this.npcs = new NPCs(experience)
    this.interior = new Interior(experience)

    // Invisible boundary walls so player can't fall off the map
    const half = TOWN.halfSize
    const wallH = 5
    experience.physics.addBoxCollider(0, wallH / 2, -half, half, wallH / 2, 0.2)  // north
    experience.physics.addBoxCollider(0, wallH / 2, half, half, wallH / 2, 0.2)   // south
    experience.physics.addBoxCollider(-half, wallH / 2, 0, 0.2, wallH / 2, half)  // west
    experience.physics.addBoxCollider(half, wallH / 2, 0, 0.2, wallH / 2, half)   // east

    // Interaction state
    this.interactHint = document.getElementById('interact-hint')
    this.fadeOverlay = document.getElementById('fade-overlay')
    this.transitioning = false

    // Lab door trigger position
    this.labDoorPos = this.buildings.labDoorPosition
  }

  update(delta) {
    this.player.update(delta)
    this.npcs.update(delta)
    this.water.update(delta)
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
