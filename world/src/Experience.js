import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import RAPIER from '@dimforge/rapier3d-compat'
import Ticker from './Ticker.js'
import Input from './Input.js'
import Renderer from './Renderer.js'
import Camera from './Camera.js'
import Physics from './Physics.js'
import Resources from './Resources.js'
import World from './World/World.js'
import AgentHUD from './UI/AgentHUD.js'
import Dialog from './UI/Dialog.js'
import Intro from './UI/Intro.js'
import Editor from './Editor.js'
import SoundManager from './SoundManager.js'
import { COLORS } from './utils/constants.js'

export default class Experience {
  static instance = null

  constructor(canvas) {
    if (Experience.instance) return Experience.instance
    Experience.instance = this

    this.canvas = canvas

    // Three.js scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(COLORS.sky)
    this.scene.fog = new THREE.Fog(COLORS.fog, 20, 60)

    // Core systems
    this.ticker = new Ticker()
    this.input = new Input()
    this.sound = new SoundManager()
    this.resources = new Resources()

    // Camera and renderer (need scene first)
    this.camera = new Camera(this)
    this.renderer = new Renderer(this)

    // UI
    this.dialog = new Dialog(this)
    this.agentHUD = new AgentHUD(this)
    this.intro = new Intro(this)

    // Lighting
    this._setupLighting()

    // Stars & atmosphere (can be called immediately — no assets needed)
    this._setupStars()
    this._setupDustParticles()

    // Physics and world will be initialized async
    this.physics = null
    this.world = null

    // Loading progress
    this.resources.onProgress((progress) => {
      this.intro.updateProgress(progress)
    })

    // Start loading
    this._init()
  }

  async _init() {
    // 1. Initialize Rapier physics
    await RAPIER.init()
    this.physics = new Physics(this, RAPIER)

    // 2. Load all assets
    await this.resources.loadAll()

    // 3. Auto-enter: bind callback first, then trigger
    this.intro.onEnter = () => this._start()
    this.intro.showEnterButton()
  }

  _start() {
    // Create the editor (before World so World can check for saved layout)
    this.editor = new Editor(this)

    // Build the world
    this.world = new World(this)

    // Start agent status polling
    this.agentHUD.start()

    // Wire agent status changes to interior glows
    this.agentHUD.on('statusChange', (id, status) => {
      if (this.world && this.world.interior) {
        this.world.interior.updateAgentGlow(id, status)
      }
    })

    // Start the main loop
    this.ticker.on('tick', (delta) => {
      this.input.update()
      if (this.physics) this.physics.update(delta)
      if (this.world) this.world.update(delta)
      if (this.editor) this.editor.update()
      this.updateDust(delta)
      this.camera.update(delta)
      // Keep DOF focused on player
      if (this.world && this.world.player) {
        this.renderer.updateDOF(this.world.player.group.position)
      }
      this.renderer.render()
    })
    this.ticker.start()
  }

  _setupStars() {
    // Distant star field
    const starCount = 3000
    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 80 + Math.random() * 20
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      fog: false, // stars must NOT be affected by scene fog
    })
    this.stars = new THREE.Points(starGeo, starMat)
    this.scene.add(this.stars)
  }

  _setupDustParticles() {
    // Mars atmospheric dust — subtle floating particles
    const count = 300
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = Math.random() * 4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      speeds[i] = 0.002 + Math.random() * 0.004
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this._dustPositions = positions
    this._dustSpeeds = speeds
    this._dustCount = count

    const dustMat = new THREE.PointsMaterial({
      color: 0xC4835A,
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4,
    })
    this.dustParticles = new THREE.Points(dustGeo, dustMat)
    this.scene.add(this.dustParticles)
  }

  updateDust(delta) {
    if (!this.dustParticles) return
    const pos = this._dustPositions
    const speeds = this._dustSpeeds
    const count = this._dustCount
    for (let i = 0; i < count; i++) {
      // Drift upward + slight x drift, wrap when too high
      pos[i * 3]     += Math.sin(i * 0.3 + this._dustTime) * 0.003
      pos[i * 3 + 1] += speeds[i]
      if (pos[i * 3 + 1] > 5) {
        pos[i * 3 + 1] = 0
        pos[i * 3]     = (Math.random() - 0.5) * 40
        pos[i * 3 + 2] = (Math.random() - 0.5) * 40
      }
    }
    this._dustTime = (this._dustTime || 0) + delta
    this.dustParticles.geometry.attributes.position.needsUpdate = true
  }

  _setupLighting() {
    // Environment map — key for PBR materials (removes pure-black dark faces)
    const pmrem = new THREE.PMREMGenerator(this.renderer.instance)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04)
    this.scene.environment = env.texture
    this.scene.environmentIntensity = 0.3  // very low IBL — deep space shadows
    pmrem.dispose()

    // Hemisphere light: warm Mars sky above, deep red ground below
    // This is the "ambient bounce" — no harsh shadows, fills all faces
    const hemisphere = new THREE.HemisphereLight(
      0xFFCC99,
      0x3A0E00,  // very dark ground bounce
      0.4        // low — let sun+shadows dominate
    )
    this.scene.add(hemisphere)

    // Key light: sun (lower intensity — hemisphere does the heavy lifting now)
    const sun = new THREE.DirectionalLight(0xFFEECC, 0.9)
    sun.position.set(15, 20, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 80
    sun.shadow.camera.left = -22
    sun.shadow.camera.right = 22
    sun.shadow.camera.top = 22
    sun.shadow.camera.bottom = -22
    sun.shadow.bias = -0.0003
    sun.shadow.normalBias = 0.02  // reduces shadow acne on terrain
    this.scene.add(sun)
    this.scene.add(sun.target)

    // Fill light: cool blue-purple from opposite side (space side)
    // Prevents pure-black faces without competing with sun
    const fill = new THREE.DirectionalLight(0x8899FF, 0.25)
    fill.position.set(-12, 8, -5)
    this.scene.add(fill)

    // Rim light: subtle warm from behind-left, picks out silhouettes
    const rim = new THREE.DirectionalLight(0xFF9966, 0.15)
    rim.position.set(-8, 5, 12)
    this.scene.add(rim)
  }
}
