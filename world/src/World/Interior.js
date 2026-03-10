import * as THREE from 'three'
import { AGENTS, STATUS_COLORS, TOWN } from '../utils/constants.js'

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
    // Metal floor with grid pattern
    const floorGeo = new THREE.PlaneGeometry(20, 16)
    floorGeo.rotateX(-Math.PI / 2)

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    const tileSize = 32
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#444455' : '#555566'
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
      }
    }
    const floorTexture = new THREE.CanvasTexture(canvas)
    floorTexture.wrapS = THREE.RepeatWrapping
    floorTexture.wrapT = THREE.RepeatWrapping

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.6,
      metalness: 0.3,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.receiveShadow = true
    this.group.add(floor)

    // Blue-gray metal walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x667788,
      flatShading: true,
      roughness: 0.6,
      metalness: 0.2,
    })

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 0.2), wallMat)
    backWall.position.set(0, 2.5, -8)
    this.group.add(backWall)

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 16), wallMat)
    leftWall.position.set(-10, 2.5, 0)
    this.group.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 16), wallMat)
    rightWall.position.set(10, 2.5, 0)
    this.group.add(rightWall)

    // Cool white lab lighting
    const labLight = new THREE.PointLight(0xeeeeff, 2, 25)
    labLight.position.set(0, 4, 0)
    this.group.add(labLight)
  }

  _createDesks() {
    const r = this.experience.resources
    const deskPositions = [-5, 0, 5]
    const agentColors = [0xff4444, 0xf0a000, 0x4488ff] // Claw, Coin, Neo

    this.deskLights = []
    this.monitorMeshes = []

    for (let i = 0; i < 3; i++) {
      const x = deskPositions[i]

      // Try Kenney desk model
      if (r.items.deskComputer) {
        const desk = r.items.deskComputer.scene.clone()
        desk.scale.setScalar(1.0)
        desk.position.set(x, 0, -4)
        desk.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
        this.group.add(desk)
      } else {
        // Fallback procedural desk
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x556677, flatShading: true, metalness: 0.3 })
        const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 1.5), deskMat)
        desk.position.set(x, 1, -4)
        desk.castShadow = true
        this.group.add(desk)
      }

      // Chair
      if (r.items.deskChairArms) {
        const chair = r.items.deskChairArms.scene.clone()
        chair.scale.setScalar(1.0)
        chair.position.set(x, 0, -3)
        chair.traverse(c => { if (c.isMesh) { c.castShadow = true } })
        this.group.add(chair)
      }

      // Screen glow monitor — emissive intensity driven by agent status
      const col = new THREE.Color(agentColors[i])
      const screenMat = new THREE.MeshStandardMaterial({
        color: col,
        flatShading: true,
        emissive: col,
        emissiveIntensity: 0.3,
      })
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), screenMat)
      monitor.position.set(x, 1.6, -4.5)
      monitor.castShadow = true
      this.group.add(monitor)
      this.monitorMeshes.push(monitor)

      // Per-desk agent-colored point light (replaces single center lab light)
      const deskLight = new THREE.PointLight(agentColors[i], 0.4, 8)
      deskLight.position.set(x, 3.0, -4)
      this.group.add(deskLight)
      this.deskLights.push(deskLight)
    }
  }

  _createAgentNPCs() {
    const deskPositions = [-5, 0, 5]
    this.agentMixers = []

    // Use astronaut model for all agents
    const astronautGltf = this.experience.resources.items.astronaut

    for (let i = 0; i < AGENTS.length; i++) {
      const agent = AGENTS[i]
      const x = deskPositions[i]

      const npc = new THREE.Group()

      if (astronautGltf) {
        const model = astronautGltf.scene.clone()
        model.scale.setScalar(1.2)
        model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
        npc.add(model)
      } else {
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

      // Glow ring
      const glowGeo = new THREE.RingGeometry(0.5, 0.8, 16)
      glowGeo.rotateX(-Math.PI / 2)
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x888888, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.position.set(x, 0.02, -3.5)
      this.group.add(glow)
      this.agentGlows[agent.id] = glow

      // Point light
      const light = new THREE.PointLight(0x888888, 0.3, 5)
      light.position.set(x, 2, -3.5)
      this.group.add(light)
      this.agentLights[agent.id] = light

      // Name label
      const labelCanvas = document.createElement('canvas')
      labelCanvas.width = 256
      labelCanvas.height = 64
      const ctx = labelCanvas.getContext('2d')
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
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x44ffaa,
      flatShading: true,
      emissive: 0x22aa66,
      emissiveIntensity: 0.3,
    })
    const door = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.2), doorMat)
    door.position.set(0, 1.5, 8)
    this.group.add(door)

    // Exit label
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#44ffaa'
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
    this.experience.physics.addBoxCollider(0, oy - 0.1, 0, 10, 0.1, 8)
    this.experience.physics.addBoxCollider(0, oy + 2.5, -8, 10, 2.5, 0.1)
    this.experience.physics.addBoxCollider(-10, oy + 2.5, 0, 0.1, 2.5, 8)
    this.experience.physics.addBoxCollider(10, oy + 2.5, 0, 0.1, 2.5, 8)
    for (const x of [-5, 0, 5]) {
      this.experience.physics.addBoxCollider(x, oy + 0.5, -4, 1.5, 0.5, 0.75)
    }
  }

  update(delta) {
    if (this.agentMixers) {
      for (const mixer of this.agentMixers) mixer.update(delta)
    }
  }

  updateAgentGlow(id, status) {
    const agentIndex = AGENTS.findIndex(a => a.id === id)
    const glow = this.agentGlows[id]
    const light = this.agentLights[id]
    if (!glow || !light) return
    const config = STATUS_COLORS[status] || STATUS_COLORS.idle
    const col = new THREE.Color(config.hex)
    glow.material.color.copy(col)
    glow.material.opacity = status === 'idle' ? 0.15 : 0.5
    light.color.copy(col)
    light.intensity = config.intensity

    // Update desk light + monitor emissive
    if (agentIndex >= 0 && this.deskLights && this.monitorMeshes) {
      const deskLight = this.deskLights[agentIndex]
      const monitor = this.monitorMeshes[agentIndex]
      if (deskLight) {
        deskLight.color.copy(col)
        deskLight.intensity = status === 'idle' ? 0.4 : 1.4
      }
      if (monitor) {
        monitor.material.emissive.copy(col)
        monitor.material.emissiveIntensity = status === 'idle' ? 0.3 : 1.5
      }
    }
  }

  getNearbyAgent(playerPos) {
    const worldPos = new THREE.Vector3()
    for (const agent of this.agentNPCs) {
      agent.mesh.getWorldPosition(worldPos)
      const dx = playerPos.x - worldPos.x
      const dz = playerPos.z - worldPos.z
      const dy = playerPos.y - worldPos.y
      if (Math.abs(dx) < agent.radius && Math.abs(dz) < agent.radius && Math.abs(dy) < 3) return agent
    }
    return null
  }

  isNearExit(playerPos) {
    const worldX = TOWN.interiorOffset.x
    const worldY = TOWN.interiorOffset.y + 0.5
    const worldZ = 8 + TOWN.interiorOffset.z
    const dx = playerPos.x - worldX
    const dz = playerPos.z - worldZ
    const dy = playerPos.y - worldY
    return Math.abs(dx) < 1.5 && Math.abs(dz) < 1.5 && Math.abs(dy) < 3
  }
}
