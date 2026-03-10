import * as THREE from 'three'
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
    this.scene.fog = new THREE.Fog(COLORS.fog, 12, 35)

    // Core systems
    this.ticker = new Ticker()
    this.input = new Input()
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

    // 3. Show enter button
    this.intro.showEnterButton()
    this.intro.onEnter = () => this._start()
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
      this.camera.update(delta)
      this.renderer.render()
    })
    this.ticker.start()
  }

  _setupLighting() {
    // Ambient light: warm Mars fill
    const ambient = new THREE.AmbientLight(0xffccaa, 0.6)
    this.scene.add(ambient)

    // Hemisphere light: peachy sky above, warm ground below
    const hemisphere = new THREE.HemisphereLight(0xD4956B, 0xC4835A, 0.5)
    this.scene.add(hemisphere)

    // Directional light: bright warm sun
    const sun = new THREE.DirectionalLight(0xffeedd, 1.3)
    sun.position.set(15, 25, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 80
    sun.shadow.camera.left = -20
    sun.shadow.camera.right = 20
    sun.shadow.camera.top = 20
    sun.shadow.camera.bottom = -20
    sun.shadow.bias = -0.0005
    this.scene.add(sun)
    this.scene.add(sun.target)
  }
}
