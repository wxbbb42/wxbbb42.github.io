import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export default class Resources {
  constructor() {
    this.items = {}
    this.loadingManager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)

    this.onProgressCallback = null
    this.totalAssets = 0
    this.loadedAssets = 0

    this.loadingManager.onProgress = (url, loaded, total) => {
      const progress = loaded / total
      if (this.onProgressCallback) this.onProgressCallback(progress)
    }
  }

  onProgress(cb) { this.onProgressCallback = cb }

  async loadAll() {
    const assets = [
      // Space kit — structures
      { name: 'hangarLargeA',      type: 'gltf', path: './models/space/hangar_largeA.glb' },
      { name: 'hangarRoundGlass',  type: 'gltf', path: './models/space/hangar_roundGlass.glb' },
      { name: 'hangarSmallA',      type: 'gltf', path: './models/space/hangar_smallA.glb' },
      { name: 'structureDetailed', type: 'gltf', path: './models/space/structure_detailed.glb' },
      // Rocket parts
      { name: 'rocketBaseA',  type: 'gltf', path: './models/space/rocket_baseA.glb' },
      { name: 'rocketFinsA',  type: 'gltf', path: './models/space/rocket_finsA.glb' },
      { name: 'rocketFuelA',  type: 'gltf', path: './models/space/rocket_fuelA.glb' },
      { name: 'rocketSidesA', type: 'gltf', path: './models/space/rocket_sidesA.glb' },
      { name: 'rocketTopA',   type: 'gltf', path: './models/space/rocket_topA.glb' },
      // Rocks & terrain
      { name: 'rockLargeA',         type: 'gltf', path: './models/space/rock_largeA.glb' },
      { name: 'rockLargeB',         type: 'gltf', path: './models/space/rock_largeB.glb' },
      { name: 'rocksSmallA',        type: 'gltf', path: './models/space/rocks_smallA.glb' },
      { name: 'rocksSmallB',        type: 'gltf', path: './models/space/rocks_smallB.glb' },
      { name: 'rockCrystals',       type: 'gltf', path: './models/space/rock_crystals.glb' },
      { name: 'rockCrystalsLargeA', type: 'gltf', path: './models/space/rock_crystalsLargeA.glb' },
      { name: 'crater',             type: 'gltf', path: './models/space/crater.glb' },
      { name: 'craterLarge',        type: 'gltf', path: './models/space/craterLarge.glb' },
      { name: 'meteorHalf',         type: 'gltf', path: './models/space/meteor_half.glb' },
      // Props & machines
      { name: 'satelliteDishLarge', type: 'gltf', path: './models/space/satelliteDish_large.glb' },
      { name: 'machineGenerator',   type: 'gltf', path: './models/space/machine_generator.glb' },
      { name: 'machineWireless',    type: 'gltf', path: './models/space/machine_wireless.glb' },
      { name: 'barrel',             type: 'gltf', path: './models/space/barrel.glb' },
      { name: 'barrels',            type: 'gltf', path: './models/space/barrels.glb' },
      { name: 'rover',              type: 'gltf', path: './models/space/rover.glb' },
      { name: 'turretSingle',       type: 'gltf', path: './models/space/turret_single.glb' },
      { name: 'rail',               type: 'gltf', path: './models/space/rail.glb' },
      { name: 'bones',              type: 'gltf', path: './models/space/bones.glb' },
      // Interior props
      { name: 'deskComputer',  type: 'gltf', path: './models/space/desk_computer.glb' },
      { name: 'deskChairArms', type: 'gltf', path: './models/space/desk_chairArms.glb' },
      // Characters
      { name: 'astronaut',       type: 'gltf', path: './models/space/astronautA.glb' },
      { name: 'astronautPlayer', type: 'gltf', path: './models/space/astronautB.glb' },
      { name: 'player',          type: 'gltf', path: './models/characters/player.glb' },
      { name: 'agentClaw',  type: 'gltf', path: './models/characters/agent_claw.glb' },
      { name: 'agentCoin',  type: 'gltf', path: './models/characters/agent_coin.glb' },
      { name: 'agentNeo',   type: 'gltf', path: './models/characters/agent_neo.glb' },
    ]

    this.totalAssets = assets.length
    this.loadedAssets = 0

    const promises = assets.map((asset) => {
      return new Promise((resolve) => {
        if (asset.type === 'gltf') {
          // Create a fresh loader per asset to avoid internal cache conflicts
          const loader = new GLTFLoader()
          loader.load(
            asset.path,
            (gltf) => {
              this.items[asset.name] = gltf
              this.loadedAssets++
              this._reportProgress()
              resolve()
            },
            undefined,
            (err) => {
              console.warn(`Failed to load ${asset.path}:`, err)
              this.loadedAssets++
              this._reportProgress()
              resolve()
            }
          )
        } else if (asset.type === 'texture') {
          this.textureLoader.load(
            asset.path,
            (texture) => {
              this.items[asset.name] = texture
              this.loadedAssets++
              this._reportProgress()
              resolve()
            },
            undefined,
            (err) => {
              console.warn(`Failed to load ${asset.path}:`, err)
              this.loadedAssets++
              this._reportProgress()
              resolve()
            }
          )
        }
      })
    })

    await Promise.all(promises)
  }

  _reportProgress() {
    if (this.onProgressCallback) {
      this.onProgressCallback(this.loadedAssets / this.totalAssets)
    }
  }
}
