import * as THREE from 'three'
import { AGENTS, STATUS_COLORS, TOWN, SKIN_COLOR } from '../utils/constants.js'
import { fixCharacterSkin } from '../utils/math.js'

export default class Interior {
  constructor(experience) {
    this.experience = experience
    this.group = new THREE.Group()
    this.group.position.set(
      TOWN.interiorOffset.x,
      TOWN.interiorOffset.y,
      TOWN.interiorOffset.z
    )
    this.experience.scene.add(this.group)

    this.agentGlows = {}
    this.agentLights = {}
    this.agentNPCs = []

    this.exitPosition = new THREE.Vector3(0, TOWN.interiorOffset.y + 0.5, 8)
    this.entryPosition = new THREE.Vector3(0, TOWN.interiorOffset.y + 0.5, 5)

    this._createRoom()
    this._createDesks()
    this._createAgentNPCs()
    this._createExitDoor()
    this._createPhysics()
  }

  _createRoom() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 16)
    floorGeo.rotateX(-Math.PI / 2)

    // Checkerboard via canvas texture
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    const tileSize = 32
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#c8a86a' : '#b89858'
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
      }
    }
    const floorTexture = new THREE.CanvasTexture(canvas)
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.8,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.receiveShadow = true
    this.group.add(floor)

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0d8,
      flatShading: true,
      roughness: 0.7,
    })

    // Back wall
    const backWallGeo = new THREE.BoxGeometry(20, 5, 0.2)
    const backWall = new THREE.Mesh(backWallGeo, wallMat)
    backWall.position.set(0, 2.5, -8)
    this.group.add(backWall)

    // Side walls
    const sideWallGeo = new THREE.BoxGeometry(0.2, 5, 16)
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat)
    leftWall.position.set(-10, 2.5, 0)
    this.group.add(leftWall)
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat)
    rightWall.position.set(10, 2.5, 0)
    this.group.add(rightWall)

    // Interior lighting
    const ambientLight = new THREE.PointLight(0xfff5e6, 2, 25)
    ambientLight.position.set(0, 4, 0)
    this.group.add(ambientLight)
  }

  _createDesks() {
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x8B5E3C, flatShading: true })
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x3344aa, flatShading: true, emissive: 0x1122aa, emissiveIntensity: 0.3 })

    const deskPositions = [-5, 0, 5]

    for (let i = 0; i < 3; i++) {
      const x = deskPositions[i]

      // Desk surface
      const deskGeo = new THREE.BoxGeometry(3, 0.15, 1.5)
      const desk = new THREE.Mesh(deskGeo, deskMat)
      desk.position.set(x, 1, -4)
      desk.castShadow = true
      desk.receiveShadow = true
      this.group.add(desk)

      // Desk legs
      const legGeo = new THREE.BoxGeometry(0.1, 1, 0.1)
      const positions = [
        [x - 1.3, 0.5, -4.6],
        [x + 1.3, 0.5, -4.6],
        [x - 1.3, 0.5, -3.4],
        [x + 1.3, 0.5, -3.4],
      ]
      for (const p of positions) {
        const leg = new THREE.Mesh(legGeo, deskMat)
        leg.position.set(...p)
        this.group.add(leg)
      }

      // Monitor
      const monitorGeo = new THREE.BoxGeometry(1, 0.8, 0.08)
      const monitor = new THREE.Mesh(monitorGeo, screenMat)
      monitor.position.set(x, 1.6, -4.5)
      monitor.castShadow = true
      this.group.add(monitor)

      // Monitor stand
      const standGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1)
      const stand = new THREE.Mesh(standGeo, deskMat)
      stand.position.set(x, 1.2, -4.5)
      this.group.add(stand)
    }
  }

  _createAgentNPCs() {
    const deskPositions = [-5, 0, 5]
    const modelKeys = ['agentClaw', 'agentCoin', 'agentNeo']
    this.agentMixers = []

    for (let i = 0; i < AGENTS.length; i++) {
      const agent = AGENTS[i]
      const x = deskPositions[i]

      const npc = new THREE.Group()

      // Try to load animated character model
      const gltf = this.experience.resources.items[modelKeys[i]]
      if (gltf) {
        const model = gltf.scene
        model.scale.setScalar(0.4)
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        fixCharacterSkin(model, SKIN_COLOR)
        npc.add(model)

        // Play idle animation
        const mixer = new THREE.AnimationMixer(model)
        const idleClip = gltf.animations.find(a => a.name === 'Idle')
        if (idleClip) mixer.clipAction(idleClip).play()
        this.agentMixers.push(mixer)
      } else {
        // Fallback box character
        const bodyMat = new THREE.MeshStandardMaterial({ color: agent.color, flatShading: true })
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.25), bodyMat)
        body.position.y = 0.47
        body.castShadow = true
        npc.add(body)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3),
          new THREE.MeshStandardMaterial({ color: 0xffcc88, flatShading: true }))
        head.position.y = 0.95
        npc.add(head)
      }

      npc.position.set(x, 1.1, -3.5)

      this.group.add(npc)

      // Glow ring on floor
      const glowGeo = new THREE.RingGeometry(0.5, 0.8, 16)
      glowGeo.rotateX(-Math.PI / 2)
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.position.set(x, 0.02, -3.5)
      this.group.add(glow)
      this.agentGlows[agent.id] = glow

      // Point light for agent
      const light = new THREE.PointLight(0x888888, 0.3, 5)
      light.position.set(x, 2, -3.5)
      this.group.add(light)
      this.agentLights[agent.id] = light

      // Agent name label
      const labelCanvas = document.createElement('canvas')
      labelCanvas.width = 256
      labelCanvas.height = 64
      const ctx = labelCanvas.getContext('2d')
      ctx.fillStyle = 'transparent'
      ctx.clearRect(0, 0, 256, 64)
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(agent.name, 128, 24)
      ctx.font = '10px "Press Start 2P", monospace'
      ctx.fillStyle = '#aaaaaa'
      ctx.fillText(agent.role, 128, 48)

      const labelTexture = new THREE.CanvasTexture(labelCanvas)
      const labelMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true })
      const label = new THREE.Sprite(labelMat)
      label.position.set(x, 1.6, -3.5)
      label.scale.set(2, 0.5, 1)
      this.group.add(label)

      this.agentNPCs.push({
        mesh: npc,
        id: agent.id,
        name: agent.name,
        dialog: agent.dialog,
        radius: 2,
        position: new THREE.Vector3(x, TOWN.interiorOffset.y + 1.1, -3.5),
      })
    }
  }

  _createExitDoor() {
    // Exit indicator on the far wall
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      flatShading: true,
      emissive: 0x4488cc,
      emissiveIntensity: 0.3,
    })
    const doorGeo = new THREE.BoxGeometry(2, 3, 0.2)
    const door = new THREE.Mesh(doorGeo, doorMat)
    door.position.set(0, 1.5, 8)
    this.group.add(door)

    // Exit label
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#88ccff'
    ctx.fillRect(0, 0, 128, 64)
    ctx.fillStyle = '#000000'
    ctx.font = '20px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('EXIT', 64, 40)
    const texture = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(0, 3.5, 8)
    sprite.scale.set(1.5, 0.75, 1)
    this.group.add(sprite)
  }

  _createPhysics() {
    const oy = TOWN.interiorOffset.y

    // Floor collider
    this.experience.physics.addBoxCollider(0, oy - 0.1, 0, 10, 0.1, 8)

    // Walls
    this.experience.physics.addBoxCollider(0, oy + 2.5, -8, 10, 2.5, 0.1)  // back
    this.experience.physics.addBoxCollider(-10, oy + 2.5, 0, 0.1, 2.5, 8)  // left
    this.experience.physics.addBoxCollider(10, oy + 2.5, 0, 0.1, 2.5, 8)   // right

    // Desks
    for (const x of [-5, 0, 5]) {
      this.experience.physics.addBoxCollider(x, oy + 0.5, -4, 1.5, 0.5, 0.75)
    }
  }

  update(delta) {
    if (this.agentMixers) {
      for (const mixer of this.agentMixers) {
        mixer.update(delta)
      }
    }
  }

  updateAgentGlow(id, status) {
    const glow = this.agentGlows[id]
    const light = this.agentLights[id]
    if (!glow || !light) return

    const config = STATUS_COLORS[status] || STATUS_COLORS.idle
    glow.material.color.setHex(config.hex)
    glow.material.opacity = status === 'idle' ? 0.15 : 0.4
    light.color.setHex(config.hex)
    light.intensity = config.intensity
  }

  getNearbyAgent(playerPos) {
    // Agent positions are local to group; convert to world by adding interiorOffset
    for (const agent of this.agentNPCs) {
      const worldX = agent.mesh.position.x + TOWN.interiorOffset.x
      const worldY = agent.mesh.position.y + TOWN.interiorOffset.y
      const worldZ = agent.mesh.position.z + TOWN.interiorOffset.z
      const dx = playerPos.x - worldX
      const dz = playerPos.z - worldZ
      const dy = playerPos.y - worldY
      if (Math.abs(dx) < agent.radius && Math.abs(dz) < agent.radius && Math.abs(dy) < 3) {
        return agent
      }
    }
    return null
  }

  isNearExit(playerPos) {
    // Exit door is at (0, 1.5, 8) local, convert to world coords
    const worldX = TOWN.interiorOffset.x
    const worldY = TOWN.interiorOffset.y + 0.5
    const worldZ = 8 + TOWN.interiorOffset.z
    const dx = playerPos.x - worldX
    const dz = playerPos.z - worldZ
    const dy = playerPos.y - worldY
    return Math.abs(dx) < 1.5 && Math.abs(dz) < 1.5 && Math.abs(dy) < 3
  }
}
